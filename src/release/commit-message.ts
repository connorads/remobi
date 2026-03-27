function splitParagraphs(message: string): string[] {
	return message
		.replace(/\r/g, '')
		.trimEnd()
		.split(/\n{2,}/)
}

function getCommitHeader(message: string): string {
	const [header = ''] = message.replace(/\r/g, '').split('\n', 1)
	return header
}

export function hasBreakingMarkerInHeader(message: string): boolean {
	return /^[a-z]+(?:\([^)]+\))?!: /.test(getCommitHeader(message))
}

export function hasBreakingChangeFooter(message: string): boolean {
	return splitParagraphs(message)
		.slice(1)
		.some((paragraph) => /^BREAKING CHANGE:\s+\S[\s\S]*$/.test(paragraph))
}

function hasMalformedBreakingChangeFooter(message: string): boolean {
	return splitParagraphs(message)
		.slice(1)
		.some(
			(paragraph) =>
				/^BREAKING CHANGE\b/.test(paragraph) && !/^BREAKING CHANGE:\s+\S[\s\S]*$/.test(paragraph),
		)
}

export function validateBreakingChangeCommitMessage(message: string): string | null {
	if (hasMalformedBreakingChangeFooter(message)) {
		return 'Use `BREAKING CHANGE:` as a footer paragraph with text after the colon.'
	}

	if (hasBreakingMarkerInHeader(message) && !hasBreakingChangeFooter(message)) {
		return 'Commits with `!` in the header must include a `BREAKING CHANGE:` footer.'
	}

	return null
}
