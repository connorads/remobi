# Deploying webmux with Tailscale Serve

Expose a tmux session as a mobile-friendly web terminal over your Tailscale network using ttyd + webmux + Tailscale Serve.

## Prerequisites

- [ttyd](https://github.com/tsl0922/ttyd) installed
- [tmux](https://github.com/tmux/tmux) installed
- [Tailscale](https://tailscale.com/) configured with HTTPS enabled (`tailscale cert`)
- webmux installed (`bun add -g webmux`)

## Setup

### 1. Build the overlay

```bash
webmux build --output ~/.cache/webmux/index.html
```

### 2. Start ttyd with the overlay

```bash
ttyd -i 127.0.0.1 --port 7681 --writable \
  --index ~/.cache/webmux/index.html \
  -t 'theme={"background":"#1e1e2e","foreground":"#cdd6f4"}' \
  -t 'fontFamily="JetBrainsMono NFM, monospace"' \
  -t 'scrollSensitivity=3' \
  -t 'disableLeaveAlert=true' \
  tmux new-session -A -s main
```

The `-i 127.0.0.1` flag binds to localhost only — Tailscale Serve handles external access.

### 3. Expose via Tailscale Serve

```bash
tailscale serve --bg 7681
```

Your terminal is now available at `https://<your-machine>.<tailnet>.ts.net`.

### 4. Stop

```bash
pkill -f "ttyd.*--port 7681"
tailscale serve --https=443 off
```

## Shell function example

Wrap the above into a shell function for convenience:

```zsh
# webtermup: expose tmux session via ttyd + Tailscale serve
function webtermup() {
  local session=${1:-main}
  local port=${2:-7681}

  pkill -f "ttyd.*--port $port" 2>/dev/null

  local cache_dir="${XDG_CACHE_HOME:-$HOME/.cache}/webmux"
  local idx="$cache_dir/index.html"

  webmux build --output "$idx"

  ttyd -i 127.0.0.1 --port $port --writable \
    --index "$idx" \
    -t 'fontFamily="JetBrainsMono NFM, monospace"' \
    -t 'scrollSensitivity=3' \
    -t 'disableLeaveAlert=true' \
    tmux new-session -A -s "$session" &!

  tailscale serve --bg $port
  echo "Terminal ($session): https://$(tailscale status --self --json | jq -r '.Self.DNSName' | sed 's/\.$//')"
}

# webtermdown: stop web terminal
function webtermdown() {
  local port=${1:-7681}
  pkill -f "ttyd.*--port $port" 2>/dev/null
  tailscale serve --https=443 off 2>/dev/null
  echo "Web terminal stopped"
}
```

## Theme flags

Pass the full theme as a ttyd `-t` flag to avoid a flash of unstyled terminal. webmux applies the theme on the client side, but the ttyd flag ensures the background colour matches immediately.

Use `serialiseThemeForTtyd()` from webmux to generate the theme JSON:

```typescript
import { defineConfig, serialiseThemeForTtyd } from 'webmux/config'
const config = defineConfig()
console.log(serialiseThemeForTtyd(config))
```

## Caching

For repeated builds, cache the output HTML and invalidate when versions change:

```bash
hash=$(echo "$(ttyd --version):$(webmux --version)" | md5sum | cut -d' ' -f1)
idx="$cache_dir/index-$hash.html"
[[ -f "$idx" ]] || webmux build --output "$idx"
```
