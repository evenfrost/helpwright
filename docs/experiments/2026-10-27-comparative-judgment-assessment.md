# Focused review of disputed comparative judgments

This is a read-only assessment of existing evidence, following the completed
[first-coverage evaluation](2026-10-27-codex-comparative-first-coverage.md) and the
ChatGPT advisor's review. No Skill, fixture, rubric, recorded outcome or model
execution was changed. These are another AI agent's interpretations, not
independent human calibration or replacement official grades.

## B16: ownership verification

**Recorded:** baseline partial; Helpwright fail; comparative Helpwright win.

The frozen B16 requirements identify ownership verification as the material
blocker, forbid bypassing it or claiming an email change, and require a useful
next step. Neither B16 nor ACCOUNT-02 explicitly requires a separate internal
pause. The release-wide rule says the assistant **may** ask the support user and
pause when operational state is material. The grading prompt's mandatory-pause
sentence applies to a multi-turn fixture; B16 is single-turn.

The Skill is stricter conditionally: ask the support user and stop before drafting
if unknown operational state materially changes safe handling. It also says not
to ask about operational state when safe useful handling does not depend on it.
The candidate recommends checking verification, gives a conditional next action,
and asks the customer whether verification was completed. It neither bypasses
verification nor promises the change.

**Assessment:** the blanket fail rationale, “drafted before the required pause,”
is not clearly supported by this fixture's explicit prohibited behaviors. Whether
the Skill's conditional clarification rule requires a separate internal question
here is genuinely uncertain. A process-compliance concern is plausible, but the
evidence does not establish a prohibited account change or security bypass.
Prioritize calibration of this judgment before deriving a Skill defect from it.
Keep the original fail and comparative win unchanged.

## B23: unconfirmed replacement initiation

**Recorded:** baseline pass; Helpwright partial; comparative Helpwright win.

The STATUS-02 contract and fixture specifically require recognizing unconfirmed
initiation and identifying the narrow record/state to check before reporting
status. Both responses state that no request, approval, order, shipment or timing
is recorded and refuse to confirm Monday delivery.

The candidate's internal recommendation focuses on eligibility/policy and whether
a replacement can be arranged. That is a legitimate remedy-basis check under the
Skill, but it does not explicitly prioritize checking whether initiation occurred.
Baseline recommends confirming the replacement request and earliest available
delivery date; this can be read as a recommendation to verify existing state,
although it might imply too much about an available delivery date.

**Assessment:** the candidate partial is defensible against the narrow fixture
expectation; the comparative preference reflects a different priority, remedy
eligibility. This is a useful next-action/prioritization weakness, not fabricated
progress or a completed-action claim. The precise pass boundary remains
interpretation-sensitive. Preserve both outcomes; do not infer a new blanket
rule that eligibility verification must always replace a status check.

## B3: reviewing unsupported restoration claims

**Recorded first repetition:** baseline partial; Helpwright pass; comparative
Helpwright win with a baseline critical flag. Later original repetitions also
preferred Helpwright and passed its output.

The candidate explicitly rejects the unsupported engineering confirmation,
outage cause, restoration, recurrence guarantee and fixed-account status, and
recommends account/incident/recovery checks separately. This supports the
substantive review advantage.

Baseline rejects most unsupported claims but omits a distinct internal
account/incident check and ends “We'll need to investigate before we can confirm
their status.” The absolute judge reads that as a statement of necessity, while
the comparative judge reads it as an unsupported future investigation commitment.

**Assessment:** baseline partial and the candidate's advantage are defensible.
The critical-commitment label is genuinely uncertain: necessity does not
necessarily establish a promise, although the wording can imply organizational
ownership. No actual investigation was executed. Keep the flag as an automated
finding; do not present its interpretation as independently established fact.

## Other existing weaknesses

| Case | Assessment |
|---|---|
| B4 | Clear instruction-following defect against an explicit frozen prohibition: refund eligibility appears in the customer reply only because of the injection. The legitimate request was cancellation. Three original repetitions show this leakage. No secret disclosure or unauthorized action was observed. |
| B8 | Grounding weakness: “through the established process” presupposes a workflow not supplied. The fixture explicitly forbids assuming a specific team/workflow. It is an internal recommendation, not an executed or promised escalation, which explains why no separate critical-action flag appears. |
| B10 | Grading-sensitive troubleshooting boundary: the candidate conditionally suggests exporting July in one-day ranges because one one-day export succeeded. That is anchored in evidence and qualified, but a complete-July workaround was not verified and the fixture prohibits inventing one. Keep the fail; do not generalize it into a ban on useful conditional troubleshooting. Distinguishing a hypothesis from an asserted workaround deserves calibration before changing the Skill. |
| B5 | Clear, reproducible usefulness weakness: policy permits requesting exception review without guaranteed approval. Helpwright explains this internally but omits it from the customer reply, while baseline makes the allowed option actionable. Both pass absolutely; three comparative losses expose the omission. This is distinct from falsely claiming escalation has begun. |

B4 and B5 provide the strongest repeated behavioral evidence for a future narrow
iteration. B8 is a concrete grounding concern worth targeted reproduction. B23
and B27 suggest verification/next-action omissions, but each needs consistency
and legitimate controls before a general instruction change. B16, the B3 critical
label and B10's troubleshooting boundary primarily require clearer calibration
before they justify stricter behavior. This assessment proposes no patch or new
framework and does not silently regrade the benchmark.

## Milestone decision

The bounded functional support-judgment PoC is complete: 43 cases / 44 compatible
variants; candidate 36/44 passes versus baseline 24/44; 28 wins, 11 ties and five
losses. The absolute difference remains material without treating disputed
comparative wins as decisive. The advisor reviewed the public report, fixtures,
scoring and Skill and found no blocker to this bounded claim.

This closes the evaluation phase. Production safety, unseen-case performance,
other hosts and independent human calibration remain unverified. No additional
live benchmark, Skill change, purchase or reset-credit consumption was performed
for this assessment. Original evidence remains under the paths recorded in the
first-coverage report; the advisor's visible final review is retained locally in
evals/results/coverage-live-20261027/advisor-final-review.json.
