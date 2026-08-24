# T1 · Academics — Class Center card decision-record repair

**Stage:** B · DRAWN, NOT CURRENTLY DECIDED  
**Scope:** Repair the paper decision record for the Daily **Class Center card
collection** so that it reflects Andy's later, app-specific visual rulings.
This is a paper-only pass. It does not alter `src/`, card behaviour, store
data, Google Calendar, or any other Academics surface.

## 1. Step-1 audit

### A. Spec → paper

**Pass.** The un-deferred, manifest-cleared Academics rules already have a
reviewable paper owner: Daily/Class Center, Assignments, Class Hub, active
recall, syllabus import and its states, study method, forgetting curve,
exam-prep mode, Materials/lecture capture, Planner, Requirements, Grades &
Archive, Planning decisions/cold start, rollover, Term Report, Forecast
Accuracy, topic linking, and the three Class Types.

Canvas Path B is expressly deferred by `tabs/01-academics.md` §4.1-O; it is
not a missing paper surface. The shipped Canvas-to-Google-Calendar handoff is
already drawn in `academics-materials-extensions.html` and owned by its
decision record.

### B. Mockup → app

The Daily Class Center exists in `src/components/academics/ClassCenter.tsx`.
It has persisted course records, card/list modes, a preview/expand path,
overflow actions, real empty-state recovery, and type-aware card facts. It is
not safe to promote yet because the **paper representation is stale**, not
because the card is absent.

**Measured primary record surface, Aug. 23, 2026** — live local app at
`#/academics?mode=daily&tab=class-center`, first `.academics-class-card`:

| surface | mockup value | app value |
| --- | --- | --- |
| dark canvas → class card | `#211e1a` → `#322e28`; `#3c352d` edge; `13px` radius; `12px` content padding | `rgb(33,30,26)` → `rgb(50,46,40)`; `rgb(60,53,45)` edge; `13px`; `12px` |
| light canvas → class card | `#f7efe1` → `#efe6d4`; `#e9e2d5` edge; `13px` radius; `12px` content padding | `rgb(247,239,225)` → `rgb(239,230,212)`; `rgb(233,226,213)` edge; `13px`; `12px` |

The surface ladder is exact. The remaining divergence is purposeful but not
yet recorded: the older `academics-daily-main-page.html` still shows BCPM on
the primary card and a direct Review action, while later user rulings made the
cards compact and uniform, removed BCPM from the main card, softened class
accents, and moved Review into the peek/overflow workflow. A later direct app
annotation wins over an older screenshot; the paper must now say that plainly.

### C. Already built — preserve, do not rebuild

- `c9a83b8` / `dff85a9` / `dbab247` / `aafe22b` / `7c7f103` — compact card
  collection, softer accents, and reduced vertical dead space.
- `719d867` — deadline wording and primary card timing semantics.
- `997fd0a`, `cdc7308`, and `086e48a` — Class Types is independently built;
  do not reintroduce type badges, BCPM labels, or a separate type card.
- Syllabus import/re-import, material generation, review-session state,
  Planner, Requirements, Grades & Archive, and all later app annotations.

### D. Gate

`BUILD-MANIFEST.md` clears
`01-academics/academics-daily-main-page.html` with **Build? = YES**. This
brief is paper-only regardless; its successor may perform an implementation
or promotion-proof pass only after this record is repaired.

### E. Decision records

`academics-daily-main-page.md` has an Appearance section, so this is not a
missing-file problem. It is now **out of date**: its class-card examples still
document the superseded BCPM chip/direct Review composition. Treat that as a
Stage-B decision failure. The selected visual hierarchy must be recorded in
the decision record and reflected in its paper frame before any future
fidelity work claims a match.

### F. Integrations and services this surface needs

| dependency | classification | what the student sees today |
| --- | --- | --- |
| Local Academics store | **CODE BUILT AND CONFIGURED** | Courses, card mode, card facts, and the preview route have an owner. Promotion still needs a reload/empty-store proof. |
| Google Calendar read context | **CODE BUILT; live configuration not proven by this paper pass** | When connected, dated items can inform class context; otherwise the card uses the student's local class records. The card layout must not pretend an external calendar is connected. |
| Canvas calendar handoff | **CODE BUILT; depends on the Google Calendar connection** | It remains a read-only, review-before-apply material context—not a card-side Canvas client. |

### First blocked stage

