import { describe, expect, test } from 'vitest'
import { createStartupResizeScheduler } from '../src/startup-resize'

interface FrameHarness {
	readonly flush: () => void
	readonly pending: () => number
	readonly requestAnimationFrame: (callback: FrameRequestCallback) => number
	readonly cancelAnimationFrame: (handle: number) => void
}

function createFrameHarness(): FrameHarness {
	let nextHandle = 1
	const callbacks = new Map<number, FrameRequestCallback>()

	return {
		flush(): void {
			const frameCallbacks = [...callbacks.values()]
			callbacks.clear()
			for (const callback of frameCallbacks) {
				callback(0)
			}
		},
		pending(): number {
			return callbacks.size
		},
		requestAnimationFrame(callback: FrameRequestCallback): number {
			const handle = nextHandle
			nextHandle += 1
			callbacks.set(handle, callback)
			return handle
		},
		cancelAnimationFrame(handle: number): void {
			callbacks.delete(handle)
		},
	}
}

function deferred<T>(): {
	readonly promise: Promise<T>
	readonly resolve: (value: T | PromiseLike<T>) => void
} {
	let resolvePromise: ((value: T | PromiseLike<T>) => void) | null = null
	const promise = new Promise<T>((resolve) => {
		resolvePromise = resolve
	})

	if (resolvePromise === null) {
		throw new Error('failed to create deferred promise')
	}

	return { promise, resolve: resolvePromise }
}

describe('createStartupResizeScheduler', () => {
	test('coalesces immediate and after-layout requests into one final resize', () => {
		const frames = createFrameHarness()
		const resizeCalls: number[] = []
		const scheduler = createStartupResizeScheduler({
			resize: () => {
				resizeCalls.push(Date.now())
			},
			requestAnimationFrame: frames.requestAnimationFrame,
			cancelAnimationFrame: frames.cancelAnimationFrame,
		})

		scheduler.scheduleImmediate()
		scheduler.scheduleAfterLayout()

		expect(resizeCalls).toHaveLength(0)
		expect(frames.pending()).toBe(1)

		frames.flush()
		expect(resizeCalls).toHaveLength(0)
		expect(frames.pending()).toBe(1)

		frames.flush()
		expect(resizeCalls).toHaveLength(1)
		expect(frames.pending()).toBe(0)
	})

	test('schedules a post-font resize when fonts become ready', async () => {
		const frames = createFrameHarness()
		const resizeCalls: number[] = []
		const fontsReady = deferred<void>()
		createStartupResizeScheduler({
			resize: () => {
				resizeCalls.push(Date.now())
			},
			requestAnimationFrame: frames.requestAnimationFrame,
			cancelAnimationFrame: frames.cancelAnimationFrame,
			fontsReady: fontsReady.promise,
		})

		fontsReady.resolve()
		await Promise.resolve()

		expect(frames.pending()).toBe(1)
		frames.flush()
		expect(resizeCalls).toHaveLength(0)
		frames.flush()
		expect(resizeCalls).toHaveLength(1)
	})

	test('dispose cancels pending startup frames', () => {
		const frames = createFrameHarness()
		const resizeCalls: number[] = []
		const scheduler = createStartupResizeScheduler({
			resize: () => {
				resizeCalls.push(Date.now())
			},
			requestAnimationFrame: frames.requestAnimationFrame,
			cancelAnimationFrame: frames.cancelAnimationFrame,
		})

		scheduler.scheduleAfterLayout()
		expect(frames.pending()).toBe(1)

		scheduler.dispose()
		expect(frames.pending()).toBe(0)

		frames.flush()
		expect(resizeCalls).toHaveLength(0)
	})
})
