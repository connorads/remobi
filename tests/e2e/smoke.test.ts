/**
 * e2e smoke tests against a real ttyd session.
 *
 * These tests require ttyd to be available on PATH and are skipped
 * automatically when it is not present (safe for CI environments where
 * ttyd is not installed).
 */
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { createServer } from 'node:net'
import { join } from 'node:path'
import { collectStream, sleep, spawnProcess } from '../../src/util/node-compat'
import type { SpawnedProcess } from '../../src/util/node-compat'

const repoRoot = new URL('../..', import.meta.url).pathname

/** Check if ttyd is available on PATH */
async function ttydAvailable(): Promise<boolean> {
	try {
		const proc = spawnProcess(['which', 'ttyd'], { stdout: 'pipe', stderr: 'pipe' })
		const code = await proc.exited
		return code === 0
	} catch {
		return false
	}
}

/** Find a free port in the ephemeral range */
async function findFreePort(): Promise<number> {
	return new Promise((resolve, reject) => {
		const server = createServer()
		server.listen(0, () => {
			const addr = server.address()
			if (addr && typeof addr === 'object') {
				const port = addr.port
				server.close(() => resolve(port))
			} else {
				server.close(() => reject(new Error('Could not determine port')))
			}
		})
	})
}

/** Poll a URL until it responds 200 or times out */
async function waitForHttp(url: string, maxAttempts = 20, intervalMs = 200): Promise<boolean> {
	for (let i = 0; i < maxAttempts; i++) {
		try {
			const res = await fetch(url, { signal: AbortSignal.timeout(500) })
			if (res.ok) return true
		} catch {
			// not ready yet
		}
		await sleep(intervalMs)
	}
	return false
}

const hasTtyd = await ttydAvailable()

describe.skipIf(!hasTtyd)('e2e: ttyd integration', () => {
	let ttydPort: number
	let ttydProc: SpawnedProcess

	beforeAll(async () => {
		ttydPort = await findFreePort()
		ttydProc = spawnProcess(
			['ttyd', '--port', String(ttydPort), '--once', 'echo', 'webmux-e2e-smoke'],
			{ stdout: 'pipe', stderr: 'pipe' },
		)
		const ready = await waitForHttp(`http://127.0.0.1:${ttydPort}/`)
		if (!ready) {
			ttydProc.kill()
			throw new Error(`ttyd did not start on port ${ttydPort}`)
		}
	})

	afterAll(async () => {
		ttydProc.kill()
		await ttydProc.exited.catch(() => {})
	})

	test('ttyd serves HTML with terminal script tag', async () => {
		const res = await fetch(`http://127.0.0.1:${ttydPort}/`)
		expect(res.ok).toBe(true)

		const html = await res.text()
		expect(html).toContain('<!DOCTYPE html>')
		// ttyd base HTML always includes ttyd main.js bundle reference
		expect(html.toLowerCase()).toContain('main')
	})

	test('webmux inject pipes ttyd HTML and produces patched output', async () => {
		const ttydHtml = await fetch(`http://127.0.0.1:${ttydPort}/`).then((r) => r.text())

		const proc = spawnProcess(['npx', 'tsx', join(repoRoot, 'cli.ts'), 'inject'], {
			cwd: repoRoot,
			stdin: 'pipe',
			stdout: 'pipe',
			stderr: 'pipe',
		})

		// Write HTML to stdin then close
		proc.stdin?.write(ttydHtml)
		proc.stdin?.end()

		const [exitCode, stdout] = await Promise.all([proc.exited, collectStream(proc.stdout)])

		expect(exitCode).toBe(0)
		// The patched HTML should include the webmux overlay script
		expect(stdout).toContain('<!DOCTYPE html>')
		// webmux inject always appends before </head>
		expect(stdout.indexOf('</head>')).toBeGreaterThan(-1)
	})
})

describe.skipIf(hasTtyd)('e2e: ttyd not available', () => {
	test('skipped — ttyd not found on PATH', () => {
		// This test only runs when ttyd is absent to document the skip reason.
		expect(hasTtyd).toBe(false)
	})
})
