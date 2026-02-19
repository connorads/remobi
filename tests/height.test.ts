import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { lockDocumentHeight, viewportHeight } from '../src/viewport/height'
import { checkLandscapeKeyboard } from '../src/viewport/landscape'

beforeEach(() => {
	GlobalRegistrator.register()
})

afterEach(() => {
	GlobalRegistrator.unregister()
})

describe('checkLandscapeKeyboard', () => {
	test('is a function', () => {
		expect(typeof checkLandscapeKeyboard).toBe('function')
	})
})

describe('viewportHeight', () => {
	test('uses visual viewport height plus offsetTop when keyboard is open', () => {
		const vp = { height: 500, offsetTop: 20 }
		expect(viewportHeight(vp, 900, true)).toBe(520)
	})

	test('uses visual viewport height only when keyboard is closed', () => {
		const vp = { height: 500, offsetTop: 20 }
		expect(viewportHeight(vp, 900, false)).toBe(500)
	})

	test('falls back to innerHeight when no visual viewport', () => {
		expect(viewportHeight(null, 900, false)).toBe(900)
	})
})

describe('lockDocumentHeight', () => {
	test('locks document and body styles to prevent page scroll', () => {
		lockDocumentHeight('480px')

		expect(document.documentElement.style.getPropertyValue('height')).toBe('480px')
		expect(document.documentElement.style.getPropertyValue('overflow')).toBe('hidden')
		expect(document.documentElement.style.getPropertyValue('overscroll-behavior')).toBe('none')

		expect(document.body.style.getPropertyValue('height')).toBe('480px')
		expect(document.body.style.getPropertyValue('max-height')).toBe('480px')
		expect(document.body.style.getPropertyValue('overflow')).toBe('hidden')
		expect(document.body.style.getPropertyValue('overscroll-behavior')).toBe('none')
	})
})
