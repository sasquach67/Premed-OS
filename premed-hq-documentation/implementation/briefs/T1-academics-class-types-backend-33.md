# T1 · Academics — Writing class evidence states

**Stage:** D · BACKEND MISSING
**Scope:** Complete the two locked Writing-type data contracts that the shared
Class Hub and Class Center already depend on: an honest reading-list boundary
and recurring (not one-off) feedback themes. This is not permission to redesign
the class cards, the class-type picker, Materials generation, or any other
Academics vertical.

## 1. Step-1 audit

### A. Spec → paper

**Pass.** The active Class Types vertical is fully drawn and has a complete
decision record in `mockup-lab/01-academics/academics-class-types.md`:

- exactly three configurations (`stem`, `writing`, `general`);
- a Writing draft rail with the student target distinct from the professor
  deadline;
- reading states and plain-language reading debt only when a full reading list
  exists; and
- “What keeps coming back,” which appears only after a feedback theme repeats.

The current selection surface is separately drawn in
`academics-class-type-selection.html`; its approved implementation shipped in
`645c399 fix(academics): wire explainable class-type selection`.

### B. Mockup → app

**Fail — the shared page has most controls, but two of its facts cannot be
truthful.**

1. `AssignedReading` tracks each row’s completion state but neither it nor
   `ClassWorkspace` records whether the student has a complete term list,
   a partial list, no list from the syllabus, or a class with no readings.
   `ClassHub.tsx` can therefore calculate and display “N readings behind” from
   a partial list. Its invisible “Reading list incomplete” text is not a data
   contract and cannot suppress that claim in the Class Center card.
2. `WritingTools()` groups and renders *every* `FeedbackNote`, including a
   group with one note labelled “One returned note.” §4.1-N explicitly says a
   single criticism is **not** a recurring theme and must not surface as one.
   There is also no direct, attributable way to record a feedback note in the
   Writing hub; demo data is the only current writer.

### C. Already built — preserve, do not rebuild

- `PaperDraft`, `AssignedReading`, and `FeedbackNote` are established
  writing-only records. `migrateClassTypesV10` already creates their arrays;
  retain dormant records if the class later changes type.
- The shared `ClassHub` already selects the exact type-specific tabs and
  actions. Keep one shared page; do not fork STEM, Writing, and General pages.
- The class cards already use per-row verbs (`Recall`, `Draft`, `Read`, `Log`)
  and have type-blind GPA/BCPM/requirements/planner logic. Do not add a type
  badge or type reads to calculations.
- `645c399` already implemented the add-class selection behaviour. Do not
  modify the conservative `proposeClassType()` contract in this pass.

### D. Gate

`BUILD-MANIFEST.md` clears the Class Types vertical with **Build? = YES**.
No manifest edit is needed.

### E. Decision record

**Pass.** `academics-class-types.md` records both behaviour and appearance,
including the partial-reading degradation paths and the “only when repeated”
feedback condition. The app is missing its durable state, not a decision.

### F. Integrations and services

| Dependency | Classification | Consequence |
| --- | --- | --- |
| Local persisted Academics store | **CODE BUILT AND CONFIGURED** | Own the reading-list boundary and feedback records locally. |
| Syllabus ingestion | **CODE BUILT; may be incomplete** | It may supply individual readings, but it must never imply that it supplied a complete list. |
| Canvas/LMS reading list | **NOT REQUIRED** | Do not fetch, scrape, or claim a list from an LMS in this pass. |
| AI / OpenAI / Anthropic | **NOT REQUIRED** | List completeness and repeated-label grouping are deterministic user-owned facts. |

