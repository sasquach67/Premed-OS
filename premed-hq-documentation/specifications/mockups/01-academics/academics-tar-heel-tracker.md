# Tar Heel Tracker — decisions

**File:** `academics-tar-heel-tracker.html` · **Status:** PROPOSED (Aug 2026)
**Spec:** `tabs/01-academics.md` §4.2 tab table · §4.2-A (tracker layout,
APPROVED July 2026) · §4.2-D (transcript fidelity)

The one question this tab answers: **what's left, and am I on pace?**

## Product views

| View | Slug | Job |
|---|---|---|
| Gap & pace | `audit` | The default. Verdict first, sets below. |
| All requirements | `requirements` | The full sets, with confidence labelling. |
| Prior credit | `prior-credit` | AP, transfer, dual enrolment — transcript-exact. |

Sections use a **solid segmented control** in the level-3 filter bar, not a
second tab row. Three levels, three forms still holds.

## Decisions encoded

1. **Gap-and-pace first.** Status row → on-pace verdict → suggested next term →
   overlap → full sets. A requirement audit is normally a dead checklist; this
   one leads with the answers.
2. **Pace is measured against the MCAT date, not graduation**, and states the
   verdict as a sentence. Anything unscheduled is flagged **by name** — BIOL 252
   is called out as fall-only with the consequence spelled out — never buried in
   a count.
3. **Overlap is the differentiator.** No UNC tool shows that one course clears a
   major requirement, a med prereq and a gen-ed at once. The count and the
   "boxes cleared for free" total lead the panel, and every requirement row
   carries its `also:` line. The double-count cap is applied and said out loud so
   the number is never inflated.
4. **Confidence is labelled, never hidden.** Verified sets carry ✓ Verified plus
   the date. The unverified major carries ◑, a plain warning, and a one-tap
   "I confirmed this" — shown and usable, never silently presented as fact.
5. **Transcript fidelity in prior credit.** Course number and title exactly as
   printed; HQ's display name is a separate field shown underneath.

## Deliberately excluded

- **No single degree-completion score.** Components stay transparent (§5).
- **No advice against taking a course.** Sequencing is one input among many and
  HQ sees only some of them (§4.2-E "Must not").
- **No retention percentage for untracked courses.** Rank is defensible, a
  number is not.
- **No term building.** That is the Planner. The two stay separate surfaces
  (§4.2-C2); the Tracker is the audit and links across.

## Rejected alternatives

- **A plain accordion checklist.** This is what the current implementation is,
  and it is why the tab gets ignored — it answers none of the three questions.
- **A single "degree progress" ring.** Collapses four different requirement
  systems into one number that cannot be acted on.

## A/B/C in the lab

Per view, declared in `VIEW_VARIANTS`:

- `audit` — verdict-led bento · pace as the working surface · two-column audit
- `requirements` — grouped sets · gap-first (met recede) · two-column sets
- `prior-credit` — ledger with context · ledger only · entry-first
