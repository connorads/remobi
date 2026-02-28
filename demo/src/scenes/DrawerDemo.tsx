import type React from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Caption } from '../components/Caption'
import { PhoneMockup } from '../components/PhoneMockup'
import { Terminal } from '../components/Terminal'
import { TmuxStatusBar } from '../components/TmuxStatusBar'
import { TapFinger } from '../components/TouchFinger'
import { WebmuxDrawer } from '../components/WebmuxDrawer'
import { WebmuxToolbar } from '../components/WebmuxToolbar'
import { claudeCodeScreen, claudeCodeStatus } from '../screens'
import { colours } from '../theme'

/**
 * Scene 3: Tap ☰ More → drawer slides up → pause → drawer closes (4s / 120 frames)
 *
 * Timeline:
 * 0-15:   Show Claude Code with toolbar
 * 15:     Finger taps ☰ More button
 * 20-28:  Drawer slides up (8 frames ease-out)
 * 28-90:  Drawer visible, pause to show grid
 * 90-98:  Drawer slides down
 * 98-120: Terminal visible again
 */
export const DrawerDemo: React.FC = () => {
	const frame = useCurrentFrame()

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
						<Terminal screen={claudeCodeScreen} />
						<TmuxStatusBar {...claudeCodeStatus} />
						<WebmuxToolbar highlightButton={'\u2630 More'} highlightAt={15} />

						{/* Tap on ☰ More — positioned over toolbar row 2, roughly centre-left */}
						<TapFinger tapFrame={15} position={[195, 780]} />

						{/* Drawer */}
						<WebmuxDrawer openAt={20} closeAt={90} />
					</div>
				</PhoneMockup>
				<Caption text="Quick tmux commands" />
			</div>
		</AbsoluteFill>
	)
}
