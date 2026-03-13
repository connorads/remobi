import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { serve as honoServe } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws'
import { Hono } from 'hono'
import type { WSContext } from 'hono/ws'
import WebSocket from 'ws'
import { bundleOverlay, injectOverlay } from '../build'
import { serialiseThemeForTtyd } from './config'
import { manifestToJson } from './pwa/manifest'
import type { WebmuxConfig } from './types'
import { sleep, spawnProcess } from './util/node-compat'
import type { SpawnedProcess } from './util/node-compat'

const DEFAULT_PORT = 7681
const DEFAULT_COMMAND = ['tmux', 'new-session', '-A', '-s', 'main']
// Walk up from module location to find package root, then resolve icons
function findIconsDir(): string {
	let dir = import.meta.dirname
	for (let i = 0; i < 5; i++) {
		const candidate = resolve(dir, 'src/pwa/icons')
		if (existsSync(candidate)) return candidate
		dir = dirname(dir)
	}
	// Fallback for source layout (running from src/)
	return resolve(import.meta.dirname, 'pwa/icons')
}

const ICONS_DIR = findIconsDir()

interface WsData {
	backend: WebSocket | null
	buffer: (string | Uint8Array)[]
}

/** Poll until ttyd is accepting connections on the given port */
async function waitForTtyd(port: number, retries = 40, intervalMs = 200): Promise<void> {
	for (let i = 0; i < retries; i++) {
		try {
			const resp = await fetch(`http://127.0.0.1:${port}/`)
			if (resp.ok) return
		} catch {
			// not ready yet
		}
		await sleep(intervalMs)
	}
	throw new Error(
		`ttyd did not start on port ${port} — is ttyd installed and on PATH?\nInstall ttyd: macOS \`brew install ttyd\`; Linux use your distro package manager or build from source: https://github.com/tsl0922/ttyd#installation`,
	)
}

/** Pick a random internal port */
export function randomInternalPort(): number {
	return 19000 + Math.floor(Math.random() * 1000)
}

/** Build ttyd args from webmux config */
export function buildTtydArgs(
	config: WebmuxConfig,
	internalPort: number,
	command: readonly string[],
): string[] {
	return [
		'--writable',
		'-i',
		'127.0.0.1',
		'--port',
		String(internalPort),
		'-t',
		`theme=${serialiseThemeForTtyd(config)}`,
		'-t',
		`fontFamily="${config.font.family}"`,
		'-t',
		'scrollSensitivity=3',
		'-t',
		'disableLeaveAlert=true',
		...command,
	]
}

/** Read a PNG icon, returns undefined if not found */
function readIcon(filename: string): Uint8Array | undefined {
	try {
		return readFileSync(resolve(ICONS_DIR, filename))
	} catch {
		return undefined
	}
}

/** Spawn caffeinate to prevent system sleep while ttyd is running (macOS only).
 * Uses -s (system sleep on AC) and -w <pid> so the assertion drops when ttyd exits. */
function spawnCaffeinate(pid: number): SpawnedProcess | null {
	try {
		const proc = spawnProcess(['caffeinate', '-s', '-w', String(pid)], {
			stdout: 'ignore',
			stderr: 'ignore',
		})
		// Catch async spawn errors (e.g. caffeinate not found on Linux)
		proc.exited.catch(() => {
			console.warn('webmux: --no-sleep requires caffeinate (macOS only), ignoring')
		})
		console.log(`webmux: sleep prevention active (caffeinate -s -w ${pid})`)
		return proc
	} catch {
		console.warn('webmux: --no-sleep requires caffeinate (macOS only), ignoring')
		return null
	}
}

