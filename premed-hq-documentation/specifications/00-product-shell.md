# 00 — Product Shell Specification

**Status:** Approved for implementation
**Date:** July 21, 2026
**Repo:** `sasquach67/Premed-OS` (Vite + React 19 + React Router 7 + Tailwind 4 + Radix/shadcn + Zustand-style store)
**Architecture references:** `architecture/00-product-vision.md`, `architecture/01-global-design-system.md`, `architecture/02-global-intelligence-framework.md`, `general.md`

---

## 1. Purpose and Scope

The product shell is the persistent frame around every page of Premed OS: sidebar navigation, top bar, global search, quick add, the attention strip, the page container, and the responsive/mobile chrome. This spec defines exactly how the shell behaves so that every tab specification can assume it and never re-specify it.

The shell **owns**:

- Global navigation (sidebar, mobile drawer, deep links, active-route state)
- The top bar and everything in it (command palette trigger, live status, appearance, account/overflow menu)
- Quick add (global record creation from anywhere)
- The attention strip (due-soon alerts)
- Page container conventions (max width, padding, header slot, banner slot)
- Global keyboard shortcuts
- Shell-level persistence (collapsed state, dismissed alerts, theme)
- Reserved integration points for Atlas surfaces

The shell explicitly does **not** own:

- Any domain data or domain metrics (tabs own their entities per `general.md` → Implementation boundaries)
- Page content layout below the header slot
- Atlas Workspace internals (future `specifications/02-atlas-interface-and-knowledge-map.md`)
- Authentication screens and the logged-out experience (`architecture/06-service-foundation.md`)

Architecture explains *why*; this document explains *how*. Nothing here re-argues product philosophy.

---

## 2. Finalized Information Architecture

This section is the single source of truth for top-level navigation. `src/app/routes.tsx` must match this table exactly.

> **Architecture reconciliation.** `architecture/01-global-design-system.md` → "Global Navigation" prescribes a view-centric nav (Dashboard, Timeline, Search, AI Workspace, Notifications, Calendar, Settings). That section is **superseded** for navigation by the July 2026 handoff decision: Premed OS uses domain-labeled navigation ("language that pre-med students already understand") and Atlas never becomes the center of navigation. The rest of 01 (entity-centered design, canonical ownership, stateless views, command palette scope, state preservation) remains fully in force and this spec conforms to it. 01's view-centric items survive as: Dashboard → Overview; Timeline → Timeline & Tasks; Search → command palette (§7.3); AI Workspace → reserved Atlas surfaces (§7.8); Notifications → Attention bell (§7.5); Settings → Support group. Calendar has no current surface — tracked in §14. Do not "correct" the sidebar toward 01's list.

### 2.1 Sidebar groups and order

| Group | Items (in order) | Notes |
|---|---|---|
| Home | Overview | No group label rendered |
| Foundation | Academics, MCAT | |
| Experiences | Clinical, Volunteering, Shadowing, Research, Extracurriculars | |
| Application | School List, Essays & Story Bank, Letters of Rec, **Timeline** | Letters moved here from Foundation; "Your Story" group dissolved. **Renamed from "Timeline & Tasks" Aug 2026** — tasks moved to Overview |
| Atlas | Atlas | New group near the bottom; the knowledge workspace (see §7.8, `specifications/02-atlas-interface-and-knowledge-map.md`) |

**Settings, Help, and Profile / CV are no longer sidebar items** — they live in the **account popup** (§7.2 footer), which is the single personal/setup hub (Profile & CV, Settings, billing, account, sign-out). The "Support" and "Profile" groups are dissolved. Archive remains reachable via the popup's Settings surface.

Non-nav routes (reachable, not listed): Profile & CV (`/profile`, opened from the account popup), Ultimate Guide (`/?guide=open`), Archive (`/settings?tab=archive`), MCAT Focus Session (`/mcat/session`, renders outside the shell).

**Decisions locked in this revision:**

1. Letters of Rec belongs to the Application group. Letters exist to serve the application; they sit beside School List and Essays.
2. The one-item "Your Story" group is dissolved. Essays & Story Bank is an Application item.
3. Atlas **graduates to a sidebar tab** in its own group near the bottom (decision, July 2026). It is still not the center of navigation — Overview remains home — but Atlas is now a real *destination*. **Current scope = navigation + placeholder only** (§7.8): ship the sidebar entry and a reserved `/atlas/*` route that renders a restrained "Coming soon" page. The Atlas Workspace it will eventually host (knowledge graph, idea triage, exploration) and Overview's Quick Capture → Atlas Import are **deferred to the Atlas chunk** (`specifications/02-atlas-interface-and-knowledge-map.md`) — do not build them from this shell spec.

**Resolved placement (July 2026):** Timeline stays in the Application group.

> **Stale-route warning (Aug 2026).** §3.3 to §3.5 below describe **current code**, which still routes every task affordance to `/timeline` — the Topbar quick-capture "Task" link, the command palette's "Add a task" action, `LiveStatusChip`, and `AlertsStrip`'s "View all →". **All four now point at the wrong tab.** They belong to Overview: the task surfaces at `/overview/tasks` (`03-overview.md` §6.4), the deadline aggregate in the Attention bell (§7.5). Those paragraphs are left as-built descriptions, not corrected in place; **the rewiring is tracked in `implementation/deferred.md`.**

### 2.2 Page ownership

Every object type has exactly one owning page. Other pages may *reference* an object (via links or inspectors) but never re-implement its editing surface.

| Page | Owns (canonical create/edit/archive) | References only |
|---|---|---|
| Overview | Nothing. Composes widgets from other pages' data | Everything |
| Academics | Courses, terms, assignments, class notes, GPA calculations | Tasks, files |
| MCAT | Practice scores, study schedule, error/mistake log, focus sessions, resources | Tasks |
| Clinical | Clinical experiences + hour logs | People (supervisors), organizations |
| Volunteering | Volunteering experiences + hour logs | People, organizations |
| Shadowing | Shadowing experiences + hour logs | People (physicians), organizations |
| Research | Research experiences, output pipeline (posters, papers) | People (PIs), files |
| Extracurriculars | Leadership/club experiences, reflections | People, organizations |
| School List | Schools, list tiers, per-school requirements | Essays (secondaries), stats |
| Essays & Story Bank | Stories, personal statement, secondary essays, linked docs | Experiences (as source material) |
| Letters of Rec | Recommenders, letter requests, status/follow-ups | People, courses, experiences |
| Timeline | **Roadmap nodes, node state, achievements** (hosts the full four-year roadmap). **NOT tasks, NOT deadlines** — revised Aug 2026, see `tabs/11-timeline-tasks.md` | All record types (as node evidence and achievement sources) |
| Profile / CV *(page reached from the account popup §7.2, not a sidebar tab)* | Profile fields, auto-generated CV, resume doc | All experiences (read-only aggregation) |
| Settings | Preferences, backup/sync, theme, archive, export, reset | — |
| Help | Static guidance, community links | — |

