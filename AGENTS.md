# remobi

Monitor and control your coding agents from your phone. Touch controls for tmux over the web. Published on npm as `remobi`.

## Architecture

Pure TypeScript + DOM API — no framework. Transpiles to JS via tsdown for npm distribution. Bundles a browser client via esbuild and serves it from Node.

## Stack

- **Node 22+** — runtime
- **pnpm** — package manager
- **esbuild** — browser client bundle
- **tsdown** — transpile TS → JS for npm publish
- **vitest** — test runner
- **TypeScript (strict)** — no `any`, discriminated unions for actions
- **Biome** — lint + format
- **happy-dom** — DOM testing
- **Hono** — HTTP + WebSocket server (`remobi serve`)
- **node-pty** — PTY bridge for `remobi serve`
- **xterm.js** — browser terminal rendering

## Key Commands

```bash
git config core.hooksPath .hk-hooks  # Run once after clone
pnpm test              # Run all tests
pnpm run test:pw       # Playwright e2e tests (chromium + webkit)
pnpm run check         # Biome lint + format check
pnpm run check:fix     # Auto-fix lint + format
pnpm run build         # Deprecated legacy command
pnpm run build:dist    # Transpile for publishing (tsdown)
```

## Local Development

From source (bundles overlay on the fly, no build step):

```bash
tsx cli.ts serve                                # localhost:7681, default tmux session
tsx cli.ts serve --port 8080 -- bash --norc     # custom port, bash instead of tmux
```

From a local build:

```bash
pnpm run build:dist && node dist/cli.mjs serve
```

## Conventional Commits

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/) format, enforced by hk commit-msg hook.

- Format: `type(scope): description`
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `perf`, `style`, `build`, `revert`
- Breaking changes: include a `BREAKING CHANGE:` footer. `!` after type/scope is optional shorthand only and must be paired with the footer because semantic-release major detection relies on the footer.

**Choosing the right type matters** — it controls whether semantic-release publishes to npm:

| Type | Release | When to use |
|------|---------|-------------|
| `fix` | patch | Bug fix **visible to package consumers** (runtime behaviour, CLI output, published types) |
| `feat` | minor | New feature visible to consumers |
| `BREAKING CHANGE:` footer | major | Breaking change to public API; `!` is optional shorthand but not sufficient on its own in this repo |
| `ci` | none | CI/CD workflow changes (GitHub Actions, release config) |
| `chore` | none | Tooling, deps, repo hygiene — anything not shipped to consumers |
| `docs` | none | Documentation only |
| `refactor` | none | Code restructuring with no behaviour change |
| `test` | none | Adding or updating tests |

**NEVER use `fix` for non-consumer-facing changes.** `fix` triggers an npm release — it means a bug fix visible to package consumers (runtime behaviour, CLI output, published types). If the change only affects CI, dev tooling, tests, or repo internals, use `ci`, `chore`, or `test` instead — even if it "fixes" something. When in doubt, ask: "would a consumer notice if this change didn't exist?" If no, it's not `fix`.

## Module Layout

Browser overlay (bundled to the client via esbuild):

- `src/client-entry.ts` — IIFE entry point esbuild bundles into the served client (wires xterm + WebSocket to the overlay)
- `src/overlay-entry.ts` — alternate IIFE entry that re-exports `init`/`createHookRegistry` from `index` (embedding/coverage entry, not the bundle entry)
- `src/index.ts` — overlay bootstrap: waitForTerm then init overlay
- `src/config.ts` — defaults, defineConfig, deepMerge
- `src/types.ts` — all shared types
- `src/toolbar/` — toolbar DOM + button definitions
- `src/drawer/drawer.ts` — command drawer with flat grid
- `src/drawer/commands.ts` — re-exports defaultDrawerButtons from config
- `src/gestures/` — swipe, pinch, scroll detection + gesture lock
- `src/controls/` — font size, help overlay, combo picker, floating buttons, scroll buttons
- `src/theme/` — catppuccin-mocha + apply
- `src/viewport/` — height management, landscape detection
- `src/startup-resize.ts` — schedules the initial terminal resize on load (rAF + fonts-ready)
- `src/reconnect.ts` — connection loss overlay + auto-reload
- `src/util/dom.ts` — element creation helpers
- `src/util/terminal.ts` — sendData, resizeTerm, waitForTerm
- `src/util/haptic.ts` — vibration feedback
- `src/util/keyboard.ts` — isKeyboardOpen, conditionalFocus
- `src/util/tap.ts` — onTap: touch + click handler for iOS Safari compatibility
- `src/actions/registry.ts` — action dispatch + clipboard
- `src/hooks/registry.ts` — lifecycle hook system
- `src/config-schema.ts` — Valibot validation schemas
- `src/config-resolve.ts` — button array resolution
- `src/config-validate.ts` — config assertions
- `src/pwa/` — PWA manifest, meta-tags, icons

