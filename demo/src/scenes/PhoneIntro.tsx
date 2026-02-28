import type React from 'react'
import { AbsoluteFill, spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { Caption } from '../components/Caption'
import { FontControls } from '../components/FontControls'
import { PhoneMockup } from '../components/PhoneMockup'
import { Terminal } from '../components/Terminal'
import { TmuxStatusBar } from '../components/TmuxStatusBar'
import { WebmuxToolbar } from '../components/WebmuxToolbar'
import { shellScreen, shellStatus } from '../screens'
import { colours } from '../theme'

/** Scene 1: Phone mockup slides in, terminal typing, toolbar visible (3s / 90 frames) */
export const PhoneIntro: React.FC = () => {
	const frame = useCurrentFrame()
	const { fps } = useVideoConfig()

	// Phone slides up from bottom with spring
	const entrance = spring({
		frame,
		fps,
		config: { damping: 12, stiffness: 100 },
	})
	const translateY = interpolate(entrance, [0, 1], [300, 0])

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
			<div style={{ transform: `translateY(${translateY}px)` }}>
				<PhoneMockup>
					<div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
						<FontControls />
						<Terminal screen={shellScreen} />
						<TmuxStatusBar {...shellStatus} />
						<WebmuxToolbar />
					</div>
				</PhoneMockup>
				<Caption text="tmux on your phone" />
			</div>
		</AbsoluteFill>
	)
}
