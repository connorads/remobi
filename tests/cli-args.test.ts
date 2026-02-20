import { describe, expect, test } from 'bun:test'
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
			'./webmux.config.ts',
			'--output',
			'dist/x.html',
			'--dry-run',
		])
		expect(result.ok).toBe(true)
		if (result.ok) {
			expect(result.value.command).toBe('build')
			expect(result.value.configPath).toBe('./webmux.config.ts')
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
		const result = parseCliArgs(['serve'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain('Unknown command')
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

	test('rejects --config outside build/inject commands', () => {
		const result = parseCliArgs(['init', '--config', './x.ts'])
		expect(result.ok).toBe(false)
		if (!result.ok) {
			expect(result.error).toContain("only valid for 'build' or 'inject'")
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
})
