# T1 · Academics — Grades & Archive: transcript-faithful ledger, paired GPA, and one-home What-if

**Stage:** C · DECIDED, NOT BUILT
**Scope:** Build the three ruled `Grades & Archive` views — Ledger, GPA, and
term-level What-if — and complete the one shared course-level What-if owner in
Class page → Assignments. This is one vertical: its frontend and its
deterministic data/rule layer ship together. It does **not** start Canvas Path B,
Atlas course intelligence, grade-distribution research, or another Planning
surface.

## 1. Fidelity audit

### a) SPEC → PAPER — ruled features without a surface

**None that are un-deferred.** The ruled grade-ledger, AMCAS-shaped record,
dual-GPA, academic-year trend, status-as-filter, and scenario surfaces all have
a drawing in `academics-grades-archive.html`. The one apparent gap is not a
paper gap: Canvas Path B is explicitly deferred in `tabs/01-academics.md`
§4.1-O, and UNC grade distributions are a research/licensing decision, not a
feature to approximate.

### b) MOCKUP → APP — current state

| Mockup/product view | Existing app surface | Match? |
|---|---|---|
| Ledger A · Terms as cards | `Academics.tsx` composes `TermRollover`, `TermReportPanel`, `TranscriptRecordsPanel`, `ClassCenter archiveOnly`, and `GradeDecisionsSection` as a stack | **No.** It is not one ledger; status filtering, term cards, and record-first hierarchy are absent. |
| GPA A · Dual hero | `gpaStats()` plus scattered stat cards; no paired owner view | **No.** It neither distinguishes local from AMCAS semantics nor shows the mandated explanation, rule version, or academic-year trend. |
| What-if A · Landing then inputs | `Academics.tsx` has a local letter-grade simulator; `ClassHub.tsx` has a category-average scratch calculator | **No.** They are two incomplete calculators, not the ruled Planning summary → Class Assignments handoff. |
| Transcript records | `TranscriptRecordsPanel.tsx` persists exact, student-entered strings | **Partial.** The capture exists, but the ruled Ledger is not the record's home. |

**Measured surface / honest limitation.** The running app has no existing
Grades & Archive owner panel to compare with the ruled Ledger A panel; it is a
stack of unrelated surfaces. Do not fabricate a CSS comparison from token
names. This is the baseline measurement that must be captured before the visual
commit:

| surface | mockup literal | running-app result |
|---|---|---|
| Ledger A term panel | `rgb(43, 39, 34)` / `#2b2722`, `#3c352d` border, `16px` radius | **No equivalent element exists.** Measure the new owner panel with `getComputedStyle` in both themes before calling it faithful. |

The inner rung is equally binding: `#322e28` / `rgb(50, 46, 40)` at `13px` in
warm dark; paper is `#fffaf0` panel → `#efe6d4` inner with `#e9e2d5` borders.
Solid surfaces only; the mode pill and banner stat strip are the only allowed
glass here.

### c) Already built — preserve, do not rebuild

| Existing work | Preserve / reuse | Commit |
|---|---|---|
| Transcript-faithful course record capture and student-controlled export | Reuse `TranscriptCourseRecord`; never normalise exact transcript strings | existing shipped surface |
| Grade decisions states | Keep as its own routed/surface owner; do not fold it into a fake transcript record | `c5a95d9` |
| Term rollover | Keep its ritual and archive behavior; the ledger reads its resulting records rather than replacing it | `9e7fd73` |
| Planner term board / inspector | Keep Planning ownership and its existing route | `088144b` |
| Topic ↔ assignment linking, learning signals, syllabus import | Out of this vertical | `606ed65`, `e44b4ca`, `b21d89f`, `e638095` and follow-ups |
| Term Report | Keep as a separate completed-term report, not a generic archive card | `3116c8f` |

### d) Gate