Rules derived from this table:

- The Overview page is a pure composition layer. If a widget needs an editing surface, it deep-links to the owning page instead of embedding one.
- Hour logging happens on the owning experience page, and via Quick Add (§7.4), which routes the record to the owning store slice.
- Tasks created anywhere (Quick Add, page-level buttons) live in the **Overview** store (revised Aug 2026) and appear wherever they are referenced.
- **Deadlines have no central owner.** Each belongs to the record it is attached to — assignments to Academics, submission windows to Research, follow-ups to Letters. **The Attention bell (§7.5) is the only cross-cutting deadline surface.** No tab builds a second one.

---

## 3. Current Implementation

Grounded in code as of this date. File references are for Claude Code orientation; do not treat line-level details as contract.

### 3.1 Layout — `src/components/layout/AppShell.tsx`

- Flex row filling `h-svh`; desktop sidebar is an `<aside>` that reserves layout width (`4.75rem` collapsed / `16rem` expanded). **Motion follows §7.2 (canonical):** hover pop-out is a `transform` slide (~220ms), and only pin/unpin (⌘B) changes the reserved gutter width (≤250ms). The old 500ms `width` transition is **retired** — do not animate `width`, and never animate two elements at once. All transitions keep a `motion-reduce` fallback.
- Mobile (`<lg`): sidebar hidden; hamburger opens a left drawer over a `bg-foreground/35` backdrop with blur; close on backdrop click or X.
- Main column: `Topbar` (sticky) → `AlertsStrip` → scrollable `<main>` with `max-w-6xl` centered container, `px-4 py-6 md:px-8 md:py-8`.
- Global shortcut: ⌘B / Ctrl+B, or `[` when not typing, toggles sidebar collapse (persisted in settings).
- Shell mounts `useTheme`, `useBackup` (daily-on-open check + debounced auto-backup), `useCloudSync` (Supabase, no-op until configured).

### 3.2 Sidebar — `src/components/layout/Sidebar.tsx`

- Grouped nav driven by `NAV_GROUPS` from `src/app/routes.tsx`.
- Collapsed mode shows icons only; **hover preview** temporarily expands the sidebar as an overlay (`z-40`, shadow) without changing the reserved gutter; pin/unpin via the collapse toggle.
- Active route: inset 3px left bar + accent background when expanded; primary-colored icon when collapsed.
- Collapsed items get right-side tooltips.
- Overview is styled as a promoted card-like item at the top.
- Footer: avatar initial, name, email (or "Add email in Profile" prompt).
- Focus/blur handlers extend hover-preview to keyboard users.

### 3.3 Top bar — `src/components/layout/Topbar.tsx`

- Left: mobile menu button + `CommandSearch` trigger.
- Right: **LiveStatusChip** (priority: overdue count → due today → due soon → "Backup off" → "Saved"; links to Timeline or Settings), appearance toggle (lightbulb icon), **MoreMenu** overflow dropdown.
- MoreMenu contains: profile header, "Now" block (active page + status + overdue/today/soon counts), **Quick capture** items, then links to Ultimate Guide, Help, Backup/sync, Export, Profile, Settings.
- Quick capture items are **navigation links only** — "Task" goes to `/timeline`, "Clinical hours" goes to `/clinical`, etc. Nothing is created from the menu. "Contact" is disabled with a "soon" badge.

### 3.4 Command palette — `src/components/layout/CommandSearch.tsx`

- Opens via ⌘K / Ctrl+K or `/` when not typing; Radix Dialog.
- Fuzzy subsequence matching over an in-memory index rebuilt per render: nav routes, two section shortcuts, courses, tasks (+ attachments), experiences (+ attachments), schools, story/secondary docs, resume.
- Tabs: All / Dashboard / Files / External links. Arrow keys + Enter; file hits open in a new browser tab.
- A small hard-coded action list exists ("Add a task" → navigates to `/timeline`) — actions navigate, they do not create.

### 3.5 Alerts strip — `src/components/layout/AlertsStrip.tsx`

- Slim warning-tinted band under the top bar on every page; top 4 upcoming alerts from tasks (`upcomingAlerts` selector), each with icon by kind, relative date, per-alert Google Calendar one-click add, "View all →" to Timeline.
- Dismissal stores a composite key of current alert ids+dates; the strip reappears when the alert set changes.

### 3.6 Routing — `src/App.tsx`, `src/app/routes.tsx`

- HashRouter, route-level code splitting. All pages render inside `AppShell` except the MCAT Focus Session (deliberate full-screen focus mode).
- `routes.tsx` is a single registry: id, label, group, icon, tagline, mascot position, nav flag. `NAV_GROUPS` derives the sidebar; `ROUTE_MAP` powers the top bar and palette.

### 3.7 Atlas — `sasquach67/Atlas` (separate app)

Next.js 16 app: ingestion (paste/audio/video → timestamped transcripts), AI claim extraction into 20 pre-med pillars, knowledge canvas (`@xyflow/react`), duplicate resolution, cited guide synthesis. Local-first SQLite, provider-agnostic AI with deterministic mocks. **No integration with the Premed-OS shell exists.**

---

## 4. Current Strengths (preserve these)

1. **Single navigation registry.** `routes.tsx` drives sidebar, top bar, and palette from one source. Every shell change should keep this property.
2. **Traditional, calm layout.** Persistent sidebar + quiet top bar matches the architecture direction ("the shell should remain familiar"; Atlas never becomes the center of navigation).
3. **Polished sidebar mechanics.** Reserved-gutter collapse with overlay hover-preview is genuinely good; keyboard toggle, tooltips, motion-reduce support, focus handling all present.
4. **Status is glanceable and honest.** The LiveStatusChip prioritizes real urgency (overdue → today → soon → system) instead of decorative badges — consistent with "actionable badges only."
5. **Focus mode precedent.** MCAT Focus Session rendering outside the shell establishes the pattern for distraction-reduced modes.
6. **Alerts strip earns its space.** Dismissal-by-content-key (reappears when alerts change) is the right behavior.

---

## 5. Current Weaknesses (this spec exists to fix these)

