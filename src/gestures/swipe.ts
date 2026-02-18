import type { SwipeConfig, XTerminal } from '../types'
import { el } from '../util/dom'
import { haptic } from '../util/haptic'
import { sendData } from '../util/terminal'

/** Result of swipe validity check — pure logic, no side effects */
export function isValidSwipe(
	dx: number,
	dy: number,
	dt: number,
	config: SwipeConfig,
): 'left' | 'right' | null {
	const absDx = Math.abs(dx)
	const absDy = Math.abs(dy)
	if (absDx > config.threshold && dt < config.maxDuration && absDx > absDy * 2) {
		return dx > 0 ? 'right' : 'left'
	}
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

/** Attach swipe gesture detection to the xterm screen */
export function attachSwipeGestures(
	term: XTerminal,
	config: SwipeConfig,
	isDrawerOpen: () => boolean,
): HTMLDivElement {
	const { element: indicator, show } = createSwipeIndicator()

	let startX = 0
	let startY = 0
	let startTime = 0

	function onTouchStart(e: TouchEvent): void {
		if (isDrawerOpen() || e.touches.length !== 1) return
		const touch = e.touches[0]
		if (!touch) return
		startX = touch.clientX
		startY = touch.clientY
		startTime = Date.now()
	}

	function onTouchEnd(e: TouchEvent): void {
		if (isDrawerOpen() || e.changedTouches.length !== 1) return
		const touch = e.changedTouches[0]
		if (!touch) return
		const dx = touch.clientX - startX
		const dy = touch.clientY - startY
		const dt = Date.now() - startTime

		const direction = isValidSwipe(dx, dy, dt, config)
		if (direction === 'right') {
			sendData(term, '\x02p')
			show('\u25C0')
			haptic()
		} else if (direction === 'left') {
			sendData(term, '\x02n')
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
		screen.addEventListener('touchstart', (e: Event) => onTouchStart(e as TouchEvent), {
			passive: true,
		})
		screen.addEventListener('touchend', (e: Event) => onTouchEnd(e as TouchEvent), {
			passive: true,
		})
	}

	attach()
	return indicator
}
