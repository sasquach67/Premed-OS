# Build Prompt — Component & Motion pass (pre-tab foundation)

*Handoff prompt for Claude Code / Codex. Larger chunk — **sub-commit by area** and **plan first, stop for approval** (flag the new animation dependency in the plan). This completes the component library + establishes the motion system before tabs.*

---

You are working in **Premed OS**. Goal: complete the on-theme component library and stand up the **motion system**, so every tab is built from a ready, animated, on-brand toolkit. The shadcn preset (`components.json`) is already wired — pulled components inherit the theme automatically.

## Read first

1. `implementation/component-inventory.md` — **§3 Improve, §5 Add, §6 Consider, §7 Skip, §8 Motion Catalog, §9 Full cross-source coverage** (the exact set, placements, and the shadcn charts/blocks/data-table + Animate UI extras).
2. `specifications/04-visual-craft-standards.md` — **§7a Motion & Delight** (motion tokens, principles, "never distort data") and **§10** (metaphor/unsystematic-motion bans).
3. `specifications/01-shared-interface-patterns.md` §4a (in-app styled controls). `CLAUDE.md` (**design tokens + fonts are MUST-NOT-CHANGE**; **flag new dependencies first**).
4. Repo: `src/index.css` (tokens), `components.json`, `src/components/ui/*`, `src/components/layout/Sidebar.tsx` + `AppShell.tsx` (sidebar), `src/components/common/CollectionState.tsx` (existing skeleton).

## Recipe (every item)

**shadcn = function · your tokens = skin · motion = the shared system (§7a) · look = the §0c glass language.**

**Glass where it makes sense (§0c) — NOT on everything.** *Floats over something → glass; sits on a solid content area → solid-with-depth.* **Full frosted glass** on floating/overlay surfaces (dropdowns, popovers, dialogs, sheets, hover cards, command palette, tooltips, context menus, toasts, sidebar pop-out) + cards over the banner. **Solid-with-depth (NO blur)** on tables (`TrackerTable`), dense lists/rows, forms/inputs, charts, content panels — glass there hurts legibility + perf. **Interactive states + §7a motion go on every clickable element regardless** (hover/press/focus + depth) — solid controls feel alive through motion, not blur. AA legibility + perf beat blur; reduced-motion honored.

## Source mapping (reviewed the libraries — July 2026)