**B.** The primary-card drawing and its current decision record disagree with
later explicit product rulings. Stages before B pass: there is paper coverage,
the frame exists, and the record contains an appearance section. Nothing may
be promoted against an obsolete visual target.

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` §4.0, §4.0a, §4.1-G,
  §4.1-N, §6.7, §6.9, §6.11, §6.13, and U-9.
- `mockup-lab/01-academics/academics-daily-main-page.{html,md}`.
- `mockup-lab/01-academics/academics-class-types.{html,md}`.
- `mockup-lab/_shared/_visual-recipes.md`.
- `mockup-lab/VARIANT-LAB.md` — promotion conditions and one-tab ladder.
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`.
- `src/components/academics/ClassCenter.tsx` and `src/index.css` — read-only
  implementation evidence; do not edit in this pass.

## 3. Work — revise the paper target only

### 3.1 Record the selected Class Center card treatment

Amend `academics-daily-main-page.md` and the relevant card examples in
`academics-daily-main-page.html` to make the current rulings explicit:

1. **Uniform compact cards.** Every primary card uses one equal, square-ish
   footprint and a compact vertical rhythm. It has no decorative blank middle
   zone and does not stretch merely because another card has a longer title.
2. **Quiet, class-owned colour.** Keep a restrained course dot and soft class
   accent; do not use a bold full-card fill, permanent glow, or a generic blue
   action that breaks the class identity. The literal page/card ladder above
   stays unchanged.
3. **Useful record facts only.** Keep course code/name, current recorded
   standing where the student entered one, one next dated class item if one
   exists, and one type-appropriate readiness/context line. Do **not** place
   BCPM, a hidden type label, a fabricated denominator, or a cross-course
   score on the main card.
4. **Preview opens the record.** The card's primary interaction is preview /
   open class hub. **Review belongs in the peek/overflow follow-up**, never as
   a permanent action bar inside every primary card. Its play triangle is
   filled white only where that action actually appears.
5. **No invented status.** A card with no next date says that it has no dated
   class item yet and points to the owning add/import route. It never renders
   a demo deadline, countdown, grade, review count, or progress fact.

### 3.2 Make the document usable as a fidelity target

- Add a dated **Later app annotations — authoritative** subsection to the
  decision record. State that these card rulings supersede older inline sample
  chips/actions in the July mockup.
- Keep the existing card ladder, `13px` radius, `12px` content padding,
  hover/focus, mobile wrapping, and reduced-motion decisions. Do not replace
  them with an undifferentiated card-wall recipe.
- Make the HTML sample show the selected compact card anatomy and the
  preview/overflow relationship, so the next fidelity brief has a visible
  target instead of prose alone. No A/B/C decision remains: this is a single
  settled correction, not a competing design treatment.

### 3.3 Decision-proof check

- Verify every card example omits BCPM/type as a primary-card badge.
- Verify no primary-card Review button remains in the sample.
- Verify the sample's class accent is a restrained detail, not a persistent
  full-card colour wash.
- Verify the document says which facts may be absent and where the recovery
  action leads.

## 4. Do not break

- Do not edit `src/`, migrations, `BUILD-MANIFEST.md`, or live integration
  settings in this Stage-B pass.
- Do not erase a later app-specific annotation just because the older July
  drawing differs.
- Do not re-add BCPM, a class-type badge, an always-visible Review button,
  bold colour fills, or dashboard-like card metrics.
- U-9 remains binding: no score, composite, ranking, readiness percentage, or
  progress bar as a card claim. A factual record count is not a substitute for
  a score.
- Keep cards solid. Glass is limited to surfaces that float by the shared
  visual recipe.
- Preserve unrelated dirty briefs, Flashcards V1 specification work, and
  `output/`.

## 5. Done when

- [ ] Daily main's decision record explicitly captures the authoritative
      compact-card rulings and their hierarchy.
- [ ] Its paper example matches those rulings: no BCPM/type chip and no
      permanent card Review action.
- [ ] Dark and paper ladders, geometry, focus, responsive wrapping, and
      reduced-motion intent remain recorded.
- [ ] The empty/no-next-date condition has an honest recovery route.
- [ ] `git diff --check` passes.

## 6. Commit

`docs(mockups): align Class Center card target with approved app annotations`

Keep this documentation/mockup-only commit separate from unrelated work.

## 7. Next stage — not in this brief

**E · FRONTEND / promotion proof.** After this decision repair, re-audit the
Daily Class Center against the updated target: run the handler audit, prove
persisted card behaviour across reload, prove an empty store has no demo
residue, verify the Google Calendar configuration live if card facts depend on
it, measure both themes, and promote only if all six conditions pass. None of
that implementation or promotion work belongs here.
