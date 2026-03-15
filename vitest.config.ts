import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		include: ['tests/**/*.test.ts'],
		testTimeout: 30_000,
		environmentMatchGlobs: [
			['tests/e2e/**', 'node'],
			['tests/cli-config-validation.test.ts', 'node'],
			['tests/**', 'happy-dom'],
		],
	},
})
