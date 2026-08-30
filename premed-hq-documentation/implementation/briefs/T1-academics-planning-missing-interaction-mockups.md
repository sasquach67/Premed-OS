# T1 · Academics Planning — missing ruled interaction mockups

**Date:** 2026-08-29  
**Stage:** A · MOCKUP MISSING  
**Scope:** Planning only · mockup/decision work only · do not edit `src/`

## 1. Fidelity audit

### A. Spec → paper

The approved Planning set establishes the two-destination information
architecture, the populated Planner, the integrated requirement and catalog
workspaces, the principal decision states, the cold start, and the complete
Grades & Archive family. It does **not** yet draw six interaction rules that the
canonical Academics specification requires:

| Ruled interaction | Current approved paper | Result |
| --- | --- | --- |
| Add a Summer term or a gap-year span | No Planner or decision-state view shows the creation choice or resulting timeline object | **Missing** |
| Add and edit a term note | No Planner state shows where the note lives, how it opens, or its saved/read state | **Missing** |
| Registration-window nudge | No state shows the contextual nudge, its action, dismissal, or truthful boundary | **Missing** |
| Prerequisite failure at course placement | Requirement preview describes effects after selection, but no drop/place conflict and recovery state is drawn | **Missing** |
| Redundancy warning when a planned course no longer advances an open requirement | Substitute choice does not show the already-satisfied/redundant case | **Missing** |
| AMCAS retake consequence while planning a repeated course | Grades ledger shows repeat history, but Planner has no pre-placement consequence state | **Missing** |

This is the first failing stage. Do not implement or restyle the app until these
states have a visible, reviewable contract.

### B. Mockup → app

The current root already contains substantial Planning behavior, but it is not
a literal translation of the latest approved paper:

| Surface/path | Approved Variant A | Current app evidence | Disposition after Stage A |
| --- | --- | --- | --- |
| Planner plan | Timeline, Unplaced, then full-width Plan trajectory; compact 2×2 requirement summaries | The old outcome rail remains; no Plan trajectory component; requirement rail is a flat four-row slice | Queue Stage E |
| Semester controls | Add course and hover/focus-only edit/remove per editable semester | Add/edit/remove exist, but the action cluster is always visible | Queue Stage E |
| Add course | One integrated catalog workspace with Suggested for the selected major and All UNC courses | Add course opens a separate dialog and removes the persistent inline workbench | Queue Stage E/D after paper gate |
| Course rows | What the course clears plus compact Major/IDEAs/MCAT and risk tags | Rows show only broad science/relevance tags and the first mapped requirement | Queue Stage E |
| Cold start | One central first-fact overlay on a lightly constructed timeline | Each empty lane independently exposes Add course; prior-credit prompt is copy-only | Queue Stage E; handoff must open Grades transcript intake without creating a Course |
| Decision states | Six distinct approved states | App combines Compare/MCAT/advisor content in one generic modal; substitute has no equivalent composition | Queue Stage E |
| Grades & Archive populated views | Dense ledger/GPA/What-if/transcript record canvas | Core calculations and persistence exist; live visual measurement is still required | Re-audit at Stage E/F |
| Populated Ledger → Import transcript → Enter one line manually | Persisted manual record form | Current handler closes the intake without opening or persisting the manual form | Queue P0 Stage D/E |
| Prior credit ownership | Grades & Archive owns AP/IB/transfer/dual-enrollment evidence; Planner shows context + handoff only | Planner filters prior-credit pseudo-terms, but legacy code can still create shadow Course rows | Queue migration/ownership debt at Stage D |
| Term rollover/report/forecast | Contextual, data-backed views at the appropriate boundary | Components exist; entry timing and visual placement need running-app proof | Re-audit Stage E/F |

Focused Planning evidence on 2026-08-29: **13 test files / 92 tests passed**,
covering Planner interactions, requirement audit, Grades & Archive, transcript
intake/empty store, grade ledger, forecast, grade decisions, catalog, planner
model, and reload persistence. Passing tests do not close the paper or visual
gaps above.

