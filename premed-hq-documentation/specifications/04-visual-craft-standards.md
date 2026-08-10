# 04 — Visual & UX Craft Standards

**Status:** Canonical — read before building or restyling any screen.
**Purpose:** the unwritten rules senior UI/UX designers apply automatically, written down as hard boundaries. Andy has no design background by choice — this doc means the app looks professionally designed *by default*, without per-screen taste calls. When these rules conflict with "cram in more," these rules win.
**Depends on / extends:** `architecture/01-global-design-system.md`, `specifications/01-shared-interface-patterns.md` (layout discipline §5c).

---

## 0. The prime directives (if you remember nothing else)

1. **Restraint over clutter — not restraint over richness.** "Too cluttered" is a real failure, so keep *layouts* uncluttered. But restraint targets **content clutter and metaphor only** — **never** motion, depth, bold type, or richness. The target is a **hybrid: modern polish + layered depth + bold Baloo, kept clean** — *not* flat minimalism. "Make it flat/plain" is a defect, not the goal (see §7a motion, §1 elevation/weights).
2. **One primary action per view.** Everything else is secondary or tertiary. If two things shout, nothing is heard.
3. **Consistency over cleverness.** The same thing looks and behaves the same everywhere. One pattern per problem.
4. **Whitespace is a feature.** Don't fill every pixel. Breathing room reads as "designed"; density-without-air reads as "amateur."
5. **Realistic content always.** Design and test with real course names, real schools, real numbers — never "Lorem ipsum" or "Item 1." Fake data hides real layout problems.

---

## 0a. Mockups are flow references — the real template is Premed HQ's own

Every mockup / HTML / "inspo" file produced during design (e.g. `specifications/mockups/*.html`) shows **structure, flow, and functionality only**. Its generic styling — system fonts, neutral colors — is a **stand-in, not the target.**

**The actual visual template is Premed HQ's existing design system in the repo** — its fonts, color tokens, radii, spacing, and shadcn/Tailwind components (per `architecture/01-global-design-system.md` and this doc). When a mockup is implemented, it must be rebuilt with **those real tokens and components**, so the result looks like Premed HQ, not like the mockup.

Rules for anyone reading a mockup:
- **Match the app's real design template** (fonts, palette, components) — never copy the mockup's placeholder styling.
- **Never change fonts** or introduce colors/radii/components outside the app's system to match a mockup.
- The mockup is right about *what goes where and how it behaves*; the app's design system is right about *how it looks*.
- Every mockup file states this in its footer; treat it as direction, not pixel law.

## 0b. The standardization contract (one of each — non-negotiable)

Standardization means **one thing: conserve the same functional formats, components, and structures across every screen** — e.g., *every* table uses the same format/component, *every* record opens the same way, *every* page shares the same structural patterns and the same header format. Things drifted into different formats (the Academics ledger vs. the Letters table were different implementations); standardization brings them to one format. It is a **format / structure / component discipline.**

**Standardization is NOT a visual redesign — it never changes the design.** The app's existing **rich, bold, layered** aesthetic (bold Baloo headings, dimensional cards, the themed banner, depth, motion) is *preserved exactly*. Making formats consistent must never flatten, restyle, re-font, or re-weight anything. If a normalization pass makes a screen flatter, plainer, or less bold, it went the wrong way. **Same formats, same existing look.**

