# Configure webmux with AI agents

AI agents (Claude Code, Cursor, Copilot, etc.) can inspect your tmux config and generate a valid `webmux.config.ts` for you. This guide explains how to set that up, with a reference prompt you can paste directly.

## Prerequisites

- [Node.js](https://nodejs.org/) ≥ 22
- [ttyd](https://github.com/tsl0922/ttyd) installed and on PATH (`brew install ttyd` on macOS; Linux via distro package manager or source build from the [installation guide](https://github.com/tsl0922/ttyd#installation))
- [tmux](https://github.com/tmux/tmux) installed
- webmux installed: `npm install -g webmux`

## Install the webmux skill (recommended)

If your agent supports [skills.sh](https://skills.sh) (Claude Code, Cursor, Codex, Gemini, OpenCode):

```bash
npx skills add connorads/webmux
```

For a specific agent only (e.g. Claude Code, globally):

```bash
npx skills add connorads/webmux -a claude-code -g
```

Once installed the agent has access to the full config schema, escape-code reference, and examples without you needing to paste anything.

## Or paste this prompt

If you cannot install the skill, paste this self-contained prompt directly into your agent:

---

> Inspect my tmux config (`tmux show-options -g prefix` and `tmux list-keys`), then generate a `webmux.config.ts` in the current directory tailored to my setup.
>
> Rules:
> - Use `import { defineConfig } from 'webmux'` and `export default defineConfig({...})`
> - Only include keys that differ from defaults; omit everything else
> - Allowed root keys: `name theme font toolbar drawer gestures mobile floatingButtons pwa reconnect`
> - `action.type` must be one of: `send | ctrl-modifier | paste | combo-picker | drawer-toggle`
> - `send` actions require `data: string`; no other action type may have `data`
> - Button arrays (`toolbar.row1`, `toolbar.row2`, `drawer.buttons`) accept a plain array or a function `(defaults) => newArray`
> - `floatingButtons` is an array of groups: `{ position, direction?, buttons }` — never a flat button array
> - `drawer.buttons` not `drawer.commands`
> - Tmux sequences: prefix byte + key char (e.g. Ctrl-B prefix = `\x02`, so new window = `\x02c`)
>
> After writing the file, run `webmux build --dry-run` and fix any reported errors. Summarise what was configured and why.

---

The skill can also suggest tmux.conf mobile optimisations after config generation — see [Mobile-friendly tmux config](mobile-tmux.md) for what it checks.

## Tmux-to-webmux mapping reference

### Prefix bytes

| Prefix key | Byte  | Common in |
|-----------|-------|-----------|
| Ctrl-B    | `\x02` | tmux default |
| Ctrl-A    | `\x01` | screen, byobu, many customs |
| Ctrl-Space| `\x00` | less common |

### Composing sequences

tmux key bindings are `prefix + key`. Concatenate the bytes:

```
Ctrl-B + c   →  '\x02c'     new window
Ctrl-B + n   →  '\x02n'     next window
Ctrl-B + p   →  '\x02p'     previous window
Ctrl-B + z   →  '\x02z'     toggle pane zoom
Ctrl-B + [   →  '\x02['     enter copy mode
Ctrl-B + d   →  '\x02d'     detach
Ctrl-B + %   →  '\x02%'     split vertical (stock tmux)
Ctrl-B + "   →  '\x02"'     split horizontal (stock tmux)
```

For Ctrl-A prefix: replace `\x02` with `\x01` throughout.

### Special keys

| Key         | Sequence   |
|-------------|------------|
| Escape      | `\x1b`     |
| Tab         | `\t`       |
| Shift+Tab   | `\x1b[Z`   |
| Enter       | `\r`       |
| Alt+Enter   | `\x1b\r`   |
| Backspace   | `\x7f`     |
| Ctrl-C      | `\x03`     |
| Ctrl-D      | `\x04`     |
| Up          | `\x1b[A`   |
| Down        | `\x1b[B`   |
| Right       | `\x1b[C`   |
| Left        | `\x1b[D`   |
| Page Up     | `\x1b[5~`  |
| Page Down   | `\x1b[6~`  |

## Example configs

### Minimal — just set the app name

```typescript
import { defineConfig } from 'webmux'

export default defineConfig({
  name: 'dev',
})
```

Everything else uses defaults (Ctrl-B prefix, catppuccin-mocha theme, swipe = next/prev window).

### Replace the default drawer entirely

```typescript
import { defineConfig } from 'webmux'

export default defineConfig({
  drawer: {
    buttons: [
      { id: 'sessions', label: 'Sessions', description: 'Choose tmux session', action: { type: 'send', data: '\x02s' } },
      { id: 'git', label: 'Git', description: 'Open my tmux git popup', action: { type: 'send', data: '\x02g' } },
    ],
  },
})
```

### Custom prefix — Ctrl-A

Replace only the prefix button and update swipe gestures; keep everything else:

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
    initData: '\x02z',   // zoom focused pane automatically on mobile load
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

## Validation loop

Always validate before building:

```bash
webmux build --dry-run
```

`--dry-run` loads and validates your config, prints what it would do, and exits without starting ttyd or writing files. A clean run looks like:

```
Dry run: build
- config: /path/to/webmux.config.ts
- output: /path/to/dist/index.html
- action: would bundle overlay, fetch ttyd base HTML, inject, and write file
```

Any validation error prints the failing path, what was expected, and what was received:

```
Invalid webmux config:
- config.drawer.buttons[0].action.type: expected 'send' | 'ctrl-modifier' | ..., received string("key-send")
```

## Common validation errors and fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `config.<unknown-key>: expected known key` | Invented or legacy root key | Remove it; only `name theme font toolbar drawer gestures mobile floatingButtons pwa reconnect` are valid |
| `config.drawer.commands` | Old key name | Rename to `drawer.buttons` |
| `config.toolbar.buttons` | Wrong toolbar shape | Use `toolbar.row1` and/or `toolbar.row2` |
| `action.type: expected 'send' \| ...` | Wrong type string | Use exact literal: `send`, `ctrl-modifier`, `paste`, `combo-picker`, or `drawer-toggle` |
| `action.data: expected string, received undefined` | `send` action missing `data` | Add `data: '\x...'` |
| `action.data: expected undefined for non-send actions` | `data` on wrong action type | Remove `data` from non-`send` actions |
| `floatingButtons[0]: expected object` | Flat `ControlButton[]` passed | Wrap in a group: `{ position: 'top-left', buttons: [...] }` |
| `floatingButtons[0].position: expected 'top-left' \| ...` | Misspelled or unsupported position | Use one of: `top-left top-right top-centre bottom-left bottom-right bottom-centre centre-left centre-right` |
| `mobile.initData: expected string or null` | `false` or `0` passed | Use `null` to disable, or a string to send |
