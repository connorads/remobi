# Demo Script (~5 min)

## Setup (before talk)

- tmux session "demo" running on laptop with 2-3 windows
  - Window 1: Claude Code agent working on a task
  - Window 2: OpenCode agent on a different task
  - Window 3: shell (lazygit, htop, or similar)
- muxi installed (`npm install -g muxi`)
- Tailscale tunnel ready but NOT started yet

## Demo flow

### 1. Show the problem (laptop, ~30s)

- Show tmux on laptop — multiple windows, agents running
- "This is my setup. Multiple agents, multiple windows. Works great... at my desk."
- "But what if I want to go to bed? Or check on things from the sofa?"

### 2. Install and start muxi (laptop, ~1 min)

- `muxi serve` — one command
- Show it starts ttyd, builds the overlay, serves with PWA
- Start tunnel / or use localhost if presenting locally

### 3. Connect on phone (phone on screen, ~2-3 min)

- Open URL on phone — same session appears
- **Swipe left/right** — navigate between agent windows
- **Scroll** — scroll through agent output
- **Pinch to zoom** — resize text to readable size
- **Tap toolbar buttons** — send tmux prefix, escape, newline
- **Open drawer** — show the command grid (new window, split, etc.)
- **Create a new window** — tap the button, show it works
- **Type something** — continue an agent task or run a command
- "Same session. Same agents. From my phone."

### 4. The pitch (30s)

- "muxi. On npm. v0.1. Config-driven, self-hosted, works with any tmux workflow."
- "I'd love to know how you'd use it. Come chat to me."
- Show: `npm install -g muxi` and `github.com/connorads/muxi`
