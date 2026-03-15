import * as esbuild from 'esbuild'

await esbuild.build({
	entryPoints: ['src/overlay-entry.ts'],
	bundle: true,
	platform: 'browser',
	minify: true,
	format: 'iife',
	outfile: 'dist/overlay.iife.js',
})
