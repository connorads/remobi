import { type IPty, type IPtyForkOptions, spawn } from 'node-pty'
import { ensureNodePtySpawnHelperExecutable } from './util/spawn-helper'

export type { IPty } from 'node-pty'

export function spawnPty(file: string, args: readonly string[], options: IPtyForkOptions): IPty {
	ensureNodePtySpawnHelperExecutable()
	return spawn(file, [...args], options)
}
