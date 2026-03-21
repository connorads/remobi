import { SerializeAddon } from '@xterm/addon-serialize'
import XtermHeadless from '@xterm/headless'
import { type IPty, spawn } from 'node-pty'
import type { ClientMessage, ServerMessage } from './session-protocol'

const DEFAULT_COLS = 80
const DEFAULT_ROWS = 24

const HeadlessTerminal = XtermHeadless.Terminal
type HeadlessTerminalInstance = InstanceType<typeof HeadlessTerminal>

export interface SessionClient {
	send(message: ServerMessage): void
	close(): void
}

interface SessionExit {
	readonly exitCode: number
	readonly signal: number | null
}

function normaliseCommand(command: readonly string[]): { file: string; args: string[] } {
	const [file, ...args] = command
	if (!file) {
		throw new Error('remobi serve requires a command to start')
	}
	return { file, args: [...args] }
}

function toSignalValue(signal: number | undefined): number | null {
	return typeof signal === 'number' ? signal : null
}

export function buildSessionEnv(sourceEnv: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
	const env: NodeJS.ProcessEnv = { ...sourceEnv, TERM: 'xterm-256color' }
	env.TMUX = undefined
	env.TMUX_PANE = undefined
	return env
}

export class SharedTerminalSession {
	private readonly pty: IPty
	private readonly mirror: HeadlessTerminalInstance
	private readonly serializeAddon: SerializeAddon
	private readonly clients = new Set<SessionClient>()
	private readonly exitPromise: Promise<SessionExit>
	private exitResolve: ((exit: SessionExit) => void) | null = null
	private exited: SessionExit | null = null
	private pendingMirrorWrite: Promise<void> = Promise.resolve()

	constructor(command: readonly string[]) {
		const { file, args } = normaliseCommand(command)

		this.pty = spawn(file, args, {
			name: 'xterm-256color',
			cols: DEFAULT_COLS,
			rows: DEFAULT_ROWS,
			cwd: process.cwd(),
			// Strip tmux client markers so `tmux new-session -A -s ...` attaches to
			// the real session instead of behaving like a nested in-tmux command.
			env: buildSessionEnv(process.env),
		})

		this.mirror = new HeadlessTerminal({
			allowProposedApi: true,
			cols: DEFAULT_COLS,
			rows: DEFAULT_ROWS,
			scrollback: 5000,
		})
		this.serializeAddon = new SerializeAddon()
		this.mirror.loadAddon(this.serializeAddon)

		this.exitPromise = new Promise<SessionExit>((resolve) => {
			this.exitResolve = resolve
		})

		this.pty.onData((data) => {
			this.pendingMirrorWrite = this.pendingMirrorWrite
				.then(
					() =>
						new Promise<void>((resolve) => {
							this.mirror.write(data, resolve)
						}),
				)
				.catch(() => {})

			this.broadcast({ type: 'output', data })
		})

		this.pty.onExit(({ exitCode, signal }) => {
			const exit: SessionExit = { exitCode, signal: toSignalValue(signal) }
			this.exited = exit
			this.broadcast({ type: 'exit', ...exit })
			for (const client of this.clients) {
				client.close()
			}
			this.clients.clear()
			this.exitResolve?.(exit)
			this.exitResolve = null
		})
	}

	get pid(): number {
		return this.pty.pid
	}

	get onExit(): Promise<SessionExit> {
		return this.exitPromise
	}

	async addClient(client: SessionClient): Promise<void> {
		const exitedBeforeSnapshot = this.exited
		if (exitedBeforeSnapshot) {
			const snapshot = await this.snapshot()
			client.send({ type: 'snapshot', data: snapshot })
			client.send({
				type: 'exit',
				exitCode: exitedBeforeSnapshot.exitCode,
				signal: exitedBeforeSnapshot.signal,
			})
			client.close()
			return
		}

		this.clients.add(client)
		const snapshot = await this.snapshot()
		client.send({ type: 'snapshot', data: snapshot })

		const exitedAfterSnapshot = this.exited
		if (exitedAfterSnapshot) {
			client.send({
				type: 'exit',
				exitCode: exitedAfterSnapshot.exitCode,
				signal: exitedAfterSnapshot.signal,
			})
			client.close()
			this.clients.delete(client)
		}
	}

	removeClient(client: SessionClient): void {
		this.clients.delete(client)
	}

	handleClientMessage(client: SessionClient, message: ClientMessage): void {
		switch (message.type) {
			case 'input':
				this.pty.write(message.data)
				return

			case 'resize':
				this.pty.resize(message.cols, message.rows)
				this.mirror.resize(message.cols, message.rows)
				return

			case 'ping':
				client.send({ type: 'pong' })
				return
		}
	}

	async dispose(): Promise<void> {
		for (const client of this.clients) {
			client.close()
		}
		this.clients.clear()

		if (this.exited === null) {
			this.pty.kill()
			await this.exitPromise
		}
	}

	private async snapshot(): Promise<string> {
		await this.pendingMirrorWrite
		return this.serializeAddon.serialize()
	}

	private broadcast(message: ServerMessage): void {
		for (const client of this.clients) {
			client.send(message)
		}
	}
}
