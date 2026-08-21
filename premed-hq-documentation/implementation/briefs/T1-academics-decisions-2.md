# T1 · Academics — remaining owner appearance decisions

**Stage:** B · DRAWN, NOT DECIDED

**Status:** Decision-record only. Do not edit `src/`, the store, migrations, Edge Functions, provider configuration, or the build manifest in this pass.

## 1. Audit before this brief

### A. Spec → paper

**Pass.** `a4de557` completed the final five paper gaps: Professor evidence, Writing readings/draft work, concept-canvas retrieval, actual-assessment catalog/take-and-return, and transcript-fidelity enrollment/export. Earlier Academics drawings already cover Daily, assignments, class workspace, review, materials, syllabus/re-import, class types, empty states, study method, forgetting curve, learning signals, grade decisions, lecture capture, topic linking, Planner, Tar Heel Tracker, Grades & Archive, planning decisions, cold start, and term rollover.

`academics-mode-switch.html` and `class-center-study-hub.html` remain `NO` in the manifest and are out of scope. No ruled Academics feature lacks a reachable mockup surface.

### B. Mockup → app

| Family | Existing app evidence | Match status |
|---|---|---|
| Daily / Class Center and assignments | `src/pages/Academics.tsx`, `src/components/academics/ClassCenter.tsx` | Behaviour ships, but pre-Aug-19 visual work has no current promotion proof. |
| Class Hub / Writing | `src/components/academics/ClassHub.tsx` has Writing tools, reading states, drafts, and feedback | Partial: shared workspace behaviour exists; the newly drawn Professor-evidence and Writing-work treatments are not translated. |
| Review | existing Review Session and topic-link helpers | Partial: recall behaviour exists; concept-canvas/link/recovery states are not translated. |
| Materials / generated study tools | `MaterialCatalog.tsx`, `RevisedNotesPanel.tsx`, `generateRevisedNotes.ts`, flashcard and browser `.apkg` seams | Partial: source-grounded output paths exist; the newly drawn actual-assessment catalog/take/return states are not translated. |
| Grades / planning | Grades, Planner, requirement, syllabus, and term components exist | Partial: visible record/planning behaviour exists; current visual fidelity and newly drawn transcript fidelity/export need later proof. |

#### Measured primary record surface — Aug 21, 2026

Measurement was taken from the running app's Class Materials surface at `#/academics/classes/demo-course-biol252?classTab=materials`; values are computed values, not token names.

| Surface | Mockup value | App value |
|---|---|---|
| Class-page canvas | recipe `#211e1a` | `rgb(33, 30, 26)` / `#211e1a` |
| Solid content panel | `#2b2722`, `#3c352d` border, `16px` radius | `rgb(43, 39, 34)` / `#2b2722`, `rgb(60, 53, 45)` / `#3c352d`, `16px` |
| Nested object rung | `#322e28`, `13px` radius | present on material cards; re-measure it for each newly translated state |

The outer dark ladder matches this one surface. This is not promotion proof: the tab has not passed two-theme measurement, empty-store, interaction, persistence, and configured-integration proofs.

### C. Already built — preserve, do not rebuild

- Flashcard/class full-mock wiring and browser `.apkg` export: `d009cb7`, `326a17a`.
- Selected-source synchronization: `8a5adc5`.
- Revised Notes generation and persistence: `00036a5`.
- Final missing paper surfaces: `a4de557`.

Extend the existing source-grounded generation seam, local academic store, class workspace, and Syllabus import/re-import flow; never fork them.

### D. Manifest gate

Every active Academics source named below has `Build? = YES` in `implementation/briefs/BUILD-MANIFEST.md`. That permits a later code pass; it does not bypass this Stage-B decision gap.

### E. Decision-record audit

Newer owners already have explicit `## Behaviour` and `## Appearance`: Class Hub additions, Review additions, Materials extensions, Grades additions, Syllabus import, Exam Prep, study method, forgetting curve, learning signals, grade decisions, lecture capture, topic linking, planning decisions, cold start, and term rollover.

| Active owner | Decision gap to close |
|---|---|
| `academics-daily-main-page.md` | shared Daily header, class-card hierarchy/density, card-state treatment, and desktop/mobile visual ladder are not separate appearance decisions. |
| `academics-assignments.md` | agenda/week/calendar hierarchy, assignment-card density, primary action, and glass boundary are not recorded as appearance decisions. |
| `academics-class-types.md` | STEM/Writing/General behaviour is decided, but their shared geometry, information density, responsive substitution, and quiet state motion are not. |
| `academics-empty-states-prototype.md` | Variant A plus “What this sets up” is decided, but surface hierarchy, restrained import emphasis, responsive layout, and motion are not mechanically recorded. |
| `academics-planner-prototype.md` | planning workflow is specified, but board/inspector geometry, term density, solid data surfaces, and responsive treatment are not mechanically recorded. |
| `academics-tar-heel-tracker.md` | planning-library boundary is specified, but gap-first hierarchy, suggestion-card geometry, verification treatment, and responsive appearance are not mechanically recorded. |

