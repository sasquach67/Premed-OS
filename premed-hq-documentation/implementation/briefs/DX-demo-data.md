# DX brief — site-wide demo data

**Read ONLY this file plus `implementation/demo-data.md`.** Global rules are in the repo's `CLAUDE.md`.
**If something you need isn't here, read the named spec section and tell me the brief was incomplete.**

Independent of D2–D6 — can run any time. Best run **early**, since every later chunk is easier to build and verify against populated screens.

---

## 1. Goal

One keystroke to view the entire app **populated with realistic data**, without touching real user data. An empty app can't be designed against.

## 2. Non-negotiables

- **Separate namespace.** `hq-demo:*` vs `hq:*` in localStorage. Demo mode never reads, writes, merges, or migrates the real store. Toggling off restores real data untouched.
- **Visible indicator** — a persistent `Demo data` badge in the shell chrome while active.
- **Relative dates only.** Everything computed from *today at seed time*. Hardcoded dates rot into overdue exams within weeks.
- **Realistic content** — real UNC course codes and real requirement names from `data/unc-requirements.json`. **No** "Lorem ipsum", "Item 1", "Class A" (`04` §0.5).
- **Deterministic** — the same seed produces the same data, so screenshots stay comparable.
- **Same schemas + migrations as real data.** If a migration breaks the demo seed, it would break real data.
- **Empty states stay testable.** With demo off, every empty state must still render correctly — demo mode is not an excuse to skip them.

## 3. One persona, app-wide

A single fictional student — **UNC Neuroscience B.S., junior, MCAT ~14 months out** — consistent across every pillar, so cross-tab behaviour actually works in demo (a grade shows in GPA *and* the requirement audit *and* Overview).

## 4. Seed the interesting states, not the happy path

This is the point of the chunk. The demo must make edge cases visible — see `demo-data.md` §5 for the full table. At minimum: a weak topic · a never-reviewed topic · a covered-but-unreviewed unit · a class **with** a syllabus and one **without** · unassigned material · an unverified major · unplaced requirements · a BCPM-heavy term · an under-credit term · a spring-only (`❄`) course · a mix of graded and ungraded work · one very long title · **one pillar left deliberately empty**.

## 5. Coverage

Every pillar: Academics · Clinical · Volunteering · Shadowing · Research · Extracurriculars · MCAT · Overview · Letters · Essays · Timeline · Profile/CV. **A pillar with no demo data is a gap.**

Where a pillar isn't built yet, seed the data anyway so the screens populate the moment they exist.

## 6. Where it lives

`src/data/demoSeed.ts` (or equivalent) — **separate from the real seed**. Generated at toggle time from relative dates, not a static blob.

## 7. Done when

- [ ] Settings toggle switches demo on/off; namespaces fully separate; real data provably untouched.
- [ ] Persistent `Demo data` indicator while active; reset-to-fresh works.
- [ ] All dates relative to seed time.
- [ ] Every pillar populated; one deliberately empty.
- [ ] Every state in `demo-data.md` §5 present, with its warning or treatment visibly firing.
- [ ] Content realistic — real course codes and requirement names.
- [ ] Demo data passes the same schema validation and migrations as real data.
- [ ] With demo off, all empty states still correct.
- [ ] `npm run build` passes.

## Commit (required)

`npm run build` must pass, then **commit before reporting**: `feat(app): site-wide demo data`.
If unrelated pre-existing changes are in the working tree, commit them **separately** with their own message — never bundled into this chunk.

## 8. Report

Diff summary + a list of which §5 states you seeded and where each becomes visible in the UI.
