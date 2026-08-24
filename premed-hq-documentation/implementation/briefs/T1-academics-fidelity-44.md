# T1 · Academics — Package A Class Hub and syllabus-import fidelity

**Stage:** E · FRONTEND FIDELITY

**Scope:** Translate only the already-working private setup journey’s visual
system: the existing **Class Hub** (all class-type tabs it already exposes) and
the temporary **Syllabus Import / Re-import** mode. This is not a new feature
pass. It must preserve the current parser, one-store import/re-import behavior,
and every newer app-specific visual annotation Andy has made. Class Center
cards, Materials generators/folder intake, Planner, Requirements, and other
Academics surfaces are explicitly out of scope.

## 1. Step-1 audit

### A. Spec → paper

**Pass for the private Package-A setup journey.** The relevant ruled states
already have drawings:

- `mockup-lab/01-academics/academics-class-hub.html` and its decision record
  cover the class-owned banner and configured Overview, Materials, Topics (or
  Readings), Assignments, and Notes views.
- `mockup-lab/01-academics/academics-syllabus-import.html` and its decision
  record cover upload, confirm-before-apply, re-import diff, no-parse, and
  wrong-document recovery.
- `academics-empty-states-prototype.html` already supplies the cold Class
  Center recovery into this flow; it is not being restyled here.

One ruled capability has no private Package-A surface: a **cross-user,
anonymous, term-and-section-scoped shareable parsed structure**. It is not
implemented or implied by local syllabus import, and remains deliberately out
of scope. It needs its own Stage-A mockup/privacy pass rather than a silent
extension of this screen.

### B. Mockup → app

| surface | mockup value | app value / finding |
| --- | --- | --- |
| Class Hub dark page field | `#211e1a` | last running measurement recorded Aug 24: `rgb(33, 30, 26)` / `#211e1a`; the source-resolved dark value remains `#211e1a` |
| Class Hub solid panel | `#2b2722` | source resolves `.class-hub-panel` through `--card` to `#2b2722`; it has **not** been freshly measured on the current route |
| Class Hub inner record row | `#322e28`, with `#3c352d` border | source resolves `--muted` / `--border` to those values; it has **not** been freshly measured on the current route |
| banner stat strip | `rgba(20,26,34,.50)`, blur `16px`, `13px` radius | prior running measurement was `rgba(20, 26, 34, 0.62)`: too opaque; fresh measurement is required before and after this pass |
| Syllabus Import review | page `#211e1a` → solid review `#2b2722` → editable field `#322e28` | `SyllabusImportMode.tsx` renders the correct semantic regions, but there is no current two-theme route measurement proving their ladder or 372px rail fidelity |
| Syllabus Import review rail | `1fr 372px`, solid-with-depth | the app declares `lg:grid-cols-[1fr_372px]`; layout exists, but visual/presentation proof is missing |

The browser-controlled preflight could not read the current local app route in
this planning turn after the prior session’s tab became stale. That is **not**
a visual pass. The execution starts by collecting the fresh computed-style
baseline above from the running app before changing CSS; do not replace it with
token-name assertions.

### C. Already built — preserve, do not rebuild

- `7d2c5e4` — scoped/unscoped syllabus-import ownership and re-import
  persistence invariants.
- `9c1fa65` — cold-import workspace retention.
- `93bfeb8` — identity-based `syllabusReimportDiff()` and stable diff rules.
- `be10e7f` — Class Center empty/persistence boundary.
- `c684b35` — reviewed Materials-folder intake, which is a separate surface.
- Existing `ClassHub.tsx`, `SyllabusImportMode.tsx`, parser, local syllabus
  retention, and Class Center entry-point routing are the authoritative
  behavior to keep.

### D. Manifest gate

**Pass.** `BUILD-MANIFEST.md` marks
`01-academics/academics-class-hub.html` **YES**. The current source journey is
also cleared by the existing Academics finish-line audit; no manifest change is
part of this brief.

### E. Decision records

