import type React from 'react'
import { AbsoluteFill, spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { colours } from '../theme'

/**
 * Scene 6: "webmux" logo + subtitle, hold, fade (3s / 90 frames)
 *
 * Timeline:
 * 0-20:  Title springs in
 * 10-30: Subtitle fades in
 * 30-90: Hold
 */
export const Tagline: React.FC = () => {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()

	const titleEntrance = spring({
		frame,
		fps,
		config: { damping: 12, stiffness: 100 },
	})
	const subtitleEntrance = spring({
		frame: frame - 10,
		fps,
		config: { damping: 200 },
	})

	const titleScale = interpolate(titleEntrance, [0, 1], [0.8, 1])
	const titleOpacity = interpolate(titleEntrance, [0, 1], [0, 1])
	const subtitleOpacity = interpolate(subtitleEntrance, [0, 1], [0, 1])
	const subtitleY = interpolate(subtitleEntrance, [0, 1], [15, 0])

	return (
		<AbsoluteFill
			style={{
				background: colours.bg,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<div
				style={{
					textAlign: 'center',
					transform: `scale(${titleScale})`,
					opacity: titleOpacity,
				}}
			>
				<div
					style={{
						fontSize: 56,
						fontWeight: 700,
						color: colours.blue,
						fontFamily: 'system-ui, -apple-system, sans-serif',
						letterSpacing: -1,
					}}
				>
					webmux
				</div>
			</div>
			<div
				style={{
					opacity: subtitleOpacity,
					transform: `translateY(${subtitleY}px)`,
					marginTop: 16,
					textAlign: 'center',
					maxWidth: 300,
				}}
			>
				<div
					style={{
						fontSize: 16,
						color: colours.subtext,
						fontFamily: 'system-ui, -apple-system, sans-serif',
						lineHeight: 1.5,
					}}
				>
					Mobile-friendly terminal overlay
					<br />
					for ttyd + tmux
				</div>
			</div>
		</AbsoluteFill>
	)
}
