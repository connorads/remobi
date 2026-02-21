#!/usr/bin/env bun
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { build, injectFromStdin } from './build'
import { parseCliArgs } from './src/cli/args'
import { defaultConfig, defineConfig } from './src/config'
import {
	ConfigValidationError,
	assertValidConfigOverrides,
	assertValidResolvedConfig,
} from './src/config-validate'
import type { DeepPartial, WebmuxConfig } from './src/types'

const VERSION = '0.1.0'

function usage(): void {
	console.log(`webmux v${VERSION} — mobile-friendly terminal overlay for ttyd + tmux

Usage:
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
  -c, --config <path>  Use a specific config file
  -o, --output <path>  Build output path (build only)
  -n, --dry-run        Validate + print plan only (build/inject)

Examples:
  webmux build -c ./webmux.config.ts -o ./dist/index.html
  webmux build --dry-run
  curl -s http://127.0.0.1:7681/ | webmux inject --dry-run`)
}

interface LoadedConfig {
	readonly config: WebmuxConfig
	readonly source: string
	readonly pluginImports: readonly string[]
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

function resolvePluginSpecifier(specifier: string, baseDir: string): string {
	const clean = specifier.trim()
	if (clean.startsWith('.')) {
		return resolve(baseDir, clean)
	}

	if (isAbsolute(clean)) {
		return clean
	}

	const requireFromBase = createRequire(join(baseDir, '__webmux_plugin_resolver__.cjs'))
	try {
		return requireFromBase.resolve(clean)
	} catch {
		// keep bare specifier and let the bundler report detailed resolution errors
	}

	return clean
}

function resolvePluginSpecifiers(
	specifiers: readonly string[],
	baseDir: string,
): readonly string[] {
	return specifiers.map((specifier) => resolvePluginSpecifier(specifier, baseDir))
}

function throwConfigValidationError(source: string, error: ConfigValidationError): never {
	throw new Error(`Config validation failed for ${source}\n${error.message}`)
}

function assertValidOverridesOrThrow(
	value: unknown,
	source: string,
): asserts value is DeepPartial<WebmuxConfig> {
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
		const config = defineConfig(defaultExport)
		assertValidResolvedOrThrow(config, abs)
		const pluginImports = resolvePluginSpecifiers(config.plugins, dirname(abs))
		return { config, source: abs, pluginImports }
	}

	assertValidResolvedOrThrow(defaultConfig, 'built-in defaults')

	return {
		config: defaultConfig,
		source: 'built-in defaults',
		pluginImports: resolvePluginSpecifiers(defaultConfig.plugins, process.cwd()),
	}
}

async function main(): Promise<void> {
	const parsed = parseCliArgs(process.argv.slice(2))
	if (!parsed.ok) {
		console.error(parsed.error)
		usage()
		process.exit(1)
	}

	const { command, configPath, outputPath, dryRun } = parsed.value

	switch (command) {
		case 'build': {
			const loaded = await loadConfig(configPath)
			const targetPath = outputPath
				? resolve(process.cwd(), outputPath)
				: resolve(process.cwd(), 'dist/index.html')

			if (dryRun) {
				console.log('Dry run: build')
				console.log(`- config: ${loaded.source}`)
				console.log(`- output: ${targetPath}`)
				console.log(`- plugins: ${loaded.pluginImports.length}`)
				console.log('- action: would bundle overlay, fetch ttyd base HTML, inject, and write file')
				break
			}

			// Ensure output directory exists
			const { mkdirSync } = await import('node:fs')
			const { dirname } = await import('node:path')
			mkdirSync(dirname(targetPath), { recursive: true })

			await build(loaded.config, targetPath, loaded.pluginImports)
			console.log(`Built: ${targetPath}`)
			break
		}

		case 'inject': {
			const loaded = await loadConfig(configPath)
			if (dryRun) {
				ensureInjectInputMode('webmux inject --dry-run')
				const dryRunStdin = await Bun.stdin.text()
				if (dryRunStdin.trim().length === 0) {
					throw new Error('webmux inject --dry-run expects piped ttyd HTML on stdin')
				}
				console.log('Dry run: inject')
				console.log(`- config: ${loaded.source}`)
				console.log(`- plugins: ${loaded.pluginImports.length}`)
				console.log('- stdin: piped input detected')
				console.log('- action: would read stdin HTML, inject overlay, and write to stdout')
				break
			}

			ensureInjectInputMode('webmux inject')
			const result = await injectFromStdin(loaded.config, loaded.pluginImports)
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
  // theme: 'catppuccin-mocha',
  // font: {
  //   family: 'JetBrainsMono NFM, monospace',
  //   mobileSizeDefault: 16,
  //   sizeRange: [8, 32],
  // },
  // plugins: ['./plugins/logger.ts', 'webmux-plugin-demo'],
  // toolbar: { row1: [{ id, label, description, action }], row2: [...] },
  // drawer: { buttons: [{ id, label, description, action }] },
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
  //   { id: 'zoom', label: 'Zoom', description: 'Toggle pane zoom', action: { type: 'send', data: '\\x02z' } },
  // ],
})
`
			await Bun.write(targetPath, template)
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

if (import.meta.main) {
	main().catch((err: unknown) => {
		console.error(err)
		process.exit(1)
	})
}
