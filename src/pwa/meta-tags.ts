import type { PwaConfig } from '../types'
import { ICON_SVG, svgToDataUri } from './icon'

/** Escape a string for safe use in HTML attribute values */
export function escapeAttr(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
}

/** Generate PWA HTML to inject into </head> */
export function generatePwaHtml(name: string, pwa: PwaConfig): string {
	const svgDataUri = svgToDataUri(ICON_SVG)
	return [
		`<link rel="manifest" href="/manifest.json">`,
		`<meta name="theme-color" content="${escapeAttr(pwa.themeColor)}">`,
		`<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`,
		`<meta name="apple-mobile-web-app-title" content="${escapeAttr(name)}">`,
		`<link rel="apple-touch-icon" href="/apple-touch-icon.png">`,
		`<link rel="icon" type="image/svg+xml" href="${svgDataUri}">`,
	].join('\n')
}
