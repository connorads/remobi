/** Gesture types that can claim the lock */
export type GestureType = 'none' | 'pinch' | 'scroll'

/** Shared lock so only one gesture owns two-finger input at a time */
export interface GestureLock {
	current: GestureType
}

/** Create a gesture lock in the unclaimed state */
export function createGestureLock(): GestureLock {
	return { current: 'none' }
}

/** Try to claim the lock. Succeeds only if no gesture owns it yet. */
export function tryLock(lock: GestureLock, type: GestureType): boolean {
	if (lock.current !== 'none') return false
	lock.current = type
	return true
}

/** Release the lock back to unclaimed */
export function resetLock(lock: GestureLock): void {
	lock.current = 'none'
}
