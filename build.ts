import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import * as esbuild from 'esbuild'
import { generatePwaHtml } from './src/pwa/meta-tags'
import type { WebmuxConfig } from './src/types'
import { readStdin, sleep, spawnProcess } from './src/util/node-compat'

// Walk up from module location to find project root (where styles/ lives)
function findProjectRoot(): string {
	let dir = import.meta.dirname
	for (let i = 0; i < 5; i++) {
		if (existsSync(resolve(dir, 'styles/base.css'))) return dir
		dir = dirname(dir)
	}
	return import.meta.dirname
}

const PROJECT_ROOT = findProjectRoot()

/** Bundle the overlay JS + CSS into strings */
export async function bundleOverlay(config: WebmuxConfig): Promise<{ js: string; css: string }> {
	// Read CSS
	const cssPath = resolve(PROJECT_ROOT, 'styles/base.css')
	const css = readFileSync(cssPath, 'utf-8')

	// Create a temp entry that imports init and calls it with embedded config
	const configJson = JSON.stringify(config)
	const entryCode = `
import { init, createHookRegistry } from './src/index.ts'
const hooks = createHookRegistry()
const config = ${configJson}
;(function() { init(config, hooks) })()
`

	// Write temp entry
	const tmpEntry = resolve(PROJECT_ROOT, '.tmp-entry.ts')
	writeFileSync(tmpEntry, entryCode)

	try {
		const result = await esbuild.build({
			entryPoints: [tmpEntry],
			bundle: true,
			platform: 'browser',
			minify: true,
			format: 'esm',
			write: false,
		})

		const output = result.outputFiles[0]
		if (!output) {
			throw new Error('Build produced no output')
		}
		const js = output.text

		return { js, css }
	} finally {
		// Clean up temp file
		try {
			unlinkSync(tmpEntry)
		} catch {
			// ignore
		}
	}
}

/** Fetch ttyd's base index.html by starting a temporary instance */
async function fetchTtydHtml(): Promise<string> {
	const port = 19876 + Math.floor(Math.random() * 1000)
	const proc = spawnProcess(['ttyd', '--port', String(port), '-i', '127.0.0.1', 'echo', 'noop'], {
		stdout: 'ignore',
		stderr: 'ignore',
	})

	// Wait for ttyd to start
	let html = ''
	for (let i = 0; i < 30; i++) {
		await sleep(200)
		try {
			const resp = await fetch(`http://127.0.0.1:${port}/`)
			if (resp.ok) {
				html = await resp.text()
				break
			}
		} catch {
			// not ready yet
		}
	}

	proc.kill()
	await proc.exited

	if (!html) {
		throw new Error(
			'Failed to fetch ttyd index.html — is ttyd installed and on PATH?\n' +
				'Install ttyd: macOS `brew install ttyd`; Linux use your distro package manager or build from source: https://github.com/tsl0922/ttyd#installation\n' +
				'Alternatively, pipe existing ttyd HTML via `webmux inject` (no ttyd required).',
		)
	}

	return html
}

/** Synchronous script that captures WebSocket instances for reconnect detection */
const WS_INTERCEPTOR =
	'<script>(function(){var O=WebSocket,S=window.__webmuxSockets=[];window.WebSocket=class extends O{constructor(u,p){super(u,p);S.push(this)}}})()</script>'

/** Inject webmux overlay into ttyd's HTML */
export function injectOverlay(html: string, js: string, css: string, config: WebmuxConfig): string {
	const fontLink = `<link rel="preload" href="${config.font.cdnUrl}" as="style" onload="this.rel='stylesheet'">`
	const viewport =
		'<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, viewport-fit=cover">'
	const styleTag = `<style>${css}</style>`
	const safeJs = js.replace(/<(?=\/script)/gi, '\\x3c')
	const scriptTag = `<script type="module">${safeJs}</script>`
	const pwaHtml = config.pwa.enabled ? `${generatePwaHtml(config.name, config.pwa)}\n` : ''
	const wsScript = config.reconnect.enabled ? `${WS_INTERCEPTOR}\n` : ''

	const injection = `${wsScript}${fontLink}\n${viewport}\n${pwaHtml}${styleTag}\n${scriptTag}\n`

	// Avoid String.replace() — minified JS may contain $& which .replace()
	// interprets as a special replacement pattern, corrupting the output
	const idx = html.indexOf('</head>')
	if (idx === -1) throw new Error('No </head> found in base HTML')
	return html.slice(0, idx) + injection + html.slice(idx)
}

/** Full build pipeline: bundle → fetch ttyd HTML → inject → write output */
export async function build(config: WebmuxConfig, outputPath: string): Promise<void> {
	const { js, css } = await bundleOverlay(config)
	const baseHtml = await fetchTtydHtml()
	const patched = injectOverlay(baseHtml, js, css, config)
	writeFileSync(outputPath, patched)
}

/** Build from stdin HTML (pipe mode) */
export async function injectFromStdin(config: WebmuxConfig): Promise<string> {
	const { js, css } = await bundleOverlay(config)
	const stdin = await readStdin()
	if (stdin.trim().length === 0) {
		throw new Error('webmux inject expects piped ttyd HTML on stdin')
	}
	return injectOverlay(stdin, js, css, config)
}
