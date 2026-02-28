import React from 'react'
import { Composition, continueRender, delayRender } from 'remotion'
import { DemoVideo } from './DemoVideo'
import { fontsLoaded } from './fonts'

const FPS = 30

/**
 * Total duration: 6 scenes × durations − 5 transitions × 15 frames overlap
 * = (105 + 120 + 120 + 75 + 90 + 105) - (5 × 15)
 * = 615 - 75 = 540 frames (18s)
 */
const TOTAL_FRAMES = 540

/** Wrapper that delays rendering until fonts are loaded */
const DemoVideoWithFonts: React.FC = () => {
	const [handle] = React.useState(() => delayRender('Loading fonts'))

	React.useEffect(() => {
		fontsLoaded.then(() => continueRender(handle))
	}, [handle])

	return <DemoVideo />
}

export const RemotionRoot: React.FC = () => {
	return (
		<Composition
			id="DemoVideo"
			component={DemoVideoWithFonts}
			durationInFrames={TOTAL_FRAMES}
			fps={FPS}
			width={390}
			height={844}
		/>
	)
}
