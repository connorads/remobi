export interface InputMessage {
	readonly type: 'input'
	readonly data: string
}

export interface ResizeMessage {
	readonly type: 'resize'
	readonly cols: number
	readonly rows: number
}

export interface PingMessage {
	readonly type: 'ping'
}

export type ClientMessage = InputMessage | ResizeMessage | PingMessage

export const MAX_CLIENT_MESSAGE_BYTES = 256 * 1024
export const MAX_CLIENT_INPUT_BYTES = 256 * 1024
export const MAX_RESIZE_COLS = 500
export const MAX_RESIZE_ROWS = 200

export interface SnapshotMessage {
	readonly type: 'snapshot'
	readonly data: string
}

export interface OutputMessage {
	readonly type: 'output'
	readonly data: string
}

export interface ExitMessage {
	readonly type: 'exit'
	readonly exitCode: number
	readonly signal: number | null
}

export interface ErrorMessage {
	readonly type: 'error'
	readonly message: string
}

export interface PongMessage {
	readonly type: 'pong'
}

export type ServerMessage =
	| SnapshotMessage
	| OutputMessage
	| ExitMessage
	| ErrorMessage
	| PongMessage

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFinitePositiveInteger(value: unknown): value is number {
	return Number.isInteger(value) && typeof value === 'number' && value > 0
}

const utf8Encoder = new TextEncoder()

function isInputWithinLimit(value: string): boolean {
	return utf8Encoder.encode(value).byteLength <= MAX_CLIENT_INPUT_BYTES
}

export function serialiseClientMessage(message: ClientMessage): string {
	return JSON.stringify(message)
}

export function serialiseServerMessage(message: ServerMessage): string {
	return JSON.stringify(message)
}

export function parseClientMessage(payload: string): ClientMessage | null {
	try {
		const parsed: unknown = JSON.parse(payload)
		if (!isRecord(parsed) || typeof parsed.type !== 'string') {
			return null
		}

		switch (parsed.type) {
			case 'input':
				return typeof parsed.data === 'string' && isInputWithinLimit(parsed.data)
					? { type: 'input', data: parsed.data }
					: null

			case 'resize':
				return isFinitePositiveInteger(parsed.cols) &&
					isFinitePositiveInteger(parsed.rows) &&
					parsed.cols <= MAX_RESIZE_COLS &&
					parsed.rows <= MAX_RESIZE_ROWS
					? { type: 'resize', cols: parsed.cols, rows: parsed.rows }
					: null

			case 'ping':
				return { type: 'ping' }

			default:
				return null
		}
	} catch {
		return null
	}
}

export function parseServerMessage(payload: string): ServerMessage | null {
	try {
		const parsed: unknown = JSON.parse(payload)
		if (!isRecord(parsed) || typeof parsed.type !== 'string') {
			return null
		}

		switch (parsed.type) {
			case 'snapshot':
				return typeof parsed.data === 'string' ? { type: 'snapshot', data: parsed.data } : null

			case 'output':
				return typeof parsed.data === 'string' ? { type: 'output', data: parsed.data } : null

			case 'exit':
				return typeof parsed.exitCode === 'number' &&
					(parsed.signal === null || typeof parsed.signal === 'number')
					? {
							type: 'exit',
							exitCode: parsed.exitCode,
							signal: parsed.signal,
						}
					: null

			case 'error':
				return typeof parsed.message === 'string'
					? { type: 'error', message: parsed.message }
					: null

			case 'pong':
				return { type: 'pong' }

			default:
				return null
		}
	} catch {
		return null
	}
}
