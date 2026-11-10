# Helpwright

### Your AI can write a support reply. Can it make the right call?

**Helpwright helps your AI handle customer support, not just sound like customer support.**

Give it a ticket or conversation. It figures out what matters, what is actually known, and what should happen next.

No new helpdesk. No separate AI account. No API keys to configure.

![MIT](https://img.shields.io/badge/license-MIT-green) ![Open Source](https://img.shields.io/badge/open_source-yes-blue) ![Backend](https://img.shields.io/badge/backend-not_required-blueviolet) ![Agent Skill](https://img.shields.io/badge/Agent_Skill-v0.2-orange)

**[Install without coding](#install-without-coding-in-claude) · [See the difference](#see-the-difference) · [Try it](#try-it) · [Results](#does-it-actually-work) · [How it works](#what-helpwright-does)**

---

## See the difference

A confident answer isn't always the right answer.

**The support case:**

> **Customer:** "Yesterday you said you'd escalate my login issue to Security. Has your team fixed it?"
>
> **Internal note:** Escalated to Security yesterday. No investigation status, resolution, or estimated completion time recorded.

| A convincing but unsupported AI reply | Helpwright's intended handling |
|---|---|
| "Our Security team is actively investigating your issue, and we'll update you within 24 hours." | **Next action:** Check the escalation's latest status. Don't assume Security has begun investigating or promise an update.<br><br>**Customer reply:** "Your issue has been escalated to Security, but I don't have confirmation that it has been resolved or an update on its progress yet." |
| Sounds helpful. Invents investigation progress and a follow-up commitment. | Separates what happened from what hasn't been confirmed, while giving the agent a useful next step. |

*Illustrative synthetic example, not a verbatim output from the evaluation.*

**That's the difference. Helpwright doesn't just improve the wording. It checks whether the answer makes sense.**

And sometimes the right answer isn't another reply at all.

> **Agent:** "Could you share the exact error code you're seeing?"
>
> **Ticket status:** Waiting for the customer. No new customer message.

**Helpwright:**

> No reply needed. The agent has already asked for the missing information. Wait for the customer's response.

No unnecessary email. No repeated question. No invented progress.

---

## Try it

Once Helpwright is installed in a compatible AI assistant, just paste a support ticket:

```text
Use Helpwright for this:

[paste your ticket or conversation]
```

That's it. No special ticket format, company configuration, or integration required.

Helpwright understands the context and decides whether to answer, ask a question, investigate, wait, or recommend escalation.

### Three ways to use Helpwright

| Mode | Ask your AI | What you get |
|---|---|---|
| **Handle** | `Use Helpwright for this: ...` | The next useful action, with a customer reply when appropriate |
| **Draft** | `Use Helpwright to draft a reply: ...` | A grounded, customer-ready response |
| **Review** | `Use Helpwright to review this: ...` | Substantive mistakes, missing steps, unsupported claims, and suggested fixes |

You can paste whole conversations, including previous replies and internal notes. Helpwright is designed to work with the context you already have.

---

## What Helpwright does

Writing a polite reply is easy. Making the right support decision is harder.

| | Helpwright helps your AI... |
|---|---|
| 🔎 **Know what's real** | Separate confirmed facts from customer reports, assumptions, and unknowns |
| 🎯 **Find the next step** | Decide whether to answer, verify, clarify, wait, or escalate |
| 🛡️ **Avoid false promises** | Not claim refunds, fixes, escalations, or other actions happened without evidence |
| 📋 **Respect your policies** | Follow the rules and authority boundaries you provide, without inventing missing ones |
| 💬 **Follow the conversation** | Understand what's already been answered, requested, or promised |
| ✍️ **Write useful replies** | Produce clear, natural responses without hiding uncertainty behind polished language |

**The goal isn't to make your AI more cautious. It's to make it more useful without making things up.**

## Does it actually work?

We tested Helpwright against ordinary AI assistance on the same customer-support scenarios.

| Ordinary AI | With Helpwright | Improvement |
|:---:|:---:|:---:|
| **54.5%** | **81.8%** | **+27.3 points** |
| 24/44 passes | 36/44 passes | 12 more passes |

In blind automated comparisons:

**28 Helpwright wins · 11 ties · 5 losses**

The October 2026 evaluation covered 43 synthetic support cases (44 variants), using the same Codex CLI model and configuration for both sides.

These are results from a controlled, synthetic evaluation, not a real-world accuracy or safety guarantee. Independent human validation and testing in other AI assistants are still needed.

**[Read the evaluation and methodology](docs/experiments/2026-10-27-codex-comparative-first-coverage.md)**

---

## Install

Helpwright is open source. It runs as a Skill inside your existing AI assistant.

There is no Helpwright backend or subscription to sign up for.

**[Download Helpwright v0.2.0](https://github.com/evenfrost/helpwright/releases/tag/v0.2.0).** The source and release downloads are public. No GitHub account is needed.

### Install without coding in Claude

**Use this route if you want to paste tickets into Claude on the web or desktop.** You need a Claude account with Skills and code execution available. No terminal, Git, Node.js, or local build is needed.

1. **[Download Helpwright for Claude](https://github.com/evenfrost/helpwright/releases/download/v0.2.0/helpwright-agent-skill-v0.2.0.zip).** Save the ZIP as it is; do not unzip it. If downloading from the [release page](https://github.com/evenfrost/helpwright/releases/tag/v0.2.0), choose `helpwright-agent-skill-v0.2.0.zip`, not **Source code** or the Agent Plugin ZIP.
2. In Claude, open **Settings → Capabilities** and enable **Code execution and file creation** (or **Create and edit files**). Your organization may need to allow Skills too.
3. Open **Customize → Skills → Add skill → Upload skill**. Some layouts use **+ → Create skill → Upload a skill**. Select the downloaded ZIP and enable Helpwright.
4. Start a new chat and paste `Use Helpwright for this:` followed by your ticket or conversation.

Already installed? Use Helpwright's **More options → Replace** control to update it. If Skills or upload controls are missing, check code execution and your organization's permissions. See [Claude's current Skills instructions](https://support.claude.com/en/articles/12512180-use-skills-in-claude) for prerequisites and UI changes.

<details>
<summary>Download checks and what has been tested</summary>

You can verify the ZIP against the release's [SHA256SUMS](https://github.com/evenfrost/helpwright/releases/download/v0.2.0/SHA256SUMS). [Maintainer verification instructions](docs/releasing.md#inspect-and-publish) explain how.

The released ZIP was accepted through Claude chat's replacement flow on November 8, 2026; all three synthetic smoke chats showed a host-rendered **Loaded skill → helpwright** indicator. The chats preserved core grounding but also showed verbosity and unsolicited-advice limitations. This was a small smoke test, not a full evaluation or a comparison proving improvement. [Read the test evidence](docs/experiments/2026-11-08-claude-release-smoke.md).

First-time installation in a fresh Claude account was not tested. On November 10, both public release ZIPs were downloaded without credentials, passed their checksums, and matched the clean release source. Their Skill bytes match the previously tested private release; the new archives have their own checksums. [Publication provenance](docs/publication-provenance.md) explains the distinction.

</details>

### Skills.sh, Codex, or Claude Code

[Skills.sh](https://skills.sh/) is Vercel's directory for discovering agent Skills. Its [Skills CLI](https://github.com/vercel-labs/skills) installs Helpwright from this GitHub repository into supported local agents. It does not upload Helpwright to your Claude chat account; use the steps above for that.

If you already use a terminal, you need Node.js **22.20 or later** and Git. No GitHub account, Helpwright clone, or build is needed. Run the command for your agent:

**Codex**

```bash
DISABLE_TELEMETRY=1 npx skills add evenfrost/helpwright -g -a codex -s helpwright
```

**Claude Code**

```bash
DISABLE_TELEMETRY=1 npx skills add evenfrost/helpwright -g -a claude-code -s helpwright
```

These commands install across projects. Review the destination and any existing installation before confirming; avoid adding a second copy if you already use the Helpwright plugin. Omit `-g` for installation in the current project. The environment prefix disables the third-party CLI's telemetry and security-audit requests; in PowerShell, set `$env:DISABLE_TELEMETRY = "1"` before running the `npx` command.

Skills.sh documents [automatic directory listing through installation telemetry](https://skills.sh/docs/faq), with no separate manual submission. These telemetry-disabled commands do not contribute to that listing. Helpwright's public directory listing is not yet verified; installation from a public repository does not require a directory listing. See [distribution options and current status](docs/distribution.md).

In Codex, find `helpwright` in `/skills` or the `$` selector, then submit `$helpwright` with your ticket. In Claude Code, use `/helpwright` with your ticket. Restart the host if the Skill does not appear. See [Codex's Skill discovery guidance](https://learn.chatgpt.com/docs/build-skills) and [Claude Code's Skills guide](https://code.claude.com/docs/en/skills).

The public installation route was checked on November 10 with Skills CLI **1.8.0** in disposable environments without GitHub credentials for both agent targets. Each installed only `SKILL.md` and `LICENSE`, matching the source bytes. Matching files verifies installation; confirm the host's selector separately. This check does not establish runtime activation or support-quality improvement on either host.

### Ask a local AI agent to install it

In a coding agent that can run commands and write local files, use:

```text
Install only the Helpwright Skill from https://github.com/evenfrost/helpwright
for this agent across projects. Inspect the source and existing installations
first; ask before replacing or duplicating one. Disable installer telemetry.
Verify the installed files and, if available, the host's Skill selector.
Tell me how to invoke it and distinguish verified installation from any
unverified activation. If access or permissions block installation, report that.
```

A local agent can perform installation within its tool permissions. Uploading a Skill into a chat account still requires the host's installation controls.

### ChatGPT and other clients

Follow the host's current [Skill and plugin installation guidance](https://learn.chatgpt.com/docs/build-skills). Helpwright is not listed in an official plugin directory. The [canonical Agent Plugin ZIP for v0.2.0](https://github.com/evenfrost/helpwright/releases/download/v0.2.0/helpwright-agent-plugin-v0.2.0.zip) is intended for Agent Plugins 1.0-compatible clients; an arbitrary ZIP is not a universal installation interface. Use the standalone Skill only where the host supports it.

Installation, discovery, runtime activation, and support effectiveness are separate checks. The comparative results above came from Codex; they do not establish equivalent results in other assistants.

---

## What Helpwright doesn't do

Helpwright is a support judgment layer, not an autonomous helpdesk.

It won't magically know your company policies, access customer accounts, issue refunds, or update tickets.

It works with the information you provide. If relevant tools are available and authorized, their verified results can inform its decisions.

It also doesn't require those integrations to be useful.

**You provide the context. Helpwright helps your AI make better decisions with it.**

### Privacy

The standalone Skill has no Helpwright backend, telemetry, or customer-data storage. Your AI assistant's own data-handling rules still apply.

Only use customer information in AI environments approved by your organization.

---

## For developers and contributors

Helpwright is an open project built around a portable customer-support methodology.

### Build and validate

For contributors building the packages locally:

```bash
git clone https://github.com/evenfrost/helpwright.git
cd helpwright
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

Requires Node.js, the pnpm version in `package.json`, `zip`, and `unzip` for tests. The release workflow uses Node.js 24.11.0.

The build writes these packages to `dist/`:

| Package | Intended use |
|---|---|
| `helpwright-agent-plugin-v0.2.0.zip` | Canonical Agent Plugins 1.0 directory package |
| `helpwright-agent-skill-v0.2.0.zip` | Standalone Skill, including Claude chat upload |

Both contain the same unchanged `skills/helpwright/` source. Maintainers can prepare a draft release with both ZIPs and checksums using the [release process](docs/releasing.md). Publishing remains a separate decision.

- [Core Skill](skills/helpwright/SKILL.md)
- [Architecture](docs/architecture.md)
- [Clean-history publication and evidence limits](docs/publication-provenance.md)
- [Evaluation methodology](evals/README.md)
- [Support-case coverage](evals/core-coverage.md)
- [Experiments](docs/experiments/)

Contributions, feedback, and real-world testing are welcome. [Open an issue](https://github.com/evenfrost/helpwright/issues).

## License

[MIT](LICENSE) — free to use, modify, and distribute.
