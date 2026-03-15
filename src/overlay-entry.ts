import { createHookRegistry, init } from './index'
import type { RemobiConfig } from './types'

declare const __remobiConfig: RemobiConfig
const config = __remobiConfig
const hooks = createHookRegistry()
init(config, hooks)
