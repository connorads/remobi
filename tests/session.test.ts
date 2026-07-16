import { describe, expect, test, vi } from 'vitest'
import { SharedTerminalSession, buildSessionEnv } from '../src/session'
import type { ServerMessage } from '../src/session-protocol'
import { sleep } from '../src/util/node-compat'

function createClientRecorder() {
	const messages: ServerMessage[] = []
	let closeCount = 0

	return {
		client: {
			send(message: ServerMessage) {
				messages.push(message)
			},
			close() {
				closeCount += 1
			},
		},
		getMessages() {
			return messages
		},
		getCloseCount() {
			return closeCount
		},
	}
}

type ClientRecorder = ReturnType<typeof createClientRecorder>

function receivedText(recorder: ClientRecorder): string {
	return recorder
		.getMessages()
		.map((message) => ('data' in message ? message.data : ''))
		.join('')
}

// Emit an escape sequence into the PTY, wait until it has demonstrably
// reached the session (a watcher client sees the marker), then connect a
// late client and return its snapshot.
async function lateJoinSnapshot(sequence: string): Promise<string> {
	const session = new SharedTerminalSession([
		'bash',
		'--norc',
		'--noprofile',
		'-lc',
		`printf "${sequence}sequence-applied"; sleep 5`,
	])
	try {
		const watcher = createClientRecorder()
		await session.addClient(watcher.client)
		await vi.waitFor(() => {
			expect(receivedText(watcher)).toContain('sequence-applied')
		})

		const lateClient = createClientRecorder()
		await session.addClient(lateClient.client)
		const snapshot = lateClient.getMessages().find((message) => message.type === 'snapshot')
		expect(snapshot).toBeDefined()
		return snapshot?.type === 'snapshot' ? snapshot.data : ''
	} finally {
		await session.dispose()
	}
}

describe('SharedTerminalSession', () => {
	test('buildSessionEnv strips nested tmux variables before launching the command', () => {
		const env = buildSessionEnv({
			SHELL: '/bin/zsh',
			TERM: 'screen-256color',
			TMUX: '/tmp/tmux-1000/default,1860,0',
			TMUX_PANE: '%42',
		})

		expect(env.SHELL).toBe('/bin/zsh')
		expect(env.TERM).toBe('xterm-256color')
		expect('TMUX' in env).toBe(false)
		expect('TMUX_PANE' in env).toBe(false)
	})

	test('buildSessionEnv strips nested zellij variables before launching the command', () => {
		const env = buildSessionEnv({
			SHELL: '/bin/zsh',
			ZELLIJ: '0',
			ZELLIJ_PANE_ID: '1',
			ZELLIJ_SESSION_NAME: 'main',
		})

		expect(env.SHELL).toBe('/bin/zsh')
		expect('ZELLIJ' in env).toBe(false)
		expect('ZELLIJ_PANE_ID' in env).toBe(false)
		expect('ZELLIJ_SESSION_NAME' in env).toBe(false)
	})

	test('buildSessionEnv strips nested herdr variables before launching the command', () => {
		const env = buildSessionEnv({
			SHELL: '/bin/zsh',
			HERDR_SESSION: 'main',
			HERDR_SOCKET_PATH: '/Users/x/.config/herdr/sessions/main/herdr.sock',
			HERDR_PANE_ID: 'w1:p1',
			HERDR_TAB_ID: 'w1:t1',
			HERDR_WORKSPACE_ID: 'w1',
		})

		expect(env.SHELL).toBe('/bin/zsh')
		expect('HERDR_SESSION' in env).toBe(false)
		expect('HERDR_SOCKET_PATH' in env).toBe(false)
		expect('HERDR_PANE_ID' in env).toBe(false)
		expect('HERDR_TAB_ID' in env).toBe(false)
		expect('HERDR_WORKSPACE_ID' in env).toBe(false)
	})

	test('closes connected clients when the PTY exits naturally', async () => {
		const session = new SharedTerminalSession([
			'bash',
			'--norc',
			'--noprofile',
			'-lc',
			'printf "session-live\\n"; sleep 0.1; exit 0',
		])
		const recorder = createClientRecorder()

		await session.addClient(recorder.client)
		const exit = await session.onExit
		await sleep(50)

		expect(exit.exitCode).toBe(0)
		expect(recorder.getMessages().some((message) => message.type === 'exit')).toBe(true)
		expect(recorder.getCloseCount()).toBe(1)
	})

	test('handleClientMessage silently ignores input and resize after PTY exit', async () => {
		const session = new SharedTerminalSession(['bash', '--norc', '--noprofile', '-lc', 'exit 0'])

		await session.onExit

		const recorder = createClientRecorder()

		// pty.resize() throws EBADF after exit — these must not throw
		session.handleClientMessage(recorder.client, { type: 'input', data: 'hello' })
		session.handleClientMessage(recorder.client, { type: 'resize', cols: 120, rows: 40 })

		// ping should still work — pure WS, no PTY involvement
		session.handleClientMessage(recorder.client, { type: 'ping' })
		expect(recorder.getMessages()).toEqual([{ type: 'pong' }])
	})

	test('snapshot replays SGR mouse encoding for late clients', async () => {
		expect(await lateJoinSnapshot('\\e[?1002h\\e[?1006h')).toContain('\x1b[?1006h')
	})

	test('snapshot replays SGR pixels mouse encoding for late clients', async () => {
		expect(await lateJoinSnapshot('\\e[?1002h\\e[?1016h')).toContain('\x1b[?1016h')
	})

	test('snapshot omits mouse encoding when no mouse modes were set', async () => {
		const data = await lateJoinSnapshot('plain-output')
		expect(data).not.toContain('\x1b[?1006h')
		expect(data).not.toContain('\x1b[?1016h')
	})

	test('snapshot omits mouse encoding after the app turns it off again', async () => {
		expect(await lateJoinSnapshot('\\e[?1006h\\e[?1006l')).not.toContain('\x1b[?1006h')
	})

	test('late clients receive the final snapshot and exit after the PTY is gone', async () => {
		const session = new SharedTerminalSession([
			'bash',
			'--norc',
			'--noprofile',
			'-lc',
			'printf "session-finished\\n"; exit 0',
		])

		const exit = await session.onExit
		const recorder = createClientRecorder()
		await session.addClient(recorder.client)

		expect(exit.exitCode).toBe(0)
		expect(recorder.getMessages()[0]).toMatchObject({ type: 'snapshot' })
		expect(recorder.getMessages()[1]).toEqual({ type: 'exit', ...exit })
		expect(recorder.getCloseCount()).toBe(1)
	})
})
