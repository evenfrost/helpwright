// Local Codex CLI isolation for comparative evals. No inference or external service.
import { mkdir, readFile, writeFile, rm, realpath } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { homedir } from "node:os";
import { createServer } from "node:net";
import { verifyInstall, codexArgs } from "./run-codex-behavioral-evals.mjs";
import { filesUnder } from "./build.mjs";

const quote = JSON.stringify;
const assert = (ok, message) => { if (!ok) throw new Error(message); };

export async function verifySkillsOnlyPlugin(path) {
  const files = filesUnder(path);
  assert(files.every(f => f === "LICENSE" || f === "plugin.json" || f.startsWith("skills/helpwright/")), "Unexpected plugin runtime contents");
  const manifest = JSON.parse(await readFile(join(path,"plugin.json"),"utf8"));
  assert(!manifest.extensions && !manifest.mcpServers && !manifest.mcp, "Plugin runtime configuration is not permitted");
}

export function discoveryInventory(items) {
  assert(Array.isArray(items), "Invalid native prompt-input response");
  const text = items.flatMap(i => (i.content ?? []).map(c => c.text ?? "")).join("\n");
  assert(!/<INSTRUCTIONS>|<user_instructions>|<memory>/i.test(text), "Inherited instructions in startup context");
  const roots = new Map([...text.matchAll(/- `([^`]+)` = `([^`]+)`/g)].map(m => [m[1], m[2]]));
  const inventory = [];
  for (const block of text.matchAll(/### Available skills\n([\s\S]*?)(?=<\/skills_instructions>|$)/g)) {
    for (const line of block[1].split("\n").filter(l => l.startsWith("- "))) {
      const entry = line.match(/^- (.+?): .*\(file: (.+)\)$/);
      assert(entry, "Unrecognized Skill catalog entry");
      let path = entry[2];
      const alias = path.split("/")[0];
      if (roots.has(alias)) path = join(roots.get(alias), path.slice(alias.length + 1));
      assert(path.startsWith("/"), "Unresolved Skill catalog path");
      inventory.push({ name: entry[1], path });
    }
  }
  assert(!/Deferred tool namespaces:/.test(text), "External tools in startup context");
  return inventory;
}

export function isolatedConfig({ cwd, skillRoot, runtimeRoot, codexRuntimeRoot = runtimeRoot, disabledSkills = [], model, effort, judge = false }) {
  return `model = ${quote(model)}
model_provider = "openai"
model_reasoning_effort = ${quote(effort)}
approval_policy = "never"
default_permissions = "helpwright-eval"
project_doc_max_bytes = 0
web_search = "disabled"
cli_auth_credentials_store = "file"
[analytics]
enabled = false
[feedback]
enabled = false
[memories]
use_memories = false
generate_memories = false
[features]
apps = false
plugins = ${!judge}
hooks = false
standalone_web_search = false
web_search_request = false
multi_agent = false
[shell_environment_policy]
inherit = "none"
experimental_use_profile = false
[shell_environment_policy.set]
PATH = "/usr/bin:/bin"
[permissions.helpwright-eval.filesystem]
":root" = "deny"
":minimal" = "read"
${[...new Set([cwd,skillRoot,runtimeRoot,codexRuntimeRoot])].map(path=>`${quote(path)} = "read"`).join("\n")}
[permissions.helpwright-eval.network]
enabled = false
${disabledSkills.map(path => `\n[[skills.config]]\npath = ${quote(path)}\nenabled = false`).join("\n")}
`;
}

export function comparisonArgs(schema, sessionId) {
  const base = codexArgs("candidate").slice(1);
  const args = [];
  for (let i = 0; i < base.length; i++) {
    if (base[i] === "-c" && base[i + 1] === 'sandbox_mode="read-only"') { i++; continue; }
    args.push(base[i]);
  }
  return ["exec", ...(sessionId ? ["resume"] : []), ...args, "--disable", "hooks", ...(schema ? ["--output-schema", schema] : []), ...(sessionId ? [sessionId] : []), "-"];
}

export async function createEnvironment({ dir, candidate, judge = false, model, effort, repoRoot, executable, invoke, authSource }) {
  // A fresh user config cannot erase system-managed MCP/hooks/provider injection. Refuse
  // unverified system layers rather than assuming apps=false disables every tool source.
  for (const path of ["/etc/codex/config.toml", "/etc/codex/requirements.toml"]) {
    const bytes = await readFile(path, "utf8").catch(error => { if (error.code === "ENOENT") return ""; throw error; });
    assert(!bytes.split("\n").some(line => line.trim() && !line.trim().startsWith("#")), `System configuration requires isolation validation: ${path}`);
  }
  const cwd = join(dir, "work");
  const home = join(dir, "codex");
  const skillRoot = join(home, "plugins/cache");
  await Promise.all([mkdir(cwd, { recursive: true }), mkdir(skillRoot, { recursive: true })]);
  // Deliberately do not inherit HOME, provider overrides, proxy credentials or shell startup settings.
  const env = { PATH: process.env.PATH ?? "/usr/bin:/bin", CODEX_HOME: home };
  const runtimeRoot = dirname(dirname(await realpath(process.execPath)));
  let executablePath;
  for(const path of executable.includes("/")?[executable]:env.PATH.split(":").map(dir=>join(dir,executable))) {
    executablePath=await realpath(path).catch(()=>null);if(executablePath)break;
  }
  const codexRuntimeRoot=dirname(dirname(executablePath ?? `/usr/bin/${executable}`));
  assert(runtimeRoot !== "/" && codexRuntimeRoot !== "/", "Cannot isolate this runtime installation");
  const config = { cwd, skillRoot, runtimeRoot, codexRuntimeRoot, model, effort, judge, disabledSkills: [] };
  const configPath = join(home, "config.toml");
  await writeFile(configPath, isolatedConfig(config));
  const run = async (args, input = "") => {
    const r = await invoke(executable, args, { cwd, env, input, timeoutMs: 30000 });
    assert(r.code === 0 && !r.timedOut, `Environment setup failed (${args.slice(0, 3).join(" ")}): ${r.stderr?.slice(-1200)}`);
    return r;
  };
  let install = null;
  if (candidate) {
    await verifySkillsOnlyPlugin(join(repoRoot,"plugins/helpwright"));
    await run(["plugin", "marketplace", "add", repoRoot, "--json"]);
    await run(["plugin", "add", "helpwright@helpwright-local", "--json"]);
    const list = JSON.parse((await run(["plugin", "list", "--json"])).stdout);
    assert(list.installed?.filter(p => p.installed && p.enabled).length === 1, "Unexpected enabled candidate plugins");
    install = await verifyInstall(repoRoot, list, home);
    await verifySkillsOnlyPlugin(install.cache);
  } else {
    const list = JSON.parse((await run(["plugin", "list", "--json"])).stdout);
    assert(!(list.installed ?? []).some(p => p.installed), "Baseline/judge has installed plugins");
  }
  const inspect = async () => discoveryInventory(JSON.parse((await run(["debug", "prompt-input", "Helpwright evaluation preflight"])).stdout));
  const initial = await inspect();
  const expected = install ? join(install.cache, "skills/helpwright/SKILL.md") : null;
  config.disabledSkills = initial.filter(s => s.path !== expected).map(s => s.path);
  // Native plugin installation writes its registration into config.toml. Preserve that registration,
  // while resetting every execution setting to our explicit configuration.
  const installedConfig = await readFile(configPath, "utf8");
  const registration = installedConfig.match(/\[plugins\.[^\n]+\][\s\S]*?(?=\n\[|$)/g) ?? [];
  await writeFile(configPath, isolatedConfig(config) + "\n" + registration.join("\n"));
  const inventory = await inspect();
  assert(inventory.length === (candidate ? 1 : 0) && (!candidate || inventory[0].path === expected), "Skill discovery is not isolated");
  // Copy credentials only after non-generating setup; never serialize their bytes or permit tools to read them.
  const sourceHome = authSource ?? process.env.CODEX_HOME ?? join(homedir(), ".codex");
  try { await writeFile(join(home, "auth.json"), await readFile(join(sourceHome, "auth.json")), { mode: 0o600 }); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  if (process.env.OPENAI_API_KEY) env.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  await writeFile(join(cwd, "allowed.txt"), "helpwright-isolation-sentinel");
  const startup = JSON.parse((await run(["debug", "prompt-input", "Helpwright evaluation preflight"])).stdout);
  return { dir, cwd, home, skillRoot, env, config, inventory, install, skillPath: expected, startup, startupBytes: Buffer.byteLength(JSON.stringify(startup)), run };
}

export async function probeEnvironment(environment, { executable, invoke, deniedPaths }) {
  const { cwd, env, skillPath } = environment;
  const server = createServer(socket => socket.destroy());
  await new Promise((done, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", done); });
  try {
    const probe = `
const fs = require('node:fs'), net = require('node:net');
if(fs.readFileSync(${quote(join(cwd, "allowed.txt"))},'utf8') !== 'helpwright-isolation-sentinel') process.exit(10);
${skillPath ? `if(!fs.readFileSync(${quote(skillPath)},'utf8').includes('name: helpwright'))process.exit(11);` : ""}
for(const path of ${JSON.stringify(deniedPaths)}) {
  try { const fd=fs.openSync(path,'r'); fs.closeSync(fd); console.error('Unexpected readable path: '+path);process.exit(12); } catch(e) { if(!['EACCES','EPERM','ENOENT'].includes(e.code))process.exit(13); }
}
try { fs.writeFileSync(${quote(join(cwd, "forbidden-write"))},'sentinel'); process.exit(14); } catch(e) { if(!['EACCES','EPERM','EROFS'].includes(e.code))process.exit(15); }
const sock=net.connect({host:'127.0.0.1',port:${server.address().port}});
const deadline=setTimeout(()=>{console.error('Network probe timed out');process.exit(18);},1500);
sock.on('connect',()=>process.exit(16));
sock.on('error',e=>{clearTimeout(deadline);if(!['EPERM','EACCES'].includes(e.code)){console.error('Unexpected network error: '+e.code);process.exit(17);}fs.writeSync(1,'ISOLATION_PASS\\n');});
`;
    const result = await invoke(executable, ["sandbox", "-P", "helpwright-eval", "-C", cwd, "--", process.execPath, "-e", probe], { cwd, env, timeoutMs: 10000 });
    assert(result.code === 0 && !result.timedOut && result.stdout.trim() === "ISOLATION_PASS", `Native isolation probe failed (exit ${result.code}): ${result.stderr?.slice(-1500) || result.stdout}`);
    return { passed: true, deniedPaths, readOnly: true, toolNetworkDisabled: true, stdout: result.stdout, stderr: result.stderr };
  } finally { await new Promise(done => server.close(done)); }
}

export function activationEvidence(events, skillPath) {
  if (!skillPath) return { status: "unverified", receipts: [] };
  const escaped = skillPath.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const read = new RegExp(`^(?:/(?:usr/bin|bin)/)?cat (?:-- )?(?:${escaped}|"${escaped}"|'${escaped}')$`);
  const receipts = events.filter(e => {
    const item=e.item;
    const raw=item?.command?.trim() ?? "";
    const cmd=raw.match(/^\/(?:usr\/bin|bin)\/(?:bash|sh|zsh) -l?c (['"])([\s\S]*)\1$/)?.[2] ?? raw;
    return e.type==="item.completed" && item?.type==="command_execution" && item.exit_code===0 &&
      item.status==="completed" && read.test(cmd) && /name: helpwright/.test(item.aggregated_output ?? "");
  });
  return { status: receipts.length ? "observed" : "unverified", receipts: receipts.map(e => e.item.id) };
}

export function auditTrace(events, environment, { repoRoot, tempRoot, model }) {
  const violations = [];
  for (const e of events) {
    const item = e.item;
    if (typeof e.model === "string" && e.model !== model) violations.push("Runtime model mismatch");
    if (!item) continue;
    if (/mcp|web_search|collab|browser|computer/.test(item.type ?? "")) violations.push(`Unexpected tool: ${item.type}`);
    if (item.type !== "command_execution") continue;
    const cmd = item.command ?? "";
    const inner = cmd.match(/^\/(?:usr\/bin|bin)\/(?:bash|sh|zsh) -l?c (['"])([\s\S]*)\1$/)?.[2] ?? cmd;
    // Globs on rg --files and pwd expose metadata, never file contents. Every
    // operation in an accepted sequence must match; paths and shell expansion do not.
    const metadata = /(?:pwd|rg\s+--files(?:\s+(?:-g|--glob)\s+(?:'[^'\r\n]*'|"[^"$`\\\r\n]*"|[^\s'"$`;&|<>\\()]+))*)/.source;
    const metadataOnly = new RegExp(`^${metadata}(?:\\s*(?:;|&&|\\n)\\s*${metadata})*$`).test(inner.trim());
    if ((!metadataOnly && /memories\/|MEMORY\.md|AGENTS\.md/.test(cmd)) || /codex exec|codex app-server/.test(cmd)) violations.push("Forbidden context or nested agent invocation");
    if (cmd.includes(repoRoot)) violations.push("Repository access attempted");
    for (const path of cmd.match(/\/[\w./@-]+/g) ?? []) {
      const resolved = resolve(path);
      if (resolved.startsWith(tempRoot + "/") && !resolved.startsWith(environment.cwd + "/") && !resolved.startsWith(environment.skillRoot + "/")) violations.push("Cross-environment access attempted");
    }
  }
  assert(!violations.length, `Contaminated process: ${[...new Set(violations)].join("; ")}`);
}

export async function removeEnvironment(environment) {
  await rm(environment.dir, { recursive: true, force: true });
}
