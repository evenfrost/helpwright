# Claude response-discipline investigation: rejected candidate

Publication copy: private links and personal metadata were sanitized; see [provenance and evidence limits](../publication-provenance.md).
Date: November 8, 2026 (Europe/Tallinn).

## Decision

The [release smoke-test partials](2026-11-08-claude-release-smoke.md) justify further work on response discipline. Repetitions showed unrequested drafting audits, closing offers, and future follow-up coaching across different scenarios. **The one candidate tested here did not reliably fix them and was rejected.** The released Skill was restored locally and in Claude. No new behavior was adopted or released.

The unchanged Skill had no clean responses among the nine original-target repetitions. The candidate had one clear pass, six clear partials, and two borderline assessments. Even counting both borderline results as passes gives only **3/9**, below the precommitted **6/9** practical retention threshold. The desired nine clean responses were not achieved; no candidate S3 response was clean. Neither threshold is a statistical reliability claim.

A separate safety guard, H1, failed under both versions: missing pickup confirmation was turned into a categorical claim that the courier had not picked up the parcel. Absence of a recorded scan established only that pickup was unconfirmed, not that pickup had not happened or why tracking had not moved. This is a factual-grounding error, not verbosity. H3 also repeated a request for the invoice month already supplied as “last month,” an information-use defect.

ChatGPT's Pact review (private evidence; link omitted) read the complete comparison attachment, verified its SHA-256, rejected the candidate, and advised stopping this wording experiment. It reviewed supplied browser evidence; it did not independently run Claude. Historical smoke prompts, outputs, and grades remain unchanged.

## Versions, setup, and controls

| Item | Identity |
|---|---|
| Baseline source | `e07f4b3993bdad6fec5d673c2e543d43caf1d2db`; Skill bytes unchanged from published v0.2.0 |
| Baseline/restored SKILL.md SHA-256 | `636d16e465e37e8dffbb5bdee3bca74973005912d08c11c668fa513466550b41` |
| Candidate SKILL.md SHA-256 | `b349d5f043bfce967045257776967da488da5852d0dde2b371c2da42bbdc0021` |
| Candidate ZIP SHA-256 | `7f5e7cd1e43665706dbd895cafa7e365385700f28ee8b7221ba6fafac7e5acdf` |
| Released restoration ZIP SHA-256 | `d03cad7566561903d09e7b05d895747372918be876fee196b0482acfc7f7f0f5` |
| Claude installation revisions | Baseline v6 → experimental v7 → restored released contents v8; these are Claude revision counters, not Helpwright release versions |
| Host/settings | Claude Free, Sonnet 5.5 Medium, Manual; fresh standalone chats, no project |
| Test count | 36 chats: 12 unchanged target/adjacent, six unchanged guards, 18 candidate; B13 had one exact continuation per version (38 user messages total) |

The candidate appended exactly two sentences to the opening paragraph of **Shape the visible response**, preserving every other instruction, including the explicit no-offer and follow-up restrictions:

> In Default and Draft modes, stop once the currently useful handling is complete, whether that is a customer reply, a necessary clarification, an internal next action, or a relevant combination. Include supporting explanations or later steps only when they materially help the user handle the case now; omit unrequested audits of omitted claims and speculative future coaching.

Prompts, rubric, repetitions, adjacent cases, and retention bounds were frozen before their respective runs. Valid outputs were not regenerated. Every host test used synthetic support data. Tests ran in a separate browser tab; the user's existing conversations and drafts were preserved. Unrelated Skills and account settings were not changed. Existing writing Skills stayed enabled, which limits causal attribution.

Host-rendered **Loaded skill / helpwright** receipts were observed in all 36 chats; one was a static receipt rather than an expandable control. The session activity panel also identified Helpwright. Installed Code view contents matched each source after blank-line/indentation normalization. This establishes observed host activation and installed-content identity; the UI did not expose a raw runtime loaded-file hash. No hidden reasoning or private endpoints were inspected.

## Results

**Partial** indicates a clear unmet requirement with otherwise useful handling; substantive failures are separate. **Borderline** means an unresolved assessment, not an awarded pass. c-S1-1's investigation phrasing was suggestive rather than unequivocally false; c-S2-3's brief cadence advice might be harmless. Neither ambiguity changes the rejection decision. Useful troubleshooting, necessary internal actions, and requested Review explanations were not penalized merely for length.

