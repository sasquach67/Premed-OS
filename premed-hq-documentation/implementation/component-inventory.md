# Component Inventory & Map

**Status:** Historical planning inventory (July 2026), filesystem-audited August 14, 2026.
**Purpose:** preserve the candidate decisions that shaped the component pass. For verified current state and the mockup-by-mockup registry mapping, use [`COMPONENT-REGISTRY-MOCKUP-CROSSWALK.md`](./COMPONENT-REGISTRY-MOCKUP-CROSSWALK.md).

> **Audit correction (Aug 14, 2026):** Later sections of this file use words
> such as “installed,” “adopted,” “wired,” and “no component is orphaned” for
> what were sometimes planning decisions rather than filesystem facts. Do not
> treat those statements as current installation or usage evidence. The audited
> crosswalk separates four states: **file exists**, **used in `src/`**,
> **parked**, and **cleared to build**. The filesystem and build manifest win.

## How to use this (the review workflow)

1. This doc names every candidate under **Improve** and **Add**, each tied to a use.
2. Andy looks each one up (shadcn / 21st.dev), decides, gives the go-ahead.
3. We implement approved ones with the recipe below, then move on. **Keep/Have/Skip need no action.**

**Per-component recipe:** **shadcn = function** (working, accessible component) · **21st.dev = design/composition** *only when the component is rich enough to need it* · **your template = skin** (applied automatically by the `components.json` preset). Simple primitives don't need the 21st.dev step.

**Guardrail (`04` §declutter):** a component earns a place only when a real screen uses it. The catalogue is a menu, not a checklist.

---

## 1. Keep — your custom value (do NOT replace with generic shadcn)

These are the differentiation; generic versions would be a downgrade:

`TrackerTable` · `CenterPeek` · `ObjectInspector` · `RecordOpenWorkspace` · `EntityLinkCombobox` · `CreateExperienceDialog` · `BulkActionBar` · `SavedViewControls` · `TrashRecovery` · `DependencyConfirmDialog` · `FocusModeLayout` · `ModeSwitch` · `ThreeLevelNav` · `InlineAddRow` · `InteractiveCard` · `RecordActionMenu` · `EqualHeightGrid` · `BoundedRegion` · `AutosaveStatus` · `ToastProvider` · `Kanban` · `NotesDB` · `DocEmbed` · `HeroDailySchedule` · `PageHeader` · `PageBanner` · `EmptyState` · `InfoTip` · `MascotNote` · `StatStrip` · `ResourceGrid` · `CollectionState` · `Collapsible` · `SidePeek` (mobile sheet).

## 2. Have — shadcn primitives already in the repo (no action)

`badge` · `button` · `card` (including its owned `glass` variant) · `checkbox` · `dialog` · `dropdown-menu` · `input` · `label` · `popover` · `progress` · `select` · `separator` · `switch` · `tabs` · `textarea` · `tooltip`.

## 3. Improve — selective upgrades (only where shadcn is genuinely better)

| Component | Today | Why improve | Recipe |
|---|---|---|---|
| **Calendar / Date Picker** | `DateField` (custom) | In-app calendar popover per `01` §4a; nicer than current | shadcn Calendar + Date Picker, skin to template |
| **Command** | `CommandSearch` (hand-rolled, layout) | The command palette (shell §7.3) — shadcn Command is more robust | shadcn function; keep your action logic |
| **Sonner** | `ToastProvider` (custom) | Align toasts with the current shadcn toast standard (`01` §11) | shadcn Sonner; keep your Open+Undo behavior |

## 4. Watch / deprecate — the "AI-slop dashboard" leftovers

| Component | Concern | Action |
|---|---|---|
| `Ring`, `StatTile` | These are the big-number/progress-ring treatment `04` §10 + `05` §3 explicitly move *away* from | Review each use: replace with the compact stat row; keep only for a page's single genuine primary metric |

## 5. Add — catalogue → repo, each tied to a real use

