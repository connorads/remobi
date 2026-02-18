import { describe, expect, test } from 'bun:test'
import { createGestureLock, resetLock, tryLock } from '../src/gestures/lock'
import { clampFontSize, touchDistance } from '../src/gestures/pinch'
import { averageY, scrollSeq } from '../src/gestures/scroll'
import { isValidSwipe } from '../src/gestures/swipe'

describe('isValidSwipe', () => {
	const config = { enabled: true, threshold: 80, maxDuration: 400 }

	test('detects right swipe', () => {
		expect(isValidSwipe(100, 10, 200, config)).toBe('right')
	})

	test('detects left swipe', () => {
		expect(isValidSwipe(-100, 10, 200, config)).toBe('left')
	})

	test('rejects swipe below threshold', () => {
		expect(isValidSwipe(50, 10, 200, config)).toBeNull()
	})

	test('rejects swipe that takes too long', () => {
		expect(isValidSwipe(100, 10, 500, config)).toBeNull()
	})

	test('rejects diagonal swipe (dy too large)', () => {
		expect(isValidSwipe(100, 80, 200, config)).toBeNull()
	})

	test('handles zero duration', () => {
		expect(isValidSwipe(100, 0, 0, config)).toBe('right')
	})

	test('respects custom threshold', () => {
		const strict = { enabled: true, threshold: 200, maxDuration: 400 }
		expect(isValidSwipe(150, 10, 200, strict)).toBeNull()
		expect(isValidSwipe(250, 10, 200, strict)).toBe('right')
	})
})

describe('touchDistance', () => {
	test('calculates distance between two points', () => {
		const d = touchDistance({ clientX: 0, clientY: 0 }, { clientX: 3, clientY: 4 })
		expect(d).toBe(5)
	})

	test('handles same point', () => {
		const d = touchDistance({ clientX: 10, clientY: 20 }, { clientX: 10, clientY: 20 })
		expect(d).toBe(0)
	})

	test('handles negative coordinates', () => {
		const d = touchDistance({ clientX: -3, clientY: 0 }, { clientX: 0, clientY: 4 })
		expect(d).toBe(5)
	})
})

describe('clampFontSize', () => {
	test('clamps to minimum', () => {
		expect(clampFontSize(4, [8, 32])).toBe(8)
	})

	test('clamps to maximum', () => {
		expect(clampFontSize(40, [8, 32])).toBe(32)
	})

	test('passes through values in range', () => {
		expect(clampFontSize(16, [8, 32])).toBe(16)
	})

	test('handles boundary values', () => {
		expect(clampFontSize(8, [8, 32])).toBe(8)
		expect(clampFontSize(32, [8, 32])).toBe(32)
	})
})

describe('createGestureLock', () => {
	test('starts unclaimed', () => {
		const lock = createGestureLock()
		expect(lock.current).toBe('none')
	})
})

describe('tryLock', () => {
	test('claims when unclaimed', () => {
		const lock = createGestureLock()
		expect(tryLock(lock, 'scroll')).toBe(true)
		expect(lock.current).toBe('scroll')
	})

	test('rejects when already claimed', () => {
		const lock = createGestureLock()
		tryLock(lock, 'scroll')
		expect(tryLock(lock, 'pinch')).toBe(false)
		expect(lock.current).toBe('scroll')
	})

	test('rejects same type when already claimed', () => {
		const lock = createGestureLock()
		tryLock(lock, 'pinch')
		expect(tryLock(lock, 'pinch')).toBe(false)
	})
})

describe('resetLock', () => {
	test('clears to none', () => {
		const lock = createGestureLock()
		tryLock(lock, 'scroll')
		resetLock(lock)
		expect(lock.current).toBe('none')
	})

	test('allows re-claim after reset', () => {
		const lock = createGestureLock()
		tryLock(lock, 'scroll')
		resetLock(lock)
		expect(tryLock(lock, 'pinch')).toBe(true)
		expect(lock.current).toBe('pinch')
	})
})

describe('averageY', () => {
	test('calculates average of two Y values', () => {
		expect(averageY({ clientY: 100 }, { clientY: 200 })).toBe(150)
	})

	test('handles equal values', () => {
		expect(averageY({ clientY: 50 }, { clientY: 50 })).toBe(50)
	})

	test('handles negative values', () => {
		expect(averageY({ clientY: -10 }, { clientY: 30 })).toBe(10)
	})
})

describe('scrollSeq', () => {
	test('returns SGR mouse wheel up sequence', () => {
		expect(scrollSeq('up')).toBe('\x1b[<64;1;1M')
	})

	test('returns SGR mouse wheel down sequence', () => {
		expect(scrollSeq('down')).toBe('\x1b[<65;1;1M')
	})

	test('uses natural scroll direction (negative delta → down)', async () => {
		// Fingers up → negative accDelta → 'down' (content scrolls up, showing history)
		const { readFileSync } = await import('node:fs')
		const { resolve } = await import('node:path')
		const source = readFileSync(resolve(import.meta.dir, '../src/gestures/scroll.ts'), 'utf-8')
		expect(source).toContain("accDelta < 0 ? 'down' : 'up'")
	})

	test('source uses \\x3c instead of literal < in SGR sequences', async () => {
		const { readFileSync } = await import('node:fs')
		const { resolve } = await import('node:path')
		const source = readFileSync(resolve(import.meta.dir, '../src/gestures/scroll.ts'), 'utf-8')
		// Source must use \x3c (hex escape) not literal < in SGR sequences
		// to avoid breaking HTML parsing when bundled into inline <script>
		expect(source).toContain('\\x3c64;1;1M')
		expect(source).toContain('\\x3c65;1;1M')
	})
})
