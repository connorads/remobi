import { describe, expect, test } from 'vitest'
import { defaultConfig, defineConfig, mergeConfig, serialiseThemeForTtyd } from '../src/config'

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
		expect(config.gestures.swipe.left).toBe('\x02n')
		expect(config.gestures.swipe.right).toBe('\x02p')
		expect(config.gestures.swipe.leftLabel).toBe('Next tmux window')
		expect(config.gestures.swipe.rightLabel).toBe('Previous tmux window')
		// Pinch defaults preserved
		expect(config.gestures.pinch.enabled).toBe(false)
	})

	test('overrides swipe commands while preserving other swipe defaults', () => {
		const config = defineConfig({
			gestures: { swipe: { left: '\x02]', right: '\x02[' } },
		})
		expect(config.gestures.swipe.left).toBe('\x02]')
		expect(config.gestures.swipe.right).toBe('\x02[')
		// Other swipe defaults preserved
		expect(config.gestures.swipe.enabled).toBe(true)
		expect(config.gestures.swipe.threshold).toBe(80)
		expect(config.gestures.swipe.leftLabel).toBe('Next tmux window')
		expect(config.gestures.swipe.rightLabel).toBe('Previous tmux window')
	})

	test('replaces arrays entirely (toolbar row1)', () => {
		const customRow = [
			{
				id: 'a',
				label: 'A',
				description: 'Send a',
				action: { type: 'send' as const, data: 'a' },
			},
		]
		const config = defineConfig({
			toolbar: { row1: customRow },
		})
		expect(config.toolbar.row1).toEqual(customRow)
		// row2 should still have defaults
		expect(config.toolbar.row2.length).toBeGreaterThan(0)
	})

	test('replaces drawer buttons array', () => {
		const customButtons = [
			{
				id: 'test',
				label: 'Test',
				description: 'Run test command',
				action: { type: 'send' as const, data: '\x02t' },
			},
		]
		const config = defineConfig({
			drawer: { buttons: customButtons },
		})
		expect(config.drawer.buttons).toEqual(customButtons)
	})

	test('sets custom floatingButtons', () => {
		const group = {
			position: 'top-left' as const,
			buttons: [
				{
					id: 'zoom',
					label: 'Zoom',
					description: 'Toggle pane zoom',
					action: { type: 'send' as const, data: '\x02z' },
				},
			],
		}
		const config = defineConfig({ floatingButtons: [group] })
		expect(config.floatingButtons).toEqual([group])
	})

	test('overrides mobile initData while preserving widthThreshold', () => {
		const config = defineConfig({ mobile: { initData: '\x02z' } })
		expect(config.mobile.initData).toBe('\x02z')
		expect(config.mobile.widthThreshold).toBe(768)
	})

	test('overrides name while preserving pwa defaults', () => {
		const config = defineConfig({ name: 'My Terminal' })
		expect(config.name).toBe('My Terminal')
		expect(config.pwa.enabled).toBe(true)
		expect(config.pwa.themeColor).toBe('#1e1e2e')
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

	test('has 7 row2 buttons', () => {
		expect(defaultConfig.toolbar.row2).toHaveLength(7)
	})

	test('has 12 drawer buttons', () => {
		expect(defaultConfig.drawer.buttons).toHaveLength(12)
	})

	test('default drawer uses stock tmux bindings only', () => {
		const byId = new Map(defaultConfig.drawer.buttons.map((button) => [button.id, button]))

		expect(byId.get('tmux-split-vertical')?.action).toEqual({ type: 'send', data: '\x02%' })
		expect(byId.get('tmux-split-horizontal')?.action).toEqual({ type: 'send', data: '\x02"' })
		expect(byId.get('tmux-sessions')?.action).toEqual({ type: 'send', data: '\x02s' })
		expect(byId.get('tmux-windows')?.action).toEqual({ type: 'send', data: '\x02w' })
		expect(byId.get('tmux-copy')?.action).toEqual({ type: 'send', data: '\x02[' })
		expect(byId.get('tmux-help')?.action).toEqual({ type: 'send', data: '\x02?' })
		expect(byId.has('tmux-git')).toBeFalse()
		expect(byId.has('tmux-files')).toBeFalse()
		expect(byId.has('tmux-links')).toBeFalse()
	})

	test('row1 includes S-Tab after Tab', () => {
		const tabIdx = defaultConfig.toolbar.row1.findIndex((b) => b.label === 'Tab')
		const sTabIdx = defaultConfig.toolbar.row1.findIndex((b) => b.label === 'S-Tab')
		expect(sTabIdx).toBe(tabIdx + 1)
	})

	test('row2 has q, Alt+Enter, C-d, More, Paste, Backspace, Space', () => {
		const labels = defaultConfig.toolbar.row2.map((b) => b.label)
		expect(labels).toEqual(['q', 'M-↵', 'C-d', '\u2630 More', 'Paste', '⌫', 'Space'])
	})

	test('font size range is [8, 32]', () => {
		expect(defaultConfig.font.sizeRange).toEqual([8, 32])
	})

	test('mobile defaults to null initData and 768 widthThreshold', () => {
		expect(defaultConfig.mobile.initData).toBeNull()
		expect(defaultConfig.mobile.widthThreshold).toBe(768)
	})

	test('defaults to empty floatingButtons groups', () => {
		expect(defaultConfig.floatingButtons).toEqual([])
	})

	test('has default name', () => {
		expect(defaultConfig.name).toBe('webmux')
	})

	test('has default pwa config', () => {
		expect(defaultConfig.pwa.enabled).toBe(true)
		expect(defaultConfig.pwa.themeColor).toBe('#1e1e2e')
	})

	test('swipe defaults to tmux next/prev window', () => {
		expect(defaultConfig.gestures.swipe.left).toBe('\x02n')
		expect(defaultConfig.gestures.swipe.right).toBe('\x02p')
		expect(defaultConfig.gestures.swipe.leftLabel).toBe('Next tmux window')
		expect(defaultConfig.gestures.swipe.rightLabel).toBe('Previous tmux window')
	})
})

