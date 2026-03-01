import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bundleOverlay, injectOverlay } from '../build'
import { serialiseThemeForTtyd } from './config'
import { manifestToJson } from './pwa/manifest'
import type { WebmuxConfig } from './types'

const DEFAULT_PORT = 7681
const DEFAULT_COMMAND = ['tmux', 'new-session', '-A', '-s', 'main']
const ICONS_DIR = resolve(import.meta.dir, 'pwa/icons')

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
		await Bun.sleep(intervalMs)
	}
	throw new Error(`ttyd did not start on port ${port}`)
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
function spawnCaffeinate(pid: number): ReturnType<typeof Bun.spawn> | null {
	try {
		const proc = Bun.spawn(['caffeinate', '-s', '-w', String(pid)], {
			stdout: 'ignore',
			stderr: 'ignore',
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
	const ttydProc = Bun.spawn(['ttyd', ...ttydArgs], {
		stdout: 'ignore',
		stderr: 'ignore',
	})

	const caffeinateProc = noSleep ? spawnCaffeinate(ttydProc.pid) : null

	await waitForTtyd(internalPort)

	const baseResp = await fetch(`http://127.0.0.1:${internalPort}/`)
	const baseHtml = await baseResp.text()
	const html = injectOverlay(baseHtml, js, css, config)

	console.log('webmux: overlay ready')

	const manifestJson = config.pwa.enabled ? manifestToJson(config.name, config.pwa) : null
	const icon180 = readIcon('icon-180.png')
	const icon192 = readIcon('icon-192.png')
	const icon512 = readIcon('icon-512.png')

	const server = Bun.serve<WsData>({
		port,
		fetch(req, srv) {
			const url = new URL(req.url)

			if (url.pathname === '/ws') {
				const upgraded = srv.upgrade(req, { data: { backend: null, buffer: [] } })
				if (upgraded) return undefined
				return new Response('WebSocket upgrade failed', { status: 426 })
			}

			if (url.pathname === '/') {
				return new Response(html, {
					headers: { 'content-type': 'text/html; charset=utf-8' },
				})
			}

			if (url.pathname === '/manifest.json' && manifestJson !== null) {
				return new Response(manifestJson, {
					headers: { 'content-type': 'application/manifest+json' },
				})
			}

			if (url.pathname === '/apple-touch-icon.png' && icon180) {
				// oxlint-disable-next-line typescript/consistent-type-assertions -- Bun typing gap: Uint8Array not assignable to BodyInit
				return new Response(icon180 as unknown as BodyInit, {
					headers: { 'content-type': 'image/png' },
				})
			}

			if (url.pathname === '/icon-192.png' && icon192) {
				// oxlint-disable-next-line typescript/consistent-type-assertions -- Bun typing gap: Uint8Array not assignable to BodyInit
				return new Response(icon192 as unknown as BodyInit, {
					headers: { 'content-type': 'image/png' },
				})
			}

			if (url.pathname === '/icon-512.png' && icon512) {
				// oxlint-disable-next-line typescript/consistent-type-assertions -- Bun typing gap: Uint8Array not assignable to BodyInit
				return new Response(icon512 as unknown as BodyInit, {
					headers: { 'content-type': 'image/png' },
				})
			}

			// Proxy remaining requests to ttyd (e.g. /token)
			const backendUrl = `http://127.0.0.1:${internalPort}${url.pathname}${url.search}`
			return fetch(backendUrl, {
				method: req.method,
				headers: req.headers,
				body: req.body,
			})
		},
		websocket: {
			open(ws) {
				const backend = new WebSocket(`ws://127.0.0.1:${internalPort}/ws`, ['tty'])
				backend.binaryType = 'arraybuffer'
				ws.data.backend = backend

				backend.onopen = () => {
					for (const msg of ws.data.buffer) {
						backend.send(msg)
					}
					ws.data.buffer = []
				}

				backend.onmessage = (event) => {
					if (event.data instanceof ArrayBuffer) {
						ws.sendBinary(new Uint8Array(event.data))
					} else {
						// oxlint-disable-next-line typescript/consistent-type-assertions -- WebSocket onmessage doesn't narrow else branch
						ws.send(event.data as string)
					}
				}

				backend.onerror = () => {
					ws.close()
				}

				backend.onclose = () => {
					ws.close()
				}
			},
			message(ws, data) {
				const { backend, buffer } = ws.data
				if (backend !== null && backend.readyState === WebSocket.OPEN) {
					backend.send(data)
				} else {
					buffer.push(
						// oxlint-disable-next-line typescript/consistent-type-assertions -- Bun Buffer → ArrayBuffer for Uint8Array ctor
						typeof data === 'string' ? data : new Uint8Array(data as unknown as ArrayBuffer),
					)
				}
			},
			close(ws) {
				ws.data.backend?.close()
			},
		},
	})

	console.log(`webmux: serving on http://localhost:${server.port}`)

	// Clean shutdown on SIGINT / SIGTERM
	const cleanup = () => {
		console.log('\nwebmux: shutting down...')
		server.stop()
		ttydProc.kill()
		caffeinateProc?.kill()
		process.exit(0)
	}

	process.on('SIGINT', cleanup)
	process.on('SIGTERM', cleanup)

	// Keep process alive until ttyd exits
	await ttydProc.exited
	server.stop()
}
