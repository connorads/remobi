import { chmodSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import {
	ensureExecutable,
	ensureNodePtySpawnHelperExecutable,
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

describe('ensureNodePtySpawnHelperExecutable', () => {
	test('does not throw on any platform', () => {
		expect(() => ensureNodePtySpawnHelperExecutable()).not.toThrow()
	})

	// node-pty only ships a macOS prebuild that lacks the execute bit (microsoft/node-pty#850).
	test.runIf(process.platform === 'darwin')(
		'repairs a clobbered macOS spawn-helper so a PTY can spawn',
		() => {
			const helper = resolveSpawnHelperPath()
			expect(helper).not.toBe(null)
			if (!helper) return

			// Simulate the broken prebuild / ignore-scripts install state.
			chmodSync(helper, 0o644)
			expect(isExecutable(helper)).toBe(false)

			ensureNodePtySpawnHelperExecutable()

			expect(isExecutable(helper)).toBe(true)
		},
	)
})
