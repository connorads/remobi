import { createHookRegistry, init } from './index'
import type { WebmuxConfig } from './types'

const config = (globalThis as Record<string, unknown>).__webmuxConfig as WebmuxConfig
const hooks = createHookRegistry()
init(config, hooks)
