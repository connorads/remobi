import type { ButtonArrayInput } from './types'

/** Type predicate — Array.isArray doesn't narrow `readonly T[]` from generic unions */
function isReadonlyArray<T extends { readonly id: string }>(
	input: ButtonArrayInput<T>,
): input is readonly T[] {
	return Array.isArray(input)
}

/**
 * Resolve a ButtonArrayInput against the defaults array.
 *
 * - undefined → return defaults unchanged
 * - Array → return as-is (replaces defaults entirely)
 * - Function → call with defaults, return result
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

	return input(defaults)
}
