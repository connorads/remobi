import type React from 'react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'
import { Caption } from '../components/Caption'
import { PhoneMockup } from '../components/PhoneMockup'
import { SwipeIndicator } from '../components/SwipeIndicator'
import { SlidingTerminal } from '../components/Terminal'
import { TmuxStatusBar } from '../components/TmuxStatusBar'
import { TouchFinger } from '../components/TouchFinger'
import { WebmuxToolbar } from '../components/WebmuxToolbar'
import { claudeCodeScreen, claudeCodeStatus, shellScreen, shellStatus } from '../screens'
import { colours } from '../theme'

/**
 * Scene 2: One deliberate swipe from shell → Claude Code (5s / 150 frames)
 *
 * Timeline:
 * 0-20:    Show shell terminal
 * 20-24:   Finger appears, press-hold (4 frames)
 * 24-42:   Finger swipes left over 18 frames (ease-out)
 * 42-44:   Swipe indicator arrow flashes
 * 44-120:  Claude Code visible, content staggers in
 * 120-135: Hold — viewer processes the diff
 * 135-150: Transition begins
 */
export const SwipeDemo: React.FC = () => {
	const frame = useCurrentFrame()
	const PHONE_W = 390

	// Swipe: frame 24→42, shell slides left, claude slides in from right
	const swipe = interpolate(frame, [24, 42], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.ease),
	})

	const shellOffset = -swipe * PHONE_W
	const claudeOffset = (1 - swipe) * PHONE_W

	// Status bar switches at swipe midpoint
	const status = frame < 33 ? shellStatus : claudeCodeStatus

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
			<div style={{ transform: 'scale(0.88)', transformOrigin: 'center center' }}>
				<PhoneMockup>
					<div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
						{/* Terminal area with sliding panels */}
						<div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
							<SlidingTerminal screen={shellScreen} offsetX={shellOffset} />
							<SlidingTerminal screen={claudeCodeScreen} offsetX={claudeOffset} />

							{/* Swipe indicator */}
							<SwipeIndicator direction="right" showAt={17} />

							{/* Touch finger: 4-frame press-hold (20-24), then swipe (24-42) */}
							<TouchFinger
								startFrame={20}
								endFrame={42}
								from={[300, 350]}
								to={[80, 350]}
								holdFrames={4}
							/>
						</div>
						<TmuxStatusBar {...status} />
						<WebmuxToolbar />
					</div>
				</PhoneMockup>
				<Caption text="No prefix key. Just swipe." />
			</div>
		</AbsoluteFill>
	)
}
