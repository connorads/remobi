import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { haptic } from '../src/util/haptic'

beforeEach(() => {
	GlobalRegistrator.register()
})

afterEach(() => {
	GlobalRegistrator.unregister()
})

describe('haptic', () => {
	test('calls navigator.vibrate(10) when API available', () => {
		let vibrateArg: number | undefined
		Object.defineProperty(navigator, 'vibrate', {
			value: (ms: number) => {
				vibrateArg = ms
				return true
			},
			configurable: true,
		})

		haptic()
		expect(vibrateArg).toBe(10)
	})

	test('no-op when vibrate is absent', () => {
		Object.defineProperty(navigator, 'vibrate', {
			value: undefined,
			configurable: true,
		})

		// Should not throw
		expect(() => haptic()).not.toThrow()
	})
})
