---
name: webmux-setup
description: Configure webmux mobile terminal overlay — inspect tmux bindings, generate a valid webmux.config.ts, validate with --dry-run, iterate.
---

# webmux-setup skill

## When to use

Use this skill whenever you need to:

- Create or update a `webmux.config.ts`
- Map tmux key bindings to webmux toolbar/drawer buttons
- Configure swipe gestures, floating buttons, or mobile init behaviour
- Validate a config before building

## Workflow

1. **Inspect tmux config** — run `tmux show-options -g prefix` and `tmux list-keys` to find the user's prefix and any custom bindings worth surfacing.
2. **Generate `webmux.config.ts`** — write only the keys that differ from defaults; omit everything else (`defineConfig()` fills in the rest).
3. **Validate** — run `webmux build --dry-run`. Fix any reported issues (unknown keys, wrong action payloads).
4. **Iterate** — repeat until `--dry-run` exits 0 with no errors.
5. **Summarise** — tell the user what was configured and why (prefix byte, custom bindings, gestures).
6. **Offer tmux mobile optimisation (optional)** — ask: "Would you like suggestions for making your tmux.conf more mobile-friendly?" If yes, run the checks in the [tmux mobile optimisation](#tmux-mobile-optimisation) section below.

## Config structure

All config goes through `defineConfig(overrides)`. Only override what you need.

```typescript
import { defineConfig } from 'webmux'

export default defineConfig({
  // All fields are optional — defaults filled in automatically
})
```

### Allowed root keys

Exactly these — validation rejects anything else:

```
name  theme  font  toolbar  drawer  gestures  mobile  floatingButtons  pwa  reconnect
```

### ButtonAction union — exact allowed values for `action.type`

| `type`           | Required fields     | Notes |
|------------------|---------------------|-------|
| `send`           | `data: string`      | Optional `keyLabel?: string` for help overlay |
| `ctrl-modifier`  | (none)              | Opens Ctrl+key combo UI |
| `paste`          | (none)              | Paste from clipboard |
| `combo-picker`   | (none)              | Opens Ctrl/Alt + key modal |
| `drawer-toggle`  | (none)              | Opens/closes command drawer |

Non-`send` actions must NOT have `data` or `keyLabel` — the validator rejects them.

### ControlButton shape

Every button in toolbar rows, drawer, and floatingButtons uses this schema:

```typescript
{
  id: string           // unique within its array; used by patch operations
  label: string        // text shown on the button
  description: string  // shown in help overlay — keep user-facing and clear
  action: ButtonAction
}
```

### Button array forms (`toolbar.row1`, `toolbar.row2`, `drawer.buttons`)

Two forms are accepted — pick the least invasive:

```typescript
// 1. Replace entirely (plain array)
toolbar: { row1: [{ id, label, description, action }, ...] }

drawer: {
  buttons: [
    { id: 'sessions', label: 'Sessions', description: 'Choose tmux session', action: { type: 'send', data: '\x02s' } },
  ],
}

// 2. Transform (function receives defaults, returns new array)
toolbar: { row2: (defaults) => defaults.filter(b => b.id !== 'q') }

// Function form covers all operations via standard JS:
// - Append:  (d) => [...d, newBtn]
// - Prepend: (d) => [newBtn, ...d]
// - Remove:  (d) => d.filter(b => b.id !== 'q')
// - Replace: (d) => d.map(b => b.id === 'tmux-prefix' ? newBtn : b)
// - Insert:  (d) => { const i = d.findIndex(b => b.id === 'tab'); return [...d.slice(0,i), newBtn, ...d.slice(i)] }
```

### Floating buttons

Must use the grouped shape — a flat `ControlButton[]` is rejected:

```typescript
floatingButtons: [
  {
    position: 'top-left',           // required
    direction: 'row',               // optional: 'row' | 'column' (default 'row')
    buttons: [{ id, label, description, action }],
  },
]
```

Valid positions: `top-left | top-right | top-centre | bottom-left | bottom-right | bottom-centre | centre-left | centre-right`

## Escape-code cheat sheet

Use these in `action.data` and gesture `left`/`right` fields:

| Key            | Escape sequence | Notes |
|----------------|-----------------|-------|
| Ctrl-B (prefix)| `\x02`          | Default tmux prefix |
| Ctrl-A (prefix)| `\x01`          | screen/byobu/custom prefix |
| Ctrl-C         | `\x03`          | Interrupt |
| Ctrl-D         | `\x04`          | EOF / exit shell |
| Escape         | `\x1b`          | |
| Tab            | `\t`            | |
| Shift+Tab      | `\x1b[Z`        | |
| Enter          | `\r`            | |
| Alt+Enter      | `\x1b\r`        | |
| Backspace      | `\x7f`          | DEL character |
| Up arrow       | `\x1b[A`        | |
| Down arrow     | `\x1b[B`        | |
| Right arrow    | `\x1b[C`        | |
| Left arrow     | `\x1b[D`        | |
| Page Up        | `\x1b[5~`       | |
| Page Down      | `\x1b[6~`       | |
| Space          | `' '`           | literal space |

### Composing tmux key sequences

tmux bindings are `prefix` + `key`. Concatenate the bytes:

```
Ctrl-B + c  →  '\x02c'   (new window)
Ctrl-B + n  →  '\x02n'   (next window)
Ctrl-B + p  →  '\x02p'   (previous window)
Ctrl-B + z  →  '\x02z'   (zoom pane)
Ctrl-B + %  →  '\x02%'   (split vertical — stock tmux)
Ctrl-B + "  →  '\x02"'   (split horizontal — stock tmux)
Ctrl-B + [  →  '\x02['   (copy mode)
Ctrl-B + d  →  '\x02d'   (detach)
```

For a custom prefix (e.g. Ctrl-A): replace `\x02` with `\x01`.

## Example configs

### Minimal — default Ctrl-B prefix, custom name only

```typescript
import { defineConfig } from 'webmux'

export default defineConfig({
  name: 'dev',
})
```

### Custom prefix — Ctrl-A (screen/byobu style)

Replace the default `tmux-prefix` button and update swipe gestures:

```typescript
import { defineConfig } from 'webmux'

export default defineConfig({
  name: 'dev',
  toolbar: {
    row1: (defaults) => defaults.map(b =>
      b.id === 'tmux-prefix'
        ? { ...b, description: 'Send tmux prefix key (Ctrl-A)', action: { type: 'send', data: '\x01' } }
        : b
    ),
  },
  gestures: {
    swipe: {
      left: '\x01n',
      right: '\x01p',
      leftLabel: 'Next tmux window',
      rightLabel: 'Previous tmux window',
    },
  },
  drawer: {
    buttons: (defaults) => defaults.map(b => {
      // Remap tmux-prefixed buttons from Ctrl-B (\x02) to Ctrl-A (\x01)
      if (b.action.type === 'send' && b.action.data.startsWith('\x02')) {
        return { ...b, action: { ...b.action, data: '\x01' + b.action.data.slice(1) } }
      }
      return b
    }),
  },
})
```

### Floating buttons + mobile auto-zoom

```typescript
import { defineConfig } from 'webmux'

export default defineConfig({
  mobile: {
    initData: '\x02z',    // zoom focused pane on mobile load
    widthThreshold: 768,
  },
  floatingButtons: [
    {
      position: 'top-left',
      buttons: [
        {
          id: 'zoom',
          label: 'Zoom',
          description: 'Toggle pane zoom',
          action: { type: 'send', data: '\x02z' },
        },
      ],
    },
  ],
})
```

## Tmux mobile optimisation

Run these checks when the user accepts the step 6 offer. If tmux is not running, fall back to reading `~/.config/tmux/tmux.conf` (or `~/.tmux.conf`) directly.

**Guardrails:** suggest snippets only — never modify `tmux.conf` without explicit permission. Link to the full guide at `docs/guides/mobile-tmux.md`.

| Check | Command | Good sign | Suggestion if missing |
|-------|---------|-----------|----------------------|
| Responsive status-left | `tmux show -g status-left` | Contains `#{client_width}` | Add width breakpoints |
| Responsive status-right | `tmux show -g status-right` | Contains `#{client_width}` or calls a script | Progressive content stripping |
| Popup sizing | `tmux list-keys \| grep display-popup` | Uses `%` dimensions | Replace fixed char sizes with `95%`/`100%` |
| Zoom indicator | `tmux show -g status-left` | Contains `window_zoomed_flag` | Add `#{?window_zoomed_flag,[Z] ,}` |
| Mouse mode | `tmux show -g mouse` | `on` | `set -g mouse on` |
| Window renumbering | `tmux show -g renumber-windows` | `on` | `set -g renumber-windows on` |

For each missing item, offer a concrete snippet the user can paste into `tmux.conf`. See the full guide for context and examples.

## Guardrails

- **Never invent root keys.** The validator rejects unknown keys with a path-based error.
- **Use `drawer.buttons`, never `drawer.commands`** — the latter was renamed and no longer works.
- **`send` actions require `data`** — omitting it fails validation.
- **Non-`send` actions must not have `data` or `keyLabel`** — validator rejects them.
- **`floatingButtons` is an array of groups** — wrap buttons in `{ position, buttons }`.
- **`toolbar` has `row1` and `row2`** — there is no `row3` or flat `buttons` key on toolbar.
- **`mobile.initData`** is `string | null` — set to `null` to disable, not `false` or `''`.
- **`reconnect`** has only `enabled: boolean` — defaults to `true`. Set `{ enabled: false }` to disable.

## Validation

```bash
webmux build --dry-run          # validates config, prints plan, exits without building
webmux build --dry-run -c ./webmux.config.ts   # explicit path
```

A zero exit with "Dry run: build" output means the config is valid. Any error output means fix the reported paths before proceeding.