| Run | Result | Evidence |
|---|---|---|
| S1-1 | partial | conversation (private evidence; link omitted) |
| S2-1 | partial | conversation (private evidence; link omitted) |
| S3-1 | partial | conversation (private evidence; link omitted) |
| H1-1 | fail | conversation (private evidence; link omitted) |
| H2-1 | partial | conversation (private evidence; link omitted) |
| H3-1 | partial | conversation (private evidence; link omitted) |
| S1-2 | partial | conversation (private evidence; link omitted) |
| S2-2 | partial | conversation (private evidence; link omitted) |
| S3-2 | partial | conversation (private evidence; link omitted) |
| S1-3 | partial | conversation (private evidence; link omitted) |
| S2-3 | partial | conversation (private evidence; link omitted) |
| S3-3 | partial | conversation (private evidence; link omitted) |
| old-B2 | partial | conversation (private evidence; link omitted) |
| old-B3 | pass | conversation (private evidence; link omitted) |
| old-B6 | partial | conversation (private evidence; link omitted) |
| old-B13 | partial | conversation (private evidence; link omitted) |
| old-B17 | pass | conversation (private evidence; link omitted) |
| old-B41 | partial | conversation (private evidence; link omitted) |
| c-S1-1 | borderline | conversation (private evidence; link omitted) |
| c-S2-1 | partial | conversation (private evidence; link omitted) |
| c-S3-1 | partial | conversation (private evidence; link omitted) |
| c-H1-1 | fail | conversation (private evidence; link omitted) |
| c-H2-1 | partial | conversation (private evidence; link omitted) |
| c-H3-1 | partial | conversation (private evidence; link omitted) |
| c-S1-2 | pass | conversation (private evidence; link omitted) |
| c-S2-2 | partial | conversation (private evidence; link omitted) |
| c-S3-2 | partial | conversation (private evidence; link omitted) |
| c-B2-1 | partial | conversation (private evidence; link omitted) |
| c-B3-1 | partial | conversation (private evidence; link omitted) |
| c-B6-1 | partial | conversation (private evidence; link omitted) |
| c-S1-3 | partial | conversation (private evidence; link omitted) |
| c-S2-3 | borderline | conversation (private evidence; link omitted) |
| c-S3-3 | partial | conversation (private evidence; link omitted) |
| c-B13-1 | partial | conversation (private evidence; link omitted) |
| c-B17-1 | pass | conversation (private evidence; link omitted) |
| c-B41-1 | partial | conversation (private evidence; link omitted) |

Both versions preserved much substantive support behavior: usable Draft handling, Review explanations, general technical hypotheses, B13's required clarification followed by completed-escalation-only grounding, customer-controlled credential replacement without repeating the secret, and both genuine export/refund requests in B41. This did not make all guard responses clean. The candidate Review response c-B3 introduced a closing offer relative to the baseline Review response, a discipline regression.

## Evidence and limitations

The complete prompts, full visible responses, assessments, setup metadata, exact B13 continuations, and all runs remain under the ignored local directory `evals/results/claude-response-discipline-20261108/`, following [the results-retention protocol](../../evals/README.md#recording-skill-results). These local artifacts are not included in a repository checkout:

- `cases.json`, `guard-cases.json`, and `candidate-cases.json`: frozen stimuli and criteria.
- Per-run JSON files and `final-results.json`: original captures and complete interactions.
- `comparison-report.md`: all 36 transcripts and comparison findings. The reviewed attachment `/tmp/helpwright-claude-opt-comparison.md` has SHA-256 `9cc5307aa7356451f5f7b6002dbfa36e266ab4baefe75641a48c10904d660d43`.
- The Pact checkpoint and review receipts are local under `.pact/runs/helpwright-claude-opt-20261108/`.

Original conversations require access to the signed-in Claude account; private links are omitted from this publication. Raw results remain local by default; this memo preserves the decision and per-run outcome index. Small sequential samples, other enabled Skills, subjective discipline grading, no no-skill baseline, and no independent human calibration prevent statistical reliability, cross-host equivalence, or product-lift claims. The candidate was evaluated under a verified installation, not independently verified runtime byte loading.

## Restoration and validation

- Restored local Skill bytes exactly to baseline; `git diff --exit-code e07f4b3 -- skills/helpwright` passed.
- Restored Claude using the verified published standalone ZIP. UI confirmed replacement, enabled **v8**, two files (`SKILL.md`, `LICENSE`), and Code view matched baseline contents after whitespace normalization.
- Candidate validation: Skill Creator validator passed; `pnpm unpack` passed; `pnpm test` finished with **93/93 passing**; `git diff --check` passed. These structural checks did not prove behavioral improvement.
- After rollback, `pnpm unpack` restored generated packages and `pnpm test` again finished with **93/93 passing**. Existing packaging tests verify release allowlists and source-byte parity.
- Re-read GitHub metadata: repository remained private; v0.2.0 still published at source `3d5774cddc73a8e57f3f3323ef3d8578bf984ef7`; tag, asset IDs/digests, and publication timestamp were unchanged. No release or visibility mutation occurred in this experiment.

## Follow-up direction

No second wording candidate was run or adopted. Before adding more instructions, investigate whether the host is treating private operational-audit reasoning as explanatory notes for the support agent, using controlled isolation and fresh scenarios. Separately retain the H1 missing-confirmation inference and H3 already-supplied-information issue as regression concerns. These are hypotheses and future evaluation priorities, not validated causes or implemented fixes.
