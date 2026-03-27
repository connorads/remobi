import { readFileSync } from 'node:fs'
import { validateBreakingChangeCommitMessage } from '../src/release/commit-message'

function main(): void {
	const [, , commitMessagePath] = process.argv

	if (commitMessagePath === undefined) {
		console.error('remobi: missing commit message path')
		process.exit(1)
	}

	const message = readFileSync(commitMessagePath, 'utf8')
	const error = validateBreakingChangeCommitMessage(message)

	if (error === null) {
		return
	}

	console.error(`remobi: ${error}`)
	process.exit(1)
}

main()
