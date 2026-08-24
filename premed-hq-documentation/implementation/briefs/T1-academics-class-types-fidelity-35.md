# T1 · Academics — Class types promotion-proof fidelity

**Stage:** E · FRONTEND / PROMOTION PROOF INCOMPLETE  
**Scope:** Verify and close the remaining promotion proof for the approved
Class Types vertical after `997fd0a`. The Writing surface, conservative type
selection, and persisted evidence model already ship. This pass is allowed to
repair only a concrete proof failure it exposes; it is not permission to
redesign Class Center cards, introduce another class type, or build another
Academics feature.

## 1. Step-1 audit

### A. Spec → paper

**Pass.** `tabs/01-academics.md` §3.3 and §4.1-N are covered by the two
approved Class Types drawings and their decision records:

- `academics-class-types.html` / `.md`: one shared Class Hub grammar across
  `stem`, `writing`, and `general`; the Writing draft, readings, and recurring
  feedback substitute layer; compact cards; and type-blind downstream logic.
- `academics-class-type-selection.html` / `.md`: conservative initial type
  suggestion and explicit student choice.

No undisplayed ruled Class Types feature was found. U-9 still forbids a
cross-type score, rank, readiness percentage, or inferred denominator.

### B. Mockup → app

**Visual translation now passes; promotion proof does not yet.**

`997fd0a fix(academics): match Writing class tools to approved type surface`
replaced the old generic Writing grid with the approved compact ladder:

- `Current draft` has the connected Outline → Draft → Revision → Submitted
  pip rail, with the professor deadline and self target visibly separate.
- `Readings` has row-level `Read` / `Skimmed` / `Not started` controls plus
  one factual term dot per actual reading.
- `What keeps coming back` shows only deterministic repeat themes, a real
  stored quote where one exists, and the accurate linked-paper/note source.

**Measured primary surface, Aug. 23, 2026:**

| surface | mockup value | current app value |
| --- | --- | --- |
| dark page → panel → nested row | `#211e1a` → `#2b2722` → `#322e28`; edge `#3c352d`; panel / row `16px` / `11px` | `rgb(33,30,26)` → `rgb(43,39,34)` → `rgb(50,46,40)`; edge `rgb(60,53,45)`; `16px` / `11px` |
| light page → panel → nested row | `#f7efe1` → `#fffaf0` → `#efe6d4`; edge `#e9e2d5` | `rgb(247,239,225)` → `rgb(255,250,240)` → `rgb(239,230,212)`; edge `rgb(233,226,213)` |

Fresh dark, light, and narrow screenshots show no clipped Writing action or
status row. This evidence proves condition 1 for the Writing primary record
surface; it does **not** by itself prove all six promotion conditions.

### C. Already built — preserve, do not rebuild

- `bbac90e feat(academics): add explainable class-type suggestions (§4.1-N)`
  — conservative proposed type only.
- `645c399 fix(academics): wire explainable class-type selection` — selected
  type persists without hidden defaults or reclassification.
- `c2b6f53 feat(academics): make Writing reading and feedback signals honest
  (§4.1-N)` — V34 reading-list states, debt suppression, raw feedback,
  exact recurrence, migration, and persistence.
- `997fd0a fix(academics): match Writing class tools to approved type surface`
  — the visual ladder and focused UI coverage.

Preserve later user-approved annotations: compact square cards, softened
accents, popup-only Review, material flows, syllabus import/re-import, and
the existing type-blind GPA/BCPM/requirements/Planner/Overview seams.

### D. Gate

`BUILD-MANIFEST.md` clears `01-academics/academics-class-types.html` with
**Build? = YES**. The Class Types vertical may be repaired and verified; no
other Academics surface is included by this brief.

### E. Decision records

**Pass.** Both Class Types `.md` records specify appearance as well as
behavior: shared warm-solid ladder, panel/row geometry, equal density,
keyboard focus, reduced motion, and no type badge. The class-types decision
record lacks the final implementation commit and six-proof record; that is a
promotion-record gap, not a design decision gap.

### F. Integrations and services

| dependency | classification | current consequence |
| --- | --- | --- |
| Local persisted Academics store | **CODE BUILT AND CONFIGURED** | Type, draft, readings, reading-list boundary, and raw feedback persist locally. |
| Syllabus ingestion | **CODE BUILT; source completeness is student-confirmed** | Individual parsed/entered readings must keep `unknown` / `partial` honest. |
| AI, Canvas/LMS, external catalog, file storage | **NOT REQUIRED** | Class Types uses student-owned persisted records only. No cloud setup can block this vertical. |

### First blocked stage

The visual Stage E work is present, but **Stage F is not yet provable**:

1. The full handler audit has not been rerun for the Class Types scope after
   the new rail/dropdown/collapsible controls.
2. The focused test proves in-memory rerender durability, not an actual
   persisted-store reload for every ruled Writing action.
3. No empty-store assertion proves that class cards, the daily list, and the
   Writing Hub do not retain demo facts after clearing the store.
