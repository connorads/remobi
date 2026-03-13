import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { setupReconnect } from '../src/reconnect'
import { mockTerminal } from './fixtures'

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

function stubLocationReload(): { readonly calls: number[] } {
	const calls: number[] = []
	window.location.reload = () => {
		calls.push(Date.now())
	}
	return { calls }
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
		const dispose = setupReconnect(mockTerminal(), { enabled: true })
		const overlay = getOverlay()
		expect(overlay).not.toBeNull()
		expect(overlay?.style.display).toBe('none')
		dispose()
	})

	test('overlay shown when WebSocket closes', () => {
		const ws = mockWebSocket('ws://localhost:1234/ws')
		window.__webmuxSockets = [ws]

		const dispose = setupReconnect(mockTerminal(), { enabled: true })

		ws.dispatchEvent(new Event('close'))

		const overlay = getOverlay()
		expect(overlay?.style.display).toBe('flex')
		dispose()
	})

	test('overlay shown when WebSocket errors', () => {
		const ws = mockWebSocket('ws://localhost:1234/ws')
		window.__webmuxSockets = [ws]

		const dispose = setupReconnect(mockTerminal(), { enabled: true })

		ws.dispatchEvent(new Event('error'))

		const overlay = getOverlay()
		expect(overlay?.style.display).toBe('flex')
		dispose()
	})

	test('does nothing when disabled', () => {
		const dispose = setupReconnect(mockTerminal(), { enabled: false })
		expect(getOverlay()).toBeNull()
		dispose()
	})

	test('dispose removes overlay from DOM', () => {
		const dispose = setupReconnect(mockTerminal(), { enabled: true })
		expect(getOverlay()).not.toBeNull()
		dispose()
		expect(getOverlay()).toBeNull()
	})

	test('falls back to offline events when no WebSocket found', () => {
		window.__webmuxSockets = []

		const dispose = setupReconnect(mockTerminal(), { enabled: true })

		window.dispatchEvent(new Event('offline'))

		const overlay = getOverlay()
		expect(overlay?.style.display).toBe('flex')
		dispose()
	})

	test('overlay contains reconnect button', () => {
		const dispose = setupReconnect(mockTerminal(), { enabled: true })
		const overlay = getOverlay()
		const button = overlay?.querySelector('button')
		expect(button).not.toBeNull()
		expect(button?.textContent).toBe('Reconnect')
		dispose()
	})

	test('focuses reconnect button when overlay is shown', () => {
		const ws = mockWebSocket('ws://localhost:1234/ws')
		window.__webmuxSockets = [ws]

		const dispose = setupReconnect(mockTerminal(), { enabled: true })
		ws.dispatchEvent(new Event('close'))

		const button = getOverlay()?.querySelector('button')
		expect(document.activeElement).toBe(button)
		dispose()
	})

	test('clicking reconnect button reloads once', () => {
		const reload = stubLocationReload()
		const ws = mockWebSocket('ws://localhost:1234/ws')
		window.__webmuxSockets = [ws]

		const dispose = setupReconnect(mockTerminal(), { enabled: true })
		ws.dispatchEvent(new Event('close'))

		const button = getOverlay()?.querySelector('button')
		button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

		expect(reload.calls).toHaveLength(1)
		dispose()
	})

	test('clicking overlay backdrop reloads once', () => {
		const reload = stubLocationReload()
		const ws = mockWebSocket('ws://localhost:1234/ws')
		window.__webmuxSockets = [ws]

		const dispose = setupReconnect(mockTerminal(), { enabled: true })
		ws.dispatchEvent(new Event('close'))

		getOverlay()?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

		expect(reload.calls).toHaveLength(1)
		dispose()
	})

	test('clicking overlay message reloads once', () => {
		const reload = stubLocationReload()
		const ws = mockWebSocket('ws://localhost:1234/ws')
		window.__webmuxSockets = [ws]

		const dispose = setupReconnect(mockTerminal(), { enabled: true })
		ws.dispatchEvent(new Event('close'))

		const message = getOverlay()?.querySelector('div')
		message?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

		expect(reload.calls).toHaveLength(1)
		dispose()
	})

	test('multiple reconnect triggers reload only once', () => {
		const reload = stubLocationReload()
		const ws = mockWebSocket('ws://localhost:1234/ws')
		window.__webmuxSockets = [ws]

		const dispose = setupReconnect(mockTerminal(), { enabled: true })
		ws.dispatchEvent(new Event('close'))

		const overlay = getOverlay()
		overlay?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
		overlay?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
		window.dispatchEvent(new Event('online'))

		expect(reload.calls).toHaveLength(1)
		dispose()
	})

	test('dispose removes visibilitychange listener in fallback path', () => {
		window.__webmuxSockets = []

		const dispose = setupReconnect(mockTerminal(), { enabled: true })

		// Trigger disconnect so overlay shows
		window.dispatchEvent(new Event('offline'))
		expect(getOverlay()?.style.display).toBe('flex')

		// Dispose should remove the visibilitychange listener
		dispose()

		// Re-add overlay manually to check it stays hidden after dispose
		const overlay = document.createElement('div')
		overlay.id = 'webmux-reconnect-overlay'
		overlay.style.display = 'none'
		document.body.appendChild(overlay)

		// Dispatching visibilitychange after dispose should have no effect
		// (the listener was removed, so no reload attempt)
		document.dispatchEvent(new Event('visibilitychange'))
		expect(overlay.style.display).toBe('none')

		overlay.remove()
	})

	test('ignores non-ttyd WebSockets', () => {
		const ws = mockWebSocket('ws://localhost:1234/other')
		window.__webmuxSockets = [ws]

		const dispose = setupReconnect(mockTerminal(), { enabled: true })

		// No WS ending in /ws found → falls back to offline events
		window.dispatchEvent(new Event('offline'))

		const overlay = getOverlay()
		expect(overlay?.style.display).toBe('flex')
		dispose()
	})

	test('fallback overlay supports tap to reconnect', () => {
		const reload = stubLocationReload()
		window.__webmuxSockets = []

		const dispose = setupReconnect(mockTerminal(), { enabled: true })
		window.dispatchEvent(new Event('offline'))

		getOverlay()?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

		expect(reload.calls).toHaveLength(1)
		dispose()
	})
})
