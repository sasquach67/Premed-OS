# T1 · Academics — Class Center card-collection fidelity

**Stage:** E · FRONTEND MISSING  
**Status:** fidelity implementation brief. The Daily Class Center's data,
record-open model, and card controls are already shipped. Translate only the
approved class-card collection and its immediate collection chrome. Do not
rewrite Academics, create a second class model, or replace later
annotation-backed behaviours.

## 0. Outcome

The current-term Class Center should read as a compact collection of **class
cards**, not three oversized generic panels. Each card is a shared record-open
surface: click the card to open its class hub; its one primary **Review**
action starts review without igniting the card; overflow holds the existing
secondary, class-scoped actions. The collection wraps responsibly from a
five-card row at wide desktop down through fewer columns on smaller screens.

This is the specific visual discrepancy Andy flagged when comparing the
approved daily mockup with the running app. It is deliberately a frontend-only
pass: the card's existing source data, navigation, review action, menus,
accessibility, drag/reorder behaviour, centre-peek behaviour, and persistence
remain their current owners.

## 1. Step-1 audit

### A. Spec → paper

No Stage-A paper blocker exists for this owner surface.

| Ruled Class Center behaviour | Paper source |
| --- | --- |
| Current-term class-card collection; cards wrap rather than scroll | `tabs/01-academics.md` §4.1, Daily Class Center; `academics-daily-main-page.html` |
| Card opens its class hub; primary Review acts without opening/lights-off | `academics-daily-main-page.md`, Decisions 4; `01` §4.1 open model |
| Rest/hover card distinction: dot at rest, left accent + border/glow/lift only on card hover | `academics-daily-main-page.md`, Decisions 4 and Appearance |
| One action plus overflow; no instructor/meeting clutter on card | same decision record |
| Cards live in the 12-column Class Center bento below Heads up | `tabs/01-academics.md` §4.1 table; daily mockup |

The class-card drawing and its companion record include both behaviour and
appearance. The no-status `academics-mode-switch.html` and
`class-center-study-hub.html` are manifest `NO` concept rows, so they are not
an eligible-paper blocker for this pass.

### B. Mockup → app

| Surface | Existing app evidence | Result |
| --- | --- | --- |
| Class collection, current-term filter, Cards/List presentation | `src/components/academics/ClassCenter.tsx` `ClassCenterDashboard` | **Built behaviour.** Same persisted course/workspace data feeds both presentations. |
| Card open, keyboard open, centre peek, Review, overflow/context actions, drag/reorder | `ClassCenter.tsx` `ClassCard` | **Built behaviour.** The action guard keeps a nested control from opening the card. |
| Approved compact card geometry and primary-action hierarchy | `ClassCenter.tsx` `ClassCard`; live app | **Divergent.** The collection is `xl:grid-cols-3`, making cards read as broad panels. The primary control says **Open**, although the approved decision names **Review** as the one primary card action. |
| Rest/hover composition | `ClassCenter.tsx` `.academics-class-card`; live app | **Partial.** Dot, hover left bar, deadline-to-open-hub copy swap, and action-hover guard exist. The dense compact-card hierarchy must be completed without disturbing the guard. |

#### Measured primary record surface — August 21, 2026

Measured in the running app at
`#/academics?mode=daily&tab=class-center` with `getComputedStyle`, not token
names. The visual ladder is already correct; this brief must preserve it.

| Surface | Approved mockup role/value | Running app, dark | Running app, light |
| --- | --- | --- | --- |
| Page canvas | `#211e1a` | `rgb(33, 30, 26)` | `rgb(247, 239, 225)` |
| Solid bento panel | `#2b2722`, `#3c352d` border, `16px` | `rgb(43, 39, 34)`, `rgb(60, 53, 45)`, `16px` | app solid-card rung; do not replace it with the card rung |
| Dense class card | `#322e28`, `#3c352d` border, `13px` | `rgb(50, 46, 40)`, `rgb(60, 53, 45)`, `13px` | `rgb(239, 230, 212)`, `rgb(233, 226, 213)`, `13px` |

The mockup is dark, but light mode must remain a light analogue. Do not copy
mockup CSS literals into `src/`, make light mode dark, or collapse the
page → solid panel → dense card ladder.

### C. Already built — preserve, do not rebuild

- Class Center/course-workspace reconciliation, shared course data, and
  reorder/open/peek mechanics (`9f4d3ac` and later Academics work).
- The existing hover action guard: interacting with Review must not light or
  open the card.
- The daily bento, Heads up data and dismissal behaviour, review queue,
  exam-scoped weak-topic panel, Up next, GPA, and subsequent panels.
- All later annotation-backed changes, including due-language corrections,
  class actions, and real recorded data. An annotation wins over an older
  screenshot.
- Current tokens, `Card`, `Button`, `DropdownMenu`, `ContextMenu`,
  `CenterPeek`, and app-wide motion/accessibility contracts.

### D. Gate

`BUILD-MANIFEST.md` marks
`01-academics/academics-daily-main-page.html` **YES**. This fidelity work is
authorized. Do not edit the manifest and do not infer authority over any
manifest-`NO` concept row.

### E. Decisions file

`mockup-lab/01-academics/academics-daily-main-page.md` records both the
approved behaviour and the appearance of the card collection. Stage B passes.

### F. Integrations and services