4. The decision record does not yet name `997fd0a` or contain all six proofs.

This is a narrow **E fidelity/proof pass**. A failed proof may reveal a real
handler, persistence, or empty-state defect; fix only that defect. Do not
promote in advance.

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` §3.3, §4.1-N, and §6 U-9.
- `mockup-lab/01-academics/academics-class-types.{html,md}`.
- `mockup-lab/01-academics/academics-class-type-selection.{html,md}`.
- `mockup-lab/_shared/_visual-recipes.md`.
- `src/components/academics/ClassHub.tsx` and `ClassCenter.tsx`.
- `src/lib/academics/writingEvidence.ts`, `src/store/store.ts`, and
  `src/store/migrations/writingEvidenceV34.test.ts`.
- `mockup-lab/VARIANT-LAB.md` and
  `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`.

## 3. Work — proof and repair only

### 3.1 Handler audit

1. Re-run the `4fe210f` Button / `DropdownMenuItem` / `ContextMenuItem`
   handler audit against `ClassHub.tsx` and `ClassCenter.tsx`.
2. Inspect every reported item by role. An `asChild` link is valid only when
   it has a real route; a disabled action needs an honest disabled reason;
   ornamental text must not be a button.
3. End with zero inert interactive controls in the Class Types surface. Paste
   the exact command and zero-result output into this decision record.

### 3.2 Persisted reload proof

Add or extend focused tests so a fresh hydrated store—not merely a React
rerender—retains all ruled Writing evidence:

- selected type remains `writing` after reload;
- draft stage and the self target remain independent of an absent professor
  deadline;
- each reading status and `readingListState` remains unchanged across
  `unknown`, `partial`, `complete`, and `not-applicable`;
- only `complete` may display factual debt; the other three never do; and
- one raw feedback note stays non-recurring, while two exact normalized notes
  become one attributable recurring theme without invented quotes or papers.

Use a store serialization/hydration seam already used in this repository. Do
not mock a fake persistence layer that the app itself never calls.

### 3.3 Empty-store proof

Empty the persisted Academics Class Center store in a focused test and prove:

- no Class Hub card or daily signal keeps demo titles, deadlines, reading
  counts, feedback quote, or grade values;
- empty Writing rows direct the student to an actual add/paste action rather
  than fabricate an assigned list or a debt count; and
- no surface turns a cleared Writing record into BCPM, GPA, requirements,
  Planner, Overview, or cross-type readiness content.

### 3.4 Visual and accessibility regression check

Re-capture the populated Writing Readings surface in dark and light, compare
the full surface ladder to the table above, then check a narrow viewport:

- stage rail buttons are reachable by keyboard and have visible focus;
- reading status controls and reading-list actions stack without clipping;
- `prefers-reduced-motion` removes only rail/pip transition, not feedback;
- term dots remain actual row markers, never a bar or percentage.

Do not modify global radius, general cards, app-specific annotations, or
themes merely to make a screenshot look closer.

### 3.5 Promotion record—only after every proof passes

If and only if conditions 1–5 pass:

1. append the commit hash, date, all six proofs, and the measured ladder to
   `mockup-lab/01-academics/academics-class-types.md`;
2. change the Class Types entry in `mockup-lab/variant-lab.html` to
   `status:"built"`; and
3. commit the proof/test/record change separately:

   `chore(mockups): promote Academics Class Types to built`

If any proof fails, fix the direct defect in this pass and do **not** promote.

## 4. Do not break

- Exactly three configurations; no fourth type, hidden default, type badge,
  separate page, auto-reclassification, or type-based GPA/BCPM/requirements
  calculation.
- V34's reading-list boundary and deterministic feedback recurrence.
- Compact cards, popup-only Review, material intake/generation, syllabus
  import/re-import, and all later app annotations.
- U-9: no score, composite, rank, readiness, percentage, inferred reading
  denominator, or faux progress indicator.
- Unrelated working-tree docs, Flashcards V1 spec, `output/`, and older briefs.

## 5. Done when

- [ ] Handler audit has zero inert Class Types controls, with output recorded.
- [ ] A real persisted-store reload preserves every ruled Writing fact.
- [ ] Empty state contains no demo residue or inferred Writing debt.
- [ ] Dark/light/narrow visual checks still match the measured ladder.
- [ ] The decision record contains the six proofs and implementation hash.
- [ ] The lab entry is promoted only if all six conditions actually pass.
- [ ] Focused tests, full suite, build, and `git diff --check` pass.

## 6. Commit

If code repairs are needed:

`test(academics): prove Class Types persistence and empty-state honesty`

If the six conditions pass, make the separate promotion commit named in §3.5.
Keep unrelated work separate.

## 7. Next stage — not in this brief

**F · BUILT / promotion** is not assumed. It occurs only after this brief has
produced all six proofs. If a proof exposes a defect outside this narrow
surface, stop and write the next one-stage brief for that defect instead of
expanding this pass.
