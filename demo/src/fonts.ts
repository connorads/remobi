/**
 * Load JetBrains Mono for consistent terminal rendering.
 * Uses @remotion/fonts to load local woff2 files from public/.
 */
import { loadFont } from '@remotion/fonts'
import { staticFile } from 'remotion'

export const FONT_FAMILY = 'JetBrains Mono'

const fontsLoaded = Promise.all([
	loadFont({
		family: FONT_FAMILY,
		url: staticFile('JetBrainsMono-Regular.woff2'),
		weight: '400',
	}),
	loadFont({
		family: FONT_FAMILY,
		url: staticFile('JetBrainsMono-Bold.woff2'),
		weight: '700',
	}),
])

export { fontsLoaded }
