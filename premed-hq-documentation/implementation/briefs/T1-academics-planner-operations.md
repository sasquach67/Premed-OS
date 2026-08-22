# T1 · Academics — Planner operational completion

**Stage:** D · FRONTEND FOUNDATION EXISTS; PERSISTED PLANNING BEHAVIOUR IS INCOMPLETE

**Scope:** Complete the approved Planner as the place to build an actual future
course sequence. This is one persisted planning vertical: explicit term slots,
term locks/notes, a deterministic placement preview, and an honest comparison
of existing saved plans. It does **not** invent a UNC course catalog, a degree
audit, enrollment data, or a recommendation engine.

---

## 1. Audit before implementation

### A. Spec → paper

**Pass.** The manifest-cleared planning surfaces together expose the remaining
Planner behaviour:

| Ruled behaviour | Reviewable source |
| --- | --- |
| Whole-plan term board, course consequences, MCAT divider, unplaced tray, and outcome rail | `mockup-lab/01-academics/academics-planner-prototype.{html,md}` — A + C ruled |
| Preview, comparison, registered boundary, substitutes, MCAT timing, and advisor export | `mockup-lab/01-academics/academics-planning-decisions.{html,md}` |
| No-course recovery | `mockup-lab/01-academics/academics-planning-cold-start.{html,md}` |

The following have no verified source/model and are explicitly out of scope:

- Catalog-wide substitutes, ranked course suggestions, a registration-window
  notification, cross-pillar load calculation, or a graduation-date claim.
- Completion mathematics beyond the Tracker's stated evidence boundary. The
  current requirements corpus has no double-count-cap or catalog-alternative
  data; the Planner must name that absence rather than simulate it.
- Drag-and-drop planning. It may be considered later, but it is never the only
  placement interaction and is unnecessary for this shipped path.

### B. Mockup → app

The main Planner structure landed in `088144b`; saved-plan restore landed in
`504d63e`. It is a real foundation, but it does not yet complete the approved
planning interaction:

| Approved behaviour | Current app evidence | Result |
| --- | --- | --- |
| Horizontal course board / selectable inspector / MCAT divider / unplaced requirements | `src/components/academics/PlannerBoard.tsx` | **Built foundation.** Preserve it. |
| Named snapshots + explicit restore diff | `src/components/academics/PlanningDecisions.tsx`, `src/lib/academics/savedPlans.ts` | **Built foundation.** Preserve it. |
| Chips state what they clear and show an offering/critical-path condition | `PlannerBoard.tsx:105-124` only shows code/title/credits/BCPM; detail is only partially in inspector | **Divergent.** The consequence is not visible while scanning the board. |
| Add a summer/gap/future term, place an existing unplaced/planned course, and inspect consequences **before** commit | planner is read-only; editing is split into `TrackerTable` below `Academics.tsx:259-292` | **Missing.** The Planner cannot yet perform its own stated job. |
| A registered/locked term with an explicit student-owned reason | `plannerTerms()` derives `registered` from course status only | **Missing.** There is no persisted term boundary, lock reason, or safe future-term distinction. |
| Term notes and stable plan comparison | `SavedPlan` stores course placements only | **Partial.** Plan name/restore work, but slots, locks, and their notes do not travel with a snapshot. |
| Requirement preview including a clear/remaining diff and double-count treatment | `courseEffects()` lists matching requirements | **Partial.** No placement preview; there is no source field for double-count rules, so it must be disclosed as unavailable rather than guessed. |

#### Measured visual proof

The current automated test profile has no persisted course record, so it can
only render the honest Planning cold start; it cannot truthfully measure the
primary populated Planner surface. Existing post-Aug-19 Materials measurements
do not prove this independent Planner board. Before promotion, measure a
populated Planner record in **both themes** with computed styles and compare
the complete page → panel → course-ticket ladder against the approved mockup.
Do not use a token name or a screenshot impression as evidence.

### C. Already built — preserve, do not rebuild

- `gpaStats`, `plannerTerms`, `mcatDividerAfter`, `courseEffects`,
  `outcomeProjection`, and `prereqVsMcat` own their current derivations.
- `PlanningColdStart`, MCAT timing, and the advisor snapshot are complete
  local-record flows.
- `SavedPlan`, `planDiff`, and `applyPlanRestore` own restore safety: a graded,
  completed, or in-progress course is never moved.
- `TrackerTable` remains the full course ledger/editor; Planner adds a
  constrained placement interaction, not a duplicate ledger.
