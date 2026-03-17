# Recommended ttyd flags

Reference for ttyd flags that work well with remobi.

> **Note:** `remobi serve` generates these flags automatically from your config. This guide is for manual `ttyd` usage with `remobi build`.

## Essential flags

| Flag | Purpose |
|------|---------|
| `--writable` | Allow input (without this, the terminal is read-only) |
| `--index <path>` | Use the remobi-patched HTML |
| `-i 127.0.0.1` | Bind to localhost only (use a reverse proxy for external access) |
| `--port <n>` | Port to listen on (default: 7681) |

## Theme flags (`-t`)

Pass theme settings as `-t key=value` to avoid flash of unstyled terminal on load.

```bash
ttyd \
  -t 'theme={"background":"#1e1e2e","foreground":"#cdd6f4","cursor":"#f5e0dc","cursorAccent":"#1e1e2e","selectionBackground":"#45475a","black":"#45475a","red":"#f38ba8","green":"#a6e3a1","yellow":"#f9e2af","blue":"#89b4fa","magenta":"#cba6f7","cyan":"#94e2d5","white":"#bac2de","brightBlack":"#585b70","brightRed":"#f38ba8","brightGreen":"#a6e3a1","brightYellow":"#f9e2af","brightBlue":"#89b4fa","brightMagenta":"#cba6f7","brightCyan":"#94e2d5","brightWhite":"#a6adc8"}' \
  -t 'fontFamily="JetBrainsMono NFM, monospace"' \
  -t 'scrollSensitivity=3' \
  -t 'disableLeaveAlert=true' \
  ...
```

### Flag reference

| Flag | Default | Notes |
|------|---------|-------|
| `theme={...}` | — | JSON object matching xterm.js theme properties |
| `fontFamily="..."` | `"courier-new"` | Must match the font loaded by remobi config |
| `scrollSensitivity=N` | `1` | `3` works well for mobile touch scrolling |
| `disableLeaveAlert=true` | `false` | Prevents "Leave site?" prompts when navigating away |

## Generating theme JSON

Use remobi's `serialiseThemeForTtyd()` to generate the theme string from your config:

```bash
node -e "import { defineConfig, serialiseThemeForTtyd } from 'remobi/config'; console.log(serialiseThemeForTtyd(defineConfig()))"
```

## Full example

```bash
ttyd -i 127.0.0.1 --port 7681 --writable \
  --index dist/index.html \
  -t 'theme={"background":"#1e1e2e","foreground":"#cdd6f4"}' \
  -t 'fontFamily="JetBrainsMono NFM, monospace"' \
  -t 'scrollSensitivity=3' \
  -t 'disableLeaveAlert=true' \
  tmux new-session -A -s main
```