`academics-requirements.md` is a mirror/legacy source. The lab registers Tar Heel Tracker. First confirm whether these files intentionally mirror each other. If yes, keep the mirror byte-aligned after updating the canonical tracker record; if not, report the collision and leave the inactive duplicate alone.

### F. Integrations/services

| Dependency | Status today | Classification | Required handling later |
|---|---|---|---|
| Local academic records, syllabus import, and re-import diff | implemented locally | Code built and configured | Preserve and prove reload/empty-store behaviour during later promotion. |
| Study guide, flashcard, and Revised Notes generators | source-selection and generator code exists; provider availability is not verified here | Code built, configuration not proven | Verify the Supabase secret/function deployment using a real user-owned source before calling it working. |
| Browser `.apkg` download | implementation exists | Code built; Anki Desktop import not proven | Later proof: generate from student-supplied material, download, and import into installed Anki Desktop. |
| Canvas/LMS course, office-hours, or assignment sync | no confirmed authenticated integration | Code missing / intentionally unshipped | Do not imply it is automatic. |
| Watched-folder cloud import | mockup/intake direction exists; no Drive/Dropbox configuration proof | Code/configuration not proven | Keep the one-way, confirm-once boundary. |

## 2. Work — Stage B only

Add literal `## Behaviour` and `## Appearance` decision sections to the six canonical active owner documents in §1E. Do not redraw a page and do not implement anything.

Record these settled decisions:

1. **Daily:** compact term context above a breathable card grid. Cards are shared record surfaces, not long stacked rows; course name is primary, status is secondary, one action is dominant. Use the measured warm-dark ladder. Glass only on a real floating banner, never the grid.
2. **Assignments:** agenda, week, and calendar differ by information arrangement, not visual language. Keep one prominent create action; say **due** for assignments and **upcoming** for non-due events. Dense course data stays in solid rows/cards.
3. **Class types:** type changes fields and content grammar, not the shell. Writing replaces inappropriate STEM concepts with readings/drafts; General remains unpretentious. Keep aligned card geometry and calm color-only hover/selection transitions.
4. **Empty states:** Variant A is the base: a high-emphasis **Import syllabus** action, a small manual-entry link below it, and the selected “What this sets up” explanation. Any glow is restrained, biased upward, never obscures manual entry, and stops with reduced motion.
5. **Planner:** use bounded board columns and a contextual inspector, not a wall of full-width rectangles. Dense records are solid with depth, equal-height adjacent controls, and no desktop scrollbar created to preserve a drawing.
6. **Tar Heel Tracker:** it is a transparent planning library, not a degree audit. Lead with missing/uncertain evidence and suggested next term. Never show false completion, composite, ranking, percentage, or progress from the incomplete dataset.

Each `Appearance` section must specify hierarchy, recipe-based surface ladder/radius/spacing, glass judgment, responsive change, focus-visible treatment, hover/selection timing, and `prefers-reduced-motion` behaviour. Do not copy mockup inline CSS or invent token values.

## 3. References

- `premed-hq-documentation/tabs/01-academics.md`
- `mockup-lab/VARIANT-LAB.md`
- `mockup-lab/_shared/_visual-recipes.md`
- the six owner `.html` and `.md` files named in §1E
- `premed-hq-documentation/implementation/component-inventory.md`
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`
- `premed-hq-documentation/implementation/briefs/BUILD-MANIFEST.md`

## 4. Do not break

- Do not edit `src/`, Supabase functions, secrets, migrations, localStorage shapes, build manifest, or mockup markup.
- Do not replace the student-supplied source boundary with bundled/pre-authored decks or invented materials.
- Do not add unconfigured Canvas, Drive, Dropbox, or Anki claims.
- Do not add U-9 scores, composites, rankings, fabricated percentages, or ungrounded progress bars.
- Do not flatten dense data surfaces or use glass except on a genuine floating surface.

## 5. Done when

```sh
for file in \
  mockup-lab/01-academics/academics-daily-main-page.md \
  mockup-lab/01-academics/academics-assignments.md \
  mockup-lab/01-academics/academics-class-types.md \
  mockup-lab/01-academics/academics-empty-states-prototype.md \
  mockup-lab/01-academics/academics-planner-prototype.md \
  mockup-lab/01-academics/academics-tar-heel-tracker.md; do
  rg -q '^## Behaviour$' "$file" && rg -q '^## Appearance$' "$file" || exit 1
done
git diff --check
```

Also confirm the Requirements mirror relationship before a mirrored edit, then visually re-open each registered state in the lab.

## 6. Commit

`docs(mockups): record remaining Academics owner appearance decisions`

Commit only the six decision records and an intentional mirror, if confirmed. Keep unrelated work separate.

## 7. Next stage

Re-run `TAB-BRIEF-PROMPT.md` for Academics. The next audit determines the first genuine C/D/E gap among the now-decided sources. That work, including service configuration, is not in scope for this Stage-B brief.
