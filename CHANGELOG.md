# Changelog

## Unreleased

This project has not been published yet. On first release, rename this section to `0.1.0` and add the release date.

- Changed: overlay is now pre-built as an IIFE during `build:dist` — faster `muxi serve` startup (no runtime esbuild), smaller install footprint (esbuild moved to devDependencies). Dev mode falls back to esbuild-from-source when `dist/overlay.iife.js` is absent.

- Breaking: migrated from Bun to Node.js 22+ with pnpm. Runtime is now Node, bundler is esbuild, test runner is vitest, transpiler is tsdown. `muxi serve` uses Hono + @hono/node-ws for HTTP/WS. Package now ships transpiled JS (`dist/`) instead of TypeScript source.

- Internal: expanded oxlint — `suspicious` + `perf` categories, `import/no-cycle`, `import/no-self-import`, `typescript/no-non-null-asserted-optional-chain`, `unicorn/throw-new-error` (141 rules total).
- Internal: expanded Biome — `noExcessiveCognitiveComplexity` (warn, max 25), `useFilenamingConvention` (kebab-case).
- Internal: added knip for unused export/dependency detection. Removed 11 unused exports, removed redundant `happy-dom` devDep.
- Internal: added publint for npm package validation. Fixed `pkg.repository.url` to `git+https://` convention.
- Internal: added typos spell checker via mise.
- Internal: added hk pre-commit hooks (biome, oxlint, typos).
- Internal: added knip, publint, typos to CI pipeline and prepublishOnly gate.
- Changed: removed `ttyd` from `mise.toml` (unsupported on macOS arm64 via current aqua metadata) and updated ttyd install guidance to be macOS/Linux friendly (`brew` on macOS, distro/source options on Linux).
- Changed: shipped drawer defaults now stick to stock tmux bindings for split/session/window/copy actions and no longer include opinionated `Git`, `Files`, or `Links` buttons.

- Removed: plugin system (`MuxiPlugin`, `UISlot`, `UIContributionCollector`, plugin manager, UI contributions, build-time resolution, `config.plugins`). Hooks and actions remain as core infrastructure. The plugin API can be reintroduced when there's a concrete second use case.

- Fixed: visibilitychange listener leak in reconnect dispose path — the anonymous listener was never removed, causing a leak on each dispose/re-init cycle.
- Fixed: reconnect overlay now retries on any overlay tap, keeps the button focused for keyboard `Enter`, and guards against duplicate reload attempts.
- Fixed: unhandled promise rejection when `document.fonts.ready` fails — font loading failure is non-critical, terminal still works.
- Internal: `bun test --coverage` reporting via `test:coverage` script.
- Internal: shared `mockTerminal` test fixture extracted from 9 test files.
- Internal: new tests for `applyTheme`, `haptic`, and `checkLandscapeKeyboard`.

- Added: reconnect overlay — detects connection loss via WebSocket interception and shows a full-screen "Connection lost" overlay with a Reconnect button. Auto-reconnects when the browser comes back online. Enabled by default (`reconnect: { enabled: true }`), disable with `reconnect: { enabled: false }`.

- Added: Remotion-based demo video in `demo/` — programmatically rendered, Catppuccin Mocha themed.
- Added: oxlint with `consistent-type-assertions: never` rule to prevent unsafe type assertions.
- Changed: `waitForTerm` now rejects after timeout (default 10s) instead of polling indefinitely.
- Changed: plugin manager validates plugin shape at init — invalid plugins are skipped with a warning.
- Changed: help overlay rewritten to DOM API (no innerHTML), eliminating XSS surface.
- Changed: PWA meta-tag values are now HTML-attribute-escaped.
- Added: unit tests for `buildTtydArgs`, `randomInternalPort`, `waitForTerm`, and plugin validation.
- Added: `bun run build` step in CI workflow.
- Added: `muxi serve --no-sleep` flag — prevents macOS system sleep while serving by wrapping ttyd with `caffeinate -s -w <pid>`. The assertion is held for exactly the lifetime of the server and dropped automatically on shutdown. Gracefully ignored with a warning on non-macOS platforms.
- Added: keep-awake guide (`docs/guides/keep-awake.md`) covering `--no-sleep`, persistent pmset settings, nix-darwin config, and lid-close behaviour.
- Added: mobile-friendly tmux config guide (`docs/guides/mobile-tmux.md`) and optional tmux optimisation step in setup skill.
- Added: agent setup skill (`skills/muxi-setup/SKILL.md`), guide (`docs/guides/agent-setup.md`), and README collapsible prompt for AI-assisted configuration.
- Added: `muxi serve` — single command to run muxi with full PWA support. Builds overlay in memory, manages ttyd lifecycle, serves manifest + icons + WebSocket relay. Replaces the multi-step build + ttyd + proxy workflow.
- Added: PWA support — web app manifest, 192/512px icons, apple-touch-icon, theme-color meta tags for "Add to Home Screen" installability on iOS and Android.
- Added: `pwa` config section (`enabled`, `shortName`, `themeColor`) — controls manifest generation and meta tag injection. `shortName` defaults to `name` when absent.
- Added: top-level `name` config field (default `'muxi'`) — used as document title, PWA manifest name, and apple-mobile-web-app-title. Replaces `pwa.name` and `pwa.shortName` (the latter is now optional and falls back to `name`).
- Added: default toolbar backspace button (`⌫`, sends `\x7f`) to provide reliable deletion on mobile keyboards when IME composition behaviour is inconsistent.
- v0.2 extensibility and DX milestone complete: action registry, hook system, plugin manager, UI contributions, declarative button customisation, .local config overrides, plugin guide, Bun-only ADR, e2e scaffolding. Closes #1.
- Added: e2e smoke test scaffold (`tests/e2e/smoke.test.ts`) — checks ttyd availability, skips gracefully when absent, tests HTML serving and `muxi inject` pipe path against a real ttyd process. Closes #9.
- Added: ADR `docs/decisions/001-bun-only.md` — documents the decision to remain Bun-only, the Bun-specific APIs in use, and the conditions under which a Node runtime track would be considered. Closes #11.
- Added: plugin author guide (`docs/guides/plugins.md`) covering hooks, UI contributions, custom actions, and cleanup patterns. Closes #10.
- Added: stable public API surface defined in README — semver policy documents which import paths are public, what constitutes major/minor/patch. Closes #4.
- Added: UI contribution API for plugins — `context.ui.add(slot, button, priority?)` lets plugins contribute buttons to `'toolbar.row1'`, `'toolbar.row2'`, or `'drawer'` slots. Contributions are merged (appended) after config buttons, sorted by priority. Closes #8.
- Added: per-machine config overrides via `.local` config file — place `muxi.config.local.ts` next to your shared `muxi.config.ts` to apply machine-specific overrides (gitignore the `.local` file). Merged on top of the shared config using the same `MuxiConfigOverrides` schema. Closes #12.
- Added: declarative button customisation — toolbar rows and drawer buttons now accept `ButtonArrayInput`: a plain array (replace) or a function `(defaults) => newArray`. Standard JS array methods cover all customisation needs (filter, map, spread, etc.). Closes #13.

