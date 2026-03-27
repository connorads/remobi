import { createServer } from 'node:net'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import WebSocket from 'ws'
import { MAX_CLIENT_MESSAGE_BYTES, parseServerMessage } from '../src/session-protocol'
import { sleep, spawnProcess } from '../src/util/node-compat'

const repoRoot = join(import.meta.dirname, '..')
const runningProcesses: ReturnType<typeof spawnProcess>[] = []

afterEach(async () => {
	while (runningProcesses.length > 0) {
		const proc = runningProcesses.pop()
		if (!proc) continue
		proc.kill('SIGINT')
		await proc.exited.catch(() => 1)
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

		await sleep(100)
	}

	throw new Error(`timed out waiting for ${url}`)
}

function startServe(port: number): ReturnType<typeof spawnProcess> {
	const proc = spawnProcess(
		[
			'tsx',
			join(repoRoot, 'cli.ts'),
			'serve',
			'--port',
			String(port),
			'--',
			'bash',
			'--norc',
			'--noprofile',
		],
		{
			cwd: repoRoot,
			stdin: 'ignore',
			stdout: 'pipe',
			stderr: 'pipe',
		},
	)
	runningProcesses.push(proc)
	return proc
}

async function stopServe(proc: ReturnType<typeof spawnProcess>): Promise<void> {
	const index = runningProcesses.indexOf(proc)
	if (index !== -1) {
		runningProcesses.splice(index, 1)
	}
	proc.kill('SIGINT')
	await proc.exited
}

function openSocket(port: number): Promise<WebSocket> {
	return new Promise((resolve, reject) => {
		const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`, {
			origin: `http://127.0.0.1:${port}`,
		})

		const onError = (error: Error) => {
			cleanup()
			reject(error)
		}
		const onOpen = () => {
			cleanup()
			resolve(ws)
		}
		const cleanup = () => {
			ws.off('error', onError)
			ws.off('open', onOpen)
		}

		ws.on('error', onError)
		ws.on('open', onOpen)
	})
}

function waitForJsonMessage(
	ws: WebSocket,
	timeoutMs = 10_000,
): Promise<ReturnType<typeof parseServerMessage>> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			cleanup()
			reject(new Error('timed out waiting for websocket message'))
		}, timeoutMs)

		const onMessage = (data: WebSocket.RawData) => {
			const payload =
				typeof data === 'string' ? data : Buffer.isBuffer(data) ? data.toString('utf-8') : ''
			const parsed = parseServerMessage(payload)
			if (parsed === null) {
				return
			}
			cleanup()
			resolve(parsed)
		}

		const onClose = () => {
			cleanup()
			reject(new Error('websocket closed before a message arrived'))
		}

		const cleanup = () => {
			clearTimeout(timer)
			ws.off('message', onMessage)
			ws.off('close', onClose)
		}

		ws.on('message', onMessage)
		ws.on('close', onClose)
	})
}

function waitForClose(ws: WebSocket, timeoutMs = 10_000): Promise<number> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			cleanup()
			reject(new Error('timed out waiting for websocket close'))
		}, timeoutMs)

		const onClose = (code: number) => {
			cleanup()
			resolve(code)
		}
		const cleanup = () => {
			clearTimeout(timer)
			ws.off('close', onClose)
		}

		ws.on('close', onClose)
	})
}

describe('serve websocket hardening', () => {
	test('oversized websocket frames are rejected without killing the terminal session', async () => {
		const port = await reservePort()
		const proc = startServe(port)

		try {
			await waitForHttp(`http://127.0.0.1:${port}`)

			const abusiveClient = await openSocket(port)
			await waitForJsonMessage(abusiveClient)
			const closePromise = waitForClose(abusiveClient)
			abusiveClient.send('x'.repeat(MAX_CLIENT_MESSAGE_BYTES + 1))
			expect(await closePromise).toBeGreaterThan(0)

			const healthyClient = await openSocket(port)
			await waitForJsonMessage(healthyClient)
			const responsePromise = waitForJsonMessage(healthyClient)
			healthyClient.send(JSON.stringify({ type: 'ping' }))

			const response = await responsePromise
			expect(response).toEqual({ type: 'pong' })
			healthyClient.close()
		} finally {
			await stopServe(proc)
		}
	})
})
