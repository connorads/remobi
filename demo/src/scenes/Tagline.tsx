import type React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT_FAMILY } from '../fonts'
import { CONFIDENT, SMOOTH } from '../springs'
import { colours } from '../theme'

/**
 * Scene 4: "webmux" logo + tagline + GitHub URL, confident hold (4s / 120 frames)
 *
 * Timeline:
 * 0-20:   Title springs in (confident, no wobble)
 * 15-35:  Tagline fades up
 * 30-45:  GitHub URL fades in last
 * 45-120: Hold — the video ends cleanly
 */
export const Tagline: React.FC = () => {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()

	const titleEntrance = spring({
		frame,
		fps,
		config: CONFIDENT,
	})
	const subtitleEntrance = spring({
		frame: frame - 15,
		fps,
		config: SMOOTH,
	})
	const urlEntrance = spring({
		frame: frame - 30,
		fps,
		config: SMOOTH,
	})

	const titleScale = interpolate(titleEntrance, [0, 1], [0.8, 1])
	const titleOpacity = interpolate(titleEntrance, [0, 1], [0, 1])
	const subtitleOpacity = interpolate(subtitleEntrance, [0, 1], [0, 1])
	const subtitleY = interpolate(subtitleEntrance, [0, 1], [15, 0])
	const urlOpacity = interpolate(urlEntrance, [0, 1], [0, 1])

	return (
		<AbsoluteFill
			style={{
				background: `radial-gradient(ellipse at center, #282840 0%, ${colours.bg} 70%)`,
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
						textShadow: '0 0 30px rgba(137,180,250,0.35), 0 0 60px rgba(137,180,250,0.15)',
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
					Your terminal. Everywhere.
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
