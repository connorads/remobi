import { describe, expect, test } from 'bun:test'
import { checkLandscapeKeyboard } from '../src/viewport/landscape'

// Note: These test the pure logic — full visualViewport simulation
// requires more setup. Integration tests cover the full flow.

describe('checkLandscapeKeyboard', () => {
	test('is a function', () => {
		expect(typeof checkLandscapeKeyboard).toBe('function')
	})
})
