import { readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, test } from 'vitest'

const require = createRequire(import.meta.url)

async function loadAnalyzeCommits() {
	require.resolve('semantic-release/package.json')
	const pnpmDirectory = join(process.cwd(), 'node_modules', '.pnpm')
	const analyzerPackageDirectory = readdirSync(pnpmDirectory).find((entry) =>
		entry.startsWith('@semantic-release+commit-analyzer@'),
	)

	if (analyzerPackageDirectory === undefined) {
		throw new Error(
			'Expected @semantic-release/commit-analyzer to be installed in node_modules/.pnpm',
		)
	}

	const analyzerEntryPath = join(
		pnpmDirectory,
		analyzerPackageDirectory,
		'node_modules',
		'@semantic-release',
		'commit-analyzer',
		'index.js',
	)
	const analyzerModule = await import(pathToFileURL(analyzerEntryPath).href)

	if (typeof analyzerModule.analyzeCommits !== 'function') {
		throw new Error('Expected @semantic-release/commit-analyzer to export analyzeCommits')
	}

	return analyzerModule.analyzeCommits
}

describe('semantic-release commit analysis', () => {
	test('does not treat bare feat! as a release signal in this repo', async () => {
		const analyzeCommits = await loadAnalyzeCommits()
		const releaseType = await analyzeCommits(
			{},
			{
				commits: [
					{
						hash: '9e6c6cd',
						message: [
							'feat!: replace ttyd with built-in terminal runtime',
							'',
							'Move remobi off ttyd patching and onto a built-in browser terminal runtime.',
						].join('\n'),
					},
				],
				cwd: process.cwd(),
				logger: { log: () => {} },
			},
		)

		expect(releaseType).toBeNull()
	})

	test('treats BREAKING CHANGE footer as a major release signal', async () => {
		const analyzeCommits = await loadAnalyzeCommits()
		const releaseType = await analyzeCommits(
			{},
			{
				commits: [
					{
						hash: 'marker',
						message: [
							'chore: mark built-in runtime migration as breaking',
							'',
							'Record the already-landed runtime swap as the next major line.',
							'',
							'BREAKING CHANGE: remobi replaces the ttyd-based runtime with the built-in terminal runtime.',
						].join('\n'),
					},
				],
				cwd: process.cwd(),
				logger: { log: () => {} },
			},
		)

		expect(releaseType).toBe('major')
	})
})
