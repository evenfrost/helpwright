import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function readJson(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, root), "utf8"));
}

test("plugin manifest exposes only the Helpwright skill capability", async () => {
  const manifest = await readJson("experiments/codex-stop-hook/.codex-plugin/plugin.json");

  assert.equal(manifest.name, "helpwright");
  assert.equal(manifest.version, "0.1.0");
  assert.equal(manifest.skills, "./skills/");
  assert.deepEqual(manifest.interface.defaultPrompt, [
    "Use Helpwright to handle this support case."
  ]);
  assert.equal(Object.hasOwn(manifest, "apps"), false);
  assert.equal(Object.hasOwn(manifest, "mcpServers"), false);
});

test("plugin registers the thin adapter for every Stop event", async () => {
  const hooks = await readJson("experiments/codex-stop-hook/hooks/hooks.json");

  assert.deepEqual(hooks, {
    hooks: {
      Stop: [
        {
          hooks: [
            {
              type: "command",
              command: "node ${PLUGIN_ROOT}/experiments/codex-stop-hook/codex-stop-hook.mjs",
              statusMessage: "Verifying Helpwright operational claims"
            }
          ]
        }
      ]
    }
  });
});
