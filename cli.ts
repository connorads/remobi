#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { parseCliArgs } from './src/cli/args'
import { defaultConfig, defineConfig, mergeConfig } from './src/config'
import {
	ConfigValidationError,
	assertValidConfigOverrides,
	assertValidResolvedConfig,
} from './src/config-validate'
import { serve } from './src/serve'
import type { RemobiConfig, RemobiConfigOverrides } from './src/types'

// Walk up from module location to find project root — works from both source and dist/
function findProjectRoot(): string {
	let dir = import.meta.dirname
	for (let i = 0; i < 5; i++) {
		if (existsSync(resolve(dir, 'package.json'))) return dir
		dir = dirname(dir)
	}
	return import.meta.dirname
}

function loadPackageVersion(root: string): string {
	try {
		const content = readFileSync(resolve(root, 'package.json'), 'utf-8')
		// oxlint-disable-next-line typescript/consistent-type-assertions -- JSON.parse returns unknown
		return (JSON.parse(content) as { version: string }).version
	} catch {
		return '0.0.0'
	}
}

// Source checkout has src/index.ts (not published to npm per files array in package.json).
// For dev builds, append git short hash so local vs npm is obvious.
function resolveVersion(): string {
	const root = findProjectRoot()
	const pkgVersion = loadPackageVersion(root)
	if (!existsSync(resolve(root, 'src/index.ts'))) return pkgVersion
	try {
		const hash = execSync('git rev-parse --short HEAD', {
			cwd: root,
			encoding: 'utf-8',
			stdio: ['ignore', 'pipe', 'ignore'],
		}).trim()
		return `${pkgVersion}-dev+${hash}`
	} catch {
		return pkgVersion
	}
}

const VERSION: string = resolveVersion()

function usage(): void {
	console.log(`remobi v${VERSION} — mobile terminal overlay for tmux

Usage:
  remobi serve [--config <path>] [--port <n>] [--host <addr>] [--no-sleep] [-- <command...>]
    Start remobi with a built-in web terminal, PWA support, and the configured command.
    Default host: 127.0.0.1. Default port: 7681. Default command: tmux new-session -A -s main

  remobi build [--config <path>] [--output <path>] [--dry-run]
    Deprecated. remobi no longer patches ttyd HTML.

  remobi inject [--config <path>] [--dry-run]
    Deprecated. remobi no longer patches ttyd HTML.

  remobi init
    Scaffold a remobi.config.ts with defaults.

  remobi --version
    Print version.

  remobi --help
    Show this help.

Flags:
  -c, --config <path>  Use a specific config file (serve/build/inject)
  -o, --output <path>  Deprecated build output path flag
  -p, --port <n>       Port to serve on (serve only, default 7681)
      --host <addr>    Host/interface to bind (serve only, default 127.0.0.1)
  -n, --dry-run        Deprecated build/inject dry-run flag
      --no-sleep       Prevent macOS sleep while serving (caffeinate -s, serve only)

Examples:
  remobi serve
  remobi serve --no-sleep
  remobi serve --host 0.0.0.0 --port 8080
  remobi serve --port 8080 -- tmux new -As dev`)
}

interface LoadedConfig {
	readonly config: RemobiConfig
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

function throwConfigValidationError(source: string, error: ConfigValidationError): never {
	throw new Error(`Config validation failed for ${source}\n${error.message}`)
}

function throwDeprecatedCommand(command: 'build' | 'inject'): never {
	throw new Error(
		`remobi ${command} is deprecated and no longer supported.\nremobi now ships its own terminal runtime and no longer patches ttyd HTML.\nUse \`remobi serve\` instead.`,
	)
}

/** Convert a config path to its .local sibling, e.g. remobi.config.ts → remobi.config.local.ts */
function toLocalPath(configPath: string): string {
	const dotIdx = configPath.lastIndexOf('.')
	if (dotIdx === -1) {
		return `${configPath}.local`
	}
	return `${configPath.slice(0, dotIdx)}.local${configPath.slice(dotIdx)}`
}

/** Try to load a .local config override file. Returns undefined if the file does not exist. */
async function loadLocalOverrides(localPath: string): Promise<RemobiConfigOverrides | undefined> {
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
): asserts value is RemobiConfigOverrides {
	try {
		assertValidConfigOverrides(value)
	} catch (error) {
		if (error instanceof ConfigValidationError) {
			throwConfigValidationError(source, error)
		}
		throw error
	}
}

function assertValidResolvedOrThrow(value: unknown, source: string): asserts value is RemobiConfig {
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
		// Search order: cwd → XDG config dir (~/.config/remobi/)
		const names = ['remobi.config.ts', 'remobi.config.js']
		const searchDirs = [
			process.cwd(),
			join(process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config'), 'remobi'),
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

	const { command, configPath, port, host, noSleep, command_ } = parsed.value

	switch (command) {
		case 'serve': {
			const loaded = await loadConfig(configPath)
			await serve(
				loaded.config,
				port,
				command_.length > 0 ? command_ : undefined,
				noSleep,
				host,
				VERSION,
			)
			break
		}

		case 'build': {
			return throwDeprecatedCommand('build')
		}

		case 'inject': {
			return throwDeprecatedCommand('inject')
		}

		case 'init': {
			const targetPath = resolve(process.cwd(), 'remobi.config.ts')
			if (existsSync(targetPath)) {
				console.error('remobi.config.ts already exists')
				process.exit(1)
			}
			const template = `import { defineConfig } from 'remobi'

export default defineConfig({
  // name: 'remobi',              // app name (tab title, PWA home screen label)
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
  //   enabled: true,              // enable PWA manifest + meta tags (used by remobi serve)
  //   shortName: 'remobi',        // short name for home screen icon (defaults to name)
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

const entryScript = process.argv[1]
if (entryScript && import.meta.filename === realpathSync(entryScript)) {
	main().catch((err: unknown) => {
		console.error(err)
		process.exit(1)
	})
}
