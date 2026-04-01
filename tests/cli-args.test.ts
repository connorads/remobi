import { describe, expect, test } from 'vitest'
import { parseCliArgs } from '../src/cli/args'

describe('parseCliArgs', () => {
	test('defaults to help with no args', () => {
		const result = parseCliArgs([])
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.command).toBe('help')
		}
	})

	test('parses build with config, output and dry-run', () => {
		const result = parseCliArgs([
			'build',
			'--config',
			'./remobi.config.ts',
			'--output',
			'dist/x.html',
			'--dry-run',
		])
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.command).toBe('build')
			expect(result.value.configPath).toBe('./remobi.config.ts')
			expect(result.value.outputPath).toBe('dist/x.html')
			expect(result.value.dryRun).toBe(true)
		}
	})

	test('parses inject short flags', () => {
		const result = parseCliArgs(['inject', '-c', './cfg.ts', '-n'])
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.command).toBe('inject')
			expect(result.value.configPath).toBe('./cfg.ts')
			expect(result.value.dryRun).toBe(true)
		}
	})

	test('rejects unknown command', () => {
		const result = parseCliArgs(['frobulate'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain('Unknown command')
		}
	})

	test('parses serve with default port and no trailing command', () => {
		const result = parseCliArgs(['serve'])
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.command).toBe('serve')
			expect(result.value.port).toBeUndefined()
			expect(result.value.command_).toEqual([])
		}
	})

	test('parses serve with --port flag', () => {
		const result = parseCliArgs(['serve', '--port', '8080'])
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.command).toBe('serve')
			expect(result.value.port).toBe(8080)
		}
	})

	test('parses serve with --host flag', () => {
		const result = parseCliArgs(['serve', '--host', '0.0.0.0'])
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.host).toBe('0.0.0.0')
		}
	})

	test('parses serve with --base-path flag', () => {
		const result = parseCliArgs(['serve', '--base-path', '/random-token'])
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.basePath).toBe('/random-token')
		}
	})

	test('parses serve with -p short flag', () => {
		const result = parseCliArgs(['serve', '-p', '9000'])
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.port).toBe(9000)
		}
	})

	test('parses serve with -- trailing command', () => {
		const result = parseCliArgs(['serve', '--', 'tmux', 'new', '-As', 'dev'])
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.command_).toEqual(['tmux', 'new', '-As', 'dev'])
		}
	})

	test('parses serve with config, port and trailing command', () => {
		const result = parseCliArgs([
			'serve',
			'-c',
			'./cfg.ts',
			'--port',
			'8080',
			'--',
			'tmux',
			'new',
			'-As',
			'dev',
		])
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.configPath).toBe('./cfg.ts')
			expect(result.value.port).toBe(8080)
			expect(result.value.command_).toEqual(['tmux', 'new', '-As', 'dev'])
		}
	})

	test('rejects --port outside serve command', () => {
		const result = parseCliArgs(['build', '--port', '8080'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain("only valid for 'serve'")
		}
	})

	test('rejects --host outside serve command', () => {
		const result = parseCliArgs(['build', '--host', '0.0.0.0'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain("only valid for 'serve'")
		}
	})

	test('rejects missing --host value', () => {
		const result = parseCliArgs(['serve', '--host'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain('Missing value for --host')
		}
	})

	test('rejects missing --base-path value', () => {
		const result = parseCliArgs(['serve', '--base-path'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain('Missing value for --base-path')
		}
	})

	test('rejects invalid port value', () => {
		const result = parseCliArgs(['serve', '--port', 'abc'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain('Invalid port')
		}
	})

	test('rejects out-of-range port', () => {
		const result = parseCliArgs(['serve', '--port', '99999'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain('Invalid port')
		}
	})

	test('rejects unknown flag', () => {
		const result = parseCliArgs(['build', '--wat'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain('Unknown flag')
		}
	})

	test('rejects --output outside build command', () => {
		const result = parseCliArgs(['inject', '--output', 'x.html'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain("only valid for 'build'")
		}
	})

	test('rejects --config outside build/inject/serve commands', () => {
		const result = parseCliArgs(['init', '--config', './x.ts'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain("only valid for 'build', 'inject', or 'serve'")
		}
	})

	test('rejects missing --config value', () => {
		const result = parseCliArgs(['build', '--config'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain('Missing value for --config')
		}
	})

	test('rejects --config when next token is a flag', () => {
		const result = parseCliArgs(['build', '--config', '--dry-run'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain('Missing value for --config')
		}
	})

	test('rejects --output when next token is a flag', () => {
		const result = parseCliArgs(['build', '--output', '--dry-run'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain('Missing value for --output')
		}
	})

	test('rejects positional args after command', () => {
		const result = parseCliArgs(['build', 'extra'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain('Unexpected positional argument')
		}
	})

	test('supports top-level version alias', () => {
		const result = parseCliArgs(['-v'])
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.command).toBe('version')
		}
	})

	test('rejects version flag after command token', () => {
		const result = parseCliArgs(['build', '--version'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain('only valid as a top-level command')
		}
	})

	test('parses serve with --no-sleep flag', () => {
		const result = parseCliArgs(['serve', '--no-sleep'])
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.command).toBe('serve')
			expect(result.value.noSleep).toBe(true)
		}
	})

	test('noSleep defaults to false on serve', () => {
		const result = parseCliArgs(['serve'])
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.noSleep).toBe(false)
		}
	})

	test('rejects --no-sleep outside serve command', () => {
		const result = parseCliArgs(['build', '--no-sleep'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain("only valid for 'serve'")
		}
	})

	test('duplicate flags use last value (last-wins)', () => {
		const result = parseCliArgs(['serve', '--port', '8080', '--port', '9000'])
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.port).toBe(9000)
		}
	})

	test('accepts port boundary value 1', () => {
		const result = parseCliArgs(['serve', '--port', '1'])
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.port).toBe(1)
		}
	})

	test('accepts port boundary value 65535', () => {
		const result = parseCliArgs(['serve', '--port', '65535'])
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.port).toBe(65535)
		}
	})

	test('rejects port 0', () => {
		const result = parseCliArgs(['serve', '--port', '0'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain('Invalid port')
		}
	})

	test('rejects port 65536', () => {
		const result = parseCliArgs(['serve', '--port', '65536'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain('Invalid port')
		}
	})

	test('rejects missing --port value at end of args', () => {
		const result = parseCliArgs(['serve', '--port'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain('Missing value for --port')
		}
	})

	test('rejects --port when next token is a flag', () => {
		const result = parseCliArgs(['serve', '--port', '--no-sleep'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain('Missing value for --port')
		}
	})

	test('rejects --host when next token is a flag', () => {
		const result = parseCliArgs(['serve', '--host', '--port', '8080'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain('Missing value for --host')
		}
	})

	test('rejects --base-path outside serve command', () => {
		const result = parseCliArgs(['build', '--base-path', '/proxy'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain("only valid for 'serve'")
		}
	})

	test('rejects invalid --base-path values', () => {
		for (const value of ['', 'proxy', '/proxy?x=1', '/proxy#frag']) {
			const result = parseCliArgs(['serve', '--base-path', value])
			expect(result.ok).toBe(false)
			if (!result.ok) {
				expect(result.error).toContain('Invalid base path')
			}
		}
	})

	test('normalises root and trailing slash for --base-path', () => {
		const root = parseCliArgs(['serve', '--base-path', '/'])
		expect(root.ok).toBe(true)
		if (root.ok) {
			expect(root.value.basePath).toBe('/')
		}

		const nested = parseCliArgs(['serve', '--base-path', '/proxy/'])
		expect(nested.ok).toBe(true)
		if (nested.ok) {
			expect(nested.value.basePath).toBe('/proxy')
		}
	})

	test('empty trailing command after --', () => {
		const result = parseCliArgs(['serve', '--'])
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.command_).toEqual([])
		}
	})

	test('flags in different order', () => {
		const result = parseCliArgs([
			'serve',
			'--no-sleep',
			'--port',
			'8080',
			'--config',
			'./c.ts',
			'--base-path',
			'/proxy',
		])
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.noSleep).toBe(true)
			expect(result.value.port).toBe(8080)
			expect(result.value.configPath).toBe('./c.ts')
			expect(result.value.basePath).toBe('/proxy')
		}
	})

	test('parses serve with --no-sleep combined with --port and trailing command', () => {
		const result = parseCliArgs([
			'serve',
			'--no-sleep',
			'--port',
			'8080',
			'--',
			'tmux',
			'new',
			'-As',
			'dev',
		])
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.noSleep).toBe(true)
			expect(result.value.port).toBe(8080)
			expect(result.value.command_).toEqual(['tmux', 'new', '-As', 'dev'])
		}
	})

	test('duplicate --base-path flags use last value', () => {
		const result = parseCliArgs(['serve', '--base-path', '/one', '--base-path', '/two/'])
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.basePath).toBe('/two')
		}
	})
})
