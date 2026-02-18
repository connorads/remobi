import type { ScrollConfig, XTerminal } from '../types'
import { sendData } from '../util/terminal'
import type { GestureLock } from './lock'
import { resetLock, tryLock } from './lock'

/** Average Y coordinate of two touches */
export function averageY(t0: { clientY: number }, t1: { clientY: number }): number {
	return (t0.clientY + t1.clientY) / 2
}

/** SGR mouse wheel escape sequence for a given direction */
export function scrollSeq(direction: 'up' | 'down'): string {
	return direction === 'up' ? '\x1b[\x3c64;1;1M' : '\x1b[\x3c65;1;1M'
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

	function onTouchStart(e: TouchEvent): void {
		if (e.touches.length === 1) {
			const t = e.touches[0]
			if (!t) return
			startY = t.clientY
			lastY = t.clientY
			accDelta = 0
		}
	}

	function onTouchMove(e: TouchEvent): void {
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

		// Send one wheel event per sensitivity-worth of pixels
		while (Math.abs(accDelta) >= config.sensitivity) {
			const dir = accDelta < 0 ? 'down' : 'up'
			sendData(term, scrollSeq(dir))
			accDelta -= (accDelta < 0 ? -1 : 1) * config.sensitivity
		}
	}

	function onTouchEnd(): void {
		if (lock.current === 'scroll') {
			resetLock(lock)
		}
	}

	function attach(): void {
		const screen = document.querySelector('.xterm-screen')
		if (!screen) {
			setTimeout(attach, 200)
			return
		}
		screen.addEventListener('touchstart', (e: Event) => onTouchStart(e as TouchEvent), {
			passive: true,
		})
		screen.addEventListener('touchmove', (e: Event) => onTouchMove(e as TouchEvent), {
			passive: false,
		})
		screen.addEventListener('touchend', () => onTouchEnd(), { passive: true })
	}

	attach()
}
