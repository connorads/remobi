import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { defaultConfig } from '../src/config'
import { createScrollButtons } from '../src/controls/scroll-buttons'
import type { XTerminal } from '../src/types'

function mockTerminal(): XTerminal & { sent: string[] } {
	const sent: string[] = []
	return {
		sent,
		cols: 80,
		rows: 24,
		options: { fontSize: 14 },
		input(data: string, _wasUserInput: boolean) {
			sent.push(data)
		},
		focus() {},
		onData(_handler: (data: string) => void) {
			return { dispose() {} }
		},
	}
}

beforeEach(() => {
	GlobalRegistrator.register()
})

afterEach(() => {
	GlobalRegistrator.unregister()
})

describe('createScrollButtons', () => {
	test('creates container with correct id', () => {
		const term = mockTerminal()
		const { element } = createScrollButtons(term, defaultConfig.gestures.scroll)
		expect(element.id).toBe('wt-scroll-buttons')
	})

	test('has two buttons', () => {
		const term = mockTerminal()
		const { element } = createScrollButtons(term, defaultConfig.gestures.scroll)
		const buttons = element.querySelectorAll('button')
		expect(buttons).toHaveLength(2)
	})

	test('buttons have aria-labels', () => {
		const term = mockTerminal()
		const { element } = createScrollButtons(term, defaultConfig.gestures.scroll)
		const buttons = element.querySelectorAll('button')
		expect(buttons[0]?.getAttribute('aria-label')).toBe('Page Up')
		expect(buttons[1]?.getAttribute('aria-label')).toBe('Page Down')
	})

	test('buttons have correct symbols', () => {
		const term = mockTerminal()
		const { element } = createScrollButtons(term, defaultConfig.gestures.scroll)
		const buttons = element.querySelectorAll('button')
		expect(buttons[0]?.textContent).toBe('\u25B2')
		expect(buttons[1]?.textContent).toBe('\u25BC')
	})

	test('click sends wheel-up sequence by default', () => {
		const term = mockTerminal()
		const { element } = createScrollButtons(term, defaultConfig.gestures.scroll)
		document.body.appendChild(element)

		const upBtn = element.querySelectorAll('button')[0]
		upBtn?.click()

		expect(term.sent).toHaveLength(1)
		expect(term.sent[0]).toBe('\x1b[<64;40;12M')
	})

	test('click sends wheel-down sequence by default', () => {
		const term = mockTerminal()
		const { element } = createScrollButtons(term, defaultConfig.gestures.scroll)
		document.body.appendChild(element)

		const downBtn = element.querySelectorAll('button')[1]
		downBtn?.click()

		expect(term.sent).toHaveLength(1)
		expect(term.sent[0]).toBe('\x1b[<65;40;12M')
	})

	test('keys strategy sends page keys', () => {
		const term = mockTerminal()
		const { element } = createScrollButtons(term, {
			enabled: true,
			sensitivity: 40,
			strategy: 'keys',
			wheelIntervalMs: 24,
		})
		document.body.appendChild(element)

		const buttons = element.querySelectorAll('button')
		buttons[0]?.click()
		buttons[1]?.click()

		expect(term.sent).toEqual(['\x1b[5~', '\x1b[6~'])
	})
})
