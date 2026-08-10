# 01 — Shared Interface Patterns

**Status:** Approved for implementation (core patterns locked July 2026)
**Repo:** `sasquach67/Premed-OS` — `src/components/common/*`, `src/components/ui/*`
**Depends on:** `specifications/00-product-shell.md`, `architecture/01-global-design-system.md`, `general.md`

---

## 1. Purpose and Scope

This spec defines the reusable interface grammar every tab consumes, so tab specs never re-describe it. When a tab says "opens the inspector" or "shows the list," it means the patterns defined here.

Owns: the record-open model (peek / expand / split), the object inspector, list presentations, forms & editing, empty/loading/error states, bulk operations, saved views, undo/recovery, focus mode, toasts, and the shared keyboard grammar for these.

Does not own: shell chrome (`00-product-shell`), page-specific content, or domain logic (tab files).

These patterns are shared components configured per tab (per `architecture/01` component philosophy) — a tab configures columns/sections/actions, it does not fork the component.

---

## 2. The Record-Open Model (centerpiece)

The single most important interaction: what happens when you click a record (a clinical experience, a course, a school, an essay). Locked model — **three zoom levels of the same record**, switchable from a control cluster in the peek's top-right.

### 2.1 Peek (default)

- Clicking any record opens a **center peek**: a floating mini-page card over a **blurred + dimmed** backdrop of the current page (Notion center-peek / Arc new-tab feel). The list stays alive behind the blur.
- Size: centered card, roughly `min(920px, 72vw)` wide × `~85vh` tall, rounded, elevated shadow, scrollable body.
- Contains the object inspector sections (§3).
- **Top-right control cluster:** `Split` · `Expand` · `Close` (icon buttons, in that order).
- Dismiss: click backdrop, `Esc`, or Close — all guarded if there are unsaved edits (§5).
- This **supersedes the current right-slide `SidePeek` as the desktop default.** `SidePeek`'s slide-over form is retained as the **mobile** presentation (§2.4) and may be reused for lightweight confirmations, but the standard desktop open is the center peek.

### 2.2 Expand (full page)

- `Expand` promotes the peek to a **full-page detail route** (e.g., `/clinical/exp/:id`), deep-linkable and back-navigable (per `architecture/01` deep linking). The blurred list is replaced by the full page; a breadcrumb (`Parent / Record`) returns to the list (shell §7.7).
- Same inspector content, more room. Use for records with heavy content (an essay, a research project with many outputs).
- The reverse (`collapse` back to peek) is available from the full page.

### 2.3 Split (side-by-side)

- `Split` docks the open record to **one half** of the workspace; the **other half shows the list it came from.**
- In split, clicking another list item loads it into the record pane **without closing** — fast review-through-many (triage a stack of experiences, grade a list of tasks).
- **Pin for paired work:** from split, a `Pin` action locks a *second object* into the opposite pane instead of the list — the genuine two-object cases (essay + its source experience, study plan + selected topic, recommender + letter). Pinned split is how `architecture/01`'s split-view examples are satisfied.
- Split state is per-workspace and preserved while navigating within it (`architecture/01` state preservation).

### 2.4 Responsive

- **Desktop (≥lg):** peek → expand → split all available.
- **Tablet:** peek and expand available; split collapses to a stacked/tabbed two-pane (no room for true side-by-side).
- **Mobile:** the peek becomes a **full-screen sheet** (the retained `SidePeek` slide-up). Expand = same sheet. Split is unavailable — paired work becomes tabs within the sheet. One mental model, adapted to width.

### 2.5 Keyboard

