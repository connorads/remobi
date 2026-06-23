import { chmodSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import {
	ensureExecutable,
	ensureNodePtySpawnHelperExecutable,
	ensureSpawnHelperExecutableForPlatform,
	resolveSpawnHelperPath,
} from '../src/util/spawn-helper'

const EXECUTABLE_BITS = 0o111

const tempDirs: string[] = []

afterEach(() => {
	while (tempDirs.length > 0) {
		const dir = tempDirs.pop()
		if (dir) rmSync(dir, { recursive: true, force: true })
	}
})

function tempFile(mode: number): string {
	const dir = mkdtempSync(join(tmpdir(), 'remobi-spawn-helper-'))
	tempDirs.push(dir)
	const path = join(dir, 'spawn-helper')
	writeFileSync(path, 'binary')
	chmodSync(path, mode)
	return path
}

function isExecutable(path: string): boolean {
	return (statSync(path).mode & EXECUTABLE_BITS) === EXECUTABLE_BITS
}

describe('ensureExecutable', () => {
	test('adds the execute bit to a non-executable file', () => {
		const path = tempFile(0o644)
		expect(isExecutable(path)).toBe(false)

		ensureExecutable(path)

		expect(isExecutable(path)).toBe(true)
	})

	test('preserves read/write bits when adding execute', () => {
		const path = tempFile(0o644)

		ensureExecutable(path)

		// 0o644 | 0o111 === 0o755
		expect(statSync(path).mode & 0o777).toBe(0o755)
	})

	test('is a no-op on an already-executable file', () => {
		const path = tempFile(0o755)

		ensureExecutable(path)

		expect(statSync(path).mode & 0o777).toBe(0o755)
	})

	test('does not throw when the file is missing', () => {
		expect(() => ensureExecutable(join(tmpdir(), 'remobi-does-not-exist-xyz'))).not.toThrow()
	})
})

describe('resolveSpawnHelperPath', () => {
	test('returns null or an existing helper path, never a phantom path', () => {
		const path = resolveSpawnHelperPath()
		expect(path === null || existsSync(path)).toBe(true)
	})

	test('returns null for a platform/arch node-pty does not ship', () => {
		expect(resolveSpawnHelperPath('sunos', 'sparc')).toBe(null)
	})
})

describe('ensureSpawnHelperExecutableForPlatform', () => {
	test('repairs a resolved macOS spawn-helper without touching node_modules', () => {
		const path = tempFile(0o644)

		ensureSpawnHelperExecutableForPlatform('darwin', path)

		expect(isExecutable(path)).toBe(true)
	})

	test('leaves non-macOS helpers unchanged', () => {
		const path = tempFile(0o644)

		ensureSpawnHelperExecutableForPlatform('linux', path)

		expect(isExecutable(path)).toBe(false)
	})

	test('ignores an unresolved helper path', () => {
		expect(() => ensureSpawnHelperExecutableForPlatform('darwin', null)).not.toThrow()
	})
})

describe('ensureNodePtySpawnHelperExecutable', () => {
	test('does not throw on any platform', () => {
		expect(() => ensureNodePtySpawnHelperExecutable()).not.toThrow()
	})
})
