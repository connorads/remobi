import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import type { XTerminal } from '../src/types'
import { conditionalFocus, isKeyboardOpen } from '../src/util/keyboard'

function mockTerminal(): XTerminal & { focused: boolean } {
	return {
		options: { fontSize: 14 },
		input(_data: string, _wasUserInput: boolean) {},
		focus() {
			this.focused = true
		},
		onData(_handler: (data: string) => void) {
			return { dispose() {} }
		},
		focused: false,
	}
}

beforeEach(() => {
	GlobalRegistrator.register()
})

afterEach(() => {
	GlobalRegistrator.unregister()
})

describe('isKeyboardOpen', () => {
	test('returns false when visualViewport is not available', () => {
		// happy-dom does not provide visualViewport by default
		expect(isKeyboardOpen()).toBe(false)
	})

	test('returns false when viewport height matches innerHeight', () => {
		Object.defineProperty(window, 'visualViewport', {
			value: { height: window.innerHeight },
			writable: true,
			configurable: true,
		})
		expect(isKeyboardOpen()).toBe(false)
	})

	test('returns true when viewport gap exceeds threshold', () => {
		Object.defineProperty(window, 'innerHeight', {
			value: 800,
			writable: true,
			configurable: true,
		})
		Object.defineProperty(window, 'visualViewport', {
			value: { height: 400 },
			writable: true,
			configurable: true,
		})
		expect(isKeyboardOpen()).toBe(true)
	})
})

describe('conditionalFocus', () => {
	test('focuses terminal when keyboard was open', () => {
		const term = mockTerminal()
		conditionalFocus(term, true)
		expect(term.focused).toBe(true)
	})

	test('does not focus terminal when keyboard was closed', () => {
		const term = mockTerminal()
		conditionalFocus(term, false)
		expect(term.focused).toBe(false)
	})
})
