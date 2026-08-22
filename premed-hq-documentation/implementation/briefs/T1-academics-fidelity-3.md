# T1 · Academics — Class Hub record-surface fidelity

**Stage:** E · FRONTEND MISSING  
**Status:** fidelity implementation brief. The per-class record, its five-tab
grammar, its data, and its actions already exist. Translate the Class Hub into
the approved compact course-workspace hierarchy without reimplementing its
features or discarding later app annotations.

## 0. Outcome

An opened class should feel like one dense, calm workspace rather than a stack
of interchangeable dashboard panels. The banner establishes the class and its
single primary action; the active tab then presents a deliberate working
surface: a centred status/next-action area, grouped course material, ordered
topic or assignment rows, and notes *about* the class. The warm page → solid
panel → dense-object ladder must be visible in both themes. Only the banner
stat strip floats as glass.

This is a **frontend fidelity pass**. It does not change how course data is
stored, what an assignment means, how source-grounded generation works, or how
Calendar review is connected.

## 1. Step-1 audit

### A. Spec → paper

**Pass for the Class Hub owner.** The approved mockup and companion record
cover the five core tabs, course-type variants, shared banner, per-tab empty
states, source ownership, the generated-material boundary, and responsive
shape:

| Ruled Class Hub behaviour | Reviewable source |
| --- | --- |
| Five-tab STEM workspace and the shared course banner | `tabs/01-academics.md` §4.1-I; `academics-class-hub.{html,md}` |
| Type-specific Writing / General forms without dormant STEM machinery | §4.1-N; `academics-class-types.{html,md}` |
| Material provenance, contextual generation intake, local capture, and Calendar review | §4.1-I/Q; `academics-materials-extensions.{html,md}` and `academics-lecture-capture.{html,md}` |
| Recall, exam scope, learning signals, and topic links | §4.1-J/L; their corresponding approved Academics mockups |
| Notes about the class kept distinct from course material | §4.1-I; `academics-class-hub.md` |

Canvas Path B (a Canvas REST client, grade sync, and announcement relay) is
**not a paper or implementation gap** for this pass. The current ruling keeps
that path paused; the approved Path A drawing is the read-only Calendar-feed
review route. Do not let that deferred integration block visual translation.

### B. Mockup → app

| Surface | Existing app evidence | Result |
| --- | --- | --- |
| Shared header, type-specific primary action, quiet overflow, compact facts, stat strip, and 4–5 tab grammar | `src/components/academics/ClassHub.tsx:179-295` | **Built behaviour.** Keep the configured tab set and all route/query-state behaviour. |
| STEM overview: status, material coverage, study method, signals, schedule, exam scope, notes, grade breakdown, contacts, professor evidence, and recall history | `ClassHub.tsx:365-489` | **Built behaviour, visually divergent.** It currently reads as a long sequence of broad generic `Panel`s rather than the mockup’s intentional working groups and dense information hierarchy. |
| Writing / General overview variants | `ClassHub.tsx:493-530`; class-type drawings | **Built behaviour, visual verification required.** Translate their approved type-specific hierarchy; do not expose empty STEM measures in a non-STEM course. |
| Materials, Topics, Assignments, and Notes | `ClassHub.tsx:690-940` | **Built behaviour, visually divergent/partial.** The sections are real and correctly owned, but all use the same wide Card/toolbar rhythm. They need the approved group-header, dense-row, and side-rail hierarchy without absorbing the mockup-lab’s review-only state chips. |
| Generated Notes / Flashcards / Guides and course-note distinction | `ClassHub.tsx:754-807,900-938`; `8a2a0f6`, `25afa16` | **Built and annotation-backed. Preserve.** Source intake remains contextual; it is not a persistent Materials tab strip. |
| Class-peek and split record-open model | `ClassHub.tsx:301-363` | **Built behaviour. Preserve it.** This fidelity pass must not turn a peek into a duplicate course page. |

#### Measured primary record surface — August 22, 2026

The live Class Hub could not be measured against a fresh anonymous browser
profile because it contains no user course record. Use the verified live
Academics surface ladder already measured for the same signed-in app, then
repeat the actual measurement against an existing course before committing.
The approved Class Hub mockup defines the dark roles as:

| Surface role | Approved drawing |
| --- | --- |
| Page canvas | `#211e1a` |
| Solid course panel | `#2b2722`, `#3c352d` border, `16px` radius |
| Dense grouped object | `#322e28`, `#3c352d` border, `13px` radius |

The application’s verified warm-dark equivalents are `rgb(33, 30, 26)`,
`rgb(43, 39, 34)`, `rgb(60, 53, 45)`, and `rgb(50, 46, 40)` respectively.
The same role ladder must have a light-theme analogue; no mockup literal,
font, radius, or inline CSS may enter `src/`.