1. **Quick capture doesn't capture.** Every "quick capture" item is a navigation link. The architecture requires a universal quick-add that *creates records* with context-sensitive defaults.
2. **The palette can't act.** Command search finds records and navigates, but its "actions" also just navigate. No create-from-palette, no "log hours," no "find overdue."
3. **Search index is naive.** Rebuilt in-memory each render from the whole store; fine at current scale, unowned as data grows. No recency ranking, no keyboard-visible shortcut hints, no result previews.
4. **No notifications/review surface.** The architecture calls for a review queue / notifications entry in the header. Nothing exists; the MoreMenu "Now" block is a partial substitute.
5. **Navigation registry drift.** Current groups don't match the finalized IA (§2.1): Letters sits in Foundation, "Your Story" is a one-item group.
6. **No Atlas touchpoints.** No assistant drawer, no reserved header slot, no cross-app link.
7. **Overloaded MoreMenu.** Profile, status, quick capture, and six nav links in one dropdown — it's three components in a trench coat.
8. **Alerts strip is tasks-only.** Letters follow-ups, stale records, and sync problems have no path into the attention surface.
9. **No breadcrumb/context for deep routes.** `academics/classes/:classId` renders with no shell-level context trail.

---

## 6. Target Behavior — Overview

The target shell keeps the exact visual language and layout of the current implementation and makes four structural upgrades:

1. **Nav registry updated** to the finalized IA (§2.1), including the Atlas entry and its `/atlas/*` placeholder route.
2. **Quick Add becomes real creation** — a global dialog that writes records, replacing navigation-only capture (§7.4).
3. **The command palette gains actions** — create, log, find, toggle — while keeping its current look (§7.3).
4. **An Attention entry** (bell) joins the top bar, unifying due-soon alerts, data-health warnings, and future review-queue items (§7.5).

Atlas integration remains **deferred beyond navigation**: ship the sidebar entry and a restrained "Coming soon" page at `/atlas/*`, but no Atlas knowledge graph, Assistant, Import workflow, or other Atlas-specific chrome (§7.8).

---

## 7. Target Behavior — Component Specifications

### 7.1 Shell layout

Unchanged from current implementation (§3.1) except as noted below. Contract:

- Desktop ≥`lg`: reserved-gutter sidebar (`4.75rem` / `16rem`), sticky top bar, attention strip, centered `max-w-6xl` content container.
- The content container is the only scroll region. The sidebar scrolls independently when nav overflows.
- Page container provides two shell-managed slots: **header slot** (rendered by pages via `PageHeader`/`PageBanner`) and **banner slot** (attention strip; shell-owned).
- Focus-mode routes (currently `/mcat/session`; future essay focus mode per `general.md`) render outside `AppShell`. Any focus-mode route must provide its own exit affordance returning to the owning page.

### 7.2 Sidebar

> **Amendment — Aug. 11, 2026 (current and superseding).** Desktop navigation is one compact, merged icon-and-label sidebar; there is no vertical rail divider, no collapsed icon rail, and no width/slide peek. The sidebar is normally hidden. Hovering either a thin left-edge activation zone or the small top-left control reveals the *entire* fixed-width sidebar (about 15.5rem) with a deliberately slow opacity-only `0 → 1` transition (~520ms soft ease-out). There is deliberately no sidebar transform, slide, or width transition. In this state it is a fixed overlay above the content, so the dashboard never shifts horizontally. Click the sidebar’s header control, or press `⌘B` / `Ctrl+B`, to lock it in place; only this pinned state becomes a flex column and pushes the dashboard right. Click or use the shortcut again to return to hover-overlay behavior. Navigation begins with a deliberate top inset beneath the header rather than being vertically centered. Section gaps are fixed and uniform; responsive row heights absorb spare vertical space evenly across the navigation icons, while Atlas retains a protected account-footer gap. Sidebar labels, group headings, and account copy retain Baloo 2 but use its lighter weights (500–600 rather than 700–800); row selection uses quiet color/background transitions. This amendment supersedes the collapsed, pin/unpin, hover-pop-out, tooltip, and Arc-style animation language below. The approved layout reference is `mockups/00-shell/sidebar-merged-remock.html`.

Keep all current mechanics (§3.2). Changes and hard requirements:

**Structure**

- Groups and items exactly per §2.1. Group labels: 10px uppercase tracking-wide, as today. The Home group renders no label.
- Overview keeps its promoted-card styling.

**Badges**

- Badges are allowed only for actionable counts (per `general.md`: "actionable badges only"). Initially: none. When the Attention system (§7.5) ships per-domain routing, a tab may show a count badge only for items requiring user action (e.g., Letters: 2 overdue follow-ups). Never badge static totals (e.g., "12 courses").
- Collapsed mode: badge renders as a 6px dot on the icon, tooltip carries the count.

**States**

- Two docked states (pinned-open 16rem, collapsed icon-rail 4.75rem) + a hover pop-out over the collapsed rail + mobile drawer.
- Persisted: collapsed boolean. Hover pop-out is never persisted.
- **Name tooltip/bubble appears ONLY in the collapsed (icons-only) state**, on hover/focus of an icon. It must **not** appear when the sidebar is expanded or peeked open — labels are already visible there, so the bubble is redundant and wrong in that view.
- **Active-item treatment is one consistent style across themes.** The active nav item uses the **same** design in dark and light — a frosted-glass pill (icon + label + accent, per `04` §0c), theme-adapted, **not two different treatments**. Align the dark and light (paper) active states so they match.

**Animation (Arc-style — fixes current jank)**

The current implementation is janky because it animates `width` on *two* elements at once (the `AppShell` `<aside>` and the inner `<nav>`), which forces a full layout reflow every frame (labels truncating, grid columns recomputing), over a too-long 500ms. Replace with a transform-based model:

