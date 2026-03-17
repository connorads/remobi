## [0.2.4](https://github.com/connorads/remobi/compare/v0.2.3...v0.2.4) (2026-03-16)


### Bug Fixes

* **security:** escape font CDN URL and tighten WS origin check ([1c55d5c](https://github.com/connorads/remobi/commit/1c55d5c28d85d14fc42a90813d4e479b531e4243))

## [0.2.3](https://github.com/connorads/remobi/compare/v0.2.2...v0.2.3) (2026-03-16)


### Bug Fixes

* **serve:** default remobi serve to localhost ([6b8706e](https://github.com/connorads/remobi/commit/6b8706ec144ff2c92f92538a2c39997534b32e4d))

## [0.2.2](https://github.com/connorads/remobi/compare/v0.2.1...v0.2.2) (2026-03-16)

### Bug Fixes

* guard process.argv[1] for strict index access ([fd07a60](https://github.com/connorads/remobi/commit/fd07a6026135caffc189ba40fc0051d5ee9215fa))

## [0.2.1](https://github.com/connorads/remobi/compare/v0.2.0...v0.2.1) (2026-03-15)

### Bug Fixes

* resolve symlink in entry guard so npx execution works ([f2409e1](https://github.com/connorads/remobi/commit/f2409e1ae63540f5594cc2384b76f6be4a701c2b))

## [0.2.0](https://github.com/connorads/remobi/compare/v0.1.0...v0.2.0) (2026-03-15)

### Bug Fixes

* **ci:** add npm to mise.toml for OIDC trusted publishing ([62bfd3a](https://github.com/connorads/remobi/commit/62bfd3a79864dfe60c0edc0bd6528be0bfbf5e34))
* exclude package.json from Biome formatter ([eb88ac5](https://github.com/connorads/remobi/commit/eb88ac525c4acd04afe8b01ae71b80295ebce508))
* remove leading ./ from bin path for npm 11 compatibility ([b350ecb](https://github.com/connorads/remobi/commit/b350ecbe8197346c91f78bdb64bc2906b483a047))
* remove redundant checks from prepublishOnly ([9f2247c](https://github.com/connorads/remobi/commit/9f2247c6a915578e7c7e1394fd9f562c7faea70c))

### Features

* add pixel R> logo and integrate across project ([0235c4b](https://github.com/connorads/remobi/commit/0235c4be3f1d0b503f4531a4c8adc90283eece0f))

## 0.1.0 (2026-03-15)

### Breaking Changes

* migrated from Bun to Node.js 22+ with pnpm — runtime is now Node, bundler is esbuild, test runner is vitest, transpiler is tsdown; `remobi serve` uses Hono + @hono/node-ws; package ships transpiled JS (`dist/`) instead of TypeScript source
* unified toolbar/drawer model to `ControlButton` (`id`, `label`, `description`, `action`) and renamed `drawer.commands` to `drawer.buttons`
* `floatingButtons` changed from flat `ControlButton[]` to `FloatingButtonGroup[]` with `position`, optional `direction`, and `buttons` array
* removed plugin system (`RemobiPlugin`, `UISlot`, `UIContributionCollector`, plugin manager, UI contributions, build-time resolution, `config.plugins`) — hooks and actions remain as core infrastructure

### Features

* `remobi serve` — single command with full PWA support, overlay build, ttyd lifecycle, manifest + icons + WebSocket relay
* PWA support — web app manifest, 192/512px icons, apple-touch-icon, theme-color meta tags for "Add to Home Screen"
* reconnect overlay — detects connection loss via WebSocket interception, auto-reconnects on browser online event
* `remobi serve --no-sleep` — prevents macOS system sleep via `caffeinate -s -w <pid>`
* `floatingButtons` config — always-visible buttons on touch devices
* `gestures.swipe.left`/`right` and `leftLabel`/`rightLabel` for configurable swipe actions
* `mobile.initData` — arbitrary data sent to terminal on mobile init below width threshold
* `pwa` config section (`enabled`, `shortName`, `themeColor`)
* top-level `name` config field — used as document title, PWA manifest name, apple-mobile-web-app-title
* default toolbar backspace button (`⌫`) for reliable mobile deletion
* new drawer `Combo` action (`combo-picker`) for explicit Ctrl/Alt key sends
* default toolbar `q` button (row 2) for quitting interactive TUIs
* explicit tmux `Prefix` (`C-b`) and `Alt+Enter` toolbar buttons
* dynamic help overlay rendered from current config
* runtime config validation with path-based errors and unknown-key checks
* stricter CLI parsing (`-c`/`-o`/`-n`, unknown-flag errors) plus `--dry-run` for `build` and `inject`
* action registry abstraction for toolbar/drawer button handling
* typed hook registry for overlay lifecycle and terminal send pipeline
* declarative button customisation via `ButtonArrayInput`
* per-machine config overrides via `.local` config file
* overlay pre-built as IIFE during `build:dist` — faster `remobi serve` startup

### Bug Fixes

* visibilitychange listener leak in reconnect dispose path
* reconnect overlay retry on any tap, focused button for keyboard `Enter`, duplicate reload guard
* unhandled promise rejection when `document.fonts.ready` fails
* help overlay rewritten to DOM API (no innerHTML), eliminating XSS surface
* PWA meta-tag values HTML-attribute-escaped
* `waitForTerm` rejects after timeout (default 10s) instead of polling indefinitely
* help overlay is fail-safe and cannot block core overlay init
* viewport/keyboard height handling and document scroll lock for mobile
