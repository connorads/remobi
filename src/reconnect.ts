import type { ReconnectConfig, XTerminal } from './types'
import { el } from './util/dom'

/** Find the ttyd WebSocket from the interceptor array */
function findTtydSocket(): WebSocket | undefined {
	const sockets = window.__webmuxSockets
	if (!sockets) return undefined
	return sockets.find((ws) => ws.url.endsWith('/ws'))
}

/** Create the reconnect overlay DOM (hidden by default) */
function createOverlay(): HTMLDivElement {
	const overlay = el('div', {
		id: 'webmux-reconnect-overlay',
		style: [
			'display:none',
			'position:fixed',
			'inset:0',
			'z-index:10000',
			'background:rgba(30,30,46,0.92)',
			'color:#cdd6f4',
			'font-family:sans-serif',
			'justify-content:center',
			'align-items:center',
			'flex-direction:column',
			'gap:16px',
		].join(';'),
	})

	const message = el('div', {
		style: 'font-size:1.4rem;font-weight:600',
	})
	message.textContent = 'Connection lost'

	const button = el('button', {
		style: [
			'padding:10px 28px',
			'font-size:1rem',
			'border:none',
			'border-radius:8px',
			'background:#cba6f7',
			'color:#1e1e2e',
			'cursor:pointer',
			'font-weight:600',
		].join(';'),
	})
	button.textContent = 'Reconnect'
	button.addEventListener('click', () => location.reload())

	overlay.appendChild(message)
	overlay.appendChild(button)
	return overlay
}

/**
 * Set up reconnect detection and overlay.
 *
 * Watches the ttyd WebSocket for close/error events. Falls back to
 * navigator.onLine + visibilitychange if no WebSocket found.
 * Returns a dispose function that removes listeners and DOM.
 */
export function setupReconnect(_term: XTerminal, config: ReconnectConfig): () => void {
	if (!config.enabled) {
		return () => {}
	}

	const overlay = createOverlay()
	document.body.appendChild(overlay)

	let disconnected = false

	function onDisconnect(): void {
		disconnected = true
		overlay.style.display = 'flex'
	}

	function onOnline(): void {
		if (disconnected) {
			location.reload()
		}
	}

	function onVisibilityChange(): void {
		if (document.visibilityState === 'visible' && disconnected) {
			location.reload()
		}
	}

	// Try WebSocket interception first
	const ws = findTtydSocket()
	if (ws) {
		ws.addEventListener('close', onDisconnect)
		ws.addEventListener('error', onDisconnect)
	} else {
		// Fallback: online/offline + visibilitychange heuristics
		window.addEventListener('offline', onDisconnect)
		document.addEventListener('visibilitychange', onVisibilityChange)
	}

	window.addEventListener('online', onOnline)

	return () => {
		if (ws) {
			ws.removeEventListener('close', onDisconnect)
			ws.removeEventListener('error', onDisconnect)
		} else {
			window.removeEventListener('offline', onDisconnect)
			document.removeEventListener('visibilitychange', onVisibilityChange)
		}
		window.removeEventListener('online', onOnline)
		overlay.remove()
	}
}
