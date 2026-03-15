import { createHookRegistry, init } from './index'
import type { MuxiConfig } from './types'

const config = (globalThis as Record<string, unknown>).__muxiConfig as MuxiConfig
const hooks = createHookRegistry()
init(config, hooks)
