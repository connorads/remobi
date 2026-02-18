import type { XTerminal } from '../types'

/** Send data to the terminal as if the user typed it */
export function sendData(term: XTerminal, data: string): void {
	term.input(data, true)
}

/** Trigger xterm resize via window resize event */
export function resizeTerm(): void {
	window.dispatchEvent(new Event('resize'))
}

/**
 * Wait for `window.term` to become available (ttyd sets it).
 * Resolves with the terminal instance.
 */
export function waitForTerm(): Promise<XTerminal> {
	return new Promise((resolve) => {
		function check(): void {
			const win = window as unknown as Record<string, unknown>
			if (win.term) {
				resolve(win.term as XTerminal)
			} else {
				setTimeout(check, 100)
			}
		}
		check()
	})
}
