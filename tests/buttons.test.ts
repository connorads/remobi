import { describe, expect, test } from 'vitest'
import { defaultRow1, defaultRow2 } from '../src/toolbar/buttons'

describe('defaultRow1', () => {
	test('starts with Esc', () => {
		expect(defaultRow1[0]?.label).toBe('Esc')
		expect(defaultRow1[0]?.action).toEqual({ type: 'send', data: '\x1b' })
	})

	test('has tmux Prefix button', () => {
		const prefix = defaultRow1.find((b) => b.id === 'tmux-prefix')
		expect(prefix).toBeDefined()
		expect(prefix?.action).toEqual({ type: 'send', data: '\x02' })
	})

	test('has S-Tab after Tab', () => {
		const tabIdx = defaultRow1.findIndex((b) => b.label === 'Tab')
		const sTabIdx = defaultRow1.findIndex((b) => b.label === 'S-Tab')
		expect(tabIdx).toBeGreaterThanOrEqual(0)
		expect(sTabIdx).toBe(tabIdx + 1)
		expect(defaultRow1[sTabIdx]?.action).toMatchObject({ type: 'send', data: '\x1b[Z' })
	})

	test('has arrow keys', () => {
		const arrows = defaultRow1.filter(
			(b) =>
				b.action.type === 'send' && b.action.data.startsWith('\x1b[') && b.action.data !== '\x1b[Z',
		)
		expect(arrows).toHaveLength(4)
	})

	test('ends with Enter', () => {
		const last = defaultRow1[defaultRow1.length - 1]
		expect(last?.action).toEqual({ type: 'send', data: '\r' })
	})
})

describe('defaultRow2', () => {
	test('has paste button', () => {
		const paste = defaultRow2.find((b) => b.action.type === 'paste')
		expect(paste).toBeDefined()
		expect(paste?.label).toBe('Paste')
	})

	test('has backspace button', () => {
		const backspace = defaultRow2.find((b) => b.id === 'backspace')
		expect(backspace).toBeDefined()
		expect(backspace?.label).toBe('⌫')
		expect(backspace?.action).toEqual({ type: 'send', data: '\x7f', keyLabel: 'Backspace' })
	})

	test('has drawer-toggle button', () => {
		const toggle = defaultRow2.find((b) => b.action.type === 'drawer-toggle')
		expect(toggle).toBeDefined()
		expect(toggle?.label).toContain('More')
	})

	test('has Alt+Enter button', () => {
		const altEnter = defaultRow2.find((b) => b.id === 'alt-enter')
		expect(altEnter).toBeDefined()
		expect(altEnter?.action).toEqual({ type: 'send', data: '\x1b\r', keyLabel: 'Alt+Enter' })
	})

	test('has C-d button', () => {
		const cd = defaultRow2.find((b) => b.label === 'C-d')
		expect(cd).toBeDefined()
		expect(cd?.action).toEqual({ type: 'send', data: '\x04' })
	})

	test('has Space button', () => {
		const space = defaultRow2.find((b) => b.label === 'Space')
		expect(space).toBeDefined()
		expect(space?.action).toEqual({ type: 'send', data: ' ' })
	})
})