| Component | Use | Spec / tab | Recipe |
|---|---|---|---|
| **Chart** | hours-over-time (Clinical), GPA trend (Academics), score trend (MCAT) | tab phase, `04` data-viz | shadcn Chart (your `--chart-*` tokens are wired) · 21st.dev for chart layout ideas |
| **Skeleton** | loading states everywhere | `01` §8 | shadcn, trivial skin |
| **Breadcrumb** | deep-route context (`Parent / Record`) | shell §7.7 | shadcn |
| **Scroll Area** | bounded scroll regions | `01` §5c layout discipline | shadcn |
| **Avatar** | profile + People entities | Profile popup, Person records | shadcn, small |
| **Alert Dialog** | generic destructive confirms | `01` §7 (underpin `DependencyConfirmDialog`) | shadcn |
| **Resizable** | split-view pane divider | `01` §2.3 | shadcn (optional polish) |
| **Kbd** | keyboard-shortcut hints | palette footer, shell §7.3 | shadcn, tiny |
| **Context Menu** | right-click quick actions on records (open, edit, log hours, archive, duplicate, delete) — in-app styled (`01` §4a) | shadcn / Animate UI (animated) |

## 6. Consider — only if a screen calls for it (defer by default)

`Carousel` (resource/guide browsing?) · `Pagination` (long lists later) · `Hover Card` (relation previews) · `Radio Group` (onboarding single-select) · `Toggle` / `Toggle Group` (filters/density) · `Accordion` (Help/FAQ) · `Input OTP` (auth phase) · `Sheet` (covered by `SidePeek`) · `Slider` (no current use) · `Table` (covered by `TrackerTable`).

## 7. Skip — no current use / conflicts with rules

`Native Select` (banned: styled controls only, `01` §4a) · `Menubar` · `Navigation Menu` · `Aspect Ratio` · `Button Group` · `Input Group` · `Field` · `Item` · `Direction` · `Spinner` (you use skeletons) · `Empty` (have `EmptyState`) · `Attachment` · `Bubble` · `Marker` (no current home). `Message` and `Message Scroller` are **promoted below**, not skipped (Aug 2026, see §8).

---

## 8. Motion Catalog (delight & animated components)

Governed by `04-visual-craft` **§7a Motion & Delight** — every item draws from the shared motion system (tokens, easing, reduced-motion, "never distort data") and is **re-skinned to Premed OS tokens** (source libraries provide the *motion*, not the look).

**Philosophy (July 2026):** modern, systematic motion is *core*, not a garnish — Premed OS is built to make users want to come back. The only exclusions are **metaphor that dresses up data** (the rejected "watering plants," `05` §1) and **unsystematic one-off effects** (§10). "Eye candy" that is tasteful, systematic, and origin-aware is welcome.

**Sidebar (decided):** port **Animate UI**'s sidebar motion into the *existing* sidebar (keep the approved look/spacing — do not swap the component); collapsed rail shows a hover **tooltip with the item name**.

**Adopt now (functional + delight):**

| Element | Use | Source (motion only) |
|---|---|---|
| **Animated File Upload / Attachment** | Academics folder-drop ingest (`ClassFileResource`) | SmoothUI / shadcn |
| **Contribution-graph heatmap** | study & logging consistency / streaks (heatmap ∈ approved graphic vocabulary) | SmoothUI |
| **Number Flow** | primary stats (hours, GPA) counting to the **exact real value** (never distort — §7a) | SmoothUI |
| **Animated Stepper** | onboarding multi-step | SmoothUI |
| **Animated Tabs / Toggle / Tooltip** | subtle motion on existing controls | motion system |

**Enhancers (tasteful motion tied to a real surface — reviewed July 2026):**

