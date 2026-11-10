# ChatGPT Work Plus compatibility investigation — 2026-10-13

Publication copy: private links and personal metadata were sanitized; see [provenance and evidence limits](../publication-provenance.md).
## Assessment

**CONDITIONAL GO for a synthetic, human-reviewed POC.** This personal Plus account exposes Work, custom Skill upload, and an already-installed older Helpwright Skill. Official documentation supports Gmail-connected scheduled and event-triggered Work. No additional subscription or custom infrastructure is established as necessary. Refresh the existing standalone Skill and test the native route before considering any fallback.

This investigation does **not** establish that Work can already replace Claude Pro for a reliable scheduled support workflow. The baseline is the tested **Claude Free** workflow, whose scheduling was never tested. Current Helpwright loading, Gmail operations, approval behavior, event delivery, and cross-run checkpoints still require experiments. Strict isolation from unrelated personal context is not established: the project permits outside memory and Library access.

## Scope and evidence

Inspected the authenticated ChatGPT web tab with the existing **Chrome DevTools MCP Server**. Used the previously authorized Helpwright Test project (private evidence; link omitted), with Work selected. The project was created in the preceding turn; no new project, chat, task, installation, connection, permission change, or email operation was performed in this investigation. A temporary unsent `@helpwright` composer probe was cleared. No Claude or Gmail mailbox tab was opened and no corporate connector was invoked.

Repository revision: `f49b9c5c429cae3142e1fc1d09d8132494513eff`. Starting tracked working tree was clean. Current `skills/helpwright/SKILL.md` SHA-256: `636d16e465e37e8dffbb5bdee3bca74973005912d08c11c668fa513466550b41`.

Evidence labels below have precise meanings:

- **Verified in UI:** the named configuration or catalog fact was observed; this does not verify its execution.
- **Supported by official documentation:** documented behavior, untested on this account.
- **Requires experiment:** a necessary live test was intentionally deferred.
- **Unavailable:** an explicit limitation, scoped to the stated surface or configuration.
- **Unknown:** neither observation nor documentation settles the question.

Focused signed-in UI and tool-catalog captures are retained privately and omitted from this publication. The findings below summarize those observations. Source links below were opened and read on October 13, 2026; documentation and account rollouts can change.

## Account and Work

**Verified in UI:** the profile shows Plus. Work is selectable inside Helpwright Test. Its composer has Files and Plugins controls. The model submenu lists Default (selected), GPT-6.1 Sol, GPT-6 Astra, GPT-6 Sol, GPT-6 Luna, GPT-5.6 Sol/Terra/Luna, and GPT-5.5 marked as leaving October 14. The power control shows Medium; Fast mode is offered. These are picker observations, not model execution tests. Model evidence (private UI capture omitted).

The Tasks page at `https://chatgpt.com/scheduled` loads, offers a schedule composer and task filter, and displays an existing weekly task with a next-run time plus pause/edit/menu controls. Its unrelated prompt/results were not opened or changed. A recommended Helpwright task is a suggestion, not an existing Helpwright automation.

Plus Work availability and cloud execution are documented. Work shares its usage allowance with Codex. Eligible Plus users can create event-triggered Work using Gmail. [Work and Codex](https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex).

