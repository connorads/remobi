import { describe, expect, test } from 'vitest'
import { parseComboInput } from '../src/controls/combo-picker'

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