`implementation/briefs/BUILD-MANIFEST.md` lists
`01-academics/academics-grades-archive.html` as **Build? YES**. This brief is
therefore cleared for implementation. Do not alter the manifest.

### e) Decisions record

`mockup-lab/01-academics/academics-grades-archive.md` now records both
behavior **and** appearance for all three A treatments: exact warm-dark/paper
surface ladders, radii, hierarchy, empty state, glass boundary, and the
Planning-to-Class-Assignments handoff. It rules A for Ledger, GPA, and What-if
in commit `6c4c0fb`. This passes Stage B.

### f) Integrations and services

| Dependency | State | Treatment in this brief |
|---|---|---|
| Local persisted coursework and transcript records | **Built** | Read and extend only through the existing store; no server dependency. |
| AMCAS rule snapshot | **Code/data missing** | Add a versioned, official-source rule data seam before presenting AMCAS-derived arithmetic. It must name its guide/version/checked date in the UI. |
| Canvas Path A (calendar review) | **Code built, configuration separately unverified** | Not an input required by the Ledger. It may add data only after a student confirms it; do not block this vertical or create Canvas Path B. |
| Canvas Path B / course grade distributions | **Correctly not built** | Explicitly out of scope; no placeholder import button or invented data. |

The app must never present a local `gpaStats()` result as AMCAS simply because
it has a number. Until a record and a fresh rules snapshot support it, the
AMCAS side is dormant with the reason.

### Stage result

Stages A and B pass: the ruled, appearance-complete A treatments exist and the
manifest authorizes their drawing. The first failed stage is **C**: the existing
app has partial data and two incomplete calculators, but not the decided
screen or the rule-safe backend behind it.

## 2. References

Read these before editing:

- `mockup-lab/01-academics/academics-grades-archive.html` — implement A only.
- `mockup-lab/01-academics/academics-grades-archive.md` — binding behavior and
  literal visual ruling.
- `mockup-lab/_shared/_visual-recipes.md` — use values literally; no copied
  inline mockup CSS.
- `premed-hq-documentation/tabs/01-academics.md` §4.2, §4.2-D, §6.8, §6.9 and
  the locked AMCAS data posture following §4.2-D.
- `premed-hq-documentation/implementation/component-inventory.md` — reuse
  existing primitives before adding one.
- `premed-hq-documentation/general.md` — especially U-5, U-7, and U-9.
- `src/lib/types.ts` (`TranscriptCourseRecord`, `Course`, `GradeCategory`),
  `src/lib/selectors.ts`, `src/components/academics/TranscriptRecordsPanel.tsx`,
  `src/pages/Academics.tsx`, and `src/components/academics/ClassHub.tsx`.

## 3. The work

### 3.1 Establish one Grades & Archive owner

- Replace the current archive-tab stack with a single focused owner component
  (for example `GradesArchive.tsx`) with its three product views: **Ledger**,
  **GPA**, and **What-if**. It is a view within Planning; do not add a sixth
  Academics tab or a separate Archive destination.
- Keep the existing route/query behavior for Planning. A selected view may be
  URL-addressable, but it must not duplicate records or introduce an unrelated
  store slice.
- Move unrelated widgets out of this surface rather than hiding them beneath
  it. Term rollover and Term Report remain reachable through their existing
  contextual entry points; Grade Decisions remains its own behaviorally real
  surface. Do not delete a user-facing annotation or feature just because it
  was not redrawn here.

### 3.2 Ledger A — terms as transcript-context cards

- Render actual persisted records only. Group the durable ledger by recorded
  term/year and institution context; preserve every attempt, withdrawal, prior
  institution, and exact course string. **Never prettify, infer, or replace**
  `courseNumberExact`, `titleExact`, `creditsExact`, or `gradeExact`.
- Archive is a filter on the same ledger. A superseded UNC attempt is visibly
  retained and explained; it is never removed to make a later grade look
  better. A current course, transcript record, and course workspace may be
  linked, but none may silently overwrite another.
