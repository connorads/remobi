import { describe, expect, test } from 'vitest'
import { createGestureLock, resetLock, tryLock } from '../src/gestures/lock'
import { clampFontSize, touchDistance } from '../src/gestures/pinch'
import {
	averageY,
	pageSeq,
	resolveScrollAction,
	scrollSeq,
	terminalGrid,
	touchToCell,
} from '../src/gestures/scroll'
import { isValidSwipe } from '../src/gestures/swipe'
import { mockTerminal } from './fixtures'

describe('isValidSwipe', () => {
	const config = {
		enabled: true,
		threshold: 80,
		maxDuration: 400,
		left: '\x02n',
		right: '\x02p',
		leftLabel: 'Next tmux window',
		rightLabel: 'Previous tmux window',
	}

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
		const strict = {
			enabled: true,
			threshold: 200,
			maxDuration: 400,
			left: '\x02n',
			right: '\x02p',
			leftLabel: 'Next tmux window',
			rightLabel: 'Previous tmux window',
		}
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
		expect(scrollSeq('up', 12, 8)).toBe('\x1b[<64;12;8M')
	})

	test('returns SGR mouse wheel down sequence', () => {
		expect(scrollSeq('down', 2, 3)).toBe('\x1b[<65;2;3M')
	})
})

describe('pageSeq', () => {
	test('returns page up sequence', () => {
		expect(pageSeq('up')).toBe('\x1b[5~')
	})

	test('returns page down sequence', () => {
		expect(pageSeq('down')).toBe('\x1b[6~')
	})

	test('uses natural scroll direction (negative delta → down)', async () => {
		// Fingers up → negative accDelta → 'down' (content scrolls up, showing history)
		const { readFileSync } = await import('node:fs')
		const { resolve } = await import('node:path')
		const source = readFileSync(resolve(import.meta.dirname, '../src/gestures/scroll.ts'), 'utf-8')
		expect(source).toContain("accDelta < 0 ? 'down' : 'up'")
	})

	test('source uses \\x3c instead of literal < in SGR sequences', async () => {
		const { readFileSync } = await import('node:fs')
		const { resolve } = await import('node:path')
		const source = readFileSync(resolve(import.meta.dirname, '../src/gestures/scroll.ts'), 'utf-8')
		// Source must use \x3c (hex escape) not literal < in SGR sequences
		// to avoid breaking HTML parsing when bundled into inline <script>
		expect(source).toContain('\\x3c${code};${x};${y}M')
	})
})

describe('terminalGrid', () => {
	test('returns cols/rows from terminal when available', () => {
		const term = { ...mockTerminal(), cols: 120, rows: 40 }
		const rect = { width: 800, height: 600 } as DOMRect
		expect(terminalGrid(rect, term)).toEqual({ cols: 120, rows: 40 })
	})

	test('rounds non-integer cols/rows', () => {
		const term = { ...mockTerminal(), cols: 79.6, rows: 23.4 }
		const rect = { width: 800, height: 600 } as DOMRect
		expect(terminalGrid(rect, term)).toEqual({ cols: 80, rows: 23 })
	})

	test('falls back to 80x24 when term has no cols/rows and no measure element', () => {
		const term = mockTerminal()
		const rect = { width: 800, height: 600 } as DOMRect
		expect(terminalGrid(rect, term)).toEqual({ cols: 80, rows: 24 })
	})

	test('falls back to 80x24 when cols/rows are zero', () => {
		const term = { ...mockTerminal(), cols: 0, rows: 0 }
		const rect = { width: 800, height: 600 } as DOMRect
		expect(terminalGrid(rect, term)).toEqual({ cols: 80, rows: 24 })
	})

	test('falls back to 80x24 when char measure element has zero dimensions', () => {
		// happy-dom doesn't compute real layout so getBoundingClientRect returns zeros,
		// which exercises the fallback path rather than the measure element path
		const term = mockTerminal()
		const rect = { width: 800, height: 480 } as DOMRect
		const measure = document.createElement('span')
		measure.className = 'xterm-char-measure-element'
		measure.style.width = '10px'
		measure.style.height = '20px'
		document.body.appendChild(measure)
		const result = terminalGrid(rect, term)
		expect(result.cols).toBeGreaterThan(0)
		expect(result.rows).toBeGreaterThan(0)

		document.body.removeChild(measure)
	})
})

