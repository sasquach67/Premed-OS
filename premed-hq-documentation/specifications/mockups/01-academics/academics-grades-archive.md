# Grades & Archive — decisions

**File:** `academics-grades-archive.html` · **Status:** PROPOSED (Aug 2026)
**Spec:** `tabs/01-academics.md` §4.2 tab table · §6.8 (grade ledger) ·
§4.2-D (AMCAS-shaped record) · §6.9 (structural decisions)

The one question this tab answers: **what have I earned?**

## Product views

| View | Slug | Job |
|---|---|---|
| Ledger | `ledger` | The full record, status as a filter. |
| GPA | `gpa` | Dual UNC/AMCAS, BCPM, year-by-year trend. |
| What-if | `what-if` | Scenario mode and the inverse solve. |

## Decisions encoded

1. **Archive is a filter, not a destination.** Withdrawn, completed and
   superseded are status chips on the one ledger. The old split made Archive a
   thin separate page; it is really a filter.
2. **Dual GPA, permanently side by side.** UNC 3.71 and AMCAS 3.66 are shown
   together with the delta explained in one line — the repeated BIOL 101 plus 17
   credits of prior coursework. Students discover this gap in May of their
   application year, which is the worst possible time.
3. **AMCAS truncates rather than rounds.** The true value 3.667 is shown, then
   truncated to 3.66 — stated explicitly rather than quietly rounded to 3.67.
4. **Every attempt of a repeat counts.** Both BIOL 101 attempts stay in the
   ledger. The C+ is marked "Superseded at UNC" but remains in the AMCAS math,
   and the row group says why.
5. **Grade trend by academic year.** Committees read the trajectory, not the
   endpoint, so the shape is rendered. The partial senior year is visibly
   partial.
6. **What-if is weight-aware and inverse-solving.** "You need 84 on the final
   for an A−", plus mathematically irrelevant and highest-leverage items.
   Syllabus policies are listed, applied, and editable — a projection that
   ignores a drop-lowest rule is simply wrong. A curve at instructor discretion
   is named and **excluded** rather than guessed at.

## Deliberately excluded

- **No separate Archive page.** See decision 1.
- **No single academic score.** Cumulative, BCPM, AO and term stay separate.
- **No celebration on a GPA number.** Celebrations are for real milestones.
- **No normalised course titles.** Titles are the transcript strings.

## Rejected alternatives

- **A term-scoped view.** Everything valuable here — the trend, the repeat
  handling, the dual number — is cross-term. Term-scoping is the mistake most
  trackers make and it cannot be retrofitted (§6.9).
- **Showing only the AMCAS number.** Simpler, but it hides the gap that is the
  single most useful thing this tab knows.

## A/B/C in the lab

Per view, declared in `VIEW_VARIANTS`:

- `ledger` — terms as cards · dense transcript · two-column terms
- `gpa` — dual hero · trend first · instrument panel
- `what-if` — landing then inputs · inputs first · solve-first
