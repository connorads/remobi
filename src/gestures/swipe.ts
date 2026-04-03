import type { SwipeConfig, TwoFingerSwipeConfig, XTerminal } from '../types'
import { el } from '../util/dom'
import { haptic } from '../util/haptic'
import { sendData } from '../util/terminal'
import type { GestureLock } from './lock'

/** Minimum config shape needed by isValidSwipe — avoids coupling to full SwipeConfig */
interface SwipeThresholds {
	readonly threshold: number
	readonly maxDuration: number
}

/** Result of swipe validity check — pure logic, no side effects */
export function isValidSwipe(
	dx: number,
	dy: number,
	dt: number,
	config: SwipeThresholds,
): 'left' | 'right' | null {
	const absDx = Math.abs(dx)
	const absDy = Math.abs(dy)
	if (absDx > config.threshold && dt < config.maxDuration && absDx > absDy * 2) {
		return dx > 0 ? 'right' : 'left'
	}
	return null
}

/** Determine direction of a two-finger swipe — pure logic, no side effects */
export function isValidTwoFingerSwipe(
	dx: number,
	dy: number,
	dt: number,
	config: TwoFingerSwipeConfig,
): 'up' | 'down' | 'left' | 'right' | null {
	const absDx = Math.abs(dx)
	const absDy = Math.abs(dy)
	const maxDist = Math.max(absDx, absDy)
	if (maxDist <= config.threshold || dt > config.maxDuration) return null
	// Reject ambiguous diagonal: dominant axis must be > 2x the other
	if (absDx > absDy * 2) return dx > 0 ? 'right' : 'left'
	if (absDy > absDx * 2) return dy > 0 ? 'down' : 'up'
	return null
}

/** Create the swipe indicator element */
function createSwipeIndicator(): { element: HTMLDivElement; show: (arrow: string) => void } {
	const indicator = el('div', { id: 'wt-swipe-indicator' })
	let timer = 0

	function show(arrow: string): void {
		indicator.textContent = arrow
		indicator.style.opacity = '1'
		clearTimeout(timer)
		timer = window.setTimeout(() => {
			indicator.style.opacity = '0'
		}, 300)
	}

	return { element: indicator, show }
}

const SWIPE_ARROWS: Record<string, string> = {
	left: '\u25B6',
	right: '\u25C0',
	up: '\u25BC',
	down: '\u25B2',
}

/** Attach swipe gesture detection to the xterm screen */
export function attachSwipeGestures(
	term: XTerminal,
	config: SwipeConfig,
	isDrawerOpen: () => boolean,
	gestureLock?: GestureLock,
): HTMLDivElement {
	const { element: indicator, show } = createSwipeIndicator()

	// One-finger swipe state
	let startX = 0
	let startY = 0
	let startTime = 0

	// Two-finger swipe state
	let twoFingerStartX = 0
	let twoFingerStartY = 0
	let twoFingerStartTime = 0
	let twoFingerActive = false

	function onTouchStart(e: TouchEvent): void {
		if (isDrawerOpen()) return

		if (e.touches.length === 1) {
			const touch = e.touches[0]
			if (!touch) return
			startX = touch.clientX
			startY = touch.clientY
			startTime = Date.now()
			return
		}

		if (e.touches.length === 2 && config.twoFinger.enabled) {
			const t0 = e.touches[0]
			const t1 = e.touches[1]
			if (!t0 || !t1) return
			// Average of both fingers as the swipe origin
			twoFingerStartX = (t0.clientX + t1.clientX) / 2
			twoFingerStartY = (t0.clientY + t1.clientY) / 2
			twoFingerStartTime = Date.now()
			twoFingerActive = true
		}
	}

	function onTouchEnd(e: TouchEvent): void {
		if (isDrawerOpen()) return

		// Two-finger swipe: fires when second finger lifts (touches drops to 1)
		if (twoFingerActive && config.twoFinger.enabled) {
			// If pinch or scroll claimed the lock, don't fire two-finger swipe
			if (gestureLock && gestureLock.current !== 'none') {
				twoFingerActive = false
				return
			}

			const touch = e.changedTouches[0]
			if (!touch) {
				twoFingerActive = false
				return
			}
			const endX = touch.clientX
			const endY = touch.clientY
			const dx = endX - twoFingerStartX
			const dy = endY - twoFingerStartY
			const dt = Date.now() - twoFingerStartTime

			const direction = isValidTwoFingerSwipe(dx, dy, dt, config.twoFinger)
			if (direction) {
				sendData(term, config.twoFinger[direction])
				show(SWIPE_ARROWS[direction] ?? '')
				haptic()
			}

			twoFingerActive = false
			return
		}

		// One-finger swipe
		if (!config.enabled || e.changedTouches.length !== 1) return
		const touch = e.changedTouches[0]
		if (!touch) return
		const dx = touch.clientX - startX
		const dy = touch.clientY - startY
		const dt = Date.now() - startTime

		const direction = isValidSwipe(dx, dy, dt, config)
		if (direction === 'right') {
			sendData(term, config.right)
			show('\u25C0')
			haptic()
		} else if (direction === 'left') {
			sendData(term, config.left)
			show('\u25B6')
			haptic()
		}
	}

	// Wait for .xterm-screen then attach
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
	return indicator
}
