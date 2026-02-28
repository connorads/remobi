import type React from 'react'
import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { PhoneIntro } from './scenes/PhoneIntro'
import { SwipeDemo } from './scenes/SwipeDemo'
import { DrawerDemo } from './scenes/DrawerDemo'
import { AITools } from './scenes/AITools'
import { CrossPlatform } from './scenes/CrossPlatform'
import { Tagline } from './scenes/Tagline'

/** Frame counts at 30fps */
const FPS = 30
const TRANSITION_FRAMES = 15

/**
 * Main composition (~20s): 6 scenes with crossfade transitions.
 *
 * | Scene           | Duration |
 * |-----------------|----------|
 * | Phone Intro     | 3s (90f) |
 * | Swipe Demo      | 4s (120f)|
 * | Drawer Demo     | 4s (120f)|
 * | AI Tools        | 3s (90f) |
 * | Cross-Platform  | 3s (90f) |
 * | Tagline         | 3s (90f) |
 */
export const DemoVideo: React.FC = () => {
	return (
		<TransitionSeries>
			<TransitionSeries.Sequence durationInFrames={3 * FPS}>
				<PhoneIntro />
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				presentation={fade()}
				timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
			/>

			<TransitionSeries.Sequence durationInFrames={4 * FPS}>
				<SwipeDemo />
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				presentation={fade()}
				timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
			/>

			<TransitionSeries.Sequence durationInFrames={4 * FPS}>
				<DrawerDemo />
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				presentation={fade()}
				timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
			/>

			<TransitionSeries.Sequence durationInFrames={3 * FPS}>
				<AITools />
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				presentation={fade()}
				timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
			/>

			<TransitionSeries.Sequence durationInFrames={3 * FPS}>
				<CrossPlatform />
			</TransitionSeries.Sequence>

			<TransitionSeries.Transition
				presentation={fade()}
				timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
			/>

			<TransitionSeries.Sequence durationInFrames={3 * FPS}>
				<Tagline />
			</TransitionSeries.Sequence>
		</TransitionSeries>
	)
}
