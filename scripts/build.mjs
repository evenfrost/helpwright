import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { validateAgentPlugin } from "./validate-agent-plugin.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const skillRoot = join(root, "skills/helpwright");
const outputRoot = join(root, "dist");

export function filesUnder(directory) {
  if (lstatSync(directory).isSymbolicLink()) {
    throw new Error(`Symlink is not packageable: ${directory}`);
  }
  const base = realpathSync(directory);
  const files = [];

  function visit(current) {
    for (const entry of readdirSync(current).sort()) {
      const path = join(current, entry);
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) throw new Error(`Symlink is not packageable: ${path}`);
      const resolved = realpathSync(path);
      if (!resolved.startsWith(`${base}${sep}`)) {
        throw new Error(`Package path escapes Skill root: ${path}`);
      }
      if (stat.isDirectory()) visit(path);
      else if (stat.isFile()) files.push(relative(directory, path));
      else throw new Error(`Unsupported package entry: ${path}`);
    }
  }

  visit(directory);
  return files;
}

function copyInto(source, destination) {
  if (!lstatSync(source).isFile()) throw new Error(`Not a regular file: ${source}`);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
}

function archive(stagingRoot, name, paths) {
  const output = join(outputRoot, name);
  rmSync(output, { force: true });
  const result = spawnSync("zip", ["-X", "-q", output, ...paths], {
    cwd: stagingRoot,
    encoding: "utf8"
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || `zip exited ${result.status}`);
  const hash = createHash("sha256").update(readFileSync(output)).digest("hex");
  console.log(`Built ${relative(root, output)}  SHA-256 ${hash}`);
}

export function build() {
  const packageManifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const pluginManifest = JSON.parse(readFileSync(join(root, "plugin.json"), "utf8"));
  validateAgentPlugin(pluginManifest);
  if (pluginManifest.version !== packageManifest.version) {
    throw new Error("plugin.json and package.json versions must match");
  }
  if (Object.hasOwn(pluginManifest, "extensions")) {
    throw new Error("v0.2 release must not include client extensions");
  }
  const skillFiles = filesUnder(skillRoot);
  if (!skillFiles.includes("SKILL.md")) throw new Error("Helpwright Skill has no SKILL.md");

  mkdirSync(outputRoot, { recursive: true });
  const stagingRoot = mkdtempSync(join(tmpdir(), "helpwright-build-"));
  try {
    const pluginStage = join(stagingRoot, "plugin");
    const skillStage = join(stagingRoot, "skill");
    const pluginPaths = ["helpwright/plugin.json", "helpwright/LICENSE"];
    const standalonePaths = [];

    copyInto(join(root, "plugin.json"), join(pluginStage, pluginPaths[0]));
    copyInto(join(root, "LICENSE"), join(pluginStage, pluginPaths[1]));
    for (const file of skillFiles) {
      const source = join(skillRoot, file);
      const pluginPath = `helpwright/skills/helpwright/${file}`;
      const standalonePath = `helpwright/${file}`;
      copyInto(source, join(pluginStage, pluginPath));
      copyInto(source, join(skillStage, standalonePath));
      pluginPaths.push(pluginPath);
      standalonePaths.push(standalonePath);
    }

    archive(pluginStage, `helpwright-agent-plugin-v${packageManifest.version}.zip`, pluginPaths);
    archive(skillStage, `helpwright-agent-skill-v${packageManifest.version}.zip`, standalonePaths);
  } finally {
    rmSync(stagingRoot, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) build();
