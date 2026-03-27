import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { collectStream, sleep, spawnProcess } from '../src/util/node-compat'

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
		if (!dir) continue
		rmSync(dir, { recursive: true, force: true })
	}
})

function createTempDir(): string {
	const dir = mkdtempSync(join(tmpdir(), 'remobi-cli-validation-'))
	tempDirs.push(dir)
	return dir
}

async function runCli(args: readonly string[]): Promise<CliResult> {
	const proc = spawnProcess(['tsx', join(repoRoot, 'cli.ts'), ...args], {
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
	const path = join(dir, 'remobi.config.ts')
	writeFileSync(path, source)
	return path
}

function writeLocalConfig(dir: string, source: string): string {
	const path = join(dir, 'remobi.config.local.ts')
	writeFileSync(path, source)
	return path
}

async function reservePort(): Promise<number> {
	const server = createServer()

	await new Promise<void>((resolve, reject) => {
		server.once('error', reject)
		server.listen(0, '127.0.0.1', () => resolve())
	})

	const address = server.address()
	if (!address || typeof address === 'string') {
		server.close()
		throw new Error('failed to reserve test port')
	}

	await new Promise<void>((resolve, reject) => {
		server.close((error) => {
			if (error) {
				reject(error)
				return
			}
			resolve()
		})
	})

	return address.port
}

async function waitForHttp(url: string, timeoutMs = 10_000): Promise<string> {
	const deadline = Date.now() + timeoutMs

	while (Date.now() < deadline) {
		try {
			const response = await fetch(url)
			if (response.ok) {
				return response.text()
			}
		} catch {
			// server not ready yet
		}

		await sleep(100)
	}

	throw new Error(`timed out waiting for ${url}`)
}

describe('CLI command validation', () => {
	test('serve fails fast with nested validation errors', async () => {
		const dir = createTempDir()
		const configPath = writeConfig(
			dir,
			"export default { gestures: { scroll: { strategy: 'mouse' } } }",
		)

		const result = await runCli(['serve', '--config', configPath])

		expect(result.exitCode).toBe(1)
		expect(result.stdout).toBe('')
		expect(result.stderr).toContain(`Config validation failed for ${configPath}`)
		expect(result.stderr).toContain('config.gestures.scroll.strategy')
	})

	test('build exits with a deprecation error', async () => {
		const result = await runCli(['build'])

		expect(result.exitCode).toBe(1)
		expect(result.stdout).toBe('')
		expect(result.stderr).toContain('remobi build is deprecated and no longer supported')
		expect(result.stderr).toContain('Use `remobi serve` instead.')
	})

	test('inject exits with a deprecation error', async () => {
		const result = await runCli(['inject'])

		expect(result.exitCode).toBe(1)
		expect(result.stdout).toBe('')
		expect(result.stderr).toContain('remobi inject is deprecated and no longer supported')
		expect(result.stderr).toContain('Use `remobi serve` instead.')
	})

	test('serve loads local config overrides from the .local sibling file', async () => {
		const dir = createTempDir()
		const configPath = writeConfig(dir, "export default { name: 'shared-name' }")
		writeLocalConfig(dir, "export default { name: 'local-override' }")
		const port = await reservePort()
		const proc = spawnProcess(
			[
				'tsx',
				join(repoRoot, 'cli.ts'),
				'serve',
				'--config',
				configPath,
				'--port',
				String(port),
				'--',
				'bash',
				'--norc',
				'--noprofile',
				'-lc',
				'sleep 30',
			],
			{
				cwd: repoRoot,
				stdin: 'ignore',
				stdout: 'pipe',
				stderr: 'pipe',
			},
		)

		try {
			const html = await waitForHttp(`http://127.0.0.1:${port}`)
			expect(html).toContain('<title>local-override</title>')
		} finally {
			proc.kill('SIGINT')
			await proc.exited
		}
	})

	test('serve reports local config validation errors against the .local file', async () => {
		const dir = createTempDir()
		const configPath = writeConfig(dir, "export default { name: 'shared' }")
		const localPath = writeLocalConfig(dir, 'export default { unknownKey: true }')

		const result = await runCli(['serve', '--config', configPath])

		expect(result.exitCode).toBe(1)
		expect(result.stderr).toContain(localPath)
		expect(result.stderr).toContain('config.unknownKey')
	})

	test('serve fails cleanly when the port is already in use', async () => {
		const port = await reservePort()
		const blocker = createServer()

		await new Promise<void>((resolve, reject) => {
			blocker.once('error', reject)
			blocker.listen(port, '127.0.0.1', () => resolve())
		})

		try {
			const result = await runCli([
				'serve',
				'--port',
				String(port),
				'--',
				'bash',
				'--norc',
				'--noprofile',
				'-lc',
				'sleep 30',
			])

			expect(result.exitCode).toBe(1)
			expect(result.stdout).not.toContain(`remobi: serving on http://localhost:${port}`)
			expect(result.stderr).toContain(`port ${port} is already in use`)
		} finally {
			await new Promise<void>((resolve, reject) => {
				blocker.close((error) => {
					if (error) {
						reject(error)
						return
					}
					resolve()
				})
			})
		}
	})
})
