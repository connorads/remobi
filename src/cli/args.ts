export type CliCommand = 'build' | 'inject' | 'init' | 'help' | 'version'

export interface ParsedCliArgs {
	readonly command: CliCommand
	readonly configPath?: string
	readonly outputPath?: string
	readonly dryRun: boolean
}

interface ParseSuccess {
	readonly ok: true
	readonly value: ParsedCliArgs
}

interface ParseFailure {
	readonly ok: false
	readonly error: string
}

export type ParseCliResult = ParseSuccess | ParseFailure

function isHelpCommand(value: string): boolean {
	return value === '--help' || value === '-h' || value === 'help'
}

function isVersionCommand(value: string): boolean {
	return value === '--version' || value === '-v' || value === 'version'
}

function isMissingOptionValue(value: string | undefined): boolean {
	return value === undefined || value.startsWith('-')
}

export function parseCliArgs(args: readonly string[]): ParseCliResult {
	const commandToken = args[0]
	if (!commandToken || isHelpCommand(commandToken)) {
		return { ok: true, value: { command: 'help', dryRun: false } }
	}

	if (isVersionCommand(commandToken)) {
		return { ok: true, value: { command: 'version', dryRun: false } }
	}

	if (commandToken !== 'build' && commandToken !== 'inject' && commandToken !== 'init') {
		return { ok: false, error: `Unknown command: ${commandToken}` }
	}

	let configPath: string | undefined
	let outputPath: string | undefined
	let dryRun = false

	for (let index = 1; index < args.length; index++) {
		const arg = args[index]
		const nextArg = args[index + 1]
		if (!arg) {
			return { ok: false, error: 'Invalid argument list' }
		}

		if (arg === '--help' || arg === '-h') {
			return { ok: true, value: { command: 'help', dryRun: false } }
		}

		if (!arg.startsWith('-')) {
			return { ok: false, error: `Unexpected positional argument: ${arg}` }
		}

		if (arg === '--config' || arg === '-c') {
			if (commandToken !== 'build' && commandToken !== 'inject') {
				return { ok: false, error: `${arg} is only valid for 'build' or 'inject'` }
			}
			if (isMissingOptionValue(nextArg)) {
				return { ok: false, error: 'Missing value for --config' }
			}
			configPath = nextArg
			index++
			continue
		}

		if (arg === '--output' || arg === '-o') {
			if (commandToken !== 'build') {
				return { ok: false, error: `${arg} is only valid for 'build'` }
			}
			if (isMissingOptionValue(nextArg)) {
				return { ok: false, error: 'Missing value for --output' }
			}
			outputPath = nextArg
			index++
			continue
		}

		if (arg === '--dry-run' || arg === '-n') {
			if (commandToken !== 'build' && commandToken !== 'inject') {
				return { ok: false, error: `${arg} is only valid for 'build' or 'inject'` }
			}
			dryRun = true
			continue
		}

		if (isVersionCommand(arg)) {
			return { ok: false, error: `${arg} is only valid as a top-level command` }
		}

		return { ok: false, error: `Unknown flag: ${arg}` }
	}

	return {
		ok: true,
		value: {
			command: commandToken,
			configPath,
			outputPath,
			dryRun,
		},
	}
}
