import type { ButtonArrayInput, ButtonArrayPatch } from './types'

/** Type predicate — Array.isArray doesn't narrow `readonly T[]` from generic unions */
function isReadonlyArray<T extends { readonly id: string }>(
	input: ButtonArrayInput<T>,
): input is readonly T[] {
	return Array.isArray(input)
}

/** Type predicate — typeof 'function' doesn't narrow generic callable union members */
function isTransformFn<T extends { readonly id: string }>(
	input: ButtonArrayInput<T>,
): input is (defaults: readonly T[]) => readonly T[] {
	return typeof input === 'function'
}

/**
 * Resolve a ButtonArrayInput against the defaults array.
 *
 * - undefined → return defaults unchanged
 * - Array → return as-is (backwards compat: replaces defaults entirely)
 * - Function → call with defaults, return result
 * - Patch → apply patch operations in order:
 *   remove → replace → insertBefore → insertAfter → prepend → append
 */
export function resolveButtonArray<T extends { readonly id: string }>(
	defaults: readonly T[],
	input: ButtonArrayInput<T> | undefined,
): readonly T[] {
	if (input === undefined) {
		return defaults
	}

	if (isReadonlyArray(input)) {
		return input
	}

	if (isTransformFn(input)) {
		return input(defaults)
	}

	return applyPatch(defaults, input)
}

function applyPatch<T extends { readonly id: string }>(
	base: readonly T[],
	patch: ButtonArrayPatch<T>,
): readonly T[] {
	let result = [...base]

	// remove
	if (patch.remove && patch.remove.length > 0) {
		const removeSet = new Set(patch.remove)
		result = result.filter((btn) => !removeSet.has(btn.id))
	}

	// replace (in-place by id)
	if (patch.replace && patch.replace.length > 0) {
		const replaceMap = new Map(patch.replace.map((btn) => [btn.id, btn]))
		result = result.map((btn) => replaceMap.get(btn.id) ?? btn)
	}

	// insertBefore
	if (patch.insertBefore) {
		const { id, buttons } = patch.insertBefore
		const idx = result.findIndex((btn) => btn.id === id)
		if (idx === -1) {
			// target not found: fall back to prepend
			result = [...buttons, ...result]
		} else {
			result = [...result.slice(0, idx), ...buttons, ...result.slice(idx)]
		}
	}

	// insertAfter
	if (patch.insertAfter) {
		const { id, buttons } = patch.insertAfter
		const idx = result.findIndex((btn) => btn.id === id)
		if (idx === -1) {
			// target not found: fall back to append
			result = [...result, ...buttons]
		} else {
			result = [...result.slice(0, idx + 1), ...buttons, ...result.slice(idx + 1)]
		}
	}

	// prepend
	if (patch.prepend && patch.prepend.length > 0) {
		result = [...patch.prepend, ...result]
	}

	// append
	if (patch.append && patch.append.length > 0) {
		result = [...result, ...patch.append]
	}

	return result
}
