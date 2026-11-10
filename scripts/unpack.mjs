import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const archive = join(root, "dist", `helpwright-agent-plugin-v${version}.zip`);
const pluginsRoot = join(root, "plugins");
const pluginRoot = join(pluginsRoot, "helpwright");

if (!existsSync(archive)) {
  throw new Error(`Agent Plugin archive not found: ${relative(root, archive)}. Run pnpm build first.`);
}

rmSync(pluginRoot, { recursive: true, force: true });
mkdirSync(pluginsRoot, { recursive: true });

const result = spawnSync("unzip", ["-q", archive, "-d", pluginsRoot], { encoding: "utf8" });
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(result.stderr || `unzip exited ${result.status}`);
if (!existsSync(join(pluginRoot, "plugin.json"))) {
  throw new Error(`Unpacked plugin manifest not found: ${relative(root, pluginRoot)}/plugin.json`);
}

console.log(`Unpacked ${relative(root, archive)} to ${relative(root, pluginRoot)}/`);
