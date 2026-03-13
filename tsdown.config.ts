import { defineConfig } from 'tsdown'

export default defineConfig({
	entry: ['cli.ts', 'build.ts', 'src/index.ts', 'src/config.ts', 'src/types.ts'],
	format: ['esm'],
	dts: true,
	clean: true,
})
