import { describe, expect, test } from 'vitest'
import {
	MAX_CLIENT_INPUT_BYTES,
	MAX_RESIZE_COLS,
	MAX_RESIZE_ROWS,
	parseClientMessage,
	parseServerMessage,
	serialiseClientMessage,
	serialiseServerMessage,
} from '../src/session-protocol'

describe('session protocol', () => {
	test('round-trips input messages', () => {
		const message = { type: 'input' as const, data: 'ls\r' }
		expect(parseClientMessage(serialiseClientMessage(message))).toEqual(message)
	})

	test('rejects malformed resize messages', () => {
		expect(parseClientMessage(JSON.stringify({ type: 'resize', cols: 80, rows: 0 }))).toBeNull()
		expect(parseClientMessage('{"type":"resize","cols":"80","rows":24}')).toBeNull()
	})

	test('rejects oversized input messages', () => {
		const oversized = 'x'.repeat(MAX_CLIENT_INPUT_BYTES + 1)
		expect(parseClientMessage(JSON.stringify({ type: 'input', data: oversized }))).toBeNull()
	})

	test('rejects oversized resize messages', () => {
		expect(
			parseClientMessage(JSON.stringify({ type: 'resize', cols: MAX_RESIZE_COLS + 1, rows: 24 })),
		).toBeNull()
		expect(
			parseClientMessage(JSON.stringify({ type: 'resize', cols: 80, rows: MAX_RESIZE_ROWS + 1 })),
		).toBeNull()
	})

	test('round-trips snapshot messages', () => {
		const message = { type: 'snapshot' as const, data: '\u001b[2Jhello' }
		expect(parseServerMessage(serialiseServerMessage(message))).toEqual(message)
	})

	test('rejects unknown server message types', () => {
		expect(parseServerMessage('{"type":"mystery"}')).toBeNull()
	})
})