### C. Measured mockup → app checkpoint

| Primary surface | Approved mockup | Running app computed result |
| --- | --- | --- |
| Planner surface ladder | Dark `#211e1a → #2b2722 → #322e28`, border `#3c352d`; paper `#f7efe1 → #fffaf0 → #efe6d4`, border `#e9e2d5`; 16px outer and 13px inner radii | **Measured in the active root at 1422×800.** Dark: body `#211e1a`, plan `#2b2722` (885×310, 16px), term `#322e28` (238×218, 13px), requirement rail `#2b2722` (334×466, 16px). Paper: body `#f7efe1`, plan `#fffaf0`, term `#efe6d4`, requirement rail `#fffaf0`. The palette/radii match; the running composition still lacks the approved full-width trajectory, inline catalog, and compact requirement-map structure. |

### D. Already built — do not rebuild

- Planner course edit/remove behavior: `fb92ece`.
- Transcript ingestion foundation: `a5064a6`.
- Term-report routing: `14ee5f8`.
- Transcript-faithful Grades & Archive foundation: `4cfdccd`.
- Existing term/course persistence, local source-versioned catalog data,
  requirement calculations, grade ledger/GPA/What-if calculations, report and
  forecast components, and the two visible destinations.

These commits are provenance, not proof that the current Variant A is built.

### E. Gate and decision files

`BUILD-MANIFEST.md` marks the current Planner, Planning Library, Grades &
Archive, Planning decisions, cold start, rollover, retrospective, and forecast
surfaces `YES`. The same-name decision files record approved Variant A for the
already-drawn views. This brief adds only missing interaction states and must
return them to Andy for explicit approval; it does not reopen the settled
two-destination architecture or promote any app surface.

### F. Integrations and evidence boundaries

- The checked-in UNC catalog snapshot and source-versioned planning records are
  local evidence, not current sections, seats, restrictions, enrollment, or an
  official degree audit.
- ConnectCarolina remains authoritative for live registration and official
  student-specific outcomes.
- Transcript, AP/IB, transfer, and dual-enrollment facts remain student-owned
  Grades & Archive records until saved. Planner may show their supported
  requirement effects, never create a semester named `Prior credit`.
- Registration, prerequisite, redundancy, and retake states must say what the
  local evidence supports and offer manual review when it cannot decide.

## 2. References — read in full before drawing

