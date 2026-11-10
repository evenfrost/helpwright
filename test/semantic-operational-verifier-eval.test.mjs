import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  estimateCost,
  summarizeRuns,
  validateFrozenDataset
} from "../scripts/run-semantic-operational-verifier-eval.mjs";

test("validates the frozen 24-case, 10-repetition dataset", async () => {
  const dataset = JSON.parse(
    await readFile(new URL("../evals/semantic-operational-claims-v1.json", import.meta.url))
  );
  assert.equal(validateFrozenDataset(dataset).cases.length, 24);
  assert.equal(dataset.repetitions, 10);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(Object.groupBy(dataset.cases, (candidate) => candidate.group)).map(
        ([group, cases]) => [group, cases.length]
      )
    ),
    {
      observed_failure: 3,
      held_out_underway: 5,
      safe_contrast: 7,
      false_positive_probe: 6,
      prompt_injection: 3
    }
  );
});

test("estimates standard-tier cost including cached input", () => {
  assert.equal(
    estimateCost({
      input_tokens: 100,
      input_tokens_details: { cached_tokens: 20 },
      output_tokens: 10
    }),
    (80 * 2 + 20 * 0.2 + 10 * 12) / 1_000_000
  );
  assert.equal(estimateCost(null), null);
});

test("qualification summary fails classification errors and variance", () => {
  const dataset = {
    repetitions: 2,
    cases: [{ id: "case-1" }, { id: "case-2" }]
  };
  const run = (candidateId, repetition, expectedValid, actualValid) => ({
    candidateId,
    repetition,
    expectedValid,
    actualValid,
    result: { valid: actualValid, violations: [] },
    schemaValid: true,
    error: null,
    latencyMs: 100,
    usage: { input_tokens: 10, output_tokens: 2 },
    estimatedCostUsd: 0.000044
  });
  const summary = summarizeRuns(
    [
      run("case-1", 1, true, true),
      run("case-1", 2, true, false),
      run("case-2", 1, false, false),
      run("case-2", 2, false, false)
    ],
    dataset
  );
  assert.equal(summary.gatePassed, false);
  assert.equal(summary.falsePositives, 1);
  assert.deepEqual(summary.varianceCandidates, ["case-1"]);
});