- Tar Heel Tracker remains the audit. Planner consumes its named requirement
  records but does not claim official completion.

### D. Gate

`BUILD-MANIFEST.md` marks `academics-planner-prototype.html`,
`academics-planning-decisions.html`, and `academics-planning-cold-start.html`
**YES**. This implementation is authorized. Do not edit the manifest.

### E. Decision record

**Pass.** A + C is locked: the horizontal whole-plan board is primary and the
selected-course inspector replaces the outcome rail. The decisions record
also locks neutral plan comparison, a factual registered boundary, and a
substitute as a comparison—not an automatic replacement.

### F. Integration classification

All work in this brief is local, deterministic, and versioned-store backed.
No API key, Supabase secret, catalog scrape, Google integration, or Andy
configuration is required.

---

## 2. References — read before changing code

- `premed-hq-documentation/tabs/01-academics.md` §4.2-C/C1/C2/C3 and its
  planning acceptance criteria.
- `mockup-lab/01-academics/academics-planner-prototype.{html,md}` — A + C.
- `mockup-lab/01-academics/academics-planning-decisions.{html,md}` — preview,
  compare, locked, substitute, and export states.
- `src/components/academics/PlannerBoard.tsx`, `PlanningDecisions.tsx`,
  `PlanningColdStart.tsx`, and `src/pages/Academics.tsx`.
- `src/lib/academics/planner.ts`, `savedPlans.ts`, `src/lib/types.ts`, and
  `src/store/store.ts` / migration tests.
- `mockup-lab/_shared/_visual-recipes.md`,
  `implementation/MOCKUP-TRANSLATION-CONTRACT.md`, and component inventory.

---

## 3. Build — one safe planning loop

### 3.1 Add a minimal, durable term model

1. Add a course-planning term record to the existing `academics.classCenter`
   model. It needs a stable id, display label, order, optional known
   start/end/date metadata, kind (`standard`, `summer`, or `gap`), optional
   student-authored note, optional `lockedAt`, optional lock reason, and normal
   created/updated timestamps. It must not claim a registrar or calendar
   connection.
2. Add an optional stable planner-term id to a `Course`. A course keeps its
   human-readable `term` exactly as today; the id makes a saved slot, rename,
   lock, and comparison stable without rewriting historical coursework.
3. Add the next versioned, lossless, fresh-object migration after v28. It
   derives a term record only from each existing distinct non-empty course
   label, preserving the label/order and marking it as legacy-derived. It
   creates **no lock**, no summer/gap assertion, no offering fact, no date, and
   no enrollment claim. Existing courses retain every field; a second run is a
   no-op. Register it in `migrateAll`, update `CURRENT_STORE_VERSION`, and
   test frozen input, old data, idempotence, backup/restore, and trash paths.
4. A term is protected when the student explicitly locks it or it contains a
   factual completed/in-progress course. The UI must say which condition
   applies. A lock prevents Planner moves into/out of that term; it never
   enrolls, drops, replaces, or edits an external schedule.

### 3.2 Make Planner placement deliberate

1. Keep the board as the primary surface. Add only compact, contextual actions:
   **Add term**, **Add summer/gap**, and on an editable selected/unplaced course
   **Choose term**. Do not add a second Planner tab, route, dashboard, or
   permanent sub-tab row.
2. Use an explicit term picker—not drag-only interaction. It lists only
   editable student-created/existing slots and includes **New term**. Selecting
   a term opens a preview; it does not write immediately.
3. The preview names, before a student confirms:
   - source term → destination term;
   - requirement mappings it records as clearing, each explicitly `verified`
     or `inferred` with source label;
   - requirements still open afterward;
   - downstream unlocks and an existing course-record offering warning;
   - why an action is unavailable (locked source/destination, protected course,
     missing term, or no mapping record).
   It may not invent an offering calendar, prerequisite, replacement, or a
   count that a missing double-count policy cannot support.
4. Confirm writes only the selected mutable course’s planner-term id and
   display term. Cancel is a real no-op. Existing restore rules remain the
   final safety check even if a caller attempts a protected move.
5. Make chips scanable: code, title, credits, BCPM/AO, concise named
   `Clears:` text, mapping confidence where one exists, and an existing
   record-backed offering/critical-path marker. Do not duplicate every
   inspector paragraph onto the chip; its detail stays in the C rail.
6. Keep the unplaced tray visible directly with the board. It includes both
   unmet named requirements and any scheduled-course record with no usable
   term, distinguished clearly. No course or requirement disappears because
   there is no slot.

