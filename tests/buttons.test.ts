import { describe, expect, test } from 'bun:test'
import { defaultRow1, defaultRow2 } from '../src/toolbar/buttons'

describe('defaultRow1', () => {
	test('starts with Esc', () => {
		expect(defaultRow1[0]?.label).toBe('Esc')
		expect(defaultRow1[0]?.action).toEqual({ type: 'send', data: '\x1b' })
	})

	test('has Ctrl modifier button', () => {
		const ctrl = defaultRow1.find((b) => b.action.type === 'ctrl-modifier')
		expect(ctrl).toBeDefined()
		expect(ctrl?.label).toBe('Ctrl')
	})

	test('has S-Tab after Tab', () => {
		const tabIdx = defaultRow1.findIndex((b) => b.label === 'Tab')
		const sTabIdx = defaultRow1.findIndex((b) => b.label === 'S-Tab')
		expect(tabIdx).toBeGreaterThanOrEqual(0)
		expect(sTabIdx).toBe(tabIdx + 1)
		expect(defaultRow1[sTabIdx]?.action).toEqual({ type: 'send', data: '\x1b[Z' })
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

	test('has drawer-toggle button', () => {
		const toggle = defaultRow2.find((b) => b.action.type === 'drawer-toggle')
		expect(toggle).toBeDefined()
		expect(toggle?.label).toContain('More')
	})

	test('has q button', () => {
		const q = defaultRow2.find((b) => b.label === 'q')
		expect(q).toBeDefined()
		expect(q?.action).toEqual({ type: 'send', data: 'q' })
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
