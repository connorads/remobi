import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { serve as honoServe } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws'
import { Hono } from 'hono'
import type { WSContext } from 'hono/ws'
import type WebSocket from 'ws'
import { bundleClientAssets, renderClientHtml } from '../build'
import { bareDocumentRoute, documentRoute, joinBasePath } from './base-path'
import { manifestToJson } from './pwa/manifest'
import type { SessionClient, SharedTerminalSession } from './session'
import {
	MAX_CLIENT_MESSAGE_BYTES,
	parseClientMessage,
	serialiseServerMessage,
} from './session-protocol'
import type { RemobiConfig } from './types'
import { spawnProcess } from './util/node-compat'
import type { SpawnedProcess } from './util/node-compat'

const DEFAULT_PORT = 7681
const DEFAULT_HOST = '127.0.0.1'
const DEFAULT_COMMAND = ['tmux', 'new-session', '-A', '-s', 'main']

function isValidPort(value: string): boolean {
	return /^[0-9]+$/.test(value) && Number(value) > 0 && Number(value) <= 65_535
}

function formatAuthority(host: string, port: number): string {
	if (host.includes(':') && !host.startsWith('[')) {
		return `[${host}]:${port}`
	}
	return `${host}:${port}`
}

export function parseHostHeader(hostHeader: string | undefined): string | null {
	if (hostHeader === undefined) {
		return null
	}

	const trimmed = hostHeader.trim()
	if (
		trimmed.length === 0 ||
		/[/?#@\s]/.test(trimmed) ||
		trimmed.startsWith(':') ||
		trimmed.endsWith(':')
	) {
		return null
	}

	if (trimmed.startsWith('[')) {
		const closingBracket = trimmed.indexOf(']')
		if (closingBracket <= 1) {
			return null
		}

		const suffix = trimmed.slice(closingBracket + 1)
		if (suffix.length === 0) {
			return trimmed
		}

		if (!suffix.startsWith(':') || !isValidPort(suffix.slice(1))) {
			return null
		}

		return trimmed
	}

	const colonCount = [...trimmed].filter((character) => character === ':').length
	if (colonCount > 1) {
		return null
	}

	if (colonCount === 0) {
		return trimmed
	}

	const lastColon = trimmed.lastIndexOf(':')
	const hostname = trimmed.slice(0, lastColon)
	const port = trimmed.slice(lastColon + 1)
	if (hostname.length === 0 || !isValidPort(port)) {
		return null
	}

	return trimmed
}

function stripPort(authority: string): string {
	if (authority.startsWith('[')) {
		const closingBracket = authority.indexOf(']')
		return closingBracket === -1 ? authority : authority.slice(0, closingBracket + 1)
	}

	const lastColon = authority.lastIndexOf(':')
	return lastColon === -1 ? authority : authority.slice(0, lastColon)
}

export function resolveRequestAuthority(
	hostHeader: string | undefined,
	fallbackHost: string,
	fallbackPort: number,
): string {
	return parseHostHeader(hostHeader) ?? formatAuthority(fallbackHost, fallbackPort)
}

function waitForServerListening(
	server: ReturnType<typeof honoServe>,
	port: number,
	host: string,
): Promise<void> {
	if (server.listening) {
		return Promise.resolve()
	}

	return new Promise<void>((resolveListening, reject) => {
		const onListening = () => {
			cleanup()
			resolveListening()
		}
		const onError = (error: Error) => {
			cleanup()
			if ('code' in error && error.code === 'EADDRINUSE') {
				reject(new Error(`remobi serve failed: port ${port} is already in use on ${host}`))
				return
			}
			reject(error)
		}
		const cleanup = () => {
			server.off('listening', onListening)
			server.off('error', onError)
		}

		server.once('listening', onListening)
		server.once('error', onError)
	})
}

function findIconsDir(): string {
	let dir = import.meta.dirname
	for (let i = 0; i < 5; i++) {
		const candidate = resolve(dir, 'src/pwa/icons')
		if (existsSync(candidate)) return candidate
		dir = dirname(dir)
	}
	return resolve(import.meta.dirname, 'pwa/icons')
}

const ICONS_DIR = findIconsDir()

/** Build security headers with CSP connect-src scoped to the browser-visible authority.
 * Safari doesn't match ws:/wss: against CSP 'self' (WebKit bug 201591), so we
 * emit explicit ws:// and wss:// origins for the request host instead of bare ws:/wss:. */
export function buildSecurityHeaders(
	hostHeader: string | undefined,
	fallbackHost: string,
	fallbackPort: number,
	scriptNonce: string,
) {
	const authority = resolveRequestAuthority(hostHeader, fallbackHost, fallbackPort)
	return {
		'content-security-policy': `default-src 'self'; script-src 'self' 'nonce-${scriptNonce}'; style-src 'self' 'unsafe-inline' https:; font-src 'self' https:; img-src 'self' data:; connect-src 'self' ws://${authority} wss://${authority}; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'`,
		'x-frame-options': 'DENY',
		'x-content-type-options': 'nosniff',
		'referrer-policy': 'no-referrer',
		'cross-origin-resource-policy': 'same-origin',
		'permissions-policy': 'camera=(), microphone=(), geolocation=()',
	} as const
}

export function isLoopbackHost(host: string): boolean {
	return host === '127.0.0.1' || host === '::1' || host === 'localhost'
}

export function isAllowedOrigin(
	originHeader: string | undefined,
	hostHeader: string | undefined,
): boolean {
	if (originHeader === undefined) {
		const authority = parseHostHeader(hostHeader)
		const hostname = authority ? stripPort(authority).replace(/^\[|\]$/g, '') : ''
		return isLoopbackHost(hostname)
	}
	const authority = parseHostHeader(hostHeader)
	if (authority === null) {
		return false
	}

	try {
		return new URL(originHeader).host === authority
	} catch {
		return false
	}
}

export function withSecurityHeaders(
	response: Response,
	securityHeaders: Record<string, string>,
): Response {
	const headers = new Headers(response.headers)

	for (const [name, value] of Object.entries(securityHeaders)) {
		headers.set(name, value)
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	})
}