### 3.3 Finish slots, locks, and comparison without fake catalog data

1. A future empty term can be created with a label and kind. Summer and gap are
   visual planning slots, not course offerings. A gap is a labelled span and
   must not silently calculate credits, GPA, clinical hours, or a graduation
   date.
2. Term notes are student-authored and visible only when useful: a quiet note
   affordance in the term header and detail in the inspector/preview. They are
   never generated or auto-filled.
3. Locking is a confirmable user action that retains a reason. It must display
   the actual boundary on the column and recovery text explaining that only
   future editable terms can respond. Unlocking is explicit and does not
   mutate courses.
4. Extend `SavedPlan` so it captures planned term slots, term notes, and lock
   metadata in addition to placements. Existing legacy plans remain valid,
   with an honest “term metadata was not saved with this older plan” line.
   Restore previews every changed course **and** planner-slot metadata; it
   leaves protected course data and unsupported legacy fields untouched.
5. Enhance comparison to show two neutral plan sheets with the named sequence,
   slot notes/locks, known prerequisite-vs-MCAT facts, and named open
   requirements. It must not call either plan recommended, calculate a new
   readiness score, or claim an official graduation date.
6. Keep `Substitute choice` dormant unless the app has a user-supplied or
   officially verified alternative record. Existing generic course names or
   external search results are not substitutes. The honest state says no
   verified alternative is recorded and routes to the course/requirement editor.

### 3.4 Outcome rail and visual fidelity

1. Preserve the A + C handoff: selecting a course replaces the rail; closing
   restores it; selecting a second course replaces inspector contents; looking
   changes nothing.
2. The outcome rail may show only derived, named-input facts: cumulative/BCPM
   from graded credits, excluded planned/in-progress credits, named open
   requirements, and prereqs relative to a recorded MCAT date. If the required
   data for graduation/suggestions/watch-outs is absent, show a short dormant
   reason instead of zeroes, false precision, or generic recommendations.
3. Use the existing `Card`, `Button`, `Dialog`/sheet, `InfoTip`, and interactive
   card primitives. No forked Planner-card system.
4. Maintain the approved hierarchy in both themes: outer page, solid planning
   panel, then dense course ticket; no glass in dense planning data. At narrow
   width, columns retain horizontal scrolling, rail stacks below, and the
   placement preview is a full-width contextual sheet. Keyboard access,
   visible focus, Escape/cancel, and reduced motion must work.

---

## 4. Do not break

- U-9: no readiness score, composite, rank, ungrounded percentage, or
  “on-track” verdict.
- Do not move a completed, graded, in-progress, or locked-term course; never
  write a registrar/enrollment action.
- Do not pretend a course mapping, double-count cap, offering, substitute,
  cross-pillar workload, or graduation date exists without a named record.
- Do not merge Planner with Tar Heel Tracker or Grades & Archive, remove the
  cold start, rebuild saved-plan restore, or alter the existing requirements
  corpus in this pass.
- Do not copy inline mockup CSS, hardcoded colours/fonts/radii, change global
  tokens/auth/Supabase, touch `BUILD-MANIFEST.md`, or stage unrelated dirty
  work.

## 5. Done when

- [ ] Existing data migrates losslessly; migration is fresh-object and
  idempotent; legacy plans and courses survive.
- [ ] A student can add a future/summer/gap slot, name it, note it, lock it,
  and reload it without a new localStorage key.
- [ ] An editable existing course can be previewed then placed through a
  keyboard-accessible picker; cancel changes nothing; a protected/locked move
  is visibly unavailable and impossible to force through restore.
- [ ] The preview and inspector distinguish verified/inferred mappings and
  disclose missing cap/offering/substitute data instead of guessing.
- [ ] Saved-plan comparison/restoration handles new slot metadata explicitly
  and preserves all historical protections.
- [ ] `npm run test`, `npm run build`, `git diff --check`, empty-store flow,
  both themes, keyboard-only paths, and reduced motion pass.
- [ ] A populated Planner board is measured in both themes against its mockup
  ladder before it is promoted to `built`.

## 6. Commit

`feat(academics): complete safe Planner placement and term records (§4.2-C)`

## 7. Next stage

Run the promotion audit only after the user has exercised this real Planner
loop and visual measurements exist. Course-catalog substitutes, official
offering data, registration nudges, and cross-pillar planning remain separately
scoped data/integration work—not quiet follow-ons to this brief.
