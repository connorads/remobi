import { isKeyboardOpen } from '../util/keyboard'
import { resizeTerm } from '../util/terminal'
import { checkLandscapeKeyboard } from './landscape'

/**
 * Manage terminal height to account for the toolbar and virtual keyboard.
 * Uses visualViewport API when available for accurate keyboard detection.
 */
export function initHeightManager(toolbar: HTMLDivElement): void {
	let pendingResize = 0

	function updateHeight(): void {
		pendingResize = 0
		checkLandscapeKeyboard(toolbar)

		const vp = window.visualViewport
		const vh = vp ? vp.height : window.innerHeight
		const kbOpen = isKeyboardOpen()
		const tbH = kbOpen ? 0 : toolbar.offsetHeight || 90
		const h = `${vh - tbH}px`

		document.body.style.setProperty('min-height', '0', 'important')
		document.body.style.setProperty('height', h, 'important')
		resizeTerm()
	}

	function scheduleResize(): void {
		if (!pendingResize) {
			pendingResize = requestAnimationFrame(updateHeight)
		}
	}

	if (window.visualViewport) {
		window.visualViewport.addEventListener('resize', scheduleResize)
		window.visualViewport.addEventListener('scroll', scheduleResize)
	}
	window.addEventListener('resize', scheduleResize)
	window.addEventListener('orientationchange', () => {
		setTimeout(scheduleResize, 200)
	})

	scheduleResize()
}
