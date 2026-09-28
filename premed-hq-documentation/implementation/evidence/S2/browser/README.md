# S2 real local API + headless Chrome acceptance

**Historical pass: 10 scenarios / 94 assertions**, September 28, 2026.

The later archive/notice changes are covered in
`../browser-followup-907b9f5/README.md` (7/56). That follow-up supersedes this
matrix's automatic-path archive/notice expectations; panel/keyboard evidence here
remains tied to 674f612.

Tested source: `674f612c41dd63163f29277c1b969c853cf3308d`. The copied
working-tree production build's source hashes exactly match that commit; see
`source.json` and `source-correspondence.json`. Fixture-only additions were the
synthetic setup/read bridge and loopback CSP allowance. Runtime source was not
modified. The follow-up `bad7583` changes only the generic fast-forward notice
from “were synced” to “were kept. Sync resumed”; this wording-only follow-up was
**not rerun in the browser matrix**. Its checks belong to the parent release run.

## Observed cases

| Scenario | Theme / width | Result | Assertions |
|---|---|---|---:|
| Device-only additions | Dark / 375px | Silent, fuller work retained, recovery notice | 8 |
| Cloud-only additions | Light / 375px | Silent, fuller work retained, recovery notice | 8 |
| Additions on both sides, device newer | Dark / 375px | Panel; keyboard Keep newest retains device | 11 |
| Additions on both sides, cloud newer | Light / 375px | Panel; keyboard Keep newest retains cloud | 11 |
| Same task edited on both sides | Dark / 1280px | Panel; no automatic replacement | 11 |
| Device-only known record deletion | Light / 375px | Silent; deletion kept after recovery | 8 |
| Cloud-only known record deletion | Dark / 375px | Silent; deletion kept after recovery | 8 |
| Cloud-only note-map deletion | Light / 375px | Silent; deleted note stays absent | 9 |
| Housekeeping-only differences | Dark / 375px | Silent; authored task and note unchanged | 9 |
| Device deletes while cloud edits task | Light / 375px | Panel; no automatic replacement | 11 |

The deletion expectations follow Andy's later approved revision. The original
brief's blanket deletion-panel behavior is intentionally superseded for a known
one-sided change with a proven baseline. Unknown-section deletions are outside
this browser fixture; their fail-closed behavior is covered by the core tests.

`results.json` contains the actual assertion results and intercepted cloud writes.
Every observed PATCH was paused **before being sent**, then the harness read the
recovery database and independently recomputed the snapshots' SHA-256 hashes.
All observed cloud replacements had both verified recovery copies already stored.
After every scenario the recovered task collections matched both prior versions.
For cloud-to-device fast-forwards no PATCH was needed; recovery was observed after
resolution, with pre-replacement ordering covered by the application's core tests.

The production application used actual disposable Supabase Auth and PostgREST,
including S1's claimed-row write revision guard. The fixture starts with fully
migrated native data and rejects setup if running the actual migration again
changes the baseline or either side. It then seeds only an isolated synthetic
account and lets normal hydration/reconciliation/UI perform the work.

## UI observations

The 375px dark and light panels were opened and inspected. Text and controls fit,
with no horizontal page overflow. Detailed comparisons were collapsed initially;
the primary action's accessible name named the timestamp winner. Native CDP Tab
reached the primary button and Enter selected it. Screenshots capture both panels
and post-resolution notices. The additive notice and Settings' recovery-download
entry were visibly present. These are keyboard and accessible-label checks;
**no screen-reader speech output or physical touch-device test is claimed**.

## Limits and cleanup

This matrix has no notebook images. Real-image upload progress, 80-image completion,
and a stalled upload's retry safety are covered by separate app tests, not by this
browser receipt. There was no hosted account acceptance and no real-account access.
Every page request outside the local app/API was blocked by CDP, and the generated
bundle was checked for hosted Supabase project URLs.

`cleanup.json`: **0 local Auth users, 0 dashboard rows, no running disposable
containers, no harness browser or preview processes**. The disposable volume was
kept. Earlier malformed fixture attempts are explicitly inconclusive; see
`../local-attempt/README.md`. They are not part of this passing matrix.