- **Animate UI** (`animate-ui.com`) — **animated, themeable, shadcn-based** versions of most interactive primitives: Accordion, Alert Dialog, Hover Card, Radio Group, Sheet, Toggle/Toggle Group, Tabs, Tooltip, Progress, **Files** (file upload), and the **Sidebar**. They theme through the **same CSS variables as your preset → they auto-skin to your tokens.** Prefer the Animate UI version for these: function + motion + theme in one. Uses Framer Motion (the animation dep to flag).
- **Plain shadcn** — the structural/static ones not in Animate UI: Breadcrumb, Avatar, Resizable, Kbd, Scroll Area, Skeleton, Pagination, Aspect Ratio, Input OTP, Carousel, Chart, Sonner. Auto-skin via the preset.
- **SmoothUI** (`smoothui.dev`) — **only** the custom delight pieces not covered above: **Number Flow**, **Contribution-graph heatmap**, **Animated Stepper**. These carry their own styling → the **only** items needing a manual re-skin to tokens.
- **Sidebar** — Animate UI's Sidebar is shadcn's sidebar + Framer Motion, themeable. **Recommended: adopt it and skin to the approved look** (this solves the collapse/pop-out animation that's been hard to get right); if the plan finds it rebuilds too much of the approved custom rail, fall back to porting its Framer Motion into the existing sidebar. **Flag which approach in the plan.** Collapsed rail keeps the hover tooltip (built into `SidebarMenuButton`).
- **Skip (decorative/off-brand):** Animate UI Backgrounds (Fireworks/Bubble/Gradient/Stars), Liquid/Ripple buttons, Community radial menus, GitHub Stars Wheel; SmoothUI Siri Orb / gooey / planetary / magnetic effects.

**Net:** because Animate UI *and* shadcn theme through your locked variables, **most of this pass auto-skins** — genuine "re-skin later" work is limited to the few SmoothUI pieces that ship custom styling. Never adopt a source library's palette/spacing wholesale; motion/interaction only.

## Install mechanism (pull from the libraries' own registries)

- **shadcn:** `npx shadcn@latest add <component>` — auto-themes via `components.json`.
- **Animate UI:** `npx shadcn add @animate-ui/<component>` (shadcn registry; add the namespace to `components.json`). Framer Motion.
- **SmoothUI:** `npx smoothui-cli add <slug>` (or its shadcn-CLI option). Components are **Framer Motion-based, sub-kB, and reduced-motion-aware out of the box** (`useReducedMotion`) — matches §7a for free. Some transitions use GSAP; flag it only if a chosen component needs it.
- **One shared animation dependency (Framer Motion / `motion`)** covers Animate UI *and* SmoothUI — install once, **flag once** in the plan.

Pull each component in inventory §8 via its registry command, confirm it lands on-theme, then re-skin only the SmoothUI pieces that carry custom styling.

## What to build (sub-commit by area)

1. **Motion engine + system (do first).** Install **Motion for React** (`npm i motion`, import from `motion/react`) — **the one animation dependency; flag it in the plan before installing.** It is the engine underneath Animate UI *and* SmoothUI, so nothing is duplicated. Build a shared motion module (e.g. `src/lib/motion.ts`) + a top-level **`<MotionConfig>`** encoding `04` §7a: default transition (durations 120/200/300ms, ease `cubic-bezier(.16,1,.3,1)`), spring reserved for celebrations, and **`reducedMotion`** wired globally (plus `useReducedMotion` where needed). Standardize the pattern→mechanism map from `04` §7a so every screen uses the same primitives:
   - `layoutId` = origin-aware peek (card → peek); `<AnimatePresence>` = enter/exit (lists, toasts, route); `<Reorder>` = drag-reorder; `whileInView` / `useScroll`+`useTransform` = scroll reveal + progress spines; `whileHover`/`whileTap` = microinteractions; SVG `pathLength` = chart draw-in; spring = milestone celebration.
   - *(Optional: add the **Motion AI Kit** `/motion` skill + MCP to Codex — latest Motion docs, 400+ examples, perf-fixing. Requires Motion+.)*
2. **shadcn components that have a home (inventory §5/§6 + the §10/§11 coverage matrix).** `npx shadcn add` **every component that traces to a real home** — not literally everything. Add: Breadcrumb (**top-left of the top bar, left of the command search** — Andy's placement), Avatar, Alert Dialog, Resizable, Kbd, Scroll Area, **Context Menu**, Chart, standardized **Skeleton**, plus the §6 completion set. **Skip the banned (Native Select, Menubar, Navigation Menu) AND the redundant (`§0b` binding): no standalone `Table` — `TrackerTable` is the one table — and nothing with no home.** Confirm each on-theme (light + dark).
3. **Library completion (inventory §6):** Accordion, Radio Group, Toggle + Toggle Group, Pagination, Hover Card, Aspect Ratio, Sheet/Drawer, Input OTP, Carousel, Sonner. Install skinned, available for later use. (Skip permanently: Native Select, Menubar, Navigation Menu.)
4. **Atlas-park (inventory §8):** install the parked Atlas set — **Agent Avatar, AI Branch, AI Input, Typewriter, Tweet Card** — **skinned and parked**; do **not** compose them into an assistant UI (Atlas isn't designed yet). Do **not** install the shadcn Bubble/Message/Message-Scroller/Marker chat set now — add those when Atlas is designed.
5. **Delight components (inventory §8), from the motion system, re-skinned:**
   - **Animated File Upload / Attachment** → Academics folder-drop ingest.
   - **Contribution-graph heatmap** → study/logging consistency.
   - **Number Flow** → primary stats counting to the **exact real value** (no distortion, §7a).
   - **Animated Stepper** (onboarding), subtle motion on Tabs/Toggle/Tooltip.
6. **Chart (standardize, don't build tab charts yet):** add the shadcn **Chart** primitive (the `--chart-*` tokens are wired). Record the standard: chart-type→data map (line/area = trends over time; bar = categorical; radar sparingly; radial/pie only when genuinely a part-of-whole) and the **hard rule — charts read only from computed selectors (`data-model` §6), never AI-estimated, always exact values on hover**. Do not build specific tab charts here.
7. **Sidebar:** port **Animate UI**'s collapse/pop-out motion into the *existing* sidebar (transform-based, keep the approved look/spacing — do not swap the component); collapsed rail shows a **hover tooltip with the item name**.
8. **Full-source extras (inventory §9):** the complete shadcn **Charts** set (installed per the chart-type→data map, computed-selectors-only rule); shadcn **Blocks** as **re-skinned structure references** for auth/landing/paywall/settings (references only — don't build those pages here); adopt **Data Table** sort/filter/paginate/column-visibility into `TrackerTable` (enhance, don't replace); and the Animate UI extras — **Preview Link Card** (resource previews), **Management Bar** (bulk bar), **Pin List** (pinned priorities), **Ripple / Theme Toggler** buttons, **Fireworks** (milestone celebration) + subtle **Gradient/Stars** backgrounds for auth/landing only. Install or park per §9; do not build tab-specific charts here.

## Must NOT

- Do **not** change design tokens, fonts, radii, or the visual-theme system (MUST-NOT-CHANGE). Re-skin sourced components to them.
- **Standardization contract (`04` §0b) is binding:** every pulled/generated component renders in the app's fonts (**Baloo 2 display / Nunito body**), spacing scale, radius, and color tokens — **strip any font/spacing/color a source library ships; never introduce a second font or a second table component.** All tabular data uses `TrackerTable`, all record-open uses the center-peek, all motion comes from §7a. Two components doing the same job = a defect to fold, not ship.
- Do **not** adopt a source library's palette/spacing wholesale; motion/interaction only.
- Do **not** add unsystematic one-off motion — all motion comes from the §7a module. Motion **never distorts data**.
- Do **not** build the Atlas assistant UI — park the primitives only.
- Do **not** install the animation dependency (or any dep) without flagging it in the plan first.

## Acceptance criteria

- [ ] Motion module exists (tokens per §7a) and every animation uses it; `prefers-reduced-motion` honored everywhere.
- [ ] Breadcrumb renders top-left (left of search); Avatar, Alert Dialog, Resizable, Kbd, Scroll Area, Skeleton on-theme in light + dark.
- [ ] Library-completion + Atlas-park primitives installed, skinned; Atlas ones not wired into any feature.
- [ ] Animated File Upload (Academics), Contribution-graph heatmap, and Number Flow work; **Number Flow lands on exact real values.**
- [ ] Chart primitive added on-theme; chart-type→data map + "computed-selectors-only" rule recorded; no tab charts built yet.
- [ ] Sidebar collapse/pop-out is smooth (transform-based), keeps the approved look; collapsed hover tooltip shows names.
- [ ] New dependency flagged + approved; `npm run build` passes.
- [ ] Commits by area, e.g. `feat(ui): motion system + component library + delight pass`.

## Process

Plan first — files, the animation-dependency to flag, the sub-commit order, and any ambiguity — **stop for approval**, then implement and report against acceptance.
