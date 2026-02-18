import { describe, expect, test } from 'bun:test'
import { defaultConfig, defineConfig, serialiseThemeForTtyd } from '../src/config'

describe('defineConfig', () => {
	test('returns default config when called with no args', () => {
		const config = defineConfig()
		expect(config).toEqual(defaultConfig)
	})

	test('overrides font family', () => {
		const config = defineConfig({
			font: { family: 'Monaco, monospace' },
		})
		expect(config.font.family).toBe('Monaco, monospace')
		// Other font defaults preserved
		expect(config.font.mobileSizeDefault).toBe(16)
		expect(config.font.sizeRange).toEqual([8, 32])
	})

	test('overrides nested gesture config', () => {
		const config = defineConfig({
			gestures: { swipe: { threshold: 120 } },
		})
		expect(config.gestures.swipe.threshold).toBe(120)
		// Other swipe defaults preserved
		expect(config.gestures.swipe.enabled).toBe(true)
		expect(config.gestures.swipe.maxDuration).toBe(400)
		// Pinch defaults preserved
		expect(config.gestures.pinch.enabled).toBe(false)
	})

	test('replaces arrays entirely (toolbar row1)', () => {
		const customRow = [{ label: 'A', action: { type: 'send' as const, data: 'a' } }]
		const config = defineConfig({
			toolbar: { row1: customRow },
		})
		expect(config.toolbar.row1).toEqual(customRow)
		// row2 should still have defaults
		expect(config.toolbar.row2.length).toBeGreaterThan(0)
	})

	test('replaces drawer commands array', () => {
		const customCommands = [{ label: 'Test', seq: '\x02t' }]
		const config = defineConfig({
			drawer: { commands: customCommands },
		})
		expect(config.drawer.commands).toEqual(customCommands)
	})
})

describe('defaultConfig', () => {
	test('has catppuccin-mocha theme', () => {
		expect(defaultConfig.theme.background).toBe('#1e1e2e')
		expect(defaultConfig.theme.foreground).toBe('#cdd6f4')
	})

	test('has 10 row1 buttons', () => {
		expect(defaultConfig.toolbar.row1).toHaveLength(10)
	})

	test('has 5 row2 buttons', () => {
		expect(defaultConfig.toolbar.row2).toHaveLength(5)
	})

	test('has 14 drawer commands', () => {
		expect(defaultConfig.drawer.commands).toHaveLength(14)
	})

	test('row1 includes S-Tab after Tab', () => {
		const tabIdx = defaultConfig.toolbar.row1.findIndex((b) => b.label === 'Tab')
		const sTabIdx = defaultConfig.toolbar.row1.findIndex((b) => b.label === 'S-Tab')
		expect(sTabIdx).toBe(tabIdx + 1)
	})

	test('row2 has q, C-d, More, Paste, Space', () => {
		const labels = defaultConfig.toolbar.row2.map((b) => b.label)
		expect(labels).toEqual(['q', 'C-d', '\u2630 More', 'Paste', 'Space'])
	})

	test('font size range is [8, 32]', () => {
		expect(defaultConfig.font.sizeRange).toEqual([8, 32])
	})
})

describe('serialiseThemeForTtyd', () => {
	test('produces valid JSON', () => {
		const json = serialiseThemeForTtyd(defaultConfig)
		const parsed = JSON.parse(json)
		expect(parsed.background).toBe('#1e1e2e')
		expect(parsed.foreground).toBe('#cdd6f4')
	})
})
