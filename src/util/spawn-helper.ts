import { chmodSync, existsSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const EXECUTABLE_BITS = 0o111

/** Resolve node-pty's prebuilt spawn-helper for a platform/arch, or null if it isn't shipped.
 * Mirrors node-pty's own `prebuilds/<platform>-<arch>/spawn-helper` resolution. */
export function resolveSpawnHelperPath(
	platform: NodeJS.Platform = process.platform,
	arch: string = process.arch,
): string | null {
	try {
		const require = createRequire(import.meta.url)
		const ptyDir = dirname(require.resolve('node-pty/package.json'))
		const helper = join(ptyDir, 'prebuilds', `${platform}-${arch}`, 'spawn-helper')
		return existsSync(helper) ? helper : null
	} catch {
		return null
	}
}

/** Add the execute bit to a file if it lacks it. Idempotent; silent on a missing/unwritable path. */
export function ensureExecutable(path: string): void {
	try {
		const { mode } = statSync(path)
		if ((mode & EXECUTABLE_BITS) === EXECUTABLE_BITS) return
		chmodSync(path, mode | EXECUTABLE_BITS)
	} catch {
		// Helper absent or unwritable — let node-pty surface its own spawn error instead.
	}
}

/** Restore a resolved spawn-helper when the current platform needs node-pty's macOS workaround. */
export function ensureSpawnHelperExecutableForPlatform(
	platform: NodeJS.Platform,
	helper: string | null,
): void {
	if (platform !== 'darwin' || helper === null) return
	ensureExecutable(helper)
}

/** Restore the execute bit on node-pty's macOS spawn-helper (microsoft/node-pty#850).
 * node-pty's darwin prebuild ships without +x, and consumers who install with `ignore-scripts`
 * skip lifecycle scripts, so doing this at spawn time keeps remobi working regardless of the
 * install posture — without shipping a published postinstall script of our own.
 * Remove once node-pty ships a fixed prebuild (>=1.2.0) and we upgrade. */
export function ensureNodePtySpawnHelperExecutable(): void {
	ensureSpawnHelperExecutableForPlatform(process.platform, resolveSpawnHelperPath())
}
