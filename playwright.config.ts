import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	testDir: './tests/playwright',
	timeout: 30_000,
	retries: 0,
	use: {
		baseURL: 'http://127.0.0.1:7681',
	},
	webServer: {
		command: 'tsx cli.ts serve --port 7681 -- bash --norc --noprofile',
		port: 7681,
		reuseExistingServer: !process.env.CI,
		timeout: 15_000,
	},
	projects: [
		{
			name: 'chromium-android',
			use: { ...devices['Pixel 5'] },
		},
		{
			name: 'webkit-iphone',
			use: { ...devices['iPhone 13'] },
		},
	],
})
