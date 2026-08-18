# T1 · Academics — the forgetting curve

**Stage:** C · DECIDED, NOT BUILT

**Scope:** The §4.1-L sawtooth panel only — its component, its entry points,
and the "not enough history yet" state. Frontend and the read model together.

> ## ⛔ GATE — THIS BRIEF MAY NOT BE EXECUTED YET
>
> **`academics-forgetting-curve.html` has no `BUILD-MANIFEST.md` row.**
> Neither do the other eight surfaces drawn this pass. The manifest's default
> is `NO`, and **only Andy adds a row.**
>
> This brief is written because the router lands here and the prompt says the
> brief still gets written when the gate is shut. **Do not build from it until
> a row exists and reads `YES`.**
>
> **Why this surface and not one of the other eight:** it is the smallest, it
> is fully decided (C1 ruled Aug 18), and it is the only one whose maths is
> already in the repo and dead. If Andy would rather clear Study method,
> Learning signals, or another first, this brief is cheap to rewrite — the
> audit below applies to all nine.

---

## 1. Fidelity audit — completed before this brief

### a. Spec → paper

**No Stage-A blocker.** Every ruled Academics feature has a drawing.

### b. Mockup → app

| Surface | Drawn | Decided | Built |
|---|---|---|---|
| Syllabus import | ✅ 4 frames | ✅ appearance | ✅ **translated in `d992efe`** |
| Exam prep | ✅ | ✅ | ✅ `1fb6ea7` |
| **Forgetting curve** | ✅ `0e90cdd` | ✅ C1 ruled `7b8d373` | ❌ **this brief** |
| Study method | ✅ | ✅ C2 ruled | ❌ no manifest row |
| Learning signals · Grade decisions · Materials extensions · Lecture capture · Planning decisions · Cold start · Term rollover | ✅ | ✅ | ❌ no manifest row |

**The maths is already here and unused.** `src/lib/academics/fsrs.ts:48`
exports `topicRetrievability(state, now)`, and
`rg "topicRetrievability" src/ | rg -v fsrs.ts` returns **zero** hits. This
brief does not write a decay model; it renders the one that shipped.

### c. Already built — do not rebuild

- Syllabus import full-screen mode + the `documentKind` classifier: `d992efe`.
- Exam prep temporary mode: `1fb6ea7`.
- FSRS scheduling and `topicRetrievability`: already in `fsrs.ts`. **Do not
  write a second decay implementation.**
- The review log: `reviewEvents` is append-only, **written for real** by
  `src/pages/AcademicRecallSession.tsx:268` and read by `ClassHub.tsx:436`.
  This surface therefore runs on real records from day one.

### d. Gate

**BLOCKED — see the banner above.** `BUILD-MANIFEST.md` has no row for this
mockup. The two Academics rows that are `YES` (`exam-prep-mode`,
`syllabus-import`) are both built.

⚠️ **C3 remains open**: the manifest marks `academics-requirements.html` `YES`
and that file does not exist. Untouched here.

### e. Decisions files

`academics-forgetting-curve.md` records behaviour **and** appearance, and C1 is
ruled. **Fully specified.**

### f. Integrations and services

**None.** §4.1-L: *"Deterministic from FSRS stability/retrievability. No API."*
Everything renders from `TopicFsrsState` and `reviewEvents`, both local.
**No ANDY CHECKLIST items.**

---

## 2. ⚠️ A separate finding — Academics cannot reach F, and not because of this

`src/pages/Academics.tsx:747` renders, on the shipped Tar Heel Tracker:

> *"Only Neuroscience B.S. is modeled. Other programs are UI placeholders until
> official rules are seeded."*

**Stage F requires that nothing on the tab runs on mock or placeholder data.**
By the app's own admission, the requirement audit does for every program except
one. This is not a bug and not this brief's to fix — it is
`tabs/01-academics.md` §14 open decision **#5**, which names it a *"research
blocker"* needing a sourced dataset of IDEAs in Action gen-eds, med prereqs,
and per-major requirements from `catalog.unc.edu`.

**Recorded so the tab is not promoted to `built` while it is true.** It also
connects to **C3** — the missing `academics-requirements.html` is the drawing
for this same surface.

---

## 3. References

