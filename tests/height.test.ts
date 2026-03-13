import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { lockDocumentHeight, viewportHeight } from '../src/viewport/height'
import { checkLandscapeKeyboard } from '../src/viewport/landscape'

beforeEach(() => {
	GlobalRegistrator.register()
})

afterEach(() => {
	GlobalRegistrator.unregister()
})

describe('checkLandscapeKeyboard', () => {
	function makeToolbar(): HTMLDivElement {
		const toolbar = document.createElement('div')
		document.body.appendChild(toolbar)
		return toolbar
	}

	test('adds wt-kb-open class when keyboard open in landscape', () => {
		Object.defineProperty(window, 'innerHeight', {
			value: 400,
			writable: true,
			configurable: true,
		})
		Object.defineProperty(window, 'innerWidth', {
			value: 800,
			writable: true,
			configurable: true,
		})
		Object.defineProperty(window, 'visualViewport', {
			value: { height: 200 },
			writable: true,
			configurable: true,
		})

		const toolbar = makeToolbar()
		checkLandscapeKeyboard(toolbar)
		expect(toolbar.classList.contains('wt-kb-open')).toBe(true)
	})

	test('removes class when keyboard closed', () => {
		Object.defineProperty(window, 'innerHeight', {
			value: 400,
			writable: true,
			configurable: true,
		})
		Object.defineProperty(window, 'innerWidth', {
			value: 800,
			writable: true,
			configurable: true,
		})
		Object.defineProperty(window, 'visualViewport', {
			value: { height: 390 },
			writable: true,
			configurable: true,
		})

		const toolbar = makeToolbar()
		toolbar.classList.add('wt-kb-open')
		checkLandscapeKeyboard(toolbar)
		expect(toolbar.classList.contains('wt-kb-open')).toBe(false)
	})

	test('removes class in portrait even if keyboard open', () => {
		Object.defineProperty(window, 'innerHeight', {
			value: 800,
			writable: true,
			configurable: true,
		})
		Object.defineProperty(window, 'innerWidth', {
			value: 400,
			writable: true,
			configurable: true,
		})
		Object.defineProperty(window, 'visualViewport', {
			value: { height: 400 },
			writable: true,
			configurable: true,
		})

		const toolbar = makeToolbar()
		toolbar.classList.add('wt-kb-open')
		checkLandscapeKeyboard(toolbar)
		expect(toolbar.classList.contains('wt-kb-open')).toBe(false)
	})

	test('no-op when visualViewport is null', () => {
		Object.defineProperty(window, 'visualViewport', {
			value: null,
			writable: true,
			configurable: true,
		})

		const toolbar = makeToolbar()
		toolbar.classList.add('wt-kb-open')
		checkLandscapeKeyboard(toolbar)
		// Class untouched — function returned early
		expect(toolbar.classList.contains('wt-kb-open')).toBe(true)
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