**Pass.** Both `academics-class-hub.md` and
`academics-syllabus-import.md` record behavior **and appearance**: banner
hierarchy, literal dark ladder, solid-versus-glass boundary, group density,
review rail, recovery distinctions, and narrow-width behavior. No A/B/C
decision remains open for this private setup flow.

### F. Integrations and services this surface owns

| dependency | classification | student-facing truth |
| --- | --- | --- |
| PDF / DOCX / text syllabus extraction | code built; no external configuration required | parsing is local and yields a proposal, never an automatic write |
| local source retention and re-import identity diff | code built; no external configuration required | a retained syllabus is private to the browser/device and supports explicit keep/accept choices |
| AI, Drive, Calendar, Canvas, remote sharing | not required by this private flow | none may be added or implied by this fidelity pass |
| shareable parsed structure | absent by design for this scope | the app must not claim a classmate/shared syllabus feature |

There is **no Andy console/API/OAuth checklist** for this bounded surface.

## 2. Why this lands at Stage E

Stages A–C pass: the private setup route is drawn, visually decided, manifest
cleared, and implemented. Stage D now passes through the focused ownership and
hydration tests shipped in `7d2c5e4`. Stage E fails because the current app has
not freshly proved the full Class Hub and temporary import-mode compositions
against their drawings in both themes; the last running stat-strip measurement
also showed a literal opacity mismatch.

This pass is visual fidelity only. It must not alter parser, diff, retention,
store, or route semantics.

## 3. Work — make the existing journey look like its approved drawings

### 3.1 Take an actual baseline before any CSS change

With the normal local app running, visit a real Class Hub and each of these
temporary import states: Upload, Review, Re-import, No parse, and Wrong
document. In dark and light, record `getComputedStyle` for the page field,
panel, inner decision object, banner stat strip, and the import rail. Capture
a desktop and narrow-width screenshot for the two primary screens.

If a live route crashes or fails to render, stop styling that route, record the
route/stack, and open the smallest regression brief. Do not conceal a runtime
failure with mock data or a screenshot of the lab.

### 3.2 Class Hub — retain dense class records, align the visual ladder

- Keep the existing configured tabs and class-type rules. A STEM class may
  expose Topics; Writing may expose Readings; General must not receive a fake
  memory tab. Do not force a literal fifth tab into a type that does not own it.
- Reproduce the approved banner hierarchy: themed art/gradient → scrim → the
  **one** floating glass stat strip → underline-only tabs on the banner edge.
  The title, course-color dot, subtitle, class facts line, primary action, and
  overflow stay in their existing functional positions.
- Use the literal warm-dark ladder at dark mode: outer `#151310`, page
  `#211e1a`, panel `#2b2722`, inner row `#322e28`, border `#3c352d`,
  foreground `#ece3d4`, muted text `#a89c8c`. The banner is the documented
  blue bloom and warm shift; it must not collapse to a flat dark fill.
- The only glass surface is the banner stat strip (and existing mode pill where
  present): `rgba(20,26,34,.50)`, `blur(16px) saturate(1.1)`, inset
  highlight, white-alpha border, `13px` radius. Panels, grouped lists,
  notes, records, fields, badges, and action menus are solid-with-depth.
- Retain 16px outer panel radius, 13px inner object radius, the compact
  grouped-list rhythm, visible focus, and underline-only active-tab state. Do
  not turn the class page into a long wall of equal rectangles.
- Light theme follows the same semantic ladder using its documented live
  values (`#f7efe1` page, `#fffaf0` panel, `#efe6d4` inner, `#e9e2d5`
  border), rather than forcing the dark hex values into light mode.

### 3.3 Syllabus Import / Re-import — one temporary mode, not a wizard

- Preserve the temporary, full-screen-like composition and its current entry
  scopes. It is one screen that changes state: upload → parse → review/apply;
  it is not a permanent tab, a dialog, a stepper, or a generic file page.
- Match the approved reading hierarchy: wide desktop review is `1fr 372px`,
  with a sticky, **solid** Apply rail; upload is a centered narrow reading
  column; primary content and rail stack in the same review-first order on
  narrow screens.