**First failed stage: D.** Paper, decisions, manifest authorization, and the
type-selection implementation are in place. The runtime cannot yet preserve
or reason from the two facts required to make its Writing signals honest.

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` §3.3 and §4.1-N, especially
  items 57–59 and “When the syllabus can’t be parsed.”
- `mockup-lab/01-academics/academics-class-types.{html,md}` — required
  Writing density, reading-degradation copy, and recurring-feedback surface.
- `src/lib/types.ts` — `ClassWorkspace`, `AssignedReading`, `FeedbackNote`.
- `src/components/academics/ClassHub.tsx` — `WritingTools()` and the
  type-specific stat strip.
- `src/components/academics/ClassCenter.tsx` — `classSignal()` and shared
  compact cards.
- `src/store/store.ts` and `src/store/migrations/` — fresh, idempotent store
  migration convention and tests.

## 3. Work

### 3.1 Persist the reading-list boundary

1. Add one optional, writing-only-safe field to `ClassWorkspace`:

   ```ts
   readingListState?: 'unknown' | 'partial' | 'complete' | 'not-applicable'
   ```

   It means *coverage of the course’s assigned-reading list*, never how much
   the student has completed. It is a class fact, not an `AssignedReading`
   row and not a generated score.
2. Add V34 migration and wire it into `migrateAll` and
   `CURRENT_STORE_VERSION`. Existing workspaces receive `unknown` without
   touching any existing field, array, course, draft, reading, or feedback
   record. It must return the identical object on a second run and work with
   frozen input.
3. Reading-list states have one exact meaning:

   | State | What the app may say | What it must not say |
   | --- | --- | --- |
   | `unknown` | “No full reading list recorded.” | A denominator, “behind,” or a debt count. |
   | `partial` | “You’re adding the list as you go.” | A denominator, “behind,” or a debt count. |
   | `complete` | Per-row status and a debt count relative to that list. | That the list came from a source other than the one the student recorded. |
   | `not-applicable` | “This class has no assigned readings.” | A missing-data warning or zero-reading progress. |

4. In Writing → Readings, make the boundary explicit and student-controlled:

   - retain **Paste a reading list** and save it as `complete` only when the
     student confirms that it is the term list;
   - retain **Add reading** as the inline/as-assigned path and set/retain
     `partial`;
   - add a clear **Add this week’s reading** shortcut, also `partial`;
   - provide an explicit “Mark list complete” confirmation and “This class has
     no assigned readings” action. Neither action deletes reading rows.

   The current state and its consequence must be visible in normal text at the
   top of the Readings panel, not hidden in an `sr-only` node.
5. Change `classSignal()` and every Writing stat/card surface so an overdue
   count is calculated **only** for `complete`. In `unknown`/`partial`, use a
   `Read` verb only when it names a concrete next reading; otherwise use the
   honest boundary copy. Do not surface a pseudo-progress bar, composite,
   readiness value, or type badge.

### 3.2 Make feedback themes truly recurring

1. Add a compact **Log feedback** affordance in the Writing feedback section.
   It records the student-entered theme, optional professor quote, and an
   optional linked paper/assignment. This is raw evidence; no AI grouping,
   inference, score, or sentiment classification.
2. Normalize only for exact deterministic matching (trim, case-fold, collapse
   internal whitespace). A group becomes “What keeps coming back” only when
   it has **two or more** feedback records with that normalized theme.
3. A one-off note remains stored and usable in exports/term reports, but it
   is not rendered as a recurring theme on the Writing page, Class Center
   card, daily list, or Overview. The feedback section should instead state
   plainly: “Themes appear after the same feedback comes back on another
   paper.” Do not fabricate a theme from similar wording.
4. For a repeated theme, render the human label, exact stored professor quote
   when present, count of papers/notes, and the linked paper names where
   available. A repeated theme across multiple comments on the *same* paper
   is still one paper; label the evidence accurately rather than calling it
   “across papers.”

### 3.3 Keep the approved visual hierarchy

1. Keep Writing equal in density to STEM: one shared banner/stat strip/panel
   ladder. The new boundary notice is a quiet solid row inside Readings, not a
   new dashboard card or an empty STEM placeholder.
2. Use the existing warm solid panel ladder and the literal shared recipe
   radii/borders. Do not introduce glass into Readings, feedback, or the
   feedback-entry form.
3. Status is carried by readable text and the existing quiet success/warning/
   danger chips. No gauges, percent complete, “reading readiness,” or U-9
   score/rank/progress claim.
4. Preserve keyboard operations, focus-visible rings, and reduced motion.
   On narrow screens, the notice, reading rows, and feedback form stack; no
   horizontal clipped control row.

### 3.4 Tests and proof

Add focused tests covering:

- V34 adds `unknown` without altering any other serialized key; repeated
  migration is a no-op and frozen input is safe.
- `unknown` and `partial` have no reading denominator or “behind” claim even
  if an individual overdue row exists; `complete` may show the concrete count;
  `not-applicable` has no warning/debt.
- paste/inline/this-week/complete/not-applicable actions persist the correct
  state through a reload and never discard rows.
- one feedback note is stored but does not render a theme; two exact normalized
  notes render one theme; two similar but non-identical labels do not merge;
  linked papers and quotes remain attributable.
- switching away from Writing and back preserves drafts, readings, feedback,
  and `readingListState`; GPA, BCPM, credits, requirement audit, Planner, and
  Overview do not read it.

Run the focused tests, full suite, and production build. Capture a fresh light
and dark screenshot of (a) partial readings and (b) a repeated feedback theme.

## 4. Do not break

- Exactly three class types and their shared one-page configuration.
- The real assignment deadline versus a draft’s self-imposed target.
- Syllabus import/re-import, class-type selection, compact cards, the current
  user-approved Review popup behaviour, and later app annotations.
- Existing feedback records, term reports, backup/restore, and dormant
  Writing data on type changes.
- Type-blind GPA, BCPM, credits, requirements, Planner, and Overview logic.
- Any unrelated dirty briefs, flashcard specification, or `output/` files.

## 5. Done when

- [ ] A Writing class can truthfully distinguish unknown, partial, complete,
  and no-reading-list states after reload.
- [ ] No partial/unknown list ever produces a reading-debt denominator or
  “behind” claim.
- [ ] One feedback note is retained but is not presented as a recurring theme.
- [ ] A repeated, exact student-entered theme names its real evidence.
- [ ] The new V34 migration and store version are tested for identity,
  idempotence, and frozen input.
- [ ] Focused tests, full suite, and production build pass.
- [ ] Fresh light/dark visual evidence is recorded before a future Stage E
  fidelity brief.

**Expected implementation commit:**
`feat(academics): make Writing reading and feedback signals honest (§4.1-N)`
