import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { collectStream, spawnProcess } from '../src/util/node-compat'

interface CliResult {
	readonly exitCode: number
	readonly stdout: string
	readonly stderr: string
}

const tempDirs: string[] = []
const repoRoot = join(import.meta.dirname, '..')

afterEach(() => {
	while (tempDirs.length > 0) {
		const dir = tempDirs.pop()
		if (!dir) {
			continue
		}
		rmSync(dir, { recursive: true, force: true })
	}
})

function createTempDir(): string {
	const dir = mkdtempSync(join(tmpdir(), 'webmux-cli-validation-'))
	tempDirs.push(dir)
	return dir
}

async function runCli(args: readonly string[]): Promise<CliResult> {
	const proc = spawnProcess(['npx', 'tsx', join(repoRoot, 'cli.ts'), ...args], {
		cwd: repoRoot,
		stdin: 'ignore',
		stdout: 'pipe',
		stderr: 'pipe',
	})

	const [exitCode, stdout, stderr] = await Promise.all([
		proc.exited,
		collectStream(proc.stdout),
		collectStream(proc.stderr),
	])

	return { exitCode, stdout, stderr }
}

function writeConfig(dir: string, source: string): string {
	const path = join(dir, 'webmux.config.ts')
	writeFileSync(path, source)
	return path
}

function writeLocalConfig(dir: string, source: string): string {
	const path = join(dir, 'webmux.config.local.ts')
	writeFileSync(path, source)
	return path
}

describe('CLI config validation', () => {
	test('build fails fast with nested validation errors', async () => {
		const dir = createTempDir()
		const configPath = writeConfig(
			dir,
			"export default { gestures: { scroll: { strategy: 'mouse' } } }",
		)

		const result = await runCli(['build', '--config', configPath])

		expect(result.exitCode).toBe(1)
		expect(result.stdout).toBe('')
		expect(result.stderr).toContain(`Config validation failed for ${configPath}`)
		expect(result.stderr).toContain('Invalid webmux config:')
		expect(result.stderr).toContain('config.gestures.scroll.strategy')
		expect(result.stderr).toContain('received string("mouse")')
	})

	test('inject fails fast on unknown root keys', async () => {
		const dir = createTempDir()
		const configPath = writeConfig(dir, 'export default { mystery: true }')

		const result = await runCli(['inject', '--config', configPath])

		expect(result.exitCode).toBe(1)
		expect(result.stdout).toBe('')
		expect(result.stderr).toContain(`Config validation failed for ${configPath}`)
		expect(result.stderr).toContain('config.mystery')
	})

	test('build reports malformed button array shape', async () => {
		const dir = createTempDir()
		const configPath = writeConfig(dir, "export default { toolbar: { row1: [{ id: 'only-id' }] } }")

		const result = await runCli(['build', '--config', configPath])

		expect(result.exitCode).toBe(1)
		expect(result.stderr).toContain('config.toolbar.row1[0].label')
		expect(result.stderr).toContain('config.toolbar.row1[0].description')
		expect(result.stderr).toContain('config.toolbar.row1[0].action')
	})

	test('build --dry-run shows shared config path when no .local file', async () => {
		const dir = createTempDir()
		const configPath = writeConfig(dir, "export default { name: 'myterm' }")

		const result = await runCli(['build', '--config', configPath, '--dry-run'])

		expect(result.exitCode).toBe(0)
		expect(result.stdout).toContain(configPath)
		// Should NOT mention .local in source
		expect(result.stdout).not.toContain('.local')
	})

	test('local config merges with shared config', async () => {
		const dir = createTempDir()
		const configPath = writeConfig(dir, "export default { name: 'shared' }")
		writeLocalConfig(dir, "export default { name: 'local-override' }")

		const result = await runCli(['build', '--config', configPath, '--dry-run'])

		expect(result.exitCode).toBe(0)
		// Source should mention both files
		expect(result.stdout).toContain(configPath)
		expect(result.stdout).toContain('.local')
	})

	test('local config validation errors report local file path', async () => {
		const dir = createTempDir()
		const configPath = writeConfig(dir, "export default { name: 'shared' }")
		const localPath = writeLocalConfig(dir, 'export default { unknownKey: true }')

		const result = await runCli(['build', '--config', configPath])

		expect(result.exitCode).toBe(1)
		expect(result.stderr).toContain(localPath)
		expect(result.stderr).toContain('config.unknownKey')
	})
})
