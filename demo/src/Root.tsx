import type React from 'react'
import { Composition } from 'remotion'
import { DemoVideo, FPS } from './DemoVideo'

/**
 * Total duration: 4 scenes − 3 transitions × 15 frames overlap
 * = (150 + 180 + 150 + 180) - (3 × 15)
 * = 660 - 45 = 615 frames (~20.5s)
 */
const TOTAL_FRAMES = 615

export const RemotionRoot: React.FC = () => {
	return (
		<Composition
			id="DemoVideo"
			component={DemoVideo}
			durationInFrames={TOTAL_FRAMES}
			fps={FPS}
			width={390}
			height={844}
		/>
	)
}