| Keys | Action |
|---|---|
| `Enter` / click | Open peek on focused record |
| `Esc` | Close peek → exit split → (nothing) in stack order |
| `Cmd/Ctrl + \` | Toggle split for the open record |
| `Cmd/Ctrl + .` | Toggle expand/collapse |
| `↑ / ↓` in split | Move through the list, loading each into the record pane |

---

## 3. Object Inspector

The content shown inside peek / expand / split. **Lean core always visible; heavier sections revealed on demand** (progressive disclosure per `architecture/01`).

**Always shown:**

1. **Overview / Details** — the record's core fields, inline-editable (§4).
2. **Relations** — linked entities with backlinks ("where is this used"); each relation opens its own peek.
3. **Files** — attachments/links (uses `DocEmbed` where relevant).
4. **Activity** — recent changes/log for this record.
5. **Actions** — context quick-actions (archive, duplicate, export, link, plus tab-specific actions).

**Revealed on demand (collapsed by default):**

6. **Notes** — freeform notes.
7. **Data quality** — the record's health warnings (missing verification, invalid dates…) with severity, feeding the review queue (shell §7.5).
8. **History** — true version history is deferred for launch for every entity. Activity remains the available audit-oriented surface; revisit version history first for Essays in a later chunk.

Rules:

- The five core sections are consistent across **every** entity type in every tab — this is what makes 14 tabs feel like one product. A tab may not drop a core section; it configures each section's fields.
- Each section is a labeled region; the inspector is keyboard-navigable; relations and files are lists of real links, not text.
- Empty sections show a one-line "nothing yet" + the add affordance, never a blank void.

---

## 4. Forms & Editing

Per `architecture/01`, edit as close to the data as practical. Preference order:

1. **Inline** — edit fields in place (the `TrackerTable` cell model; inline fields in the inspector Overview).
2. **In the peek** — the record's own inspector is the primary editor.
3. **Full page (expand)** — only for complex records.

Contract:

- **Autosave is the default** (`architecture/01`). Show unobtrusive save status (Saved / Saving) using the shell's sync-state vocabulary. No manual "Save" button for routine edits.
- Where an explicit commit is needed (destructive or structural), require confirmation (§7).
- Validate continuously; required fields clearly marked; partial work preserved (`architecture/01` forms).
- **Unsaved-changes guard:** closing a peek/expand with a field mid-edit prompts before discarding.
- Quick *creation* uses the shell's Quick Add (`00-product-shell` §7.4); this section governs *editing existing* records.
- Long-text fields with AMCAS limits show the existing character counter (`TrackerTable` `maxLength`).

### 4a. Form controls must be in-app, never native OS chrome (global rule)

**Every interactive control renders in the Premed OS design system — never the browser/OS native widget.** This applies across every tab and surface.

- **Dropdowns / selects:** use the app's styled menu (Radix `Select`/`DropdownMenu` primitives already in the repo), matching the app's surfaces, radius, and type — not the native `<select>` popup or macOS-style menu.
- **Date pickers:** clicking a date field opens the **app's own calendar popover**, styled to the design system — not the native browser date picker.
- **Time pickers, comboboxes, popovers, tooltips, context menus:** all in-app styled, consistent across tabs.
- Rationale: a native OS dropdown (see the status menu in Class Center — Not Started / Seen / Notes Made / Reviewing / Weak / Ready) breaks the visual language and looks pasted-in. Controls must feel native to Premed OS, not to the operating system.
- **Exempt — native file input:** `<input type="file">` is permitted; the OS file-browse dialog cannot be reimplemented in-app. Style the trigger button; the native picker itself is fine. The prohibition covers selects and date/time/month pickers only.
- **Acceptance:** no raw native `<select>` dropdowns or native date/time pickers anywhere in the product; all use the shared styled components in both light and dark mode.

---

## 4b. Mode Switch (page-level, reusable)

Some pages split cleanly into two mental modes — an **operational/daily** mode and a **strategic/planning** mode — each with its own natural tab set. For these, use a page-level **mode switch** instead of one long flat tab bar.

- **Anatomy:** a segmented control — a **new `ModeSwitch` component** (iOS-Focus-like) at the top of the page. **Do not reuse or rename the existing `SegmentedBar`** — that name is already the Overview progress visualization (a different purpose); add `ModeSwitch` to avoid the collision. It is the *only* primary nav layer; selecting a mode **swaps the entire tab bar** to that mode's tabs, so the user never sees two tab levels simultaneously.
- **When to use:** only when a page has two genuinely distinct modes each needing ≥1 tab. Do **not** apply to pages with a single coherent tab set — a mode switch with one tab per mode is just confusing tabs.
- **State:** last-used mode persists per user (shell-owned setting); deep links carry mode + tab (`?mode=&tab=`). Keyboard-focusable; arrows move between modes.
- **Motion (explicit):** the swap **animates** — outgoing tab set/content exits and the incoming one enters via a **Shared-Axis transition** (horizontal slide + fade through `<AnimatePresence>`, per `04` §7a), so moving Daily↔Planning feels like sliding between two spaces, not a hard cut. The segmented indicator itself slides under the active mode via **`layoutId`**. Reduced-motion → an instant crossfade (no slide). This is a requirement, not optional polish.
- **First adopter:** Academics (Daily = Class Center + Assignments; Planning = Planner & GPA + Requirements + Archive — see `tabs/01-academics.md` §4). **Candidate:** MCAT (study vs. planning/stats) — confirm when designing that tab.
- Do not proliferate: two modes max. A third "mode" is a sign the page should split or the tabs should reorganize.

### 4b-i. Three-level navigation hierarchy — one form per level (LOCKED, global)

A page with a mode switch has **three stacked levels of chrome**: mode → tabs → filters. If all three render as rounded pill groups on a dark track (the original Academics build), they are visually identical and the hierarchy collapses — nothing tells the user which is primary navigation and which is just a filter. **Three levels must use three different visual forms.**

| Level | What it is | Form (binding) | Placement |
|---|---|---|---|
| **1 — Mode** | Swaps the entire tab set (Daily / Planning) | **Segmented pill**, frosted glass (floats over banner imagery → glass is correct per `04` §0c), white active thumb | **On the banner**, under the title |
| **2 — Tabs** | Sections within the mode | **Underline tabs** — no container, no track; label + optional count badge, **accent underline** on active (per-pillar `--cat-*`) | Along the **banner's lower edge**, forming the boundary between banner and content |
| **3 — Filters** | Term, search, view, density — *controls, not navigation* | **Form controls**: `Select` dropdown + search `Input` + count + small view `Toggle Group`. Solid, no blur (§4a in-app styled) | **Filter bar on the solid page**, directly under the banner |

**Rules**

- Never render two adjacent levels in the same form. Pills-under-pills is a defect.
- **Term/period pickers are dropdowns, not pill rows** — pill rows break once a student has 6+ terms; a `Select` scales and reads as a filter.
- The mode switch is the visually loudest element of the three (it has the widest consequence); filters are the quietest.
- Under a mode switch, only the **current mode's** tabs render (2–3), never the full union of all tabs — this alone removes most of the crowding.
- Reference implementation: `specifications/mockups/_shared/nav-hierarchy-3-levels.html` and `tabs/01-academics.md` §4.
- *(Rejected: putting the mode switch in a vertical left sub-rail. It costs page width, adds a second vertical rail beside the app sidebar, and a two-item vertical list is awkward — verticals need length to justify themselves.)*

---

## 4b-ii. Page banner — the compaction rule (LOCKED, global)

**Prefer the banner. Compact upward.** Every domain tab has a themed banner hero. Push page-level chrome and page-level metrics *into* it rather than spending vertical panels on them. A tall stack of small header widgets below the banner is a defect when the banner has room.

**What belongs in the banner**

| Element | Placement |
|---|---|
| Page title | left. **Just the title** — no breadcrumb-style group label ("Foundation"), no descriptive subtitle line ("Fall 2026 · 5 classes · 16 credits") |
| **Variable stat strip** | right — a compact glass strip of 3–5 metrics with value + micro-label (+ ▲/▼ direction where meaningful) |
| Secondary page action | right of the strip (ghost button, e.g. "How to study") |
| Mode switch (level 1) | below the title (`§4b-i`) |
| Tabs (level 2) | banner's lower edge (`§4b-i`) |

**The variable-metric rule (binding).** *Only metrics that change belong in the banner strip.* If a number can't move week to week, it is not worth the space — put it in a panel or omit it.

- ✅ term GPA, cumulative GPA, items due today, current streak, hours logged, days until a deadline
- ❌ credit count, number of enrolled classes, catalog year, program name — static facts

**Restraint:** 3–5 stats maximum. The strip is a glance, not a dashboard — anything needing a graphic (trend, distribution, contribution) belongs in a bento panel, not the banner.

**Glass:** the stat strip and mode pill float over banner artwork, so they take **frosted glass**; everything below the banner is solid-with-depth (`04` §0c).

---

## 4c. Right-click Context Menu (global pattern)

Records across the app support a **right-click context menu** (`Context Menu`) as a power-user shortcut. It is a floating overlay, so it keeps **full frosted glass** (`04` §0c) while the rows beneath it stay solid.

**Governing rule (binding):** *the context menu never contains an action that has no visible equivalent elsewhere.* It is always a faster path to something the user could also do via a visible control, inline edit, or the record peek. A capability that exists **only** on right-click is a defect — right-click is undiscoverable and unavailable on touch.

**Standard item order** (include only what applies): prioritize (star / mark important, `⌘I`) → tag / categorize (submenu) → set date → move / change status → open / duplicate → destructive (delete / archive, styled destructive, separated).

**Confirmed surfaces:**

| Surface | Items |
|---|---|
| **Overview → Tasks row** | Mark important ⌘I · Tag ▸ · Set due date · Move to Soon · Duplicate · Delete |
| **Any `TrackerTable` row** | Open · Duplicate · Copy link · Archive · Delete |
| **Experience / activity cards** | Log hours · Add reflection · Mark most-meaningful · Add verifier · Archive |
| **Academics — course row** | Edit grade · Toggle BCPM · Move term · Open class hub · Archive |
| **Academics — Class Center topic** | Mark Seen / Weak / Ready · Review now · Add note · Open in Anki (if Anki-owned) |
| **School List row** | Move tier · Add to compare · Mark applied · Remove |
| **Letters row** | Mark received · Send follow-up · Copy request template |
| **Essays draft** | Duplicate draft · Mark final · Link to school |
| **Timeline event / milestone** | Reschedule · Convert to task · Snooze · Delete |

Touch/mobile equivalent: long-press opens the same menu; every item also remains reachable from the row's visible overflow control or the record peek.

---

## 4d. Pacing & projections (LOCKED, global)

**Projection over description.** Premed OS's job is to tell the user *where they land*, not just where they are. Wherever a rate exists, prefer a forward statement to a static count. This is a core product value, not decoration.

**The form.** Always the same shape: **"at THIS RATE → THIS OUTCOME by THIS DATE."**

> At **+7/week** → all **65 topics ready by Nov 18**.
> At **3 topics/day** you'll be **8 of 9 exam-ready by Thursday** — one day early.
> This term lands cumulative at **3.69**. An A− in CHEM holds **3.71**.
> On pace for **23 study days** this month.

**Honesty (binding).** Projections are **deterministic arithmetic over observed rates** (`06`), never model guesses and never optimistic rounding. Show the rate the projection is based on so it can be checked. If there isn't enough history to compute a rate, show **nothing** — never invent a trend. A projection is a fact about arithmetic, not a prediction about the person.

**Restraint (binding).** Projections lose meaning when they're everywhere.

- **At most ONE pace line per panel.**
- Only where a projection **changes what the user would do** — exam readiness, GPA outcome, goal pace, deadline feasibility.
- **Never** on streaks, raw counts, or anything already self-evident.
- Charts may carry a **dashed projection segment** past "today" — that counts as the panel's one projection.

**Controls.**

- Each pace line is **dismissible** (× on hover). Dismissal is remembered per line.
- Dismissing **collapses to a quiet "Show projection" pill** — it is a preference, not a deletion, and is always one tap from returning. Chart projection segments fade rather than disappear.
- Settings carries two global switches: **Show pace projections** (off = none anywhere) and **Only on exams & deadlines** (hides pace on trends and habit metrics).

**Visual treatment.** A distinct chip: tinted background + hairline border + trend-up icon, colored by outlook — **success** (ahead / on pace), **primary** (neutral projection), **warning** (behind / at risk). Bold Baloo on the numbers and the date. Never a plain sentence buried in body text.

---

## 4e. Interactive card pattern (LOCKED, global)

Applies to every clickable card that also carries its own action buttons — class cards, experience cards, school cards, resource cards.

**The problem it solves:** if a card is clickable *and* has buttons, users can't tell that the card body itself is a target, and the two hit areas fight each other.

**Rest state — calm.** Neutral border, **no accent bar**, no elevation change. Entity identity (per-pillar or per-class color) reads from a **small colored dot** beside the title, not a full bar. A grid of cards at rest should be quiet.

**Hover on the card body — three simultaneous signals:**

1. A **left accent bar ignites** in the entity's accent color (hidden at rest),
2. the **full border + a soft outer glow** turn that accent,
3. the card **lifts** (`translateY(-3px)`, transform only), and a secondary line **swaps to an explicit affordance** — e.g. the deadline line becomes **"Open class hub →"**.

*(No corner ↗ badge — the border light, lift, and swapped affordance are sufficient, and the badge added a floating element to an otherwise clean card.)*

**Hover on an action button inside the card — the card stays completely unlit.** No lift, no border light. Only the button fills. The two click targets must never appear active at the same time.

**Composition:** **one primary action** on the card face + an **overflow `⋯`**, separated from the card body by a divider. Never a row of 3–4 equal icon buttons — with N cards on screen that becomes 4N competing controls. Everything else goes in the overflow or the right-click menu (`§4c`).

Motion per `04` §7a (120ms, transform/opacity only, reduced-motion honored).

---

## 4f. MascotNote — the explanation pattern (LOCKED, global)

The mascot is the app's voice for **explaining and teaching** — the "why this matters" moments. It gets **one reusable component**, `MascotNote`, used identically everywhere. It is never a control.

**Anatomy**

`[mascot illustration ~38px] · message (1–2 lines, plain language) · [SOURCE LABEL] · [optional actions] · [optional dismiss ×]`

- **Message:** conversational, second person, specific. Bold the number or the operative word. Never more than two lines.
- **Source label:** small uppercase dim text under the message (e.g. `R/PREMED`, `HOW SPACED REPETITION WORKS`). **Cite the source when one exists** — r/premed, an uploaded guide, an Atlas-ingested source. If the line is app guidance with no external source, **omit the label** rather than inventing one (`architecture/02` citation/traceability).
- **Dismiss:** teaching and tip variants are dismissible and the dismissal is **persisted**.

**Variants** (same shape, different tint)

| Variant | Tint | Use |
|---|---|---|
| **Tip** | neutral `muted` | ambient advice on a solid surface |
| **Banner** | frosted glass | the same note floating over banner artwork (`04` §0c) |
| **Teaching** | primary/`--cat-mcat` tinted | just-in-time micro-lessons and walkthrough steps |
| **Empty state** | dashed, transparent | the friendly one-liner + first action when a collection is empty |
| **Milestone** | success tinted | a **real** threshold reached |

**Where it belongs**

- **Just-in-time micro-lessons** — the first time a mechanism appears, explain it once (Academics §4.1-F: *"the scheduler predicts you're about to forget this — recalling it at the edge is what makes it stick"*).
- **First-run walkthrough steps** (with `Animated Stepper`).
- **Empty states** — every empty collection gets a mascot line + the first action, never a blank void.
- **Milestone recognition** — goal hit, first publication, letter received, certification renewed.
- **Ambient tips** on a banner, sourced.

**Restraint (binding)**

- **Never on errors, failures, or destructive confirmations.** A cartoon delivering "couldn't save" or "delete 12 records?" reads as flippant — use the scoped-error pattern and `Alert Dialog`.
- **Never as a UI icon, button, nav item, or inline label.** Illustration only (`CLAUDE.md`).
- **Maximum one per view.** Two turns character into noise.
- **Teaching notes fire once per concept**, then are permanently dismissed. Generic encouragement on every visit is nagging.
- **Milestones only on real thresholds** — never manufactured praise.

**Component:** `MascotNote` (new shared component) — mascot asset + `Card`-style container + optional `Smooth Button`s + persisted dismissal. Motion per `04` §7a (fade/slide in, `AnimatePresence` on dismiss); milestone variant may use the spring celebration.

---

## 4f-i. InfoTip — define the term at the point of choosing (added Aug 2026, GLOBAL)

**Andy, Aug 2026:** *"Upon hovering over a mechanism there should be little pop-up boxes of text that serve as clarifying information. For role kinds, people haven't really heard the explicit difference between elected and appointed. If students feel unsure about picking a certain role, they should be able to hover over it and it tells them 'select this if…'. It could help with reducing confusion among students."*

**The component already exists.** `InfoTip` is named in `implementation/component-inventory.md`, and `tooltip.tsx`, `hover-card.tsx`, and `popover.tsx` all ship in the repo. **What was missing is the rule for when to use it, and the content.**

### Why this is a real gap and not polish

**This app is for people learning a process they do not know yet.** It asks students to choose between `elected` and `appointed`, `direct` and `indirect` service, `MD` and `DO`, `BCPM` and non-BCPM, `most meaningful` and not, `verifier` and supervisor — **and every one of those is a term of art the user is meeting for the first time.**

**A dropdown of unfamiliar words produces a guess, and a guessed field is worse than a blank one** — it looks like data and is not.

### The rule

- **Every enum, preset list, and term of art gets a definition** reachable at the point of choosing. **Not in Help, not in a doc — on the option itself.**
- **One line, phrased as a choosing instruction**, not a dictionary entry: *"Pick this if the membership voted you in,"* not *"Elected: chosen by vote."*
- **Glass, per `04` §0c** — tooltips float over content, which is where frosted glass is correct.
- **Never required, never blocking, never a step.** It is there when wanted and invisible otherwise.

### How it differs from `MascotNote` (§4f) — and this matters, or someone will build the wrong one

| | |
|---|---|
| **`MascotNote`** | Teaches **a concept** on a surface. *"What counts as clinical, versus service?"* Dismissible, persisted, appears once |
| **`InfoTip`** | Defines **a term** at the moment of choosing it. Appears on demand, every time, never dismissed |

**A MascotNote explaining every enum value would be an app that lectures. An InfoTip is an answer to a question the student just asked by hesitating.**

### Non-negotiables that hover-only designs get wrong

- **Hover does not exist on touch.** The trigger must be **tap-to-open on mobile** and hover-or-focus on desktop.
- **Keyboard reachable.** `:focus-visible` opens it; it is not a mouse-only affordance (`04` §8, AA).
- **Never the only place the information exists.** A student who cannot open it must still be able to choose sensibly — the option labels do the primary work.

### The content is data, not JSX

**Definitions live in one place** — a glossary keyed by field and value — **not scattered inline across components.**

- **It can be reviewed as a whole**, which is the only way the voice stays consistent.
- **It is sweepable** by S1's humanizer pass (`deferred.md`), which cannot reach strings buried in a hundred components.
- **It is translatable and reusable** — the same definition of `direct service` should appear identically on Volunteering and in Profile/CV's export preview.

> **Scope note.** This is **app-wide from day one, not a per-tab decision.** Every pillar has enums this applies to: Volunteering's `direct | indirect` and population presets, Clinical's `setting` and `verifier`, Shadowing's `degree` and `practiceEnvironment`, Extracurriculars' `roleKind` and `level`, Academics' `BCPM`. **The first tab to build it writes the glossary infrastructure; the rest add rows.**

## 4g. Anki export — format and note types (LOCKED, global)

Applies to **every** surface in HQ that produces flashcards — Academics class material, Academics mistakes, MCAT mistakes, and anything added later. **One export pipeline, one format, one set of note types.**

Governing rule stays unchanged (`02-mcat` §5h): **HQ generates, tags, and exports. Anki reviews. Nothing reads back.** HQ never writes into the user's collection — it produces a file the user imports.

### Format: `.apkg`, always (LOCKED — Andy, July 2026)

**Every export is an Anki package (`.apkg`). No exceptions, no per-tab variation.**

- **Why it's absolute:** `.apkg` bundles **notes + media + note type + deck structure** in one file. A tab-separated `.txt` cannot carry images — Anki's text importer treats `<img src="…">` as a reference to a file that must *already* be in `collection.media`. Any card with a screenshot, diagram, or structure would force the user to hand-copy a media folder on every export and eat broken images on mismatch. **That is a chore, and chores are how a feature dies.**
- **Import is double-click.** No field mapping, no media shuffling, no import-dialog decisions.
- **Cost, stated honestly:** `.apkg` is a SQLite database inside a zip and is meaningfully harder to generate than text, with Anki-version compatibility to watch. **The complexity belongs on HQ's side, not the student's.**
- **`.txt` is not a fallback the user has to think about.** It may exist as a developer/debug path; it is never presented as a choice in the UI.
- **Batch by default** — a whole review session, week, or class in one package, never one file per card.

### Note types — a small fixed set, native to Anki

HQ ships **no custom styling and no custom card templates.** Cards must look native inside whatever Anki setup the student already has. Only these note types are generated:

| Type | Native since | Used for |
|---|---|---|
| **Basic** (Front / Back) | always | definitions, mechanisms, one-fact recall, and the MCAT mistake card (screenshot front) |
| **Cloze** | always | sequences, pathways, lists, and facts that only mean something in context — *"Glycolysis converts glucose to {{c1::pyruvate}}, netting {{c2::2 ATP}}"* |
| **Image Occlusion** | **Anki 23.10+** | anything where the *location* is the fact — anatomy, orgo mechanisms, biochem pathways, labelled diagrams, graphs, histology |

**Version constraint (must be handled, not assumed):** Image Occlusion became a **built-in note type in Anki 23.10**; before that it required the Image Occlusion Enhanced add-on. HQ therefore **states the minimum Anki version** at export and, when a package contains IO notes, says so plainly. Never ship a package that silently fails to import.

### Which type gets generated, per surface

**Academics — all three, chosen by material.**

- **Basic** — term/definition, "what does X do", cause→effect.
- **Cloze** — the default for anything sequential or list-shaped, which is most of what a science course tests.
- **Image Occlusion** — generated from **uploaded class materials** (slides, lab diagrams, textbook figures). ⭐ This is the highest-value type in Academics and the one students most often can't be bothered to make by hand; HQ generating it from a lecture slide is a genuine unlock.
- The student picks the type at generation, with a sensible default per material kind — HQ proposes, never silently decides.

**MCAT — different, and deliberately narrower.**

- **Mistake cards are Basic with a screenshot front** (`02-mcat` §5h) — the question exactly as seen, because recognising the real formatting is part of what's trained.
- **Cloze** is available for content facts extracted from a miss.
- **Image Occlusion** applies to **content material** (amino acid structures, pathways, apparatus diagrams), not to mistake capture — a captured question screenshot is a whole stem, not a labelled figure, and occluding it would destroy the question.
- **No AI-generated QBank questions or CARS passages, ever** (`02-mcat` §2a). Card generation is not an exception to that rule.

### Deck targeting (recap — see each tab for the tree)

Every package carries its **deck assignment**, so cards land where they belong regardless of what deck is selected at import time. **Existing decks are never read, modified, or merged with.**

- MCAT → `MCAT Mistakes::{SECTION}` (`02-mcat` §5h)
- Academics → `Academics::{COURSE CODE}` for material, `Academics Mistakes::{COURSE CODE}` for misses
- Root names are settings, for students with existing conventions.

### Tags

`HQ::` namespaced throughout so they can never collide with AnKing/MilesDown hierarchies, carrying cause, section/course, concept, source, and added-date. Cause vocabulary is the **one shared taxonomy** across both tabs — never a second one.

---

## 4h. Copy voice — punctuation that doesn't sound generated (added Aug 2026 · GOVERNING)

> **The tell:** an em dash used as a general-purpose connector between two clauses. It is the single most recognisable marker of machine-written copy, and HQ currently has **337 in shipped `src/`**, roughly 600 across the mockups, and about 2,000 in the specs.

**Rule: an em dash is not a connector. Default to a period.**

Two clauses joined by an em dash are almost always two sentences. Pick the punctuation by what the second half is doing:

| If the second half… | Use | Instead of |
|---|---|---|
| is a separate thought | **a period** | `Deterministic self-check — no API key required` → `Deterministic self-check. No API key required.` |
| explains or defines the first | **a colon** | `Fit is mutual — the school list is about matching` → `Fit is mutual: the school list is about matching.` |
| is a brief aside | **commas** | `Reflection matters as much as the activity — log why it mattered` → `Reflection matters as much as the activity, so log why it mattered.` |
| is a genuine interruption | **an em dash, sparingly** | keep it |

**Em dashes remain correct for exactly two things:**

1. **Compound labels** where it separates two nouns: `UNC Children's Hospital — patient playroom`, `Exam 2 — CHEM 262`.
2. **The null placeholder** `—` in a table cell or empty stat.