function closeForProtocolViolation(
	raw: WebSocket,
	client: SessionClient | undefined,
	message: string,
): void {
	if (raw.readyState === 1) {
		try {
			raw.send(serialiseServerMessage({ type: 'error', message }), () => {
				if (raw.readyState < 2) {
					raw.close(1008, 'protocol violation')
				}
			})
			return
		} catch {
			// Fall through to a direct close if the socket is already unstable.
		}
	}

	client?.send({ type: 'error', message })
	raw.close(1008, 'protocol violation')
}

/** Read a PNG icon, returns undefined if not found */
function readIcon(filename: string): Uint8Array | undefined {
	try {
		return readFileSync(resolve(ICONS_DIR, filename))
	} catch {
		return undefined
	}
}

/** Spawn caffeinate to prevent system sleep while remobi is running (macOS only).
 * Uses -s (system sleep on AC) and -w <pid> so the assertion drops when the PTY exits. */
function spawnCaffeinate(pid: number): SpawnedProcess | null {
	try {
		const proc = spawnProcess(['caffeinate', '-s', '-w', String(pid)], {
			stdout: 'ignore',
			stderr: 'ignore',
		})
		proc.exited.catch(() => {
			console.warn('remobi: --no-sleep requires caffeinate (macOS only), ignoring')
		})
		console.log(`remobi: sleep prevention active (caffeinate -s -w ${pid})`)
		return proc
	} catch {
		console.warn('remobi: --no-sleep requires caffeinate (macOS only), ignoring')
		return null
	}
}

function createScriptNonce(): string {
	return randomBytes(16).toString('hex')
}

function routeVariants(basePath: string, path: string): readonly string[] {
	if (basePath === '/') {
		return [path]
	}

	return Array.from(new Set([path, joinBasePath(basePath, path)]))
}

/** Log the executable without leaking full argv, which may contain secrets or tokens. */
export function describeCommandForLogs(command: readonly string[]): string {
	const [file, ...args] = command
	if (!file) {
		return 'command'
	}
	if (args.length === 0) {
		return file
	}
	return `${file} (${args.length} arg${args.length === 1 ? '' : 's'})`
}

