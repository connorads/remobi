import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { escapeAttr, generatePwaHtml } from './src/pwa/meta-tags'
import type { RemobiConfig } from './src/types'

function findProjectRoot(): string {
	let dir = import.meta.dirname
	for (let i = 0; i < 5; i++) {
		if (
			existsSync(resolve(dir, 'styles/base.css')) ||
			existsSync(resolve(dir, '../styles/base.css'))
		) {
			return dir
		}
		dir = dirname(dir)
	}
	return import.meta.dirname
}

const PROJECT_ROOT = findProjectRoot()
const IS_SOURCE_RUNTIME = existsSync(resolve(import.meta.dirname, 'src/index.ts'))

function resolveProjectFile(...segments: readonly string[]): string {
	const direct = resolve(PROJECT_ROOT, ...segments)
	if (existsSync(direct)) {
		return direct
	}
	return resolve(PROJECT_ROOT, '..', ...segments)
}

function readPrebuiltAsset(filename: string): string | null {
	if (IS_SOURCE_RUNTIME) {
		return null
	}

	const direct = resolve(import.meta.dirname, filename)
	if (existsSync(direct)) {
		return readFileSync(direct, 'utf-8')
	}

	const dist = resolve(PROJECT_ROOT, 'dist', filename)
	if (existsSync(dist)) {
		return readFileSync(dist, 'utf-8')
	}

	return null
}

/** Bundle the remobi client JS + CSS into strings */
export async function bundleClientAssets(
	config: RemobiConfig,
	version: string,
): Promise<{ js: string; css: string }> {
	const prebuiltJs = readPrebuiltAsset('client.iife.js')
	const prebuiltCss = readPrebuiltAsset('client.css')
	if (prebuiltJs !== null && prebuiltCss !== null) {
		const js = `globalThis.__remobiVersion=${JSON.stringify(version)};globalThis.__remobiConfig=${JSON.stringify(config)};${prebuiltJs}`
		return { js, css: prebuiltCss }
	}

	const esbuild = await import('esbuild')
	const entryPoint = resolveProjectFile('src/client-entry.ts')

	const result = await esbuild.build({
		entryPoints: [entryPoint],
		bundle: true,
		platform: 'browser',
		minify: true,
		format: 'iife',
		outdir: 'out',
		write: false,
	})

	const jsOutput = result.outputFiles.find((file) => file.path.endsWith('.js'))
	const cssOutput = result.outputFiles.find((file) => file.path.endsWith('.css'))

	if (!jsOutput || !cssOutput) {
		throw new Error('remobi client build produced incomplete output')
	}

	const js = `globalThis.__remobiVersion=${JSON.stringify(version)};globalThis.__remobiConfig=${JSON.stringify(config)};${jsOutput.text}`
	return { js, css: cssOutput.text }
}

export function renderClientHtml(
	js: string,
	css: string,
	config: RemobiConfig,
	scriptNonce: string,
): string {
	const viewport =
		'<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, viewport-fit=cover">'
	const pwaHtml = config.pwa.enabled ? `${generatePwaHtml(config.name, config.pwa)}\n` : ''
	const fontLink = `<link rel="stylesheet" href="${escapeAttr(config.font.cdnUrl)}">`
	const safeJs = js.replace(/<(?=\/script)/gi, '\\x3c')

	return [
		'<!DOCTYPE html>',
		'<html lang="en">',
		'<head>',
		'<meta charset="UTF-8">',
		'<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">',
		viewport,
		`<title>${escapeAttr(config.name)}</title>`,
		fontLink,
		pwaHtml.trim(),
		`<style>${css}</style>`,
		'</head>',
		'<body>',
		'<div id="terminal-container"><div id="terminal"></div></div>',
		`<script nonce="${escapeAttr(scriptNonce)}">${safeJs}</script>`,
		'</body>',
		'</html>',
	]
		.filter((line) => line.length > 0)
		.join('\n')
}

export async function writeClientBundle(outputPath: string): Promise<void> {
	const esbuild = await import('esbuild')
	const entryPoint = resolveProjectFile('src/client-entry.ts')
	const result = await esbuild.build({
		entryPoints: [entryPoint],
		bundle: true,
		platform: 'browser',
		minify: true,
		format: 'iife',
		outdir: 'out',
		write: false,
	})

	const jsOutput = result.outputFiles.find((file) => file.path.endsWith('.js'))
	const cssOutput = result.outputFiles.find((file) => file.path.endsWith('.css'))
	if (!jsOutput || !cssOutput) {
		throw new Error('remobi client build produced incomplete output')
	}

	writeFileSync(resolve(outputPath, 'client.iife.js'), jsOutput.text)
	writeFileSync(resolve(outputPath, 'client.css'), cssOutput.text)
}
