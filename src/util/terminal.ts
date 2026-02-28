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
 * Resolves with the terminal instance, rejects after maxRetries (default 100 = 10s).
 */
export function waitForTerm(maxRetries = 100): Promise<XTerminal> {
	return new Promise((resolve, reject) => {
		let attempts = 0
		function check(): void {
			if (window.term) {
				resolve(window.term)
			} else if (attempts >= maxRetries) {
				reject(new Error(`waitForTerm: window.term not available after ${maxRetries * 100}ms`))
			} else {
				attempts += 1
				setTimeout(check, 100)
			}
		}
		check()
	})
}
