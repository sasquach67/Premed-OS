# T1 · Academics — Class Center card fidelity

**Stage:** E · FRONTEND MISSING

**Scope:** Translate the approved Daily → Class Center record card into the
existing `ClassCard` component. The data model, actions, class-type settings,
empty state, and first-run boundary already work. This is a visual translation
only: do not change persistence, migrations, source generation, or any
app-specific annotation decision.

## 1. Fidelity audit

### A. Spec → paper

The ruled Class Center card behaviours all have a manifest-cleared paper owner:

| Ruled card behaviour | Decided surface |
| --- | --- |
| Compact cards wrap in the Class Center collection | `academics-daily-main-page.{html,md}` |
| Rest dot; hover accent bar, outline, glow, lift, and record-open hint | `academics-daily-main-page.{html,md}` |
| One card action plus overflow; its hover does not light the card | `academics-daily-main-page.{html,md}` |
| Class type is expressed through its signal/action, never a type badge | `academics-class-types.{html,md}` |
| Urgent daily work uses its own verb (`Recall`, `Draft`, `Read`, `Log`) | `academics-class-types.md` and `01-academics.md` §4.1-N |
| Honest absence: no denominator/bar without topic data, no invented grade or deadline | `01-academics.md` and the daily-main decisions |

No Stage-A mockup gap blocks this pass. Forecast Accuracy remains excluded: it
has no `Build? = YES` row and is not part of this card translation.

### B. Mockup → app

`src/components/academics/ClassCenter.tsx:790-979` already owns the card and
its real behaviours: record open, keyboard activation, review action, overflow
actions, context menu, drag state, type-aware signals, and computed real
course/assignment/topic data. It does **not** yet translate the approved visual
composition.

| Approved drawing | Current implementation | Finding |
| --- | --- | --- |
| Compact, padded card with title/grade in the first line | Tall card shell with responsive grid and a separate bottom action region | Divergent geometry and hierarchy |
| Rest: neutral border, colored identity dot, no accent bar | Correct dot/bar primitives exist | Partially translated |
| Hover: card lifts, border/glow turn accent, bar ignites, deadline swaps to `Open class hub →` | Text swap and bar exist; rest elevation is already present and the complete hover ladder is not established | Divergent depth/motion |
| Review remains an independent inner target | `actionHovered` already guards the card bar and open hint | Behaviour built; preserve while styling |
| Grade sits at the card’s top-right with an optional factual percentage below | Data is present, but current layout does not reproduce the approved compact placement reliably | Divergent hierarchy |
| Type-specific work appears as a signal/action, no type badge | A generic `classSignal()` exists; daily urgency is not yet presented as the decided verb chip | Partial translation |

#### Measured primary record surface — Class Center card, dark theme

Measurement recorded against the running app on 2026-08-23, using the BIOL 252
Preview card and `getComputedStyle`; mock source is Daily Main Variant A `.cc`.

| Surface | Mockup value | App value |
| --- | --- | --- |
| Card fill | `rgb(50, 46, 40)` | `rgb(50, 46, 40)` |
| Rest border | `1px solid rgb(60, 53, 45)` | `0.56px solid rgb(60, 53, 45)` |
| Radius | `13px` | `13px` |
| Rest/hover elevation | Rest none; hover `0 18px 34px -16px` plus accent ring/glow | Rest has `0 1px 2px` plus `0 6px 16px -8px`; approved hover ladder is unverified |
| Card geometry | `12px` padding, compact card collection | `0px` outer card padding and a substantially taller card shell |

The fill and radius match; the surface ladder, card proportions, and complete
interaction treatment do not. This is a real Stage-E gap, not a preference.

### C. Already built — preserve, do not rebuild

- Card open, review, overflow, context-menu, drag/reorder, and keyboard
  semantics in `ClassCenter.tsx`.
- Class type persistence and its lossless migration (`migrateClassTypesV10`).
- The approved zero-class composition, `Import syllabus` primary action, and
  quiet `Add manually` fallback in `ClassCenter.tsx:533-553`.
- The real-person first-run boundary and isolated demo namespace:
  `324e4f3 fix(academics): separate real first run from demo seed`.
- Existing due-language, Materials-intake, and app-annotation corrections.
  An annotation is a later ruling and wins if an old drawing conflicts.

### D. Gate

`BUILD-MANIFEST.md` clears both owners with **Build? = YES**:

- `01-academics/academics-daily-main-page.html`
- `01-academics/academics-class-types.html`

The gate passes. Do not edit the manifest.

### E. Decision records

**Pass.** `academics-daily-main-page.md` and `academics-class-types.md`
describe both behaviour and appearance: solid warm-dark card ladder, 13px
record-card geometry, hover timing/depth, grade placement, absence rules,
type-specific signal/action, responsive wrapping, focus, and reduced motion.
No Stage-B decision brief is needed.

### F. Integrations and services

None. This surface reads the existing local Academics store only. It adds no
provider call, auth scope, file-storage path, or account configuration.

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` §4.0, §4.1-N, §6.10-A,
  §6.12, and U-rules.
- `mockup-lab/01-academics/academics-daily-main-page.{html,md}` — Variant A.
- `mockup-lab/01-academics/academics-class-types.{html,md}`.
- `mockup-lab/_shared/_visual-recipes.md` — literal card rest/hover recipe.
- `premed-hq-documentation/specifications/01-shared-interface-patterns.md`
  §§2–5c and `04-visual-craft-standards.md` §0–§0c.
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md` and
  `component-inventory.md`.
