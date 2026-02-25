# Deploying webmux with Tailscale Serve

Expose a tmux session as a mobile-friendly web terminal over your Tailscale network with full PWA support.

## Prerequisites

- [ttyd](https://github.com/tsl0922/ttyd) installed
- [tmux](https://github.com/tmux/tmux) installed
- [Tailscale](https://tailscale.com/) configured with HTTPS enabled (`tailscale cert`)
- webmux installed (`bun add -g webmux`)

## Quick setup (recommended)

### 1. Start webmux serve

```bash
webmux serve
```

This builds the overlay in memory, starts ttyd on an internal port, and serves on `:7681` with full PWA support (manifest, icons, meta tags).

### 2. Expose via Tailscale Serve

```bash
tailscale serve --bg 7681
```

Your terminal is now available at `https://<your-machine>.<tailnet>.ts.net`.

On mobile, tap **Add to Home Screen** for a standalone app experience with the webmux icon.

### 3. Stop

```bash
pkill -f "webmux serve"
tailscale serve --https=443 off
```

> **Tip — keep your Mac awake:** Add `--no-sleep` so the Mac doesn't go to
> sleep while you're away:
>
> ```bash
> webmux serve --no-sleep
> ```
>
> See [Keeping your Mac awake](keep-awake.md) for persistent options (pmset,
> nix-darwin) and lid-close caveats.

## Shell function

```zsh
# webtermup: expose tmux session via webmux serve + Tailscale serve
function webtermup() {
  local session=${1:-main}
  local port=${2:-7681}

  pkill -f "webmux serve.*--port $port" 2>/dev/null
  pkill -f "ttyd.*--port $port" 2>/dev/null

  webmux serve --no-sleep --port $port -- tmux new-session -A -s "$session" &!

  tailscale serve --bg $port
  echo "Terminal ($session): https://$(tailscale status --self --json | jq -r '.Self.DNSName' | sed 's/\.\$//')"
}

# webtermdown: stop webmux serve and Tailscale serve
function webtermdown() {
  local port=${1:-7681}
  pkill -f "webmux serve.*--port $port" 2>/dev/null
  pkill -f "ttyd.*--port $port" 2>/dev/null
  tailscale serve --https=443 off 2>/dev/null
  echo "Web terminal stopped"
}
```

## Advanced: manual build + ttyd

For cases where you need direct control over ttyd (e.g. custom flags, separate processes):

### 1. Build the overlay

```bash
webmux build --output ~/.cache/webmux/index.html
```

Always rebuild before starting to avoid stale overlay issues.

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

### 3. Expose via Tailscale Serve

```bash
tailscale serve --bg 7681
```

Note: with the manual approach, PWA file refs (`/manifest.json`, `/apple-touch-icon.png`) will 404 — ttyd only serves a single HTML file. The inline SVG favicon still works. Use `webmux serve` for full PWA support.
