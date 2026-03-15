# ADR 001: Bun-only runtime

**Status:** Superseded — migrated to Node.js 22+ with pnpm (March 2026)
**Date:** 2026-02-24

## Context

remobi ships TypeScript source directly (no transpilation step). The CLI and build pipeline use several Bun-specific APIs that have no direct equivalents in Node.js without significant additional dependencies or polyfills.

Bun-specific APIs in active use:

| API | Used in | Node equivalent |
|---|---|---|
| `Bun.build()` | `build.ts` — bundles the overlay | `esbuild` (separate dep) |
| `Bun.spawn()` | `build.ts`, `src/serve.ts` — spawning ttyd | `child_process.spawn` (different API) |
| `Bun.serve()` | `src/serve.ts` — HTTP + WebSocket server | `node:http` + `ws` (two deps) |
| `Bun.stdin.text()` | `cli.ts` — reads piped stdin | `process.stdin` + async iteration |
| `Bun.write()` | `cli.ts`, `build.ts` — file writes | `node:fs/promises` |
| `import.meta.dir` | `tests/` — test file paths | `__dirname` (CommonJS only) |
| `Bun.file()` | `src/serve.ts` — serving icon assets | `node:fs/promises` |
| Native TypeScript execution | All source files, no `tsc` or `ts-node` | `tsx` or `ts-node` (separate dep) |

## Decision

**remobi remains Bun-only until further notice.**

Non-Bun runtime support is deferred. The reasons:

1. **Source-first delivery model depends on Bun.** Shipping raw TypeScript without a build step is a key developer-experience property. Replicating this for Node would require a transpile step or a dev dependency like `tsx`/`ts-node`, adding complexity and a separate packaging track.

2. **Bun is the intended runtime for the target use case.** The primary audience (developers running a personal terminal on a single machine) can install Bun in one command. There is no organisational policy preventing Bun adoption.

3. **API surface is wide.** Abstracting away seven Bun-specific APIs would require either: (a) a compatibility shim layer adding maintenance burden, or (b) large optional dependency chunks (esbuild, ws, etc.) that replicate what Bun provides natively.

4. **Cost vs benefit is unfavourable now.** The project is pre-1.0 and adding a secondary runtime track would double the CI matrix and slow feature development without clear user demand.

## Consequences

- The `package.json` `engines` field declares `bun >=1.0.0`.
- `README.md` prominently lists Bun as a requirement.
- Users on Node-only environments cannot run remobi without Bun installed.
- If demand for Node support emerges post-1.0, the approach would be: extract Bun-specific code into a thin adapter layer (`src/runtime/`), ship a separate `remobi-node` package, and maintain both adapters. This ADR would be superseded.

## Alternatives considered

- **Bundle for Node at publish time:** Produces a CommonJS/ESM dist that Node can run, but sacrifices the "ships TypeScript source" property and requires a build step on every release.
- **Dual-runtime shim layer now:** Premature — no concrete demand and high maintenance cost.
- **Drop Bun features for Node compatibility:** Would lose `Bun.build()` (bundler), `Bun.serve()` (HTTP server), and native TypeScript execution — effectively rewriting the tool.