- Reuse the existing record-entry and evidence/export pathway. Export must be
  clearly a student-controlled coursework file, **not** an official transcript,
  AMCAS submission, or a claim of registrar accuracy.
- Empty: “Add prior or current coursework to start a transcript-faithful
  ledger.” Give one direct record path and no empty table chrome, GPA, trend,
  or sample entries.
- Follow Ledger A's literal ladder: warm-dark page `#211e1a` → term card
  `#2b2722`/`#3c352d`/`16px` → row/filter `#322e28`/`13px`; paper
  `#f7efe1` → `#fffaf0`/`#e9e2d5`/`16px` → `#efe6d4`/`13px`.

### 3.3 GPA A — paired facts, fresh rules, no false AMCAS math

- Add a small, pure `gradeLedger` analysis module. It must return an explicit
  **insufficient-data/reason** state rather than a numeric zero. Keep its
  inputs immutable and cover it with unit tests; UI components only format its
  results.
- Separate the two facts by their own named inputs and rules:

  - **UNC/local GPA:** calculate only from records that are explicitly eligible
    under the app's configured local policy. Label what it includes.
  - **AMCAS preview:** calculate only from transcript-faithful, explicitly
    classifiable records using a **versioned data object**, not hardcoded
    conditionals. It includes every supported attempt and all entered
    postsecondary institutions; it excludes P/F/no-quality-point outcomes with
    the reason visible. BCPM is content-classification evidence, never a guess
    from a course title or department.

- The rule data must carry official source URL, guide/version, checked date,
  grade-conversion table, eligible course types, and classification posture.
  Cite guide/version beside every AMCAS-derived display and show a quiet
  “verify against the official guide in your application year” reminder. If an
  exact current rule is not source-verified, leave that part dormant — do not
  substitute internet folklore such as an unverified “50% content” threshold.
- AMCAS display truncates, not rounds: `3.667 → 3.66`. Store/compute the full
  value; format with a dedicated truncation formatter rather than `fmtGpa()`.
  Every repeat remains in the calculation. Do not reuse current `gpaStats()`
  as AMCAS: it excludes `!inResidence` courses and cannot meet the all-
  institutions rule.
- Render the two GPA facts at equal visual weight with a plain-language delta
  explanation sourced from actual inclusion differences. Do not invent a
  causal explanation if the inputs cannot support one.
- Render an academic-year trend only for years containing real qualifying
  records. A partial year says it is partial; no missing year, zero line,
  projection, rank, score, composite, or GPA progress bar is allowed.
- Empty: “Record graded coursework to compare your UNC and AMCAS GPA.”
  No number or trend before the evidence exists.

### 3.4 What-if A — one engine, two locations, scratch work only

- Replace the generic Planning `WhatIf` with A's term-level scenario landing:
  a student can add hypothetical **course / credits / letter / classification**
  assumptions and see separately labelled local and AMCAS effects. All
  scenario state is ephemeral scratch work: it never changes canonical courses,
  transcript records, or reports and is cleared on reload unless the user
  explicitly promotes something through an existing data-entry path.
- The Planning view's selected-course card is only a compact summary and a
  direct route to `Class page → Assignments` carrying the selected `courseId`.
  Do not create a second full grade engine, re-ask for course data, or make the
  user enter weights twice.
- Make ClassHub's existing `WhatIf` the single full course calculator. It uses
  the same pure engine and shows: recorded category weights, locked-in work,
  remaining-work assumption, inverse solve (“what score is needed”), highest
  leverage and mathematically irrelevant categories, and any GPA knock-on that
  has valid inputs. It must say exactly what assumptions were used.
- `GradeCategory.policyNote` is verbatim source/personal text. **Never parse
  free-text policy language into grade behavior.** A drop-lowest, replacement,
  curve, cap, or extra-credit rule may influence arithmetic only when it is a
  separately structured, visibly editable student-confirmed rule with a
  source/evidence reference. Otherwise list the policy and state that it was
  not applied — no fake precision.
