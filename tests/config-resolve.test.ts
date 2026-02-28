import { describe, expect, test } from 'bun:test'
import { resolveButtonArray } from '../src/config-resolve'
import type { ControlButton } from '../src/types'

function btn(id: string): ControlButton {
	return { id, label: id, description: id, action: { type: 'send', data: id } }
}

const A = btn('a')
const B = btn('b')
const C = btn('c')
const X = btn('x')
const Y = btn('y')

describe('resolveButtonArray', () => {
	test('undefined returns defaults unchanged', () => {
		const defaults = [A, B, C]
		expect(resolveButtonArray(defaults, undefined)).toBe(defaults)
	})

	test('plain array replaces defaults entirely', () => {
		const result = resolveButtonArray([A, B, C], [X, Y])
		expect(result).toEqual([X, Y])
	})

	test('empty array replaces defaults with empty', () => {
		const result = resolveButtonArray([A, B, C], [])
		expect(result).toEqual([])
	})

	test('function form receives defaults and returns transformed array', () => {
		const result = resolveButtonArray([A, B, C], (defaults) => defaults.filter((b) => b.id !== 'b'))
		expect(result).toEqual([A, C])
	})

	test('function form can append', () => {
		const result = resolveButtonArray([A, B], (defaults) => [...defaults, X])
		expect(result).toEqual([A, B, X])
	})

	test('function form can prepend', () => {
		const result = resolveButtonArray([A, B], (defaults) => [X, ...defaults])
		expect(result).toEqual([X, A, B])
	})

	test('function form can reorder', () => {
		const result = resolveButtonArray([A, B, C], (defaults) => [...defaults].reverse())
		expect(result).toEqual([C, B, A])
	})

	test('function form can replace by id', () => {
		const B2 = { ...B, label: 'b-new' }
		const result = resolveButtonArray([A, B, C], (defaults) =>
			defaults.map((b) => (b.id === 'b' ? B2 : b)),
		)
		expect(result).toEqual([A, B2, C])
	})
})