- `CONTEXT.md`
- `premed-hq-documentation/AGENT-IMPLEMENTATION-GUIDE.md`
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`
- `premed-hq-documentation/implementation/briefs/BUILD-MANIFEST.md`
- `premed-hq-documentation/tabs/01-academics.md`, especially §4.2-C and the
  Planning view/state/acceptance sections
- `premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md`
- `mockup-lab/VARIANT-LAB.md`
- `mockup-lab/01-academics/academics-planner-prototype.html`
- `mockup-lab/01-academics/academics-planner-prototype.md`
- `mockup-lab/01-academics/academics-planning-decisions.html`
- `mockup-lab/01-academics/academics-planning-decisions.md`
- the same-name HTML/Markdown mirrors under
  `premed-hq-documentation/specifications/mockups/01-academics/`

## 3. The work — Stage A only

Extend the existing Planner and Planning decision-state mockups. Do not create a
third Planning destination, a new dashboard, or a second catalog manager.

1. Add a **term creation state** showing both a normal academic term and an
   intentional gap-year span. Summer must be a real compact timeline column;
   gap year must be a visually distinct span, not a fake empty semester.
2. Add a **term note state** anchored to one editable semester. Show collapsed,
   editing, saved, and cancel behavior without turning every term into a form.
3. Add a **registration-window state** as one contextual action near the
   affected term. Keep current-section/enrollment facts explicitly external;
   dismissal must not alter the plan.
4. Add a **placement conflict state** for a course whose prerequisite evidence
   is missing or contradicted. Keep the course unplaced until the student moves
   it, supplies supported evidence, or chooses manual review.
5. Add a **redundancy state** for a course that no longer clears an open
   requirement. Show the consequence and safe choices—keep for another reason,
   replace, or remove—without issuing an official degree-audit verdict.
6. Add an **AMCAS retake planning state** that distinguishes local plan impact
   from the transcript-faithful AMCAS attempt history. Never imply grade
   replacement.

### Treatment variants worth testing

- **Inline in place:** the affected term/course expands locally. Best for term
  notes and lightweight registration context.
- **Inspector substitution:** the existing right rail changes to a focused
  consequence/recovery panel. Best for prerequisite, redundancy, and retake.
- **Small confirmation surface:** reserve for destructive remove/replace
  actions only; do not use it as the default explanation pattern.

Variant A should remain the established composition. These are alternative
interaction treatments within it, not alternative product architectures.

## 4. Exact files authorized for the later mockup pass

Only these files may change when this brief is executed:

- `mockup-lab/01-academics/academics-planner-prototype.html`
- `mockup-lab/01-academics/academics-planner-prototype.md`
- `mockup-lab/01-academics/academics-planning-decisions.html`
- `mockup-lab/01-academics/academics-planning-decisions.md`
- `premed-hq-documentation/specifications/mockups/01-academics/academics-planner-prototype.html`
- `premed-hq-documentation/specifications/mockups/01-academics/academics-planner-prototype.md`
- `premed-hq-documentation/specifications/mockups/01-academics/academics-planning-decisions.html`
- `premed-hq-documentation/specifications/mockups/01-academics/academics-planning-decisions.md`
- `mockup-lab/variant-lab.html` and its specification mirror, limited to the
  Planner/Planning-decision view selectors and cache revision required to make
  these states reviewable

No `src/`, store, migration, test, Daily, flashcard, output, or other Planning
mockup file is authorized by this Stage-A brief.

## 5. Do not break

- Preserve **Planner · Grades & Archive** as the only Planning destinations.
- Preserve inline selected-major requirements, the one-workspace catalog,
  Unplaced, the full-width Plan trajectory, prior-credit ownership, and all
  approved existing views.
- Do not restore Tar Heel Tracker, a standalone Requirements tab, or a
  prior-credit timeline column.
- Do not claim official requirement completion, current availability,
  enrollment eligibility, or AMCAS grade replacement.
- No glass on data surfaces, generic card wall, prose banner, oversized blue
  pill, or new design language.
- Preserve unrelated dirty work and keep source/mirror pairs byte-identical.

## 6. Done when

- [ ] All six ruled interactions have a direct live Variant Lab URL and visible
      Variant A state at the real review viewport.
- [ ] Each state has one immediate decision/action and no redundant reviewer
      prose.
- [ ] Pointer, focus, keyboard, narrow, light, and dark presentations are drawn
      without clipped controls or page-level overflow.
- [ ] Source and documentation mirrors are byte-identical.
- [ ] Status remains unchanged until Andy explicitly approves the new states.
- [ ] The review report lists every URL and the chosen treatment for each state.
- [ ] No application source was edited or called built.

## 7. Commit

`docs(mockups): complete Planning interaction states`

## 8. Next stage — explicitly out of scope

After Andy approves the six states, re-run `TAB-BRIEF-PROMPT.md`. The next
current brief must start at the earliest remaining failure, expected to be:

1. Stage D for prior-credit shadow-record migration/ownership and the populated
   Ledger manual-entry dead end if backend/store work is required; then
2. Stage E for the literal Planner/Grades visual and interaction translation;
   then
3. Stage F for running-app measurements, both themes, persistence, honest empty
   state, integration boundary, control audit, and commit provenance.

Do not execute those stages from this brief.
