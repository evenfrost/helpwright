import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { verifyOperationalClaims } from "../scripts/verify-operational-claims.mjs";

const verifierPath = fileURLToPath(
  new URL("../scripts/verify-operational-claims.mjs", import.meta.url)
);

const rejected = [
  "I've escalated this for review.",
  "We've escalated your request.",
  "I've submitted an exception request.",
  "The exception request has been submitted."
];

const allowed = [
  "I can escalate this for review.",
  "Support may submit an exception request.",
  "I recommend escalating this.",
  "An exception review is available.",
  "I have not escalated this."
];

const violationResult = {
  valid: false,
  violations: [
    {
      action: "escalation",
      claimedState: "performed",
      actualState: "not_performed"
    }
  ]
};

for (const assistantResponse of rejected) {
  test(`rejects unsupported performed claim: ${assistantResponse}`, () => {
    assert.deepEqual(
      verifyOperationalClaims({ assistantResponse }),
      violationResult
    );
  });
}

for (const assistantResponse of allowed) {
  test(`allows non-performed claim: ${assistantResponse}`, () => {
    assert.deepEqual(verifyOperationalClaims({ assistantResponse }), {
      valid: true,
      violations: []
    });
  });
}

test("rejects a non-string assistant response", () => {
  assert.throws(
    () => verifyOperationalClaims({ assistantResponse: 42 }),
    /assistantResponse must be a string/
  );
});

test("can be imported when the host has no argv entrypoint", () => {
  const moduleUrl = new URL(
    "../scripts/verify-operational-claims.mjs",
    import.meta.url
  ).href;
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", `import(${JSON.stringify(moduleUrl)})`],
    { encoding: "utf8" }
  );

  assert.equal(result.status, 0, result.stderr);
});

test("CLI emits a JSON result for valid input", () => {
  const result = spawnSync(
    process.execPath,
    [verifierPath],
    {
      input: JSON.stringify({ assistantResponse: "I can escalate this." }),
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), {
    valid: true,
    violations: []
  });
  assert.equal(result.stderr, "");
});

test("CLI rejects malformed JSON without writing stdout", () => {
  const result = spawnSync(process.execPath, [verifierPath], {
    input: "{",
    encoding: "utf8"
  });

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Invalid verifier input/);
});
