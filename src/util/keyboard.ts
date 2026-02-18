import type { XTerminal } from '../types'

/** Threshold in pixels — if the gap between innerHeight and viewport height exceeds this, the keyboard is open */
const KB_THRESHOLD = 150

/** Check whether the virtual keyboard appears to be open */
export function isKeyboardOpen(): boolean {
	const vp = window.visualViewport
	if (!vp) return false
	return window.innerHeight - vp.height > KB_THRESHOLD
}

/** Focus terminal only if the keyboard was already visible */
export function conditionalFocus(term: XTerminal, kbWasOpen: boolean): void {
	if (kbWasOpen) {
		term.focus()
	}
}
