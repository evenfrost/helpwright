import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const experimentRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = dirname(dirname(experimentRoot));
const outputRoot = join(repositoryRoot, "dist");
const stagingRoot = join(outputRoot, "claude-plugin-experiment");
const portableSkill = join(repositoryRoot, "skills", "helpwright");
const version = "0.0.1";

const variants = [
  {
    name: "core",
    archive: `helpwright-claude-plugin-core-v${version}.zip`
  },
  {
    name: "probes",
    archive: `helpwright-claude-plugin-probes-v${version}.zip`
  }
];

function filesUnder(directory) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...filesUnder(path));
    else if (entry.isFile()) files.push(path);
  }

  return files.sort();
}

function hashDirectory(directory) {
  const hash = createHash("sha256");

  for (const path of filesUnder(directory)) {
    hash.update(relative(directory, path));
    hash.update("\0");
    hash.update(readFileSync(path));
    hash.update("\0");
  }

  return hash.digest("hex");
}

function hashFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function buildVariant(variant) {
  const variantRoot = join(stagingRoot, variant.name);
  const pluginRoot = join(variantRoot, "helpwright");
  const archivePath = join(outputRoot, variant.archive);

  rmSync(variantRoot, { recursive: true, force: true });
  rmSync(archivePath, { force: true });
  mkdirSync(pluginRoot, { recursive: true });

  cpSync(join(experimentRoot, "plugin"), pluginRoot, { recursive: true });
  cpSync(join(repositoryRoot, "LICENSE"), join(pluginRoot, "LICENSE"));
  cpSync(portableSkill, join(pluginRoot, "skills", "helpwright"), {
    recursive: true
  });

  if (variant.name === "probes") {
    cpSync(join(experimentRoot, "probes"), pluginRoot, { recursive: true });
  }

  const zip = spawnSync("zip", ["-q", "-r", archivePath, "helpwright"], {
    cwd: variantRoot,
    stdio: "inherit"
  });

  if (zip.error) throw zip.error;
  if (zip.status !== 0) process.exit(zip.status ?? 1);

  if (!statSync(archivePath).isFile()) {
    throw new Error(`Archive was not created: ${archivePath}`);
  }

  return { archivePath, hash: hashFile(archivePath) };
}

mkdirSync(outputRoot, { recursive: true });

console.log(`Portable Skill SHA-256: ${hashDirectory(portableSkill)}`);
for (const variant of variants) {
  const built = buildVariant(variant);
  console.log(
    `${variant.name} package SHA-256: ${built.hash}  ${relative(repositoryRoot, built.archivePath)}`
  );
}
