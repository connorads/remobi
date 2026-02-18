import type { FontConfig, XTerminal } from '../types'
import { resizeTerm } from '../util/terminal'
import type { GestureLock } from './lock'
import { resetLock, tryLock } from './lock'

/** Calculate distance between two touch points */
export function touchDistance(
	t1: { clientX: number; clientY: number },
	t2: { clientX: number; clientY: number },
): number {
	const dx = t1.clientX - t2.clientX
	const dy = t1.clientY - t2.clientY
	return Math.sqrt(dx * dx + dy * dy)
}

/** Clamp font size to configured range */
export function clampFontSize(size: number, range: readonly [number, number]): number {
	return Math.max(range[0], Math.min(range[1], size))
}

/** Attach pinch-to-zoom gesture to the xterm screen */
export function attachPinchGestures(term: XTerminal, font: FontConfig, lock: GestureLock): void {
	let pinchStartDist = 0
	let pinchBaseFontSize = 0

	function onPinchStart(e: TouchEvent): void {
		if (e.touches.length === 2) {
			const t0 = e.touches[0]
			const t1 = e.touches[1]
			if (!t0 || !t1) return
			pinchStartDist = touchDistance(t0, t1)
			pinchBaseFontSize = term.options.fontSize
		}
	}

	function onPinchMove(e: TouchEvent): void {
		if (e.touches.length !== 2) return
		if (lock.current === 'scroll') return
		if (pinchStartDist === 0) return

		const t0 = e.touches[0]
		const t1 = e.touches[1]
		if (!t0 || !t1) return

		const dist = touchDistance(t0, t1)
		const ratio = dist / pinchStartDist

		// Try to claim lock once ratio diverges enough
		if (lock.current === 'none' && Math.abs(ratio - 1) > 0.05) {
			if (!tryLock(lock, 'pinch')) return
		}

		if (lock.current !== 'pinch') return

		e.preventDefault()
		const newSize = clampFontSize(Math.round(pinchBaseFontSize * ratio), font.sizeRange)
		if (newSize !== term.options.fontSize) {
			term.options.fontSize = newSize
			resizeTerm()
		}
	}

	function onTouchEnd(): void {
		if (lock.current === 'pinch') {
			resetLock(lock)
		}
	}

	// Wait for .xterm-screen then attach
	function attach(): void {
		const screen = document.querySelector('.xterm-screen')
		if (!screen) {
			setTimeout(attach, 200)
			return
		}
		screen.addEventListener('touchstart', (e: Event) => onPinchStart(e as TouchEvent), {
			passive: true,
		})
		screen.addEventListener('touchmove', (e: Event) => onPinchMove(e as TouchEvent), {
			passive: false,
		})
		screen.addEventListener('touchend', () => onTouchEnd(), { passive: true })
	}

	attach()
}
