import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { btn, el, injectStyles } from '../src/util/dom'

beforeEach(() => {
	GlobalRegistrator.register()
})

afterEach(() => {
	GlobalRegistrator.unregister()
})

describe('el', () => {
	test('creates element with tag', () => {
		const div = el('div')
		expect(div.tagName).toBe('DIV')
	})

	test('sets attributes', () => {
		const div = el('div', { id: 'test', class: 'foo' })
		expect(div.id).toBe('test')
		expect(div.className).toBe('foo')
	})

	test('appends string children as text nodes', () => {
		const div = el('div', undefined, 'hello')
		expect(div.textContent).toBe('hello')
	})

	test('appends element children', () => {
		const child = el('span')
		const parent = el('div', undefined, child)
		expect(parent.children).toHaveLength(1)
		expect(parent.children[0]?.tagName).toBe('SPAN')
	})

	test('handles mixed children', () => {
		const span = el('span', undefined, 'inner')
		const div = el('div', undefined, 'text', span)
		expect(div.childNodes).toHaveLength(2)
	})
})

describe('btn', () => {
	test('creates button with label', () => {
		const button = btn('Click me')
		expect(button.tagName).toBe('BUTTON')
		expect(button.textContent).toBe('Click me')
	})

	test('sets aria-label when provided', () => {
		const button = btn('X', 'Close')
		expect(button.getAttribute('aria-label')).toBe('Close')
	})

	test('omits aria-label when not provided', () => {
		const button = btn('OK')
		expect(button.getAttribute('aria-label')).toBeNull()
	})
})

describe('injectStyles', () => {
	test('creates style element in head', () => {
		const css = 'body { color: red; }'
		const style = injectStyles(css)
		expect(style.tagName).toBe('STYLE')
		expect(style.textContent).toBe(css)
		expect(document.head.contains(style)).toBe(true)
	})
})
