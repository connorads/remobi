import { describe, expect, test } from 'vitest'
import { defaultDrawerButtons } from '../src/drawer/commands'

describe('defaultDrawerButtons', () => {
	test('has 12 commands', () => {
		expect(defaultDrawerButtons).toHaveLength(12)
	})

	test('all commands have id, label, description, and action', () => {
		for (const cmd of defaultDrawerButtons) {
			expect(cmd.id).toBeTruthy()
			expect(cmd.label).toBeTruthy()
			expect(cmd.description).toBeTruthy()
			expect(cmd.action).toBeTruthy()
		}
	})

	test('all non-scroll send commands start with tmux prefix (Ctrl-b)', () => {
		for (const cmd of defaultDrawerButtons) {
			if (cmd.action.type !== 'send') continue
			if (cmd.label === 'PgUp' || cmd.label === 'PgDn') {
				// Scroll keys are app-level by default for better cross-app compatibility.
				expect(cmd.action.data.startsWith('\x02')).toBe(false)
			} else {
				expect(cmd.action.data.startsWith('\x02')).toBe(true)
			}
		}
	})

	test('includes window management commands', () => {
		const labels = defaultDrawerButtons.map((c) => c.label)
		expect(labels).toContain('+ Win')
		expect(labels).toContain('Split |')
		expect(labels).toContain('Zoom')
		expect(labels).toContain('Kill')
	})

	test('includes navigation commands', () => {
		const labels = defaultDrawerButtons.map((c) => c.label)
		expect(labels).toContain('Sessions')
		expect(labels).toContain('Windows')
	})

	test('uses stock tmux bindings for split/session/window/copy actions', () => {
		const byId = new Map(defaultDrawerButtons.map((button) => [button.id, button]))

		expect(byId.get('tmux-split-vertical')?.action).toEqual({ type: 'send', data: '\x02%' })
		expect(byId.get('tmux-split-horizontal')?.action).toEqual({ type: 'send', data: '\x02"' })
		expect(byId.get('tmux-sessions')?.action).toEqual({ type: 'send', data: '\x02s' })
		expect(byId.get('tmux-windows')?.action).toEqual({ type: 'send', data: '\x02w' })
		expect(byId.get('tmux-copy')?.action).toEqual({ type: 'send', data: '\x02[' })
	})

	test('includes scroll commands', () => {
		const labels = defaultDrawerButtons.map((c) => c.label)
		expect(labels).toContain('PgUp')
		expect(labels).toContain('PgDn')
	})

	test('does not include opinionated popup workflow buttons', () => {
		const ids = defaultDrawerButtons.map((button) => button.id)
		expect(ids).not.toContain('tmux-git')
		expect(ids).not.toContain('tmux-files')
		expect(ids).not.toContain('tmux-links')
	})

	test('includes combo sender command', () => {
		const combo = defaultDrawerButtons.find((button) => button.id === 'combo-picker')
		expect(combo).toBeDefined()
		expect(combo?.action).toEqual({ type: 'combo-picker' })
	})
})
