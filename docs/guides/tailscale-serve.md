# Deploying remobi with Tailscale Serve

Expose a tmux session as a mobile-friendly web terminal over your Tailscale network with full PWA support.

## Prerequisites

- [ttyd](https://github.com/tsl0922/ttyd) installed (`brew install ttyd` on macOS; Linux via distro package manager or source build from the [installation guide](https://github.com/tsl0922/ttyd#installation))
- [tmux](https://github.com/tmux/tmux) installed
- [Tailscale](https://tailscale.com/) configured with HTTPS enabled (`tailscale cert`)
- remobi installed (`npm install -g remobi`)

## Quick setup (recommended)

### 1. Start remobi serve

```bash
remobi serve
```

This builds the overlay in memory, starts ttyd on an internal port, and serves on `:7681` with full PWA support (manifest, icons, meta tags).

By default `remobi serve` binds to `127.0.0.1`, so it is not exposed on your LAN. Tailscale Serve is the thing that publishes it.

### 2. Expose via Tailscale Serve

```bash
tailscale serve --bg 7681
```

Your terminal is now available at `https://<your-machine>.<tailnet>.ts.net`.

On mobile, tap **Add to Home Screen** for a standalone app experience with the remobi icon.

### 3. Stop

```bash
pkill -f "remobi serve"
tailscale serve --https=443 off
```

> **Tip — keep your Mac awake:** Add `--no-sleep` so the Mac doesn't go to
> sleep while you're away:
>
> ```bash
> remobi serve --no-sleep
> ```
>
> See [Keeping your Mac awake](keep-awake.md) for persistent options (pmset,
> nix-darwin) and lid-close caveats.

## Shell function

```zsh
# webtermup: expose tmux session via remobi serve + Tailscale serve
function webtermup() {
  local session=${1:-main}
  local port=${2:-7681}

  pkill -f "remobi serve.*--port $port" 2>/dev/null
  pkill -f "ttyd.*--port $port" 2>/dev/null

  remobi serve --no-sleep --port $port -- tmux new-session -A -s "$session" &!

  tailscale serve --bg $port
  echo "Terminal ($session): https://$(tailscale status --self --json | jq -r '.Self.DNSName' | sed 's/\.\$//')"
}

# webtermdown: stop remobi serve and Tailscale serve
function webtermdown() {
  local port=${1:-7681}
  pkill -f "remobi serve.*--port $port" 2>/dev/null
  pkill -f "ttyd.*--port $port" 2>/dev/null
  tailscale serve --https=443 off 2>/dev/null
  echo "Web terminal stopped"
}
```

## Advanced: manual build + ttyd

If you are tempted to run `remobi serve --host 0.0.0.0`, be explicit about the trade-off: that bypasses the localhost-only default and exposes terminal control directly on the bound network interface. Prefer keeping remobi on loopback and letting Tailscale handle reachability.

For cases where you need direct control over ttyd (e.g. custom flags, separate processes):

### 1. Build the overlay

```bash
remobi build --output ~/.cache/remobi/index.html
```

Always rebuild before starting to avoid stale overlay issues.

### 2. Start ttyd with the overlay

```bash
ttyd -i 127.0.0.1 --port 7681 --writable \
  --index ~/.cache/remobi/index.html \
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

Note: with the manual approach, PWA file refs (`/manifest.json`, `/apple-touch-icon.png`) will 404 — ttyd only serves a single HTML file. The inline SVG favicon still works. Use `remobi serve` for full PWA support.