- **One font system:** **Baloo 2** (display/numbers) + **Nunito** (body). No other font, ever — **including components pulled from any library; they adopt these font tokens, never their own.** (§1, `index.css`, CLAUDE.md.)
- **One type scale (4 sizes) + two weights.** No in-between sizes; no third weight. (§1.)
- **One spacing scale (4/8px)** — every gutter, padding, gap. (§1, §5.)
- **One radius set (1–2 values).** (§1.)
- **One color system** (brand + accent + neutral ramp + semantic) via the CSS-variable tokens, both themes. (§1, §4.)
- **One table: `TrackerTable`** (+ its Data-Table features). *All* tabular data uses it, configured per view — never a second table component, never hand-rolled. **Canonical reference = the Academics ledger table** — every other table (Letters, etc.) matches its format. (`01` §5; "reuse, never fork.")
- **One record-open model:** center-peek → expand → split, and **one** inspector (`ObjectInspector`), everywhere. (`01` §2–3.)
- **One motion system:** the tokens + mechanisms in §7a. All motion from it; none ad-hoc.
- **One component per job:** the shared library (`implementation/component-inventory.md`). Configure, don't duplicate — two components doing the same job is a defect.
- **One set of states + controls:** the same empty/loading/error and the same in-app-styled controls (`01` §4a, §8) on every surface — no native OS widgets.
- **One page & heading system:** every page uses `PageHeader` (title · optional subtitle · one primary action, top-right); section headings use the §1 type scale — **no per-tab custom heading sizes, weights, or fonts.** **Canonical reference = the Overview heading treatment** (its font/size/weight) — every page's headings match it. (Fixes Overview-vs-Extracurriculars heading drift.)
- **One button:** `Smooth Button` as the base, with the tier system (primary / secondary / ghost, §6) and verb-first labels.
- **One card:** the shared `Card` (consistent padding, radius, proportions); experience / school / class cards are that card *configured*, not separate variants.
- **One icon set:** lucide, outline, 16–20px (§6) — never emoji, never a second set.
- **One number format:** **font stays Baloo 2 at its bold display weight** — the bold, confident look is *intended and wanted* (do **not** lighten or flatten it; reverted July 2026). **Tabular figures** for clean alignment; consistent precision (GPA 2dp, hours, %); animated via `Number Flow`.
- **One voice:** sentence-case, verb-first microcopy (§9).
- **One page architecture:** the section order in `general.md` (identity → status → primary action → attention → workspace → supporting → archive) applied consistently.

This contract is enforceable via the build checklist (§11); every screen is verified against it.

## 0c. Design north star — the one visual language (LOCKED July 2026)

Every screen shares **one** visual language, defined by the approved Overview hero. Every tab's hero/banner and design surfaces **conform *up* to this** (never flatten). This is the reference; §11 enforces it.

**The look:**

- **Themed banner** behind the top of each surface — the Ghibli art (per `visualTheme`) with a subtle dark scrim for legibility. **Every tab gets a banner hero, not just Overview.**
- **Glassmorphic cards (the signature).** Cards over the banner are **translucent frosted glass**: a semi-transparent surface tint (~60–70% of the card token) + `backdrop-filter: blur(~16–20px)` + a hairline light border + a soft shadow. They **float** over the banner — dimensional, **never flat opaque boxes.**
- **Bold Baloo** headings + numbers (bold weight, tabular figures); Nunito body.
- **Layered depth** — cards over banner, panels nested in cards, soft shadows, ~14–18px radii. Rich, not flat.
- **Palette** — warm Ghibli surfaces + Carolina-blue accent + green progress; full **dark and light (paper)** glass variants.
- **Motion (nothing static)** — smooth motion on *every* surface per §7a: every open, hover, transition, list update, and stat change is animated and eased. The app never *feels* flat, just as it never *looks* flat. Reduced-motion-safe.

**Modern hybrids from 21st.dev.** 21st.dev is the source for the *modern* half: pull hero / banner / glass / layout inspiration and **hybridize it with the PMH identity** — re-skin to the warm palette, Baloo, Carolina blue, and the glass treatment. Take the modern *structure/effect*, never its raw palette/font. (The tailark / shader-hero / prebuiltui examples are references for the modern feel, not to copy verbatim.)

**Applies to:** every tab's hero/banner, cards, and design features — the whole app wears this one glassy, rich, modern-hybrid look. Bringing an out-of-place tab to this look is "conforming up," never a flatten.

**Glass where it makes sense — conventional UI judgment, NOT on everything.** Glassmorphism (translucent + blur) belongs on surfaces that **float / overlay** content or the banner, where blurring what's behind is meaningful. It is **wrong** on dense content/data surfaces — nothing meaningful sits behind them, and blur costs legibility and performance. "Glass on everything" is a defect; use judgment.

