import { describe, expect, test } from 'vitest'
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
		expect(env.TMUX).toBeUndefined()
		expect(env.TMUX_PANE).toBeUndefined()
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
