import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import {
  SEMANTIC_VERIFIER_SETTINGS,
  verifySemanticOperationalClaimsWithEvidence
} from "./experimental-semantic-operational-verifier.mjs";

const INPUT_PRICE_PER_MILLION = 2;
const CACHED_INPUT_PRICE_PER_MILLION = 0.2;
const OUTPUT_PRICE_PER_MILLION = 12;

export function validateFrozenDataset(dataset) {
  if (
    dataset?.schemaVersion !== 1 ||
    dataset?.actionStates?.checking_or_investigation !== "not_underway" ||
    Object.keys(dataset.actionStates).length !== 1 ||
    dataset.repetitions !== 10 ||
    !Array.isArray(dataset.cases) ||
    dataset.cases.length === 0
  ) {
    throw new TypeError("invalid semantic-verifier dataset contract");
  }
  const ids = new Set();
  for (const candidate of dataset.cases) {
    if (
      !candidate ||
      typeof candidate.id !== "string" ||
      ids.has(candidate.id) ||
      typeof candidate.group !== "string" ||
      typeof candidate.expectedValid !== "boolean" ||
      typeof candidate.assistantResponse !== "string"
    ) {
      throw new TypeError("invalid semantic-verifier dataset case");
    }
    ids.add(candidate.id);
  }
  return dataset;
}

export function estimateCost(usage) {
  if (
    !usage ||
    !Number.isFinite(usage.input_tokens) ||
    !Number.isFinite(usage.output_tokens)
  ) {
    return null;
  }
  const cached = usage.input_tokens_details?.cached_tokens ?? 0;
  if (!Number.isFinite(cached) || cached < 0 || cached > usage.input_tokens) {
    return null;
  }
  return (
    ((usage.input_tokens - cached) * INPUT_PRICE_PER_MILLION +
      cached * CACHED_INPUT_PRICE_PER_MILLION +
      usage.output_tokens * OUTPUT_PRICE_PER_MILLION) /
    1_000_000
  );
}

export function percentile(values, fraction) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * fraction) - 1];
}

export function summarizeRuns(runs, dataset) {
  const completed = runs.filter((run) => !run.error);
  const falsePositives = completed.filter(
    (run) => run.expectedValid && run.actualValid === false
  );
  const falseNegatives = completed.filter(
    (run) => !run.expectedValid && run.actualValid === true
  );
  const failedRuns = runs.filter(
    (run) =>
      run.error ||
      !run.schemaValid ||
      run.actualValid !== run.expectedValid ||
      run.estimatedCostUsd === null
  );
  const varianceCandidates = dataset.cases.filter((candidate) => {
    const classifications = new Set(
      completed
        .filter((run) => run.candidateId === candidate.id)
        .map((run) => run.actualValid)
    );
    return classifications.size > 1;
  });
  const latencies = completed.map((run) => run.latencyMs);
  const totalUsage = completed.reduce(
    (sum, run) => ({
      inputTokens: sum.inputTokens + (run.usage?.input_tokens ?? 0),
      cachedInputTokens:
        sum.cachedInputTokens +
        (run.usage?.input_tokens_details?.cached_tokens ?? 0),
      outputTokens: sum.outputTokens + (run.usage?.output_tokens ?? 0),
      estimatedCostUsd: sum.estimatedCostUsd + (run.estimatedCostUsd ?? 0)
    }),
    { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, estimatedCostUsd: 0 }
  );
  const groupResults = Object.fromEntries(
    [...new Set(dataset.cases.map((candidate) => candidate.group))].map(
      (group) => {
        const groupRuns = runs.filter((run) => run.group === group);
        const passed = groupRuns.filter(
          (run) =>
            !run.error &&
            run.schemaValid &&
            run.actualValid === run.expectedValid &&
            run.estimatedCostUsd !== null
        ).length;
        return [group, { passed, total: groupRuns.length }];
      }
    )
  );

  return {
    totalRuns: runs.length,
    expectedRuns: dataset.cases.length * dataset.repetitions,
    passedRuns: runs.length - failedRuns.length,
    failedRuns: failedRuns.length,
    falsePositives: falsePositives.length,
    falseNegatives: falseNegatives.length,
    varianceCandidates: varianceCandidates.map((candidate) => candidate.id),
    structuredOrTransportFailures: runs.filter((run) => run.error).length,
    p50LatencyMs: percentile(latencies, 0.5),
    p95LatencyMs: percentile(latencies, 0.95),
    groupResults,
    totalUsage,
    gatePassed:
      runs.length === dataset.cases.length * dataset.repetitions &&
      failedRuns.length === 0 &&
      varianceCandidates.length === 0 &&
      percentile(latencies, 0.95) < 5_000
  };
}

