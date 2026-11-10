import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { before, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  adaptHook,
  createObservation,
  handleMcpRequest
} from "../experiments/claude-plugin/probes/scripts/runtime-probe.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const probePath = fileURLToPath(
  new URL(
    "../experiments/claude-plugin/probes/scripts/runtime-probe.mjs",
    import.meta.url
  )
);
const coreArchive = "dist/helpwright-claude-plugin-core-v0.0.1.zip";
const probesArchive = "dist/helpwright-claude-plugin-probes-v0.0.1.zip";

before(async () => {
  await import("../experiments/claude-plugin/build.mjs");
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(new URL(`../${relativePath}`, import.meta.url)));
}

function archiveFiles(archive) {
  const result = spawnSync("unzip", ["-Z1", archive], {
    cwd: root,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout
    .trim()
    .split("\n")
    .filter((path) => path && !path.endsWith("/"))
    .sort();
}

function archiveFile(archive, path) {
  const result = spawnSync("unzip", ["-p", archive, path], {
    cwd: root,
    encoding: null
  });

  assert.equal(result.status, 0, result.stderr?.toString() || "unzip failed");
  return result.stdout;
}

test("shared manifest is minimal and uses default component discovery", () => {
  const manifest = readJson(
    "experiments/claude-plugin/plugin/.claude-plugin/plugin.json"
  );

  assert.deepEqual(manifest, {
    name: "helpwright",
    displayName: "Helpwright (Compatibility Experiment)",
    version: "0.0.1",
    description:
      "Experimental Claude plugin packaging for the portable Helpwright customer-support Skill.",
    author: { name: "Aliaksei Kislou" },
    license: "MIT"
  });
  assert.equal(Object.hasOwn(manifest, "skills"), false);
  assert.equal(Object.hasOwn(manifest, "hooks"), false);
  assert.equal(Object.hasOwn(manifest, "mcpServers"), false);
});

test("core package contains only the manifest, licenses, and portable Skill", () => {
  assert.deepEqual(archiveFiles(coreArchive), [
    "helpwright/.claude-plugin/plugin.json",
    "helpwright/LICENSE",
    "helpwright/skills/helpwright/LICENSE",
    "helpwright/skills/helpwright/SKILL.md"
  ]);
});

test("probe package is the core package plus the isolated probe overlay", () => {
  const coreFiles = archiveFiles(coreArchive);
  const probeFiles = archiveFiles(probesArchive);

  assert.deepEqual(probeFiles, [
    ...coreFiles,
    "helpwright/.mcp.json",
    "helpwright/hooks/hooks.json",
    "helpwright/scripts/runtime-probe.mjs",
    "helpwright/skills/compatibility-probe/SKILL.md"
  ].sort());
});

for (const archive of [coreArchive, probesArchive]) {
  test(`${archive} contains a byte-identical portable Skill`, () => {
    for (const name of ["SKILL.md", "LICENSE"]) {
      const source = readFileSync(`skills/helpwright/${name}`);
      const packaged = archiveFile(
        archive,
        `helpwright/skills/helpwright/${name}`
      );
      assert.deepEqual(packaged, source);
    }
  });
}

test("compatibility Skill is explicit-only and points at the bundled probe", () => {
  const skill = readFileSync(
    "experiments/claude-plugin/probes/skills/compatibility-probe/SKILL.md",
    "utf8"
  );

  assert.match(skill, /^name: compatibility-probe$/mu);
  assert.match(skill, /^disable-model-invocation: true$/mu);
  assert.match(
    skill,
    /node "\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/runtime-probe\.mjs" command/u
  );
  assert.doesNotMatch(skill, /^allowed-tools:/mu);
});

test("hook and MCP declarations reference only the bundled probe", () => {
  const hooks = readJson(
    "experiments/claude-plugin/probes/hooks/hooks.json"
  );
  const mcp = readJson("experiments/claude-plugin/probes/.mcp.json");

  assert.deepEqual(hooks, {
    hooks: {
      PostToolUse: [
        {
          matcher: "Bash",
          hooks: [
            {
              type: "command",
              command:
                'node "${CLAUDE_PLUGIN_ROOT}/scripts/runtime-probe.mjs" hook',
              timeout: 10
            }
          ]
        }
      ]
    }
  });
  assert.deepEqual(mcp, {
    mcpServers: {
      "helpwright-compatibility-probe": {
        command: "node",
        args: ["${CLAUDE_PLUGIN_ROOT}/scripts/runtime-probe.mjs", "mcp"]
      }
    }
  });
});

test("runtime probe imports only local runtime primitives", () => {
  const source = readFileSync(probePath, "utf8");
  const imports = [...source.matchAll(/from "([^"]+)"/gu)].map(
    (match) => match[1]
  );

  assert.deepEqual(imports, ["node:crypto", "node:readline", "node:url"]);
  assert.doesNotMatch(source, /\bfetch\s*\(/u);
  assert.doesNotMatch(source, /\bprocess\.env\b/u);
  assert.doesNotMatch(source, /node:(?:fs|http|https|net|tls|child_process)/u);
});

test("command probe returns fresh local runtime metadata", () => {
  const firstValue = createObservation("script");
  const secondValue = createObservation("script");
  assert.equal(firstValue.probe, "helpwright-script");
  assert.equal(firstValue.node, process.version);
  assert.match(firstValue.nonce, /^[a-f0-9-]{36}$/u);
  assert.ok(Number.isFinite(Date.parse(firstValue.timestamp)));
  assert.notEqual(firstValue.nonce, secondValue.nonce);
});

test("hook probe ignores unrelated shell calls", () => {
  assert.deepEqual(
    adaptHook({ tool_input: { command: "node app.mjs" } }),
    {}
  );
});

test("hook probe reports only the explicit command probe", () => {
  const output = adaptHook({
    tool_input: {
      command: 'node "/plugin/scripts/runtime-probe.mjs" command'
    }
  });

  const observation = JSON.parse(output.systemMessage);
  assert.equal(output.continue, true);
  assert.equal(output.suppressOutput, false);
  assert.equal(observation.probe, "helpwright-hook");
  assert.match(observation.nonce, /^[a-f0-9-]{36}$/u);
});

test("MCP probe initializes and exposes exactly one inert tool", () => {
  const responses = [
    handleMcpRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-06-18", capabilities: {} }
    }),
    handleMcpRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {}
    }),
    handleMcpRequest({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "helpwright_compatibility_probe", arguments: {} }
    })
  ];

  assert.deepEqual(
    responses.map((response) => response.id),
    [1, 2, 3]
  );
  assert.equal(responses[0].result.serverInfo.version, "0.0.1");
  assert.deepEqual(
    responses[1].result.tools.map((tool) => tool.name),
    ["helpwright_compatibility_probe"]
  );
  assert.equal(
    responses[2].result.structuredContent.probe,
    "helpwright-mcp"
  );
  assert.equal(responses[2].result.isError, false);
});

test("release build command remains separate from the Claude experiment", () => {
  const packageManifest = readJson("package.json");
  assert.equal(packageManifest.scripts.build, "node scripts/build.mjs");
});