None are introduced or changed. Class cards rely only on the existing local
course/workspace store and existing route/review callbacks. Calendar, source
generation, Google OAuth, Supabase, file storage, and provider configuration
are not part of this brief.

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` §4.1 Daily Class Center,
  §4b-i, and §7a.
- `mockup-lab/01-academics/academics-daily-main-page.{html,md}` — approved
  class-card and bento reference.
- `mockup-lab/_shared/_visual-recipes.md` and
  `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`.
- `premed-hq-documentation/implementation/component-inventory.md` — reuse
  Card/InteractiveCard behaviour, Button, DropdownMenu, ContextMenu,
  EqualHeightGrid/BoundedRegion where already applicable, and CenterPeek.
- `src/components/academics/ClassCenter.tsx` — especially `ClassCard` and its
  collection grid. Do not fork a second card model.

## 3. The work — visual translation only

### 3.1 Compact, wrapping collection

1. Keep the classes region a 12-column bento panel, with its existing title,
   active-term line, count, and add-class path.
2. Change only the **Cards** presentation so its class cards are compact
   record cards. At wide desktop it should accommodate up to five cards in a
   row when the available width allows; use responsive min-width/grid rules so
   it becomes four/three/two/one columns rather than clipping, horizontal
   scrolling, or shrinking labels below legibility.
3. Preserve List as a separate presentation of the same records. Do not create
   a second list/data source.
4. Retain equal visual card height within a row. Natural wrapping is required;
   arbitrary negative margins or an internal card scrollbar are forbidden.

### 3.2 Shared card geometry and hierarchy

- Keep the small class-colour dot as the only identity accent at rest; the
  left bar remains transparent/resting, with a neutral card border.
- Keep course code + factual grade state in the first line; course title,
  existing truthful badges, one factual topic line, then the deadline/open-hub
  line. Do not add instructor or meeting information to this collection.
- Use the approved dense-card rung, not glass. Preserve existing 13px record
  radius and solid-with-depth shadow treatment.
- At a real pointer hover over the card itself only: light the left bar, make
  border/glow use that class's established accent, apply the existing small
  lift, and swap the deadline line to **Open class hub →**.
- The primary button must read **Review** and invoke the existing `onReview`
  callback. Its hover/focus/pointer state must keep the card unlit and must
  not open the class hub. Keep overflow as the quiet secondary affordance.
- Keyboard focus on the card exposes the same intentional state without a
  motion-only cue. Reduced motion removes lift/animated transform but retains
  visible border/left-bar state.

### 3.3 Do not silently alter data or actions

- Do not change `classStats`, deadline selection, assignment due-language,
  `coursePercent`, grade calculation, review scheduling, source-generation
  routes, Card/List selection, drag/reorder, or current menu destinations.
- Do not remove a later annotation-backed menu item because an older mockup
  does not show it. If tight compact geometry requires moving a secondary
  action, retain it in the existing overflow/context menu.
- Do not make the Review button a new review model. It is a label/hierarchy
  translation around the existing callback.

## 4. Do not break

- No new store field, localStorage shape, migration, mock/demo data, API,
  provider call, OAuth scope, or external integration.
- No score, ranking, composite, invented percentage, or new progress bar
  (U-9). Existing recorded grades and factual topic counts remain exactly
  what they are.
- No glass below the banner; no token/font/palette/radius changes; no mockup
  inline CSS copied into the app.
- No card-wide click competing with nested Review/overflow controls. Preserve
  `openFromCard`'s interactive-target guard and action-hover behaviour.
- Preserve both themes, keyboard operation, visible `:focus-visible`, and
  reduced-motion support.
- Keep unrelated dirty working-tree changes out of the commit.

## 5. Done when

- [ ] Cards view is a compact responsive wrapping collection, not a fixed
      three-column wall of broad panels; it remains usable at narrow desktop
      and mobile without horizontal overflow.
- [ ] The card uses **Review** as its one primary action and the existing
      Review callback; overflow still exposes every current secondary action.
- [ ] Clicking/Enter/Space on a card opens its current hub/peek behaviour;
      click/Enter/Space on Review does not open or light the card.
- [ ] Rest/hover/focus action states follow the approved dot → accented-bar /
      border / glow / quiet lift relationship; reduced motion removes only
      movement.
- [ ] The page → panel → dense class-card ladder remains measured in both
      themes, with the pre-build values above recorded in the implementation
      report.
- [ ] The `4fe210f` inert-control audit returns zero actionable buttons,
      dropdown items, or context-menu items without a handler or explicit
      disabled reason for the changed collection.
- [ ] Persisted course records, ordering, and Card/List choice survive reload;
      an empty store renders a friendly honest state with no demo cards.
- [ ] `npm run test`, `npm run build`, `git diff --check`, keyboard-only, and
      narrow-width checks pass.

## 6. Commit

```text
fix(academics): translate Class Center cards to the approved compact collection
```

Commit only the Class Center fidelity implementation and its directly relevant
tests/decision-note update. Keep unrelated work separate.

## 7. Next stage — not in scope

After this lands, rerun the tab brief audit. It must check the remaining
Academics owner surfaces rather than assuming the tab is promoted: each page
still needs all six Variant Lab promotion proofs, including empty-store,
reload, inert-control, both-theme visual measurements, and configured live
integration evidence where a surface owns one.
