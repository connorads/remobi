#!/usr/bin/env bun
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { build, injectFromStdin } from './build'
import { defaultConfig, defineConfig } from './src/config'
import type { DeepPartial, WebmuxConfig } from './src/types'

const VERSION = '0.1.0'

function usage(): void {
	console.log(`webmux v${VERSION} — mobile-friendly terminal overlay for ttyd + tmux

Usage:
  webmux build [--config <path>] [--output <path>]
    Build patched index.html for ttyd --index flag.
    Starts temp ttyd, fetches base HTML, injects overlay.

  webmux inject [--config <path>]
    Pipe mode: reads ttyd HTML from stdin, outputs patched HTML to stdout.

  webmux init
    Scaffold a webmux.config.ts with defaults.

  webmux --version
    Print version.

  webmux --help
    Show this help.`)
}

async function loadConfig(configPath: string | undefined): Promise<WebmuxConfig> {
	let resolved = configPath
	if (!resolved) {
		// Look for default config file
		const defaultPaths = ['webmux.config.ts', 'webmux.config.js']
		for (const p of defaultPaths) {
			const full = resolve(process.cwd(), p)
			if (existsSync(full)) {
				resolved = full
				break
			}
		}
	}

	if (resolved) {
		const abs = resolve(process.cwd(), resolved)
		const mod = (await import(abs)) as { default?: DeepPartial<WebmuxConfig> }
		if (mod.default) {
			return defineConfig(mod.default)
		}
	}

	return defaultConfig
}

function parseArgs(args: readonly string[]): {
	command: string
	config?: string
	output?: string
} {
	const command = args[0] ?? '--help'
	let config: string | undefined
	let output: string | undefined

	for (let i = 1; i < args.length; i++) {
		const arg = args[i]
		const next = args[i + 1]
		if (arg === '--config' && next) {
			config = next
			i++
		} else if (arg === '--output' && next) {
			output = next
			i++
		}
	}

	return { command, config, output }
}

async function main(): Promise<void> {
	const { command, config: configPath, output } = parseArgs(process.argv.slice(2))

	switch (command) {
		case 'build': {
			const config = await loadConfig(configPath)
			const outputPath = output
				? resolve(process.cwd(), output)
				: resolve(process.cwd(), 'dist/index.html')

			// Ensure output directory exists
			const { mkdirSync } = await import('node:fs')
			const { dirname } = await import('node:path')
			mkdirSync(dirname(outputPath), { recursive: true })

			await build(config, outputPath)
			console.log(`Built: ${outputPath}`)
			break
		}

		case 'inject': {
			const config = await loadConfig(configPath)
			const result = await injectFromStdin(config)
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
  // toolbar: { row1: [...], row2: [...] },
  // drawer: { commands: [...] },
  // gestures: { swipe: { enabled: true }, pinch: { enabled: true } },
})
`
			await Bun.write(targetPath, template)
			console.log(`Created: ${targetPath}`)
			break
		}

		case '--version':
		case '-v':
			console.log(VERSION)
			break

		case '--help':
		case '-h':
		case 'help':
			usage()
			break

		default:
			console.error(`Unknown command: ${command}`)
			usage()
			process.exit(1)
	}
}

main().catch((err: unknown) => {
	console.error(err)
	process.exit(1)
})
