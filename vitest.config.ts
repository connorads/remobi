import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		include: ['tests/**/*.test.ts'],
		environmentMatchGlobs: [
			['tests/e2e/**', 'node'],
			['tests/cli-config-validation.test.ts', 'node'],
			['tests/**', 'happy-dom'],
		],
	},
})
