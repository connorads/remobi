import type React from 'react'
import { AbsoluteFill, spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT_FAMILY } from '../fonts'
import { colours } from '../theme'

/**
 * Scene 6: "webmux" logo + subtitle + GitHub URL, hold, fade (3.5s / 105 frames)
 *
 * Timeline:
 * 0-20:  Title springs in (JetBrains Mono, glow)
 * 10-30: Subtitle fades in
 * 25-40: GitHub URL fades in
 * 40-105: Hold
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
	const urlEntrance = spring({
		frame: frame - 25,
		fps,
		config: { damping: 200 },
	})

	const titleScale = interpolate(titleEntrance, [0, 1], [0.8, 1])
	const titleOpacity = interpolate(titleEntrance, [0, 1], [0, 1])
	const subtitleOpacity = interpolate(subtitleEntrance, [0, 1], [0, 1])
	const subtitleY = interpolate(subtitleEntrance, [0, 1], [15, 0])
	const urlOpacity = interpolate(urlEntrance, [0, 1], [0, 1])

	return (
		<AbsoluteFill
			style={{
				background: `radial-gradient(ellipse at center, #242438 0%, ${colours.bg} 70%)`,
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
						fontFamily: `"${FONT_FAMILY}", monospace`,
						letterSpacing: -1,
						textShadow: `0 0 30px rgba(137,180,250,0.35), 0 0 60px rgba(137,180,250,0.15)`,
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
			<div
				style={{
					opacity: urlOpacity,
					marginTop: 20,
					textAlign: 'center',
				}}
			>
				<div
					style={{
						fontSize: 13,
						color: colours.overlay,
						fontFamily: `"${FONT_FAMILY}", monospace`,
					}}
				>
					github.com/connorads/webmux
				</div>
			</div>
		</AbsoluteFill>
	)
}
