# Component registry → mockup crosswalk

**Status:** Audited working contract  
**Audited:** August 14, 2026  
**Scope:** Root `src/` application and the review surfaces indexed by `specifications/mockups/variant-lab.html`

## Decision

Premed OS may search shadcn/ui, 21st.dev, Animate UI, SmoothUI, Motion
Primitives, and Motion for proven interaction patterns. Those catalogs are
**reference and source-code registries**, not additional design systems.

The mechanical rule is:

1. **The product spec owns behavior and data.**
2. **The approved mockup owns structure, grouping, order, and interaction flow.**
3. **The Premed OS component owns the implementation seam.** One job has one
   shared owner.
4. **The Premed OS design system owns appearance.** External colors, fonts,
   radii, spacing, shadows, icons, and demo data never cross into the app.
5. **The build manifest owns permission.** A good registry match does not make
   a blocked mockup buildable.

This makes the catalogs useful without turning the app into a collage of
unrelated component libraries.

## What was actually checked

### Public registries

| Source | What it is useful for | Official entry point | Premed OS ruling |
|---|---|---|---|
| shadcn/ui | Accessible React primitives and common application composition | [Components](https://ui.shadcn.com/docs/components) · [registry API](https://ui.shadcn.com/docs/registry/api-reference) | Preferred primitive source. Adapt into `src/components/ui/`; never install a second owner for a common component. |
| 21st.dev | A large community catalog of composed React/Tailwind patterns | [Community components](https://21st.dev/community/components?tab=home) · [component structure](https://help.21st.dev/publishing/component-structure) | Structure and interaction reference only. Review source and dependencies before adopting anything. Never paste its styling or sample data. |
| Animate UI | Motion-enhanced primitives, especially Radix-compatible tabs, dialogs, progress, and disclosures | [Components](https://animate-ui.com/docs/components) · [primitives](https://animate-ui.com/docs/primitives) | Motion-behavior reference. Prefer enhancing the existing Premed OS owner over copying an Animate UI component. |
| SmoothUI | shadcn-compatible animated components such as expandable cards, uploads, steppers, and contribution graphs | [Components](https://smoothui.dev/docs/components) · [installation model](https://smoothui.dev/docs/guides/getting-started) | Candidate source for a missing motion mechanism. Existing Premed OS ports remain the owner. |
| Motion Primitives | Small reusable interaction mechanisms such as disclosure, transition panel, animated group, and in-view | [Component catalog](https://motion-primitives.com/docs) | Reference for mechanism and accessibility; not a second component layer. |
| Motion for React | The animation engine already used by the app | [React docs](https://motion.dev/docs/react) · [AnimatePresence](https://motion.dev/docs/react-animate-presence) | Use the shared `src/lib/motion.ts` vocabulary and reduced-motion path. Do not add another animation engine. |

The shadcn CLI can search the configured `@shadcn`, `@animate-ui`, and
`@smoothui` registries in this repository. 21st.dev exposes installable shadcn
registry URLs per component, but every candidate still requires source and
dependency review.

### Repository reality

The audit read the filesystem and searched app imports; it did not infer
installation from a planning document.

| Layer | Verified state |
|---|---|
| `src/components/ui/` | **39** primitive files exist; **30** are imported somewhere in `src/`. |
| Present but not currently imported | `accordion`, `carousel`, `drawer`, `hover-card`, `input-otp`, `pagination`, `radio-group`, `sheet`, `sonner`. These are available, not “adopted.” |
| Shared Premed OS patterns | `TrackerTable`, `CenterPeek`, `ObjectInspector`, `RecordOpenWorkspace`, `InteractiveCard`, `Collapsible`, `ThreeLevelNav`, `Kanban`, `EmptyState`, `MascotNote`, `InfoTip`, `StatStrip`, `SmartActionPanel`, and the other owners in `component-inventory.md` exist. Some are not yet used by a gated product surface. |
| Motion ports that actually exist | `AnimatedFileUpload`, `AnimatedStepper`, `ContributionHeatmap`, `NumberFlow`, `PreviewLinkCard`, `PinList`, `ThemeToggleButton`, `FocusSessionManagementBar`, `MilestoneFireworks`, and `AuthAtmosphere`. |
| Motion ports currently used in product code | `AnimatedFileUpload`, `NumberFlow`, and `ThemeToggleButton`. The rest are available or deliberately parked. |
| Engine and supporting packages | `motion`, Radix primitives, `cmdk`, `react-day-picker`, `recharts`, `sonner`, Embla, Vaul, and dnd-kit are already dependencies. No new dependency is authorized by this document. |

“File exists,” “used by the app,” “parked,” and “approved to build” are four
different states. Future inventory work must keep them separate.

## Shared pattern crosswalk

| Mockup pattern | One Premed OS owner | Best external reference | Verified action |
|---|---|---|---|
| Product mode → sub-tab → filter/view hierarchy | `ThreeLevelNav` composed from `ModeSwitch`, `Tabs`, and app controls | shadcn Tabs; Animate UI Radix Tabs | **KEEP.** Exists with tests. Configure it; do not add a second nav framework. |
| Quiet animated tabs | `src/components/ui/tabs.tsx` | Animate UI Tabs; Motion shared-layout ideas | **KEEP.** It already uses Motion and the shared timing vocabulary. Add only behavior required by a gated mockup. |
| Square record card with actions | `InteractiveCard` + `Card` + `RecordActionMenu` | 21st.dev card compositions | **KEEP.** 21st.dev may inspire information hierarchy, never the skin or data. |
| Card opens into a selected-record workspace | `CenterPeek` / `RecordOpenWorkspace`; `Collapsible` for true inline disclosure | [21st.dev Expandable Card](https://21st.dev/community/components/erikx/expandable-card/default); SmoothUI `expandable-cards` | **DO NOT INSTALL.** The app already owns this interaction grammar. Reuse the owner when a cleared surface needs it. |
| Bento dashboard composition | Page-owned CSS grid + existing `Card`/domain components | [21st.dev Bento Grid collection](https://21st.dev/community/components/s/bento-grid) | **REFERENCE ONLY.** The approved mockup fixes spans and order; a generic bento component would hide useful page structure. |
| Dense sortable/filterable ledger | `TrackerTable` | shadcn Data Table patterns | **ENHANCE, NEVER REPLACE.** Sorting/filtering/columns belong in the one table owner. |
| Kanban workflow | `Kanban` | [21st.dev Kanban](https://21st.dev/community/components/reui/kanban/default) | **KEEP.** Existing dnd-kit owner; not currently used by a gated surface. |
| Charts with truthful measured data | `src/components/ui/chart.tsx` + Recharts | shadcn Chart registry | **KEEP.** Chart file and Recharts exist. A mockup cannot create missing measurements. |
| Loading / empty / error / partial | `Skeleton` + `EmptyState` + `CollectionState` | shadcn Skeleton | **KEEP.** No external empty-state block may replace the app’s factual-state rules. |
| File ingestion | `AnimatedFileUpload` | SmoothUI `animated-file-upload`; shadcn input primitives | **KEEP.** Port exists and is used by Academics. |
| Multi-step review/import flow | `AnimatedStepper` + domain form | SmoothUI `animated-stepper` | **KEEP/PARKED.** Use when the gated workflow needs visible step state. |
| Exact-number transition | `NumberFlow` | SmoothUI Number Flow; Motion `AnimatePresence` | **KEEP.** Used only for exact real values; never animate toward an invented metric. |
| Contribution/streak heatmap | `ContributionHeatmap` | SmoothUI `contribution-graph` | **KEEP/PARKED.** Feed dated events only. Aggregate totals cannot be distributed into fake days. |
| Progress spine | `Progress` or the domain’s tokenized thin bar | Animate UI Radix Progress | **KEEP.** No bar when the target or denominator does not exist. |
| Context menu | `RecordActionMenu` + `ContextMenu` | shadcn / Animate UI Context Menu | **KEEP.** Every right-click action must also be visibly reachable elsewhere; long-press is the touch equivalent. |
| Tooltip / short teaching clarification | `Tooltip` / `InfoTip` | shadcn Tooltip; Animate UI Tooltip | **KEEP.** `InfoTip` content is data, not feature-local JSX. |
| Mascot teaching note | `MascotNote` | No registry analogue needed | **KEEP.** The illustration and persistence behavior are product-owned. |
| Smart recommendation cards | `SmartActionPanel` | Generic notification-list composition only | **KEEP.** Explainability, suppression, and real evidence are product logic, not catalog styling. |
| Toast with undo/open | `ToastProvider` | Sonner | **KEEP CURRENT OWNER.** `sonner.tsx` exists but is unused; do not run two toast systems. |
| Command palette | `CommandSearch` + shadcn `Command` primitives | shadcn Command | **KEEP LOGIC; COMPOSE PRIMITIVES.** No separate palette. |
| Mobile sheet / side peek | `SidePeek`; shadcn `Sheet` only as a primitive if needed | shadcn Sheet / Drawer | **KEEP.** `sheet.tsx` and `drawer.tsx` exist but are currently unused. |

## Mockup-family mapping

The status below comes from `implementation/briefs/BUILD-MANIFEST.md`, not the
mockup header or lab badge.

### Overview

| Visible mockup area | Component route | Registry comparison | Build result |
|---|---|---|---|
| Eight-block control panel | Page-owned grid; `OverviewTasks`, `OverviewStatus`, `OverviewRoadmap`, `SmartActionPanel`, existing cards | 21st.dev bento grids are composition references only | **YES / implemented.** No generic bento install. |
| Now / Soon / Done tasks | Existing animated `Tabs`, task rows, standard create form | Animate UI Tabs for motion reference | **YES / implemented.** |
| Where I stand | `OverviewStatus`, `StatStrip`, truthful progress primitives | shadcn Progress/Chart | **YES / implemented.** No target means no bar. |
| Quarterly goal kind + goal editor | Existing controls plus a future goal-domain owner; metric and check-off states are structurally different | shadcn Progress, Checkbox, Dialog | **MOCKUP ONLY.** The deep-state mockup has no manifest row; do not code from this crosswalk. |

### Academics

| Visible mockup area | Component route | Registry comparison | Build result |
|---|---|---|---|
| Daily / Planning and sub-tabs | `ModeSwitch`, `Tabs`, `ThreeLevelNav` | shadcn/Animate UI Tabs | **YES.** Owners already exist. |
| Class Center square cards | `ClassCenter`, `Card`, shared actions/peek grammar | 21st.dev card composition | **YES.** Do not install a competing expandable-card component. |
| Class Hub views | `ClassHub`, `Tabs`, `TrackerTable`, `ResourceGrid`, `DocEmbed`, `NotesDB` | shadcn Tabs/Data Table; 21st composition only | **YES.** |
| Assignments | `AssignmentsPanel`, `TrackerTable`, standard dialog/form controls | shadcn Data Table/Dialog | **YES.** |
| Empty launchpad | `EmptyState` plus import primary action and manual secondary link | shadcn Empty is not used | **YES.** App owner is intentional. |
| Syllabus import and review | `AnimatedFileUpload`, `AnimatedStepper`, dialogs, real review state | SmoothUI upload/stepper mechanisms | **YES.** Required ports already exist. |
| Review / recall / gap report | App-owned review session with tabs, progress, and grounded generation flow | Animate UI Progress/Tabs | **YES.** Catalogs do not own study logic. |
| Planner, Tar Heel Tracker, Grades | `TrackerTable`, `Collapsible`, `ThreeLevelNav`, cards, chart wrapper where data exists | shadcn Data Table/Chart/Collapsible | **YES** for manifest rows. The renamed Tar Heel Tracker mockup path should remain aligned with the manifest before another implementation pass. |

### MCAT

| Visible mockup area | Component route | Registry comparison | Build result |
|---|---|---|---|
| Dashboard and Plan | Existing tabs/cards; `AnimatedStepper` for phases when appropriate | Animate UI Tabs/Progress; SmoothUI Stepper | **NO.** Mockups remain blocked. |
| Content | `ResourceGrid`, `AnimatedFileUpload`, `DocEmbed`, cards | SmoothUI upload; shadcn primitives | **NO.** |
| Questions and Mistakes | `InteractiveCard`, `TrackerTable`, `CenterPeek`, review-session owner | 21st expandable-card reference | **NO.** |
| Stats | `Chart`, `StatStrip`, `ContributionHeatmap` only from dated evidence | shadcn Chart; SmoothUI contribution graph | **NO.** No invented score or time distribution. |
| Advisor | A future shared conversational primitive plus provider-independent fallback | SmoothUI AI Input/message patterns may be researched later | **NO.** No chat primitive is currently installed despite older inventory wording. |
| Working session / Test Day / validity states | `FocusModeLayout`, parked `FocusSessionManagementBar`, forms and factual-state components | Animate UI Management Bar is mechanism reference | **NO / absent from manifest.** |

### Clinical, Volunteering, Shadowing, Research, Extracurriculars

| Visible mockup area | Component route | Registry comparison | Build result |
|---|---|---|---|
| Square site/org/person/project cards | `InteractiveCard` + shared record actions | 21st card compositions | **NO.** Preserve the desired square card geometry in the mockup; do not install a new card system. |
| Full-width selected-record drop-down/workspace | `RecordOpenWorkspace` / `CenterPeek`; `Collapsible` only when the record truly stays inline | 21st/SmoothUI expandable-card interaction | **NO.** Existing Premed owner prevents a duplicate. |
| Shifts, events, visits, outputs, initiatives | `TrackerTable`, `Kanban` where the spec calls for workflow columns | shadcn Data Table; 21st Kanban | **NO.** |
| Dated hour/event logging | `InlineAddRow` or standard form + `DateField`, after the data model is ruled | shadcn form/calendar primitives | **NO.** A registry component cannot solve the missing dated-log model. |
| Reflections | `NotesDB`, `MascotNote`, `InfoTip`, grounded prompt flow | No catalog block owns the domain behavior | **NO.** |
| Research/EC discovery | `ResourceGrid`, `PreviewLinkCard`, `CollectionState` | 21st card layouts only | **NO.** Sources and provenance remain product data. |

### Application surfaces

| Visible mockup area | Component route | Registry comparison | Build result |
|---|---|---|---|
| School Explore / Track | `TrackerTable`, cards, filters, saved views, record-open grammar | shadcn Data Table/Command; 21st cards | **ABSENT FROM MANIFEST.** Do not implement. |
| Essays bank / essays / writing desk | `NotesDB`, `DocEmbed`, `TrackerTable`, `Kanban` only where workflow columns are specified | shadcn primitives; 21st Kanban reference | **ABSENT FROM MANIFEST.** |
| Letters people / dossier / requests | cards, `ObjectInspector`, `TrackerTable`, `RecordOpenWorkspace` | shadcn Avatar/Card/Data Table | **ABSENT FROM MANIFEST.** |

### Landing and auth

| Visible mockup area | Component route | Registry comparison | Build result |
|---|---|---|---|
| Public hero and feature composition | `PublicShell`, `PublicHeadline`, `GlassSurface`, public tokens | 21st.dev landing blocks are composition references only | **YES.** Existing public owners remain authoritative. |
| Interactive product tour | `GuidedTour` with real DOM-rendered content | Motion in-view/scroll mechanisms | **YES.** Do not replace it with a screenshot carousel. |
| Auth and merge states | Existing public/auth owners and standard form primitives | shadcn form/dialog primitives | **YES.** No new auth component family. |

### Deliberately not mapped to code

Timeline & Tasks, Profile / CV, Help, and Settings remain undrawn in the feature
coverage sweep. A registry example cannot substitute for a product mockup.

## Candidate queue

### Use now without adding files

- shadcn primitives already present for all cleared Overview, Academics, and
  public-layer structures.
- Existing Motion-enhanced Tabs, upload, exact-number, and theme-toggle
  implementations.
- Existing Premed OS domain owners for record opening, tables, cards, empty
  states, smart actions, and navigation.

### Research when the owning mockup becomes buildable

- SmoothUI expandable-card motion for comparison against the existing
  `RecordOpenWorkspace` transition—not as a replacement.
- Animate UI progress/tabs for quiet motion improvements that preserve the
  current owner and reduced-motion behavior.
- shadcn chart examples for the exact chart type selected by the data-viz
  specification.
- 21st.dev card/kanban/timeline compositions for density and information
  hierarchy only.

### Do not install from the current mockups

- A generic bento component.
- Another card, record-open, table, toast, command-palette, or navigation
  system.
- Decorative shader, orb, cursor-follow, magnetic-button, or novelty text
  effects.
- A chat interface before its owning product surface and fallback behavior are
  cleared.
- Anything whose only home is a `NO` or absent manifest row.

## Implementation checklist

Before adding a registry item:

- [ ] The owning mockup is `YES` in `BUILD-MANIFEST.md`.
- [ ] No existing Premed OS component already owns the job.
- [ ] The candidate solves a behavior or accessibility gap, not a styling wish.
- [ ] Its source and transitive dependencies were reviewed.
- [ ] No new package is required, or the new dependency was explicitly flagged.
- [ ] Demo data, colors, fonts, radii, spacing, icons, and CSS are discarded.
- [ ] The port uses app tokens, `src/lib/motion.ts`, keyboard behavior, both
      themes, and `prefers-reduced-motion`.
- [ ] The component is exercised by a real cleared surface and a real empty or
      partial state; it is not merely parked to satisfy an inventory list.
- [ ] `component-inventory.md` is updated with separate **exists**, **used**,
      **parked**, and **approved-to-build** states.

## Result of this audit

No new component code was added. The cleared mockup families already have an
existing primitive or Premed OS shared owner for every catalog pattern found.
Adding a registry component now would either duplicate an owner or implement a
surface still blocked by the manifest. The useful deliverable is therefore the
verified map above and the correction of inventory language—not speculative
component code.