- **Hover pop-out is a `transform: translateX` slide, not a width animation.** When collapsed, the icon rail sits in the gutter (4.75rem). On hover/focus, a **full-width (16rem) panel floats *over* the content** — `position: absolute`, `z-50`, shadow, `translateX(-100%) → translateX(0)`, `transition: transform ~220ms cubic-bezier(.16,1,.3,1)`, `will-change: transform`. The reserved gutter does **not** change on hover, so page content never moves or reflows. This is the Arc behavior.
- **Only one element ever animates**, and it animates `transform` (GPU-composited), never `width`. No per-label opacity/translate transitions during the slide — the whole panel moves as one block. The panel body is independently scrollable.
- **Pin/unpin (⌘B)** is the only thing that changes the reserved gutter width (4.75rem ⇄ 16rem). Because it's a deliberate, infrequent action, a short width/transform transition here is acceptable; keep it ≤250ms and `motion-reduce`-safe. Do not also animate the inner nav's width — the gutter alone owns docked width.
- **Smoothness + no-lag-on-rapid-hover (fix, July 2026):** the current pop-out lags when the cursor moves in/out quickly. Causes to eliminate: (a) any width/layout animation on hover — animate **only `transform`/`opacity`** with `will-change`, reserved gutter fixed; (b) no hover-intent delay — add a short **open delay (~80–120ms)** and a short **close delay** so quick passes don't re-trigger/thrash; (c) non-interruptible animation — it must be **interruptible** (reversing mid-animation eases back, never queues/stacks); target **60fps**, one compositor layer.
- **Fade variant (experiment, July 2026):** try a **fade** for the pop-out — an opacity crossfade (optionally a tiny 4–8px translate/scale) instead of a full slide. It's lighter than a slide, avoids reflow, and matches the smooth reference feel. Ship whichever reads smoother; both stay transform/opacity-only and reduced-motion-safe.
- **Reduced motion:** `prefers-reduced-motion` → no slide/fade; the pop-out appears/disappears instantly.
- Keep the visual design (grouped nav, active styling, tooltips) exactly; this is purely a motion/layering fix.
- **Collapsed icon-rail appearance is approved as-is (Andy, July 2026):** icon-only rail, current spacing, active item tinted, brand mark at top, account avatar at bottom. The animation fix must preserve this resting state exactly — do not restyle the collapsed rail. (When the finalized IA in §2.1 lands, the rail shows the same styling with the updated order + the Atlas icon.)

**Keyboard**

- ⌘B / Ctrl+B and `[` toggle collapse (existing).
- Tab order: brand → collapse toggle → nav items in visual order → profile footer.
- Focus on any item in collapsed mode triggers preview expansion (existing); Escape collapses the preview and returns focus.

**Footer profile popup (updated July 2026, modeled on Mistake-to-Mastery)**

The avatar/name/email footer row stays (collapsed: avatar · name · chevron · plan badge e.g. "Free"). **Clicking it opens a ChatGPT-style popup** anchored bottom-left — the single account surface. **Settings is removed as a standalone sidebar item** (the Support group dissolves; Help moves to the global "?" launcher below). Structure, per the reference:

- **Header:** avatar, name, email, and a **sign-out** icon (top-right of the popup). Signed-in affordance when auth ships (`architecture/06`) — do not design a second account entry elsewhere.
- **Account:** **Profile & CV** (opens the profile/CV page — profile fields, auto-generated CV, resume; the CV builder, formerly a sidebar tab) · **Settings** (opens the Settings surface — theme, backup/sync, archive, export, reset) · **Upgrade plan** (accent-colored; opens the billing/paywall page).
- **More:** **Patch Notes** (with app version, e.g. "Prism · v4.1") · **Notifications** (with count badge + chevron).
  - *Reconcile:* the top-bar **Attention bell** (§7.5) owns actionable alerts (deadlines, data-health). The popup's "Notifications" is **product/announcement** notifications only (releases, news) — keep the two distinct; do not duplicate the bell's feed here.

**Global Help & Feedback launcher (new, modeled on the reference "?")**

- A persistent **"?" affordance fixed at the bottom-right** of the app (all pages). Clicking it opens a small **help + feedback modal**: heading "Need help or have feedback?", a textarea (character-limited, e.g. 500, with a live `n/500` counter), a Cancel and **Send**, and an "or email {support}" fallback link.
- This replaces Help as a sidebar tab. It is the one global support entry; do not scatter feedback links elsewhere.
- Styled per `04-visual-craft-standards` (in-app modal, not native); reduced-motion + keyboard/focus per `01`.

**Billing / paywall page** (referenced from Upgrade plan) — spec'd in `architecture/08-platform-business-operations.md`; modeled on the Mistake-to-Mastery "Choose your plan" layout.

### 7.3 Command palette

Keep the current dialog, fuzzy matcher, and tabs. Add an **Actions** result group, ranked above navigation when the query starts with a verb.

**Required actions (v1)**

| Action | Behavior |
|---|---|
| New task | Opens Quick Add prefilled to Task (§7.4) |
| New course | Quick Add → Course |
| Log hours | Quick Add → Hour log; if invoked from an experience page, prefill that experience |
| New experience | Quick Add → Experience (category picker) |
| New school | Quick Add → School |
| New story | Quick Add → Story |
| Find overdue | Navigates to **`/overview/tasks`** filtered to overdue (revised Aug 2026) |
| Find incomplete records | Navigates to the Attention panel (§7.5) filtered to data-health items |
| Toggle appearance | Switches theme |
| Toggle sidebar | Collapse/expand |
| Go to <page> | Existing navigation hits |

**Behavior contract**

- Actions never navigate when they can create in place. Creating from the palette must not lose the user's current page.
- Record hits (courses, tasks, experiences, schools, stories, files) keep current behavior; add: Enter opens the owning page **and** its inspector/detail for that record where the page supports it, instead of just the page root.
- Ranking: exact prefix > substring > subsequence (existing scores), tie-broken by recency of user interaction (`touchRoute`-style touch tracking extended to records). Recency data is shell-owned, capped (e.g., last 200 touches), and persisted.
- Empty query shows: 5 most recent records touched, then actions, then nav.
- Footer hint row shows ⌘K, ↑↓, Enter, Esc, and tab-switch keys. Esc closes; focus returns to the trigger.
- Index building moves behind a memoized selector keyed on store version, not per-render reconstruction. Target: palette opens in <100ms with 5,000 records.

### 7.4 Quick Add (global creation)

Replaces the navigation-only "Quick capture" list. One dialog, launchable from: the top bar **+ button** (new, sits left of the status chip), the command palette actions, and page-level "add" buttons that opt in.

**Record types (v1):** Task, Course, Assignment, Hour log (clinical/volunteering/shadowing), Experience, MCAT mistake, School, Story, Note.

**Contract**

- Two-step max: pick type (skipped when invoked prefilled) → minimal form. Every form has only the fields required to create a *usable* record (per `general.md` completeness states); everything else is deferred to the owning page's editor.
- Context-sensitive defaults: invoked from Academics, "Assignment" preselects the active course; from an experience page, "Hour log" preselects that experience; **from Overview, type defaults to Task** (revised Aug 2026 — Timeline no longer holds tasks).
- On create: toast with **Open** (deep-link to the record on its owning page) and **Undo**. The dialog closes; the user stays where they were.
- Creation writes through the same store actions the owning pages use — no parallel write paths.
- Keyboard: the palette route (⌘K → "new task" → Enter) must work end-to-end without a pointer.
- "Contact/Person" remains deferred until the Person entity ships; keep it out rather than disabled-with-a-badge.

### 7.5 Attention (bell) — alerts, warnings, review items

New top-bar entry between Quick Add and the status chip. Unifies three feeds:

