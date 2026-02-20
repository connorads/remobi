import { describe, expect, test } from 'bun:test'
import { ConfigValidationError, assertValidConfigOverrides } from '../src/config-validate'

function getValidationMessage(value: unknown): string {
	try {
		assertValidConfigOverrides(value)
		throw new Error('Expected config validation to fail')
	} catch (error) {
		expect(error instanceof ConfigValidationError).toBe(true)
		if (error instanceof Error) {
			return error.message
		}
		return ''
	}
}

describe('assertValidConfigOverrides', () => {
	test('accepts empty config object', () => {
		expect(() => assertValidConfigOverrides({})).not.toThrow()
	})

	test('accepts valid partial config with custom row', () => {
		expect(() =>
			assertValidConfigOverrides({
				toolbar: {
					row1: [
						{
							id: 'esc',
							label: 'Esc',
							description: 'Send Escape',
							action: { type: 'send', data: '\x1b' },
						},
					],
				},
			}),
		).not.toThrow()
	})

	test('rejects unknown root keys', () => {
		const message = getValidationMessage({ mystery: true })
		expect(message).toContain('config.mystery')
		expect(message).toContain('known key')
	})

	test('rejects malformed nested types', () => {
		const message = getValidationMessage({ gestures: { scroll: { strategy: 'mouse' } } })
		expect(message).toContain('config.gestures.scroll.strategy')
		expect(message).toContain("'keys' | 'wheel'")
	})

	test('rejects non-string plugin specifier', () => {
		const message = getValidationMessage({ plugins: ['ok-plugin', 42] })
		expect(message).toContain('config.plugins[1]')
		expect(message).toContain('expected string')
	})

	test('rejects blank plugin specifier', () => {
		const message = getValidationMessage({ plugins: ['   '] })
		expect(message).toContain('config.plugins[0]')
		expect(message).toContain('non-empty plugin specifier')
	})

	test('rejects plugin specifier with surrounding whitespace', () => {
		const message = getValidationMessage({ plugins: [' ./plugins/logger.ts '] })
		expect(message).toContain('config.plugins[0]')
		expect(message).toContain('trimmed plugin specifier')
	})

	test('rejects plugin specifier with newline', () => {
		const message = getValidationMessage({ plugins: ['bad\nplugin'] })
		expect(message).toContain('config.plugins[0]')
		expect(message).toContain('single-line plugin specifier')
	})

	test('rejects invalid toolbar button shape', () => {
		const message = getValidationMessage({
			toolbar: {
				row1: [{ id: 'only-id' }],
			},
		})
		expect(message).toContain('config.toolbar.row1[0].label')
		expect(message).toContain('config.toolbar.row1[0].description')
		expect(message).toContain('config.toolbar.row1[0].action')
	})

	test('rejects non-send action payload fields', () => {
		const message = getValidationMessage({
			drawer: {
				buttons: [
					{
						id: 'paste',
						label: 'Paste',
						description: 'Paste text',
						action: { type: 'paste', data: 'x' },
					},
				],
			},
		})
		expect(message).toContain('config.drawer.buttons[0].action.data')
		expect(message).toContain('undefined for non-send actions')
	})
})