Before the implementation commit, capture in the report:

1. one computed-style row for canvas → solid course panel → dense row in dark;
2. the same three roles in light; and
3. a narrow desktop/mobile screenshot proving tab overflow and side content
   stack instead of clipping.

### C. Already built — preserve, do not rebuild

- Course/workspace reconciliation, current data model, migration chain, and
  all existing completion/grade/review calculations.
- The five-tab grammar: **Overview · Materials · Topics/Readings ·
  Assignments · Notes**. Never create a sixth persistent Class Hub tab.
- The PageHeader / StatStrip contract: facts are an inline course line;
  variable metrics live in the banner strip; the strip is the only glass
  surface on this page.
- Later annotation-backed behaviour, including contextual output-first
  Materials intake, Revised Notes under Materials, preserved source
  ownership/provenance, due-language corrections, and existing empty states.
  An annotation outranks an older mockup screenshot when they differ.
- `MaterialGenerationIntake`, `MaterialCatalog`, `AssessmentCatalog`,
  `FlashcardDecks`, `LectureCapturePanel`, `CalendarReview`, `StudyMethodPanel`,
  `LearningSignalsPanel`, `ProfessorEvidencePanel`, and the existing shared
  primitives. Compose/configure them; do not fork them.
- Keyboard navigation, reduced motion, tooltips, screen-reader labels, focus
  states, centre-peek/split behaviour, and data reload behaviour.

### D. Manifest gate

`BUILD-MANIFEST.md` marks `01-academics/academics-class-hub.html` **YES**.
The related, already-approved shared owner drawings named above are also
manifest-cleared where used. Do not edit the manifest or infer authority over
its `NO` concept rows.

### E. Decisions file

**Pass.** `mockup-lab/01-academics/academics-class-hub.md` records both
behaviour and appearance: warm-dark ladder, one floating stat strip, exact
tab grammar, group hierarchy, type-specific absence, and responsive treatment.
The Materials-extension record separately confirms that its many lab chips are
state selectors only—not app navigation.

### F. Integrations and services

| Dependency | Classification | Required handling |
| --- | --- | --- |
| Local Academics store and course-owned records | **CODE BUILT AND CONFIGURED** | Reuse; no shape/migration change belongs in this pass. |
| Server-side source-grounded generators | **CODE BUILT; live end-to-end proof still required** | Preserve their current contextual entry and unavailable state. Do not add browser-side keys. |
| Google Calendar / Canvas Path A | **CODE BUILT; individual feed proof is separate** | Preserve the Calendar Review component and its honest disconnected/feed-unavailable states. No Canvas token/API/REST work. |
| Canvas Path B, Drive/GoodNotes/Anki sync, whole-textbook lookup | **NOT IN SCOPE / UNCONFIGURED** | Do not add, imply, or mock a live connection. |

This does not create an Andy configuration checklist: no service needs a new
setting for a visual translation. The existing real-account Calendar and
generation runs remain promotion proof, not fidelity prerequisites.

## 2. References — read before changing code

- `premed-hq-documentation/tabs/01-academics.md` §4.1-I, §4.1-N, §4.1-Q,
  §6.4, §6.10-A, and the class-type rules.
- `premed-hq-documentation/specifications/01-shared-interface-patterns.md`
  §2–§5c.
