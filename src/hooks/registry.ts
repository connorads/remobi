import type { ButtonAction, MuxiConfig, XTerminal } from '../types'

export type SendSource = 'toolbar' | 'drawer' | 'floating-buttons' | 'mobile-init'

export interface BeforeSendDataContext {
	readonly term: XTerminal
	readonly config: MuxiConfig
	readonly source: SendSource
	readonly actionType: ButtonAction['type']
	readonly kbWasOpen: boolean
	readonly data: string
}

interface BeforeSendDataResult {
	readonly data?: string
	readonly block?: boolean
}

export interface AfterSendDataContext {
	readonly term: XTerminal
	readonly config: MuxiConfig
	readonly source: SendSource
	readonly actionType: ButtonAction['type']
	readonly kbWasOpen: boolean
	readonly data: string
}

export interface OverlayInitContext {
	readonly term: XTerminal
	readonly config: MuxiConfig
	readonly mobile: boolean
}

export interface ToolbarCreatedContext {
	readonly term: XTerminal
	readonly config: MuxiConfig
	readonly toolbar: HTMLDivElement
}

export interface DrawerCreatedContext {
	readonly term: XTerminal
	readonly config: MuxiConfig
	readonly drawer: HTMLDivElement
	readonly backdrop: HTMLDivElement
}

interface HookMap {
	beforeSendData: (
		context: BeforeSendDataContext,
	) => BeforeSendDataResult | undefined | Promise<BeforeSendDataResult | undefined>
	afterSendData: (context: AfterSendDataContext) => void | Promise<void>
	overlayInitStart: (context: OverlayInitContext) => void | Promise<void>
	overlayReady: (context: OverlayInitContext) => void | Promise<void>
	toolbarCreated: (context: ToolbarCreatedContext) => void | Promise<void>
	drawerCreated: (context: DrawerCreatedContext) => void | Promise<void>
}

type HookName = keyof HookMap

export interface HookRegistry {
	on: <K extends HookName>(name: K, hook: HookMap[K]) => { dispose(): void }
	runBeforeSendData: (
		context: BeforeSendDataContext,
	) => Promise<{ readonly blocked: boolean; readonly data: string }>
	runAfterSendData: (context: AfterSendDataContext) => Promise<void>
	runOverlayInitStart: (context: OverlayInitContext) => Promise<void>
	runOverlayReady: (context: OverlayInitContext) => Promise<void>
	runToolbarCreated: (context: ToolbarCreatedContext) => Promise<void>
	runDrawerCreated: (context: DrawerCreatedContext) => Promise<void>
}

function logHookError(name: HookName, error: unknown): void {
	console.error(`muxi: hook '${name}' failed`, error)
}

export function createHookRegistry(): HookRegistry {
	const hooks: { [K in HookName]: HookMap[K][] } = {
		beforeSendData: [],
		afterSendData: [],
		overlayInitStart: [],
		overlayReady: [],
		toolbarCreated: [],
		drawerCreated: [],
	}

	function on<K extends HookName>(name: K, hook: HookMap[K]): { dispose(): void } {
		hooks[name].push(hook)
		return {
			dispose(): void {
				const index = hooks[name].indexOf(hook)
				if (index >= 0) {
					hooks[name].splice(index, 1)
				}
			},
		}
	}

	async function runBeforeSendData(
		context: BeforeSendDataContext,
	): Promise<{ readonly blocked: boolean; readonly data: string }> {
		let nextData = context.data
		for (const hook of hooks.beforeSendData) {
			try {
				const result = await hook({ ...context, data: nextData })
				if (result?.block) {
					return { blocked: true, data: nextData }
				}
				if (typeof result?.data === 'string') {
					nextData = result.data
				}
			} catch (error) {
				logHookError('beforeSendData', error)
			}
		}
		return { blocked: false, data: nextData }
	}

	async function runAfterSendData(context: AfterSendDataContext): Promise<void> {
		for (const hook of hooks.afterSendData) {
			try {
				await hook(context)
			} catch (error) {
				logHookError('afterSendData', error)
			}
		}
	}

	async function runOverlayInitStart(context: OverlayInitContext): Promise<void> {
		for (const hook of hooks.overlayInitStart) {
			try {
				await hook(context)
			} catch (error) {
				logHookError('overlayInitStart', error)
			}
		}
	}

	async function runOverlayReady(context: OverlayInitContext): Promise<void> {
		for (const hook of hooks.overlayReady) {
			try {
				await hook(context)
			} catch (error) {
				logHookError('overlayReady', error)
			}
		}
	}

	async function runToolbarCreated(context: ToolbarCreatedContext): Promise<void> {
		for (const hook of hooks.toolbarCreated) {
			try {
				await hook(context)
			} catch (error) {
				logHookError('toolbarCreated', error)
			}
		}
	}

	async function runDrawerCreated(context: DrawerCreatedContext): Promise<void> {
		for (const hook of hooks.drawerCreated) {
			try {
				await hook(context)
			} catch (error) {
				logHookError('drawerCreated', error)
			}
		}
	}

	return {
		on,
		runBeforeSendData,
		runAfterSendData,
		runOverlayInitStart,
		runOverlayReady,
		runToolbarCreated,
		runDrawerCreated,
	}
}