- `src/components/academics/ClassCenter.tsx` and existing shared `Card`,
  `Button`, `Badge`, `Progress`, `DropdownMenu`, and `ContextMenu` primitives.

## 3. The work — translate the existing card, do not replace it

### 3.1 Composition and hierarchy

1. Keep `ClassCard` as the sole owner. Configure the existing shared card and
   actions; do not create a duplicate class-card component.
2. Make each non-compact Class Center card a compact record summary with this
   reading order:
   **identity dot + course code / course name → grade at top-right → factual
   badges → one type-specific signal → topic bar only when a real denominator
   exists → next dated work or honest absence → action row.**
3. Keep Grade in the card’s top-right, in the display treatment already used by
   the product. Show a percentage only when it is already a factual computed
   course value; never manufacture one from a letter grade.
4. Preserve wrapping in the collection. Do not turn cards into full-width rows,
   horizontal scroll, an equal-card carousel, or a new bento panel.
5. Do not add instructor, time, location, generic productivity copy, or a type
   badge. They are explicitly absent from the approved card.

### 3.2 Rest and hover ladder

1. At rest use the literal shared recipe: solid `--muted` role, neutral
   `--bd` role border, 13px radius, 12px inner padding, and the small colored
   dot as the only accent. Remove any unapproved always-on card elevation that
   makes the neutral resting collection look selected.
2. On card hover/focus-visible, use the existing motion tokens to establish the
   complete approved change: `translateY(-3px)`, accent border, accent ring and
   restrained glow, and a 4px left accent bar. The deadline/absence line swaps
   to `Open class hub →`.
3. Pointer/focus on the Review button or overflow leaves the outer card unlit
   and preserves its own feedback. Do not let an inner action trigger the card
   open behaviour.
4. Motion uses transform/opacity/color only and existing
   `cubic-bezier(.16,1,.3,1)` timing. `prefers-reduced-motion` keeps the state
   legible without lift/glow travel. Keyboard focus remains visible even when
   the hover effect is unavailable.

### 3.3 Type-specific daily work

1. Preserve the three existing workspace types—`stem`, `writing`, and
   `general`—and the current type model. Do not add a fourth type or a feature
   toggle matrix.
2. Make the card signal line/action reflect actual work without naming or
   badging the type:

   | Actual record context | Daily verb |
   | --- | --- |
   | STEM reviewable topic/work | `Recall` |
   | Writing draft/feedback work | `Draft` |
   | Writing assigned reading | `Read` |
   | General factual deadline/grade work | `Log` |

   The verb must be derived from an existing course-owned record. If none
   exists, retain the current friendly one-line absence; do not fall back to a
   fake next task, zero ready count, or a generic type label.
3. Keep the existing computed `classSignal()` for non-urgent class context only
   if its output can remain factual. Do not generate readiness, a composite,
   a score, or an inferred pace.
4. Writing must remain equal-density to STEM but use its real readings/drafts/
   feedback records. General must not surface dormant STEM mechanics.

### 3.4 Responsive, controls, and visual proof

1. Preserve current card activation, review, overflow, context menu, drag,
   screen-reader naming, and keyboard open. Run the repo’s control-handler
   audit for every `Button`, `DropdownMenuItem`, and `ContextMenuItem` changed
   in this component; it must report zero dead controls.
2. Test narrow width: cards reflow cleanly, top-right grade stays aligned, and
   the action row remains reachable without clipping. Do not create an inner
   scrollbar.
3. Before committing, record actual `getComputedStyle` values for the app card
   in dark **and light** themes: canvas, card, border/radius, rest shadow, and
   hover shadow. Compare against the mockup’s role ladder in this brief’s
   implementation note or the paired mockup decision record.

## 4. Do not break

- No store/model/migration work; no changes to `createPersonalInitialData`,
  demo data, Settings reset semantics, or localStorage keys.
- No `--primary`, `--ring`, `--sidebar-*`, `--cat-gpa`, token, font, mascot,
  auth-sync, or app-shell changes.
- No glass on the card, row, progress bar, field, or overflow content. Glass
  remains only on surfaces that float over the banner.
- No percentage/composite/ranking/progress state without a factual source;
  never render a zero-width progress bar with no topic denominator.
- No removal of existing app-specific annotations merely because a stale
  screenshot lacks them.
- No new UI library component for a job the shared component inventory owns.

## 5. Done when

- [ ] `ClassCard` visually matches the approved compact rest/hover ladder in
  both themes, with computed-style evidence recorded.
- [ ] Grade placement, one primary Review action, overflow, and `Open class
  hub →` swap are correct without competing hover states.
- [ ] The daily type-specific signal/action is factual, label-free, and uses
  `Recall` / `Draft` / `Read` / `Log` only where an appropriate stored record
  exists.
- [ ] Empty class data produces a friendly one-line absence, never demo data,
  zero bars, or invented next work.
- [ ] Keyboard-only, reduced-motion, card wrapping, drag/reorder, review, and
  every changed menu item work; the handler audit reports zero dead controls.
- [ ] `npm run test` and `npm run build` pass.

## 6. Commit

`fix(academics): match Class Center card fidelity`

Commit unrelated working-tree changes separately.

## 7. Next stage — promotion audit, not in scope

After this brief is implemented, run the Academics promotion audit. Do not mark
the page built until all six conditions are proved, including an empty-store
check, handler audit, reload persistence, both-theme measurement, configured
integrations, and the commit recorded beside the mockup.