describe('touchToCell', () => {
	function makeScreen(width: number, height: number): HTMLElement {
		const el = document.createElement('div')
		Object.defineProperty(el, 'getBoundingClientRect', {
			value: () => ({
				left: 0,
				top: 0,
				width,
				height,
				right: width,
				bottom: height,
				x: 0,
				y: 0,
				toJSON() {},
			}),
		})
		return el
	}

	function makeTouch(clientX: number, clientY: number): Touch {
		return { clientX, clientY } as Touch
	}

	test('touch at top-left returns cell (1, 1)', () => {
		const screen = makeScreen(800, 480)
		const term = { ...mockTerminal(), cols: 80, rows: 24 }
		expect(touchToCell(makeTouch(0, 0), screen, term)).toEqual({ x: 1, y: 1 })
	})

	test('touch at bottom-right returns cell (cols, rows)', () => {
		const screen = makeScreen(800, 480)
		const term = { ...mockTerminal(), cols: 80, rows: 24 }
		// Touch at the far edge — should map to last cell
		expect(touchToCell(makeTouch(799, 479), screen, term)).toEqual({ x: 80, y: 24 })
	})

	test('touch at centre returns middle cell', () => {
		const screen = makeScreen(800, 480)
		const term = { ...mockTerminal(), cols: 80, rows: 24 }
		const cell = touchToCell(makeTouch(400, 240), screen, term)
		expect(cell.x).toBe(41)
		expect(cell.y).toBe(13)
	})

	test('clamps touch outside screen bounds', () => {
		const screen = makeScreen(800, 480)
		const term = { ...mockTerminal(), cols: 80, rows: 24 }
		// Touch far below/right of screen
		expect(touchToCell(makeTouch(9999, 9999), screen, term)).toEqual({ x: 80, y: 24 })
		// Touch above/left of screen
		expect(touchToCell(makeTouch(-100, -100), screen, term)).toEqual({ x: 1, y: 1 })
	})
})

describe('resolveScrollAction', () => {
	test('keys strategy returns pageSeq for up', () => {
		const action = resolveScrollAction('up', 'keys', { x: 1, y: 1 }, 0, 1000, 50)
		expect(action).toEqual({ type: 'send', seq: '\x1b[5~', newWheelAt: 0 })
	})

	test('keys strategy returns pageSeq for down', () => {
		const action = resolveScrollAction('down', 'keys', { x: 1, y: 1 }, 0, 1000, 50)
		expect(action).toEqual({ type: 'send', seq: '\x1b[6~', newWheelAt: 0 })
	})

	test('keys strategy preserves lastWheelAt unchanged', () => {
		const action = resolveScrollAction('up', 'keys', { x: 1, y: 1 }, 500, 1000, 50)
		expect(action).toEqual({ type: 'send', seq: '\x1b[5~', newWheelAt: 500 })
	})

	test('wheel strategy returns scrollSeq when interval elapsed', () => {
		const action = resolveScrollAction('up', 'wheel', { x: 5, y: 10 }, 0, 1000, 50)
		expect(action).toEqual({
			type: 'send',
			seq: scrollSeq('up', 5, 10),
			newWheelAt: 1000,
		})
	})

	test('wheel strategy skips when rate limited', () => {
		// lastWheelAt=990, now=1000, interval=50 → 10ms < 50ms → skip
		const action = resolveScrollAction('up', 'wheel', { x: 5, y: 10 }, 990, 1000, 50)
		expect(action).toEqual({ type: 'skip' })
	})

	test('wheel strategy sends when exactly at interval boundary', () => {
		// lastWheelAt=950, now=1000, interval=50 → 50ms >= 50ms → send
		const action = resolveScrollAction('up', 'wheel', { x: 1, y: 1 }, 950, 1000, 50)
		expect(action).toEqual({
			type: 'send',
			seq: scrollSeq('up', 1, 1),
			newWheelAt: 1000,
		})
	})

	test('wheel strategy down returns correct sequence', () => {
		const action = resolveScrollAction('down', 'wheel', { x: 3, y: 7 }, 0, 1000, 50)
		expect(action).toEqual({
			type: 'send',
			seq: scrollSeq('down', 3, 7),
			newWheelAt: 1000,
		})
	})
})
