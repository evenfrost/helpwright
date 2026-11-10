# Distribution options and readiness

Prepared November 10, 2026. This clean source snapshot preserves Helpwright's existing Skill and packaging. Its owner-approved destination is `evenfrost/helpwright`; public source and release access remain pending verification. [Publication provenance](publication-provenance.md) distinguishes the clean repository from historical private-source evidence.

| Route | User experience | Verified evidence and limits |
| --- | --- | --- |
| Claude chat, web or desktop | Download the standalone ZIP, upload it under Customize → Skills, enable it, then paste a ticket. No terminal or local build. | The November 8 replacement upload and three host-rendered activation indicators are recorded in the [smoke test](experiments/2026-11-08-claude-release-smoke.md). First-time installation in a fresh account remains untested; behavior had limitations. |
| Skills.sh and Skills CLI | Discover Skills in Vercel's directory; use the CLI to install from GitHub into Codex or Claude Code. Requires Node.js and Git, or a local agent able to install on the user's behalf. | The existing `skills/helpwright/SKILL.md` layout is supported. Prior installation checks used CLI 1.7.6 in disposable homes. Anonymous installation and Helpwright's public directory listing remain unverified. |
| ChatGPT and other clients | Follow the host's current Skill or plugin installation controls. | No new installation or activation test was performed for these clients. A public repository or Agent Plugin ZIP does not establish an official directory listing or a universal upload interface. |

Use the [README installation guide](../README.md#install) for the actual steps. Keep the existing two distributions: the canonical Agent Plugin and the standalone Skill ZIP, both sourced unchanged from `skills/helpwright/`. No new installer, account, integration, or service is required for Helpwright's basic workflow.

## What is ready

- The original source repository remains private. It is not the publication destination; none of its Git objects, remote refs, or workflow logs were copied.
- Fresh authenticated downloads of the original private `v0.2.0` release passed `SHA256SUMS`. Their complete entry lists and bytes matched its tagged source; the Skill also matches this snapshot. The clean repository needs its own verified release assets and checksums. Historical archive checksums do not identify new builds.
- Claude's current documentation supports ZIP upload with code execution enabled. Organization permissions may restrict availability. The README puts this route first for users without programming experience.
- The Skills CLI discovers `skills/<name>/SKILL.md`; Helpwright needs no extra directory manifest. Upstream currently declares Node.js 22.20 or later. A directory listing is separate from source installation.

## What remains before public launch

Use the owner-approved `evenfrost/helpwright` destination and follow the [public-launch checklist](releasing.md#public-launch-and-directory-discovery). Public source access, anonymous release downloads, and anonymous CLI installation must be observed after publication. Helpwright is not claimed to be listed on Skills.sh or in an official host directory.

Skills.sh documents automatic listing through CLI installation telemetry. No manual submission is required by that process. The README disables telemetry and security-audit requests for installation; those commands do not contribute to directory indexing. Enabling telemetry for a genuine installation is a separate owner decision. Do not manufacture popularity or promise an indexing time.

The owner chose clean history after inspection identified personal metadata and private conversation references in the original repository. This snapshot omits old Git history and raw signed-in UI/tool-catalog captures, sanitizes private links and personal paths, and anonymizes the test mailbox. The released Skill, synthetic cases, test coverage, and historical findings are preserved. A scan is a bounded check, not a guarantee that no sensitive information exists. No original repository visibility or history was changed.

## Primary sources

- [Claude: use Skills](https://support.claude.com/en/articles/12512180-use-skills-in-claude) — prerequisites, upload, and enable controls.
- [Skills.sh FAQ](https://skills.sh/docs/faq) — automatic listing through installation telemetry.
- [Skills CLI: creating Skills](https://github.com/vercel-labs/skills/blob/main/docs/creating-skills.md) — frontmatter and discovery layout.
- [Skills CLI configuration](https://github.com/vercel-labs/skills/blob/main/docs/troubleshooting.md) and [package metadata](https://github.com/vercel-labs/skills/blob/main/package.json) — telemetry/audit opt-out and Node.js requirement.
- [OpenAI: build Skills](https://learn.chatgpt.com/docs/build-skills) — local Skill discovery, invocation, and plugin distribution guidance; client availability still requires verification.
- [GitHub: repository visibility](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility) — public visibility and Actions-log exposure.