function reportMarkdown({ startedAt, datasetHash, dataset, summary, logPath }) {
  return `# Offline semantic verifier evaluation

- Started: ${startedAt}
- Dataset SHA-256: \`${datasetHash}\`
- Model: \`${SEMANTIC_VERIFIER_SETTINGS.model}\`
- Settings: \`${JSON.stringify(SEMANTIC_VERIFIER_SETTINGS)}\`
- Candidates: ${dataset.cases.length}
- Repetitions per candidate: ${dataset.repetitions}
- Evidence log: \`${logPath}\`
- Gate: **${summary.gatePassed ? "PASS" : "FAIL"}**

## Results

- Runs: ${summary.passedRuns}/${summary.totalRuns} passed (${summary.expectedRuns} expected)
- False positives: ${summary.falsePositives}
- False negatives: ${summary.falseNegatives}
- Candidates with classification variance: ${summary.varianceCandidates.length}
- Structured-output or transport failures: ${summary.structuredOrTransportFailures}
- Prompt-injection probes: ${summary.groupResults.prompt_injection.passed}/${summary.groupResults.prompt_injection.total} passed
- p50 latency: ${summary.p50LatencyMs ?? "n/a"} ms
- p95 latency: ${summary.p95LatencyMs ?? "n/a"} ms
- Input tokens: ${summary.totalUsage.inputTokens}
- Cached input tokens: ${summary.totalUsage.cachedInputTokens}
- Output tokens: ${summary.totalUsage.outputTokens}
- Estimated standard-tier cost: $${summary.totalUsage.estimatedCostUsd.toFixed(6)}
`;
}

export async function runEvaluation({
  datasetPath = new URL("../evals/semantic-operational-claims-v1.json", import.meta.url),
  resultsDirectory = new URL("../evals/results/", import.meta.url),
  verify = verifySemanticOperationalClaimsWithEvidence,
  now = () => new Date()
} = {}) {
  if (
    !process.env.OPENAI_API_KEY &&
    verify === verifySemanticOperationalClaimsWithEvidence
  ) {
    throw new Error("OPENAI_API_KEY is required to run the frozen evaluation");
  }
  const datasetBytes = await readFile(datasetPath);
  const dataset = validateFrozenDataset(JSON.parse(datasetBytes));
  const datasetHash = createHash("sha256").update(datasetBytes).digest("hex");
  const startedAt = now().toISOString();
  const session = startedAt.replaceAll(/[-:.]/g, "");
  const logName = `semantic-operational-verifier-${session}.jsonl`;
  const reportName = `semantic-operational-verifier-${session}.md`;
  const runs = [];

  for (const candidate of dataset.cases) {
    for (let repetition = 1; repetition <= dataset.repetitions; repetition += 1) {
      const start = performance.now();
      const base = {
        candidateId: candidate.id,
        group: candidate.group,
        repetition,
        expectedValid: candidate.expectedValid,
        model: SEMANTIC_VERIFIER_SETTINGS.model,
        settings: SEMANTIC_VERIFIER_SETTINGS
      };
      try {
        const result = await verify({
          schemaVersion: dataset.schemaVersion,
          assistantResponse: candidate.assistantResponse,
          actionStates: dataset.actionStates
        });
        runs.push({
          ...base,
          actualValid: result.valid,
          result: { valid: result.valid, violations: result.violations },
          schemaValid: true,
          error: null,
          refusal: null,
          latencyMs: Math.round(performance.now() - start),
          usage: result.usage,
          estimatedCostUsd: estimateCost(result.usage),
          responseId: result.responseId,
          responseModel: result.responseModel
        });
      } catch (error) {
        runs.push({
          ...base,
          actualValid: null,
          result: null,
          schemaValid: false,
          error: { code: error.code || "unknown", message: error.message },
          refusal: error.code === "refusal" ? error.message : null,
          latencyMs: Math.round(performance.now() - start),
          usage: null,
          estimatedCostUsd: null,
          responseId: null,
          responseModel: null
        });
      }
    }
  }

  const summary = summarizeRuns(runs, dataset);
  await mkdir(resultsDirectory, { recursive: true });
  const logPath = new URL(logName, resultsDirectory);
  const reportPath = new URL(reportName, resultsDirectory);
  await writeFile(logPath, `${runs.map((run) => JSON.stringify(run)).join("\n")}\n`);
  await writeFile(
    reportPath,
    reportMarkdown({ startedAt, datasetHash, dataset, summary, logPath: logName })
  );
  return { summary, logPath, reportPath };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runEvaluation()
    .then(({ summary, reportPath }) => {
      process.stdout.write(`${JSON.stringify({ summary, reportPath: reportPath.pathname }, null, 2)}\n`);
      process.exitCode = summary.gatePassed ? 0 : 1;
    })
    .catch((error) => {
      process.stderr.write(`Semantic verifier evaluation failed: ${error.message}\n`);
      process.exitCode = 1;
    });
}
