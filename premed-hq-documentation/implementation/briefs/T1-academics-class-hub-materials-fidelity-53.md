# T1 · Academics Daily · Class Hub Materials — Variant A fidelity

**Stage:** E · FRONTEND FIDELITY  
**Variant:** A · week-grouped material shelf  
**Build gate:** `academics-class-hub.html` = `YES`  
**Scope:** Class Hub Materials tab only. Preserve Material Intake, local files,
generation, syllabus import, assessment sources, priming/predict, Canvas
calendar context, writing tools, and every non-Materials route.

## 1. Router audit

- **Spec → paper: pass.** `tabs/01-academics.md` §4.1 Materials and the
  approved `academics-class-hub.md` require one class-scoped material shelf,
  ownership/provenance, chronological grouping, and priming beside the module.
- **Mockup → app: fail.** Variant A begins with compact filters/Add material,
  then grouped rows and priming. The app begins with four full-width extension
  surfaces (course shelf, assessment intake, prelecture prediction, calendar
  handoff) before repeating a second filter/catalog below. The primary shelf is
  below the fold and reads as another manager.
- **Already built:** Material Intake, MaterialCatalog, assessment sources,
  generation intake, notes-folder intake, syllabus import, source ownership,
  filters, priming note action, calendar review, and persisted files.
- **Gate/decision: pass.** Manifest is YES and Variant A is APPROVED.
- **Integration:** optional folder/calendar/provider integrations must remain
  honest; this pass cannot claim they are configured.

## 2. References read

- `mockup-lab/01-academics/academics-class-hub.html?variant=A&view=materials`
- `mockup-lab/01-academics/academics-class-hub.md`
- mirrored HTML/MD under `premed-hq-documentation/specifications/mockups/`
- `_shared/_visual-recipes.md`
- `premed-hq-documentation/tabs/01-academics.md` §4.1 Materials, §6.6
- `ClassHub.tsx`, `MaterialCatalog.tsx`, `MaterialIntakeDialog.tsx`,
  `MaterialGenerationIntake.tsx`, `AssessmentCatalog.tsx`

## 3. Work · one stage

1. Put one compact toolbar first: ownership filters, sort/group label, and Add
   material. Counts come from real course records.
2. Render the real grouped material rows immediately after the toolbar, using
   the approved card/row/radius/spacing recipe. Keep unassigned records visible.
3. Keep one module-level priming row after each group; no decorative card wall.
4. Preserve syllabus import, generation, folder intake, assessment sources,
   prelecture tools, calendar context, and writing tools behind one calm
   `Material tools` disclosure below the primary shelf. A disclosure is not a
   new tab and does not duplicate the manager.
5. Empty state stays honest and class-scoped. Do not invent demo files.
6. Add a source comment for Variant A Materials and extend only
   `classHubVariantA.css`; do not edit shared/global CSS.

## 4. Exact visual contract

- content padding already inherited from the Class Hub: `15px 24px 24px`;
- toolbar row, `8px` gaps, compact Baloo 2 controls, no oversized blue pills;
- group panel `#2b2722/#3c352d`, `16px`, solid; row separators `#3c352d`;
- ownership chips use short text, not arbitrary emoji;
- module priming uses one quiet violet-accent row, not a nested generic card;
- light mode uses the locked paper ladder, with identical geometry;
- at `760px`, filters scroll/wrap, group headers/rows stack without clipping.

## 5. Do not break

- Materials are lecture evidence/context, not Topic generators. No normal Topic
  picker is added.
- Do not change file persistence, local blob behavior, generation, source
  boundaries, syllabus-led topics, Guide semantics, or Planning files.
- Do not modify `src/pages/Academics.tsx` or `src/index.css`.

## 6. Done when

- [ ] Shelf/filter/Add hierarchy matches Variant A before extensions.
- [ ] All preexisting Material tools remain reachable and non-inert.
- [ ] Empty, populated, filter, dark/light, desktop/390px are verified.
- [ ] Focused tests, TypeScript/build, and scoped diff-check pass.
- [ ] Surface remains unpromoted until six-condition area proof and provenance.

## 7. Commit

`fix(academics): translate Class Hub Materials Variant A`

## 8. Execution audit · Aug. 27, 2026

- [x] Primary order is now title/count/Add → ownership filters → real grouped
      rows/priming → one collapsed Material tools disclosure.
- [x] Honest CHEM 241 empty state is visible without demo material. All five
      filters remain keyboard buttons with explicit pressed state.
- [x] Add material opens the existing unified local-first dialog with file,
      clipboard screenshot, and pasted excerpt paths.
- [x] Material tools expands to the preserved syllabus import, source-selected
      generation, folder intake, assessment source, prelecture, calendar, and
      grade-category records. Optional integration copy remains honest.
- [x] Dark/light desktop screenshots:
      `/tmp/class-hub-materials-dark-desktop.png` and
      `/tmp/class-hub-materials-light-desktop.png`.
- [x] 390px dark screenshot:
      `/tmp/class-hub-materials-dark-mobile.png`; toolbar stacks, filters scroll
      horizontally, and Add material remains a compact 9px-radius control.
- [x] Focused Class Hub tests 5/5; TypeScript clean; final production build and
      scoped diff check recorded with the parent handoff.

This is a bounded Materials visual/interaction proof, not full Daily promotion.
Configured providers, populated/reload evidence, and commit provenance remain
part of the later six-condition promotion audit.
