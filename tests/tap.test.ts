import { describe, expect, test, vi } from 'vitest'
import { onTap } from '../src/util/tap'

describe('onTap', () => {
	test('fires handler on click', () => {
		const element = document.createElement('button')
		const handler = vi.fn()
		onTap(element, handler)
		element.click()
		expect(handler).toHaveBeenCalledOnce()
	})

	test('fires handler on touchend', () => {
		const element = document.createElement('button')
		const handler = vi.fn()
		onTap(element, handler)
		element.dispatchEvent(new TouchEvent('touchend'))
		expect(handler).toHaveBeenCalledOnce()
	})

	test('does not double-fire when touchend precedes click', () => {
		const element = document.createElement('button')
		const handler = vi.fn()
		onTap(element, handler)
		element.dispatchEvent(new TouchEvent('touchend'))
		element.click()
		expect(handler).toHaveBeenCalledOnce()
	})

	test('click fires again after guard timeout', () => {
		vi.useFakeTimers()
		const element = document.createElement('button')
		const handler = vi.fn()
		onTap(element, handler)

		element.dispatchEvent(new TouchEvent('touchend'))
		expect(handler).toHaveBeenCalledOnce()

		vi.advanceTimersByTime(400)
		element.click()
		expect(handler).toHaveBeenCalledTimes(2)

		vi.useRealTimers()
	})
})
