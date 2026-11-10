# Distribution options and readiness

Verified November 10, 2026. The clean repository `evenfrost/helpwright` and its `v0.2.0` release are public. [Publication provenance](publication-provenance.md) distinguishes this source and release from historical private-source evidence.

| Route | User experience | Verified evidence and limits |
| --- | --- | --- |
| Claude chat, web or desktop | Download the standalone ZIP, upload it under Customize → Skills, enable it, then paste a ticket. No terminal or local build. | The November 8 replacement upload and three host-rendered activation indicators are recorded in the [smoke test](experiments/2026-11-08-claude-release-smoke.md). First-time installation in a fresh account remains untested; behavior had limitations. |
| Skills.sh and Skills CLI | Use the CLI to install from public GitHub into Codex or Claude Code. Requires Node.js and Git, or a local agent able to install on the user's behalf. | CLI 1.8.0 installed matching source bytes for both targets without GitHub credentials, in disposable environments with telemetry disabled. Host activation was not tested. The Skills.sh directory page still reports Helpwright as unavailable. |
| ChatGPT and other clients | Follow the host's current Skill or plugin installation controls. | No new installation or activation test was performed for these clients. A public repository or Agent Plugin ZIP does not establish an official directory listing or a universal upload interface. |

Use the [README installation guide](../README.md#install) for the actual steps. Keep the existing two distributions: the canonical Agent Plugin and the standalone Skill ZIP, both sourced unchanged from `skills/helpwright/`. No new installer, account, integration, or service is required for Helpwright's basic workflow.

## What was verified

- The public repository has a distinct GitHub ID (`1453203988`) and begins at root commit `f25a9024413dee608c4bda69200ffcfd1b844e59`, with no parents. The original repository retains ID `1328038483` and remains private; its Git objects, refs, and workflow logs were not imported. Anonymous requests could not read the private archive or the old source commit through the new repository.
- The clean `v0.2.0` tag identifies that root. [Release workflow 42904139242](https://github.com/evenfrost/helpwright/actions/runs/42904139242) completed successfully, including **93/93 deterministic tests**. The new release ID is `440926408`, published at `2026-11-10T21:23:02Z`.
- Credential-free HTTP requests returned the repository page, release page, raw Skill, both ZIPs, and `SHA256SUMS`. The ZIPs passed the downloaded checksums, matched the verified draft bytes, and contained exactly the tagged source files. Historical archive checksums do not identify these new builds.
- Claude's current documentation supports ZIP upload with code execution enabled. Organization permissions may restrict availability. The README puts this route first for users without programming experience.
- The Skills CLI discovers `skills/<name>/SKILL.md`; Helpwright needs no extra directory manifest. Upstream currently declares Node.js 22.20 or later. A directory listing is separate from source installation.

## Directory discovery and limits

Public source access, release downloads, and both CLI installation targets have been verified. On the same date, the Skills.sh detail page displayed “helpwright isn’t available in this repository,” despite an HTTP 200 response. HTTP success alone does not establish a listing. Helpwright is not claimed to be listed in that directory or in an official host directory. See the [launch verification checklist](releasing.md#public-launch-and-directory-discovery) for future releases.

Skills.sh documents automatic listing through CLI installation telemetry. No manual submission is required by that process. The README disables telemetry and security-audit requests for installation; those commands do not contribute to directory indexing. Enabling telemetry for a genuine installation is a separate owner decision. Do not manufacture popularity or promise an indexing time.

The owner chose clean history after inspection identified personal metadata and private conversation references in the original repository. This snapshot omits old Git history and raw signed-in UI/tool-catalog captures, sanitizes private links and personal paths, and anonymizes the test mailbox. The released Skill, synthetic cases, test coverage, and historical findings are preserved. A scan is a bounded check, not a guarantee that no sensitive information exists. No original repository visibility or history was changed.

## Primary sources

- [Claude: use Skills](https://support.claude.com/en/articles/12512180-use-skills-in-claude) — prerequisites, upload, and enable controls.
- [Skills.sh FAQ](https://skills.sh/docs/faq) — automatic listing through installation telemetry.
- [Skills CLI: creating Skills](https://github.com/vercel-labs/skills/blob/main/docs/creating-skills.md) — frontmatter and discovery layout.
- [Skills CLI configuration](https://github.com/vercel-labs/skills/blob/main/docs/troubleshooting.md) and [package metadata](https://github.com/vercel-labs/skills/blob/main/package.json) — telemetry/audit opt-out and Node.js requirement.
- [OpenAI: build Skills](https://learn.chatgpt.com/docs/build-skills) — local Skill discovery, invocation, and plugin distribution guidance; client availability still requires verification.
- [GitHub: repository visibility](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility) — public visibility and Actions-log exposure.