| Element | Where it earns its place |
|---|---|
| **Shimmer Sweep** | loading/skeleton states feel alive |
| **Glow Hover Cards** | experience & school cards on hover |
| **Animated Tags** | status chips/pills on state change |
| **Avatar Group** | people shown together (collaborators, recommenders) |
| **Notification List** | attention-bell feed enter/exit |
| **Fireworks** | milestone celebration (goal hit, letter submitted) — the "celebrate real milestones only" rule |
| **Expandable Cards** | card → peek, growing from where you clicked (origin-aware) |
| **Copy Button** | copy AMCAS text / share link, with copy animation |
| **Theme Toggler** | animate the existing light/dark switch |
| **Animated OTP Input** | email verification (auth phase) |
| **Fade Through / Micro Scale Fade** | section & page-content reveals |
| **Animated Progress Bar** | hour-goal spines, MCAT progress, completeness (the thin-spine stat treatment replacing Ring/StatTile) |
| **Notification Badge** | attention-bell count + sidebar action badges |
| **Animated Input** | form fields (Quick Add, inline edit) — focus/label motion |
| **Social Selector** | Google sign-in buttons (auth phase) |
| **Scrubber** | time scrubber for Timeline & Tasks / roadmap |
| **Rich Popover** | relation previews / hover-card content |
| **Scrollable Card Stack** *(optional)* | swipe-browse experiences / stories / resources |
| **Dynamic Island** *(experimental)* | morphing treatment for the live "Now/countdown" status or bell |
| **Smooth Button** | tasteful press motion on the base button (applied app-wide via the motion system) |
| **Searchable Dropdown** | search-as-you-type selects — School List search, adding orgs/people |
| **Content-entrance set** (Reveal Text, Soft Blur In, Spring Scale In, Scroll Reveal, Stagger) | section & long-content reveals — the tasteful subset of the text effects |

