import { documentRoute, joinBasePath } from '../base-path'
import type { PwaConfig } from '../types'

interface WebAppManifest {
	readonly name: string
	readonly short_name: string
	readonly start_url: string
	readonly display: string
	readonly background_color: string
	readonly theme_color: string
	readonly icons: readonly {
		readonly src: string
		readonly sizes: string
		readonly type: string
		readonly purpose?: string
	}[]
}

/** Generate a web app manifest object from pwa config */
export function generateManifest(name: string, pwa: PwaConfig, basePath = '/'): WebAppManifest {
	return {
		name,
		short_name: pwa.shortName ?? name,
		start_url: documentRoute(basePath),
		display: 'standalone',
		background_color: pwa.themeColor,
		theme_color: pwa.themeColor,
		icons: [
			{
				src: joinBasePath(basePath, '/icon-192.png'),
				sizes: '192x192',
				type: 'image/png',
				purpose: 'any maskable',
			},
			{ src: joinBasePath(basePath, '/icon-512.png'), sizes: '512x512', type: 'image/png' },
		],
	}
}

/** Serialise manifest to JSON string */
export function manifestToJson(name: string, pwa: PwaConfig, basePath = '/'): string {
	return JSON.stringify(generateManifest(name, pwa, basePath), null, 2)
}
