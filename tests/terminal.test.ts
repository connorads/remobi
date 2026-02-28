import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import type { XTerminal } from '../src/types'
import { waitForTerm } from '../src/util/terminal'

function mockTerminal(): XTerminal {
	return {
		options: { fontSize: 14 },
		input(_data: string, _wasUserInput: boolean) {},
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
	delete window.term
	GlobalRegistrator.unregister()
})

describe('waitForTerm', () => {
	test('resolves immediately when window.term is set', async () => {
		const term = mockTerminal()
		window.term = term
		const result = await waitForTerm()
		expect(result).toBe(term)
	})

	test('resolves when window.term becomes available', async () => {
		const term = mockTerminal()
		setTimeout(() => {
			window.term = term
		}, 150)
		const result = await waitForTerm()
		expect(result).toBe(term)
	})

	test('rejects with descriptive error on timeout', async () => {
		await expect(waitForTerm(2)).rejects.toThrow('waitForTerm: window.term not available after 200ms')
	})
})
