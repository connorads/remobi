# Keeping your Mac awake for remote access

When running `remobi serve` on a Mac to expose a terminal over the network
(e.g. via Tailscale), the host going to sleep makes the terminal unreachable.
This guide covers your options from quick to permanent.

## Quick: `--no-sleep` flag (recommended)

```bash
remobi serve --no-sleep
```

Under the hood this runs `caffeinate -s -w <pid>` alongside ttyd. The
sleep assertion is held exactly as long as the server runs and dropped
automatically on shutdown — no stale state, no manual cleanup.

Combine with other flags as usual:

```bash
remobi serve --no-sleep --port 8080 -- tmux new -As dev
```

**Caveats:**

- Works on AC power only — battery Macs will still sleep when unplugged
- Does not prevent lid-close sleep — closing the lid still sleeps the Mac
- No system config changes required
- Non-macOS: the flag is silently ignored (caffeinate is macOS-only)

## Persistent: system settings

For a Mac that should always be accessible (Mac mini, Mac Studio, headless
Mac Pro), configure the OS to never sleep permanently.

### System Settings GUI

**System Settings → Energy → Prevent automatic sleeping when the display is off**

Check this box and the Mac will stay awake indefinitely on AC power.

### pmset (command line)

```bash
# Never sleep on AC power
sudo pmset -c sleep 0

# Display off after 10 min (saves energy, doesn't affect remote access)
sudo pmset -c displaysleep 10

# Wake on LAN (useful if you ever let it sleep)
sudo pmset -c womp 1

# Stay awake during remote SSH/tty sessions
sudo pmset -c ttyskeepawake 1

# Auto restart after power loss
sudo pmset -c autorestart 1
```

Check current settings:

```bash
pmset -g
```

### nix-darwin (declarative)

```nix
power.sleep = {
  computer = "never";
  display = 10;
};
```

This is equivalent to the System Settings checkbox above. For the extra
`pmset` settings (WoL, ttyskeepawake, autorestart) add an activation script:

```nix
system.activationScripts.powerManagement.text = ''
  /usr/bin/pmset -c womp 1
  /usr/bin/pmset -c ttyskeepawake 1
  /usr/bin/pmset -c autorestart 1
'';
```

## Caffeinate flags reference

`caffeinate` is the macOS command-line tool for holding power management
assertions. `--no-sleep` uses `-s -w <pid>`.

| Flag | Prevents | Notes |
|------|----------|-------|
| `-i` | Idle sleep | Weakest — system can still sleep from other triggers |
| `-s` | System sleep | On AC power only. What `--no-sleep` uses |
| `-d` | Display sleep | Keeps screen on — rarely useful for a headless server |
| `-w <pid>` | (modifier) | Drop all assertions when the given PID exits |

You can also use caffeinate directly for ad-hoc situations:

```bash
caffeinate -s                # stay awake until Ctrl-C
caffeinate -s -t 3600        # stay awake for 1 hour
caffeinate -s -- long-task   # stay awake while long-task runs
```

## Lid-close behaviour

None of the above options prevent sleep when the lid is closed. macOS
sleeps on lid-close by design.

For a **MacBook acting as a server**, the options are:

- **Clamshell mode** — connect an external display, plug in power, close
  the lid. macOS stays awake in this configuration.
- **Amphetamine** (free, Mac App Store) — can override lid-close sleep
  independently of a display being connected.

For a **desktop Mac** (mini, Studio, Pro) lid-close is irrelevant.
