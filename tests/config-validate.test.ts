import { describe, expect, test } from 'bun:test'
import { defaultConfig, defineConfig } from '../src/config'
import {
	ConfigValidationError,
	assertValidConfigOverrides,
	assertValidResolvedConfig,
} from '../src/config-validate'

type Validator = (value: unknown) => void

function getValidationMessage(value: unknown, validate: Validator): string {
	try {
		validate(value)
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
		const message = getValidationMessage({ mystery: true }, assertValidConfigOverrides)
		expect(message).toContain('config.mystery')
		expect(message).toContain('known key')
		expect(message).toContain('received boolean(true)')
	})

	test('rejects malformed nested types', () => {
		const message = getValidationMessage(
			{ gestures: { scroll: { strategy: 'mouse' } } },
			assertValidConfigOverrides,
		)
		expect(message).toContain('config.gestures.scroll.strategy')
		expect(message).toContain("'keys' | 'wheel'")
		expect(message).toContain('received string("mouse")')
	})

	test('rejects non-string plugin specifier', () => {
		const message = getValidationMessage({ plugins: ['ok-plugin', 42] }, assertValidConfigOverrides)
		expect(message).toContain('config.plugins[1]')
		expect(message).toContain('expected string')
		expect(message).toContain('received number(42)')
	})

	test('rejects blank plugin specifier', () => {
		const message = getValidationMessage({ plugins: ['   '] }, assertValidConfigOverrides)
		expect(message).toContain('config.plugins[0]')
		expect(message).toContain('non-empty plugin specifier')
	})

	test('rejects plugin specifier with surrounding whitespace', () => {
		const message = getValidationMessage(
			{ plugins: [' ./plugins/logger.ts '] },
			assertValidConfigOverrides,
		)
		expect(message).toContain('config.plugins[0]')
		expect(message).toContain('trimmed plugin specifier')
	})

	test('rejects plugin specifier with newline', () => {
		const message = getValidationMessage({ plugins: ['bad\nplugin'] }, assertValidConfigOverrides)
		expect(message).toContain('config.plugins[0]')
		expect(message).toContain('single-line plugin specifier')
	})

	test('rejects invalid toolbar button shape', () => {
		const message = getValidationMessage(
			{
				toolbar: {
					row1: [{ id: 'only-id' }],
				},
			},
			assertValidConfigOverrides,
		)
		expect(message).toContain('config.toolbar.row1[0].label')
		expect(message).toContain('config.toolbar.row1[0].description')
		expect(message).toContain('config.toolbar.row1[0].action')
	})

	test('rejects non-send action payload fields', () => {
		const message = getValidationMessage(
			{
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
			},
			assertValidConfigOverrides,
		)
		expect(message).toContain('config.drawer.buttons[0].action.data')
		expect(message).toContain('undefined for non-send actions')
	})
})

describe('assertValidResolvedConfig', () => {
	test('accepts defaultConfig', () => {
		expect(() => assertValidResolvedConfig(defaultConfig)).not.toThrow()
	})

	test('accepts merged config output', () => {
		const merged = defineConfig({ gestures: { scroll: { strategy: 'keys' } } })
		expect(() => assertValidResolvedConfig(merged)).not.toThrow()
	})

	test('rejects missing required root keys', () => {
		const message = getValidationMessage({}, assertValidResolvedConfig)
		expect(message).toContain('config.theme')
		expect(message).toContain('config.font')
		expect(message).toContain('config.plugins')
		expect(message).toContain('received undefined')
	})

	test('rejects missing required nested fields', () => {
		const message = getValidationMessage(
			{
				theme: {},
				font: {
					family: 'JetBrainsMono NFM, monospace',
					cdnUrl:
						'https://cdn.jsdelivr.net/gh/mshaugh/nerdfont-webfonts@latest/build/jetbrainsmono-nfm.css',
					mobileSizeDefault: 16,
					sizeRange: [8, 32],
				},
				plugins: [],
				toolbar: { row1: [], row2: [] },
				drawer: { buttons: [] },
				gestures: {
					swipe: { enabled: true, threshold: 80, maxDuration: 400 },
					pinch: { enabled: false },
					scroll: { enabled: true, sensitivity: 40, strategy: 'wheel', wheelIntervalMs: 24 },
				},
			},
			assertValidResolvedConfig,
		)
		expect(message).toContain('config.theme.background')
		expect(message).toContain('expected string')
		expect(message).toContain('received undefined')
	})
})
