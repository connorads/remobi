# ADR 001: Bun-only runtime

**Status:** Superseded — remobi migrated to Node.js 22+ with pnpm (March 2026). See [Superseded](#superseded) below.
**Date:** 2026-02-24

## Context

remobi originally shipped TypeScript source directly with no transpilation step. The CLI and build pipeline used several Bun-specific APIs that had no direct Node.js equivalent without additional dependencies or polyfills.

Bun-specific APIs in use at the time:

| API | Used in | Node equivalent |
|---|---|---|
| `Bun.build()` | `build.ts` — bundled the overlay | `esbuild` (separate dep) |
| `Bun.spawn()` | `build.ts`, `src/serve.ts` — spawning ttyd | `child_process.spawn` (different API) |
| `Bun.serve()` | `src/serve.ts` — HTTP + WebSocket server | `node:http` + `ws` (two deps) |
| `Bun.stdin.text()` | `cli.ts` — reading piped stdin | `process.stdin` + async iteration |
| `Bun.write()` | `cli.ts`, `build.ts` — file writes | `node:fs/promises` |
| `import.meta.dir` | `tests/` — test file paths | `import.meta.dirname` |
| `Bun.file()` | `src/serve.ts` — serving icon assets | `node:fs/promises` |
| Native TypeScript execution | All source files, no `tsc` or `ts-node` | `tsx` or `ts-node` (separate dep) |

## Decision (original)

**remobi was Bun-only.** Non-Bun runtime support was deferred. The reasoning at the time:

1. **Source-first delivery depended on Bun.** Shipping raw TypeScript without a build step was a key developer-experience property. Replicating it for Node would need a transpile step or a dev dependency like `tsx`/`ts-node`.

2. **Bun was the intended runtime for the target use case.** The primary audience (developers running a personal terminal on a single machine) could install Bun in one command.

3. **The API surface was wide.** Abstracting seven Bun-specific APIs would need either a compatibility shim (maintenance burden) or large optional dependency chunks (esbuild, ws, etc.).

4. **Cost vs benefit was unfavourable pre-1.0.** Adding a secondary runtime track would double the CI matrix without clear user demand.

## Consequences (of the original decision)

- The `package.json` `engines` field declared `bun >=1.0.0`.
- `README.md` listed Bun as a requirement.
- Users on Node-only environments could not run remobi without Bun.

## Alternatives considered (at the time)

- **Bundle for Node at publish time:** produced a CommonJS/ESM dist that Node could run, but sacrificed the "ships TypeScript source" property and required a build step on every release.
- **Dual-runtime shim layer:** premature — no concrete demand and high maintenance cost.
- **Drop Bun features for Node compatibility:** would lose `Bun.build()`, `Bun.serve()`, and native TypeScript execution.

## Superseded

remobi migrated to **Node.js 22+ with pnpm** (March 2026). The publish-time bundle alternative above — originally rejected — won out, because requiring consumers to install Bun to run a published npm CLI was more friction than a build step on release: shipping transpiled JS reaches every Node user via the standard `npm i -g remobi` path.

The Bun-specific APIs were replaced with mature, widely-installed dependencies:

- `Bun.build()` → **esbuild** bundles the browser overlay (`build.ts`), prebuilt into `dist/` at publish time (`scripts/build-overlay.ts`) so `remobi serve` does not bundle on startup for consumers.
- `Bun.serve()` + WebSocket → **Hono** with `@hono/node-server` + `@hono/node-ws`, and a built-in PTY runtime via **node-pty** (`src/serve.ts`, `src/session.ts`) — remobi no longer shells out to ttyd.
- `Bun.spawn()` → `node:child_process` (`src/util/node-compat.ts`).
- `Bun.file()` / `Bun.write()` → `node:fs`.
- `import.meta.dir` → `import.meta.dirname`.
- Native TypeScript execution → **tsx** for running source in development, **tsdown** to transpile TS → JS for the published package.

Resulting state:

- `package.json` `engines` declares `node >=22.0.0`; the published package ships transpiled JS under `dist/`.
- `README.md` lists Node + pnpm and treats Bun as history.

Rejected alternatives for the migration:

- **Stay Bun-only and require consumers to install Bun** — blocks the Node-only majority and the standard npm install path.
- **Dual-runtime shim layer (Bun + Node adapters)** — maintenance cost without demonstrated demand; a single Node target is simpler.