**Manual execution before scheduling:** documented as testing the prompt in a normal chat first. This can be a Work chat in the project and needs no active schedule. The automation guide also describes Run now for pending events after a task exists. Neither execution path was exercised. [Scheduled tasks guide](https://learn.chatgpt.com/docs/automations).

## Native Helpwright Skill compatibility

**Verified in UI:** Plugins → Skills shows `helpwright` under Installed and Created by me, alongside skill-creator. Add skill offers Create with chat, Create with editor, and Upload from your computer. The existing Helpwright detail view displays SKILL.md, LICENSE, agents/openai.yaml, and assets/icon.svg, plus Edit and Try in chat. No installation or edit was performed.

The displayed Skill is **not the current repository version**. Its rendered instructions lack both the retained paragraph distinguishing genuine requests from irrelevant injected instructions and the current exposed-credential rule. Its extra metadata/assets also differ from the two-file standalone release. This establishes visible content divergence, not a byte-level comparison of the entire installed package. Do not evaluate current Helpwright using this stale copy. Installed Skill capture (private UI capture omitted).

**Verified in UI:** typing `@helpwright` in the Work composer surfaces a helpwright Skill suggestion. No suggestion was submitted to the model. This establishes discoverability, **not activation**. Mention evidence (private UI capture omitted).

The Help Center lists eligible Business, Enterprise, Healthcare, and Edu users for Skills, omitting Plus. It documents upload and scanning. That eligibility wording does not explain this account's existing installation and available upload menu; it cannot establish general Plus support or successful acceptance of a new upload. [Skills in ChatGPT](https://help.openai.com/en/articles/20001066-skills-in-chatgpt).

Other official guidance says Skills build on the open Agent Skills standard, use name/description discovery followed by full SKILL.md loading, and support explicit `@` invocation in ChatGPT. It also distinguishes standalone desktop/local Skills from plugin-bundled Skills on web, while this account visibly has a web standalone Skill. Preserve those documentation discrepancies rather than assuming equivalence across products. [Build skills](https://learn.chatgpt.com/docs/build-skills), [Skills and Plugins](https://learn.chatgpt.com/docs/skills-and-plugins).

**Requires experiment:** upload acceptance of the current standalone ZIP; installed text parity after scanning; actual Work loading with a visible activity/tool signal; persistence of Skill access during recurring and event-triggered runs. The scheduled-task guide explicitly supports Skills and plugins, but a selector or a reply claiming to use Helpwright is insufficient evidence of loading. [Scheduled tasks guide](https://learn.chatgpt.com/docs/automations).

The repository's canonical Agent Plugins 1.0 artifact remains unchanged. Plugins are documented for Work, but import/acceptance of this specific canonical package was not tested. No new ChatGPT distribution is justified. [Plugins](https://learn.chatgpt.com/docs/plugins).

### Fallbacks, only if native refresh fails

| Option | Portability and maintenance | Fidelity and verification |
|---|---|---|
| A. Supply current SKILL.md in the task prompt or attachment | Reuses portable source; record its hash and refresh after changes. Inline text avoids file retrieval dependency. | Full text preserves rules better than a summary. An observed file read confirms retrieval, not native Skill activation or behavioral correctness. |
| B. Project file/instructions or supported plugin workflow | Project instructions/files organize repeated manual work; plugin could preserve native distribution if import is supported. | Project instructions are manually supplied guidance. Scheduled file access has conflicting documentation; do not rely on project files until tested. Native plugin loading remains a separate gate. |
| C. Reusable prompt incorporating methodology | Easiest to paste but a second maintained instruction copy; excerpts can drift. | Harder to preserve all authority/privacy rules. Assess outputs against fixtures; never label this Skill activation. |

Prefer native refresh. If that fails, propose A with the complete current text, explicitly labeled **instructions supplied manually**. Do not implement a fallback without approval.

## Gmail connectivity and operations

**Verified in UI:** the Gmail catalog entry is by OpenAI, version 0.1.10, with Interactive and Write capabilities and Install plugin available. Settings → Plugins lists only GitHub; the Work plugin picker also lists GitHub. Gmail is not installed/listed as connected in these inspected surfaces. No Gmail account identity or OAuth scopes could be verified without setup. The separate signed-in Gmail browser tab does not establish a ChatGPT connection.

The Gmail app details expose these tools without calling them. Catalog tool capture (private UI capture omitted).

| Required operation | Catalog evidence | Execution classification |
|---|---|---|
| Filtered search, labels, IDs | search_emails, search_email_ids, search_thread_ids; Gmail operators belong in query; label_ids requires actual IDs | Requires experiment |
| Full conversation | read_email_thread accepts message_id/thread_id; description defaults to **20 latest messages**; batch thread reads are listed | Requires experiment; explicitly avoid assuming default means complete for long threads |
| Message metadata/timestamps | batch_read_email describes bodies, labels, timestamps and sender/recipient metadata | Requires experiment for exact returned fields and completeness |
| Changed conversations | list_history describes a Gmail history cursor; searches and fresh thread reads also available | Requires experiment for cursor durability, new replies and draft exclusion |
| Unsent draft | create_draft explicitly creates without sending; update_draft and list_drafts available | Requires experiment |
| Threaded reply draft | Catalog description does not expose the reply-association input schema | Unknown until authorized tool-schema/result inspection and one test |
| Send prevention | send_email, send_draft and forward_emails are separate write tools | Approval policy must be verified; draft-only wording is not a hard deny |

Official inbox guidance supports Gmail thread triage, reply drafts, and scheduled checks. It does not prove the exact thread-association contract or message completeness on this account. [Manage your inbox](https://learn.chatgpt.com/use-cases/manage-your-inbox).

Future setup must authorize **only `helpwright-test@example.invalid (anonymized mailbox)`** and confirm that identity from connected-account metadata and, if available, get_profile. OAuth must be completed by the user. Do not authorize personal/corporate mail as a substitute if this account is unavailable.

## Recurring versus event-triggered orchestration

| Question | Recurring task | Gmail event task |
|---|---|---|
| Plus eligibility | Documented | Documented for eligible Plus |
| Execution while computer is off | Cloud web execution documented | Cloud event execution documented |
| Gmail access | Supported connected apps documented | Connected Gmail account required |
| Selection | Saved prompt performs scoped search | New incoming messages, optional sender/subject filters documented |
| Label filter at trigger boundary | Search can use label query | Not documented; do not assume label filtering exists |
| Existing-thread replies | Fresh scans can inspect known threads | New-message wording suggests coverage, but reply delivery requires experiment |
| Context/state | Same-chat scheduling preserves chat context; monitoring can use prior runs | Skill/prompt supported; exact prior-state behavior requires experiment |
| Manual retry | Normal chat test before schedule; account-specific retry UI unverified | Guide documents Run now for pending events; untested here |
| Duplicate behavior | Repeated search hits require checkpoints | Nearby events may be combined; no exactly-once guarantee found |

The Help Center documents five active tasks for Plus, paid recurring cadence up to hourly, event caps of 30 runs/hour and 720/day across event tasks, and possible grouping. It describes task pause/edit/delete, prior-run monitoring information, connected-app support, and pausing for required approvals. These limits are documentation-backed, not measured. [Scheduled tasks Help Center](https://help.openai.com/en/articles/10291617-scheduled-tasks-in-chatgpt).

The automation guide describes same-chat versus standalone runs, run review, Gmail sender/subject filters, pending-event processing, and Skills/plugins. One task can have multiple event triggers but cannot combine events with a time schedule. No durable transactional checkpoint or exactly-once processing contract was found. [Scheduled tasks guide](https://learn.chatgpt.com/docs/automations).

**Recommendation:** manually validate first, then prefer one Gmail event task scoped by the test sender and HWPOC subject criteria, if its saved conditions and existing-thread replies pass. Retain latest non-draft message IDs and a human review checkpoint; events reduce polling, not review-state management. If event delivery/filtering fails, use one daily same-chat read-only scan at an agreed Europe/Tallinn time. Avoid adding a history-cursor service or polling backend for this POC.

**File-access uncertainty:** the Help Center says tasks created in projects cannot access uploaded/project files; the automation guide says web scheduled tasks can use uploaded files and accessible project context. Treat file-backed fallback availability as **Unknown** until separately tested. Neither project storage nor an attachment is a reliable unattended instruction source yet. Prefer installed Skill plus explicit saved task instructions.

## Safety, authority and data boundaries

**Verified in UI:** app permission default is **Allow low-risk tools**. Its menu also offers Always ask and Allow read-only tools. No change was made. Do not infer that current defaults require approval for draft creation. Permission UI (private UI capture omitted).

Official permissions guidance says Allow read actions permits reads while asking before changes; per-account overrides can exist. Always allow removes repeated prompts where offered. Permission settings govern approval, not provider access. Proposed setup: use a Gmail connection-specific read-only approval mode if offered, inspect overrides, and use Allow once for one approved draft. Do not silently change the global setting for unrelated apps. [Managing app permissions](https://help.openai.com/en/articles/20001495-managing-app-permissions-in-chatgpt).

**Verified in UI:** Helpwright Test has blank project instructions, Default memory allowing outside-chat memory, and Library access enabled. The project-only option explicitly says Work mode is unavailable. Keep that observation scoped to this account; a dedicated project is organizational separation, not a data-access sandbox. Project settings (private UI capture omitted).

No per-task enforceable connection allowlist, synthetic-label-only authorization, or no-send tool deny was established. A plugin picker or prompt saying “only Gmail” does not establish one. Connecting only the test Gmail limits the Gmail identity, but OAuth may grant access to its whole mailbox. Sender/subject filters and label queries constrain selection, not credentials. Default memory/Library may bring unrelated personal context into Work. The existing GitHub connection was not opened or invoked.

Connected-app access remains bounded by provider authorization and app permissions; relevant memory can be shared with apps. Plus training-data preferences also apply. Review those settings before the POC without changing them during investigation. [Connected apps](https://help.openai.com/en/articles/11487775-connected-apps-in-chatgpt).

Prompt-injection protection remains behavioral, with tool approval as an additional boundary. Test adversarial HWPOC-07 plus genuine multiple-request controls; do not treat Skill scanning, one successful refusal, or approval configuration as proof that injected content cannot affect tool calls. Keep unattended output as recommendations and in-chat drafts, with no mailbox writes. Require human review of each external action and its account, recipient, association and body.

If strict exclusion of all unrelated personal context is mandatory and no suitable controls are available, stop before live connected testing: this project configuration does not meet that requirement. Do not compensate by accessing corporate settings or inventing a custom service.

## Comparison with the retained Claude evidence

| Capability | Claude Free POC | ChatGPT Work Plus |
|---|---|---|
| Install Helpwright | Verified | Verified in UI: older custom Skill installed; current upload requires experiment |
| Observable Skill activation | Verified: Loaded skill activity | Requires experiment; Work mention discoverability verified only |
| Gmail thread search | Verified | Requires experiment; tools advertised in UI and workflow documented |
| Batch triage | Verified for seven synthetic cases; judgment partial | Requires experiment |
| Changed-thread retrieval | Verified in two scans, including updated HWPOC-05 | Requires experiment |
| Unsent threaded draft | Verified through create/get plus Gmail reopening | Requires experiment; association schema unknown |
| Recurring execution | Not tested | Supported by official documentation; live behavior requires experiment |
| Gmail event trigger | Not tested | Supported by official documentation for eligible Plus; requires experiment |
| Cross-run state handling | Manual message-ID procedure | Same-chat context documented; reliable checkpoints require experiment |

Baseline sources: Phase 1 (private local result `results-v0.2-20261011T105137Z.md`; not included), Phase 2 (private local result `results-v0.2-20261011T125336Z.md`; not included), completed scans and connector draft (private local result `results-v0.2-20261011T202630Z.md`; not included). They establish mechanisms, not production readiness. The earlier label/unread shortcut missed a new reply, and manual checkpoint tracking did not establish automatic replay suppression. The Phase 2 report also records an operator scope mistake; synthetic-only access was not perfect in that historical run.

The October 12 comparison (private local result `results-v0.2-20261012T183021Z.md`; not included) contains targeted contamination improvements and partial legitimate controls. The October 13 retention decision (private local result `results-v0.2-20261013T165143Z.md`; not included) supersedes rollback and verifies the retained source/install state. Unsupported investigative-intent wording remains a separate limitation. Do not claim the safety issue is fully solved or reuse the stale ChatGPT copy.

## Minimal implementation plan — approval required before execution

1. **Confirm boundaries.** Review personal-context exposure, available task/plugin restrictions, training preferences, and test-mailbox scope. Accept a synthetic-only, approval-gated POC or stop if required isolation cannot be met. Do not disable unrelated plugins or global memory without explicit authorization.
2. **Refresh native Skill.** User/authorized operator uploads the existing `dist/helpwright-agent-skill-v0.2.0.zip` through Skills, completes scan/review, and compares displayed instructions with source. Resolve the old copy without leaving ambiguous duplicates. If native upload is rejected, report it before implementing fallback A.
3. **Connect test Gmail.** User performs OAuth for the designated mailbox, reviews scopes, confirms identity, and sets connection-specific read-only approval behavior if available. Confirm other connections cannot be used under the agreed boundary; do not silently broaden access.
4. **Manual Work gate.** In Helpwright Test, explicitly select Helpwright; record model/settings, source/package hash, activity showing actual loading, and complete synthetic thread tool results. Retrieve HWPOC-01–07 using scoped queries. Capture IDs/timestamps and flag truncation; keep outputs in chat. Repeat injection and genuine multiple-request controls. A no-skill baseline requires demonstrably inactive Helpwright, not simply omitting its name.
5. **Continuity gate.** Repeat an unchanged scan, then test one approved synthetic reply in a known conversation. Exclude drafts from latest-customer-message checkpoints. Preserve separate retrieved, reviewed, and draft-created states. Missing state must stop processing or produce a review request, not infer approval.
6. **One draft gate.** Only after the operator reviews exact text, inspect the actual reply-association schema and approve one unsent draft using Allow once. Verify the tool result, draft metadata and original-thread placement in Gmail. Preserve existing drafts; do not send or delete anything. No current approval is granted for this step.
7. **One event gate.** After manual gates pass and scheduling is approved, create one Gmail event task with the selected test account and supported sender/subject conditions. Save explicit Helpwright invocation and synthetic-only/read-only instructions. Test a new case, reply to an existing case, rapid grouped events, unchanged/replayed events, and an injection-bearing event. Verify loading, complete retrieval, no unintended writes, pending approvals, run history, and pause/delete controls.
8. **Choose orchestration.** Keep events only if filtering, reply coverage and state handling pass. Otherwise propose one daily read-only same-chat schedule and review its first runs. Report failures and recoverability before claiming replacement capability.

State can remain a small explicit checkpoint table in the same review chat for this POC: case/thread ID, latest retrieved non-draft ID/time, latest **human-reviewed** ID, and optional verified draft ID. This is reviewable bookkeeping, not a transactional store. If later runs cannot reliably retrieve/compare it, unattended deduplication fails the gate; do not add infrastructure automatically.

**Manual setup:** Skill refresh/review, test-account OAuth and identity confirmation, approval-mode review, acceptance or correction of personal-context exposure, then explicit scheduling authorization. No company configuration, Helpwright backend, API key, new code, or custom ChatGPT package is proposed.

**Estimated incremental cost:** $0 subscription/infrastructure if the account's current access and included allowance suffice. Plus is already held; additional credits may be needed because Work and Codex share usage. Run volume/model/tool costs were not measured; no fixed cost or throughput promise is justified. A paid upgrade is not recommended by this evidence. [Pricing](https://learn.chatgpt.com/docs/pricing).

## Validation and completion limits

Read-only ZIP inspection confirms both current release artifacts contain byte-identical Skill files from source:

- Standalone SHA-256: `31a5f770e679639df123c4b746ca05f81345fa8745f2aeb68e0df928813d47cc`; entries are SKILL.md and LICENSE under helpwright/.
- Agent Plugin SHA-256: `6297e10b43c6a116d348e32add59f2764ec97456d7e8889159449699614069e5`; entries are root plugin.json/LICENSE plus the same Skill subtree. No runtime/hooks/MCP are packaged.

No new behavioral eval, Gmail operation, scheduled run, installation, build, or deterministic suite was run; this change adds investigation documentation and evidence only. Existing test/build passes in the October 13 report are historical evidence, not new validation. UI interaction timeouts/stale element IDs were resolved by fresh snapshots or DOM clicks on observed controls; no forbidden action was substituted. Final browser remains in Helpwright Test with Work selected and an empty composer.

The read-only compatibility investigation is complete. Execution uncertainties are explicit gates in the proposed plan. **Final recommendation: CONDITIONAL GO**, using the existing portable standalone Skill and native Gmail/event facilities, subject to current-version loading, data-boundary acceptance, approval enforcement, threaded-draft verification and repeat-run continuity tests.
