interface StartupResizeSchedulerOptions {
	readonly resize: () => void
	readonly requestAnimationFrame?: (callback: FrameRequestCallback) => number
	readonly cancelAnimationFrame?: (handle: number) => void
	readonly fontsReady?: Promise<unknown> | null
}

interface StartupResizeScheduler {
	scheduleImmediate(): void
	scheduleAfterLayout(): void
	dispose(): void
}

type ResizeStage = 'idle' | 'immediate' | 'after-layout'

export function createStartupResizeScheduler(
	options: StartupResizeSchedulerOptions,
): StartupResizeScheduler {
	const requestAnimationFrameImpl =
		options.requestAnimationFrame ?? window.requestAnimationFrame.bind(window)
	const cancelAnimationFrameImpl =
		options.cancelAnimationFrame ?? window.cancelAnimationFrame.bind(window)

	let disposed = false
	let scheduledStage: ResizeStage = 'idle'
	let firstFrameHandle: number | null = null
	let secondFrameHandle: number | null = null

	function resetHandles(): void {
		firstFrameHandle = null
		secondFrameHandle = null
	}

	function runResize(): void {
		if (disposed) {
			resetHandles()
			scheduledStage = 'idle'
			return
		}

		if (scheduledStage === 'after-layout' && secondFrameHandle === null) {
			secondFrameHandle = requestAnimationFrameImpl(() => {
				secondFrameHandle = null
				const shouldResize = !disposed
				scheduledStage = 'idle'
				if (shouldResize) {
					options.resize()
				}
			})
			return
		}

		resetHandles()
		scheduledStage = 'idle'
		options.resize()
	}

	function schedule(stage: Exclude<ResizeStage, 'idle'>): void {
		if (disposed) {
			return
		}

		if (stage === 'after-layout' || scheduledStage === 'idle') {
			scheduledStage = stage
		}

		if (firstFrameHandle !== null || secondFrameHandle !== null) {
			return
		}

		firstFrameHandle = requestAnimationFrameImpl(() => {
			firstFrameHandle = null
			runResize()
		})
	}

	options.fontsReady?.then(
		() => {
			schedule('after-layout')
		},
		() => {
			// Font loading is best-effort; initial fit still proceeds without it.
		},
	)

	return {
		scheduleImmediate(): void {
			schedule('immediate')
		},
		scheduleAfterLayout(): void {
			schedule('after-layout')
		},
		dispose(): void {
			disposed = true
			if (firstFrameHandle !== null) {
				cancelAnimationFrameImpl(firstFrameHandle)
			}
			if (secondFrameHandle !== null) {
				cancelAnimationFrameImpl(secondFrameHandle)
			}
			resetHandles()
			scheduledStage = 'idle'
		},
	}
}