- For insufficient category/weight data, show A's friendly path to Assignments
  setup, not a simulated percentage. Do not apply an instructor-discretionary
  curve, and do not persist a scenario.

### 3.5 Fidelity, accessibility, and responsive behavior

- Build the ruled A compositions, not a generic row of cards. On narrow widths,
  term cards and the paired GPA figures stack while their reading order and
  equal status remain clear. Tables may become transcript card rows; exact
  strings must remain selectable/readable.
- Use existing Button/Select/Dialog primitives and token classes. No mockup
  inline CSS, new blue, glass on ledger surfaces, decorative GPA gauges, or
  hardcoded/demo student records.
- Keyboard: every filter, view selector, row action, scenario input, and
  ClassHub handoff is reachable and labelled. Respect reduced motion. Keep
  visible focus and contrast in paper and warm-dark themes.

## 4. Do not break

- Preserve all existing coursework, `TranscriptCourseRecord`, evidence refs,
  term reports, grade decisions, planner terms, and course routes. **Archive,
  never delete.**
- Do not fork the existing components or two calculators. One pure grade engine
  is shared by Planning's summary and ClassHub's full calculator.
- Do not mutate canonical data from a what-if calculation, infer BCPM, invent
  a grade, make an AMCAS/applications claim without source-backed data, or
  collapse all facts into an academic score (`U-9`).
- No Canvas Path B, API token storage, grade-distribution scraping, calendar
  write path, or network request belongs in this build.
- If new persisted structured policy data or AMCAS eligibility metadata is
  genuinely necessary, add **one** lossless, versioned, idempotent migration
  with frozen-input and double-run tests. Do not add a migration merely to
  save scratch scenarios.
- Preserve app-specific visual annotations unless they directly conflict with a
  locked rule; this brief translates the mockup without deleting approved
  app-specific changes.

## 5. Done when

- Ledger, GPA, and What-if A are all rendered through one Grades & Archive
  owner; neither the old generic `Academics.tsx` simulator nor a duplicated
  ClassHub engine remains.
- `rg "gpaStats\\(|fmtGpa" src/` shows no AMCAS display path relying on the
  in-residence-only helper; AMCAS rules live in freshness-tracked data, and the
  UI cites its source/version plus application-year verification reminder.
- Unit tests prove: all explicit attempts remain; all explicitly eligible
  institutions contribute; P/F has a named exclusion; `3.667` presents `3.66`;
  unsupported/missing classification is dormant; no trend renders from empty
  data; no What-if input mutates persisted state; structured policy is applied
  only when explicitly confirmed; free-text policies are never parsed.
- An interaction test proves the Planning compact card opens the selected
  course's Assignments calculator without duplicating data. Reload proves only
  canonical records persist; What-if scratch work does not.
- Empty-store audit proves no sample course, GPA, trend, repeat, or scenario
  survives. Each view shows its approved one-line empty state.
- Run the inert-control audit on this surface and its calculator handoff;
  zero `Button`, `DropdownMenuItem`, or `ContextMenuItem` instances lack a
  handler, and deliberately disabled controls state why.
- Visually measure the actual owner panel and inner row with
  `getComputedStyle` in warm dark and paper, then record the literal values in
  the implementation report. Compare the full page → panel → inner ladder;
  token names alone are not proof.
- `npm run test` and `npm run build` pass. Commit only files in this vertical;
  unrelated current worktree edits stay separate.

## 6. Commit

`feat(academics): build transcript-faithful Grades & Archive`

## 7. Next stage — not in this brief

Run the six-condition promotion audit for `academics-grades-archive` after
implementation. It must verify both themes, handlers, persistence, empty-store
honesty, integration configuration, and the commit before setting its lab
status to `built`. Canvas Path B, distributions, and Atlas course intelligence
remain explicitly out of scope.
