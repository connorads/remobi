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

	test('accepts valid partial swipe overrides with left/right', () => {
		expect(() =>
			assertValidConfigOverrides({
				gestures: {
					swipe: { left: '\x02]', right: '\x02[', leftLabel: 'Next pane', rightLabel: 'Prev pane' },
				},
			}),
		).not.toThrow()
	})

	test('rejects non-string swipe left', () => {
		const message = getValidationMessage(
			{ gestures: { swipe: { left: 42 } } },
			assertValidConfigOverrides,
		)
		expect(message).toContain('config.gestures.swipe.left')
		expect(message).toContain('expected string')
	})

	test('rejects non-string swipe rightLabel', () => {
		const message = getValidationMessage(
			{ gestures: { swipe: { rightLabel: true } } },
			assertValidConfigOverrides,
		)
		expect(message).toContain('config.gestures.swipe.rightLabel')
		expect(message).toContain('expected string')
	})

	test('accepts valid partial mobile overrides including null initData', () => {
		expect(() => assertValidConfigOverrides({ mobile: { initData: null } })).not.toThrow()
		expect(() => assertValidConfigOverrides({ mobile: { initData: '\x02z' } })).not.toThrow()
		expect(() => assertValidConfigOverrides({ mobile: { widthThreshold: 480 } })).not.toThrow()
	})

	test('rejects non-string/non-null mobile initData', () => {
		const message = getValidationMessage({ mobile: { initData: 42 } }, assertValidConfigOverrides)
		expect(message).toContain('config.mobile.initData')
		expect(message).toContain('string or null')
	})

	test('accepts valid floatingButtons group array', () => {
		expect(() =>
			assertValidConfigOverrides({
				floatingButtons: [
					{
						position: 'top-left',
						buttons: [
							{
								id: 'zoom',
								label: 'Zoom',
								description: 'Toggle pane zoom',
								action: { type: 'send', data: '\x02z' },
							},
						],
					},
				],
			}),
		).not.toThrow()
	})

	test('accepts floatingButtons group with direction', () => {
		expect(() =>
			assertValidConfigOverrides({
				floatingButtons: [
					{
						position: 'centre-left',
						direction: 'column',
						buttons: [],
					},
				],
			}),
		).not.toThrow()
	})

	test('accepts empty floatingButtons array', () => {
		expect(() => assertValidConfigOverrides({ floatingButtons: [] })).not.toThrow()
	})

	test('rejects non-array floatingButtons', () => {
		const message = getValidationMessage({ floatingButtons: 'bad' }, assertValidConfigOverrides)
		expect(message).toContain('config.floatingButtons')
		expect(message).toContain('array of floating button groups')
	})

	test('rejects floatingButtons group missing position', () => {
		const message = getValidationMessage(
			{ floatingButtons: [{ buttons: [] }] },
			assertValidConfigOverrides,
		)
		expect(message).toContain('config.floatingButtons[0].position')
	})

	test('rejects floatingButtons group with invalid position', () => {
		const message = getValidationMessage(
			{ floatingButtons: [{ position: 'middle', buttons: [] }] },
			assertValidConfigOverrides,
		)
		expect(message).toContain('config.floatingButtons[0].position')
		expect(message).toContain('top-left')
	})

	test('rejects floatingButtons group with invalid direction', () => {
		const message = getValidationMessage(
			{ floatingButtons: [{ position: 'top-left', direction: 'diagonal', buttons: [] }] },
			assertValidConfigOverrides,
		)
		expect(message).toContain('config.floatingButtons[0].direction')
		expect(message).toContain("'row' | 'column'")
	})

	test('rejects floatingButtons group with unknown keys', () => {
		const message = getValidationMessage(
			{ floatingButtons: [{ position: 'top-left', buttons: [], mystery: true }] },
			assertValidConfigOverrides,
		)
		expect(message).toContain('config.floatingButtons[0].mystery')
		expect(message).toContain('known key')
	})

	test('rejects malformed button inside floatingButtons group', () => {
		const message = getValidationMessage(
			{ floatingButtons: [{ position: 'top-left', buttons: [{ id: 'zoom' }] }] },
			assertValidConfigOverrides,
		)
		expect(message).toContain('config.floatingButtons[0].buttons[0].label')
		expect(message).toContain('config.floatingButtons[0].buttons[0].description')
		expect(message).toContain('config.floatingButtons[0].buttons[0].action')
	})

	test('rejects unknown mobile keys', () => {
		const message = getValidationMessage(
			{ mobile: { unknownKey: true } },
			assertValidConfigOverrides,
		)
		expect(message).toContain('config.mobile.unknownKey')
		expect(message).toContain('known key')
	})

	test('accepts valid top-level name override', () => {
		expect(() => assertValidConfigOverrides({ name: 'My Terminal' })).not.toThrow()
	})

	test('rejects non-string top-level name', () => {
		const message = getValidationMessage({ name: 42 }, assertValidConfigOverrides)
		expect(message).toContain('config.name')
		expect(message).toContain('expected string')
	})

	test('accepts valid partial pwa overrides', () => {
		expect(() => assertValidConfigOverrides({ pwa: { shortName: 'wm' } })).not.toThrow()
		expect(() => assertValidConfigOverrides({ pwa: { enabled: false } })).not.toThrow()
		expect(() => assertValidConfigOverrides({ pwa: { themeColor: '#000000' } })).not.toThrow()
	})

	test('rejects pwa.name as unknown key', () => {
		const message = getValidationMessage(
			{ pwa: { name: 'My Terminal' } },
			assertValidConfigOverrides,
		)
		expect(message).toContain('config.pwa.name')
		expect(message).toContain('known key')
	})

	test('rejects non-boolean pwa enabled', () => {
		const message = getValidationMessage({ pwa: { enabled: 'yes' } }, assertValidConfigOverrides)
		expect(message).toContain('config.pwa.enabled')
		expect(message).toContain('expected boolean')
	})

	test('rejects unknown pwa keys', () => {
		const message = getValidationMessage({ pwa: { unknown: true } }, assertValidConfigOverrides)
		expect(message).toContain('config.pwa.unknown')
		expect(message).toContain('known key')
	})

	test('accepts combo-picker actions', () => {
		expect(() =>
			assertValidConfigOverrides({
				drawer: {
					buttons: [
						{
							id: 'combo-picker',
							label: 'Combo',
							description: 'Open combo sender',
							action: { type: 'combo-picker' },
						},
					],
				},
			}),
		).not.toThrow()
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
		expect(message).toContain('config.name')
		expect(message).toContain('config.theme')
		expect(message).toContain('config.font')
		expect(message).toContain('config.plugins')
		expect(message).toContain('config.mobile')
		expect(message).toContain('config.floatingButtons')
		expect(message).toContain('config.pwa')
		expect(message).toMatch(/received undefined/)
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
					swipe: {
						enabled: true,
						threshold: 80,
						maxDuration: 400,
						left: '\x02n',
						right: '\x02p',
						leftLabel: 'Next tmux window',
						rightLabel: 'Previous tmux window',
					},
					pinch: { enabled: false },
					scroll: { enabled: true, sensitivity: 40, strategy: 'wheel', wheelIntervalMs: 24 },
				},
				mobile: { initData: null, widthThreshold: 768 },
				floatingButtons: [],
			},
			assertValidResolvedConfig,
		)
		expect(message).toContain('config.theme.background')
		expect(message).toContain('expected string')
		expect(message).toContain('received undefined')
	})

	test('rejects missing mobile fields in resolved config', () => {
		const message = getValidationMessage(
			{ ...defaultConfig, mobile: { widthThreshold: 768 } },
			assertValidResolvedConfig,
		)
		expect(message).toContain('config.mobile.initData')
		expect(message).toContain('string or null')
	})
})

describe('assertValidConfigOverrides: ButtonArrayInput forms', () => {
	test('accepts function form for toolbar row1', () => {
		expect(() =>
			assertValidConfigOverrides({
				toolbar: { row1: (defaults: unknown) => defaults },
			}),
		).not.toThrow()
	})

	test('accepts function form for drawer buttons', () => {
		expect(() =>
			assertValidConfigOverrides({
				drawer: { buttons: () => [] },
			}),
		).not.toThrow()
	})

	test('rejects object (patch) for toolbar row2', () => {
		const message = getValidationMessage(
			{
				toolbar: {
					row2: {
						append: [
							{
								id: 'x',
								label: 'X',
								description: 'X',
								action: { type: 'send', data: 'x' },
							},
						],
						remove: ['q'],
					},
				},
			},
			assertValidConfigOverrides,
		)
		expect(message).toContain('config.toolbar.row2')
		expect(message).toContain('array or function')
	})

	test('rejects non-array/non-function value', () => {
		const message = getValidationMessage({ toolbar: { row1: 42 } }, assertValidConfigOverrides)
		expect(message).toContain('config.toolbar.row1')
		expect(message).toContain('array or function')
	})
})