/** Start remobi serve: build client assets, spawn the PTY, and serve HTTP + WS */
export async function serve(
	config: RemobiConfig,
	port: number = DEFAULT_PORT,
	command: readonly string[] = DEFAULT_COMMAND,
	noSleep = false,
	host: string = DEFAULT_HOST,
	version = 'unknown',
	basePath = '/',
): Promise<void> {
	const { SharedTerminalSession } = await import('./session')

	console.log('remobi: building client...')
	const scriptNonce = createScriptNonce()
	const { js, css } = await bundleClientAssets(config, version, basePath)
	const html = renderClientHtml(js, css, config, scriptNonce, basePath)
	console.log('remobi: client ready')
	let session: SharedTerminalSession | null = null
	let caffeinateProc: SpawnedProcess | null = null

	const manifestJson = config.pwa.enabled ? manifestToJson(config.name, config.pwa, basePath) : null
	const icon180 = readIcon('icon-180.png')
	const icon192 = readIcon('icon-192.png')
	const icon512 = readIcon('icon-512.png')

	const connections = new WeakMap<WebSocket, SessionClient>()

	function securityHeadersForRequest(hostHeader: string | undefined): Record<string, string> {
		return buildSecurityHeaders(hostHeader, host, port, scriptNonce)
	}

	const app = new Hono()
	const { injectWebSocket, upgradeWebSocket, wss } = createNodeWebSocket({ app })
	wss.options.maxPayload = MAX_CLIENT_MESSAGE_BYTES

	const websocketRoutes = routeVariants(basePath, '/ws')
	for (const route of websocketRoutes) {
		app.use(route, async (c, next) => {
			const securityHeaders = securityHeadersForRequest(c.req.header('host'))
			if (!isAllowedOrigin(c.req.header('origin'), c.req.header('host'))) {
				return withSecurityHeaders(c.text('Forbidden', 403), securityHeaders)
			}
			await next()
		})

		app.get(
			route,
			upgradeWebSocket(() => ({
				onOpen(_event: Event, ws: WSContext<WebSocket>) {
					const raw = ws.raw
					if (!raw) return
					if (session === null) {
						raw.close()
						return
					}

					const client: SessionClient = {
						send(message) {
							if (raw.readyState !== 1) {
								return
							}

							try {
								raw.send(serialiseServerMessage(message))
							} catch {
								// The browser may disconnect while PTY output is still being fanned out.
							}
						},
						close() {
							if (raw.readyState >= 2) {
								return
							}

							raw.close()
						},
					}

					connections.set(raw, client)
					void session.addClient(client).catch((error: unknown) => {
						client.send({
							type: 'error',
							message:
								error instanceof Error ? error.message : 'failed to attach to terminal session',
						})
						raw.close()
					})
				},
				onMessage(event: MessageEvent, ws: WSContext<WebSocket>) {
					const raw = ws.raw
					if (!raw) return
					const client = connections.get(raw)

					if (typeof event.data !== 'string') {
						closeForProtocolViolation(raw, client, 'text websocket messages only')
						return
					}

					if (!client) return

					const message = parseClientMessage(event.data)
					if (!message) {
						closeForProtocolViolation(raw, client, 'invalid client message')
						return
					}

					if (session === null) {
						raw.close()
						return
					}

					session.handleClientMessage(client, message)
				},
				onClose(_event: CloseEvent, ws: WSContext<WebSocket>) {
					const raw = ws.raw
					if (!raw) return
					const client = connections.get(raw)
					if (!client) return
					session?.removeClient(client)
					connections.delete(raw)
				},
			})),
		)
	}

	app.get('/', (c) =>
		withSecurityHeaders(c.html(html), securityHeadersForRequest(c.req.header('host'))),
	)

	const canonicalDocumentRoute = documentRoute(basePath)
	if (canonicalDocumentRoute !== '/') {
		app.get(canonicalDocumentRoute, (c) =>
			withSecurityHeaders(c.html(html), securityHeadersForRequest(c.req.header('host'))),
		)

		const bareRoute = bareDocumentRoute(basePath)
		if (bareRoute) {
			app.get(bareRoute, (c) => {
				const securityHeaders = securityHeadersForRequest(c.req.header('host'))
				return withSecurityHeaders(c.redirect(canonicalDocumentRoute, 308), securityHeaders)
			})
		}
	}

	if (manifestJson !== null) {
		for (const route of routeVariants(basePath, '/manifest.json')) {
			app.get(route, (c) => {
				/* oxlint-disable typescript/consistent-type-assertions -- JSON.parse returns unknown, safe for manifest */
				return withSecurityHeaders(
					c.json(JSON.parse(manifestJson) as Record<string, unknown>),
					securityHeadersForRequest(c.req.header('host')),
				)
				/* oxlint-enable typescript/consistent-type-assertions */
			})
		}
	}

	if (icon180) {
		for (const route of routeVariants(basePath, '/apple-touch-icon.png')) {
			app.get(route, (c) =>
				withSecurityHeaders(
					new Response(Uint8Array.from(icon180), {
						headers: { 'content-type': 'image/png' },
					}),
					securityHeadersForRequest(c.req.header('host')),
				),
			)
		}
	}

	if (icon192) {
		for (const route of routeVariants(basePath, '/icon-192.png')) {
			app.get(route, (c) =>
				withSecurityHeaders(
					new Response(Uint8Array.from(icon192), {
						headers: { 'content-type': 'image/png' },
					}),
					securityHeadersForRequest(c.req.header('host')),
				),
			)
		}
	}

	if (icon512) {
		for (const route of routeVariants(basePath, '/icon-512.png')) {
			app.get(route, (c) =>
				withSecurityHeaders(
					new Response(Uint8Array.from(icon512), {
						headers: { 'content-type': 'image/png' },
					}),
					securityHeadersForRequest(c.req.header('host')),
				),
			)
		}
	}

	const server = honoServe({ fetch: app.fetch, port, hostname: host })
	injectWebSocket(server)
	await waitForServerListening(server, port, host)

	try {
		console.log(`remobi: starting command ${describeCommandForLogs(command)}...`)
		session = new SharedTerminalSession(command)
		caffeinateProc = noSleep ? spawnCaffeinate(session.pid) : null
	} catch (error) {
		server.close()
		throw error
	}

	console.log(`remobi: serving on http://${isLoopbackHost(host) ? 'localhost' : host}:${port}`)
	if (!isLoopbackHost(host)) {
		console.warn(`remobi: warning: --host ${host} exposes terminal control beyond localhost`)
	}

	let shuttingDown = false
	const cleanup = async (): Promise<void> => {
		if (shuttingDown) return
		shuttingDown = true
		console.log('\nremobi: shutting down...')
		server.close()
		caffeinateProc?.kill()
		await session?.dispose()
		process.exit(0)
	}

	process.on('SIGINT', () => {
		void cleanup()
	})
	process.on('SIGTERM', () => {
		void cleanup()
	})

	await session.onExit
	server.close()
	caffeinateProc?.kill()
}