describe('defineConfig with ButtonArrayInput', () => {
	test('plain array replaces toolbar row1', () => {
		const custom = [
			{ id: 'x', label: 'X', description: 'X', action: { type: 'send' as const, data: 'x' } },
		]
		const config = defineConfig({ toolbar: { row1: custom } })
		expect(config.toolbar.row1).toEqual(custom)
		// row2 preserved
		expect(config.toolbar.row2.length).toBeGreaterThan(0)
	})

	test('function form transforms toolbar row2', () => {
		const config = defineConfig({
			toolbar: { row2: (defaults) => defaults.filter((b) => b.id !== 'q') },
		})
		expect(config.toolbar.row2.find((b) => b.id === 'q')).toBeUndefined()
		expect(config.toolbar.row2.length).toBe(defaultConfig.toolbar.row2.length - 1)
	})

	test('function form appends to toolbar row1', () => {
		const extra = {
			id: 'x',
			label: 'X',
			description: 'X',
			action: { type: 'send' as const, data: 'x' },
		}
		const config = defineConfig({ toolbar: { row1: (defaults) => [...defaults, extra] } })
		expect(config.toolbar.row1).toHaveLength(defaultConfig.toolbar.row1.length + 1)
		expect(config.toolbar.row1[config.toolbar.row1.length - 1]).toEqual(extra)
	})

	test('function form prepends to toolbar row2', () => {
		const extra = {
			id: 'x',
			label: 'X',
			description: 'X',
			action: { type: 'send' as const, data: 'x' },
		}
		const config = defineConfig({ toolbar: { row2: (defaults) => [extra, ...defaults] } })
		expect(config.toolbar.row2[0]).toEqual(extra)
	})

	test('function form removes from toolbar row1', () => {
		const config = defineConfig({
			toolbar: { row1: (defaults) => defaults.filter((b) => b.id !== 'esc') },
		})
		expect(config.toolbar.row1.find((b) => b.id === 'esc')).toBeUndefined()
		expect(config.toolbar.row1.length).toBe(defaultConfig.toolbar.row1.length - 1)
	})

	test('function form replaces in toolbar row1', () => {
		const config = defineConfig({
			toolbar: {
				row1: (defaults) =>
					defaults.map((b) =>
						b.id === 'esc'
							? { ...b, label: 'ESC2', action: { type: 'send' as const, data: '\x1b\x1b' } }
							: b,
					),
			},
		})
		const esc = config.toolbar.row1.find((b) => b.id === 'esc')
		expect(esc?.label).toBe('ESC2')
	})

	test('drawer function form', () => {
		const config = defineConfig({
			drawer: { buttons: (defaults) => defaults.slice(0, 3) },
		})
		expect(config.drawer.buttons).toHaveLength(3)
	})
})

describe('mergeConfig', () => {
	test('merges overrides against a non-default base config', () => {
		const base = defineConfig({ name: 'base' })
		const result = mergeConfig(base, { name: 'merged' })
		expect(result.name).toBe('merged')
		// Toolbar preserved from base
		expect(result.toolbar.row1).toEqual(base.toolbar.row1)
	})

	test('function resolves against base buttons, not defaults', () => {
		const custom = [
			{ id: 'x', label: 'X', description: 'X', action: { type: 'send' as const, data: 'x' } },
			{ id: 'y', label: 'Y', description: 'Y', action: { type: 'send' as const, data: 'y' } },
		]
		const base = defineConfig({ toolbar: { row1: custom } })
		const result = mergeConfig(base, {
			toolbar: { row1: (defaults) => defaults.filter((b) => b.id !== 'x') },
		})
		expect(result.toolbar.row1).toHaveLength(1)
		expect(result.toolbar.row1[0]?.id).toBe('y')
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
