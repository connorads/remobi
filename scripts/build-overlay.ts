import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { writeClientBundle } from '../build'

const distDir = resolve(import.meta.dirname, '..', 'dist')
mkdirSync(distDir, { recursive: true })
await writeClientBundle(distDir)