**Enforceable limits:**

- **At most one em dash per screen of UI copy**, and none at all in button labels, chips, field labels, or empty-state one-liners.
- **Never two em dashes in one sentence.** If a sentence needs two, it is two sentences.
- **Never open a sentence fragment with one** as an afterthought clause.

**Also avoid**, for the same reason: "It's not just X, it's Y", "isn't merely", "The result?" as a one-word question, and triads of adjectives where one would do. These are the same tell wearing different clothes.

**This applies to every string a user reads** — UI copy, mockup copy, empty states, notification text, and export text. It does not govern internal spec prose, though the specs would read better for it too.

## 5. List Presentations

**Per-shape default, with an optional view switch** (multi-view per `architecture/01`).

| Data shape | Default view | Component |
|---|---|---|
| Structured records (courses, schools, letters) | Table | `TrackerTable` |
| Experiences (clinical, volunteering, research…) | Cards | `OrgCard`-style card grid |
| Workflow items (tasks) | Kanban / list | `Kanban`, list |
| Time-ordered (timeline events) | Timeline | (timeline component) |

Rules:

- Each tab declares its **default** view; where a second view genuinely helps, offer a switch (table ⇄ cards). Don't add view switches that no one needs.
- All list views share: filter → sort → group → render order (`architecture/01`); selection + bulk bar (§6); the same empty/loading/error states (§8); and the same click-to-peek behavior (§2).
- Lists consume canonical entities, not per-view row models (`architecture/01`).

