import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { waitForTerm } from '../src/util/terminal'
import { mockTerminal } from './fixtures'

beforeEach(() => {
	GlobalRegistrator.register()
})

afterEach(() => {
	window.term = undefined
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
		await expect(waitForTerm(2)).rejects.toThrow(
			'waitForTerm: window.term not available after 200ms',
		)
	})
})
