import { createServer, request as httpRequest } from 'node:http'
import { type Socket, connect } from 'node:net'
import { expect, test } from '@playwright/test'
import { reservePort, startIsolatedServe, waitForHttp } from './isolated-serve'

function rewriteProxyPath(requestUrl: string | undefined, basePath: string): string | null {
	const path = requestUrl ?? '/'
	if (basePath === '/') {
		return path
	}
	if (path === basePath || path === `${basePath}/`) {
		return path
	}
	if (!path.startsWith(`${basePath}/`)) {
		return null
	}
	return path
}

async function createReverseProxy(
	backendPort: number,
	proxyPort: number,
	basePath = '/',
): Promise<{ close(): Promise<void> }> {
	const sockets = new Set<Socket>()
	const server = createServer((request, response) => {
		const upstreamPath = rewriteProxyPath(request.url, basePath)
		if (upstreamPath === null) {
			response.statusCode = 404
			response.end('not found')
			return
		}

		const upstream = httpRequest(
			{
				hostname: '127.0.0.1',
				port: backendPort,
				path: upstreamPath,
				method: request.method,
				headers: request.headers,
			},
			(upstreamResponse) => {
				response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers)
				upstreamResponse.pipe(response)
			},
		)

		upstream.on('error', (error) => {
			response.statusCode = 502
			response.end(`proxy error: ${error.message}`)
		})

		request.pipe(upstream)
	})
	server.on('connection', (socket) => {
		sockets.add(socket)
		socket.on('close', () => {
			sockets.delete(socket)
		})
	})

	server.on('upgrade', (request, socket, head) => {
		const upstreamPath = rewriteProxyPath(request.url, basePath)
		if (upstreamPath === null) {
			socket.destroy()
			return
		}

		const upstreamSocket = connect(backendPort, '127.0.0.1', () => {
			const headerLines = Object.entries(request.headers).flatMap(([name, value]) => {
				if (typeof value === 'string') {
					return [`${name}: ${value}`]
				}
				if (Array.isArray(value)) {
					return value.map((entry) => `${name}: ${entry}`)
				}
				return []
			})
			const handshake = [
				`${request.method ?? 'GET'} ${upstreamPath} HTTP/${request.httpVersion}`,
				...headerLines,
				'',
				'',
			].join('\r\n')

			upstreamSocket.write(handshake)
			if (head.length > 0) {
				upstreamSocket.write(head)
			}
			socket.pipe(upstreamSocket).pipe(socket)
		})

		upstreamSocket.on('error', () => {
			socket.destroy()
		})
		socket.on('error', () => {
			upstreamSocket.destroy()
		})
	})

	await new Promise<void>((resolve, reject) => {
		server.once('error', reject)
		server.listen(proxyPort, '127.0.0.1', () => resolve())
	})

	return {
		close(): Promise<void> {
			return new Promise((resolve, reject) => {
				for (const socket of sockets) {
					socket.destroy()
				}
				server.close((error) => {
					if (error) {
						reject(error)
						return
					}
					resolve()
				})
			})
		},
	}
}

test('reverse-proxied subpath access uses request-scoped CSP and a live websocket', async ({
	page,
}) => {
	const proxyPort = await reservePort()
	const basePath = '/random-token'
	const backend = await startIsolatedServe({ basePath })

	const proxy = await createReverseProxy(backend.port, proxyPort, basePath)
	const consoleErrors: string[] = []
	page.on('console', (message) => {
		if (message.type() === 'error') {
			consoleErrors.push(message.text())
		}
	})

	try {
		await waitForHttp(`http://127.0.0.1:${proxyPort}${basePath}`)

		const response = await page.goto(`http://127.0.0.1:${proxyPort}${basePath}`)
		expect(response).not.toBeNull()
		const csp = response?.headers()['content-security-policy'] ?? ''
		expect(page.url()).toBe(`http://127.0.0.1:${proxyPort}${basePath}/`)
		expect(csp).toContain(`ws://127.0.0.1:${proxyPort}`)
		expect(csp).toContain(`wss://127.0.0.1:${proxyPort}`)
		expect(csp).not.toContain(`ws://127.0.0.1:${backend.port}`)

		await page.waitForSelector('#terminal .xterm', { timeout: 10_000 })
		await expect.poll(() => page.evaluate(() => window.__remobiSockets?.[0]?.readyState)).toBe(1)

		await page.evaluate(() => {
			window.term?.input('printf "proxy-smoke\\n"\r', true)
		})

		await expect(page.locator('body')).toContainText('proxy-smoke')
		expect(consoleErrors).toEqual([])
	} finally {
		await proxy.close()
		await backend.close()
	}
})
