import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { createComboPicker, parseComboInput } from '../src/controls/combo-picker'

beforeEach(() => {
	GlobalRegistrator.register()
})

afterEach(() => {
	GlobalRegistrator.unregister()
})

describe('createComboPicker', () => {
	test('open with custom title and description sets DOM text', () => {
		const picker = createComboPicker()
		document.body.appendChild(picker.element)

		picker.open({
			async sendText() {},
			focusIfNeeded() {},
			title: 'After prefix',
			description: 'Examples: r (reload), c (new window)',
		})

		const title = picker.element.querySelector('h3')
		const desc = picker.element.querySelector('p')
		expect(title?.textContent).toBe('After prefix')
		expect(desc?.textContent).toBe('Examples: r (reload), c (new window)')
	})

	test('open without custom title uses defaults', () => {
		const picker = createComboPicker()
		document.body.appendChild(picker.element)

		picker.open({
			async sendText() {},
			focusIfNeeded() {},
		})

		const title = picker.element.querySelector('h3')
		const desc = picker.element.querySelector('p')
		expect(title?.textContent).toBe('Send combo')
		expect(desc?.textContent).toBe('Examples: C-s, C-[, M-Enter, Alt-x')
	})

	test('close resets title and description to defaults', () => {
		const picker = createComboPicker()
		document.body.appendChild(picker.element)

		picker.open({
			async sendText() {},
			focusIfNeeded() {},
			title: 'Custom',
			description: 'Custom desc',
		})
		picker.close()

		const title = picker.element.querySelector('h3')
		const desc = picker.element.querySelector('p')
		expect(title?.textContent).toBe('Send combo')
		expect(desc?.textContent).toBe('Examples: C-s, C-[, M-Enter, Alt-x')
	})
})

describe('parseComboInput', () => {
	test('parses Ctrl letter combos', () => {
		const parsed = parseComboInput('C-s')
		expect(parsed).toEqual({ ok: true, data: '\x13' })
	})

	test('parses Alt+Enter', () => {
		const parsed = parseComboInput('Alt+Enter')
		expect(parsed).toEqual({ ok: true, data: '\x1b\r' })
	})

	test('parses Ctrl bracket aliases', () => {
		const parsed = parseComboInput('Ctrl-[')
		expect(parsed).toEqual({ ok: true, data: '\x1b' })
	})

	test('parses Ctrl-minus', () => {
		const parsed = parseComboInput('C--')
		expect(parsed).toEqual({ ok: true, data: '\x1f' })
	})

	test('rejects unsupported Ctrl special keys', () => {
		const parsed = parseComboInput('Ctrl-Enter')
		expect(parsed.ok).toBe(false)
	})
})