- Breaking: unified toolbar/drawer model to `ControlButton` (`id`, `label`, `description`, `action`) and renamed `drawer.commands` to `drawer.buttons`.
- Changed: touch scrolling defaults to wheel semantics for better behaviour across OpenCode, Claude Code, and plain tmux shells.
- Added: dynamic help overlay rendered from current config (no stale hardcoded sections).
- Fixed: help overlay is now fail-safe and cannot block core overlay init.
- Fixed: viewport/keyboard height handling and document scroll lock to reduce white-gap/rubber-band issues on mobile.
- Added: runtime config validation with path-based errors and unknown-key checks at CLI load boundaries.
- Changed: config validation errors now include received-value previews, and CLI validates merged resolved config before build/inject execution.
- Added: stricter CLI parsing (`-c`/`-o`/`-n`, unknown-flag errors) plus `--dry-run` for `build` and `inject`. Closes #3.
- Changed: toolbar/drawer button handling now runs through a shared action registry abstraction. Closes #5.
- Added: typed hook registry for overlay lifecycle and terminal send pipeline with ordered execution and error isolation. Closes #6.
- Added: plugin manager primitives (`MuxiPlugin`, setup/dispose lifecycle, failure isolation) and plugin-aware `init(..., hooks, plugins)` entry. Closes #7.
- Added: config `plugins` array support in CLI build/inject path with resolved local specifiers.
- Changed: CLI config validation remains strict; legacy config shapes are not auto-normalised.
- Tests: expanded integration/config/height coverage for the new config model and viewport logic.
- Added: `gestures.swipe.left`/`right` (data to send on swipe) and `leftLabel`/`rightLabel` (help overlay text) — defaults match previous hardcoded behaviour (`\x02n`/`\x02p`, next/previous tmux window).
- Added: `mobile.initData` (string | null) — arbitrary data sent to the terminal on mobile init when viewport is below `mobile.widthThreshold` (default 768px). Useful for auto-zooming a tmux pane (`'\x02z'`) or any other mobile-specific setup.
- Added: `floatingButtons` config — always-visible buttons on touch devices using the same `ControlButton` schema as toolbar/drawer. Renders in the help overlay when non-empty.
- Breaking: `floatingButtons` changed from a flat `ControlButton[]` to `FloatingButtonGroup[]`. Each group has a `position` (`'top-left' | 'top-right' | 'top-centre' | 'bottom-left' | 'bottom-right' | 'bottom-centre' | 'centre-left' | 'centre-right'`), optional `direction` (`'row' | 'column'`, default `'row'`), and a `buttons` array. Migrate: `floatingButtons: [btn]` → `floatingButtons: [{ position: 'top-left', buttons: [btn] }]`.
- Changed: Tailscale Serve guide now recommends always rebuilding the overlay before start; removed version-hash cache-key snippet to prevent stale build issues.
- Changed: default toolbar now uses explicit tmux `Prefix` (`C-b`) and `Alt+Enter` buttons for more predictable mobile input.
- Added: new drawer `Combo` action (`combo-picker`) that opens a small combo input modal for explicit Ctrl/Alt key sends.
- Added: default toolbar `q` button (row 2, left) for quitting interactive TUIs.
