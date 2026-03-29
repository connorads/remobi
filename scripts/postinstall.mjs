import { chmodSync, existsSync } from "node:fs"
import { createRequire } from "node:module"
import { join, dirname } from "node:path"

const require = createRequire(import.meta.url)
try {
  const ptyDir = dirname(require.resolve("node-pty/package.json"))
  for (const arch of ["darwin-arm64", "darwin-x64"]) {
    const helper = join(ptyDir, "prebuilds", arch, "spawn-helper")
    if (existsSync(helper)) chmodSync(helper, 0o755)
  }
} catch {
  // node-pty not found, skip
}
