import type React from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Caption } from '../components/Caption'
import { DrawerOverlay } from '../components/DrawerOverlay'
import { PhoneMockup } from '../components/PhoneMockup'
import { Terminal } from '../components/Terminal'
import { TmuxStatusBar } from '../components/TmuxStatusBar'
import { TapFinger } from '../components/TouchFinger'
import { WebmuxToolbar } from '../components/WebmuxToolbar'
import { claudeCodeDetailScreen, claudeCodeDetailStatus } from '../screens'
import { colours } from '../theme'

/**
 * Scene 3: Claude Code active session — AI writing real code (5s / 150 frames)
 *
 * Timeline:
 * 0-33:    "Thinking…" shimmer, edit block appears line by line
 * 43:      "✓ Applied edit" appears
 * 49-54:   Response text typewriter, input prompt
 * 59-61:   Finger taps ☰ More
 * 61-81:   Drawer slides up, holds open
 * 81:      Drawer closes
 * 85-87:   Finger taps Esc
 * 87-150:  Hold + transition
 */
export const AITools: React.FC = () => {
	const frame = useCurrentFrame()

	// Toolbar button highlight: ☰ More tap at 59, Esc tap at 85
	const highlightButton =
		frame >= 59 && frame < 63 ? '\u2630 More' : frame >= 85 && frame < 89 ? 'Esc' : undefined
	const highlightAt = frame >= 59 && frame < 63 ? 59 : frame >= 85 && frame < 89 ? 85 : 0

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
						<Terminal screen={claudeCodeDetailScreen} />
						<TmuxStatusBar {...claudeCodeDetailStatus} />
						<WebmuxToolbar highlightButton={highlightButton} highlightAt={highlightAt} />

						{/* Finger taps ☰ More to open drawer */}
						<TapFinger tapFrame={59} position={[175, 775]} />
						{/* Finger taps Esc */}
						<TapFinger tapFrame={85} position={[25, 735]} />

						{/* Command drawer overlay */}
						<DrawerOverlay showFrame={61} hideFrame={81} />
					</div>
				</PhoneMockup>
				<Caption text="Claude Code. One tap away." />
			</div>
		</AbsoluteFill>
	)
}
