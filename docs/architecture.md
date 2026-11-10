# Helpwright architecture

Helpwright is an open, agent-agnostic customer-support reliability layer for the AI people already use. Its portable Agent Skill improves support judgment and may gain stronger, host-dependent reliability capabilities over time.

The Skill remains the semantic core. Agent Plugins 1.0 is the intended canonical distribution format starting with v0.2; the standalone Skill remains a compatibility distribution. Runtime experiments can inform architecture without becoming production guarantees.

## Architectural principle

> **Portable semantics, host-specific enforcement plumbing.**

Customer-support meaning should remain as host-neutral as practical. Helpwright owns support judgment, support-state semantics, support-specific reliability rules, and domain evaluation. When a host exposes useful lifecycle or runtime capabilities, a thin adapter may translate between those capabilities and Helpwright's portable semantics.

The areas below describe architectural responsibilities. They are not a promise that each area exists as a separate module, package, API, or mature product capability:

- **Support judgment:** interpreting cases, separating evidence from assumptions, choosing useful next actions, and drafting or reviewing responses.
- **Support-state semantics:** distinctions such as completed, underway, supported future commitment, available but not started, unavailable, recommended only, and unknown.
- **Guardrails and policy:** support-specific constraints on actions and claims.
- **Verification:** checking generated claims or results against supported state.
- **Optional runtime and tools:** integrations or authoritative execution state when a demonstrated need justifies them.
- **Host adapters:** lifecycle and runtime translation required by a particular host.
- **Evaluation:** measuring judgment quality, enforcement quality, and product lift.

## Capability status

| Area | Status |
|---|---|
| Portable support-judgment Skill | Current semantic core and standalone compatibility artifact |
| Skills-only Agent Plugins 1.0 package | Canonical v0.2 distribution |
| Action-state and support-state semantics in the Skill and evals | Current |
| Narrow provider-neutral verifier and Codex Stop adapter | Experimental POC |
| General verification and policy gating | Architectural direction; not production behavior |
| Semantic verification | Under investigation; not adopted |
| MCP, integrations, authoritative receipts, and additional host adapters | Future |

Skill instructions are behavioral guidance, not deterministic enforcement. The current action states are semantics expressed in the Skill and evaluation rubrics; they are not a separately implemented shared contract or API.

## Responsibility boundaries

### Helpwright owns

- customer-support judgment and terminology;
- support-state semantics and support-specific reliability rules;
- verification semantics when implemented;
- evaluation of support judgment, enforcement, and product lift.

### The host owns

- LLM invocation and model selection;
- conversations, sessions, and the generic agent loop;
- generic tool dispatch, sandboxing, and lifecycle behavior;
- generic tracing or observability when available.

### External integrations own

- the behavior of helpdesks, CRMs, billing systems, and other support systems;
- authoritative execution results and external state;
- their own authentication, permissions, and operational guarantees.

Helpwright should not replace a generic agent framework, host runtime, or integration. It specializes in customer-support semantics and reliability.

## Operational truth

Where authoritative runtime or tool state exists, it owns operational truth. A confirmed tool result may establish that an action completed or is underway; a model assertion never establishes execution.

When no authoritative state is available, Helpwright must preserve uncertainty. It may reason from supplied context, recommend a next step, or ask a material question, but it must not invent an action, receipt, account state, policy, or external result.

## Progressive capability levels

### Level 1 — Support judgment

The portable Agent Skill interprets cases, distinguishes evidence from assumptions, reasons about policy and authority from supplied context, chooses next actions, and drafts or reviews responses. It requires no Helpwright backend, account, API key, company configuration, or support-system integration.

### Level 2 — Runtime guardrails and verification

Where a host exposes suitable lifecycle or runtime capabilities, optional host-specific plumbing may verify responses, validate action state, or apply support-specific policy gates. Each capability must be described according to what has actually been implemented and verified on that host; equivalent enforcement across hosts is not assumed.

### Level 3 — Verified operations

Future integrations may provide authoritative support-system state, execute actions, return tool results or receipts, and allow comparison between a response claim and actual execution. These capabilities are not required for Level 1 and are not implemented merely because they fit the architecture.

## Distribution boundaries

This clean-history publication starts from a reviewed source snapshot. Earlier private Git history and raw signed-in UI/tool-catalog captures are excluded; historical experiment notes are sanitized copies with their conclusions retained. [Publication provenance](publication-provenance.md) defines this boundary and the limits of historical revision and release references. This changes source publication, not support behavior or package contents.

`skills/helpwright/` is the sole source of portable support methodology for both release artifacts. `pnpm build` assembles a canonical Agent Plugins 1.0 directory containing root `plugin.json`, root `LICENSE`, and the complete Skill subtree, plus a standalone Skill compatibility directory. The published ZIPs carry these directories; Agent Plugins specifies the directory layout, not ZIP installation. Client installation, discovery, activation, and support quality require separate verification.

The v0.2 package contains no `mcp.json`, hooks, or client-specific `extensions`. MCP is an optional future portable integration, not a prerequisite. Agent Plugins 1.0 standardizes Skills and MCP servers. OpenAI documents `extensions.com.openai` for client-specific hooks and presentation alongside a standard plugin, with `.codex-plugin/plugin.json` as compatibility plumbing. An OpenAI-specific guardrail might use that extension later if behavioral evidence justifies shipping it; the existing Stop hook is not included in v0.2.

Release preparation uses a manually dispatched workflow to build the same packages and checksums into a draft GitHub Release; publication and public availability remain separate maintainer decisions. See [Releasing Helpwright](releasing.md). Source installation through the third-party Skills CLI consumes `skills/helpwright/` directly and does not change these distribution boundaries.

The provider-neutral verifier remains in `scripts/`. The Codex adapter, legacy manifest, and hook registration live under `experiments/codex-stop-hook/`; Claude's proprietary plugin experiment remains under `experiments/claude-plugin/`. Neither experiment is a canonical distribution.

Repository directories should follow demonstrated implementation needs, not mirror the conceptual areas above. A conceptual verifier, policy boundary, or runtime responsibility does not by itself justify adding `core/`, `policy/`, `runtime/`, `adapters/`, or similar structure.

## Experimental evidence

The local Codex comparative evaluation pipeline measures support judgment with the Skill available versus absent, using identical neutral prompts and implicit activation. It reuses support fixtures and absolute requirements, adds blind comparative judgments, and verifies disposable environments before inference. Automated judge sanity checks do not establish independent human calibration, and missing activation receipts cannot establish Helpwright-specific lift. This evaluation tooling adds no shipped runtime enforcement, integrations or release-package contents; browser-host behavior remains separately evaluated.

The [Codex Stop-hook POC](experiments/2026-08-25-codex-stop-hook-poc-design.md) demonstrated that a trusted host lifecycle hook can invoke a provider-neutral verifier automatically and cause corrective continuation through a thin Codex adapter. It did not establish fail-closed rejection: an invalid candidate may already be visible before correction. Subsequent experiments did not establish realistic behavioral lift for the tested narrow phrase-level verification approaches.

Historical experiment documents preserve their original hypotheses, designs, and limitations. They are evidence for architectural decisions, not descriptions of current production capability.
