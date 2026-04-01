import { normalizeBasePath } from '../base-path'

type CliCommand = 'build' | 'inject' | 'init' | 'serve' | 'help' | 'version'

interface ParsedCliArgs {
	readonly command: CliCommand
	readonly configPath?: string
	readonly outputPath?: string
	readonly dryRun: boolean
	readonly port?: number
	readonly host?: string
	readonly basePath?: string
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

interface ParseState {
	configPath?: string
	outputPath?: string
	dryRun: boolean
	port?: number
	host?: string
	basePath?: string
	noSleep: boolean
}

interface FlagDef {
	readonly names: readonly string[]
	readonly validCommands: readonly CliCommand[]
	readonly takesValue: boolean
	readonly apply: (value: string | undefined, state: ParseState) => string | undefined
}

function isHelpCommand(value: string): boolean {
	return value === '--help' || value === '-h' || value === 'help'
}

function isVersionCommand(value: string): boolean {
	return value === '--version' || value === '-v' || value === 'version'
}

function isMissingOptionValue(value: string | undefined): boolean {
	return value === undefined || value.startsWith('-')
}

const flagDefs: readonly FlagDef[] = [
	{
		names: ['--config', '-c'],
		validCommands: ['build', 'inject', 'serve'],
		takesValue: true,
		apply(value, state) {
			state.configPath = value
			return undefined
		},
	},
	{
		names: ['--output', '-o'],
		validCommands: ['build'],
		takesValue: true,
		apply(value, state) {
			state.outputPath = value
			return undefined
		},
	},
	{
		names: ['--dry-run', '-n'],
		validCommands: ['build', 'inject'],
		takesValue: false,
		apply(_value, state) {
			state.dryRun = true
			return undefined
		},
	},
	{
		names: ['--port', '-p'],
		validCommands: ['serve'],
		takesValue: true,
		apply(value, state) {
			const portNum = Number(value)
			if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
				return `Invalid port: ${value}`
			}
			state.port = portNum
			return undefined
		},
	},
	{
		names: ['--host'],
		validCommands: ['serve'],
		takesValue: true,
		apply(value, state) {
			state.host = value
			return undefined
		},
	},
	{
		names: ['--base-path'],
		validCommands: ['serve'],
		takesValue: true,
		apply(value, state) {
			const normalized = normalizeBasePath(value ?? '')
			if (normalized === null) {
				return `Invalid base path: ${value}`
			}
			state.basePath = normalized
			return undefined
		},
	},
	{
		names: ['--no-sleep'],
		validCommands: ['serve'],
		takesValue: false,
		apply(_value, state) {
			state.noSleep = true
			return undefined
		},
	},
]

function findFlag(arg: string): FlagDef | undefined {
	return flagDefs.find((def) => def.names.includes(arg))
}

function formatCommands(commands: readonly CliCommand[]): string {
	if (commands.length <= 1) return commands.map((c) => `'${c}'`).join('')
	const quoted = commands.map((c) => `'${c}'`)
	return `${quoted.slice(0, -1).join(', ')}, or ${quoted[quoted.length - 1]}`
}

function processFlag(
	flag: FlagDef,
	args: readonly string[],
	index: number,
	state: ParseState,
): { error: string } | { consumed: number } {
	if (flag.takesValue) {
		const nextArg = args[index + 1]
		const canonicalName = flag.names[0]
		if (isMissingOptionValue(nextArg)) {
			return { error: `Missing value for ${canonicalName}` }
		}
		const applyError = flag.apply(nextArg, state)
		if (applyError) return { error: applyError }
		return { consumed: 1 }
	}
	const applyError = flag.apply(undefined, state)
	if (applyError) return { error: applyError }
	return { consumed: 0 }
}

const helpResult: ParseSuccess = {
	ok: true,
	value: { command: 'help', dryRun: false, noSleep: false, command_: [] },
}

type ActionCommand = 'build' | 'inject' | 'init' | 'serve'
const actionCommands = new Set<string>(['build', 'inject', 'init', 'serve'])

function isActionCommand(value: string): value is ActionCommand {
	return actionCommands.has(value)
}

export function parseCliArgs(args: readonly string[]): ParseCliResult {
	const commandToken = args[0]
	if (!commandToken || isHelpCommand(commandToken)) return helpResult

	if (isVersionCommand(commandToken)) {
		return { ok: true, value: { command: 'version', dryRun: false, noSleep: false, command_: [] } }
	}

	if (!isActionCommand(commandToken)) {
		return { ok: false, error: `Unknown command: ${commandToken}` }
	}
	const command = commandToken

	const state: ParseState = { dryRun: false, noSleep: false }
	let trailingCommand: readonly string[] = []

	for (let index = 1; index < args.length; index++) {
		const arg = args[index]
		if (!arg) return { ok: false, error: 'Invalid argument list' }

		if (arg === '--') {
			trailingCommand = args.slice(index + 1)
			break
		}

		if (isHelpCommand(arg)) return helpResult

		if (!arg.startsWith('-')) {
			return { ok: false, error: `Unexpected positional argument: ${arg}` }
		}

		const flag = findFlag(arg)
		if (!flag) {
			if (isVersionCommand(arg)) {
				return { ok: false, error: `${arg} is only valid as a top-level command` }
			}
			return { ok: false, error: `Unknown flag: ${arg}` }
		}

		if (!flag.validCommands.includes(command)) {
			return { ok: false, error: `${arg} is only valid for ${formatCommands(flag.validCommands)}` }
		}

		const result = processFlag(flag, args, index, state)
		if ('error' in result) return { ok: false, error: result.error }
		index += result.consumed
	}

	return {
		ok: true,
		value: {
			command,
			configPath: state.configPath,
			outputPath: state.outputPath,
			dryRun: state.dryRun,
			port: state.port,
			host: state.host,
			basePath: state.basePath,
			noSleep: state.noSleep,
			command_: trailingCommand,
		},
	}
}
