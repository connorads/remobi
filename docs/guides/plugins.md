# Plugin author guide

Plugins let you extend webmux at runtime — hooking into the terminal pipeline, registering custom actions, and contributing buttons to the toolbar or drawer — without forking the source.

## Minimal hello-world plugin

```typescript
// plugins/hello.ts
import type { WebmuxPlugin } from 'webmux'

export const helloPlugin: WebmuxPlugin = {
  name: 'hello',
  setup(context) {
    console.log('webmux hello plugin: ready', { mobile: context.mobile })
  },
  dispose() {
    console.log('webmux hello plugin: disposed')
  },
}
```

Register in your config:

```typescript
// webmux.config.ts
import { defineConfig } from 'webmux'

export default defineConfig({
  plugins: ['./plugins/hello.ts'],
})
```

## Plugin context API

The `context` object is passed to `setup()`:

| Field | Type | Description |
|---|---|---|
| `term` | `XTerminal` | The xterm.js terminal instance |
| `config` | `WebmuxConfig` | Fully resolved configuration |
| `hooks` | `HookRegistry` | Subscribe to overlay lifecycle and send pipeline events |
| `actions` | `ActionRegistry` | Register custom button action handlers |
| `mobile` | `boolean` | Whether the device is a touch device |
| `ui` | `UIContributionCollector` | Contribute buttons to toolbar rows and drawer |

## Hooks reference

Subscribe to events via `context.hooks.on(name, handler)`. Returns `{ dispose() }` for cleanup.

| Hook name | When it fires | Payload |
|---|---|---|
| `overlayInitStart` | After terminal detected, before DOM creation | `{ term, config, mobile }` |
| `overlayReady` | All controls mounted and ready | `{ term, config, mobile }` |
| `toolbarCreated` | Toolbar element added to DOM | `{ term, config, toolbar }` |
| `drawerCreated` | Drawer elements added to DOM | `{ term, config, drawer, backdrop }` |
| `beforeSendData` | Before any data is sent to terminal | `SendContext` — can block or modify data |
| `afterSendData` | After data sent | `SendContext` |

### Intercepting terminal input

```typescript
setup(context) {
  context.hooks.on('beforeSendData', async (ctx) => {
    console.log('sending:', JSON.stringify(ctx.data))
    // To block the send:
    // ctx.block()
    // To modify the data:
    // ctx.setData(ctx.data + '\n')
  })
}
```

## UI contributions

Contribute buttons to the toolbar or drawer from `setup()`:

```typescript
setup(context) {
  context.ui.add('toolbar.row2', {
    id: 'my-plugin-btn',
    label: 'My',
    description: 'My plugin action',
    action: { type: 'send', data: '\x02m' },
  })
  // Optional priority (lower = appears first among contributed buttons, default 0)
  context.ui.add('drawer', {
    id: 'my-drawer-btn',
    label: 'Plugin',
    description: 'Plugin drawer button',
    action: { type: 'send', data: '\x02p' },
  }, 10)
}
```

Available slots: `'toolbar.row1'`, `'toolbar.row2'`, `'drawer'`

Plugin contributions are appended after config-defined buttons, sorted by priority.

## Custom action types

Register a handler for a custom action type:

```typescript
setup(context) {
  context.actions.register('my-action' as never, async (_action, ctx) => {
    await ctx.sendText('hello from plugin\r')
  })
}
```

Then use it in a button contributed via `context.ui.add(...)` or in config. Note: custom action types are not validated by the built-in config schema — use plugins for dynamic actions, config for static ones.

## Cleanup

Implement `dispose()` to clean up timers, listeners, and other resources:

```typescript
export const myPlugin: WebmuxPlugin = {
  name: 'my-plugin',
  setup(context) {
    const hookHandle = context.hooks.on('afterSendData', handler)
    // dispose() will be called on page unload or programmatic dispose
    this._cleanup = hookHandle.dispose
  },
  dispose() {
    this._cleanup?.()
  },
}
```

`dispose()` is called in reverse plugin order (LIFO). Errors in `dispose()` are logged but do not prevent other plugins from disposing.

## Error handling

Errors thrown in `setup()` are caught and logged — they do not crash the overlay or prevent other plugins from initialising. Use `dispose()` for cleanup even if `setup()` throws.

## When to use plugins vs config

| Use case | Approach |
|---|---|
| Add/remove/reorder buttons | Config (`ButtonArrayInput` patch) |
| Machine-specific button tweaks | `.local` config file |
| React to terminal events | Plugin hooks |
| Intercept/block terminal sends | Plugin `beforeSendData` hook |
| Dynamic buttons based on runtime state | Plugin UI contributions |
| Custom action handler | Plugin `actions.register` |
| Telemetry / logging | Plugin hooks |
