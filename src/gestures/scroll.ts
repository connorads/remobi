import type { ScrollConfig, XTerminal } from '../types'
import { sendData } from '../util/terminal'
import type { GestureLock } from './lock'
import { resetLock, tryLock } from './lock'

/** Average Y coordinate of two touches */
export function averageY(t0: { clientY: number }, t1: { clientY: number }): number {
	return (t0.clientY + t1.clientY) / 2
}

/** SGR mouse wheel escape sequence for a given direction */
export function scrollSeq(direction: 'up' | 'down', x: number, y: number): string {
	const code = direction === 'up' ? 64 : 65
	return `\x1b[\x3c${code};${x};${y}M`
}

/** Page navigation key sequence for a given direction */
export function pageSeq(direction: 'up' | 'down'): string {
	return direction === 'up' ? '\x1b[5~' : '\x1b[6~'
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value))
}

export function terminalGrid(screenRect: DOMRect, term: XTerminal): { cols: number; rows: number } {
	const colsFromTerm = term.cols
	const rowsFromTerm = term.rows
	if (typeof colsFromTerm === 'number' && typeof rowsFromTerm === 'number') {
		if (colsFromTerm > 0 && rowsFromTerm > 0) {
			return { cols: Math.round(colsFromTerm), rows: Math.round(rowsFromTerm) }
		}
	}

	const measure = document.querySelector('.xterm-char-measure-element')
	if (measure instanceof HTMLElement) {
		const measureRect = measure.getBoundingClientRect()
		if (measureRect.width > 0 && measureRect.height > 0) {
			const cols = Math.max(1, Math.round(screenRect.width / measureRect.width))
			const rows = Math.max(1, Math.round(screenRect.height / measureRect.height))
			return { cols, rows }
		}
	}

	return { cols: 80, rows: 24 }
}

export function touchToCell(
	touch: Touch,
	screen: HTMLElement,
	term: XTerminal,
): { x: number; y: number } {
	const rect = screen.getBoundingClientRect()
	const { cols, rows } = terminalGrid(rect, term)
	const width = Math.max(1, rect.width)
	const height = Math.max(1, rect.height)
	const relX = clamp(touch.clientX - rect.left, 0, width)
	const relY = clamp(touch.clientY - rect.top, 0, height)
	const x = clamp(Math.floor((relX / width) * cols) + 1, 1, cols)
	const y = clamp(Math.floor((relY / height) * rows) + 1, 1, rows)
	return { x, y }
}

/** Result of deciding what scroll action to take */
type ScrollAction =
	| { readonly type: 'send'; readonly seq: string; readonly newWheelAt: number }
	| { readonly type: 'skip' }

/** Pure decision: given a scroll direction and strategy, return the action to take */
export function resolveScrollAction(
	dir: 'up' | 'down',
	strategy: ScrollConfig['strategy'],
	cell: { x: number; y: number },
	lastWheelAt: number,
	now: number,
	wheelIntervalMs: number,
): ScrollAction {
	if (strategy === 'keys') {
		return { type: 'send', seq: pageSeq(dir), newWheelAt: lastWheelAt }
	}
	if (now - lastWheelAt < wheelIntervalMs) {
		return { type: 'skip' }
	}
	return { type: 'send', seq: scrollSeq(dir, cell.x, cell.y), newWheelAt: now }
}

/** Mutable scroll gesture state */
interface ScrollState {
	startY: number
	lastY: number
	accDelta: number
	lastWheelAt: number
}

/** Drain accumulated delta, dispatching scroll actions until exhausted or rate-limited */
function drainScrollDelta(
	state: ScrollState,
	touch: Touch,
	screen: HTMLElement,
	term: XTerminal,
	config: ScrollConfig,
): void {
	while (Math.abs(state.accDelta) >= config.sensitivity) {
		const dir = state.accDelta < 0 ? 'down' : 'up'
		const cell = touchToCell(touch, screen, term)
		const action = resolveScrollAction(
			dir,
			config.strategy,
			cell,
			state.lastWheelAt,
			Date.now(),
			config.wheelIntervalMs,
		)
		if (action.type === 'skip') break
		sendData(term, action.seq)
		state.lastWheelAt = action.newWheelAt
		state.accDelta -= (state.accDelta < 0 ? -1 : 1) * config.sensitivity
	}
}

/** Attach single-finger vertical scroll to the xterm screen */
export function attachScrollGesture(
	term: XTerminal,
	config: ScrollConfig,
	lock: GestureLock,
	isDrawerOpen: () => boolean,
): void {
	const state: ScrollState = { startY: 0, lastY: 0, accDelta: 0, lastWheelAt: 0 }
	let screenEl: HTMLElement | null = null

	function onTouchStart(e: Event): void {
		if (!(e instanceof TouchEvent)) return
		if (e.touches.length !== 1) return
		const t = e.touches[0]
		if (!t) return
		state.startY = t.clientY
		state.lastY = t.clientY
		state.accDelta = 0
	}

	function onTouchMove(e: Event): void {
		if (!(e instanceof TouchEvent)) return
		if (e.touches.length !== 1 || isDrawerOpen()) return
		const t = e.touches[0]
		if (!t) return

		const y = t.clientY
		const totalDy = y - state.startY

		// Try to claim lock if unclaimed
		if (lock.current === 'none' && Math.abs(totalDy) > config.sensitivity) {
			if (!tryLock(lock, 'scroll')) return
		}

		// Only process if we own the lock
		if (lock.current !== 'scroll') return

		e.preventDefault()

		state.accDelta += y - state.lastY
		state.lastY = y

		const screen = screenEl
		if (screen) drainScrollDelta(state, t, screen, term, config)
	}

	function onTouchEnd(e: Event): void {
		if (!(e instanceof TouchEvent)) return
		if (lock.current === 'scroll') resetLock(lock)
	}

	function attach(): void {
		const screen = document.querySelector('.xterm-screen')
		if (!(screen instanceof HTMLElement)) {
			setTimeout(attach, 200)
			return
		}

		screenEl = screen
		screen.addEventListener('touchstart', onTouchStart, { passive: true })
		screen.addEventListener('touchmove', onTouchMove, { passive: false })
		screen.addEventListener('touchend', onTouchEnd, { passive: true })
		screen.addEventListener('touchcancel', onTouchEnd, { passive: true })
	}

	attach()
}
