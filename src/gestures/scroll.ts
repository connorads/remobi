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

/** Attach single-finger vertical scroll to the xterm screen */
export function attachScrollGesture(
	term: XTerminal,
	config: ScrollConfig,
	lock: GestureLock,
	isDrawerOpen: () => boolean,
): void {
	let startY = 0
	let lastY = 0
	let accDelta = 0
	let lastWheelAt = 0
	let screenEl: HTMLElement | null = null

	function onTouchStart(e: Event): void {
		if (!(e instanceof TouchEvent)) return
		if (e.touches.length === 1) {
			const t = e.touches[0]
			if (!t) return
			startY = t.clientY
			lastY = t.clientY
			accDelta = 0
		}
	}

	function onTouchMove(e: Event): void {
		if (!(e instanceof TouchEvent)) return
		if (e.touches.length !== 1 || isDrawerOpen()) return
		const t = e.touches[0]
		if (!t) return

		const y = t.clientY
		const totalDy = y - startY

		// Try to claim lock if unclaimed
		if (lock.current === 'none' && Math.abs(totalDy) > config.sensitivity) {
			if (!tryLock(lock, 'scroll')) return
		}

		// Only process if we own the lock
		if (lock.current !== 'scroll') return

		e.preventDefault()

		const moveDy = y - lastY
		lastY = y
		accDelta += moveDy

		// Send one scroll action per sensitivity-worth of pixels
		while (Math.abs(accDelta) >= config.sensitivity) {
			const dir = accDelta < 0 ? 'down' : 'up'

			if (config.strategy === 'keys') {
				sendData(term, pageSeq(dir))
			} else {
				const now = Date.now()
				if (now - lastWheelAt < config.wheelIntervalMs) break
				lastWheelAt = now

				const screen = screenEl
				if (!screen) break
				const { x, y: row } = touchToCell(t, screen, term)
				sendData(term, scrollSeq(dir, x, row))
			}

			accDelta -= (accDelta < 0 ? -1 : 1) * config.sensitivity
		}
	}

	function onTouchEnd(e: Event): void {
		if (!(e instanceof TouchEvent)) return
		if (lock.current === 'scroll') {
			resetLock(lock)
		}
	}

	function attach(): void {
		const screen = document.querySelector('.xterm-screen')
		if (!(screen instanceof HTMLElement)) {
			setTimeout(attach, 200)
			return
		}

		screenEl = screen
		screen.addEventListener('touchstart', onTouchStart, {
			passive: true,
		})
		screen.addEventListener('touchmove', onTouchMove, {
			passive: false,
		})
		screen.addEventListener('touchend', onTouchEnd, { passive: true })
		screen.addEventListener('touchcancel', onTouchEnd, { passive: true })
	}

	attach()
}