- **Full frosted glass — floating / overlay surfaces + cards over the banner:** dropdowns, popovers, dialogs, sheets/drawers, hover cards, command palette, tooltips, context menus, toasts, the sidebar pop-out, and hero/banner cards (countdown, planner, schedule). These overlay something → glass is correct: translucent tint + `backdrop-filter: blur(~16–20px)` + hairline border + soft shadow.
- **Solid surfaces (tasteful depth, NOT glass):** `TrackerTable` and all tables, dense lists/rows, forms/inputs, charts, and content panels on a solid page area. Give these a hairline border + soft shadow for depth — **no frosted blur** (there's nothing behind to blur; glass there just muddies the data and costs perf).
- **Interactive states + motion — everywhere, glass or solid:** every clickable element gets a smooth hover / press / focus state, subtle depth, and §7a motion. Solid controls feel alive through motion + depth — they don't need glass to avoid feeling flat.
- **Rule of thumb:** *floats over something → glass; sits on a solid content area → solid-with-depth.* Legibility (AA) and performance beat blur every time; reduced-motion honored.

## 1. Design tokens (fix these once, use everywhere)

Consistency comes from a small fixed system, not vigilance. Every screen draws from:

- **Type scale — 4 sizes max:** one display (page title), one heading (section), one body, one caption/label. Don't invent in-between sizes.
- **Weights:** body/regular (400) + a **bold display weight** for headings and numbers — **Baloo 2's bold is the intended look** (the app *wants* bold, confident headings; do not flatten to a thin/minimal weight). Pick regular + the one bold; don't stack many.
- **Spacing — one 4/8px scale:** 4, 8, 12, 16, 24, 32, 48. All padding, gaps, and margins come from this. No arbitrary 7px/13px values.
- **Color — restrained:** one brand color, one accent, a neutral ramp (backgrounds/text/borders), and semantic success/warning/danger. That's it.
- **Radius — 1–2 values:** pick one for controls, optionally one for cards. **Never five different radii** in a view.
- **Elevation — layered depth is wanted (not flat):** use tasteful elevation, soft shadows, and layering to build hierarchy and richness (cards floating over the themed banner, panels nested in cards). The app should feel **dimensional and premium, not flat**. Keep it *clean* — consistent shadow/radius tokens, not chaos — but do **not** strip surfaces to flat borders. Cap *floating overlay* layers at two (a third → dialog).

Respect the app's existing typography — never swap fonts unless asked.

---

## 2. Visual hierarchy

- **Squint test:** blur your eyes; the primary action should still pop. If everything is equally prominent, the hierarchy has failed.
- Establish hierarchy with **size → weight → color → spacing**, in that order of preference. Reach for bold/color last; often more space is enough.
- **Not everything is bold.** Bold is for the one thing that matters in that block. Over-bolding flattens hierarchy.
- Most important content goes **top / top-left** (natural reading order). Put the answer before the detail.
- **Progressive disclosure:** show the common 80% by default; tuck advanced options, metadata, and rare actions behind expand/overflow.

---

## 3. Typography

- Sentence case for all UI — buttons, headings, labels, menus. **Never Title Case, never ALL CAPS** (except tiny tracked-out eyebrow labels used sparingly).
- Body line length ~45–75 characters for readability; don't let paragraphs run the full width of a wide container.
- Left-align body text. Avoid justified text and centered paragraphs (center only short headings).
- Consistent line-height (~1.5 body, tighter for headings). Numbers in tables use tabular/mono figures so columns align.
- Don't bold mid-sentence for emphasis; use it only for labels/headings.

---

## 4. Color

- **60 / 30 / 10:** ~60% dominant neutral surface, ~30% secondary, ~10% accent. Accent is a spice, not the meal — one or two accented elements per view.
- Semantic colors mean things: green = success, amber = warning, red = danger/destructive. Don't use them decoratively.
- **Never rely on color alone** to convey state — pair with an icon, label, or shape (colorblind + accessibility).
- Text contrast meets **WCAG AA (4.5:1)** on its background, in both light and dark mode. Text on a colored fill uses a dark shade of that same hue, never pure black/gray.
- Every color works in dark mode. If the background were near-black, every element must still read.

---

## 5. Spacing & layout

- Everything on the 4/8px grid; align to it. Inconsistent spacing is the fastest "amateur" tell.
- **Proximity = meaning:** related items sit close, unrelated items get a clear gap. Whitespace groups better than borders do.
- Consistent outer margins and gutters across tabs. Content respects the shell's max width; long-form text is width-limited for readability.
- Follow the layout-discipline rules in `01-shared-interface-patterns` §5c: equal-height side-by-side elements, bounded dimensions, no protruding columns, nothing overflowing the container.

---

## 6. Components

- **Buttons:** clear tiers — primary (filled, one per view), secondary (outline), tertiary/ghost. Verb-first labels ("Add course," not "Submit"/"OK"). Minimum 44px touch target. Consolidate rows of icon-buttons into a single **⋯ overflow menu**; prefer a dropdown over many separate add-buttons. Avoid disabled buttons — keep them active and respond on use, or explain why.
- **Forms:** labels above inputs (not placeholder-as-label); inline validation on blur; mark required clearly; group related fields; sensible defaults; autosave with quiet status. In-app styled controls only — never native OS dropdowns/date pickers (`01` §4a).
- **Tables:** left-align text, right-align numbers, consistent column widths, one divider style (zebra *or* rules, not both), bounded height with internal scroll. Hide low-value columns behind a column toggle rather than cramming.
- **Cards:** consistent proportions; each answers what is this / why does it matter / what can I do next. A card is a summary, not a mini-app.
- **Stats/metrics — compact, not cavernous.** Prominence matches importance. A page's *one* primary metric may get a large treatment; **routine or secondary stats use a slim inline row**, never a grid of big number boxes. When a list or content is the real subject of the page, the stats are a thin header strip above it — the content gets the space. Prefer "124 hrs · 68% of 150 · 5 active" on one line over three stat cards + a ring.
- **Icons:** one consistent icon set, outline style, sized 16–20px inline. **Never emoji as UI icons.** Icons support labels; they rarely replace them.
- Every list/table/collection ships **empty, loading, and error** states — never a blank void or raw spinner.

---

## 7. Interaction & feedback

- Every action produces visible feedback within ~100ms (state change, toast, spinner-on-the-control).
- Interactive elements have all states designed: default, **hover, focus, active, disabled**, selected.
- **Loading:** skeleton screens over spinners where the shape is known; never block the whole page for a partial load.
- **Motion:** a first-class, *systematic* part of the experience — see the **Motion & Delight** standard (§7a) for tokens, principles, and where motion earns its keep. Purposeful and origin-aware; `prefers-reduced-motion` always honored; spring reserved for real celebrations, not routine UI.
- Optimistic updates with undo for reversible actions; confirmation only for destructive/irreversible ones.

---

## 7a. Motion & Delight — motion is core, and it is a system

Premed HQ should feel **alive and modern.** Motion and microinteraction are a first-class part of the experience, not a garnish. A precise product that never moves reads as *static and lifeless*; users return to products that feel responsive and crafted. The bar is the polish of Linear / Arc / Vercel / Raycast — heavily animated **and** unmistakably serious. Restraint in this product applies to **clutter and metaphor** (§0, §10), *never* to motion quality.

Top-tier apps look premium with lots of motion because it's **systematic, not sprinkled.** All motion draws from one shared system:

**Motion tokens (fixed, use everywhere):**
- **Durations:** micro **120ms** (hover, toggle, tooltip), standard **200ms** (most transitions, peeks, expands), entrance **300ms** (route / large surfaces). Nothing over ~350ms on routine UI.
- **Easing:** one standard ease-out `cubic-bezier(.16,1,.3,1)` (Arc-style) for enter/expand; a symmetric ease for reversible toggles; **spring reserved for genuine celebration moments** (milestones), never routine UI.
- **Distance & technique:** small (8–16px), **`transform`/`opacity` only** (GPU-composited) — never animate `width`/`height`/`top`/`left` on routine UI (the old sidebar jank).

**Principles:**
1. **Purposeful & origin-aware.** Motion explains a change: a peek grows from the row it opened from; a panel slides from the edge it lives on; a deleted row collapses in place. Motion answers "what happened / where did this come from."
2. **Systematic.** Same tokens everywhere; two components doing the same *kind* of transition animate identically. Consistency is what separates "crafted" from "chaotic."
3. **Performant.** 60fps; `transform`/`opacity` only; `will-change` sparingly.
4. **Accessible.** Every animation has a `prefers-reduced-motion` path (near-instant fade or none). Motion never gates comprehension — content is fully usable without it.

**The hard line — motion never distorts data.** An animated number counts up to the **exact real value** and lands there; a chart that draws in shows the true figures; nothing is exaggerated or eased for effect. Values come from computed selectors (`data-model` §6); motion is purely presentational.

**Delight moments (where motion earns its keep):** origin-aware record peek (`01` §2); **number-flow** on primary stats counting to the real value; **animated file upload** on Academics ingest; **contribution-graph heatmap** filling in for logging consistency; restrained route/tab transitions (Fade-Through / Shared-Axis); list add/remove and toast enter/exit; and **celebration springs on real milestones only** (goal hit, letter submitted, first pub) — the one place a spring belongs.

**Built on Motion (`motion` / motion.dev — the engine).** The motion system runs on **Motion for React** — one dependency; Animate UI and SmoothUI are pre-built components *on top of* it, so nothing is duplicated. Motion's hybrid engine hits 120fps via the Web Animations API and falls back to JS only for spring/gesture/interruptible. Encode the §7a tokens once in a global **`MotionConfig`** (default transition + `reducedMotion`) plus shared variants; every animation uses `motion.*` primitives. Pattern → mechanism:

- **Origin-aware peek / shared-element** → **`layoutId`** (the list card and the peek share a `layoutId`; the peek grows from the row it opened from).
- **Enter / exit** (list add/remove, toasts, modals, route change) → **`<AnimatePresence>`** + `exit`.
- **Staggered entrances** (lists, card grids, dashboard widgets) → **`variants` + `staggerChildren`** (the premium "everything animates in in sequence" feel).
- **Viewport triggers** (reveal-on-scroll) → **`whileInView` / `useInView`**; **scroll-linked** (progress spines, parallax) → **`useScroll` + `useTransform`**.
- **Coordinated layout** across components (shared tab underline, related panels) → **`LayoutGroup`**; **drag-reorder** (kanban, ordering, saved views) → **`<Reorder>`**.
- **Draggable UI** (split-view divider, sliders, sortable rows) → **`drag` + `dragConstraints` / `useDragControls`**.
- **Microinteractions** → **`whileHover` / `whileTap` / `whileFocus`** (card hover glow, button press, input focus polish).
- **Smooth-follow values** (cursor highlight, eased counters) → **`useSpring` / `useTransform`** over motion values.
- **Chart draw-in, checkmarks, ring fills** → SVG **`pathLength`**.
- **Celebration** → default **spring** physics (milestones only).
- **Bundle size** → **`LazyMotion`** (load animation features on demand).
- **Accessibility** → **`MotionConfig reducedMotion`** + **`useReducedMotion`** globally — never per-component guesswork.

*(Optional: the **Motion AI Kit** — the `/motion` skill + MCP, requires Motion+ — gives the coding agent the latest Motion docs, 400+ examples, and performance fixing. Worth adding to Codex for this pass.)*

Motion is built into every component from this shared system, not bolted on later.

**Nothing is flat in motion, either.** Parallel to "no flat design," there is **no flat, static, or abrupt motion.** Every state change, record open, hover/press/focus, list add/remove, page and tab transition, stat update, and banner/card entrance is **smoothed** (the §7a tokens + mechanisms). The delight components and transitions **actually take place across the whole app — every tab, not just Overview.** A surface that sits static is a defect, the same as a flat one — smooth it.

---

## 8. Accessibility (non-negotiable, not a phase)

- Full keyboard operability; visible focus rings on every interactive element; logical tab order.
- Semantic structure (real headings, lists, buttons, labels), screen-reader names for icon-only controls.
- Contrast AA; target sizes ≥44px; reduced-motion honored; state never conveyed by color alone.

---

## 9. Microcopy

- Sentence case, active voice, verb-first. Concise.
- No "please," no "successfully," no exclamation marks on system copy, no "click here."
- **Errors:** say what happened, then what to do — one sentence, no "Error:" prefix, no raw exception text. ("That name's taken. Try another.")
- **Empty states:** an invitation, not an apology — name the space, one line of why, a verb CTA.
- Speak as the product: "your courses," never "my courses"; confirmations in past tense ("Saved").

---

## 10. Anti-patterns — the "looks like an AI demo" list (do NOT do these)

- Purple-to-blue gradients on everything. (Prefer flat, restrained surfaces.)
- Oversized hero text with generic copy.
- Rows of identical icon + title + blurb cards.
- **Oversized stat cards / giant number boxes for routine stats** — the AI-default dashboard look ("0 hrs · Target 150 · big ring") that eats the top third of the page and gives the same info in far more space. Use a **compact inline stat row** (one slim line) and let the real content lead. A big-number treatment is reserved for a page's *one* genuine primary metric, never for secondary stats above a list.
- Emoji used as icons.
- Five different border radii / inconsistent corners.
- Inconsistent, off-grid spacing.
- Everything bold; three+ accent colors competing.
- **Metaphorical/gimmick decoration** — cutesy visual metaphors that dress up data (the rejected "watering plants" dashboard, `05` §1), or *static* ornaments that carry no information. (Modern **motion/microinteraction is not decoration** — it's craft, §7a. The ban is on meaningless *metaphor and clutter*, never on polish.)
- **Unsystematic motion** — one-off animations with random durations/easings, motion that ignores the shared system (§7a), or effects that distort data. Motion must come from the system.
- Cramming — zero whitespace, everything edge-to-edge.
- Orphaned buttons whose scope/consequence is unclear.
- Placeholder text as the shipped label; "Item 1 / Lorem ipsum" data.

---

## 11. The build checklist (run before any screen is "done")

- [ ] One clear primary action; squint test passes.
- [ ] Tokens only — no off-scale sizes, spacing, radii, or ad-hoc colors.
- [ ] **Passes the standardization contract (§0b)** — one font (Baloo 2/Nunito, incl. any pulled component), one table (`TrackerTable`), one motion system (§7a), one component per job; no library font or second-of-anything introduced.
- [ ] Aligned to the grid; equal-weight side-by-side elements; nothing protruding or overflowing (§5c).
- [ ] Contrast AA in light + dark; state never by color alone.
- [ ] Empty, loading, and error states designed.
- [ ] Keyboard + focus states + reduced-motion.
- [ ] Real data used; no orphaned buttons; no anti-patterns from §10.
- [ ] Looks consistent with the rest of the app (same components, same proportions).

---

## 12. Andy's house style (product personality, applied sparingly)

- **Declutter is the prime directive.** Fewer, better-scoped controls; overflow menus over button rows; dropdowns over many add-buttons. No explainer blurbs, no "coming soon" placeholders, no dead zones.
- **Dense but breathable.** Important things above the fold; compact stat grids, thin progress spines, chips/pills for status — with air around them.
- **Personality & motion are core — not sprinkles.** A modern, alive feel is a goal, not a garnish: rich *systematic* motion (§7a), live touches (countdowns, "Now:" chips, streaks, number-flow), hero surfaces, the mascot as a purposeful illustration. The discipline is that motion is **systematic and origin-aware** (§7a) and **metaphor stays banned** (§10) — not that motion is rare. Premed HQ is built to make users *want to come back*; polish and delight are part of that job.
- **Modern patterns he likes:** command palette (⌘K), segmented controls, ghost "+ add" cards, right-rail quick links, the center-peek record view (`01` §2).
- These are flavor on top of §0–11, never an excuse to break them.
