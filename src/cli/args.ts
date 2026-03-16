type CliCommand = 'build' | 'inject' | 'init' | 'serve' | 'help' | 'version'

interface ParsedCliArgs {
	readonly command: CliCommand
	readonly configPath?: string
	readonly outputPath?: string
	readonly dryRun: boolean
	readonly port?: number
	readonly host?: string
	readonly noSleep: boolean
	readonly command_: readonly string[]
}

interface ParseSuccess {
	readonly ok: true
	readonly value: ParsedCliArgs
}

interface ParseFailure {
	readonly ok: false
	readonly error: string
}

type ParseCliResult = ParseSuccess | ParseFailure

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
		return { ok: true, value: { command: 'help', dryRun: false, noSleep: false, command_: [] } }
	}

	if (isVersionCommand(commandToken)) {
		return { ok: true, value: { command: 'version', dryRun: false, noSleep: false, command_: [] } }
	}

	if (
		commandToken !== 'build' &&
		commandToken !== 'inject' &&
		commandToken !== 'init' &&
		commandToken !== 'serve'
	) {
		return { ok: false, error: `Unknown command: ${commandToken}` }
	}

	let configPath: string | undefined
	let outputPath: string | undefined
	let dryRun = false
	let port: number | undefined
	let host: string | undefined
	let noSleep = false
	let trailingCommand: readonly string[] = []

	for (let index = 1; index < args.length; index++) {
		const arg = args[index]
		const nextArg = args[index + 1]
		if (!arg) {
			return { ok: false, error: 'Invalid argument list' }
		}

		// -- separator: everything after is the trailing command
		if (arg === '--') {
			trailingCommand = args.slice(index + 1)
			break
		}

		if (arg === '--help' || arg === '-h') {
			return { ok: true, value: { command: 'help', dryRun: false, noSleep: false, command_: [] } }
		}

		if (!arg.startsWith('-')) {
			return { ok: false, error: `Unexpected positional argument: ${arg}` }
		}

		if (arg === '--config' || arg === '-c') {
			if (commandToken !== 'build' && commandToken !== 'inject' && commandToken !== 'serve') {
				return { ok: false, error: `${arg} is only valid for 'build', 'inject', or 'serve'` }
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

		if (arg === '--port' || arg === '-p') {
			if (commandToken !== 'serve') {
				return { ok: false, error: `${arg} is only valid for 'serve'` }
			}
			if (isMissingOptionValue(nextArg)) {
				return { ok: false, error: 'Missing value for --port' }
			}
			const portNum = Number(nextArg)
			if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
				return { ok: false, error: `Invalid port: ${nextArg}` }
			}
			port = portNum
			index++
			continue
		}

		if (arg === '--host') {
			if (commandToken !== 'serve') {
				return { ok: false, error: `${arg} is only valid for 'serve'` }
			}
			if (isMissingOptionValue(nextArg)) {
				return { ok: false, error: 'Missing value for --host' }
			}
			host = nextArg
			index++
			continue
		}

		if (arg === '--no-sleep') {
			if (commandToken !== 'serve') {
				return { ok: false, error: `${arg} is only valid for 'serve'` }
			}
			noSleep = true
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
			port,
			host,
			noSleep,
			command_: trailingCommand,
		},
	}
}
