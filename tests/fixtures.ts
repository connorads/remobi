import type { XTerminal } from '../src/types'

/** Base mock terminal — all methods are no-ops */
export function mockTerminal(): XTerminal {
	return {
		options: { fontSize: 14 },
		input(_data: string, _wasUserInput: boolean) {},
		focus() {},
		onData(_handler: (data: string) => void) {
			return { dispose() {} }
		},
	}
}

/** Mock terminal that records input data */
export interface MockTermWithSent extends XTerminal {
	readonly sent: string[]
}

export function mockTerminalWithSent(): MockTermWithSent {
	const sent: string[] = []
	return {
		sent,
		cols: 80,
		rows: 24,
		options: { fontSize: 14 },
		input(data: string, _wasUserInput: boolean) {
			sent.push(data)
		},
		focus() {},
		onData(_handler: (data: string) => void) {
			return { dispose() {} }
		},
	}
}

/** Mock terminal that tracks focus state */
export function mockTerminalWithFocus(): XTerminal & { focused: boolean } {
	return {
		options: { fontSize: 14 },
		input(_data: string, _wasUserInput: boolean) {},
		focus() {
			this.focused = true
		},
		onData(_handler: (data: string) => void) {
			return { dispose() {} }
		},
		focused: false,
	}
}
