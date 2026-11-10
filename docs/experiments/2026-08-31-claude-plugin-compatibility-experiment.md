# Claude Plugin Compatibility Experiment

> Status: isolated, proprietary Claude-format compatibility experiment; not Helpwright's canonical Agent Plugins 1.0 distribution. `npm run build` now creates the v0.2 Agent Plugin and standalone Skill artifacts, while this experiment uses its own builder and `0.0.1` protocol version. Its core and probe ZIPs are not release artifacts, and no Claude Agent Plugins 1.0 support is implied.

## Question and boundary

This experiment asks:

> Can Helpwright be distributed as one Claude plugin that a non-technical
> support agent can upload and use in normal Claude Chat, while stronger
> capabilities remain optional on surfaces that support them?

The experiment is isolated from both release distributions. It does not
change `skills/helpwright/`, `npm run build`, the Codex Stop POC, or the paused
semantic-verifier POC. It adds no production enforcement, real integration,
backend, credential, telemetry, or network call.

Anthropic documents plugin Skills under the plugin-root `skills/` directory,
plugin invocation names such as `/plugin-name:skill-name`, `hooks/hooks.json`,
root `.mcp.json`, and `${CLAUDE_PLUGIN_ROOT}` for bundled paths:

- <https://code.claude.com/docs/en/plugins-reference>
- <https://support.claude.com/en/articles/13837440-use-plugins-in-claude>

Current Anthropic documentation conflicts about Free-plan availability. Direct
Free-tier observations are therefore recorded as dated product evidence rather
than generalized from documentation.

## Experimental controls

Build both artifacts once:

```sh
node experiments/claude-plugin/build.mjs
```

The builder prints the portable Skill content hash and each package SHA-256.
Reuse those exact files across every surface; do not rebuild between runs.

### Core control

`dist/helpwright-claude-plugin-core-v0.0.1.zip` contains only:

```text
helpwright/
├── .claude-plugin/plugin.json
├── LICENSE
└── skills/helpwright/
    ├── SKILL.md
    └── LICENSE
```

The packaged Helpwright directory is copied byte-for-byte from
`skills/helpwright/`. This artifact answers the minimum distribution question
without runtime components.

### Probe-enhanced candidate

`dist/helpwright-claude-plugin-probes-v0.0.1.zip` starts from a fresh core
staging copy and adds:

```text
helpwright/
├── .mcp.json
├── hooks/hooks.json
├── scripts/runtime-probe.mjs
└── skills/compatibility-probe/SKILL.md
```

This is the candidate single progressively enhanced package. The core archive
is an experimental control, not a proposed second production distribution.

The compatibility Skill is manual-only. Its Node script has no npm
dependencies but does require a compatible Node runtime. It makes no network
call, reads no credential, writes no file, and represents no customer or
support-system state. Its modes are:

- `command`: return a fresh nonce, timestamp, and Node version;
- `hook`: return a distinct observation only after the explicit command probe;
- `mcp`: expose one inert, read-only `helpwright_compatibility_probe` tool.

## Result taxonomy

Classify every run as exactly one of:

- **pass:** authoritative observable behavior matches the test;
- **unsupported-by-surface:** the UI explicitly omits or disables it;
- **runtime-unavailable:** the component loads but its required local runtime
  is unavailable;
- **configuration-error:** the host rejects or fails a manifest, path,
  protocol, or configuration;
- **behavioral-failure:** the Skill runs but violates the fixture rubric;
- **indeterminate:** evidence cannot distinguish execution from generated text
  or another cause;
- **blocked:** the account, plan, client, or surface was unavailable.

A script marker in assistant prose is not execution evidence. Script, hook, and
MCP tests pass only when the host exposes an authoritative tool, hook, or
connector trace.

## Required core tests

Remove every existing Helpwright plugin before C1. Run each activation or
behavior test in a fresh conversation with synthetic content and no additional
integrations or instructions.

| ID | Setup and user action | Expected observable behavior | Pass, failure, or unsupported boundary | Evidence |
|---|---|---|---|---|
| C1 — Core upload | Upload the core ZIP through Customize → Plugins. | Installation completes without CLI, API key, connector login, or runtime setup. | `pass` on installation; `unsupported-by-surface` if custom upload is absent; `configuration-error` on package rejection. | Package hash, plan/client/surface, screenshots, exact error. |
| C2 — Skill appears | Open the installed plugin and its Skill list. | Exactly the unchanged Helpwright Skill appears and can be enabled. | `pass` if present; otherwise `configuration-error`. | Component screenshots and displayed metadata. |
| C3 — Explicit activation | Run A2 from `evals/cases.md`. | Helpwright activates and correctly applies Review mode. | `pass`, `behavioral-failure`, or `indeterminate` if the host exposes no activation signal. | Exact prompt/output and activation indicator. |
| C4 — Automatic activation | Run A1 and A3 in separate fresh chats without naming Helpwright. | A1 activates and A3 does not. | `pass` only when both hold; otherwise `behavioral-failure` or `indeterminate`. | Both transcripts and Skill-use indicators. |
| C5 — Direct invocation | Type `/`, search for Helpwright, record the exact label, and invoke it with B1. | Claude Code's canonical plugin form is `/helpwright:helpwright`; Chat may render another label. Invocation maps to Default. | `pass` for a working rendered equivalent; `unsupported-by-surface` if none exists. | Menu screenshot, exact label, transcript. |
| C6 — Support behavior | Run B1 with “Use Helpwright to handle this support case.” | The result passes B1 without CLI, integrations, tools, or unsupported operational claims. | `pass` or `behavioral-failure`. | Full transcript and rubric notes. |

