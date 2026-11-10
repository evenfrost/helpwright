# Releasing Helpwright

The [manual release workflow](../.github/workflows/release.yml) builds the existing two distributions and attaches them, plus `SHA256SUMS`, to a **draft** GitHub Release. It never publishes a release automatically. Pushing a commit or tag does not trigger it.

The owner selected `evenfrost/helpwright` for this clean repository, after renaming the original private repository to `helpwright-private`. The new destination and its release remain pending verification. The original private release is historical evidence, not a release of this repository. See [publication provenance](publication-provenance.md).

## Prepare a draft

Only perform these steps after the owner authorizes the target commit, tag, and release preparation. The workflow must already be on the default branch to dispatch it.

1. Select the reviewed release commit. Confirm `package.json` and `plugin.json` have the same version and that its packages pass `pnpm test` and `pnpm build`.
2. Create and push an annotated tag named `v<package.json version>` at that exact commit, if it does not already exist. For example, version `0.2.0` requires `v0.2.0`. Never move an existing release tag. The workflow requires an existing tag and checks its version before installing dependencies.
3. Open **Actions → Prepare draft release → Run workflow**, select the reviewed workflow on the default branch, and enter the existing tag. Review the workflow before dispatch: it has repository contents write permission and uses the repository's GitHub Actions allowance. No additional secret or service is required.
4. Check the run completed successfully. It uses Node.js 24.11.0, the tagged `packageManager` version of pnpm, frozen dependency installation, `pnpm unpack`, `pnpm test`, and `pnpm build`. Unpacking prepares the generated `plugins/helpwright/` directory required by the deterministic runner tests in a clean checkout.
5. Open the draft in [Releases](https://github.com/evenfrost/helpwright/releases). Expect exactly these assets for `v0.2.0` (substitute the selected version):

   - `helpwright-agent-plugin-v0.2.0.zip`
   - `helpwright-agent-skill-v0.2.0.zip`
   - `SHA256SUMS`

The workflow fails rather than overwriting an existing release. If a run fails, inspect the release and assets before retrying; creation or upload may have partially succeeded. Do not delete or replace an existing release merely to retry.

## Inspect and publish

Download all three draft assets into an empty directory and verify the downloaded bytes:

```bash
sha256sum --check SHA256SUMS
unzip -l helpwright-agent-skill-v0.2.0.zip
unzip -l helpwright-agent-plugin-v0.2.0.zip
```

On macOS, use `shasum -a 256 -c SHA256SUMS`. The standalone archive must contain `helpwright/SKILL.md` and its supporting files. The Agent Plugin must contain `helpwright/plugin.json`, `helpwright/LICENSE`, and the same unchanged Skill under `helpwright/skills/helpwright/`. Existing packaging tests check exact contents, source-byte parity, and exclusion of runtime experiments. Checksums verify downloaded bytes against the draft manifest; they do not prove host installation or Skill activation.

Confirm the tag still identifies the reviewed release commit, inspect release notes and assets, and obtain the owner's publication decision before choosing **Publish release**. Keep a prerelease marked as such when appropriate. No workflow dispatch, tag creation, release creation, publication, visibility change, or marketplace submission is implied by preparing these files.

After a real release is published, verify its downloads without credentials. The README's intended v0.2.0 release and asset links must use the confirmed new destination and remain marked pending until verified. Future versions require the same checks. Versioned download links use `/releases/download/<tag>/<asset-name>`; `/releases/latest/download/<asset-name>` requires that exact asset name on the latest published release. Our ZIP names include versions, so a latest link containing an older version will break when the latest version changes. Use the Releases page unless stable aliases are deliberately added and tested.

## Installation evidence

Verify the installed files and the host's Skill selector separately. In Codex, look for `helpwright` in `/skills` or the `$` selector; in Claude Code, look for `/helpwright`. Restart the host if necessary. A CLI success message or matching files establishes installation only. A listed Skill establishes discovery only. Record an independent runtime invocation receipt before claiming activation, and run relevant support evaluations before claiming host-specific effectiveness.

## Public launch and directory discovery

The owner selected a clean repository with new history. [Distribution options and readiness](distribution.md) records the remaining checks. Keep the original private history, tags, releases, and Actions logs separate. Do not clone or push its `.git` directory into the new destination.

1. Verify the owner-approved destination and canonical links in documentation and manifest metadata, then review the exact sanitized tree, file inventory, and package checks. Preserve Skill and license bytes. Use a GitHub noreply address for the new commit identity while retaining license attribution.
2. Initialize fresh Git metadata and create one reviewed root commit, with no old commit parents or imported refs. Create the approved destination privately, confirm its identity and visibility, and push only the clean branch. Create its own version-matching tag and prepare its own draft release using the workflow above. Verify all draft assets before publication. Never reuse a historical archive checksum for a new build. Once readiness and the destination are resolved, carry out the owner's public-launch instruction and read back the new repository and release state. Do not change the original private repository's visibility or history.
3. Without GitHub credentials, verify the repository page, source retrieval, release page, and each versioned download link. Use an empty temporary directory for downloads; check both ZIPs against the downloaded `SHA256SUMS` and compare all entries and bytes with the tagged source. A signed-in browser or authenticated download is insufficient evidence of public access.
4. In a disposable home without GitHub credentials, install from the public repository with the README's Skills CLI commands for Codex and Claude Code. Disable telemetry, record the CLI version and source revision, and compare installed files with `skills/helpwright/`. Keep these checks separate from host discovery, activation, and behavioral effectiveness. Do not overwrite the maintainer's existing installation.
5. Check Skills.sh search and the Helpwright directory page separately. Its [FAQ](https://skills.sh/docs/faq) describes automatic listing from installation telemetry, not a manual submission process. Telemetry-disabled checks do not seed the directory; no indexing deadline is established. Do not enable telemetry or submit a listing on the owner's behalf without a decision covering that external action, and do not generate repeated installs to inflate counts.
6. Only after observing anonymous access, update the README and this document to say the repository is public and remove repository-access prerequisites. Link a Helpwright directory page only after verifying its content; otherwise retain the unverified listing status. Record the exact revision, checks, and remaining limits for final review.