/** Start webmux serve: builds overlay in memory, manages ttyd, serves HTTP + WS */
export async function serve(
	config: WebmuxConfig,
	port: number = DEFAULT_PORT,
	command: readonly string[] = DEFAULT_COMMAND,
	noSleep = false,
): Promise<void> {
	console.log('webmux: building overlay...')
	const { js, css } = await bundleOverlay(config)

	const internalPort = randomInternalPort()
	const ttydArgs = buildTtydArgs(config, internalPort, command)

	console.log(`webmux: starting ttyd on internal port ${internalPort}...`)
	const ttydProc = spawnProcess(['ttyd', ...ttydArgs], {
		stdout: 'ignore',
		stderr: 'ignore',
	})

	const caffeinateProc = noSleep && ttydProc.pid ? spawnCaffeinate(ttydProc.pid) : null

	await waitForTtyd(internalPort)

	const baseResp = await fetch(`http://127.0.0.1:${internalPort}/`)
	const baseHtml = await baseResp.text()
	const html = injectOverlay(baseHtml, js, css, config)

	console.log('webmux: overlay ready')

	const manifestJson = config.pwa.enabled ? manifestToJson(config.name, config.pwa) : null
	const icon180 = readIcon('icon-180.png')
	const icon192 = readIcon('icon-192.png')
	const icon512 = readIcon('icon-512.png')

	// Per-connection data via WeakMap (replaces Bun's ws.data)
	const connections = new WeakMap<WebSocket, WsData>()

	const app = new Hono()
	const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

	app.get(
		'/ws',
		upgradeWebSocket(() => ({
			onOpen(_event: Event, ws: WSContext<WebSocket>) {
				const raw = ws.raw
				if (!raw) return

				const data: WsData = { backend: null, buffer: [] }
				connections.set(raw, data)

				const backend = new WebSocket(`ws://127.0.0.1:${internalPort}/ws`, ['tty'])
				backend.binaryType = 'arraybuffer'
				data.backend = backend

				backend.on('open', () => {
					for (const msg of data.buffer) {
						backend.send(msg)
					}
					data.buffer = []
				})

				backend.on('message', (message: WebSocket.RawData, isBinary: boolean) => {
					if (isBinary && message instanceof ArrayBuffer) {
						ws.send(new Uint8Array(message))
					} else {
						ws.send(message.toString())
					}
				})

				backend.on('error', () => {
					ws.close()
				})

				backend.on('close', () => {
					ws.close()
				})
			},
			onMessage(event: MessageEvent, ws: WSContext<WebSocket>) {
				const raw = ws.raw
				if (!raw) return
				const data = connections.get(raw)
				if (!data) return

				const { backend, buffer } = data
				if (backend !== null && backend.readyState === WebSocket.OPEN) {
					// oxlint-disable-next-line typescript/consistent-type-assertions -- WSMessageReceive union needs narrowing for ws.send()
					backend.send(event.data as string | ArrayBuffer)
				} else {
					const msg = event.data
					// oxlint-disable-next-line typescript/consistent-type-assertions -- WSMessageReceive union needs narrowing for Uint8Array ctor
					buffer.push(typeof msg === 'string' ? msg : new Uint8Array(msg as ArrayBuffer))
				}
			},
			onClose(_event: CloseEvent, ws: WSContext<WebSocket>) {
				const raw = ws.raw
				if (!raw) return
				connections.get(raw)?.backend?.close()
				connections.delete(raw)
			},
		})),
	)

	app.get('/', (c) => c.html(html))

	if (manifestJson !== null) {
		app.get('/manifest.json', (c) => {
			// oxlint-disable-next-line typescript/consistent-type-assertions -- JSON.parse returns unknown, safe for manifest
			return c.json(JSON.parse(manifestJson) as Record<string, unknown>)
		})
	}

	if (icon180) {
		app.get('/apple-touch-icon.png', () => {
			return new Response(Uint8Array.from(icon180), {
				headers: { 'content-type': 'image/png' },
			})
		})
	}

	if (icon192) {
		app.get('/icon-192.png', () => {
			return new Response(Uint8Array.from(icon192), {
				headers: { 'content-type': 'image/png' },
			})
		})
	}

	if (icon512) {
		app.get('/icon-512.png', () => {
			return new Response(Uint8Array.from(icon512), {
				headers: { 'content-type': 'image/png' },
			})
		})
	}

	// Proxy remaining requests to ttyd (e.g. /token)
	app.all('/*', async (c) => {
		const url = new URL(c.req.url)
		const backendUrl = `http://127.0.0.1:${internalPort}${url.pathname}${url.search}`
		const resp = await fetch(backendUrl, {
			method: c.req.method,
			headers: c.req.raw.headers,
			body: c.req.raw.body,
		})
		return new Response(resp.body, {
			status: resp.status,
			headers: resp.headers,
		})
	})

	const server = honoServe({ fetch: app.fetch, port })
	injectWebSocket(server)

	console.log(`webmux: serving on http://localhost:${port}`)

	// Clean shutdown on SIGINT / SIGTERM
	const cleanup = () => {
		console.log('\nwebmux: shutting down...')
		server.close()
		ttydProc.kill()
		caffeinateProc?.kill()
		process.exit(0)
	}

	process.on('SIGINT', cleanup)
	process.on('SIGTERM', cleanup)

	// Keep process alive until ttyd exits
	await ttydProc.exited
	server.close()
}
