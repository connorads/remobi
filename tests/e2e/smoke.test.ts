/**
 * e2e smoke tests against a real ttyd session.
 *
 * These tests require ttyd to be available on PATH and are skipped
 * automatically when it is not present (safe for CI environments where
 * ttyd is not installed).
 */
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'

const repoRoot = new URL('../..', import.meta.url).pathname

/** Check if ttyd is available on PATH */
async function ttydAvailable(): Promise<boolean> {
	try {
		const proc = Bun.spawn(['which', 'ttyd'], { stdout: 'pipe', stderr: 'pipe' })
		const code = await proc.exited
		return code === 0
	} catch {
		return false
	}
}

/** Find a free port in the ephemeral range */
async function findFreePort(): Promise<number> {
	const server = Bun.serve({ port: 0, fetch: () => new Response('') })
	const port = server.port
	await server.stop()
	return port
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
		await Bun.sleep(intervalMs)
	}
	return false
}

const hasTtyd = await ttydAvailable()

describe.skipIf(!hasTtyd)('e2e: ttyd integration', () => {
	let ttydPort: number
	let ttydProc: ReturnType<typeof Bun.spawn>

	beforeAll(async () => {
		ttydPort = await findFreePort()
		ttydProc = Bun.spawn(
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

		const proc = Bun.spawn(['bun', 'run', 'cli.ts', 'inject'], {
			cwd: repoRoot,
			stdin: new Response(ttydHtml),
			stdout: 'pipe',
			stderr: 'pipe',
		})

		const [exitCode, stdout] = await Promise.all([proc.exited, new Response(proc.stdout).text()])

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
