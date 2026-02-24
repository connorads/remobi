import { describe, expect, test } from 'bun:test'
import { resolveButtonArray } from '../src/config-resolve'
import type { ControlButton } from '../src/types'

function btn(id: string): ControlButton {
	return { id, label: id, description: id, action: { type: 'send', data: id } }
}

const A = btn('a')
const B = btn('b')
const C = btn('c')
const D = btn('d')
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

	describe('patch: append', () => {
		test('appends buttons to end', () => {
			const result = resolveButtonArray([A, B], { append: [X, Y] })
			expect(result).toEqual([A, B, X, Y])
		})

		test('empty append is a no-op', () => {
			const result = resolveButtonArray([A, B], { append: [] })
			expect(result).toEqual([A, B])
		})
	})

	describe('patch: prepend', () => {
		test('prepends buttons to start', () => {
			const result = resolveButtonArray([A, B], { prepend: [X, Y] })
			expect(result).toEqual([X, Y, A, B])
		})
	})

	describe('patch: remove', () => {
		test('removes buttons by id', () => {
			const result = resolveButtonArray([A, B, C], { remove: ['b'] })
			expect(result).toEqual([A, C])
		})

		test('remove multiple ids', () => {
			const result = resolveButtonArray([A, B, C], { remove: ['a', 'c'] })
			expect(result).toEqual([B])
		})

		test('remove with unknown id is a no-op', () => {
			const result = resolveButtonArray([A, B], { remove: ['z'] })
			expect(result).toEqual([A, B])
		})
	})

	describe('patch: replace', () => {
		test('replaces button in-place by id', () => {
			const B2 = { ...B, label: 'b-new' }
			const result = resolveButtonArray([A, B, C], { replace: [B2] })
			expect(result).toEqual([A, B2, C])
		})

		test('replace with unknown id is ignored', () => {
			const result = resolveButtonArray([A, B], { replace: [X] })
			expect(result).toEqual([A, B])
		})
	})

	describe('patch: insertBefore', () => {
		test('inserts buttons before target id', () => {
			const result = resolveButtonArray([A, B, C], { insertBefore: { id: 'b', buttons: [X] } })
			expect(result).toEqual([A, X, B, C])
		})

		test('inserts before first element', () => {
			const result = resolveButtonArray([A, B], { insertBefore: { id: 'a', buttons: [X] } })
			expect(result).toEqual([X, A, B])
		})

		test('falls back to prepend when target not found', () => {
			const result = resolveButtonArray([A, B], { insertBefore: { id: 'z', buttons: [X] } })
			expect(result).toEqual([X, A, B])
		})
	})

	describe('patch: insertAfter', () => {
		test('inserts buttons after target id', () => {
			const result = resolveButtonArray([A, B, C], { insertAfter: { id: 'b', buttons: [X] } })
			expect(result).toEqual([A, B, X, C])
		})

		test('inserts after last element', () => {
			const result = resolveButtonArray([A, B], { insertAfter: { id: 'b', buttons: [X] } })
			expect(result).toEqual([A, B, X])
		})

		test('falls back to append when target not found', () => {
			const result = resolveButtonArray([A, B], { insertAfter: { id: 'z', buttons: [X] } })
			expect(result).toEqual([A, B, X])
		})
	})

	describe('patch: combined operations', () => {
		test('remove then append', () => {
			const result = resolveButtonArray([A, B, C], { remove: ['b'], append: [X] })
			expect(result).toEqual([A, C, X])
		})

		test('remove then prepend', () => {
			const result = resolveButtonArray([A, B, C], { remove: ['a'], prepend: [X] })
			expect(result).toEqual([X, B, C])
		})

		test('replace then insertAfter', () => {
			const B2 = { ...B, label: 'b-new' }
			const result = resolveButtonArray([A, B, C], {
				replace: [B2],
				insertAfter: { id: 'b', buttons: [D] },
			})
			expect(result).toEqual([A, B2, D, C])
		})

		test('remove + replace + append all together', () => {
			const B2 = { ...B, label: 'b-new' }
			const result = resolveButtonArray([A, B, C], {
				remove: ['a'],
				replace: [B2],
				append: [D],
			})
			expect(result).toEqual([B2, C, D])
		})
	})

	test('empty patch object returns defaults unchanged', () => {
		const result = resolveButtonArray([A, B, C], {})
		expect(result).toEqual([A, B, C])
	})
})