| What | Where |
|---|---|
| **The drawing — 3 frames** | `mockup-lab/01-academics/academics-forgetting-curve.html` |
| **The decisions, incl. the C1 ruling** | `mockup-lab/01-academics/academics-forgetting-curve.md` |
| Binding spec | `tabs/01-academics.md` §4.1-L |
| ⚠️ Literal visual values | `mockup-lab/_shared/_visual-recipes.md` |
| The model to render — **do not rewrite** | `src/lib/academics/fsrs.ts` |
| The real review log | `src/lib/types.ts` → `ReviewEvent`; written at `AcademicRecallSession.tsx:268` |
| Where it mounts | `src/components/academics/ClassHub.tsx` — Topics rows, and the exam-scope panel |
| The rules | `specifications/05-experience-pillar.md` (`U-9`) |

---

## 4. The work

### 4a. The curve component

A presentational component taking one topic's `TopicFsrsState` and its
`ReviewEvent[]`. **It owns no scheduling and no persistence.**

- **One topic at a time.** Never all eighteen.
- Each review is a **vertical reset to 100%**; each reset **flattens the
  following decay**, so the gaps widen. Derive the shape from
  `topicRetrievability` between successive review timestamps — **do not
  hardcode the mockup's sample geometry.**
- **History solid, projection dashed, and the dash begins exactly at the last
  real review.** The drawing is verifiable on this point: history ends and the
  projection starts at the same x. Never blur the two.
- **The legend is always present**, three cards, plain language, never a hover.
- `aria-label` describing the shape, as the drawing carries.

### 4b. The exam line — C1, ruled, and binding

**The figure and the band label are ONE component and ONE render.** There is no
configuration in which the percentage appears without its reading.

| Projected retention | Reading | Consequence clause |
|---|---|---|
| **≥ 80%** | Should hold | no action implied |
| **55–79%** | Fading | one more pass would hold it |
| **< 55%** | Likely gone by then | worth rebuilding before the exam |

Bands are computed, never authored per-case. **No fourth band.** If the class
has no exam date, the curve draws without the exam line and says nothing about
an exam that is not scheduled.

### 4c. Not enough history

**Fewer than two `ReviewEvent`s for the topic → no curve.** Render the honest
state as drawn: the two-dot indicator, the plain headline, and the two real
actions. **Never fabricate a shape from one point.** The panel stays; only the
curve is withheld.

### 4d. Entry points

From a **topic row** (anywhere topics are listed) and from the **exam-scope
panel**. Not a tab, not a page, not a new route.

---

## 5. Do not break

- **Do not write a second decay model.** Read `topicRetrievability`.
- **Do not modify** `fsrs.ts` scheduling, `reviewTopic`, or the `ReviewEvent`
  shape. No store schema change; no migration.
- **No `U-9` violation beyond the ruled C1 exception.** No mastery score, no
  grade or letter for the topic, no comparison to other topics or to other
  students. The exam-day figure is the *only* number about the student on this
  surface, and it never renders without its band label.
- **Do not fork** an existing chart or card component.
- `_visual-recipes.md` values are **literal**.
- **Do not touch the ~114 pre-existing working-tree changes.**
- **Do not add or edit a `BUILD-MANIFEST.md` row.**

---

## 6. Done when

- [ ] **A manifest row exists and reads `YES`.** Without it, stop here.
- [ ] `rg "topicRetrievability" src/ | rg -v fsrs.ts` now returns hits — the
      dead export is live.
- [ ] `git diff --stat src/lib/academics/fsrs.ts` shows **no change**.
- [ ] History renders solid and the projection dashed, with the dash starting
      at the last real review — asserted in a test, not just by eye.
- [ ] A topic with 0 or 1 reviews renders "not enough history yet" and **no
      polyline is emitted**.
- [ ] The exam-day figure never renders without its band label — asserted in a
      test. Bands match §4b exactly.
- [ ] A class with no exam date renders the curve with no exam line.
- [ ] The curve opens from a topic row and from the exam-scope panel.
- [ ] `rg -n -iE "mastery|score|rank|composite"` over the new component returns
      nothing.
- [ ] **Real records only** — the panel reads `reviewEvents`, never a fixture.
- [ ] Signed-out mode; both themes; keyboard reachable; `aria-label` present;
      reduced motion honoured.
- [ ] `npm run test` and `npm run build` pass.
- [ ] Compared against all three frames, and the decision record receives the
      commit.

---

## 7. Commit

```
feat(academics): render the forgetting curve from real review history (§4.1-L)
```

---

## 8. Next stage — NOT in scope

**Study method · UNPATCHED 2026 (§4.1-K)** is the natural follow-on: drawn,
decided, C2 ruled, and also without a manifest row. After that, the remaining
seven.

**The tab cannot reach F** until §2's placeholder finding is resolved, which is
research (§14 #5), not implementation.
