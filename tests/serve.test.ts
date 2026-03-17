import { describe, expect, test } from 'vitest'
import { defaultConfig } from '../src/config'
import {
	buildProxyRequestHeaders,
	buildTtydArgs,
	isAllowedWebSocketOrigin,
	isLoopbackHost,
	randomInternalPort,
	withSecurityHeaders,
} from '../src/serve'

describe('randomInternalPort', () => {
	test('returns a number in the 19000–19999 range', () => {
		for (let i = 0; i < 50; i++) {
			const port = randomInternalPort()
			expect(port).toBeGreaterThanOrEqual(19000)
			expect(port).toBeLessThan(20000)
		}
	})

	test('returns an integer', () => {
		const port = randomInternalPort()
		expect(Number.isInteger(port)).toBe(true)
	})
})

describe('buildTtydArgs', () => {
	test('includes --writable and binds to 127.0.0.1', () => {
		const args = buildTtydArgs(defaultConfig, 19500, ['tmux'])
		expect(args).toContain('--writable')
		expect(args).toContain('-i')
		expect(args).toContain('127.0.0.1')
	})

	test('sets the internal port', () => {
		const args = buildTtydArgs(defaultConfig, 19123, ['tmux'])
		const portIdx = args.indexOf('--port')
		expect(portIdx).toBeGreaterThan(-1)
		expect(args[portIdx + 1]).toBe('19123')
	})

	test('includes theme as JSON', () => {
		const args = buildTtydArgs(defaultConfig, 19500, ['tmux'])
		const themeArg = args.find((a) => a.startsWith('theme='))
		expect(themeArg).toBeDefined()
		expect(themeArg).toContain(defaultConfig.theme.background)
	})

	test('includes font family', () => {
		const args = buildTtydArgs(defaultConfig, 19500, ['tmux'])
		const fontArg = args.find((a) => a.startsWith('fontFamily='))
		expect(fontArg).toBeDefined()
		expect(fontArg).toContain(defaultConfig.font.family)
	})

	test('appends the command at the end', () => {
		const command = ['tmux', 'new-session', '-A', '-s', 'main']
		const args = buildTtydArgs(defaultConfig, 19500, command)
		const tail = args.slice(-command.length)
		expect(tail).toEqual(command)
	})

	test('includes disableLeaveAlert', () => {
		const args = buildTtydArgs(defaultConfig, 19500, ['tmux'])
		expect(args).toContain('disableLeaveAlert=true')
	})
})

describe('isLoopbackHost', () => {
	test('accepts loopback hosts', () => {
		expect(isLoopbackHost('127.0.0.1')).toBe(true)
		expect(isLoopbackHost('::1')).toBe(true)
		expect(isLoopbackHost('localhost')).toBe(true)
	})

	test('rejects non-loopback hosts', () => {
		expect(isLoopbackHost('0.0.0.0')).toBe(false)
		expect(isLoopbackHost('192.168.1.10')).toBe(false)
	})
})

describe('isAllowedWebSocketOrigin', () => {
	test('allows matching origin and host', () => {
		expect(isAllowedWebSocketOrigin('https://term.example.ts.net', 'term.example.ts.net')).toBe(
			true,
		)
		expect(isAllowedWebSocketOrigin('http://localhost:7681', 'localhost:7681')).toBe(true)
	})

	test('rejects mismatched or invalid origins', () => {
		expect(isAllowedWebSocketOrigin('https://evil.example', 'localhost:7681')).toBe(false)
		expect(isAllowedWebSocketOrigin('not a url', 'localhost:7681')).toBe(false)
		expect(isAllowedWebSocketOrigin('https://term.example.ts.net', undefined)).toBe(false)
	})

	test('allows requests without an origin header on loopback', () => {
		expect(isAllowedWebSocketOrigin(undefined, 'localhost:7681')).toBe(true)
		expect(isAllowedWebSocketOrigin(undefined, '127.0.0.1:7681')).toBe(true)
	})

	test('rejects requests without an origin header on non-loopback', () => {
		expect(isAllowedWebSocketOrigin(undefined, 'term.example.ts.net')).toBe(false)
		expect(isAllowedWebSocketOrigin(undefined, '0.0.0.0:7681')).toBe(false)
		expect(isAllowedWebSocketOrigin(undefined, undefined)).toBe(false)
	})
})

describe('buildProxyRequestHeaders', () => {
	test('strips hop-by-hop and origin headers before proxying to ttyd', () => {
		const source = new Headers({
			host: 'public.example',
			origin: 'https://public.example',
			connection: 'keep-alive',
			'content-length': '42',
			authorization: 'Bearer test',
			'content-type': 'application/json',
		})

		const headers = buildProxyRequestHeaders(source)

		expect(headers.has('host')).toBe(false)
		expect(headers.has('origin')).toBe(false)
		expect(headers.has('connection')).toBe(false)
		expect(headers.has('content-length')).toBe(false)
		expect(headers.get('authorization')).toBe('Bearer test')
		expect(headers.get('content-type')).toBe('application/json')
	})
})

describe('withSecurityHeaders', () => {
	test('adds hardening headers without dropping existing ones', async () => {
		const response = withSecurityHeaders(
			new Response('ok', {
				headers: { 'content-type': 'text/plain' },
				status: 200,
			}),
		)

		expect(response.headers.get('content-type')).toBe('text/plain')
		expect(response.headers.get('x-frame-options')).toBe('DENY')
		expect(response.headers.get('x-content-type-options')).toBe('nosniff')
		expect(response.headers.get('referrer-policy')).toBe('no-referrer')
		expect(response.headers.get('cross-origin-resource-policy')).toBe('same-origin')
		expect(response.headers.get('permissions-policy')).toContain('camera=()')
		expect(response.headers.get('content-security-policy')).toContain("frame-ancestors 'none'")
		expect(response.headers.get('content-security-policy')).toContain(
			"script-src 'self' 'unsafe-inline'",
		)
		expect(await response.text()).toBe('ok')
	})
})
