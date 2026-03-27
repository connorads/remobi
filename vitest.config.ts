import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		testTimeout: 30_000,
		projects: [
			{
				extends: true,
				test: {
					name: { label: 'node', color: 'green' },
					include: ['tests/cli-config-validation.test.ts', 'tests/serve-abuse.test.ts'],
					environment: 'node',
				},
			},
			{
				extends: true,
				test: {
					name: { label: 'dom', color: 'blue' },
					include: ['tests/**/*.test.ts'],
					exclude: ['tests/cli-config-validation.test.ts', 'tests/serve-abuse.test.ts'],
					environment: 'happy-dom',
				},
			},
		],
		coverage: {
			provider: 'v8',
			reporter: ['text-summary', 'html', 'json-summary'],
			reportsDirectory: 'coverage',
			all: true,
			excludeAfterRemap: true,
			thresholds: {
				statements: 70,
				branches: 82,
				functions: 78,
				lines: 70,
			},
			include: ['src/**/*.ts', 'build.ts'],
			exclude: [
				'**/*.d.ts',
				'**/node_modules/**',
				'coverage/**',
				'dist/**',
				'tests/**',
				'demo/**',
				'scripts/**',
				'playwright.config.ts',
				'tsdown.config.ts',
				'vitest.config.ts',
				'src/client-entry.ts',
				'src/index.ts',
				'src/overlay-entry.ts',
				'src/types.ts',
			],
		},
	},
})
