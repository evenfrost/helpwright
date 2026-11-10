import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { before, test } from "node:test";
import { fileURLToPath } from "node:url";

import { filesUnder } from "../scripts/build.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const skillRoot = join(root, "skills/helpwright");
const pluginArchive = join(root, "dist/helpwright-agent-plugin-v0.2.0.zip");
const skillArchive = join(root, "dist/helpwright-agent-skill-v0.2.0.zip");

function unzip(archive, args) {
  const [option, ...paths] = args;
  const result = spawnSync("unzip", [option, archive, ...paths], { encoding: null });
  assert.equal(result.status, 0, result.stderr.toString());
  return result.stdout;
}

function entries(archive) {
  return unzip(archive, ["-Z1"]).toString().trim().split("\n").sort();
}

function assertContained(path) {
  assert.ok(!path.startsWith("/") && !path.includes("\\"));
  assert.ok(!path.split("/").includes(".."));
  const target = resolve("/plugin-root", path);
  assert.ok(target.startsWith(`/plugin-root${sep}`));
}

before(() => {
  const result = spawnSync("pnpm", ["build"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("release packages contain only allowlisted roots and the dynamic Skill tree", () => {
  const files = filesUnder(skillRoot).sort();
  const expectedPlugin = [
    "helpwright/plugin.json",
    "helpwright/LICENSE",
    ...files.map((file) => `helpwright/skills/helpwright/${file}`)
  ].sort();
  const expectedSkill = files.map((file) => `helpwright/${file}`).sort();

  assert.deepEqual(entries(pluginArchive), expectedPlugin);
  assert.deepEqual(entries(skillArchive), expectedSkill);
  assert.ok(expectedPlugin.includes("helpwright/skills/helpwright/SKILL.md"));
  assert.ok(!expectedPlugin.includes("helpwright/mcp.json"));
  for (const archive of [pluginArchive, skillArchive]) {
    for (const path of entries(archive)) assertContained(path);
  }

  for (const file of files) {
    const source = readFileSync(join(skillRoot, file));
    assert.deepEqual(unzip(pluginArchive, ["-p", `helpwright/skills/helpwright/${file}`]), source);
    assert.deepEqual(unzip(skillArchive, ["-p", `helpwright/${file}`]), source);
  }
});

test("Skill traversal rejects symlinks but permits other experiments to contain SKILL.md", () => {
  const directory = mkdtempSync(join(tmpdir(), "helpwright-skill-test-"));
  try {
    mkdirSync(join(directory, "references"));
    writeFileSync(join(directory, "SKILL.md"), "test");
    writeFileSync(join(directory, "references", "note.md"), "test");
    assert.deepEqual(filesUnder(directory), ["SKILL.md", "references/note.md"]);
    symlinkSync("/etc/passwd", join(directory, "escape"));
    assert.throws(() => filesUnder(directory), /Symlink is not packageable/u);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("archive path guard rejects traversal and absolute paths", () => {
  for (const path of ["/outside", "helpwright/../outside", "helpwright\\outside"]) {
    assert.throws(() => assertContained(path));
  }
});