1. **Deadlines** — the current `upcomingAlerts` output (tasks due/overdue).
2. **Data health** — explainable warnings per `general.md` (missing verification contact, invalid date range, stale active record, deadline without owner…). Severity: blocking / important / suggested.
3. **System** — backup off, sync conflict, failed import.

**Behavior**

- Bell shows a count of important+blocking items only; suggested items never badge. (Severity terms follow `general.md`: blocking / important / suggested. These map to `architecture/02`'s notification thresholds as Critical → blocking, Important → important, Helpful/Informational → suggested.)
- Opens a right-anchored popover (desktop) / full-height sheet (mobile) listing items grouped by feed, each with: icon, one-line explanation (**every warning states why it appeared**), relative time, and actions: primary (open the record/fix location), snooze (1d/1w), dismiss-with-reason (suggested items only).
- The AlertsStrip **remains** as the high-urgency surface but is demoted to only blocking/urgent items (overdue and due-today); everything else lives in the bell. Same dismissal-key behavior.
- The LiveStatusChip stays; its priority ladder now reads from the unified attention model instead of computing from tasks inline. When no deadline urgency exists, the chip's system tone uses the sync-state vocabulary from `architecture/03`: Saved, Saving, Offline, Syncing, Conflict, Error (Conflict and Error also emit a system-feed item in the bell).
- This panel is the seed of the review queue (`general.md` → Review queue). Duplicates, pending imports, and unlinked files join these feeds when those systems ship; the panel's grouping and action contract must not need redesign to absorb them.

### 7.6 Top bar (final composition)

Left → right: **mobile menu** (mobile only) · **command search trigger** · *(spacer)* · **Quick Add (+)** · **Attention (bell)** · **LiveStatusChip** · **appearance toggle** · **overflow menu**.

The overflow menu slims down to: profile header (links to Profile), Ultimate Guide, Help, Settings, Export data. **Export data is shell-owned and covers every pillar**, in a format readable without HQ, with reflection threads exported in full rather than summarised. It is not an account-closure flow — nothing is deleted and nothing is gated. (`01-academics.md` §6.9 argued this first as an Academics structural decision; the argument was never Academics-specific. See `implementation/long-horizon-durability.md` §D6.) The "Now" block and quick-capture list are removed — their jobs are taken by the status chip, bell, and Quick Add. Backup/sync status lives in Settings and the system feed of the bell.

Visual rules: keep current sizing (h-8 circular buttons, quiet borders, backdrop blur). Nothing in the top bar animates on route change. Maximum one badge (the bell).

### 7.7 Deep-route context

Routes below a top-level page (e.g., `academics/classes/:classId`) render a shell-standard breadcrumb in the page header slot: `Parent page / Current object`. One level only; deeper hierarchies are a design smell to be escalated, not accommodated.

### 7.8 Atlas touchpoints

Atlas has four surfaces (Workspace, Assistant, Import, Intelligence). Their status in the shell as of July 2026:

1. **Workspace — current shell scope is navigation and placeholder only.** Atlas has its own group near the bottom of the sidebar (§2.1) and owns the `/atlas/*` route namespace. The route currently renders a restrained "Coming soon" placeholder page. The knowledge graph, personal idea graph, idea triage, exploration, and all other Workspace behavior are deferred to the Atlas implementation chunk (`specifications/02-atlas-interface-and-knowledge-map.md`).
2. **Import — deferred.** Overview's future **Quick Capture** widget (`specifications/03-overview.md` §6.9) is the planned Atlas Import surface. Do not build or integrate it from this shell spec.
3. **Assistant — reserved, not built.** A context-aware right-side drawer triggered from the top bar, positioned left of Quick Add. Do not fill this slot with anything else until the Atlas spec defines it.
4. **Intelligence — invisible.** Inline recommendations and smart defaults (e.g., Overview's Smart Next Actions, `03-overview.md` §6.3) surface inside pages without shell chrome. The shell must add no "AI" ornamentation. Users should not feel they are "using Atlas."

**Trust boundary (all surfaces):** external sourced knowledge and the user's personal ideas/records are distinct node/entity types and must remain visibly distinguishable wherever they appear together (`architecture/02` citation/traceability). Graph model: separate global graphs (personal vs. external), fused only into local on-demand neighborhoods around a focused node.

### 7.9 Theme and appearance

- Light/dark toggle stays in the top bar (current lightbulb button). Theme persists per device; respects `prefers-color-scheme` on first run.
- All shell components must render correctly in both themes and honor `prefers-reduced-motion` (existing transitions already do; new components must too).

### 7.10 The return rundown — shell-owned (added Aug 2026 · GOVERNING)

**The app keeps running while nobody is watching it.** Time passes, deadlines
arrive, credentials approach expiry, review items accrue, term rollover fires.
The attention model (§7.5) already collects all of it correctly. What it does on
return is show a bigger number, which is the one thing that does not help — the
student who has been gone is exactly the student least able to reconstruct what
changed from a list of nineteen items.

**So the shell owns one behaviour: on return after an absence, summarise what
changed rather than deepening the pile.** This is a read over the existing
attention feeds, not a second notification system. Nothing new accrues; nothing
is stored that §7.5 does not already hold.

**Promoted from Academics.** `tabs/01-academics.md` §6.10-B specced this first
("amnesty on return", catalog #51) and called it the highest-value feature on
that tab. It was never Academics-specific. That section is now the **Academics
specialization** of this one; this section owns the pattern.

#### The trigger is a session gap, not an activity gap

**"Away" means the student did not open the app.** It does not mean they opened
it and did nothing, and it does not mean a particular pillar went quiet.

- Someone who opens HQ daily never sees a rundown, however little they log.
  They have already seen every state change as it happened; summarising it back
  would be telling them what they watched.
- A pillar going quiet while the student keeps using the app is that pillar's
  own concern, and it already has a mechanism where it matters (Clinical's
  stale-exposure alert, `03-clinical.md` §7). **Do not duplicate those here.**

**Threshold: derived from session cadence, never fixed.** `N` = **3× the median
gap between sessions**, **floored at 7 days**, **capped at 30**. Same shape as
Clinical's stale-exposure threshold (`03-clinical.md` §7) and for the same
reason: a fixed number cannot serve both someone who opens HQ every morning and
someone who opens it Sunday nights to plan the week.

| Their pattern | Median gap | Fires after |
|---|---|---|
| Opens daily | 1 day | **7 days** (floor — below a week, "away" is not a real thing) |
| Opens weekly | 7 days | 21 days |
| Monthly check-in | 30 days | **30 days** (cap — uncapped they would effectively never get one) |

**Silent until 5 sessions exist** — there is no median yet and guessing one nags
a new user. Use a flat 14 days in the interim.

**One clock, shell-wide.** Per-tab thresholds would make a student "back" on one
tab and "away" on another, and the rundown would stop meaning anything.

**Session length is not counted.** A four-second quick-log is a session. Someone
logging daily through the Quick Add overlay is not away, whether or not they
ever load Overview.

**This threshold is deliberately less load-bearing than stale-exposure's**,
because the content gate below already does most of the work: if no tab supplies
a fact, nothing renders regardless of how long they were gone. Firing early
fails safe here, which is not true of stale-exposure, where the threshold *is*
the feature.

**It renders once per return**, on the first Overview load of the session, and
does not follow them around the app.

#### What each tab supplies

The shell renders; the tab decides what is worth saying. A tab supplies **zero
to three facts**, each of which must be:

1. **A real change during the absence** — not a standing condition. "You have no
   verifier on 3 experiences" was true before they left and is not news. "Your
   EMT cert moved into its renewal window" happened while they were gone.
2. **Stated as fact, with no verdict.** The absence is named plainly and
   neutrally; nothing characterises it as a lapse.
3. **Actionable in one step from the rundown**, or not included.

**A tab supplying nothing renders nothing.** A rundown that pads itself to look
substantial is worse than a short one, and no tab is obliged to have news.

#### Rules

- **Never a count of what piled up.** No "47 overdue", no "12 unreviewed". The
  count is the thing that makes people close the app.
- **Never a streak, never a loss framing, never guilt copy.** Streaks resume;
  they do not shame. This is the same rule that rejects streaks on Clinical
  shifts (`03-clinical-board.md` §5).
- **One bulk-clear for anything genuinely stale**, one action, no per-item
  dismissal. Bulk-clear resolves the items; it never deletes the underlying
  records.
- **Time-based facts belong here; work-based facts usually do not.** The most
  useful thing a rundown can say is what moved *because time passed* — a
  deadline is nearer, a credential is closer to expiry, the application date
  advanced while a total did not. That is the class of change a student cannot
  reconstruct by looking at a list.
- **Dismissible, and dismissal is permanent for that return.** It never
  reappears later in the same session.
- **It is not a digest, a weekly email, or a home-screen widget.** It fires on
  return and then it is gone.

#### Acceptance

- [ ] Fires after a **derived session gap** (3× median, floor 7d, cap 30d), once, on the first Overview load. **Silent under 5 sessions**; flat 14 days in the interim. **One clock shell-wide** — verified that no tab computes its own.
- [ ] Reads the §7.5 attention feeds; introduces **no new accrual mechanism**.
- [ ] Renders **nothing** when no tab supplies a fact.
- [ ] No count, no streak, no loss framing anywhere in the return path.
- [ ] Bulk-clear is one action and destroys no records.
- [ ] Verified by simulating a 30-day absence with at least two pillars active.

---

## 8. Interaction Details

### 8.1 Global keyboard map (shell-owned)

| Keys | Action | Notes |
|---|---|---|
| ⌘K / Ctrl+K | Open command palette | Existing |
| `/` | Open command palette | Only when not typing |
| ⌘B / Ctrl+B, `[` | Toggle sidebar | Existing |
| `q` | Open Quick Add | New; only when not typing |
| `Esc` | Close topmost overlay | Palette → Quick Add → bell → drawer, in stack order |
| `g` then `o/a/m/t…` | Go-to page chords | Optional v2; reserve `g` |

Shell shortcuts never fire while focus is in an input, textarea, or contenteditable (existing `typing` guard becomes a shared utility).

### 8.2 Motion standards

- Sidebar hover pop-out follows the transform-based model in §7.2 at approximately 220ms; docked pin/unpin stays ≤250ms. Overlays/popovers are ≤200ms. Route changes have no shell animation.
- Every transition has a `motion-reduce:transition-none` fallback.

### 8.3 Persistence (shell-owned settings)

`sidebarCollapsed`, `dismissedAlertKey`, theme, palette recency touches, snoozed attention items (with expiry). All survive reload; all are per-device until cloud sync owns settings.

---

## 9. Responsive Behavior

| Breakpoint | Sidebar | Top bar | Attention | Content |
|---|---|---|---|---|
| ≥lg (desktop) | Reserved gutter, collapsible, hover preview | Full composition (§7.6) | Popover | max-w-6xl container |
| md (tablet) | Hidden; drawer via menu button | Full composition, tighter gaps | Popover | Full-width container, px-4 |
| <md (mobile) | Drawer | Menu · search · + · bell · overflow (status chip collapses into bell badge; appearance moves into overflow) | Full-height sheet | Full-width; complex creation forms become full-screen sheets |

Quick Add on mobile is a bottom sheet with sticky Create/Cancel actions. The alerts strip wraps to at most two rows on mobile; beyond that it shows "N due soon →".

---

## 10. Accessibility

- All shell controls reachable and operable by keyboard; visible focus rings (existing `focus-visible:ring` pattern) on every interactive element.
- Sidebar nav is a `<nav>` with `aria-label="Primary"`; active item carries `aria-current="page"`.
- Collapsed-sidebar tooltips duplicate labels for pointer users; screen readers get the label from the link itself (never `aria-hidden` the text — animate opacity only, as today).
- Palette: `role="dialog"` with combobox/listbox semantics; active option via `aria-activedescendant`; result counts announced politely.
- Bell: badge count included in the accessible name ("Attention, 3 items"). Popover items are a list; each action is a real button.
- Attention strip: `role="region"` `aria-label="Due soon"`; dismissal button labeled (existing).
- Color is never the only severity signal — pair with icon shape/text (existing chips already do).
- Contrast: all status tints must meet 4.5:1 against their backgrounds in both themes.

---

## 11. Empty, Loading, and Error States

- **New workspace:** attention strip hidden; bell shows a single suggested item ("Set up your workspace") linking to onboarding/first actions; palette empty-state shows actions + nav only.
- **Route-level code splitting:** lazy pages render a shell-standard skeleton (header bar + content blocks) inside the container — never a blank flash or spinner-only screen.
- **Page crash:** `AppErrorBoundary` (existing) keeps the shell alive; the error surface renders inside the content container with a retry and a "Report" action. A crashing page must never take down navigation.
- **Sync/backup failure:** appears in the bell system feed and as the status chip's system tone; never as a modal.

---

## 7.9 Calendar overlay — a top-bar toggle, not a tab (added July 2026)

> **Mockups:** `specifications/mockups/00-shell/shell-calendar-sequence.html` — **read this first**, it shows the five-step flow and settles ownership vs reachability. Then `00-shell/shell-calendar-overlay.html` for the Week and Month views. Decisions: `00-shell/shell-calendar-overlay.md`.

**The gap this closes:** a physical planner's signature artifact is the week grid, and HQ has no equivalent. Meeting times, deadlines, and exams are all *stored*, but never laid out against time. A student who expects a planner looks for that view and doesn't find it.

**But §6.9 stands: HQ does not become a calendar.** So this is a **view over data HQ already holds**, not a scheduler.

### Shape

- **Owned by Overview, reachable from everywhere.** The calendar spans every pillar, so **Overview owns it** and carries a compact **week-strip panel** with `Open full calendar ›`. But the **toggle sits in the global top bar** on every screen — scoping it to Overview was considered and **rejected**, because requiring a navigation turns a glance into a destination.
- **A toggle in the top bar** (lucide calendar icon), beside the palette and bell. **Not a route, not a tab, not a sidebar item.**
- Opens as an **overlay/sheet** so it's reachable from anywhere and **never loses the user's place**.
- Keyboard shortcut, dismissible with `Esc`.
- **View switcher inside the overlay:** **Week** (default) · **Month** · **Agenda** (flat chronological list). Persist the last view.

### What it shows

Everything HQ already knows, plus what it reads:

- **Class meeting times** (from `ClassWorkspace`)
- **Assignment deadlines** and exams
- **MCAT study sessions, CARS blocks, and full-lengths + their review blocks** (`02` §3.6)
- **Imported calendar events** (Google Calendar, read-only)

**HQ-owned items and imported events must be visibly distinct.** A student has to be able to tell at a glance what the app scheduled versus what came from their own calendar. Class accent colours for HQ items; a single muted treatment for imported ones.

### Rules — this is what keeps it from becoming a scheduler

- **Read-mostly. No event creation, no drag-to-reschedule, no in-place editing.** Clicking an item **deep-links to its owner** — an assignment opens in Assignments, an exam opens exam prep mode (`01` §4.1-R), a study session opens the session. **Editing happens where the thing lives.**
- **Never writes to Google Calendar** beyond what §6.9 already permits (HQ's own deadlines).
- **No new entity.** It is a projection over `Course`, `ClassAssignment`, `PlanSession`, `FullLength`, and imported events. **If a builder proposes a `CalendarEvent` table, that's the wrong turn.**
- **Works with no calendar connected** — it just shows HQ's own items and says imported events aren't connected.
- **Not a planning surface.** Term planning stays in the Planner (`01` §4.2), MCAT scheduling in the Plan tab. This answers *"what does my week look like"* and nothing else.
- **Compact by default.** Week view fits a screen without scrolling for a normal load; Month is density-first, not detail-first.

> **Why this doesn't violate `01` §6.9:** that rule forbids HQ **owning** time — becoming the place you schedule your life. This overlay owns nothing. It renders. The distinction is create-vs-display, and it must stay on the display side.

---

## 11b. ONE weekly hour budget — shell-owned (added July 2026 · GOVERNING)

**The problem this exists to prevent:** when MCAT prep overlaps a semester, **Academics and MCAT bid for the same evenings.** Two independently reasonable plans sum to something impossible, the student fails both, and the app caused it.

**So capacity is owned here, at the shell, not by either tab.** Both plan generators are **consumers** of one pool. Neither may allocate hours the other has already taken.

### The entity

**`WeeklyCapacity`** (shell-owned): `hoursByWeekday[7]`, `busyPeriods[]` (finals, shifts, travel, family — `{ label, startDate, endDate, hoursOverride }`), `updatedAt`.

- Captured once at first setup and editable from Settings; **also written by MCAT intake** (`02` §3.3-A2) and Academics term setup, since both ask the same question and must not ask twice.
- **Not a calendar.** It is a weekly shape plus exceptions. Calendar reading stays as specced (`01` §6.9) and informs the shape; it does not replace it.

### Claims

Every generator registers **claims** against the pool rather than scheduling freely:

| Tab | Claims |
|---|---|
| **Academics** | class time · review queue · exam prep mode (`01` §4.1-R) · assignment work |
| **MCAT** | study sessions · daily CARS · **full-lengths and their review blocks** (`02` §3.6) |

### Computation semantics — LOCKED (July 2026, from the `assessCapacity` build)

These three were decided during implementation and are **locked**, because each has a plausible-but-wrong alternative that would ship silently.

**1. An un-captured pool is NOT zero hours.** ⭐

If nobody has been asked, `assessCapacity` returns **`captured: false`** and **refuses to flag oversubscription**.

- **Telling a student their plan doesn't fit, based on a number they never gave, is a lie the app caused** — which is the exact failure class §11b exists to prevent.
- Absent capture, generators proceed without a capacity verdict and **the UI asks for the number rather than inventing one** (`01` §6.4: never silently guess).
- `captured: false` and `hours: 0` are different states and must never collapse into each other.

**2. A busy period SUBSTITUTES; it does not subtract.**

`busyPeriods[].hoursOverride` **replaces** the affected days' totals outright.

> A 22h week — weekdays 14h, weekend 8h — with **Mon–Fri overridden to 1h each** becomes **13h** (5 + 8). **Not 17h** (22 − 5), which is what subtracting the override amount would give.

- **And bending is not debt** (`01` §6.10-B): nothing accrues a backlog because a week was known in advance to be short. A short week is a smaller pool, not a deficit.

**3. Slack is one TYPICAL day, not a fixed number and not a seven-day average.**

`02` §3.3-B1 reserves roughly one catch-up day from the pool. "One day" means **the mean of days that actually have hours** — never the mean across all seven.

> Someone who studies two 8h days a week reserves **8h**, not a notional 2.3h average.

- Reserved **from the pool**, before either generator allocates — never carved out of one tab's share.
- Slack days are **not presented as free time to fill.**

### Rules

- **Check before generating, not after.** If the pool is oversubscribed, say so **before** producing a plan: *"your Fall plan needs 34h/week and you have 22."* **Never emit two plans that cannot both happen.** (And never at all when `captured: false`.)
- **Precedence is explicit, not emergent:** **Academics wins during exam weeks; MCAT wins during dedicated study periods.** Outside those, split proportionally to time-to-deadline. **The student can override, and the override persists.**
- **Busy periods bend both plans**, and bending is not debt — nothing accrues a backlog because a week was known to be short (`01` §6.10-B).
- **Slack is reserved from the pool, not from a tab** (`02` §3.3-B1) — roughly one catch-up day a week, unallocated by either generator.
- **Easy Days** (`02` §5i) is the scheduler-level expression of the same information; the two must agree, and `WeeklyCapacity` is the source of truth.
- **Works with one tab only.** A student not yet studying for the MCAT sees no MCAT claims and nothing changes for them.
- **Never presented as a productivity target.** The pool describes what a student *has*, not what they *should* use. HQ never nudges someone to fill unclaimed hours.

**This is the clearest "only HQ can do this" capability in the product** — a prep company doesn't know your course load, and a gradebook doesn't know your test date.

---

## 11a. Guided walkthrough — mascot-narrated tour (added July 2026)

**The app is dense.** Two modes, three class types, five sub-tabs per class, seventy-plus features. A first-run tour is not a nicety; without one a new user sees a wall and leaves.

**Two tours, same mechanism:**

1. **How to use HQ** — navigation and structure. Where things live, what the mode switch does, what the bell's two streams mean, how to add a class.
2. **How to study** — the method. Retrieval practice over re-reading, spacing, interleaving, why the app nudges what it nudges. **This is the differentiating one** — most pre-meds were never taught how to study, got by on cramming, and hit a wall in organic chemistry.

**Mechanics:**

- **Click-through, highlighting real UI** — spotlight the actual element, mascot speech box beside it, `Next` / `Skip`. Not a video, not a slideshow, not a modal wall of text.
- **The Ram mascot narrates.** This is the one place it may speak at length — consistent with illustration-only usage (`01` design foundation); it is **never** used as a UI icon here or anywhere.
- **Skippable at any point**, and skipping is remembered.
- **Replayable on demand** from Help and from a persistent entry point — people who skip on day one come back in week three.
- **Per-surface mini-tours.** A first visit to a genuinely new surface (recall runner, Planner, exam catalog) may offer its own two-or-three-step tour, **once**, dismissible. These are exempt from the §6.11 attention budget because they are triggered by the user arriving, not pushed.
- **Works on empty data.** The tour runs on a new workspace with nothing in it — it must not require populated screens (pair with demo data, `implementation/demo-data.md`).
- **Never blocks.** A user can dismiss and use the app immediately.
- **Accessible:** keyboard-navigable, focus moves with the spotlight, respects reduced-motion, screen-reader announced.

---

## 12. Telemetry

Shell events instrumented per `implementation/analytics-events.md` naming: palette opened/queried/action-executed, quick-add opened/created (type, source, prefilled?), bell opened/item-actioned/snoozed/dismissed, sidebar toggled, alert strip dismissed, nav item clicked (id, group). No content payloads — ids and types only.

---

## 13. Acceptance Criteria

**Navigation**

- [ ] Sidebar renders exactly the groups/items/order of §2.1; `routes.tsx` remains the single registry consumed by sidebar, top bar, and palette.
- [ ] Letters of Rec appears under Application; no "Your Story" group exists.
- [ ] Active-route styling, collapse, hover preview, tooltips, ⌘B/`[`, and persistence all behave as in §7.2.

**Quick Add**

- [ ] `+` button, `q`, and palette actions all open the same Quick Add dialog.
- [ ] Creating a Task/Course/Hour log/Experience/School/Story writes a real record via existing store actions, shows a toast with Open + Undo, and does not navigate.
- [ ] Context defaults work from at least Academics (course prefill) and experience pages (experience prefill).
- [ ] Fully operable via keyboard end-to-end.

**Palette**

- [ ] All §7.3 v1 actions present; verbs rank above navigation.
- [ ] Empty query shows recents → actions → nav.
- [ ] Opens in <100ms with a 5,000-record store (measured, not vibes).

**Attention**

- [ ] Bell badge counts only blocking+important items; opens popover (desktop) / sheet (mobile) with per-item explanation and primary action.
- [ ] AlertsStrip shows only overdue/due-today; dismissal key behavior preserved.
- [ ] StatusChip reads from the unified attention model.

**Shell integrity**

- [ ] Atlas appears in its own sidebar group and `/atlas/*` renders only the restrained placeholder page; no knowledge graph, Assistant, Import workflow, or other Atlas-specific chrome ships.
- [ ] Focus-mode routes render outside the shell with an explicit exit path.
- [ ] All acceptance items verified in light + dark, desktop + mobile, keyboard-only, and `prefers-reduced-motion`.

---

## 14. Resolved and Deferred Decisions

1. **Timeline placement — RESOLVED (July 2026):** keep it in the Application group. **Scope narrowed Aug 2026:** tasks moved to Overview, deadlines returned to their owners; the tab is the four-year roadmap only (`tabs/11-timeline-tasks.md`).
2. **Atlas sidebar entry** — RESOLVED (July 2026): Atlas is its own group near the bottom of the sidebar (§2.1). Full tab behavior still owed by `specifications/02-atlas-interface-and-knowledge-map.md`.
3. **Go-to keyboard chords (`g` + key)** — v2 candidate; `g` is reserved either way.
4. **Mascot treatment — RESOLVED (July 2026):** the mascot appears as a **small illustration inside a structured surface** — the Overview "Your Plan" card (`03-overview` §6.1) and genuine milestone celebrations — **never as a floating overlay/bubble.** The floating `MascotLayer`/`MascotBubble` approach is removed. One restrained instance; tabs must not add their own. (Clean, structured design beats a floating character — Andy, July 2026.)
5. **Search index ownership at scale** — when record counts or file contents outgrow the in-memory index, revisit (worker-based index or SQLite FTS via the service foundation).
6. **Calendar view — RESOLVED (Aug 2026):** the shell calendar is **Overview's** (§7.9, `03-overview.md` §0), because it spans every pillar. **It is not a view inside Timeline** — Timeline's scope is four years, and a calendar's is a month.
7. **Profile / CV placement — RESOLVED (July 2026):** not a sidebar tab. The account popup (§7.2) is the single personal/setup hub — Profile & CV, Settings, billing, account, sign-out. The "Profile" sidebar group is dissolved; the Profile / CV page is reached from the popup (same pattern as Settings).
8. **Application hub page — OPEN (July 2026):** whether the Application group also gets a dedicated overview *page* that ties School List, Essays, Letters, and Timeline together into one cockpit. Currently "Application" is a nav group only. Needs its own design pass + spec before build.

---

## 15. Do Not Generalize

- Do not add per-tab custom top bars; the top bar composition (§7.6) is fixed.
- Do not add badges for totals, streaks, or gamification to the sidebar.
- Do not let any page render outside the content container except approved focus modes.
- Do not build Atlas knowledge-graph UI, Assistant, Import, or other integration from this spec. The only current Atlas UI is its sidebar entry and restrained `/atlas/*` placeholder page.
- Do not duplicate Quick Add forms inside tabs; tabs invoke the global dialog with prefills.
