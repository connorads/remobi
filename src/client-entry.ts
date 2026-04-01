import { FitAddon } from '@xterm/addon-fit'
import { Unicode11Addon } from '@xterm/addon-unicode11'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import '../styles/base.css'
import { joinBasePath } from './base-path'
import { createHookRegistry, init } from './index'
import { parseServerMessage, serialiseClientMessage } from './session-protocol'
import type { ClientMessage } from './session-protocol'
import type { RemobiConfig, XTerminal } from './types'
import { el } from './util/dom'
import { onTap } from './util/tap'

declare const __remobiConfig: RemobiConfig
declare const __remobiVersion: string | undefined
declare const __remobiBasePath: string | undefined

function createSocketUrl(): string {
	const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
	const socketPath = joinBasePath(__remobiBasePath ?? '/', '/ws')
	return `${protocol}//${window.location.host}${socketPath}`
}

function attachOptionalAddons(term: Terminal): FitAddon {
	const fitAddon = new FitAddon()
	term.loadAddon(fitAddon)
	term.loadAddon(new WebLinksAddon())

	const unicodeAddon = new Unicode11Addon()
	term.loadAddon(unicodeAddon)
	term.unicode.activeVersion = '11'

	return fitAddon
}

function flushQueuedMessages(socket: WebSocket, queued: ClientMessage[]): void {
	while (queued.length > 0) {
		const message = queued.shift()
		if (!message) continue
		socket.send(serialiseClientMessage(message))
	}
}

function createTermBridge(term: Terminal, send: (message: ClientMessage) => void): XTerminal {
	const options: XTerminal['options'] = {
		get fontSize() {
			return typeof term.options.fontSize === 'number' ? term.options.fontSize : 14
		},
		set fontSize(value: number) {
			term.options.fontSize = value
		},
		get theme() {
			return term.options.theme
		},
		set theme(value: Partial<RemobiConfig['theme']> | undefined) {
			term.options.theme = value
		},
		get fontFamily() {
			return term.options.fontFamily
		},
		set fontFamily(value: string | undefined) {
			term.options.fontFamily = value
		},
	}

	return {
		get cols() {
			return term.cols
		},
		get rows() {
			return term.rows
		},
		get buffer() {
			return {
				active: {
					cursorX: term.buffer.active.cursorX,
					cursorY: term.buffer.active.cursorY,
				},
			}
		},
		get options() {
			return options
		},
		input(data: string) {
			send({ type: 'input', data })
		},
		focus() {
			term.focus()
		},
		onData(handler: (data: string) => void) {
			return term.onData(handler)
		},
	}
}

interface SessionStatusOverlay {
	readonly element: HTMLDivElement
	readonly message: HTMLDivElement
	readonly button: HTMLButtonElement
}

function createSessionStatusOverlay(onReload: () => void): SessionStatusOverlay {
	const overlay = el('div', {
		id: 'remobi-session-status',
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
	button.type = 'button'
	button.textContent = 'Reload'
	onTap(button, (event: Event) => {
		event.stopPropagation()
		onReload()
	})

	overlay.appendChild(message)
	overlay.appendChild(button)
	return { element: overlay, message, button }
}

function main(config: RemobiConfig, version: string | undefined): void {
	const container = document.getElementById('terminal')
	if (!(container instanceof HTMLElement)) {
		throw new Error('remobi: missing #terminal container')
	}

	const term = new Terminal({
		allowProposedApi: true,
		fontFamily: config.font.family,
		fontSize: config.font.mobileSizeDefault,
		scrollback: 5000,
		theme: config.theme,
	})
	const fitAddon = attachOptionalAddons(term)
	term.open(container)
	document.documentElement.style.background = config.theme.background
	document.body.style.background = config.theme.background
	fitAddon.fit()

	const queuedMessages: ClientMessage[] = []
	let socket: WebSocket | null = null
	let snapshotLoaded = false
	const pendingOutput: string[] = []
	let exitReceived = false
	let statusOverlay: SessionStatusOverlay | null = null

	function send(message: ClientMessage): void {
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(serialiseClientMessage(message))
			return
		}
		queuedMessages.push(message)
	}

	function syncSize(): void {
		fitAddon.fit()
		send({ type: 'resize', cols: term.cols, rows: term.rows })
	}

	function writeBufferedOutput(): void {
		if (!snapshotLoaded) return
		while (pendingOutput.length > 0) {
			const data = pendingOutput.shift()
			if (data) {
				term.write(data)
			}
		}
	}

	function showSessionStatus(message: string): void {
		if (config.reconnect.enabled) {
			return
		}

		statusOverlay ??= createSessionStatusOverlay(() => {
			location.reload()
		})
		statusOverlay.message.textContent = message
		if (!statusOverlay.element.isConnected) {
			document.body.appendChild(statusOverlay.element)
		}
		statusOverlay.element.style.display = 'flex'
		statusOverlay.button.focus()
	}

	const termBridge = createTermBridge(term, send)
	// xterm handles real keyboard/touch input locally; forward it to the shared PTY.
	term.onData((data) => {
		send({ type: 'input', data })
	})
	window.term = termBridge
	window.__remobiResize = syncSize

	socket = new WebSocket(createSocketUrl())
	window.__remobiSockets = [socket]

	socket.addEventListener('open', () => {
		syncSize()
		flushQueuedMessages(socket, queuedMessages)
	})
	socket.addEventListener('close', () => {
		showSessionStatus(exitReceived ? 'Session ended' : 'Connection lost')
	})
	socket.addEventListener('error', () => {
		showSessionStatus('Connection lost')
	})

	socket.addEventListener('message', (event) => {
		if (typeof event.data !== 'string') {
			return
		}

		const message = parseServerMessage(event.data)
		if (!message) {
			return
		}

		switch (message.type) {
			case 'snapshot':
				term.reset()
				term.write(message.data, () => {
					snapshotLoaded = true
					writeBufferedOutput()
				})
				return

			case 'output':
				if (!snapshotLoaded) {
					pendingOutput.push(message.data)
					return
				}
				term.write(message.data)
				return

			case 'exit':
				exitReceived = true
				showSessionStatus('Session ended')
				return

			case 'error':
				console.error(`remobi: ${message.message}`)
				return

			case 'pong':
				return
		}
	})

	window.addEventListener('resize', syncSize)
	window.visualViewport?.addEventListener('resize', syncSize)

	const hooks = createHookRegistry()
	init(config, hooks, version)
}

main(__remobiConfig, typeof __remobiVersion === 'undefined' ? undefined : __remobiVersion)