Server runtime (`remobi serve`, Node):

- `src/serve.ts` — Hono HTTP + WS server: routes, CSP/origin/host-header checks, icon serving, caffeinate, shutdown
- `src/session.ts` — SharedTerminalSession: node-pty spawn, xterm headless mirror, multi-client broadcast + snapshot
- `src/session-protocol.ts` — client/server message types, parse/serialise, input + resize bounds
- `src/base-path.ts` — URL prefix mounting (`--base-path`), shared by server routes and client
- `src/util/node-compat.ts` — sleep, spawnProcess, collectStream
- `src/util/spawn-helper.ts` — restore node-pty's macOS spawn-helper execute bit at runtime

CLI + build:

- `cli.ts` — CLI: serve, init, deprecated build/inject, --version; config loading (cwd → XDG) + .local overrides
- `src/cli/args.ts` — CLI argument parsing
- `build.ts` — source-runtime overlay bundling (esbuild) + HTML rendering; reads prebuilt `dist/` assets for published installs
- `scripts/build-overlay.ts` — writes the prebuilt `dist/client.iife.js` + `dist/client.css` for publish (`build:overlay`)
- `src/release/commit-message.ts` — conventional-commit parsing (release classification, breaking-footer check)
- `styles/base.css` — all CSS

## Publishing

- Transpiles to JS via tsdown: `bin` → `dist/cli.mjs`, `exports` → `dist/*.mjs` + `dist/*.d.mts`
- `files` array controls what's published: `dist/`, `styles/`, `src/pwa/icons/`, `README.md`, `CHANGELOG.md`, `LICENSE`
- CI: `.github/workflows/ci.yml` — pnpm test + biome check
- Release: `release` job in `.github/workflows/ci.yml` — semantic-release on push to `main` and `dev`, gated on `check` job
  - Versioning, changelog, npm publish, and GitHub Release are all automated
  - `npx semantic-release --dry-run` for local verification
  - Stable channel: `main` → npm `latest`
  - Prerelease channel: `dev` → npm `dev` + GitHub prereleases
  - Promote experimental releases by merging `dev` into `main`
  - Release triggers: `feat:` → minor, `fix:` → patch, `BREAKING CHANGE` → major
  - No release: `chore:`, `docs:`, `refactor:`, `test:`, `ci:`
- See **Local Development** above for running from source

## Conventions

- Button actions use discriminated unions (`type: 'send' | 'ctrl-modifier' | 'paste' | 'combo-picker' | 'drawer-toggle'`)
- Unified control schema: use `ControlButton` for both toolbar and drawer items
- Config shape: `drawer.buttons` (not `drawer.commands`)
- Config via `defineConfig()` — typed, with sensible defaults
- Config resolution: `--config` flag → cwd → `~/.config/remobi/` (XDG fallback)
- Drawer takes a flat `readonly ControlButton[]` — rendered as a single grid
- Help overlay is config-driven and must be fail-safe (never break core controls if help fails)
- Mobile viewport handling: lock document scroll and compute height from visual viewport (keyboard-aware)
- Changelog and versioning are fully automated by semantic-release — do not manually edit `CHANGELOG.md`. Use conventional commit types to control releases: `feat:` → minor, `fix:` → patch, `BREAKING CHANGE` → major. Non-release types: `chore:`, `docs:`, `refactor:`, `test:`, `ci:`
- All DOM creation in `util/dom.ts` helpers
- Keyboard state preserved: capture `isKeyboardOpen()` before action, use `conditionalFocus()` after
- Tests use happy-dom for DOM environment (e2e/CLI tests use node environment)
- Agent skill: `.agents/skills/remobi-setup/SKILL.md` provides AI agents with onboarding and config guidance. When config shape, CLI commands, action types, or validation rules change, update the skill to stay in sync.
- Agent onboarding: when helping a user set up remobi (not develop it), read `.agents/skills/remobi-setup/SKILL.md` and follow its workflow. Critical: `set -g mouse on` must be enabled in the user's tmux config for touch scroll to work — the skill covers this but agents skipping it is the most common setup failure.