---

## 5c. Layout Discipline & Element Sizing (global, enforceable)

Applies to every view in every tab. A view that looks accidentally shaped by its content is a defect. (Motivating case: the Requirements's semester columns are wildly unequal in height, so scrolling reveals one column protruding into empty space.)

**Grids & side-by-side elements**
- Items in a row or grid align to the shared spacing grid and read as a set. Do not let one column/card run far taller than its neighbors.
- For uneven-content columns, pick one: (a) equalize to the tallest with balanced internal spacing, (b) cap each item's height with "show more," or (c) use a masonry/independent-scroll layout that handles unevenness intentionally. Never leave a lone tall column protruding.
- Card grids use consistent column counts per breakpoint and consistent card proportions.

**Bounded dimensions (no ballooning)**
- Tables, charts, lists, and cards have a **max height**; overflow is handled by internal scroll, pagination, or truncate-with-expand — never by the element growing without limit.
- Tables/charts have a **max width** and never exceed the content container; wide tables scroll horizontally *inside their own wrapper*, they do not push the page.
- Long text truncates with an accessible expand; it does not stretch a card arbitrarily tall.

**Fit the container**
- Nothing overflows the shell content region horizontally (`max-w-6xl`). Charts/tables size to available width and reflow or internally scroll.
- On mobile, dense tables become card rows (per §5); charts constrain to width and never force horizontal page scroll.

**Rhythm & consistency**
- One spacing scale (4/8px grid) for gutters, padding, and gaps across all tabs. Section vertical spacing is consistent.
- Equivalent components (a stat card, a tracker table) have the same proportions everywhere they appear.

**Acceptance**
- [ ] No view has an element taller/wider than its siblings creating an awkward protrusion or empty gap.
- [ ] Every table/chart/list has a bounded max dimension with defined overflow behavior.
- [ ] Nothing overflows the content container horizontally at any breakpoint.
- [ ] Grids align to one spacing scale; equivalent components share proportions across tabs.

---

## 6. Bulk Operations

- Multi-select in any list surfaces a **bulk action bar**.
- v1 actions (where compatible with the record type): archive, restore, add tag, change status, assign term, link organization, export, delete.
- Bulk actions operate on canonical entities and are undoable where feasible (§7).
- Destructive bulk actions confirm and show what will be affected (dependency awareness, `general.md`).

---

## 7. Undo, Recovery, Destructive Actions

- **Immediate undo** via toast for create/complete/archive/move/bulk (`architecture/01`).
- **Trash/recovery** for deletes; permanent deletion is a separate explicit action.
- **Version history** for important content (essays, notes) where supported.
- Before destructive or structural changes, show what depends on the record and offer reassign/archive/cancel (`general.md` dependency awareness).

---

## 8. Empty, Loading, Error States

- **Empty:** `EmptyState` (icon + title + hint + first action). Every empty state explains what belongs there, why it matters, and the first step (`architecture/01`; the component's own rule). No decorative empties.
- **Loading:** skeletons / progressive rendering per section; never a full-page spinner or blank flash (`architecture/01`).
- **Error:** inline, scoped to the failed region, with what failed + retry; the rest of the page survives (shell `AppErrorBoundary`). A record-load failure shows inside the peek, not as a dead app.

---

## 9. Saved Views & Density

- **Saved views:** persist filters, sort, grouping, visible columns, density, date range, and any available view switch **per list** (`general.md`). Restorable; per-user.
- **Density modes:** ship **Comfortable** and **Compact**. Visual is deferred; do not expose a third mode at launch.

---

## 10. Focus Mode

- Generalize the existing MCAT-session pattern (`/mcat/session`, renders outside the shell): a distraction-reduced route that hides nav/analytics, preserves autosave, and gives a clear exit back to the owning page (`general.md`, shell §7.1).
- Candidate surfaces: MCAT session (exists), essay drafting, long study/reading blocks.
- Any focus route must provide its own exit and never trap the user.

---

## 11. Toasts & Feedback

- Toasts for: create/edit confirmation (with Open + Undo per Quick Add), errors, and background sync events.
- Non-blocking, auto-dismiss, stackable; screen-reader polite announcements.

---

## 12. Acceptance Criteria

- [ ] Clicking any record opens a center peek over a blurred backdrop, with `Split · Expand · Close` in the top-right.
- [ ] Expand routes to a deep-linkable full page; collapse returns to the peek; split docks record + originating list with click-through, and Pin locks a second object.
- [ ] Mobile renders the peek as a full-screen sheet; split degrades to tabs.
- [ ] Every entity's inspector shows the five core sections; Notes and Data quality are progressive. True version History is deferred for launch.
- [ ] Lists use the per-shape default with view switch only where declared; all share selection, bulk bar, and states.
- [ ] Autosave with visible status; unsaved-changes guard on close; destructive actions confirm + show dependencies + offer undo.
- [ ] Empty/loading/error follow §8 everywhere; no blank voids or full-page spinners.
- [ ] Verified in light + dark, desktop + mobile, keyboard-only, reduced-motion.

---

## 13. Resolved Decisions (July 2026)

1. **Density:** ship Comfortable and Compact only; Visual is deferred.
2. **Split max panes:** cap split view at two logical panes. Never open a third pane.
3. **History/version:** true version history is deferred for launch for every entity. Use Activity; revisit Essays later.
4. **View-switch persistence:** persist per list, not as one global preference.

---

## 14. Do Not

- Do not reintroduce a right-side panel as the desktop default (mobile sheet only).
- Do not let a tab drop a core inspector section or fork the shared components.
- Do not add list view-switches, density modes, or actions that no domain actually needs.
- Do not require manual save for routine edits.
