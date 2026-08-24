# T1 · Academics — Daily Class Center card fidelity

**Stage:** E · FRONTEND MISSING  
**Scope:** Translate the now-current, approved Class Center card target into
the existing Daily Class Center. This is a card-surface fidelity pass only.
It must not redesign the bento, change an entity, alter a migration, change
the review scheduler, or promote the page.

## 1. Step-1 audit

### A. Spec → paper

**Pass.** The manifest-cleared Daily and Planning Academics rules have paper
owners. For the current primary surface specifically, the Class Center bento,
card collection, card interaction states, class Hub/peek handoff, card
overflow, empty setup state, and honest no-date condition are recorded in:

- `mockup-lab/01-academics/academics-daily-main-page.{html,md}`;
- the related Class Hub and Class Types owner frames; and
- the authoritative Aug. 23 later-app-annotations section in the Daily
  decision record.

The July card paragraph in `tabs/01-academics.md` §4.0a conflicts with those
later direct product rulings: it calls for a percent, progress bar, BCPM chip,
and permanent Review control. The **later approved annotation wins for this
card surface**. It is precise, recorded in the owner decision file, and was
the stated reason for the preceding Stage-B repair. The broader card rules
(solid surfaces, class-owned colour, card → Center Peek, overflow, no
horizontal scrolling, and no instructor/meeting clutter) remain binding.

### B. Mockup → app

`src/components/academics/ClassCenter.tsx` has an implemented Class Center:
persisted course/workspace records, Cards/List selection, card click → Center
Peek → expand, class-scoped overflow/context actions, term/search filtering,
drag reorder, and a real empty-state launchpad. The card **does not match the
current drawing**.

**Measured primary record surface, Aug. 23, 2026** — running local app at
`#/academics?mode=daily&tab=class-center`, first `.academics-class-card`:

| surface | current paper target | running app |
| --- | --- | --- |
| dark canvas → card | `#211e1a` → `#322e28`; `#3c352d` edge; `13px`; `12px` padding | `rgb(33, 30, 26)` → `rgb(50, 46, 40)`; `rgb(60, 53, 45)` edge; `13px`; `12px` padding |
| card footprint | equal grid rows, `206px` desktop / `198px` narrow | card width `239.384px`; heights vary `210px`–`211.51px` in one rendered row |
| primary facts/actions | optional entered letter only; factual context + next date; **Preview + overflow** | card renders `IP`, an `87.1%` course percentage, a topic `progressbar`, and a direct `Review` button |

The dark surface ladder itself is correct. The visible hierarchy is not: the
percentage/progress meter, permanent Review action, and variable card height
are all outside the settled target. `ClassCard` calculates and renders those
at `ClassCenter.tsx:851–984`; the row grid at `:677–681` has no fixed row
height. The current no-date fallback is also `"No deadline scheduled"` rather
than the specified honest `"No dated class item yet"` recovery copy.

Light-mode ladder measurement and all reload/empty-store/control proof are
**not yet promotion evidence**. They belong to the later, separate promotion
audit once the live visual target exists.

### C. Already built — preserve, do not rebuild

- `c9a83b8`, `dff85a9`, `dbab247`, `aafe22b`, and `7c7f103` — Class Center
  persisted record collection, compact-card work, softer accents, and
  reduced vertical dead space.
- `719d867` — type-aware deadline wording on actual dated records.
- `997fd0a`, `cdc7308`, and `086e48a` — Class Types and its owner surfaces;
  do not restore a visible type badge to cards.
- Syllabus import/re-import, topic/review state, class preview/Center Peek,
  Planner, Requirements, Grades & Archive, and every later app annotation.

### D. Gate

`BUILD-MANIFEST.md` marks
`01-academics/academics-daily-main-page.html` **YES**. This permits the
fidelity work below. It does not authorize a redesign of other Academics
surfaces.

### E. Decision record

**Pass.** `academics-daily-main-page.md` now records both behaviour and
appearance: compact equal footprints, solid ladder, restrained identity,
Preview/overflow hierarchy, focus/reduced-motion treatment, and the honest
no-date recovery. The previous Stage-B commit is `589bf0e`.

