# Helpwright

### Your AI can write a support reply. Can it make the right call?

**Helpwright helps your AI handle customer support, not just sound like customer support.**

Give it a ticket or conversation. It figures out what matters, what is actually known, and what should happen next.

No new helpdesk. No separate AI account. No API keys to configure.

![MIT](https://img.shields.io/badge/license-MIT-green) ![Open Source](https://img.shields.io/badge/open_source-yes-blue) ![Backend](https://img.shields.io/badge/backend-not_required-blueviolet) ![Agent Skill](https://img.shields.io/badge/Agent_Skill-v0.2-orange)

**[See the difference](#see-the-difference) · [Install](#install) · [Try it](#try-it) · [Results](#results-and-limits) · [How it works](#what-it-changes)**

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

## Install

### npx / Skills.sh

Find [Helpwright on Skills.sh](https://skills.sh/evenfrost/helpwright/helpwright), or install it with the Skills CLI:

```bash
DISABLE_TELEMETRY=1 npx skills add evenfrost/helpwright --global
```

Choose your assistant when prompted. This installs Helpwright across projects, including for Codex or Claude Code. Requires **Node.js 22.20+** and **Git**. The prefix disables the installer's telemetry.

See the [Skills CLI guide](https://github.com/vercel-labs/skills) for other shells and installation options.

### Install without coding in Claude

For Claude chat on the web or desktop:

1. [Download the Skill ZIP](https://github.com/evenfrost/helpwright/releases/download/v0.2.0/helpwright-agent-skill-v0.2.0.zip). Keep it zipped.
2. Enable **Code execution and file creation** in Claude's settings.
3. Open **Customize → Skills**, choose **Add / Upload skill**, upload the ZIP, and enable Helpwright.

[Claude's guide](https://support.claude.com/en/articles/12512180-use-skills-in-claude) covers UI differences and organization permissions. Other compatible clients can use the packages on the [releases page](https://github.com/evenfrost/helpwright/releases).

## Try it

Start a chat and paste:

```text
Use Helpwright for this:

[your ticket or conversation]
```

You can also ask it to **draft a reply** or **review a proposed response**. Include relevant policies and internal notes when available.

In Codex, select `$helpwright`; in Claude Code, use `/helpwright`.

## What it changes

Helpwright focuses on the support decision behind the reply:

- Distinguish confirmed facts from customer reports and assumptions.
- Decide whether to answer, clarify, investigate, wait, or recommend escalation.
- Respect supplied policies and avoid unsupported promises or action claims.
- Keep replies clear, useful, and proportionate.

Helpwright works from the context you provide. It does not automatically know company policies, access accounts, issue refunds, or update tickets. Skill instructions guide behavior; they do not guarantee correctness.

## Results and limits

In a controlled Codex evaluation covering **43 synthetic cases / 44 variants**, passes rose from **54.5% to 81.8%** with Helpwright. Blind automated comparisons recorded **28 wins, 11 ties, and 5 losses**.

These results are specific to that test setup. They do not establish real-world accuracy or equivalent results in other assistants. [Read the methodology and findings](docs/experiments/2026-10-27-codex-comparative-first-coverage.md).

[Installation evidence and compatibility limits](docs/distribution.md) cover tested hosts, directory discovery, and third-party audit labels.

## Privacy

The Skill has no Helpwright backend, telemetry, or customer-data store. Your AI assistant's data-handling rules still apply. Only use customer information in environments approved by your organization.

## Contributing

```bash
pnpm install --frozen-lockfile
pnpm unpack
pnpm test
```

- [Skill source](skills/helpwright/SKILL.md)
- [Architecture](docs/architecture.md)
- [Evaluations](evals/README.md)
- [Builds and releases](docs/releasing.md)

## License

[MIT](LICENSE)
