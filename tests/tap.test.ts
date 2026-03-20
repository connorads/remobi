import { beforeEach, describe, expect, test, vi } from 'vitest'
import { _resetTouchGuard, onTap } from '../src/util/tap'

describe('onTap', () => {
	beforeEach(() => {
		_resetTouchGuard()
	})

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

	test('touchend does not call preventDefault', () => {
		const element = document.createElement('button')
		onTap(element, () => {})
		const event = new TouchEvent('touchend')
		element.dispatchEvent(event)
		expect(event.defaultPrevented).toBe(false)
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

	test('touchend on element A suppresses click on element B', () => {
		const a = document.createElement('button')
		const b = document.createElement('button')
		const handlerA = vi.fn()
		const handlerB = vi.fn()
		onTap(a, handlerA)
		onTap(b, handlerB)

		a.dispatchEvent(new TouchEvent('touchend'))
		b.dispatchEvent(new Event('click'))

		expect(handlerA).toHaveBeenCalledOnce()
		expect(handlerB).not.toHaveBeenCalled()
	})

	test('cross-element click works after guard timeout', () => {
		vi.useFakeTimers()
		const a = document.createElement('button')
		const b = document.createElement('button')
		const handlerA = vi.fn()
		const handlerB = vi.fn()
		onTap(a, handlerA)
		onTap(b, handlerB)

		a.dispatchEvent(new TouchEvent('touchend'))
		vi.advanceTimersByTime(400)
		b.dispatchEvent(new Event('click'))

		expect(handlerB).toHaveBeenCalledOnce()

		vi.useRealTimers()
	})
})