- `premed-hq-documentation/specifications/04-visual-craft-standards.md` §0,
  §0a–§0c.
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`.
- `mockup-lab/01-academics/academics-class-hub.{html,md}` plus the specific
  supporting owner drawing only when touching that existing component.
- `src/components/academics/ClassHub.tsx`, its imported shared components, and
  `src/index.css` tokens.

## 3. The work — translate one existing record surface

### 3.1 Shared Class Hub chrome

1. Keep the existing `PageHeader`, course title/subtitle, inline fact line,
   stat-strip data, primary action, overflow, and tab route state. Do not
   make the header taller just to reproduce mockup copy.
2. Make the hierarchy match the mockup: the class identity and one primary
   action establish the page; facts recede to the compact line; the stat strip
   is a single quiet floating slab; underline tabs stay on the banner’s lower
   edge. No full-width dividers or a card around every fact.
3. Retain only opacity/transform for entrance motion and respect reduced
   motion. Hover/selection motion remains background/color only; never move
   the shell or change layout to make an interaction feel animated.

### 3.2 Overview: group work, not panel wallpaper

1. Recompose the existing overview children into the mockup’s clear bands:
   **status/next action**, **schedule and exam context**, then **supporting
   class record**. Do not delete any built, data-backed panel just because it
   is not visible in the narrow mockup viewport.
2. Use the primary solid course panel for each major band. Within it, use dense
   grouped headers/rows for metrics, coming work, lectures, grade categories,
   and contacts. Equal-height neighbouring pieces must share a deliberate
   baseline; nothing may protrude or acquire a scrollbar.
3. Treat absence honestly. A course without an exam, lecture note, contact,
   grade category, signal, or professor evidence gets its existing one-line
   empty/recovery state—not a zero metric, fake percentage, or placeholder
   record.
4. Keep type-specific variants meaningful: Writing prioritizes readings,
   drafts, feedback, and assignments; General does not render hidden STEM
   tracking. Switching type preserves dormant records as the current model
   already requires.

### 3.3 The four tab work surfaces

1. **Materials:** retain its output-first actions, contextual source intake,
   source ownership, filters, generated-artifact visibility, and review
   components. Visually group the shelf by unit/module with compact headers
   and dense file rows. Do not re-add a permanent `Add material` action in the
   header if the latest annotation routes source addition from the chosen
   output intake.
2. **Topics / Readings:** retain filtering and actions, but make units/readings
   read as deliberate grouped work surfaces. A topic’s exam context and any
   real earned signal may be shown; do not invent a readiness/composite score.
3. **Assignments:** preserve category/weight and What-If behaviour. Use the
   shared dense row geometry for an assignment and its recorded outcome; no
   fabricated grade or zero-width bar when data is absent.
4. **Notes:** retain the separation between *notes about the class* and
   material/generation. Keep the existing proposal/confirmation flow for
   professor remarks and their source timestamp/evidence; make the section
   stack readable without creating a second library.

### 3.4 Responsive and accessibility proof

- At shorter desktop heights, reduce density and group gap before clipping;
  no internal Class Hub scrollbar.
- At narrow widths, facts and stat-strip metrics wrap/stack, tabs horizontally
  scroll with their existing accessible semantics, and any overview side rail
  moves below the main work rather than overlapping it.
- Preserve focus order: page action → overflow → active tab → content controls.
  Every control remains reachable by keyboard and retains its current label.

## 4. Do not break / prohibited work

- No data-model change, storage migration, source ingestion rewrite, AI prompt
  change, provider secret, OAuth change, or Calendar/Canvas API work.
- No new Class Hub tab, duplicate Materials library, duplicate generator,
  duplicate inspector, static mock data, or placeholder/pretend course facts.
- No token, font, palette, radius, or global theme change; do not copy inline
  mockup CSS. In particular, do not alter the deliberately separate signed-in
  blues (`--primary`, `--ring`, `--sidebar-*`, `--cat-gpa`).
- Do not flatten the work surface, add full-width dividers, turn dense rows
  into long generic rectangles, or put glass on dense content/data surfaces.
- Do not delete later annotation-backed controls to make the app resemble an
  older drawing. Reconcile the visual hierarchy around them.
- Do not make a source-less output, claim automatic Canvas/GoodNotes/Drive
  intake, bundle a deck, or read/schedule Anki cards.

## 5. Done when

- [ ] The route for a real STEM course retains its existing Overview,
  Materials, Topics, Assignments, and Notes behaviour, including reload and
  query-tab selection.
- [ ] Its header matches the approved hierarchy: compact facts, one floating
  variable-stat strip, quiet overflow, and underline tabs; no additional glass.
- [ ] The Overview and each owned tab use the warm canvas → solid panel →
  dense row ladder in both themes, measured with computed styles before commit.
- [ ] The initial page no longer reads as a wall of identical broad rectangles;
  relationships are communicated through bands, group headers, dense rows, and
  intentional whitespace.
- [ ] Writing and General classes remain type-specific with dormant STEM
  panels absent, not blank.
- [ ] All empty states are friendly, evidence-honest one-liners; no fake data,
  score, ranking, composite metric, or unearned progress is introduced.
- [ ] Keyboard-only, screen-reader labels, responsive wrap/stack, and
  `prefers-reduced-motion` work; desktop has no accidental internal page
  scrollbar or clipping.
- [ ] `npm run test` and `npm run build` pass. Report the two-theme
  measurements and screenshots in the execution result.

## 6. Commit

`fix(academics): translate Class Hub record hierarchy`

Commit only the fidelity implementation and directly related tests. Leave
unrelated docs, mockup-lab edits, data/research work, and user changes alone.

## 7. Next stage — not in this brief

Re-run `TAB-BRIEF-PROMPT.md` after this is verified. The next audit must test
the remaining Academics owner surfaces rather than assume the tab is complete:
real signed-in source-generation/export, real Calendar-feed review, a true
empty store, both themes, and every manifest-cleared page’s six promotion
conditions. Do not promote any page merely because its frontend compiles.
