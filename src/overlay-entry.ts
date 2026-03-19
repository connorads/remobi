import { createHookRegistry, init } from './index'
import type { RemobiConfig } from './types'

declare const __remobiConfig: RemobiConfig
declare const __remobiVersion: string | undefined
const config = __remobiConfig
const version = typeof __remobiVersion !== 'undefined' ? __remobiVersion : undefined
const hooks = createHookRegistry()
init(config, hooks, version)
