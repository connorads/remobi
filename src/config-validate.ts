import * as v from 'valibot'
import { muxiConfigOverridesSchema, muxiConfigResolvedSchema } from './config-schema'
import type { MuxiConfig, MuxiConfigOverrides } from './types'

interface ValidationIssue {
	readonly path: string
	readonly expected: string
	readonly received: string
}

export class ConfigValidationError extends Error {
	readonly issues: readonly ValidationIssue[]

	constructor(issues: readonly ValidationIssue[]) {
		super(formatIssues(issues))
		this.name = 'ConfigValidationError'
		this.issues = issues
	}
}

function formatIssues(issues: readonly ValidationIssue[]): string {
	const lines = ['Invalid muxi config:']
	for (const issue of issues) {
		lines.push(`- ${issue.path}: expected ${issue.expected}, received ${issue.received}`)
	}
	return lines.join('\n')
}

function truncate(value: string, maxLength: number): string {
	if (value.length <= maxLength) {
		return value
	}
	return `${value.slice(0, maxLength - 3)}...`
}

function describeReceived(value: unknown): string {
	if (value === null) return 'null'
	if (Array.isArray(value)) return `array(len=${value.length})`
	if (typeof value === 'string') return `string(${JSON.stringify(truncate(value, 80))})`
	if (typeof value === 'number') return `number(${String(value)})`
	if (typeof value === 'boolean') return `boolean(${String(value)})`
	if (typeof value === 'bigint') return `bigint(${String(value)})`
	if (typeof value === 'undefined') return 'undefined'
	if (typeof value === 'function')
		return value.name.length > 0 ? `function(${value.name})` : 'function'
	if (typeof value === 'object') {
		const keys = Object.keys(value)
		if (keys.length === 0) return 'object(empty)'
		const shown = keys.slice(0, 3).join(', ')
		const suffix = keys.length > 3 ? ', ...' : ''
		return `object(keys: ${shown}${suffix})`
	}
	return typeof value
}

/** Convert Valibot issue path to dotted string */
function issuePath(issue: v.BaseIssue<unknown>): string {
	if (!issue.path || issue.path.length === 0) return 'config'
	const segments: string[] = ['config']
	for (const segment of issue.path) {
		if (typeof segment.key === 'number') {
			segments.push(`[${String(segment.key)}]`)
		} else {
			segments.push(`.${String(segment.key)}`)
		}
	}
	return segments.join('').replaceAll('.[', '[')
}

/** Extract human-readable expected string from a Valibot issue */
function issueExpected(issue: v.BaseIssue<unknown>): string {
	// v.custom() sets expected to "unknown" — use the message instead
	if (issue.expected === 'unknown' || !issue.expected) {
		return issue.message
	}
	return issue.expected
}

/** Map Valibot flat issues to our ValidationIssue format */
function toValidationIssues(issues: readonly v.BaseIssue<unknown>[]): ValidationIssue[] {
	const result: ValidationIssue[] = []
	for (const issue of issues) {
		// Leaf issues only — skip container issues that have nested issues
		if (issue.issues && issue.issues.length > 0) {
			result.push(...toValidationIssues(issue.issues))
			continue
		}
		const received = issue.input !== undefined ? issue.input : undefined
		result.push({
			path: issuePath(issue),
			expected: issueExpected(issue),
			received: describeReceived(received),
		})
	}
	return result
}

export function assertValidConfigOverrides(value: unknown): asserts value is MuxiConfigOverrides {
	const result = v.safeParse(muxiConfigOverridesSchema, value)
	if (!result.success) {
		throw new ConfigValidationError(toValidationIssues(result.issues))
	}
}

export function assertValidResolvedConfig(value: unknown): asserts value is MuxiConfig {
	const result = v.safeParse(muxiConfigResolvedSchema, value)
	if (!result.success) {
		throw new ConfigValidationError(toValidationIssues(result.issues))
	}
}
