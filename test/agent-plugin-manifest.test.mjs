import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateAgentPlugin } from "../scripts/validate-agent-plugin.mjs";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("plugin.json", root), "utf8"));
const packageManifest = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
const schema = JSON.parse(
  readFileSync(new URL("schemas/agent-plugins/1.0.0/plugin.schema.json", root), "utf8")
);

test("pinned official 1.0 schema validates the release manifest", () => {
  assert.equal(schema.$id, "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json");
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.doesNotThrow(() => validateAgentPlugin(manifest));
  assert.equal(manifest.version, packageManifest.version);
  assert.equal(manifest.version, "0.2.0");
  assert.equal(Object.hasOwn(manifest, "extensions"), false);
});

for (const [name, edit] of [
  ["missing schema", (value) => delete value.$schema],
  ["wrong schema", (value) => { value.$schema = "https://example.com/schema"; }],
  ["invalid name", (value) => { value.name = "Help--wright"; }],
  ["unknown field", (value) => { value.hooks = "./hooks/hooks.json"; }],
  ["wrong author type", (value) => { value.author.name = 42; }]
]) {
  test(`rejects ${name} with readable validation errors`, () => {
    const value = structuredClone(manifest);
    edit(value);
    assert.throws(() => validateAgentPlugin(value), /Invalid Agent Plugins 1\.0 plugin\.json:\n  \/.* /u);
  });
}
