import { describe, expect, test } from 'vitest'
import {
	buildSecurityHeaders,
	describeCommandForLogs,
	isAllowedOrigin,
	isLoopbackHost,
	parseHostHeader,
	resolveRequestAuthority,
	withSecurityHeaders,
} from '../src/serve'

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

describe('isAllowedOrigin', () => {
	test('allows matching origin and host', () => {
		expect(isAllowedOrigin('https://term.example.ts.net', 'term.example.ts.net')).toBe(true)
		expect(isAllowedOrigin('http://localhost:7681', 'localhost:7681')).toBe(true)
		expect(isAllowedOrigin('https://[fd7a:115c:a1e0::1]:8443', '[fd7a:115c:a1e0::1]:8443')).toBe(
			true,
		)
	})

	test('rejects mismatched or invalid origins', () => {
		expect(isAllowedOrigin('https://evil.example', 'localhost:7681')).toBe(false)
		expect(isAllowedOrigin('not a url', 'localhost:7681')).toBe(false)
		expect(isAllowedOrigin('https://term.example.ts.net', undefined)).toBe(false)
	})

	test('allows requests without an origin header on loopback', () => {
		expect(isAllowedOrigin(undefined, 'localhost:7681')).toBe(true)
		expect(isAllowedOrigin(undefined, '127.0.0.1:7681')).toBe(true)
	})

	test('rejects requests without an origin header on non-loopback', () => {
		expect(isAllowedOrigin(undefined, 'term.example.ts.net')).toBe(false)
		expect(isAllowedOrigin(undefined, '0.0.0.0:7681')).toBe(false)
		expect(isAllowedOrigin(undefined, undefined)).toBe(false)
	})
})

describe('parseHostHeader', () => {
	test('accepts plain hosts and host:port authorities', () => {
		expect(parseHostHeader('term.example.ts.net')).toBe('term.example.ts.net')
		expect(parseHostHeader('localhost:7681')).toBe('localhost:7681')
		expect(parseHostHeader('[::1]:7681')).toBe('[::1]:7681')
	})

	test('rejects malformed host headers', () => {
		expect(parseHostHeader(undefined)).toBeNull()
		expect(parseHostHeader('')).toBeNull()
		expect(parseHostHeader('bad host')).toBeNull()
		expect(parseHostHeader('evil.example/path')).toBeNull()
		expect(parseHostHeader('::1:7681')).toBeNull()
		expect(parseHostHeader('localhost:not-a-port')).toBeNull()
	})
})

describe('resolveRequestAuthority', () => {
	test('prefers the request host over the backend listen address', () => {
		expect(resolveRequestAuthority('127.0.0.1:19000', '127.0.0.1', 17685)).toBe('127.0.0.1:19000')
	})

	test('falls back to the listen host when the request host is missing or invalid', () => {
		expect(resolveRequestAuthority(undefined, '127.0.0.1', 17685)).toBe('127.0.0.1:17685')
		expect(resolveRequestAuthority('bad host', '127.0.0.1', 17685)).toBe('127.0.0.1:17685')
		expect(resolveRequestAuthority(undefined, '::1', 17685)).toBe('[::1]:17685')
	})
})

describe('buildSecurityHeaders', () => {
	test('scopes connect-src to the browser-facing request host:port', () => {
		const headers = buildSecurityHeaders('127.0.0.1:19000', '127.0.0.1', 17685, 'nonce-123')
		const csp = headers['content-security-policy']
		expect(csp).toContain('ws://127.0.0.1:19000')
		expect(csp).toContain('wss://127.0.0.1:19000')
		expect(csp).toContain("script-src 'self' 'nonce-nonce-123'")
		expect(csp).toContain("style-src 'self' 'unsafe-inline' https:")
		expect(csp).not.toMatch(/\bws:\b(?!\/\/)/)
		expect(csp).not.toMatch(/\bwss:\b(?!\/\/)/)
	})

	test('falls back to the listen host:port when the request host is invalid', () => {
		const headers = buildSecurityHeaders('bad host', '192.168.1.10', 7681, 'nonce-123')
		const csp = headers['content-security-policy']
		expect(csp).toContain('ws://192.168.1.10:7681')
		expect(csp).toContain('wss://192.168.1.10:7681')
	})
})

describe('withSecurityHeaders', () => {
	test('adds hardening headers without dropping existing ones', async () => {
		const securityHeaders = buildSecurityHeaders('127.0.0.1:7681', '127.0.0.1', 7681, 'nonce-123')
		const response = withSecurityHeaders(
			new Response('ok', {
				headers: { 'content-type': 'text/plain' },
				status: 200,
			}),
			securityHeaders,
		)

		expect(response.headers.get('content-type')).toBe('text/plain')
		expect(response.headers.get('x-frame-options')).toBe('DENY')
		expect(response.headers.get('x-content-type-options')).toBe('nosniff')
		expect(response.headers.get('referrer-policy')).toBe('no-referrer')
		expect(response.headers.get('cross-origin-resource-policy')).toBe('same-origin')
		expect(response.headers.get('permissions-policy')).toContain('camera=()')
		expect(response.headers.get('content-security-policy')).toContain("frame-ancestors 'none'")
		expect(response.headers.get('content-security-policy')).toContain(
			"script-src 'self' 'nonce-nonce-123'",
		)
		expect(response.headers.get('content-security-policy')).toContain('ws://127.0.0.1:7681')
		expect(await response.text()).toBe('ok')
	})
})

describe('describeCommandForLogs', () => {
	test('omits argv contents from log output', () => {
		expect(describeCommandForLogs(['bash', '-lc', 'echo secret-token'])).toBe('bash (2 args)')
	})

	test('handles single-word commands', () => {
		expect(describeCommandForLogs(['tmux'])).toBe('tmux')
	})
})
