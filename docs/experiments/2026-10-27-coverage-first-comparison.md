# Coverage-first Codex comparison

The first live run completed 24 valid pairs across 12 of 43 case IDs. Helpwright
passed 17/24 against baseline 7/24; blind comparisons were 20 wins, one tie and
three losses. These include repetitions and are not 24 independent scenarios.
Provider quota and conservative missing-usage charges interrupted expansion.
Independent human judge calibration remains outstanding.

The next experiment freezes the Skill, fixture requirements, neutral prompts,
judges and grading semantics. Coverage mode runs each missing variant once,
without automatic repetitions. There are 44 variants because B14 has two.
Thirteen compatible repetition-one results from the original run leave 31 new
pairs. Historical repeated results retain a separate denominator.

## Implementation and review

`scripts/codex-eval-coverage.mjs` is trusted scheduler bookkeeping; support and
judge processes retain native restrictions denying repository/results access.
Parents must match Skill bytes, CLI/model/reasoning configuration, seed, timeout,
fixture/rubric/schema hashes and protected prompt/grading/execution source
sections. Legacy runner snapshots must exactly match their recorded source
hashes before their protected sections can be compared. Missing boundaries fail
closed. Installation, discovery, native probes and readiness are still rerun.

Manifests are atomically replaced. New execution writes to a new directory;
parents and artifact hashes retain provenance. Complete failed or unresolved
behavior counts as tested, while invalid/incomplete execution is rescheduled in
fresh sessions. No outcomes are selected to improve scores. Quota failure stops
later calls. Waiting is supervised outside model processes; it must not silently
increase the invocation's token/call/wall limits or consume reset credits.

Coverage defaults: four million tokens, 240 CLI invocations, two hours, 180 seconds
per invocation. Candidate generation reserves at least 40,000 tokens (observed
successful maximum was 37,062); reported usage replaces estimates. These bounds
are scheduling controls, not guaranteed billing ceilings. Estimated remaining
coverage is 2.5–3.3 million tokens, with four seeded reverse-order audits plus
selective bounded adjudication. Readiness uses the unfiltered fixture set.

Validation: 20 focused tests and 92 repository tests pass, including interrupted
resumption, immutable parents, incompatible configuration, complete failure and
unresolved selection, source-semantic changes and report denominators. Original
first-coverage import was checked without inference and yielded 13 variants.

Technical completion means 44/44 compatible variants, all failures retained.
Product improvement is a separate empirical outcome. No result is guaranteed,
and a positive result in this configuration does not establish cross-host or
production readiness. Analyze the completed first pass before changing the
Skill. Any later change needs frozen controls, fresh sessions, version-separated
results and repeated evidence for the targeted effect.
