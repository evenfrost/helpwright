import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { verifyOperationalClaims } from "../../scripts/verify-operational-claims.mjs";

export const CORRECTION_REASON =
  "The response claims that an escalation or exception request was performed, but no performed escalation is established. Revise the response without making that claim.";

export const INVALID_INPUT_REASON =
  "The operational-claim verifier could not inspect the final response. Produce a new response so verification can run again.";

export function adaptCodexStop(input) {
  if (!input || typeof input.last_assistant_message !== "string") {
    return { decision: "block", reason: INVALID_INPUT_REASON };
  }

  const result = verifyOperationalClaims({
    assistantResponse: input.last_assistant_message
  });

  return result.valid
    ? {}
    : { decision: "block", reason: CORRECTION_REASON };
}

function runCli() {
  let output;

  try {
    output = adaptCodexStop(JSON.parse(readFileSync(0, "utf8")));
  } catch {
    output = { decision: "block", reason: INVALID_INPUT_REASON };
  }

  process.stdout.write(`${JSON.stringify(output)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
