import { describe, expect, test } from 'vitest'
import { bareDocumentRoute, documentRoute, joinBasePath, normalizeBasePath } from '../src/base-path'

describe('normalizeBasePath', () => {
	test('accepts root and trims trailing slash for nested paths', () => {
		expect(normalizeBasePath('/')).toBe('/')
		expect(normalizeBasePath('/proxy/')).toBe('/proxy')
		expect(normalizeBasePath('/proxy/nested/')).toBe('/proxy/nested')
	})

	test('rejects relative paths, repeated slashes, and URL suffixes', () => {
		expect(normalizeBasePath('proxy')).toBeNull()
		expect(normalizeBasePath('//proxy')).toBeNull()
		expect(normalizeBasePath('/proxy//nested')).toBeNull()
		expect(normalizeBasePath('/proxy?x=1')).toBeNull()
		expect(normalizeBasePath('/proxy#frag')).toBeNull()
	})
})

describe('joinBasePath', () => {
	test('leaves root paths unchanged', () => {
		expect(joinBasePath('/', '/ws')).toBe('/ws')
		expect(joinBasePath('/', '/')).toBe('/')
	})

	test('prefixes nested base paths', () => {
		expect(joinBasePath('/proxy', '/ws')).toBe('/proxy/ws')
		expect(joinBasePath('/proxy', '/')).toBe('/proxy/')
	})
})

describe('document routes', () => {
	test('uses trailing slash as the canonical document route', () => {
		expect(documentRoute('/')).toBe('/')
		expect(documentRoute('/proxy')).toBe('/proxy/')
	})

	test('exposes the bare route only for nested base paths', () => {
		expect(bareDocumentRoute('/')).toBeNull()
		expect(bareDocumentRoute('/proxy')).toBe('/proxy')
	})
})
