import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { setupReconnect } from '../src/reconnect'
import type { XTerminal } from '../src/types'

function mockTerm(): XTerminal {
	return {
		cols: 80,
		rows: 24,
		options: { fontSize: 16 },
		input() {},
		focus() {},
		onData() {
			return { dispose() {} }
		},
	}
}

/** Minimal WebSocket-like object with url and EventTarget methods */
function mockWebSocket(url: string): WebSocket {
	const target = new EventTarget()
	return {
		url,
		addEventListener: target.addEventListener.bind(target),
		removeEventListener: target.removeEventListener.bind(target),
		dispatchEvent: target.dispatchEvent.bind(target),
		close() {},
		// oxlint-disable-next-line typescript/consistent-type-assertions -- mock object for testing
	} as unknown as WebSocket
}

function getOverlay(): HTMLElement | null {
	return document.getElementById('webmux-reconnect-overlay')
}

beforeEach(() => {
	GlobalRegistrator.register()
})

afterEach(() => {
	// Clean up any overlay left behind
	getOverlay()?.remove()
	window.__webmuxSockets = undefined
	GlobalRegistrator.unregister()
})

describe('setupReconnect', () => {
	test('overlay is hidden by default', () => {
		const dispose = setupReconnect(mockTerm(), { enabled: true })
		const overlay = getOverlay()
		expect(overlay).not.toBeNull()
		expect(overlay?.style.display).toBe('none')
		dispose()
	})

	test('overlay shown when WebSocket closes', () => {
		const ws = mockWebSocket('ws://localhost:1234/ws')
		window.__webmuxSockets = [ws]

		const dispose = setupReconnect(mockTerm(), { enabled: true })

		ws.dispatchEvent(new Event('close'))

		const overlay = getOverlay()
		expect(overlay?.style.display).toBe('flex')
		dispose()
	})

	test('overlay shown when WebSocket errors', () => {
		const ws = mockWebSocket('ws://localhost:1234/ws')
		window.__webmuxSockets = [ws]

		const dispose = setupReconnect(mockTerm(), { enabled: true })

		ws.dispatchEvent(new Event('error'))

		const overlay = getOverlay()
		expect(overlay?.style.display).toBe('flex')
		dispose()
	})

	test('does nothing when disabled', () => {
		const dispose = setupReconnect(mockTerm(), { enabled: false })
		expect(getOverlay()).toBeNull()
		dispose()
	})

	test('dispose removes overlay from DOM', () => {
		const dispose = setupReconnect(mockTerm(), { enabled: true })
		expect(getOverlay()).not.toBeNull()
		dispose()
		expect(getOverlay()).toBeNull()
	})

	test('falls back to offline events when no WebSocket found', () => {
		window.__webmuxSockets = []

		const dispose = setupReconnect(mockTerm(), { enabled: true })

		window.dispatchEvent(new Event('offline'))

		const overlay = getOverlay()
		expect(overlay?.style.display).toBe('flex')
		dispose()
	})

	test('overlay contains reconnect button', () => {
		const dispose = setupReconnect(mockTerm(), { enabled: true })
		const overlay = getOverlay()
		const button = overlay?.querySelector('button')
		expect(button).not.toBeNull()
		expect(button?.textContent).toBe('Reconnect')
		dispose()
	})

	test('ignores non-ttyd WebSockets', () => {
		const ws = mockWebSocket('ws://localhost:1234/other')
		window.__webmuxSockets = [ws]

		const dispose = setupReconnect(mockTerm(), { enabled: true })

		// No WS ending in /ws found → falls back to offline events
		window.dispatchEvent(new Event('offline'))

		const overlay = getOverlay()
		expect(overlay?.style.display).toBe('flex')
		dispose()
	})
})
