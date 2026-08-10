# Demo data — site-wide (LOCKED July 2026)

**Problem:** an empty app can't be designed against. "No information available" tells you nothing about whether a layout works, whether a warning reads well, or whether density is right.

**Rule:** every surface in Premed OS must be viewable **populated**, in one keystroke, without touching real data.

---

## 1. It is a toggle, not a default

- **Settings → Demo data: on / off.** Off by default for real users.
- Switching **swaps the entire store namespace** — `hq-demo:*` vs `hq:*` in localStorage. Real data is never read, written, merged, or migrated by demo mode.
- **Reset to fresh demo state** is one action, always available.
- **A persistent visible indicator** while active — a badge in the shell chrome reading `Demo data`. The user must never be able to confuse seeded data for their own.
- Turning demo off restores the real store untouched.

> **Empty states still matter and must remain testable.** Demo mode does not excuse skipping them (`01` §8, `04` §9). With demo off, every empty state must still be correct.

## 2. One coherent persona across every pillar

A single fictional student, consistent app-wide, so **cross-tab features actually work** in demo: a grade change shows in GPA *and* the requirement audit *and* Overview; clinical hours show on the pillar *and* the Overview domain row.

**Persona:** UNC Neuroscience B.S., junior, MCAT targeted ~14 months out. Chosen to match the real primary user so the app looks plausible rather than generic.

## 3. Realistic content only

Per `04` §0.5 — **never** "Lorem ipsum", "Item 1", "Class A".

- Real UNC course codes and titles (CHEM 262 · Organic Chemistry II, BIOL 252 · Neurobiology, PHYS 118, PSYC 210, SOCI 101).
- Real requirement names from `data/unc-requirements.json` (Power and Society, Natural Scientific Investigation, Research and Discovery).
- Plausible grades, hour counts, and dates — a B+ and a 54% retrievability, not 100% everything.

## 4. Dates are RELATIVE, never hardcoded

Every date is computed from **today at seed time** — "exam in 6 days," "last recall 4 days ago," "covered Nov 6" derived from now. Hardcoded dates rot: within weeks the demo shows overdue exams and stale countdowns, which is worse than empty.

## 5. Seed the INTERESTING states, not the happy path

The demo's job is to make edge cases visible. It must include at least:

| State | Why |
|---|---|
| A **weak** topic and a **never-reviewed** topic | exercises status vocabulary + the coverage guarantee |
| A unit **covered but never reviewed** | fires the Overview warning |
| A class **with no syllabus imported** | fires that recommendation; shows the degraded weeks/weights path |
| A class **with** a parsed syllabus | shows the full week/unit/weight experience |
| **Unassigned material** (files not mapped to a unit) | exercises the coverage meter + positional fallback |
| An **unverified major** in the Tracker | exercises the `◑ not yet verified` treatment |
| **Unplaced requirements** in the Planner | exercises the tray |
| A **BCPM-heavy planned term** and an **under-credit term** | fires both load warnings |
| A **spring-only course** in a plan | exercises the `❄` offering warning |
| Some **graded and some ungraded** work | exercises the what-if calculator and "37% of the grade is in" |
| **Long text** — a 60-char course title, a long note | catches truncation and overflow bugs |
| **One pillar left empty** (e.g. Research) | proves empty states still render correctly *alongside* populated ones |

## 6. Coverage — every pillar, not just Academics

Academics (classes, topics, materials, assignments, notes, contacts) · Clinical (shifts, certifications, skills) · Volunteering · Shadowing · Research · Extracurriculars · MCAT (scores, mistakes, plan) · Overview (roadmap, tasks) · Letters · Essays · Timeline · Profile/CV.

**A pillar with no demo data is a gap** — it means that pillar can't be designed against.

## 7. Implementation notes

- Lives in `src/data/demoSeed.ts` (or equivalent), **separate from the real seed**.
- **Deterministic** — same seed produces the same data, so screenshots and reviews are comparable.
- Generated at toggle time from relative dates; not a static JSON blob with fixed dates.
- Must satisfy the same schemas and migrations as real data — if a migration breaks demo data, it would break real data.

## 8. Acceptance criteria

- [ ] Settings toggle switches demo on/off; namespaces are fully separate; real data is never touched.
- [ ] A persistent `Demo data` indicator shows while active.
- [ ] Reset-to-fresh works.
- [ ] All dates are relative to seed time; nothing hardcoded.
- [ ] Every pillar is populated; at least one is deliberately left empty to prove empty states.
- [ ] Every state in §5 is represented and its warning/treatment visibly fires.
- [ ] Content is realistic — real course codes and requirement names, no placeholder text.
- [ ] Demo data passes the same schema validation and migrations as real data.
- [ ] With demo **off**, all empty states still render correctly.