### F. Integrations and services this surface needs

| dependency | classification | student-facing consequence |
| --- | --- | --- |
| Local persisted Academics store | **CODE BUILT AND CONFIGURED** | Courses, workspaces, assignments, topics, letter grades, filters, ordering, and the card/peek route already have owners. |
| Google Calendar read context | **NOT REQUIRED by the card** | A card’s next dated item is the student’s persisted class assignment. Calendar context may enrich nearby surfaces, but the card must remain useful with no calendar connection. |
| Syllabus ingestion | **CODE BUILT; student-supplied source** | Import can populate dated items, but a missing syllabus must show the honest recovery instead of invented work. |

### First blocked stage

**E · FRONTEND MISSING.** Stages A and B pass: the card is drawn and its
appearance is now settled. Stage C/D do not block this pass because the record
and card interactions already ship. The first failure is the live card’s
visual/data hierarchy relative to the now-settled paper target.

## 2. References

- `premed-hq-documentation/general.md` U-9 and U-13.
- `premed-hq-documentation/architecture/01-global-design-system.md` and
  `02-global-intelligence-framework.md`.
- `premed-hq-documentation/specifications/01-shared-interface-patterns.md`
  §2 and §4c/§4e; `04-visual-craft-standards.md` §0c, §7a, and §10.
- `premed-hq-documentation/tabs/01-academics.md` §4.0, §4.0a, §4.0b,
  §4.1-G, §6.7, §6.9, §6.11, and §6.13 — with the recorded later card
  annotations resolving the §4.0a composition conflict.
- `mockup-lab/01-academics/academics-daily-main-page.{html,md}` and
  `mockup-lab/_shared/_visual-recipes.md`.
- `premed-hq-documentation/implementation/component-inventory.md` and
  `MOCKUP-TRANSLATION-CONTRACT.md`.
- `src/components/academics/ClassCenter.tsx`, `src/index.css`, and
  `src/components/academics/ClassCenter.test.ts`.

## 3. Work — fidelity only

### 3.1 Make Cards view a true equal-footprint collection

1. In Cards view only, make the collection use equal fixed rows matching the
   owner frame: **206px desktop**, **198px at the narrow card breakpoint**.
   Every `ClassCard` and Add Class record must fill its assigned grid cell.
   Preserve the existing responsive column step-down; do not introduce
   horizontal scrolling, a masonry layout, or full-width dashboard rows.
2. Keep List view as the existing compact row presentation. Do not force a
   square card into list mode.
3. Preserve the literal solid surface ladder in `src/index.css`: page
   `#211e1a` → card `#322e28` → nested muted object, `#3c352d` border,
   `13px` card radius, and `12px` content padding. Do not add glass to a
   class card.

### 3.2 Replace the obsolete primary-card anatomy

For Cards view, use only this compact anatomy, in this order:

1. course dot + code and full course name;
2. a **student-entered letter standing only when one exists** — no percentage
   beside it and no synthetic fallback label that looks like a grade;
3. one factual, type-appropriate context line (for example marked-ready,
   current draft, or a real assignment state); it must be sourced from the
   existing record and never manufacture a denominator;
4. one next dated class item, using the existing type-aware date formatter;
   when absent, write **“No dated class item yet”** and make the existing
   Preview/Open Class Hub route the visible recovery. Do not add a second
   standalone dashboard action, a fake deadline, or an automatic import; and
5. a divider-separated **Preview** action plus the existing overflow trigger.
   The whole record’s click/keyboard route may continue to open the Center
   Peek, but the visible bottom action must make that consequence clear.

Remove from the primary card entirely:

- `coursePercent()` output and its percentage text;
- the card-level `Progress` component and ready/topic percent;
- BCPM/class-type badges and any hidden type label;
- an always-available Review button or Review action rail.

