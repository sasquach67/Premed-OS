# Mockup approval ledger

**Started:** 2026-08-13 23:01 EDT  
**Starting point:** Academics → Empty states in the mockup lab  
**Owner of approvals:** Andy

This is the durable record of what Andy has selected during visual review.
It prevents two distinct mistakes:

1. re-implementing a treatment already present in the app; and
2. treating a mockup's header or a vague “looks good” as permission to build.

It is a **review record**, not an implementation gate.
[BUILD-MANIFEST.md](./BUILD-MANIFEST.md) remains the sole authority for
whether code may be written. An approval here records the selected drawing;
it does not change a Build? value.

## How to record a decision

Add one row immediately when Andy chooses a direction. Every row must name:

- the mockup file and product view;
- the exact selected variant (A, B, or C), or not specified;
- the date/time and the plain-language ruling;
- whether it is actually authorized in the build manifest; and
- the implementation state: not audited, not built, partially built, built,
  superseded, or blocked.

Never infer a variant. If Andy says “approved” but does not identify a letter,
record not specified and do not let the row decide implementation details.
When implementation starts, first audit the named app surface and update its
state and evidence (file/commit) here. A redesign must link to the row it
supersedes rather than silently replacing it.

## Baseline and approvals

| Recorded | Mockup / product view | Selected treatment | Ruling | Build authorization | Implementation state | Evidence / overlap guard |
|---|---|---|---|---|---|---|
| 2026-08-13 23:01 EDT | **Baseline** — start at Academics → Empty states | — | Begin recording every new visual approval from this review point forward. Earlier approvals are not retroactively inferred. | — | — | This line is the boundary for future review. |
| 2026-08-12 (retroactively recorded) | 01-academics/academics-empty-states-prototype.html | **A**, with B’s “What this sets up” explanation retained | Variant A was approved; Import syllabus is the primary action and Add manually is a small secondary link. | YES in the existing manifest | **not audited** | Before work, audit the current Academics empty state; do not add a second onboarding/create path. |
| 2026-08-12 (retroactively recorded) | 01-academics/academics-class-types.html | **not specified** | The class-types configuration was approved, including a mock ENGL 105 example. | YES in the existing manifest | **not audited** | The exact A/B/C selection was not captured. Treat the component/configuration, not an inferred layout letter, as approved until Andy selects a variant. |
| 2026-08-13 23:08 EDT | Overview → Quarterly goals | **Interaction rule, no layout variant selected** | A goal is either a simple check-off, a cumulative metric, or a period metric. AI may suggest a kind, but the student confirms it. Measured progress comes from a real linked source or an explicit manual value; never render an invented zero-progress bar. | Overview is YES in the existing manifest; no code was requested in this ruling | **not audited** | Do not reduce metric goals to rich-text strikethrough. Audit the current panel and add a mockup/field design before implementation. |
| 2026-08-13 23:14 EDT | 01-academics/academics-tar-heel-tracker.html → Gap & pace | **Copy ruling** | Rename the recommendation panel from “What to take next term” to **“Suggested next term.”** It offers ranked planning guidance; it does not prescribe a schedule. | YES in the existing manifest | **not audited** | Copy-only mockup revision. Preserve the ranked-by-boxes-cleared rationale and the Planner/Requirements separation. |
| 2026-08-14 00:05 EDT | Shared experience frame → Clinical, Volunteering, Shadowing, Research, Extracurriculars | **Shared header + card grid + selected-record workspace** | Every experience pillar uses the same header grammar as Academics and MCAT: page title with variable stats, underline tabs, then a solid control bar with the create action. The list is card-first; selecting a site, organization, physician, project, or initiative keeps the grid visible and opens that record in one **full-width inline workspace beneath the cards**, matching the current Clinical interaction. It is neither a nested card accordion nor a detached inspector. | Clinical/Volunteering/Research/Shadowing/ECs remain NO in the existing manifest | **not built** | This supersedes the prior experience-only center-peek rule. Preserve shared card geometry and the shared header; configure only pillar-specific fields and accent. |
| 2026-08-14 01:49 EDT | `05-public/public-landing-and-auth.html` → Landing, Auth, and local→account Merge | **not specified** | Approve the existing fully written three-surface public-layer mockup without changing its authored layout or settled copy. | YES in the existing manifest | **built** | Existing implementation: `src/pages/public/Landing.tsx`, `AuthPage.tsx`, `MergePage.tsx`, and `src/components/public/*`. Approval is now recorded; no layout letter was inferred from browser state. |

## Status meanings

| State | Meaning |
|---|---|
| not audited | A visual decision exists, but nobody has compared it with the current app. |
| not built | Audit found no matching implementation. |
| partially built | Some behavior or surface exists; the ledger must name what is missing. |
| built | The selected treatment was implemented and verified; cite the commit and app files. |
| superseded | A newer approved row replaces it; keep this row for history. |
| blocked | The required build authorization or product ruling is absent. |