C1–C6 are the primary experiment. A complete pass on tested Claude Free Chat
establishes the minimum distribution result for that dated surface.

## Probe-enhanced tests

After C1–C6:

1. remove the core plugin;
2. verify that Helpwright is absent from Customize and the `/` menu;
3. upload the already-built probe ZIP;
4. run E1 before invoking a probe.

| ID | Setup and user action | Expected observable behavior | Pass, failure, or unsupported boundary | Evidence |
|---|---|---|---|---|
| E1 — Enhanced upload | Upload the probe ZIP and inspect its components without invoking them. | The plugin installs and Helpwright remains available; optional components may be enabled, disabled, or grayed out. | `pass` if declarations do not break installation; `configuration-error` if they do; `unsupported-by-surface` only when custom upload itself is absent. | Probe hash, screenshots, component states, exact error. |
| E2 — Script execution | Explicitly invoke `/helpwright:compatibility-probe` or the rendered equivalent and approve execution if prompted. | A visible tool trace runs `node …/runtime-probe.mjs command` and returns generated runtime data. | `pass` with a trace; `runtime-unavailable` for missing Node; `unsupported-by-surface` for no execution facility; `configuration-error` for unresolved paths; otherwise `indeterminate`. | Invocation label, permission/tool trace, stdout/stderr. |
| E3 — Hook | Run E2, then run an ordinary Helpwright control turn. | A hook-capable surface returns a distinct hook nonce only for E2. The control has no hook message. | Apply `pass`, `unsupported-by-surface`, `runtime-unavailable`, `configuration-error`, or `indeterminate`. | Hook state, positive trace/result, silent control. |
| E4 — MCP | Enable the inert connector if offered and call `helpwright_compatibility_probe`. | A capable surface starts the local server, lists one read-only tool, and visibly calls it. | `pass` with an MCP trace; distinguish unavailable Node/local processes, unsupported MCP, configuration failure, and indeterminate prose. | Connector state, permission, tool list/call trace, output/error. |
| E5 — Graceful degradation | Re-run C2, C3, C5, and C6 with the probe package. | Helpwright remains usable even when E2–E4 are unsupported or runtime-unavailable. | `pass` if core behavior survives; `configuration-error` if declarations break loading; `behavioral-failure` if probes interfere. | Regression transcripts, states, probe hash. |

If core C1 passes and probe E1 fails on the same surface, stop. That establishes
that at least one optional declaration breaks compatibility. Isolating the
individual component requires a separately approved follow-up experiment; do
not add package variants to this one.

## Surface sequence

Use the same already-built core and probe hashes everywhere.

| Surface | Required sequence | Current expectation |
|---|---|---|
| Claude Free Chat web | C1–C6, remove core, then E1–E5. | Primary experiment. Core upload is revalidated from direct observation. Script and MCP are unknown; hooks are expected to be unsupported. |
| Paid Claude Chat web/Desktop | Repeat the full core-then-probe sequence if available; record web and Desktop separately. | Skills expected. Hooks are documented as Cowork-only. Script and local MCP remain empirical. |
| Cowork | Repeat the full core-then-probe sequence if available. | Stronger components are plausible, but only observed execution establishes support. |

## Evidence record

Keep results local under an ignored directory:

```text
evals/results/claude-plugin-compat-<session-start-UTC>/
```

Record:

1. source commit and portable Skill content hash;
2. core and probe ZIP hashes;
3. evaluator, date, plan, client, surface, model, and settings;
4. install and removal sequence;
5. exact prompts and outputs;
6. upload, component, `/` menu, and error screenshots;
7. authoritative script, hook, and MCP traces;
8. one taxonomy result and concise rationale per test;
9. cross-surface differences and blocked surfaces.

Never record real customer data, credentials, or private company information.
Do not commit results.

## Validation and rollback

Repository validation:

```sh
node --test test/claude-plugin-experiment.test.mjs
npm test
npm run build
node experiments/claude-plugin/build.mjs
unzip -Z1 dist/helpwright-claude-plugin-core-v0.0.1.zip
unzip -Z1 dist/helpwright-claude-plugin-probes-v0.0.1.zip
sha256sum dist/helpwright-claude-plugin-*.zip
```

The test covers experiment package contents, Skill byte identity, probe
isolation, explicit-only activation, local probe contracts, and separation
from the release build command. It does not require reproducible ZIP bytes.

Rollback consists of removing the uploaded plugins, deleting the isolated
experiment directory, test, and this document, and deleting ignored generated
artifacts. No migration, credential revocation, backend teardown, or stable Skill
change is involved.

## Status

Implementation and deterministic repository validation can establish package
structure only. Claude compatibility remains **not tested** until the manual UI
matrix is run and recorded. Plugin installability must not be described as
runtime enforcement.