`Review` remains reachable only in the already-existing overflow/context menu
and then through the class preview/peek workflow. Where the `Play` icon is
shown for that follow-up action, it stays solid white. Do not remove the
underlying review route, overflow handler, keyboard access, or context menu.

### 3.3 Preserve interactive-card and accessibility behaviour

- At rest: neutral edge and small course dot only; no accent bar.
- On card hover or `:focus-visible`: existing left bar ignition, restrained
  class-owned border/glow, deadline swap to `Open class hub →`, and the
  `translateY(-3px)` lift. It must apply only to the card target—not the
  overflow control.
- Preserve `:focus-visible` rings and the existing `prefers-reduced-motion`
  fallback. The Preview control, overflow trigger, card Enter/Space action,
  and right-click menu must all remain keyboard reachable.
- Keep class colours quiet and card-owned. No full-card accent wash, generic
  blue Review CTA, new colour tokens, or global radius/theme changes.

### 3.4 Focused regression coverage

Extend `ClassCenter.test.ts` or add a focused component-level rendering test
using the repository’s existing test setup. It must prove the primary Cards
view renders no percentage, no `progressbar`, no `BCPM` / class-type label,
and no primary-card Review button; it does render Preview + overflow and the
no-dated-item copy when the supplied record has no dated assignment. Use a
realistic persisted `ClassCenterData` fixture, not app demo residue.

This test guards the visible hierarchy; it does not claim promotion proof.

### 3.5 Visual verification required in this execution

After the code change, serve the updated local app and:

1. measure the first populated class card in **dark and light** against the
   frame’s page → card ladder, edge, radius, padding, and fixed card height;
2. capture a populated Cards view at desktop and a narrow viewport; confirm
   equal rows/reflow, no clipped card actions, no horizontal scrolling, and
   no dead vertical zone below the visible actions; and
3. hover/focus the card and overflow separately. Verify the card glows/lifts
   only for its own target, and reduced motion removes movement but leaves the
   state legible.

## 4. Do not break

- Do not edit `BUILD-MANIFEST.md`, `mockup-lab/variant-lab.html`, store
  versions/migrations, Google/Supabase/OAuth settings, syllabus parsing,
  FSRS logic, review-session logic, Planner, Requirements, or Class Types.
- Do not replace persisted class facts with mock/sample values. The app must
  still work signed out, local-first, and after reload.
- Do not promote the Daily main page in this pass. Its six-condition audit
  remains separate and must prove handlers, persistence, empty store, and
  integrations after the visual target lands.
- Do not restore the superseded §4.0a percent/progress/BCPM/permanent-Review
  composition. The owner decision record is the explicit later ruling.
- U-9/U-13: no score, composite, rank, or judgement about a student. A
  course letter grade is a student-entered record fact; a percentage/progress
  meter on this primary card is outside the selected treatment.
- Preserve unrelated working-tree briefs, Flashcards V1 spec work, `output/`,
  and all later app-specific annotations.

## 5. Done when

- [ ] Cards view uses equal `206px` / `198px` rows and the Add Class tile
      shares the same footprint; List view is unchanged.
- [ ] A card shows only optional entered letter standing, factual context, and
      a real next dated item or the honest no-date recovery.
- [ ] Primary cards contain Preview + overflow, not an exposed Review action.
- [ ] Grep and focused rendering coverage prove no card percentage,
      `Progress`, BCPM/type badge, or primary Review button remains.
- [ ] Dark/light measured ladder, desktop/narrow layout, hover/focus, and
      reduced-motion checks match the updated owner decision record.
- [ ] Focused tests, full suite, production build, and `git diff --check`
      pass.

## 6. Commit

`fix(academics): match Class Center cards to approved hierarchy`

Keep this card-fidelity commit separate from unrelated work.

## 7. Next stage — not in this brief

**F · promotion proof** for `daily-main`, only after this visual pass lands:
re-run the six promotion conditions—measured both-theme match, handler audit,
reload persistence, empty-store honesty, integration classification, and
commit record—then promote only if all six actually pass. That audit and any
status flip are explicitly out of scope here.
