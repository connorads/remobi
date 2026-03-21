import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { spawnProcess } from '../../src/util/node-compat'

const repoRoot = join(import.meta.dirname, '../..')
const tempDirs: string[] = []

test.afterEach(() => {
	while (tempDirs.length > 0) {
		const dir = tempDirs.pop()
		if (!dir) continue
		rmSync(dir, { recursive: true, force: true })
	}
})

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

async function waitForHttp(url: string, timeoutMs = 10_000): Promise<void> {
	const deadline = Date.now() + timeoutMs

	while (Date.now() < deadline) {
		try {
			const response = await fetch(url)
			if (response.ok) {
				return
			}
		} catch {
			// server not ready yet
		}

		await new Promise((resolve) => setTimeout(resolve, 100))
	}

	throw new Error(`timed out waiting for ${url}`)
}

test('ended command closes the session and shows reconnect overlay', async ({ page }) => {
	const port = await reservePort()
	const home = mkdtempSync(join(tmpdir(), 'remobi-playwright-home-'))
	tempDirs.push(home)

	const proc = spawnProcess(
		[
			'pnpm',
			'exec',
			'tsx',
			'cli.ts',
			'serve',
			'--port',
			String(port),
			'--',
			'bash',
			'--norc',
			'--noprofile',
			'-lc',
			'printf "session-exit-e2e\\n"; sleep 1; exit 0',
		],
		{
			cwd: repoRoot,
			env: { ...process.env, HOME: home },
			stdin: 'ignore',
			stdout: 'pipe',
			stderr: 'pipe',
		},
	)
	let exited = false
	void proc.exited.then(() => {
		exited = true
	})

	try {
		await waitForHttp(`http://127.0.0.1:${port}`)
		await page.goto(`http://127.0.0.1:${port}`)
		await expect(page.locator('body')).toContainText('session-exit-e2e')
		await expect(page.locator('#remobi-reconnect-overlay')).toBeVisible({ timeout: 10_000 })
		await expect(page.locator('#remobi-reconnect-overlay')).toContainText('Connection lost')
		await expect
			.poll(async () => {
				return Promise.race([
					proc.exited.then((code) => {
						exited = true
						return code
					}),
					new Promise<null>((resolve) => setTimeout(() => resolve(null), 50)),
				])
			})
			.toBe(0)
	} finally {
		if (!exited) {
			proc.kill('SIGINT')
			await proc.exited
		}
	}
})

test('ended command shows a status overlay when reconnect is disabled', async ({ page }) => {
	const port = await reservePort()
	const home = mkdtempSync(join(tmpdir(), 'remobi-playwright-home-'))
	tempDirs.push(home)
	const configPath = join(home, 'remobi.config.ts')
	writeFileSync(
		configPath,
		`export default { reconnect: { enabled: false }, name: 'remobi no reconnect' }`,
	)

	const proc = spawnProcess(
		[
			'pnpm',
			'exec',
			'tsx',
			'cli.ts',
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
			'printf "session-exit-no-reconnect\\n"; sleep 1; exit 0',
		],
		{
			cwd: repoRoot,
			env: { ...process.env, HOME: home },
			stdin: 'ignore',
			stdout: 'pipe',
			stderr: 'pipe',
		},
	)
	let exited = false
	void proc.exited.then(() => {
		exited = true
	})

	try {
		await waitForHttp(`http://127.0.0.1:${port}`)
		await page.goto(`http://127.0.0.1:${port}`)
		await expect(page.locator('body')).toContainText('session-exit-no-reconnect')
		await expect(page.locator('#remobi-session-status')).toBeVisible({ timeout: 10_000 })
		await expect(page.locator('#remobi-session-status')).toContainText('Session ended')
		await expect(page.locator('#remobi-reconnect-overlay')).toHaveCount(0)
		await expect
			.poll(async () => {
				return Promise.race([
					proc.exited.then((code) => {
						exited = true
						return code
					}),
					new Promise<null>((resolve) => setTimeout(() => resolve(null), 50)),
				])
			})
			.toBe(0)
	} finally {
		if (!exited) {
			proc.kill('SIGINT')
			await proc.exited
		}
	}
})
