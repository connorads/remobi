import { describe, expect, test } from 'vitest'
import {
	hasBreakingChangeFooter,
	hasBreakingMarkerInHeader,
	validateBreakingChangeCommitMessage,
} from '../src/release/commit-message'

describe('validateBreakingChangeCommitMessage', () => {
	test('accepts a regular feature commit with no breaking markers', () => {
		const message = 'feat: add session status overlay'

		expect(validateBreakingChangeCommitMessage(message)).toBeNull()
	})

	test('accepts a breaking footer without a header marker', () => {
		const message = [
			'feat: replace ttyd runtime',
			'',
			'Move remobi to the built-in runtime.',
			'',
			'BREAKING CHANGE: remobi no longer depends on ttyd.',
		].join('\n')

		expect(hasBreakingChangeFooter(message)).toBe(true)
		expect(validateBreakingChangeCommitMessage(message)).toBeNull()
	})

	test('requires a breaking footer when header uses ! shorthand', () => {
		const message = [
			'feat!: replace ttyd runtime',
			'',
			'Move remobi to the built-in runtime.',
		].join('\n')

		expect(hasBreakingMarkerInHeader(message)).toBe(true)
		expect(validateBreakingChangeCommitMessage(message)).toBe(
			'Commits with `!` in the header must include a `BREAKING CHANGE:` footer.',
		)
	})

	test('rejects malformed breaking footer text', () => {
		const message = [
			'feat!: replace ttyd runtime',
			'',
			'Move remobi to the built-in runtime.',
			'',
			'BREAKING CHANGE remobi no longer depends on ttyd.',
		].join('\n')

		expect(validateBreakingChangeCommitMessage(message)).toBe(
			'Use `BREAKING CHANGE:` as a footer paragraph with text after the colon.',
		)
	})
})
