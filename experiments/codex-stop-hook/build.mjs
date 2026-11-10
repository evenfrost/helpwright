import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const experimentRoot = dirname(fileURLToPath(import.meta.url));
const root = dirname(dirname(experimentRoot));
const stage = mkdtempSync(join(tmpdir(), "helpwright-codex-poc-"));
const pluginRoot = join(stage, "helpwright");
const output = join(root, "dist/helpwright-codex-stop-hook-experiment.zip");

try {
  mkdirSync(join(pluginRoot, "experiments/codex-stop-hook"), { recursive: true });
  mkdirSync(join(pluginRoot, "scripts"), { recursive: true });
  cpSync(join(experimentRoot, ".codex-plugin"), join(pluginRoot, ".codex-plugin"), { recursive: true });
  cpSync(join(experimentRoot, "hooks"), join(pluginRoot, "hooks"), { recursive: true });
  cpSync(join(root, "skills"), join(pluginRoot, "skills"), { recursive: true });
  copyFileSync(join(experimentRoot, "codex-stop-hook.mjs"), join(pluginRoot, "experiments/codex-stop-hook/codex-stop-hook.mjs"));
  copyFileSync(join(root, "scripts/verify-operational-claims.mjs"), join(pluginRoot, "scripts/verify-operational-claims.mjs"));
  copyFileSync(join(root, "LICENSE"), join(pluginRoot, "LICENSE"));
  mkdirSync(dirname(output), { recursive: true });
  rmSync(output, { force: true });
  const result = spawnSync("zip", ["-X", "-q", "-r", output, "helpwright"], {
    cwd: stage,
    encoding: "utf8"
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || `zip exited ${result.status}`);
  console.log(`Built ${output}`);
} finally {
  rmSync(stage, { recursive: true, force: true });
}
