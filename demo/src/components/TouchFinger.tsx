import type React from 'react'
import { interpolate, useCurrentFrame } from 'remotion'

/**
 * Semi-transparent circle representing a finger touch.
 * Animates along a path defined by start/end coordinates.
 * Optional `holdFrames` keeps finger pressed at `from` before moving.
 * Renders trailing ghost circles during motion for a natural swipe feel.
 */
export const TouchFinger: React.FC<{
	/** Frame when the finger appears */
	startFrame: number
	/** Frame when the finger disappears */
	endFrame: number
	/** Start position [x, y] */
	from: readonly [number, number]
	/** End position [x, y] */
	to: readonly [number, number]
	/** Frames to hold at `from` before motion begins */
	holdFrames?: number
	/** Size of the finger circle */
	size?: number
}> = ({ startFrame, endFrame, from, to, holdFrames = 0, size = 44 }) => {
	const frame = useCurrentFrame()

	if (frame < startFrame || frame > endFrame + 5) return null

	// Motion starts after hold period
	const motionStart = startFrame + holdFrames
	const progress = interpolate(frame, [motionStart, endFrame], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	})

	const opacity = interpolate(
		frame,
		[startFrame, startFrame + 3, endFrame - 2, endFrame + 5],
		[0, 0.8, 0.8, 0],
		{ extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
	)

	const x = interpolate(progress, [0, 1], [from[0], to[0]])
	const y = interpolate(progress, [0, 1], [from[1], to[1]])

	// Motion trail: 4 ghost circles lagging behind the main finger
	const isMoving = frame >= motionStart && frame <= endFrame
	const trails = [2, 4, 6, 8] as const

	return (
		<>
			{/* Ghost trail circles (behind the finger) */}
			{isMoving &&
				trails.map((delay) => {
					// Only show trail once the delayed frame has started moving
					if (frame - delay < motionStart) return null
					const trailProgress = interpolate(
						frame - delay,
						[motionStart, endFrame],
						[0, 1],
						{ extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
					)
					const trailX = interpolate(trailProgress, [0, 1], [from[0], to[0]])
					const trailY = interpolate(trailProgress, [0, 1], [from[1], to[1]])
					const trailScale = 1 - delay * 0.08
					const trailOpacity = opacity * (0.4 - delay * 0.08)

					return (
						<div
							key={delay}
							style={{
								position: 'absolute',
								left: trailX - size / 2,
								top: trailY - size / 2,
								width: size,
								height: size,
								borderRadius: '50%',
								background: 'rgba(255,255,255,0.3)',
								opacity: trailOpacity,
								transform: `scale(${trailScale})`,
								zIndex: 19999,
								pointerEvents: 'none',
							}}
						/>
					)
				})}

			{/* Main finger circle */}
			<div
				style={{
					position: 'absolute',
					left: x - size / 2,
					top: y - size / 2,
					width: size,
					height: size,
					borderRadius: '50%',
					background: 'rgba(255,255,255,0.5)',
					border: '2px solid rgba(255,255,255,0.6)',
					boxShadow: '0 0 12px rgba(255,255,255,0.25)',
					opacity,
					zIndex: 20000,
					pointerEvents: 'none',
				}}
			/>
		</>
	)
}

/** Stationary tap animation — appears, pulses, disappears */
export const TapFinger: React.FC<{
	/** Frame when the tap occurs */
	tapFrame: number
	/** Position [x, y] */
	position: readonly [number, number]
	/** Size of the finger circle */
	size?: number
}> = ({ tapFrame, position, size = 44 }) => {
	const frame = useCurrentFrame()
	const duration = 12

	if (frame < tapFrame || frame > tapFrame + duration) return null

	const elapsed = frame - tapFrame
	const scale = interpolate(elapsed, [0, 3, 6, duration], [0.6, 1.1, 1.0, 0.8], {
		extrapolateRight: 'clamp',
	})
	const opacity = interpolate(elapsed, [0, 3, duration - 3, duration], [0, 0.8, 0.8, 0], {
		extrapolateRight: 'clamp',
	})

	return (
		<div
			style={{
				position: 'absolute',
				left: position[0] - size / 2,
				top: position[1] - size / 2,
				width: size,
				height: size,
				borderRadius: '50%',
				background: 'rgba(255,255,255,0.5)',
				border: '2px solid rgba(255,255,255,0.6)',
				boxShadow: '0 0 12px rgba(255,255,255,0.25)',
				opacity,
				transform: `scale(${scale})`,
				zIndex: 20000,
				pointerEvents: 'none',
			}}
		/>
	)
}
