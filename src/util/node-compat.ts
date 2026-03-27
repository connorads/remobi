import { spawn as nodeSpawn } from 'node:child_process'
import type { Readable } from 'node:stream'

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

export interface SpawnedProcess {
	readonly pid: number | undefined
	readonly stdout: Readable | null
	readonly stderr: Readable | null
	readonly stdin: NodeJS.WritableStream | null
	kill(signal?: NodeJS.Signals): boolean
	readonly exited: Promise<number>
}

export function spawnProcess(
	cmd: readonly string[],
	opts?: {
		cwd?: string
		env?: NodeJS.ProcessEnv
		stdin?: 'ignore' | 'pipe'
		stdout?: 'ignore' | 'pipe'
		stderr?: 'ignore' | 'pipe'
	},
): SpawnedProcess {
	const [command, ...args] = cmd
	if (!command) throw new Error('spawnProcess requires at least one argument')

	const proc = nodeSpawn(command, args, {
		cwd: opts?.cwd,
		env: opts?.env,
		stdio: [opts?.stdin ?? 'ignore', opts?.stdout ?? 'ignore', opts?.stderr ?? 'ignore'],
	})

	const exited = new Promise<number>((resolve, reject) => {
		proc.on('close', (code) => resolve(code ?? 1))
		proc.on('error', reject)
	})

	return {
		get pid() {
			return proc.pid
		},
		get stdout() {
			return proc.stdout
		},
		get stderr() {
			return proc.stderr
		},
		get stdin() {
			return proc.stdin
		},
		kill(signal?: NodeJS.Signals) {
			return proc.kill(signal)
		},
		exited,
	}
}

export async function collectStream(stream: Readable | null): Promise<string> {
	if (!stream) return ''
	const chunks: Buffer[] = []
	for await (const chunk of stream) {
		chunks.push(Buffer.from(chunk))
	}
	return Buffer.concat(chunks).toString('utf-8')
}
