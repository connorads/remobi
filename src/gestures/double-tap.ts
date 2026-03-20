import type { DoubleTapConfig, XTerminal } from '../types'
import { haptic } from '../util/haptic'
import { sendData } from '../util/terminal'

const MAX_TAP_MOVEMENT = 10
const MAX_TAP_DISTANCE = 50

/** Pure logic: is this a valid double-tap? */
export function isDoubleTap(
	dt: number,
	distance: number,
	maxInterval: number,
	maxDistance: number,
): boolean {
	return dt > 0 && dt <= maxInterval && distance <= maxDistance
}

/** Attach double-tap gesture detection to the xterm screen */
export function attachDoubleTapGesture(
	term: XTerminal,
	config: DoubleTapConfig,
	isDrawerOpen: () => boolean,
): void {
	let lastTapTime = 0
	let lastTapX = 0
	let lastTapY = 0
	let startX = 0
	let startY = 0

	function onTouchStart(e: TouchEvent): void {
		if (e.touches.length !== 1) return
		const touch = e.touches[0]
		if (!touch) return
		startX = touch.clientX
		startY = touch.clientY
	}

	function onTouchEnd(e: TouchEvent): void {
		if (isDrawerOpen() || e.changedTouches.length !== 1) return
		const touch = e.changedTouches[0]
		if (!touch) return

		// Reject if finger moved too far (was a scroll/swipe, not a tap)
		const moveDx = touch.clientX - startX
		const moveDy = touch.clientY - startY
		if (Math.sqrt(moveDx * moveDx + moveDy * moveDy) > MAX_TAP_MOVEMENT) return

		const now = Date.now()
		const dt = now - lastTapTime
		const tapDx = touch.clientX - lastTapX
		const tapDy = touch.clientY - lastTapY
		const distance = Math.sqrt(tapDx * tapDx + tapDy * tapDy)

		if (isDoubleTap(dt, distance, config.maxInterval, MAX_TAP_DISTANCE)) {
			sendData(term, config.data)
			haptic()
			// Reset to prevent triple-tap
			lastTapTime = 0
		} else {
			lastTapTime = now
			lastTapX = touch.clientX
			lastTapY = touch.clientY
		}
	}

	function attach(): void {
		const screen = document.querySelector('.xterm-screen')
		if (!screen) {
			setTimeout(attach, 200)
			return
		}
		// oxlint-disable-next-line typescript/consistent-type-assertions -- DOM addEventListener types Event, not TouchEvent
		screen.addEventListener('touchstart', (e: Event) => onTouchStart(e as TouchEvent), {
			passive: true,
		})
		// oxlint-disable-next-line typescript/consistent-type-assertions -- DOM addEventListener types Event, not TouchEvent
		screen.addEventListener('touchend', (e: Event) => onTouchEnd(e as TouchEvent), {
			passive: true,
		})
	}

	attach()
}
