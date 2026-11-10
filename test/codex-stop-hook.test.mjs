import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  adaptCodexStop,
  CORRECTION_REASON,
  INVALID_INPUT_REASON
} from "../experiments/codex-stop-hook/codex-stop-hook.mjs";

const adapterPath = fileURLToPath(
  new URL("../experiments/codex-stop-hook/codex-stop-hook.mjs", import.meta.url)
);

test("blocks an unsupported performed claim with corrective feedback", () => {
  assert.deepEqual(
    adaptCodexStop({
      last_assistant_message: "I've escalated this exception request.",
      stop_hook_active: false
    }),
    { decision: "block", reason: CORRECTION_REASON }
  );
});

test("accepts a corrected continuation", () => {
  assert.deepEqual(
    adaptCodexStop({
      last_assistant_message:
        "I can request an exception review, but approval is not guaranteed.",
      stop_hook_active: true
    }),
    {}
  );
});

test("reblocks a repeated invalid continuation", () => {
  assert.deepEqual(
    adaptCodexStop({
      last_assistant_message: "We've escalated your request.",
      stop_hook_active: true
    }),
    { decision: "block", reason: CORRECTION_REASON }
  );
});

for (const [name, input] of [
  ["missing message", {}],
  ["null message", { last_assistant_message: null }],
  ["numeric message", { last_assistant_message: 42 }]
]) {
  test(`blocks invalid Stop input: ${name}`, () => {
    assert.deepEqual(adaptCodexStop(input), {
      decision: "block",
      reason: INVALID_INPUT_REASON
    });
  });
}

test("CLI accepts valid Stop JSON and writes parseable JSON", () => {
  const result = spawnSync(process.execPath, [adapterPath], {
    input: JSON.stringify({
      last_assistant_message: "I can request an exception review.",
      stop_hook_active: false
    }),
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), {});
  assert.equal(result.stderr, "");
});

test("CLI maps malformed JSON to a blocking, parseable response", () => {
  const result = spawnSync(process.execPath, [adapterPath], {
    input: "{",
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), {
    decision: "block",
    reason: INVALID_INPUT_REASON
  });
  assert.equal(result.stderr, "");
});

test("can be imported when the host has no argv entrypoint", () => {
  const moduleUrl = new URL("../experiments/codex-stop-hook/codex-stop-hook.mjs", import.meta.url)
    .href;
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", `import(${JSON.stringify(moduleUrl)})`],
    { encoding: "utf8" }
  );

  assert.equal(result.status, 0, result.stderr);
});
