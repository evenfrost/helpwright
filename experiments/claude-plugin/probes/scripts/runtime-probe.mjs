import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const PROBE_TOOL = "helpwright_compatibility_probe";

export function createObservation(kind) {
  return {
    probe: `helpwright-${kind}`,
    nonce: randomUUID(),
    timestamp: new Date().toISOString(),
    node: process.version
  };
}

async function readStdin() {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  return input;
}

async function runHook() {
  let event;
  try {
    event = JSON.parse(await readStdin());
  } catch {
    process.stdout.write("{}\n");
    return;
  }

  process.stdout.write(`${JSON.stringify(adaptHook(event))}\n`);
}

export function adaptHook(event) {
  const command = event?.tool_input?.command;
  if (
    typeof command !== "string" ||
    !command.includes("runtime-probe.mjs") ||
    !/(?:^|\s)command(?:\s|$)/u.test(command)
  ) {
    return {};
  }

  return {
    continue: true,
    suppressOutput: false,
    systemMessage: JSON.stringify(createObservation("hook"))
  };
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function error(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

export function handleMcpRequest(request) {
  if (request.method === "notifications/initialized") return undefined;

  if (request.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        protocolVersion: request.params?.protocolVersion ?? "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: {
          name: "helpwright-compatibility-probe",
          version: "0.0.1"
        }
      }
    };
  }

  if (request.method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        tools: [
          {
            name: PROBE_TOOL,
            description:
              "Return inert local runtime metadata for the Helpwright Claude compatibility experiment.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false
            },
            annotations: {
              readOnlyHint: true,
              destructiveHint: false,
              idempotentHint: false,
              openWorldHint: false
            }
          }
        ]
      }
    };
  }

  if (request.method === "tools/call") {
    if (request.params?.name !== PROBE_TOOL) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32602, message: "Unknown tool" }
      };
    }

    const value = createObservation("mcp");
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        content: [{ type: "text", text: JSON.stringify(value) }],
        structuredContent: value,
        isError: false
      }
    };
  }

  if (request.id === undefined) return undefined;
  return {
    jsonrpc: "2.0",
    id: request.id,
    error: { code: -32601, message: "Method not found" }
  };
}

async function runMcp() {
  const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });

  for await (const line of lines) {
    if (!line.trim()) continue;

    let request;
    try {
      request = JSON.parse(line);
    } catch {
      error(null, -32700, "Parse error");
      continue;
    }

    const response = handleMcpRequest(request);
    if (response) send(response);
  }
}

async function main(mode) {
  if (mode === "command") {
    process.stdout.write(`${JSON.stringify(createObservation("script"))}\n`);
  } else if (mode === "hook") {
    await runHook();
  } else if (mode === "mcp") {
    await runMcp();
  } else {
    process.stderr.write("Usage: runtime-probe.mjs <command|hook|mcp>\n");
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main(process.argv[2]);
}
