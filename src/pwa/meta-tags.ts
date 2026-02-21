import type { PwaConfig } from '../types'
import { ICON_SVG, svgToDataUri } from './icon'

/** Generate PWA HTML to inject into </head> */
export function generatePwaHtml(pwa: PwaConfig): string {
	const svgDataUri = svgToDataUri(ICON_SVG)
	return [
		`<link rel="manifest" href="/manifest.json">`,
		`<meta name="theme-color" content="${pwa.themeColor}">`,
		`<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`,
		`<meta name="apple-mobile-web-app-title" content="${pwa.name}">`,
		`<link rel="apple-touch-icon" href="/apple-touch-icon.png">`,
		`<link rel="icon" type="image/svg+xml" href="${svgDataUri}">`,
	].join('\n')
}