- Preserve the ruled review order—identity, exams, grade weights, units,
  deadlines, policies, logistics. Clean groups collapse to factual summaries;
  groups needing a student look open by default. Each field keeps its
  source quote/location and visible manual edit affordance.
- Distinguish recovery states visually without changing their behavior:
  no-parse is a contained recovery with manual paths; wrong-document is a
  successful read that uses the Academics accent and a zeroed **Nothing to
  apply** rail; re-import is a compact editorial diff with visible default
  Accept/Keep choices and unchanged-count collapse.
- Keep the same banner’s shallow layered treatment and the glass boundary.
  Dropzone, review groups, evidence quotes, diff rows, and Apply rail use the
  solid ladder only. Do not introduce glass cards, a new sidebar system, or
  a mascot/prompt panel that is not in the drawing.

### 3.4 Translation constraints and accessibility

- Prefer existing `PageHeader`, `StatStrip`, `AnimatedFileUpload`,
  `MascotNote`, `Collapsible`, and configured Cards. If a shared component
  needs an optional class-scoped styling prop, prove its other consumers do
  not change; do not globally restyle unrelated tabs.
- Preserve all existing button/menu handlers and keyboard behavior. This
  brief may fix visual focus, labels, or layout only; a changed parse/apply,
  import, re-import, file-retention, or navigation meaning is out of scope.
- Hover/focus animation uses the shared `.15s cubic-bezier(.16,1,.3,1)`
  behavior, and `prefers-reduced-motion` resolves motion directly.
- Do not add a readiness score, mastery percentage, composite, ranking, or
  projection marker. Existing factual course grades remain records; they must
  not be transformed into a new U-9-style score.

## 4. Do not break

- Do not modify `syllabusParser`, `syllabusReimport`, local retention,
  migration/version logic, Course/ClassWorkspace ownership, accepted/keep
  semantics, or any of the four import entry points.
- Do not alter Class Center card hierarchy, Review button behavior, class-card
  percentages, app-specific visual annotations, Materials output intake,
  reviewed folders/Drive, Planner, Requirements, transcript import, or
  Calendar/OAuth.
- Do not create a shared syllabus store, cloud upload, Canvas REST fetch,
  remote file sync, or a second importer/diff engine.
- Do not use generic dashboard walls, extra primary tabs, unlabeled bars, or
  broad global-token changes that wash out a different surface.
- Keep unrelated worktree changes out of the execution commit.

## 5. Done when

- [ ] A fresh running-app measurement table records actual computed values for
      Class Hub and Syllabus Import in both dark and light, and each follows
      the specified page → panel → inner-object ladder. The banner strip is
      literally `rgba(20, 26, 34, 0.5)` in the dark Academics banner state.
- [ ] Desktop and narrow screenshots show Class Hub’s configured tab views,
      and Import upload/re-import/recovery preserve the approved hierarchy
      without overflow or a permanent wizard/tab.
- [ ] The inert-control audit reports zero handlerless `Button`,
      `DropdownMenuItem`, and `ContextMenuItem` in the touched screens;
      every active control still routes/acts as before.
- [ ] `rg -n 'function syllabusReimportDiff' src` finds exactly one existing
      diff function, and the execution diff contains no changes in
      `src/lib/academics/syllabusParser.ts`,
      `src/lib/academics/syllabusReimport.ts`, store migrations, or
      persistence helpers.
- [ ] Existing focused Class Hub/import tests, full `npm test -- --run`,
      `npm run build`, and `git diff --check` pass.
- [ ] Do not promote either page in this brief. The next six-condition audit
      must still prove interaction, reload persistence, honest empty store,
      configured integrations, and recorded implementation commit.

## 6. Commit

`fix(academics): align Class Hub and syllabus import fidelity (§4.1-M)`

Commit only the visual translation and its narrow tests. Commit unrelated work
separately.

## 7. Next stage — explicitly out of scope

After this visual pass, run the six-condition page-promotion audit for the
private Package-A journey. It may promote only if both pages visually match in
both themes, every control has a handler, reload and empty-store proofs pass,
and no required integration is mocked. Materials generation, Drive, Calendar,
shared parses, and the remaining Academics packages do not enter this pass.

