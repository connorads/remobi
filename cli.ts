#!/usr/bin/env node
import { existsSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { build, injectFromStdin } from './build'
import { parseCliArgs } from './src/cli/args'
import { defaultConfig, defineConfig, mergeConfig } from './src/config'
import {
	ConfigValidationError,
	assertValidConfigOverrides,
	assertValidResolvedConfig,
} from './src/config-validate'
import { serve } from './src/serve'
import type { WebmuxConfig, WebmuxConfigOverrides } from './src/types'
import { readStdin } from './src/util/node-compat'

const require = createRequire(import.meta.url)
const pkg = require('./package.json') as { version: string }

const VERSION: string = pkg.version

function usage(): void {
	console.log(`webmux v${VERSION} — mobile-friendly terminal overlay for ttyd + tmux

Usage:
  webmux serve [--config <path>] [--port <n>] [--no-sleep] [-- <command...>]
    Build overlay in memory, manage ttyd, serve with PWA support.
    Default port: 7681. Default command: tmux new-session -A -s main

  webmux build [--config <path>] [--output <path>] [--dry-run]
    Build patched index.html for ttyd --index flag.
    Starts temp ttyd, fetches base HTML, injects overlay.

  webmux inject [--config <path>] [--dry-run]
    Pipe mode: reads ttyd HTML from stdin, outputs patched HTML to stdout.

  webmux init
    Scaffold a webmux.config.ts with defaults.

  webmux --version
    Print version.

  webmux --help
    Show this help.

Flags:
  -c, --config <path>  Use a specific config file (build/inject/serve)
  -o, --output <path>  Build output path (build only)
  -p, --port <n>       Port to serve on (serve only, default 7681)
  -n, --dry-run        Validate + print plan only (build/inject)
      --no-sleep       Prevent macOS sleep while serving (caffeinate -s, serve only)

Examples:
  webmux serve
  webmux serve --no-sleep
  webmux serve --port 8080 -- tmux new -As dev
  webmux build -c ./webmux.config.ts -o ./dist/index.html
  webmux build --dry-run
  curl -s http://127.0.0.1:7681/ | webmux inject --dry-run`)
}

interface LoadedConfig {
	readonly config: WebmuxConfig
	readonly source: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function extractDefaultExport(value: unknown): unknown | undefined {
	if (!isRecord(value)) return undefined
	if (!('default' in value)) return undefined
	return value.default
}

function ensureInjectInputMode(context: string): void {
	if (process.stdin.isTTY) {
		throw new Error(`${context} expects piped ttyd HTML on stdin`)
	}
}

function throwConfigValidationError(source: string, error: ConfigValidationError): never {
	throw new Error(`Config validation failed for ${source}\n${error.message}`)
}

/** Convert a config path to its .local sibling, e.g. webmux.config.ts → webmux.config.local.ts */
function toLocalPath(configPath: string): string {
	const dotIdx = configPath.lastIndexOf('.')
	if (dotIdx === -1) {
		return `${configPath}.local`
	}
	return `${configPath.slice(0, dotIdx)}.local${configPath.slice(dotIdx)}`
}

/** Try to load a .local config override file. Returns undefined if the file does not exist. */
async function loadLocalOverrides(localPath: string): Promise<WebmuxConfigOverrides | undefined> {
	if (!existsSync(localPath)) {
		return undefined
	}

	const mod = await import(localPath)
	const defaultExport = extractDefaultExport(mod)
	if (defaultExport === undefined) {
		throw new Error(`Local config file has no default export: ${localPath}`)
	}

	assertValidOverridesOrThrow(defaultExport, localPath)
	return defaultExport
}

function assertValidOverridesOrThrow(
	value: unknown,
	source: string,
): asserts value is WebmuxConfigOverrides {
	try {
		assertValidConfigOverrides(value)
	} catch (error) {
		if (error instanceof ConfigValidationError) {
			throwConfigValidationError(source, error)
		}
		throw error
	}
}

function assertValidResolvedOrThrow(value: unknown, source: string): asserts value is WebmuxConfig {
	try {
		assertValidResolvedConfig(value)
	} catch (error) {
		if (error instanceof ConfigValidationError) {
			throwConfigValidationError(source, error)
		}
		throw error
	}
}

async function loadConfig(configPath: string | undefined): Promise<LoadedConfig> {
	let resolved = configPath
	if (!resolved) {
		// Search order: cwd → XDG config dir (~/.config/webmux/)
		const names = ['webmux.config.ts', 'webmux.config.js']
		const searchDirs = [
			process.cwd(),
			join(process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config'), 'webmux'),
		]
		for (const dir of searchDirs) {
			for (const name of names) {
				const full = join(dir, name)
				if (existsSync(full)) {
					resolved = full
					break
				}
			}
			if (resolved) break
		}
	}

	if (resolved) {
		const abs = resolve(process.cwd(), resolved)
		const mod = await import(abs)
		const defaultExport = extractDefaultExport(mod)
		if (defaultExport === undefined) {
			throw new Error(`Config file has no default export: ${abs}`)
		}

		assertValidOverridesOrThrow(defaultExport, abs)
		const sharedConfig = defineConfig(defaultExport)

		// Apply .local overrides on top of the shared config
		const localPath = toLocalPath(abs)
		const localOverrides = await loadLocalOverrides(localPath)
		const config =
			localOverrides !== undefined ? mergeConfig(sharedConfig, localOverrides) : sharedConfig

		const sourceLabel = localOverrides !== undefined ? `${abs} + ${localPath}` : abs
		assertValidResolvedOrThrow(config, sourceLabel)
		return { config, source: sourceLabel }
	}

	assertValidResolvedOrThrow(defaultConfig, 'built-in defaults')

	return {
		config: defaultConfig,
		source: 'built-in defaults',
	}
}

async function main(): Promise<void> {
	const parsed = parseCliArgs(process.argv.slice(2))
	if (!parsed.ok) {
		console.error(parsed.error)
		usage()
		process.exit(1)
	}

	const { command, configPath, outputPath, dryRun, port, noSleep, command_ } = parsed.value

	switch (command) {
		case 'serve': {
			const loaded = await loadConfig(configPath)
			await serve(loaded.config, port, command_.length > 0 ? command_ : undefined, noSleep)
			break
		}

		case 'build': {
			const loaded = await loadConfig(configPath)
			const targetPath = outputPath
				? resolve(process.cwd(), outputPath)
				: resolve(process.cwd(), 'dist/index.html')

			if (dryRun) {
				console.log('Dry run: build')
				console.log(`- config: ${loaded.source}`)
				console.log(`- output: ${targetPath}`)
				console.log('- action: would bundle overlay, fetch ttyd base HTML, inject, and write file')
				break
			}

			// Ensure output directory exists
			const { mkdirSync } = await import('node:fs')
			const { dirname } = await import('node:path')
			mkdirSync(dirname(targetPath), { recursive: true })

			await build(loaded.config, targetPath)
			console.log(`Built: ${targetPath}`)
			break
		}

		case 'inject': {
			const loaded = await loadConfig(configPath)
			if (dryRun) {
				ensureInjectInputMode('webmux inject --dry-run')
				const dryRunStdin = await readStdin()
				if (dryRunStdin.trim().length === 0) {
					throw new Error('webmux inject --dry-run expects piped ttyd HTML on stdin')
				}
				console.log('Dry run: inject')
				console.log(`- config: ${loaded.source}`)
				console.log('- stdin: piped input detected')
				console.log('- action: would read stdin HTML, inject overlay, and write to stdout')
				break
			}

			ensureInjectInputMode('webmux inject')
			const result = await injectFromStdin(loaded.config)
			process.stdout.write(result)
			break
		}

		case 'init': {
			const targetPath = resolve(process.cwd(), 'webmux.config.ts')
			if (existsSync(targetPath)) {
				console.error('webmux.config.ts already exists')
				process.exit(1)
			}
			const template = `import { defineConfig } from 'webmux'

export default defineConfig({
  // name: 'webmux',              // app name (tab title, PWA home screen label)
  // theme: 'catppuccin-mocha',
  // font: {
  //   family: 'JetBrainsMono NFM, monospace',
  //   mobileSizeDefault: 16,
  //   sizeRange: [8, 32],
  // },
  //
  // Toolbar/drawer accept a plain array (replace) or a function (transform):
  //
  // toolbar: { row1: [{ id, label, description, action }], row2: [...] },
  //
  // drawer: {
  //   buttons: [
  //     { id: 'sessions', label: 'Sessions', description: 'Choose tmux session', action: { type: 'send', data: '\\x02s' } },
  //   ],
  // },
  //
  // toolbar: {
  //   row2: (defaults) => defaults.filter((b) => b.id !== 'q'),
  // },
  //
  // drawer: {
  //   buttons: (defaults) => [
  //     ...defaults,
  //     { id: 'my-btn', label: 'X', description: 'Send x', action: { type: 'send', data: 'x' } },
  //   ],
  // },
  //
  // gestures: {
  //   swipe: {
  //     enabled: true,
  //     left: '\\x02n',          // data sent on swipe left (default: next tmux window)
  //     right: '\\x02p',         // data sent on swipe right (default: prev tmux window)
  //     leftLabel: 'Next tmux window',
  //     rightLabel: 'Previous tmux window',
  //   },
  //   pinch: { enabled: true },
  //   scroll: { strategy: 'wheel', sensitivity: 40 },
  // },
  // mobile: {
  //   initData: '\\x02z',        // send on load when viewport < widthThreshold (auto-zoom pane)
  //   widthThreshold: 768,       // px — default matches phone/tablet breakpoint
  // },
  // floatingButtons: [
  //   // Always-visible top-left buttons (touch devices only)
  //   { position: 'top-left', buttons: [{ id: 'zoom', label: 'Zoom', description: 'Toggle pane zoom', action: { type: 'send', data: '\\x02z' } }] },
  // ],
  // pwa: {
  //   enabled: true,              // enable PWA manifest + meta tags (used by webmux serve)
  //   shortName: 'webmux',        // short name for home screen icon (defaults to name)
  //   themeColor: '#1e1e2e',      // theme-color meta tag + manifest
  // },
  // reconnect: {
  //   enabled: true,              // show overlay + auto-reload on connection loss (default true)
  // },
})
`
			writeFileSync(targetPath, template)
			console.log(`Created: ${targetPath}`)
			break
		}

		case 'version':
			console.log(VERSION)
			break

		case 'help':
			usage()
			break

		default:
			console.error(`Unknown command: ${command}`)
			usage()
			process.exit(1)
	}
}

if (import.meta.filename === process.argv[1]) {
	main().catch((err: unknown) => {
		console.error(err)
		process.exit(1)
	})
}
