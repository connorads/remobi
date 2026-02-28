import type React from 'react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'
import { Caption } from '../components/Caption'
import { PhoneMockup } from '../components/PhoneMockup'
import { SwipeIndicator } from '../components/SwipeIndicator'
import { Terminal, SlidingTerminal } from '../components/Terminal'
import { TmuxStatusBar } from '../components/TmuxStatusBar'
import { TouchFinger } from '../components/TouchFinger'
import { WebmuxToolbar } from '../components/WebmuxToolbar'
import {
	shellScreen, shellStatus,
	claudeCodeScreen, claudeCodeStatus,
	openCodeScreen, openCodeStatus,
} from '../screens'
import { colours } from '../theme'

/**
 * Scene 2: Swipe left → Claude Code, swipe right → OpenCode (4s / 120 frames)
 *
 * Timeline:
 * 0-15:   Show shell (window 0)
 * 15-30:  Finger swipes left → slide to Claude Code (window 1)
 * 30-65:  Show Claude Code
 * 65-80:  Finger swipes left → slide to OpenCode (window 2)
 * 80-120: Show OpenCode
 */
export const SwipeDemo: React.FC = () => {
	const frame = useCurrentFrame()
	const PHONE_W = 390

	// Swipe 1: frame 15→30, shell slides left, claude slides in from right
	const swipe1 = interpolate(frame, [20, 30], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.ease),
	})

	// Swipe 2: frame 65→75, claude slides left, opencode slides in from right
	const swipe2 = interpolate(frame, [70, 80], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.ease),
	})

	// Shell offset: 0 → -PHONE_W
	const shellOffset = -swipe1 * PHONE_W
	// Claude offset: +PHONE_W → 0 → -PHONE_W
	const claudeOffset = (1 - swipe1) * PHONE_W - swipe2 * PHONE_W
	// OpenCode offset: +PHONE_W → 0
	const openCodeOffset = (1 - swipe2) * PHONE_W

	// Which status bar to show
	const status = frame < 25 ? shellStatus : frame < 75 ? claudeCodeStatus : openCodeStatus

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
			<div>
				<PhoneMockup>
					<div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
						{/* Terminal area with sliding panels */}
						<div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
							<SlidingTerminal screen={shellScreen} offsetX={shellOffset} />
							<SlidingTerminal screen={claudeCodeScreen} offsetX={claudeOffset} />
							<SlidingTerminal screen={openCodeScreen} offsetX={openCodeOffset} />

							{/* Swipe indicators */}
							<SwipeIndicator direction="right" showAt={22} />
							<SwipeIndicator direction="right" showAt={72} />

							{/* Touch fingers */}
							<TouchFinger
								startFrame={15}
								endFrame={28}
								from={[300, 350]}
								to={[80, 350]}
							/>
							<TouchFinger
								startFrame={65}
								endFrame={78}
								from={[300, 350]}
								to={[80, 350]}
							/>
						</div>
						<TmuxStatusBar {...status} />
						<WebmuxToolbar />
					</div>
				</PhoneMockup>
				<Caption text="Swipe between sessions" />
			</div>
		</AbsoluteFill>
	)
}