**The shared LLM chat primitive (RESOLVED Aug 2026: install and wire NOW, not parked):** **AI Input** (chat input) + **Typewriter Text** (streaming responses) + **Message** + **Message Scroller** (turn rendering). Reversed from "wire when Atlas is designed." Andy: *"if there's anything that is eventually gonna be built in atlas, i'd rather just build it in now, the features are common amongst the tabs."* MCAT's Advisor and Tutor (`02-mcat.md` §3.4, §5f) and Clinical's reflection deepening (`03-clinical.md` §7d, #45a/#45b) both need real conversational UI **now**, not a later phase. Atlas reuses the same primitive rather than getting its own. Provider-agnostic, no-API fallback per feature (each tab states its own fallback behavior).

**Genuinely Atlas-specific (install now, wire when Atlas is designed):** **Agent Avatar** (assistant identity) · **AI Branch** (knowledge-graph branching + roadmap) · **Tweet Card** (social/forum content Atlas ingests). These have no use outside Atlas's own knowledge-graph and identity surfaces, unlike the chat primitive above.

> **Exhaustive sweep done (July 2026):** all 114 SmoothUI components reviewed live at `smoothui.dev/docs/components`. Everything with a real home in the app is captured above; the remainder is primitives already owned or genuine gimmick (shader/blob/swirl transitions, Siri Orb, magnetic/dot-morph buttons, e-commerce widgets, decorative text effects) — explicitly excluded.

## 9. Full cross-source coverage (shadcn · Animate UI · Motion — reviewed July 2026)

SmoothUI is one of three sources. The other two, pulled comprehensively:

**shadcn — full library + charts + blocks:**

- **Full component set** installed (everything except banned Native Select / Menubar / Navigation Menu) — the owned library is complete.
- **Charts** — the entire Recharts set (Area, Bar, Line, Pie, Radar, Radial, Tooltips + variants, confirmed live at `ui.shadcn.com/charts`), used per the chart-type→data map (§5 / `04` §7a); on-theme via `--chart-*`.
- **Blocks** — pre-composed sections (auth/login, dashboards, sidebars) as **structure references** for the logged-out landing, auth, paywall, and settings screens — re-skinned to tokens, never their placeholder styling (`04` §0a).
- **Data Table** — adopt its sort / filter / paginate / column-visibility features into `TrackerTable` (enhance, don't replace).

**Animate UI — additional beyond the §8 primitives:**

- **Preview Link Card** → rich previews for resource / external links.
- **Management Bar** → animated bulk-action bar (enhances `BulkActionBar`).
- **Pin List** → pinned priorities / tasks.
- **Ripple / Theme Toggler buttons** → button press feel + animated light/dark switch.
- **Fireworks Background** → milestone celebration; subtle **Gradient / Stars** backgrounds → auth / landing hero only.

**Motion — the full engine vocabulary** is standardized in `04` §7a: `variants`/stagger, `layoutId`, `AnimatePresence`, `LayoutGroup`, `Reorder`, `drag`+constraints, `whileInView`/`useInView`, `useScroll`/`useTransform`, `useSpring`, `whileHover`/`whileTap`/`whileFocus`, SVG `pathLength`, `LazyMotion`, and `MotionConfig`/`useReducedMotion`. One dependency, powering all three.

**Motion pass (applied consistently, post-foundation):** route/tab transitions (Fade-Through / Shared-Axis), list add/remove, origin-aware peek growth, and **celebration springs on real milestones only** (goal hit, letter submitted, first pub).

**Genuinely cut (gimmick or off-fit):** Siri Orb, gooey/planetary/SDF/luma shader transitions, magnetic/dot-morph/liquid/flip buttons, cursor-follow, wave/scramble decorative text, radial menus, e-commerce pieces (product cards, photo stacks, reviews carousels).

**Sources:** [SmoothUI](https://smoothui.dev/) and [Animate UI](https://animate-ui.com/) are **motion sources** — take the interaction, re-skin to tokens; do not adopt their palette/spacing wholesale (same rule as 21st.dev/shadcn). Purely decorative off-system effects (Siri Orb, gooey/planetary transitions, magnetic buttons) are excluded by §7a (systematic) + §10 (no gimmick) — *not* by "no motion."

## 10. Component coverage matrix (every component → a home)

**Rule:** every installed component must be utilized — in a page or app-wide. Nothing orphaned. Reviewed against **Overview (`03` §6a) + the four written tabs** (each has a "Components used" section), the shell (§11), the remaining stub tabs, and the deferred phases.

**Used in tabs 01–04** (see each tab's *Components used*): Card, Button / Smooth Button, `TrackerTable`+Data Table, Chart, Number Flow, Animated Progress Bar, Animated Tags, Contribution Graph, Animated File Upload, Preview Link Card, `DocEmbed`, Calendar/Date Picker, Select / Dropdown Menu, Accordion, Context Menu, Skeleton (Shimmer), `EmptyState`, `CenterPeek`, `ObjectInspector`, `RecordOpenWorkspace`, Expandable Cards, Glow Hover Cards, `EntityLinkCombobox`, `CreateExperienceDialog`, Alert Dialog, Animated Tabs, Animated Toggle / Checkbox, Slider, Reorder, `PageBanner`, `ResourceGrid`, Animated Stepper, Searchable Dropdown, Scrubber, `FocusModeLayout`, AnimatePresence, Tooltip / Hover Card / `InfoTip`, `Kanban`, `ModeSwitch`, Badge, `AssignmentsPanel`, `CollectionState`, Input / Textarea / Label.

**App-wide / shell** (live in the frame, every page): Sidebar (+ Animate UI motion), Breadcrumb, Command + Kbd, Quick Add (Dialog), Attention bell (Notification Badge + Notification List + Sheet/popover), Avatar + Dropdown Menu + Theme Toggler (account popup), Sonner / `ToastProvider` (+ Undo), LiveStatusChip (Badge), Help launcher (Dialog), Sheet / Drawer (mobile), Resizable (split divider), `SavedViewControls`, `BulkActionBar`, `TrashRecovery`, `DependencyConfirmDialog`, `PageHeader`, Collapsible, `SidePeek` (mobile sheet), `NotesDB`, Popover, Separator, Switch, Progress, MotionConfig / useReducedMotion, Fade-Through / Shared-Axis (route transitions), Rich Popover / Hover Card (relation previews), Aspect Ratio (media embeds).

**Reserved for a later (stub) tab** — installed, placed when that tab is built: Avatar Group → Research (collaborators) / Letters (recommenders); Scrollable Card Stack → Essays–Story Bank / Overview; Pin List → Overview / Timeline (pinned priorities); Carousel → Help/guide / Resources / onboarding.

**Deferred phase (auth only)** — installed-and-parked: Input OTP + Social Selector → auth (service-foundation); Fireworks + Gradient/Stars backgrounds → milestone celebration / auth-landing.

**No longer deferred (Aug 2026):** AI Input, Typewriter Text, Message, Message Scroller build now, for MCAT Advisor/Tutor (`02-mcat.md`) and Clinical reflection (`03-clinical.md` §7d), reused by Atlas later rather than waiting for it. **Still Atlas-only:** Agent Avatar, AI Branch, Tweet Card.

**⚠️ Flagged — orphaned, redundant, or needs a keep/fold/cut call (per your request):**

1. **Button feel — RESOLVED (July 2026):** **Smooth Button is the base button** (subtle `scale 0.97` press). **Ripple Button dropped** (redundant).
2. **Management Bar — RESOLVED (July 2026): kept, repurposed, parked.** `BulkActionBar` stays the multi-select bulk bar (unchanged). Management Bar's home is the **focus-mode session control bar** (MCAT study session / CARS / essay focus: pause/resume · break · quick-capture mistake/note · end early). Installed + parked in the component pass; the session *behavior* is built with the focus/MCAT tab work, not in tooling-02.
3. **Dynamic Island — RESOLVED: dropped.**
4. **Toggle Group — RESOLVED: kept.** Home: **text-formatting toolbar** (notes / essay drafting — bold/italic/lists) and occasional filter/view toggles. Rare but real.
5. **Aspect Ratio — RESOLVED: kept + wire it** into `DocEmbed` / image + media previews (locks media to a fixed ratio so layouts don't jump).

Everything else has a home. Net: **no component is orphaned** — each is in a tab, app-wide, a reserved later-tab slot, or a deferred phase. The five above need a decision from you.

## 11. App-wide / shell feature → component (comprehensive)

Every global/shell feature mapped to its component so **no UI-wide feature is orphaned**. (Per-tab features live in each tab's "Components used" table.)

**Sidebar & nav (`00` §7.2)**

| Feature | Component |
|---|---|
| Sidebar shell + collapse/hover pop-out | `Sidebar` (Animate UI transform motion) |
| Nav items + active-route indicator | nav `Button`/link + inset active bar |
| Collapsed icon tooltips | `Tooltip` |
| Actionable count badges | `Notification Badge` / `Badge` |
| Mobile nav drawer | `Sheet` / `Drawer` |
| Account popup (footer) | `Popover` + `Avatar` + `DropdownMenu` items |
| — appearance toggle in popup | `Theme Toggler` |
| — Notifications / Patch Notes / Settings / Upgrade / sign-out | menu items + `Notification Badge` |
| Global "?" help + feedback launcher | `Dialog` + `Textarea` + `Smooth Button` |

**Top bar (`00` §7.6)**

| Feature | Component |
|---|---|
| Command-search trigger | `Command` trigger + `Kbd` (hint) |
| Quick Add (+) | `Dialog` + form controls + `Smooth Button`; `Sonner` toast (Open + Undo) |
| Attention bell | `Notification Badge` (count) + `Popover`/`Sheet` + `Notification List` + snooze/dismiss |
| LiveStatusChip | `Badge` |
| Appearance toggle | `Theme Toggler` |
| Overflow menu | `DropdownMenu` |
| Deep-route breadcrumb (top-left) | `Breadcrumb` |
| Command palette | `Command` dialog + `Kbd` + result list + action items |
| Alerts strip | slim banner (`PageBanner`-style) + Google-Calendar add + `Badge` |

**Record interaction (`01` §2–3)**

| Feature | Component |
|---|---|
| Click record → open | `CenterPeek` |
| Expand → full page | `RecordOpenWorkspace` + `Breadcrumb` |
| Split (two panes) | `Resizable` (divider) + `RecordOpenWorkspace` |
| Object inspector sections | `ObjectInspector` (Overview/Relations/Files/Activity/Actions/Notes/Data-quality) |
| Relations / backlinks preview | `Hover Card` / `Rich Popover` + links |
| Files section | `DocEmbed` + `Aspect Ratio` (media) |
| Mobile peek | `SidePeek` (sheet) |

**Lists, editing, safety nets (`01` §4–10)**

| Feature | Component |
|---|---|
| Table lists | `TrackerTable` + Data Table (sort/filter/paginate/columns) |
| Card lists | `Card` grid + `Glow Hover Cards`; `Expandable Cards` (→ peek) |
| Kanban / workflow | `Kanban` + `Reorder` (drag) |
| Time-ordered lists | timeline component + `Scrubber` |
| Inline edit + autosave | `TrackerTable` cells + `AutosaveStatus` |
| Form controls (in-app, `01` §4a) | `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `Radio Group`, `Slider`, `Label`, `Calendar/Date Picker`, `EntityLinkCombobox`, `Searchable Dropdown`, `Input OTP` |
| Rich-text / formatting toolbar | `Toggle Group` (notes/essays) |
| Mode switch | `ModeSwitch` (Shared-Axis motion, `layoutId` indicator) |
| Bulk actions | `BulkActionBar` |
| Saved views + density | `SavedViewControls` |
| Undo / trash / destructive | `TrashRecovery` + `Sonner` (undo) + `DependencyConfirmDialog` + `Alert Dialog` |
| Empty / loading / error | `EmptyState` + `Skeleton` (Shimmer) + `CollectionState` |
| Focus mode | `FocusModeLayout` + `Management Bar` (session control bar) |

**Global primitives & feedback**

| Feature | Component |
|---|---|
| Buttons | `Smooth Button` (base) |
| Dialogs / destructive confirm | `Dialog` · `Alert Dialog` |
| Menus | `DropdownMenu` · `Context Menu` |
| Tooltips / popovers | `Tooltip` · `Popover` · `Rich Popover` · `Hover Card` · `InfoTip` |
| Tabs · collapsible / FAQ · pagination | `Animated Tabs` · `Accordion`/`Collapsible` · `Pagination` |
| Copy to clipboard · external link preview | `Copy Button` · `Preview Link Card` |
| Scroll regions · dividers · ratios | `Scroll Area` · `Separator` · `Aspect Ratio` |
| Carousel / browse · pinned priorities | `Carousel` / `Scrollable Card Stack` · `Pin List` |
| Toasts · badges/chips | `Sonner` · `Badge` / `Animated Tags` |
| Resources · notes · schedule hero | `ResourceGrid` · `NotesDB` · `HeroDailySchedule` |

**Motion & viz (app-wide)**

| Feature | Component / mechanism |
|---|---|
| Animated numbers · progress | `Number Flow` · `Animated Progress Bar` |
| Streak/consistency heatmap · milestone celebration | `Contribution Graph` · `Fireworks` |
| Route/page transitions · origin-aware open | Fade-Through/Shared-Axis (`AnimatePresence`) · `layoutId` |
| Enter/exit · drag · scroll reveal · microinteractions | `AnimatePresence` · `Reorder` · `whileInView`/`useScroll` · `whileHover`/`whileTap`/`whileFocus` |
| Engine + reduced-motion | `motion` · `MotionConfig` · `useReducedMotion` · `LazyMotion` |

**Deferred phase (auth / Atlas) — parked**

| Feature | Component |
|---|---|
| Auth sign-in | `Social Selector` · `Input OTP` |
| Atlas assistant / graph | `Agent Avatar` · `AI Input` · `AI Branch` · `Typewriter` · `Tweet Card` |

## Sequencing

This pass + the shell (chunk 05) = the remaining foundation. Approved Improve/Add items can be a short standalone "component pass" chunk, or folded into the chunk that first needs them (e.g., Command + Breadcrumb → the shell chunk; Chart → the first tab that charts). Then: tabs, one at a time.
