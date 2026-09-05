# Premed OS — Beta Audit: Shell, Shared Components, and Functionality Gaps

**Auditor:** Claude Code (cloud session) · **Date:** 2026-09-05
**Build audited:** `claude/login-dcsmmm` @ `cf266e1a`, identical to `main`. Clean tree.
**Companion:** `COVERAGE.md` — environment limits, skill availability, route matrix, and rejected hypotheses. **Read it first.**

## How to read this

**Nothing here is beta-tested.** `node_modules/` is empty and I was not authorized to install dependencies, so the app was never built or rendered in this session. Every finding is static analysis of source. Evidence labels:

- **source-confirmed** — I read the code on both sides of the claim (the producer and its real consumer) and the behavior follows from the source with no missing link. High confidence, still wants one runtime check.
- **source hypothesis** — the code strongly suggests the behavior but a runtime factor (browser focus arbitration, layout, timing) decides it. Treat as a lead.
- **inherited** — from the Codex Academics task. Not reproduced by me. Used only where I found a shared root cause.

No finding quota was applied and no full-coverage claim is made. Severity is user impact in a public beta, not effort.

**Priority read:** S1, S2, S3, S4, S5. Those five are where the beta is actually losing users. S8, S20 and S26 are the cheapest shared fixes with the widest blast radius.

---

# Part A — Confirmed defects

## S1 · CRITICAL · A keyboard user cannot reach "Create account"

- **Confidence:** high · **Evidence:** source-confirmed
- **Route/control:** `/auth` → password panel → intent tablist
- **File:** `src/pages/public/AuthPage.tsx:512-536`

**Observed.** The tablist is hand-rolled with a correct roving tabindex — `tabIndex={passwordIntent === 'sign-in' ? 0 : -1}` on one tab and the inverse on the other — but there is **no `onKeyDown` handler anywhere in the file** (`grep -n "onKeyDown" src/pages/public/AuthPage.tsx` returns nothing). Roving tabindex removes the inactive tab from the Tab sequence; arrow keys are what put it back. They were never wired.

**Expected.** Left/Right arrows move between tabs and update selection, per the pattern the roving tabindex is half-implementing.

**Net effect:** the inactive tab is reachable by **no key at all**. Tab skips it, arrows do nothing. A keyboard-only or switch-access user who lands on "Sign in" cannot get to "Create account" on the password path.

**Repro.** Load `/auth`, choose the password method, click nothing. Press Tab repeatedly through the whole page — "Create account" never receives focus. Press Left/Right/Home/End while "Sign in" has focus — nothing happens.

**Impact.** A new user who cannot use a mouse cannot create an account. This is the app's front door and it is the highest-severity item in this report.

**Reference.** WCAG 2.1 **SC 2.1.1 Keyboard (Level A)** — all functionality operable through a keyboard interface. Normative failure, not a preference. The pattern being imitated is the WAI-ARIA APG Tabs pattern (`https://www.w3.org/WAI/ARIA/apg/patterns/tabs/`), which specifies Left/Right (plus optional Home/End) precisely because roving tabindex removes Tab access. *(w3.org is egress-blocked from this session; cited from knowledge, not fetched.)*

**Correction.** Two options, in preference order:

1. **Reuse, don't fork.** `src/components/ui/tabs.tsx` (Radix Tabs) is already in the repo and handles roving tabindex, arrow keys, Home/End and `aria-controls` wiring correctly. Swap the hand-rolled tablist for it. This is what `AGENT-IMPLEMENTATION-GUIDE.md` §2 "Reuse, don't fork" asks for.
2. If the public layer must stay free of app components for its scoped stylesheet, add an `onKeyDown` on the `role="tablist"` container handling `ArrowLeft`/`ArrowRight` (wrapping), `Home`, `End`, and move focus with `.focus()` on the newly selected tab.

**Overlap.** None. Public entry is mine.

---

## S2 · CRITICAL · Global search says "No matches" for every record you own

- **Confidence:** high · **Evidence:** source-confirmed (library default verified against official docs)
- **Route/control:** every route → topbar search / ⌘K / `/`
- **Files:** `src/components/layout/CommandSearch.tsx:116`, `src/components/ui/command.tsx:51-57`

**Observed.** `CommandSearch` does its own ranking through `rankCommandHits` (`commandSearchCore.ts:28`), then renders each result as `<CommandItem value={hit.id}>`. The ids are opaque: `task-<uuid>`, `class-<uuid>`, `school-<uuid>` — `uid()` returns `crypto.randomUUID()` (`src/lib/id.ts:4`). Meanwhile `CommandDialog` renders `<Command>` with **no `shouldFilter` prop** and, worse, does not forward one — it spreads `...props` onto `Dialog`, not onto `Command` (`command.tsx:46-57`). cmdk's filtering therefore runs, on top of the ranking that already happened, scoring the query against those UUIDs.

**Expected.** With external ranking, cmdk's internal filter is turned off and the parent's ordered list renders as-is.

**Repro.** Open the palette, type the name of any course, task, school or story you have created. cmdk scores `"biol 202"` against `class-3f2a9b1c-…`, gets zero, hides the item, and `CommandEmpty` renders **"No matches for "biol 202"."** — a confident, wrong answer. A handful of items survive by coincidence, because their ids contain real words: typing `task` matches `action-task`, typing `academics` matches `page-academics`. Typing `log hours` does **not** match `action-hours` (no `l` in the id), so even the actions are unreliable.

Opening the palette and not typing looks fine, because the empty-query branch (`CommandSearch.tsx:72-74`) returns recents + actions + pages and cmdk passes everything through when the search string is empty. The failure starts on the first keystroke, which is why click-through testing misses it.

**Why the tests pass.** `commandSearch.test.ts` exercises `rankCommandHits` as a pure function. The ranking is correct. The bug is entirely in the render layer, which has no test.

**Impact.** Global search is the app's answer to "how do I find anything across reserved pillars". It currently cannot find a single user record by name. Two of the three ways users are told to search (⌘K, `/`, the topbar field) lead here.

**Reference.** cmdk README, fetched this session: *"Or disable filtering and sorting entirely: `<Command shouldFilter={false}>`"* and *"You should provide a unique `value` for each item, but it will be automatically inferred from the `.textContent`."* — `https://github.com/pacocoursey/cmdk`. Filtering is on by default. This is also how shadcn/ui documents combobox-with-server-search.

**Correction.** Two edits:

1. `src/components/ui/command.tsx` — let `CommandDialog` forward filtering control to `Command` (add a `shouldFilter?: boolean` to its props and pass it through). Without this, no consumer can opt out.
2. `src/components/layout/CommandSearch.tsx:105` — pass `shouldFilter={false}`.

Then add one render test that types a record name into the dialog and asserts the row appears — the current unit test cannot catch this class of bug.

**Overlap.** None; shell-owned. Independently flagged by `/code-review` at the same line, which raises confidence.

---

## S3 · HIGH · Quick Add creates records into surfaces that do not exist, then offers to open them

- **Confidence:** high · **Evidence:** source-confirmed
- **Route/control:** every route → "Add" button / `q` → Quick Add; also Overview → Quick access
- **Files:** `src/components/layout/QuickAddDialog.tsx:24-34, 71-88`; `src/App.tsx:84-94`; `src/components/overview/OverviewSupport.tsx:50-57`

**Observed.** Quick Add offers nine record types. Six of them route to a `ReservedSpace` "coming soon" card:

| Type | Route (`QuickAddDialog.tsx:71-74`) | State in this build |
|---|---|---|
| Hour log | `/clinical` `/volunteering` `/shadowing` `/research` `/ecs` | Reserved |
| Experience | same | Reserved |
| MCAT mistake | `/mcat` | Reserved |
| School | `/schools` | Reserved |
| Story | `/essays` | Reserved |
| Note | `/` | Overview has no notes surface |
| Task | `/overview/tasks` | Works |
| Course, Assignment | `/academics` | Works (Codex scope) |

On success, `created()` fires a toast reading **"Saved locally. Stay here or open it now."** with an **Open** button that navigates to that route (`QuickAddDialog.tsx:80-88` → `ToastProvider.tsx:51`). Pressing Open on a school lands on *"School List is coming soon."*

Overview compounds it: the Quick access card advertises **"Capture a thought — Saves directly to Story Bank"** (`OverviewSupport.tsx:56`). Story Bank is `/essays`, reserved.

**Expected.** Either the shell does not offer creation for surfaces that cannot display the result, or it says plainly that the record is being parked until that pillar opens.

**Repro.** From Overview press `q` (or click Add) → School → title "Duke" → Create → press **Open** in the toast → land on the reserved card. The school exists in localStorage and there is no screen in the build that will ever show it.

**Impact.** This is the largest structural gap in the beta shell. Users type real data into a black hole and the interface actively invites them to go look at it. It also silently seeds the data-health engine (S7) with records the user cannot reach to fix.

**Reference.** `AGENT-IMPLEMENTATION-GUIDE.md` §2 — "one primary action per view", empty/loading/error states, and labels that describe what will happen. `specifications/04-visual-craft-standards.md` §10's anti-pattern list is the governing craft document.

**Correction.** Cheapest correct fix, in order:

1. Filter `TYPES` (`QuickAddDialog.tsx:24-34`) and the command-palette actions (`CommandSearch.tsx:39-44`) through the same reserved-route list that `ReservedSpace` already owns. Export that list from one module so it cannot drift.
2. For any type that is kept, drop the **Open** action from its toast and change the description to name where the record is parked ("Saved locally. It will appear when School List opens.").
3. Change the Quick access copy to match reality, or remove the card until Story Bank ships.

**Overlap.** Course/Assignment rows touch Codex's Academics surface; the defect is in the shell's Quick Add, so the fix is mine, but tell them before changing assignment creation.

---

## S4 · HIGH · The most destructive action in the app is guarded by a native `confirm()`

- **Confidence:** high · **Evidence:** source-confirmed
- **Route/control:** `/settings` → Danger zone → Reset workspace
- **File:** `src/pages/Settings.tsx:282`

**Observed.** `resetToSeed()` wipes the entire local workspace. Its only guard is `confirm('Reset all data to an empty personal workspace? This cannot be undone.')` — the browser's native dialog, with **OK** and **Cancel** as the button labels.

This is not isolated. The app runs **three parallel confirmation systems**:

| System | Used for | Sites |
|---|---|---|
| `AlertDialog` (Radix, themed, focus-managed, busy state) | Sign out | `AppShell.tsx:155-184`, some Academics |
| `Dialog` | Discard unsaved changes | `CenterPeek.tsx:170-189` |
| **`window.confirm` / `confirm`** | **Full data reset**, delete AI sources, sign out everywhere, sign out (×2), delete a class (×2), and 4 more | `Settings.tsx:85,123,282,425`; `AuthPage.tsx:482`; `PublicNav.tsx:117`; `ClassCenter.tsx:1338,1392`; `AppErrorBoundary.tsx:51`; `syncGenerationSources.ts:203`; `lectureAnalysis.ts:17` |

The severity ordering is inverted: **signing out** — trivially reversible — gets the polished AlertDialog with an icon, an explanation of what happens to the workspace, a disabled state while it runs, and an error slot. **Erasing everything** gets an OS dialog.

**Expected.** One shared confirmation component, with destructive weight proportional to the action.

**Repro.** `/settings` → scroll to Danger zone → Reset workspace. Observe: system font, system chrome, no theme, no mention of exporting first inside the dialog, buttons labeled OK/Cancel.

**Impact.**
- **Theme break.** `CLAUDE.md` requires every surface to work in both themes. A native dialog has no theme. A user in warm-dark gets an OS-white box.
- **Labels do not predict outcome.** "OK" is the button that erases a semester of coursework.
- **It can be suppressed.** After repeated dialogs Chrome offers "Prevent this page from creating additional dialogs"; once checked, `confirm()` returns `false` without showing anything. Reset then fails safe, but *delete a class* also silently no-ops and the user concludes the app is broken.
- No "export first" affordance at the moment of danger, even though Settings has an export button two cards up.

**Reference.** Radix AlertDialog is documented for exactly this — "a modal dialog that interrupts the user with important content and expects a response" (`https://www.radix-ui.com/primitives/docs/components/alert-dialog`), and it moves initial focus to Cancel by default, which native `confirm` cannot do meaningfully. `src/components/common/DependencyConfirmDialog.tsx` is already the in-repo precedent.

**Correction.** Add one `ConfirmDialog` wrapper over `AlertDialog` taking `{ title, body, confirmLabel, destructive, onConfirm }`, and replace all eleven `confirm()` sites. For the workspace reset specifically, put an **Export a backup first** button inside the dialog and make the confirm button say **Erase everything** rather than OK.

**Overlap.** Two sites are in `ClassCenter.tsx` (Codex). Ship the shared component; let them adopt it on their pass.

---

## S5 · HIGH · Three global single-character shortcuts with no way to turn them off

- **Confidence:** high · **Evidence:** source-confirmed
- **Route/control:** every route inside `AppShell`
- **Files:** `src/components/layout/Topbar.tsx:46-55` (`q`), `src/components/layout/CommandSearch.tsx:83` (`/`), `src/components/layout/AppShell.tsx:82` (`[`)

**Observed.** Three `window` keydown listeners fire on bare character keys with no modifier:

| Key | Action | Guard |
|---|---|---|
| `q` | Opens Quick Add | `isTypingTarget` |
| `/` | Opens the command palette | `isTypingTarget` |
| `[` | Toggles the sidebar | `isTypingTarget` + explicitly requires no meta/ctrl/alt |

There is no setting to disable or remap them, and no in-app documentation of any of them. The only shortcut the UI mentions is ⌘K, printed in the search trigger (`CommandSearch.tsx:103`).

**Expected.** Single-character shortcuts are turn-off-able, remappable, or scoped to a focused component.

**Impact.** WCAG 2.1 **SC 2.1.4 Character Key Shortcuts (Level A)** permits exactly three ways to comply: turn off, remap to include a non-printable key, or active only while the relevant component has focus. These are global window listeners, so the third route does not apply, and neither of the other two is implemented. **Normative Level A failure.**

The intent behind that criterion is the real-world harm here: speech-input users' dictation arrives as strings of letters, so a stray "q" opens a modal mid-sentence; users with tremor or dexterity differences hit stray keys constantly. `isTypingTarget` narrows the blast radius but is not one of the three permitted mechanisms — and it only covers focus that is *inside a field*. Focus on a button, a card, a link, or nowhere leaves all three live.

There is a second, non-normative face of the same problem: **global shortcuts are not suppressed while a modal is open.** Open any dialog, put focus on one of its buttons, press `q` — `isTypingTarget` returns false and Quick Add opens stacked on top. `[` likewise reflows the sidebar behind an open modal.

**Reference.** `https://www.w3.org/WAI/WCAG21/Understanding/character-key-shortcuts.html` — the three compliance routes were confirmed by search this session; w3.org itself is egress-blocked here. Note that some third-party summaries mislabel this criterion AA; it is **Level A** in WCAG 2.1.

**Correction.**
1. Add a **Keyboard shortcuts** toggle in Settings → Preferences (`Settings.tsx:233`), defaulted on, read by all three listeners. That single switch satisfies "turn off" for all of them.
2. Independently, suppress the shortcuts while any modal is open — cheapest reliable check is `document.querySelector('[data-slot="dialog-content"], [role="alertdialog"]')` or a counter in `ShellActionsProvider`.
3. While you are there: document `q`, `/` and `[` somewhere. Right now they are both undiscoverable and unavoidable, which is the worst pair.

**Overlap.** None; shell-owned.

---

## S6 · HIGH · Quick Add "Assignment" files the record under an arbitrary class, or none

- **Confidence:** high · **Evidence:** source-confirmed
- **Route/control:** any route → Quick Add → Assignment
- **File:** `src/components/layout/QuickAddDialog.tsx:108-112`

**Observed.** `const courseId = data.academics.classCenter.workspaces[0]?.courseId` — the new assignment is attached to whichever workspace happens to be first, and the form offers **no course picker**. With no workspaces at all, it is written with `courseId: ''`.

**Expected.** The form asks which class, or refuses and routes the user to a place where the question can be answered.

**Impact.** A student with five classes creates "Problem set 3" and it silently lands on the wrong one. With `courseId: ''` the record is worse than wrong — `/code-review` traced the consumer: `AssignmentsPanel` filters on a truthy `courseId`, so the orphan never renders and cannot be edited or deleted, while `attention.ts:63-85` still surfaces it in the bell with an empty class label (`courseLabel.get('') ?? ''`). The user gets a permanent notification for a record that no screen will show them.

**Repro.** Fresh workspace, no classes. Press `q` → Assignment → title → due date → Create. Check the bell: an assignment deadline appears with no class name. Open Academics → Assignments: it is not there.

**Correction.** Add a required course `Select` to the assignment branch of the form, populated from `classCenter.workspaces`. When there are none, do what the panel already does for this case — `requestAssignmentCreation()` at `Academics.tsx:210-222` redirects to class creation. Reuse that path rather than writing an orphan.

**Overlap.** **Shared boundary with Codex.** The write is in the shell (mine); the display filter and the bell row are in their surfaces. Their inherited "long assignment overflow" work is unrelated, but if they are already touching `AssignmentsPanel`'s courseId handling, coordinate so the orphan-record cleanup happens once.

---

## S7 · HIGH · The notification bell and Smart actions send you to "coming soon" pages

- **Confidence:** high · **Evidence:** source-confirmed
- **Route/control:** every route → bell → item action; Overview → Smart next actions
- **Files:** `src/lib/intelligence/dataHealth.ts:250, 288, 319, 334`; consumed at `src/components/layout/attention.ts:105-114` and rendered at `src/components/layout/AttentionBell.tsx:95-97`

**Observed.** Four of the eight data-health warning routes point at reserved pillars:

| Line | Route | Action label | Destination in this build |
|---|---|---|---|
| 250 | `/letters` | (letter warnings) | Reserved |
| 288 | `/ecs` | (org warnings) | Reserved |
| 319 | `/essays` | "Link experience" | Reserved |
| 334 | `/schools` | "Add name" | Reserved |

Each row in the bell renders a primary button carrying that label and route.

**Expected.** The attention model only raises items the user can act on in this build.

**Repro.** Create a school via Quick Add with no location (S3 gets you there). The data-health rule fires. Open the bell: a row appears saying **"Add name"**. Click it: *"School List is coming soon."* The warning cannot be resolved and will sit in the bell permanently, since only *suggested* items can be dismissed (`AttentionBell.tsx:102-106`).

**Impact.** The bell is the app's one urgency channel. Filling it with unresolvable items trains users to ignore it, which is exactly what the "suggested items never badge" comment at `AttentionBell.tsx:34` was written to prevent. It also creates a permanent unclearable count for anything ranked important or blocking.

**Reference.** `architecture/02-global-intelligence-framework` (explainability — every item states why it appeared, which this does correctly) and `AGENT-IMPLEMENTATION-GUIDE.md` §2's requirement that AI/intelligence surfaces propose actions the user can actually take.

**Correction.** Add one predicate — `isRouteAvailable(route)` — sourced from the same reserved-route list S3 needs, and filter in `buildAttention` (`attention.ts:159-165`) rather than in each feed. One line, covers every present and future feed.

**Overlap.** None. Same shared reserved-route module as S3 and S17 — build it once.

---

## S8 · MEDIUM-HIGH · Navigating to a new page keeps your old scroll position

- **Confidence:** high · **Evidence:** source-confirmed
- **Route/control:** every in-app navigation
- **Files:** `src/components/layout/AppShell.tsx:137`; local workaround at `src/pages/Academics.tsx:74-79`

**Observed.** The scroll container is `<main data-app-scroll-container className="... overflow-y-auto">`. Nothing in `AppShell` resets its scroll on route change. `HashRouter` does not do it either — React Router has never restored or reset scroll automatically.

Exactly one page fixes it for itself: `Academics.tsx:76-77` reaches out and calls `document.querySelector('[data-app-scroll-container]')?.scrollTo(...)` in a `useLayoutEffect`. Nobody else does.

**Expected.** A new route starts at the top.

**Repro.** Open `/settings`, scroll to the Danger zone at the bottom, open the account menu, click **Profile & CV**. Profile renders with the viewport parked mid-page — the page title and its primary action are above the fold and invisible.

**Impact.** Hits every navigation in the app except the one page that patched itself. Worst on Settings and Overview, the two longest scrolls. Users land in the middle of an unfamiliar page with no heading in view — "where am I" is broken on every jump.

That Academics already carries a private copy of the fix is the tell: the problem was found once, solved locally, and never lifted into the shell.

**Correction.** Delete the Academics workaround and put the behavior in the shell. In `AppShell`, one effect keyed on `location.pathname`:

```
useLayoutEffect(() => {
  mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
}, [location.pathname])
```

Keep `behavior: 'auto'` (see S24 for why `'smooth'` is wrong here). Academics needs to keep *some* of its logic, because it also resets on query-param tab changes — but it should reset on `pathname` via the shell and keep only the `?tab=` part locally.

**Overlap.** Removing the Academics copy touches Codex's file. Land the shell fix first; their local effect is harmless until they remove it.

---

## S9 · MEDIUM-HIGH · "Open help" leaves the modal on top of the help page, and promises a shortcut that does not exist

- **Confidence:** high · **Evidence:** source-confirmed
- **Route/control:** every route → floating `?` button (bottom-right)
- **File:** `src/components/layout/HelpFeedbackLauncher.tsx:31, 38`

**Observed, part 1.** Inside an open Radix `Dialog`, the Open help button is `<Button variant="outline" asChild><a href="#/help">`. The anchor changes the hash, so the router navigates — but nothing sets `open` to false. The dialog stays mounted with its overlay, its scroll lock, and its focus trap over the freshly loaded Help page.

**Observed, part 2.** The trigger button carries `title="Help and feedback (?)"`, advertising a `?` shortcut. There is **no `?` key handler anywhere in `src/`** — I grepped every keydown listener in the codebase; the complete set is `q`, `/`, `[`, `⌘K`, `⌘B`, `⌘\`, `⌘.`, `⌘N`, and arrow keys.

**Repro.** Click `?` on any page → click **Open help** → the URL becomes `#/help` and the modal is still there, dimming it. Press Escape to escape your own help page. Separately: hover `?`, read "(?)", press `?` — nothing.

**Impact.** The dialog is present on every route in the shell, so this is the app's most-reachable broken control. Being trapped in a modal over the page you asked for is disorienting in a way that reads as "the app is broken" rather than "that button is buggy". The phantom shortcut is a small lie in a tooltip, but it is the kind users remember.

**Reference.** Radix Dialog is a controlled component; navigation does not unmount it because `AppShell` renders `HelpFeedbackLauncher` outside the `<Outlet />` (`AppShell.tsx:154`). Radix's own docs on controlled state: `https://www.radix-ui.com/primitives/docs/components/dialog`.

**Correction.** Replace the anchor with a router navigation that closes first — `onClick={() => { setOpen(false); navigate('/help') }}` — or add `onClick={() => setOpen(false)}` to the existing anchor. Then either wire a `?` shortcut (subject to S5's opt-out) or drop it from the `title`.

**Overlap.** None.

---

## S10 · MEDIUM · Toasts destroy their own Undo button after five seconds, including under the user's cursor

- **Confidence:** high · **Evidence:** source-confirmed
- **Route/control:** every toast — Quick Add creation, goal edits, and every other `useToast` consumer
- **File:** `src/components/common/ToastProvider.tsx:27-32, 39, 49-54`

**Observed.** `window.setTimeout(() => dismiss(id), input.duration ?? 5000)` runs unconditionally from the moment the toast is created. There is **no pause on hover and no pause on focus**. The toast body contains real controls — **Open** and **Undo** (`:51-52`).

Three consequences:

1. **Undo is on a five-second fuse.** For Quick Add, Undo is the only reversal available, because the record's own page is reserved (S3). Miss the window and the record is unreachable.
2. **Focus is destroyed mid-interaction.** A keyboard user tabbing toward Undo can have the button unmount while it holds focus. Focus falls to `<body>` and their position in the tab order is gone — they restart from the top of the document.
3. **Screen reader users effectively cannot use it.** The container is `aria-live="polite"`, so the content is announced but focus never moves there. By the time an announcement completes and the user navigates to the region, the region is gone.

**Expected.** A toast carrying an action pauses its timer on hover and on focus, or does not auto-dismiss at all.

**Repro.** Quick Add → Task → Create. Hover the toast and hold still for six seconds — it vanishes under the cursor. Repeat with the keyboard: after Create, press Tab; the toast disappears while you are traversing to it.

**Impact.** WCAG 2.1 **SC 2.2.1 Timing Adjustable (Level A)** — a time limit on the user's ability to act, with no mechanism to turn it off, extend it, or adjust it. The "20 second" and "real-time exception" carve-outs do not apply to an undo affordance. Pause-on-hover/focus is the standard remedy and is why `sonner` ships it by default.

**Reference.** `https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable.html`. Also relevant: putting interactive controls inside a live region is contrary to ARIA authoring practice, since live regions announce without moving focus.

Note the irony: **`sonner` is already a dependency of this project and has zero consumers** (see S28). It pauses on hover and focus, exposes duration, and manages focus for action buttons.

**Correction.** Smallest fix that clears the Level A failure: store each toast's `timeoutId`, clear it on `onMouseEnter`/`onFocusCapture`, restart on `onMouseLeave`/`onBlurCapture`, and give any toast carrying `onUndo` a longer default (10s or none). Larger and better: adopt the `sonner` `Toaster` that is already installed and delete `ToastProvider`.

Also fix the off-by-one at `:29` — `[...current.slice(-3), entry]` keeps **four** toasts, not three.

**Overlap.** None; shared component, benefits every page.

---

## S11 · MEDIUM · The command palette's "Toggle sidebar" does nothing

- **Confidence:** high · **Evidence:** source-confirmed
- **Route/control:** ⌘K → Actions → "Toggle sidebar"
- **File:** `src/components/layout/CommandSearch.tsx:48`

**Observed.** The action writes `draft.settings.sidebarCollapsed = !draft.settings.sidebarCollapsed`. The shell does not read that field. `AppShell` keeps sidebar state in React state seeded from a localStorage key (`AppShell.tsx:32-40, 50`):

```
const DESKTOP_SIDEBAR_LOCK_KEY = 'premed_os_desktop_sidebar_locked'
```

A repo-wide grep for `sidebarCollapsed` returns four hits: this write, two seed defaults (`seed.ts:747`, `personalInitialData.ts:141`), and the type declaration (`types.ts:2025`). **Nothing reads it.**

**Expected.** The palette action toggles the sidebar, like the ⌘B / `[` shortcuts and the chevron in the sidebar header do.

**Repro.** ⌘K → "Toggle sidebar" → Enter. The palette closes. The sidebar does not move. Nothing indicates failure.

**Impact.** A visible, discoverable command that silently no-ops. Worse than absent, because a user who tries it concludes commands in general are unreliable. It also leaves a persisted store field drifting out of sync with the real state forever.

**Correction.** Point the action at the real toggle. `ShellActionsProvider` already carries shell callbacks — add `toggleSidebar` to it alongside `openQuickAdd` and call that. Then either delete `settings.sidebarCollapsed` from the schema (with the versioned migration `CLAUDE.md` requires) or make it the single source of truth and drop the localStorage key. Two sources for one boolean is how this drifted.

**Overlap.** None.

---

## S12 · MEDIUM · The breadcrumb misstates where you are, and shows raw UUIDs

- **Confidence:** high · **Evidence:** source-confirmed
- **Route/control:** topbar breadcrumb, ≥1280px viewports
- **File:** `src/components/layout/Topbar.tsx:33-43`

**Observed.** `activeRoute` is looked up by the first path segment with a fallback: `ROUTE_MAP[first] ?? ROUTE_MAP.home`. Four reachable routes have no entry in `ROUTE_MAP` (`src/app/routes.tsx:26-49`), so all four silently resolve to **Overview**:

| Route | Breadcrumb shows | Should show |
|---|---|---|
| `/onboarding` | "Overview" | Setup |
| `/upgrade` | "Overview" | Upgrade |
| `/founder` | "Overview" | Founder control |
| `/overview/goals/:goalId` | "Overview / `9f3c1a2e-…`" | "Overview / <goal title>" |

The last one is the sharper bug: `deepLabel` (`:37-43`) special-cases `ecs/org/:id` and `academics/classes/:id` to resolve a real name, then falls through to `parts.at(-1)?.replace(/-/g,' ')`. A goal id is a `crypto.randomUUID()`, so the breadcrumb renders the raw UUID with `capitalize` applied to it.

**Expected.** The breadcrumb names the current page, or is absent.

**Repro.** Overview → open a quarterly goal → the URL becomes `/overview/goals/<uuid>`. At ≥1280px width, read the topbar. Separately, open the account menu → **Upgrade plan** and read the breadcrumb: "Overview".

**Impact.** The breadcrumb is the only persistent "you are here" indicator in the topbar, and it is `hidden ... xl:block` — invisible below 1280px, which is most laptops. Where it *is* visible it is wrong on four routes. Combined with a collapsed icon-only sidebar (the default, since `readDesktopSidebarLock()` starts false), location awareness is weak.

**Correction.** Add `onboarding`, `upgrade`, `founder` and an `overview` parent to `ROUTES` with `nav: false` — the registry already supports exactly this for `overview/tasks`, `review`, `archive`, `profile`, `help` and `settings`. For the goal id, extend the `deepLabel` special-cases to resolve `overview/goals/:id` against `data.quarterlyGoals`, mirroring what the course and org branches already do. If an id cannot be resolved, render nothing rather than the raw id — never show a UUID to a user.

**Overlap.** None.

---

## S13 · MEDIUM · Dismissals are permanent, unreviewable, and one click can silence a rule forever

- **Confidence:** high · **Evidence:** source-confirmed
- **Route/control:** Overview → Smart next actions → "Dismiss all"; bell → "Dismiss"; `/review` → dismiss
- **Files:** `src/components/common/SmartActionPanel.tsx:33-35`; `src/store/store.ts:885-899`; `src/components/layout/AttentionBell.tsx:43-51`; `src/pages/ReviewItemPage.tsx:59`

**Observed.** Three permanent, unconfirmed, unrecoverable dismissal paths:

1. **`dismiss()` in the bell** writes `attentionSnoozedUntil[id] = Number.MAX_SAFE_INTEGER` (`AttentionBell.tsx:50`) — a snooze until the heat death of the universe. `ReviewItemPage.tsx:59` does the same for duplicates. There is **no UI anywhere that lists or clears snoozed items**; a repo-wide grep shows `attentionSnoozedUntil` is written in three places, read by two filters, and reset only by a full workspace reset or the demo seed.

2. **The rule-mute guard misfires under "Dismiss all".** `dismissRecommendation` (`store.ts:885-899`) carries a deliberate alert-fatigue guard: after three dismissals of the same rule, mute the rule permanently. But `SmartActionPanel.dismissAll()` (`:33-35`) loops `visibleRecommendations.forEach(dismiss)` — each as its own `set()`, so the counter accumulates within the single click. **If three visible recommendations share a rule, one click on "Dismiss all" permanently mutes it.** `mutedRecommendationRules` has no restore UI either (same grep result: written once, read twice, cleared only by `demoSeed.ts:719`).

3. Neither path asks for confirmation, offers undo, or produces a toast — even though a toast system with an Undo slot is right there (`ToastProvider.tsx:52`).

**Expected.** Permanent suppression is confirmed, reversible, or at minimum visible somewhere so it can be undone.

**Repro.** Overview with three or more Smart next actions → click **Dismiss all** once. The panel collapses. There is now no screen in the app that will tell you what was dismissed or let you bring it back short of Settings → Danger zone → Reset workspace, which erases everything.

**Impact.** The intelligence layer is a headline feature. A single misclick can retire it with no feedback and no path back, and the user will not know it happened — the panel simply never appears again. The blocking-severity carve-out at `store.ts:892` means the most critical items survive, which limits the damage, but everything else is gone.

**Correction.**
1. Give "Dismiss all" a confirmation (use the shared `ConfirmDialog` from S4) or, better, a toast with Undo — one call to the existing `toast({ onUndo })`.
2. Make `dismissAll` a **single** store action so the alert-fatigue counter sees one dismissal event, not N. That is what the guard's comment ("only once the same rule has been waved away three times") actually intends.
3. Add a **Dismissed & snoozed** section to Settings listing entries from `attentionSnoozedUntil` and `mutedRecommendationRules` with a Restore button. Small surface, and it is the only thing that makes permanent dismissal safe.

**Overlap.** None.

---

## S14 · MEDIUM · Quarterly goal progress does not update when the underlying data changes

- **Confidence:** medium-high · **Evidence:** source-confirmed
- **Route/control:** `/` → Quarterly goals panel
- **File:** `src/components/overview/OverviewSupport.tsx:69-84` (helper), called at `:170`

**Observed.** `currentForTarget()` reads live data via `useStore.getState()` — a **non-reactive** snapshot read. It is called during `QuarterlyGoalsPanel`'s render (`:170`) to compute the current value for GPA, MCAT, and each experience-hours target.

`QuarterlyGoalsPanel` subscribes only to `goals`, `quarterlyGoals`, `patchItem` and `softDeleteItems` (`:107-110`). It does **not** subscribe to `courses`, `experiences`, `experienceHourEntries` or `mcat`. Its parent, `Home` (`src/pages/Home.tsx:10-33`), holds no store subscription either, so it never re-renders to force the child.

**Expected.** Logging hours moves the hours goal's progress bar.

**Repro.** On Overview, note the progress on a clinical-hours goal. Press `q` → Hour log → org, 5 hours, Create. The toast confirms. The goal's progress bar and its numeric readout do not move. Navigate away and back (which remounts the panel) and the new value appears.

**Impact.** This is squarely "misleading progress" — the panel shows a stale number with full confidence and no timestamp. A user logging hours toward a target watches nothing happen and reasonably concludes the log did not save.

**Caveat on confidence.** Whether a stale render is *observed* depends on whether some other subscription re-renders the panel in practice. The non-reactive read is definite; the visible staleness needs one runtime check (RT-7 in §6).

**Correction.** Replace `useStore.getState()` with real selector subscriptions. Lift the four inputs into the component — `const courses = useStore(s => s.courses)` and so on — and pass them into `currentForTarget` as arguments, making it a pure function. That also removes a function that reads like a hook but is not one, which is its own hazard.

**Overlap.** None.

---

## S15 · MEDIUM · CenterPeek's "expanded" mode is an unmanaged overlay, and Escape leaks across nested overlays

- **Confidence:** medium-high · **Evidence:** source-confirmed (behavior), source hypothesis (severity of the focus effect)
- **Route/control:** any record peek → Expand; any record peek with unsaved changes → Escape
- **File:** `src/components/common/CenterPeek.tsx:60-63, 136-139, 141-168, 170-189`

**Observed, part 1 — mode-dependent semantics.** In `peek` and `split`, CenterPeek renders a real `DialogPrimitive.Root` with a portal, an overlay, a focus trap, `aria-label` and focus restore. In `expanded` (`:136-139`) it renders a plain `<section>` inline in the page. Same component, same user-facing control, two completely different interaction contracts:

| | peek / split | expanded |
|---|---|---|
| Focus trapped | yes | no |
| Focus moved in on entry | yes | no |
| Focus restored on exit | yes | no |
| Page behind removed from tab order | yes | no |
| Announced to assistive tech | yes (`aria-label`, `DialogTitle`) | no |

Pressing **Expand** silently drops the user out of a modal context with no announcement. Tabbing from the expanded record walks into the page beneath it.

**Observed, part 2 — Escape leaks.** The `window` keydown listener at `:60-63` demotes any non-peek mode to `peek` whenever Escape is pressed while the peek is open. It is not scoped to the peek's own DOM. So with unsaved changes in `split` mode: press Escape → the "Discard unsaved changes?" dialog (`:170`) closes **and** the peek behind it silently collapses from split to peek. One Escape, two unrelated state changes, one of them invisible.

**Expected.** Escape resolves the topmost overlay only. Mode changes preserve focus semantics.

**Repro (part 2).** Open a record in split mode, edit a field so `hasUnsavedChanges` is true, click Close → the discard dialog appears → press Escape. The dialog dismisses; note the layout behind has also reverted to peek width.

**Impact.** Part 1 is a real accessibility gap on a shared primitive, though its severity depends on how often expanded mode is used in reachable surfaces. Part 2 is a small, confusing state change that users will not connect to their keypress.

**Reference.** Radix's dismissable-layer stack exists to make Escape resolve only the top layer; a raw `window` listener sits outside it. `https://www.radix-ui.com/primitives/docs/components/dialog`.

**Correction.**
1. Scope the mode-shortcut listener to the peek content element instead of `window`, or gate it on `!confirmClose`.
2. For expanded mode, either keep it inside the Dialog (a full-bleed `DialogContent` variant) so focus management survives, or explicitly move focus into the section on entry, restore it on exit, and announce the change via a live region.

**Overlap.** `CenterPeek` is consumed by Academics surfaces too. Shared component; coordinate before changing the expanded branch.

---

## S16 · MEDIUM · Opening the notification popover from a menu fights that menu for focus — and the known fix was applied to six of seven actions

- **Confidence:** medium · **Evidence:** source hypothesis (focus arbitration is runtime-decided)
- **Route/control:** sidebar account menu → Notifications; ⌘K → "Find incomplete records"; topbar status chip
- **Files:** `src/components/layout/CommandSearch.tsx:37 vs :46`; `src/components/layout/Sidebar.tsx:75`; `src/components/layout/Topbar.tsx:107`; listener at `src/components/layout/AttentionBell.tsx:37-41`

**Observed.** The attention popover is opened by dispatching a global `premed:attention` event from three places. Two of those dispatch **while another Radix overlay is closing**:

- `Sidebar.tsx:75` — inside `DropdownMenuItem onSelect`. Radix DropdownMenu returns focus to its trigger on close.
- `CommandSearch.tsx:46` — inside `choose()`, immediately after `setOpen(false)` on the CommandDialog. Radix Dialog restores focus to its trigger on close.

Radix Popover moves focus into its content on open. So two focus managers act in the same tick, and the closing overlay's restore is likely to win, leaving the popover open with focus back on the avatar or the search field. Escape then does not close the popover, because focus is outside it.

**The strongest evidence that this is real is in the same file.** `CommandSearch.tsx:37` reads:

```
const quick = (kind: QuickAddKind) => () => window.setTimeout(() => openQuickAdd(kind), 0)
```

Six Quick Add actions are deliberately deferred a tick to escape exactly this race. The attention action nine lines later at `:46` is **not** deferred, and neither are `action-theme` or `action-sidebar`. Somebody hit this, fixed it for one group, and did not generalize.

**Expected.** Opening a popover from a menu lands focus inside the popover, and Escape closes it.

**Repro.** Sidebar avatar → **Notifications**. Watch where the focus ring lands, then press Escape and see whether the popover closes. Repeat from ⌘K → "Find incomplete records".

**Impact.** Keyboard users get an open overlay they cannot dismiss with Escape and must mouse away from. There is a second architectural cost: routing UI state through `window.dispatchEvent` bypasses React entirely, so nothing can await it, order it, or test it.

**Correction.** Two levels:
1. **Immediate:** wrap the attention dispatch in the same `window.setTimeout(…, 0)` the Quick Add actions already use, at all three call sites. One-line change, consistent with existing code.
2. **Right:** move `attentionOpen` into `ShellActionsProvider` next to `quickAddOpen`, and delete the custom event. `AttentionBell` becomes a controlled Popover, the three callers become `openAttention()`, and the whole race becomes a React state update.

**Overlap.** None.

---

## S17 · MEDIUM · Ten of fourteen sidebar destinations are "coming soon", with no signal until you click

- **Confidence:** high · **Evidence:** source-confirmed
- **Route/control:** sidebar, all viewports
- **Files:** `src/app/routes.tsx:26-49` + `NAV_GROUPS` at `:57-64`; `src/App.tsx:84-94`

**Observed.** `NAV_GROUPS` renders every route with `nav !== false`. Of the fourteen it produces, ten render `ReservedSpace`: MCAT, Clinical, Volunteering, Shadowing, Research, Extracurriculars, School List, Essays & Story Bank, Letters of Rec, Timeline. Four work: Overview, Academics, Atlas, plus Overview's sub-routes.

They are visually identical to the working ones — same icon treatment, same hover, same active state, same taglines promising real functionality ("Patient-contact hours toward your goal", "Build a realistic list against your stats + mission").

**Expected.** Navigation predicts its outcome.

**Repro.** Fresh install. Click through the sidebar top to bottom. Ten of fourteen clicks cost a full page navigation to learn the feature does not exist yet.

**Impact.** The sidebar is the app's primary IA. In its current state it is mostly a menu of things that are not there, and it gives no way to tell before clicking. First-session users will read the beta as far emptier than it is, because the four working surfaces are buried among ten that are not.

**This may be intentional** — see C1 in Part B. `ReservedSpace`'s copy ("Your account is ready when it opens") reads like a deliberate product stance, and reserving nav slots so the IA does not shift under users later is a legitimate choice. What I am reporting is narrower: **the stance is invisible until after the click.**

**Correction.** Smallest change that keeps the reserved-slot strategy intact: a muted "Soon" chip on reserved rows and slightly reduced icon/label emphasis, driven by the same shared reserved-route list that S3 and S7 need. The nav keeps its final shape, and the click stops being a surprise.

**Overlap.** None, but this is a product decision — confirm with Andy before changing nav presentation.

---

## S18 · MEDIUM · The custom date picker has no arrow-key navigation and misuses `aria-pressed`

- **Confidence:** high · **Evidence:** source-confirmed
- **Route/control:** every date field — Quick Add due date, log date, Settings, and elsewhere
- **File:** `src/components/common/DateField.tsx:83-112`

**Observed.** `DateField` renders 35–42 sibling `<button>` elements in a `div.grid.grid-cols-7`. There is no `onKeyDown` in the component. Consequences:

1. **Every day is a tab stop, and Tab is the only way to move.** No Arrow keys, no PageUp/PageDown for month, no Home/End for the week. Reaching the end of a month is up to 42 Tab presses, and the two month-navigation chevrons sit *before* the grid, so Shift+Tab out of the grid is the only way back to them.
2. **`aria-pressed={isSel}` on a date button** (`:97`). `aria-pressed` denotes a toggle button; a screen reader announces "toggle button, pressed". A date in a picker is a *selected* option, not a pressed toggle.
3. **"Today" is conveyed only by `ring-1 ring-primary/50`** (`:105`) — a purely visual cue with no programmatic equivalent. No `aria-current="date"`.
4. Radix Popover moves focus to the first focusable child on open, which is the **Previous month** chevron — not the selected date.
5. Weekday headers are `<span>`s keyed by index with duplicate letters (`S M T W T F S`), with no `abbr` or accessible full name.

**Expected.** A date grid behaves like a grid: arrows move by day, PageUp/PageDown by month, Home/End within the week, one tab stop for the whole grid.

**Repro.** Quick Add → Task → click the due-date field → press Tab repeatedly and count. Then press ArrowRight and observe nothing happens. With a screen reader, note that the selected date is announced as a pressed toggle button and today is not announced at all.

**Impact.** Item 3 is a genuine WCAG 1.4.1 (Use of Color, Level A) concern — "today" is information conveyed only visually. Items 1, 2, 4 and 5 are **not** WCAG failures: everything remains keyboard-operable via Tab, so SC 2.1.1 passes. They are deviations from the WAI-ARIA APG Date Picker Dialog pattern, and the practical cost — dozens of tab presses to pick a date — is real usability harm rather than a normative violation. I flag the distinction deliberately, per the brief.

**Reference.** WAI-ARIA APG Date Picker Dialog, `https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/` (egress-blocked here; cited from knowledge).

**Worth knowing:** `react-day-picker@^10.0.1` and `src/components/ui/calendar.tsx` are **already installed and have zero consumers**. `react-day-picker` implements the APG grid keyboard model, `aria-selected`, and `aria-current="date"` out of the box.

**Correction.** Cheapest correct fixes first — these three are small and clear the real problems:
- `aria-pressed={isSel}` → `aria-selected` on a `gridcell`, or simply drop it and rely on `aria-current`.
- Add `aria-current={isToday ? 'date' : undefined}` (fixes the 1.4.1 concern).
- Add roving tabindex + an `onKeyDown` for Arrow/Home/End/PageUp/PageDown on the grid container.

Then consider replacing the internals with the already-installed `ui/calendar.tsx`, keeping `DateField`'s trigger and theming. The comment at the top of the file says it exists because the *native* `<input type="date">` popup clashed with the design — that reason does not apply to `react-day-picker`, which is fully styleable.

**Overlap.** `DateField` is used in Academics too. Shared component; coordinate.

---

## S19 · MEDIUM · Overview leaves a dangling half-width card at common laptop widths

- **Confidence:** medium-high · **Evidence:** source-confirmed (deterministic from the class list; needs a screenshot to call it verified)
- **Route/control:** `/` at 1024–1279px
- **File:** `src/pages/Home.tsx:17-30`

**Observed.** The grid is `lg:grid-cols-6 xl:grid-cols-12`. Tracing the `lg` column spans row by row:

| Row | Children | Columns used of 6 |
|---|---|---|
| 1 | OverviewTasks (6) | 6 ✓ |
| 2 | WhereIStand (6) | 6 ✓ |
| 3 | GpaStatTile (3) + McatStatTile (3) | 6 ✓ |
| 4 | HoursStatTile (6) | 6 ✓ |
| 5 | QuickAccess (3) + QuarterlyGoalsPanel (3) | 6 ✓ |
| 6 | **ActivityAndCapture (3)** | **3 of 6 — half the row is empty** |
| 7 | OverviewRoadmap (6) | 6 ✓ |

Row 3 of the support group has three `lg:col-span-3` children in a six-column grid, so the third wraps alone. `EqualHeightGrid` applies `[&>*]:h-full` (`BoundedLayout.tsx:8`), so the orphan stretches to full row height, making the empty gutter beside it more conspicuous, not less.

At `xl` (1280px+) the same three cards are `xl:col-span-4` in a twelve-column grid and tile correctly. Below `lg` everything stacks. The defect exists only in the 1024–1279px band — which is a 13" MacBook at default scaling, i.e. the most common student laptop.

**Expected.** No dangling element; bounded, equal-height side-by-side layout at every breakpoint.

**Repro.** Open `/` at exactly 1152×800. The Activity & capture card sits alone on its row with roughly 50% dead space to its right.

**Impact.** Directly contradicts `specifications/01-shared-interface-patterns.md` §5c layout discipline, which `AGENT-IMPLEMENTATION-GUIDE.md` §2 makes a global rule for every screen: "equal-height side-by-side elements, bounded dimensions, nothing protruding or overflowing."

**Correction.** Make the support row divide evenly at `lg`. Either give the three cards `lg:col-span-2` (three across in six columns), or promote one to `lg:col-span-6` so the row completes. `lg:col-span-2` is the smaller change and preserves the xl layout untouched.

**Verification required.** This is arithmetic from the class names, not a rendered measurement. Per `CLAUDE.md`'s Aug 19 rule, confirm by measuring a screenshot at 1152px before and after. Logged as RT-9.

**Overlap.** None.

---

## S20 · MEDIUM · No shared way to say "nothing matches your filters" — and this is the root of the inherited Academics report

- **Confidence:** high · **Evidence:** source-confirmed (mine) + **inherited** (the Academics symptom)
- **Route/control:** every filterable list in the app
- **Files:** `src/components/common/CollectionState.tsx:9-49`; `src/components/common/EmptyState.tsx:6-18`

**Observed.** `CollectionState` models three states — `ready`, `loading`, `error` — plus a single static `empty` object. There is **no concept of filtered-empty**. Any consumer that wants to distinguish "you have no records" from "your filters excluded everything" has to hand-roll the branch and remember to do so.

Across the whole app, exactly **one** place does: `Extracurriculars.tsx:579` renders "No matching organizations — Try a different name, type, or filter." And `Extracurriculars` is one of the nine orphaned page modules (`/ecs` renders `ReservedSpace`), so **that implementation is unreachable in this build**. Zero reachable surfaces distinguish the two states.

**Why this matters here.** The Codex Academics task reports *"filtered-empty schedules falsely saying Free/Nothing due."* I did not reproduce that and it is not my surface. But the shared primitive every list in the app is built on cannot express the distinction, which makes their symptom the predictable consequence of a shell-level gap rather than an Academics-local bug. **Fixing it in Academics alone leaves the same trap set for every list that ships next.** This is the shared root cause the coordination brief asked me to look for.

**Expected.** One shared component that renders a distinct state with a "Clear filters" action when a filter is active and the result set is empty.

**Impact.** "Nothing due" and "nothing due *matching your current filter*" are opposite messages. Telling a student they are free when they have filtered away three assignments is a trust failure, not a cosmetic one.

**Correction.** Extend the shared primitive rather than patching consumers:

```
CollectionState({
  state, empty,
  filtered?: { active: boolean; title: string; hint: string; onClear: () => void },
  ...
})
```

When `filtered.active` and the list is empty, render the filtered variant with a **Clear filters** button instead of the generic empty state. Then sweep the reachable consumers — `TrackerTable`, `Kanban`, `AssignmentsPanel` — and pass it. `useListPipeline.ts` / `useSavedViews.ts` already know whether a filter is active, so the flag is available without new plumbing.

**Overlap.** **Direct overlap with Codex's inherited finding.** Proposal: I own the shared primitive; they adopt it in `AssignmentsPanel` and the schedule surfaces. Worth a message before either side starts, so the API is agreed once.

---

## S21 · LOW-MEDIUM · The crash screen is hard-coded light-theme

- **Confidence:** high · **Evidence:** source-confirmed
- **Route/control:** any unhandled render error, app-wide
- **File:** `src/components/layout/AppErrorBoundary.tsx:63-79`

**Observed.** The boundary paints `background: '#faf7f2'`, `color: '#1f2937'`, a `#fff` card, and `fontFamily: 'system-ui, sans-serif'` — inline styles with no theme awareness. Premed OS defaults to warm dark (`#211e1a`). A dark-mode user whose app crashes gets a full-viewport white flash.

The file's header comment justifies this as "deliberately dependency-free: no store import, no UI kit, no router". That reasoning is sound for the *router* and the *store* — but the file already imports `@/lib/demoMode` (`:13`), so it is not dependency-free, and reading the theme needs no dependency at all: the `.dark` class is on `documentElement`, and `prefers-color-scheme` is a media query.

Two smaller notes in the same file: it uses `window.alert` (`:25`) and `window.confirm` (`:51`), which is the S4 pattern again; and it surfaces only `error.message` with no component stack and no copy button, so a beta tester reporting a crash has nothing to paste.

**Expected.** The crash screen respects the user's theme, since `CLAUDE.md` requires every surface to work in both.

**Repro.** Set dark mode, force a render error, observe the white screen.

**Impact.** Low frequency, high salience. The crash screen is the worst possible moment for the app to look like a different application. It is also the screen whose entire job is to reassure the user their data is safe.

**Correction.** Keep it dependency-free and read the theme directly:

```
const dark = document.documentElement.classList.contains('dark')
  || (!document.documentElement.classList.contains('light')
      && window.matchMedia('(prefers-color-scheme: dark)').matches)
```

Then pick between two inline palettes using the literal token values from `CLAUDE.md` (`#211e1a` / `#2b2722` / `#ece3d4` / `#3c352d` for dark). Hard-coding the hexes here is correct — this screen must render when the stylesheet is the problem. Also add a "Copy error details" button carrying `error.stack` and the component stack.

**Overlap.** None.

---

## S22 · LOW-MEDIUM · Quick Add accepts a whitespace-only title, then silently does nothing

- **Confidence:** high · **Evidence:** source-confirmed
- **Route/control:** Quick Add → any type → Create
- **File:** `src/components/layout/QuickAddDialog.tsx:90-92, 147`

**Observed.** The title input carries `required`, which the browser satisfies with a single space. `submit()` then guards with `if (!activeKind || !title.trim()) return` — an early return with **no error message, no focus move, no toast**. The dialog stays open, unchanged.

**Expected.** Either whitespace is trimmed and rejected with a visible message, or the Create button is disabled until the title has content.

**Repro.** Quick Add → Task → type a single space into Title → click **Create**. Nothing happens. No feedback of any kind.

**Impact.** Classic "the button is broken" moment. Small, but it lands on the app's most-used control, and validation feedback is explicitly in scope.

**Correction.** Simplest: `disabled={!title.trim()}` on the submit button, matching what `HelpFeedbackLauncher.tsx:46` already does (`disabled={!feedback.trim()}`) — the pattern exists in the codebase, it just was not applied here. If you prefer an error message, render it in a `role="alert"` beneath the input and move focus to the field.

**Overlap.** None.

---

## S23 · LOW-MEDIUM · Hiding the last table column makes every column reappear

- **Confidence:** high · **Evidence:** source-confirmed (found by `/code-review`, re-verified against both files)
- **Route/control:** any `TrackerTable` → Columns popover
- **Files:** `src/components/common/SavedViewControls.tsx:60-77`; `src/components/common/TrackerTable.tsx:141-143`

**Observed.** `TrackerTable` treats an empty `visibleColumns` array as a **"show all" sentinel**: `views.state.visibleColumns.length ? columns.filter(...) : columns`. `SavedViewControls` lets you uncheck freely, and unchecking the last remaining column produces `[]` — which the table reads as the sentinel.

**Expected.** Either the last column cannot be unchecked, or hiding everything shows an explicit empty-columns state.

**Repro.** Open any tracker table → Columns → uncheck every column one at a time. On the final uncheck, all columns snap back and every checkbox reads as checked again.

**Impact.** Confusing rather than harmful, and it makes the column state feel unreliable. One value carrying two meanings — "all" and "none" — is the underlying defect.

**Correction.** Prevent the last uncheck (disable the checkbox when `current.length === 1 && visible`), which is what most table UIs do, or replace the sentinel with an explicit `null` for "not customized" and treat `[]` as genuinely empty. The first is a two-line change.

**Overlap.** `TrackerTable` is shared with Academics.

---

## S24 · LOW · "Capture a thought" animates its scroll for users who asked for reduced motion

- **Confidence:** high · **Evidence:** source-confirmed
- **Route/control:** `/` → Quick access → "Capture a thought"
- **File:** `src/components/overview/OverviewSupport.tsx:52`

**Observed.** `scrollIntoView({ behavior: 'smooth', block: 'start' })` with no reduced-motion guard.

The team clearly intended to handle this globally: `src/index.css:938-942` contains a `@media (prefers-reduced-motion: reduce)` block setting `scroll-behavior: auto !important`. **That does not help here.** Per CSSOM-View, the CSS `scroll-behavior` property is consulted only when the scroll's behavior is `'auto'`; an explicit `behavior: 'smooth'` passed to `scrollIntoView` overrides it. The CSS guard covers anchor navigation and CSS-driven scrolling, not JS calls that name a behavior.

Same pattern at `PublicNav.tsx:79`, `Landing.tsx:149`, `DocLayout.tsx:114`, and three Academics sites (`PlannerBoard.tsx:520`, `ClassHub.tsx:1048`, `SyllabusImportMode.tsx:394`).

**Expected.** Reduced-motion users get an instant jump.

**Repro.** Set OS reduce-motion, load `/`, click "Capture a thought", watch the page animate.

**Impact.** Motion sensitivity — nausea and vestibular symptoms — is the reason the preference exists. Long smooth scrolls are among the more provocative motions. Low frequency, genuinely unpleasant for the affected users. Not a strict WCAG failure (2.3.3 Animation from Interactions is Level AAA), but it defeats a guard the codebase already tried to build.

**Correction.** One shared helper, then replace all seven call sites:

```
export function scrollToElement(el: Element | null, block: ScrollLogicalPosition = 'start') {
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block })
}
```

Note `document.getElementById('quick-capture')?.` also fails silently if the target is absent; the helper is the natural place to keep that safe.

**Overlap.** Three of seven call sites are Academics.

---

## S25 · LOW · Command-palette recents ranking penalises the 10th–12th most recent items

- **Confidence:** high · **Evidence:** source-confirmed (found by `/code-review`, re-verified)
- **Route/control:** ⌘K ranking
- **File:** `src/components/layout/commandSearchCore.ts:37`

**Observed.** `const recentBoost = recentIds.indexOf(hit.id)` then `score + actionBoost + (recentBoost >= 0 ? recentBoost - 8 : 0)`. Lower score wins. Recents are capped at 12 (`CommandSearch.tsx:91`), so the index runs 0–11. `index - 8` is a boost for 0–7, exactly **zero** at index 8, and a **penalty** for 9, 10 and 11.

**Expected.** Every remembered item ranks at or above an equivalent never-used item.

**Impact.** Small and invisible, but it means the ranking does the opposite of its intent for a quarter of the recents list.

**Correction.** Make the boost monotonically negative across the whole window: `-(recentIds.length - recentBoost)` or simply `recentBoost - 12` to match the cap. Note this is masked entirely by S2 today — recents ranking cannot be observed until cmdk's double filter is turned off.

**Overlap.** None.

---

## S26 · LOW · Four hand-rolled copies of the same "is the user typing?" guard

- **Confidence:** high · **Evidence:** source-confirmed
- **Files:** `src/lib/keyboard.ts:2-5` (the shared helper); divergent copies at `src/components/common/RecordOpenWorkspace.tsx:48`, `src/components/common/AssignmentsPanel.tsx:417`, `src/pages/prototypes/FounderConsolePrototype.tsx:88`

**Observed.** A shared helper exists and is documented as "Shared guard for single-key and shell shortcuts". Three other components ignore it and inline their own, each covering a different set:

| Implementation | `input` | `textarea` | `select` | `[contenteditable="true"]` | `[role="textbox"]` |
|---|---|---|---|---|---|
| `keyboard.ts` (shared) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `RecordOpenWorkspace` | ✓ | ✓ | ✓ | ✓ | ✗ |
| `AssignmentsPanel` | ✓ | ✓ | ✗ | ✓ | ✗ |
| `FounderConsolePrototype` | ✓ | ✓ | ✗ | via `isContentEditable` | ✗ |

There is also a gap **all four** share: `contenteditable` written without a value (valid HTML, means true), `contenteditable="plaintext-only"`, `[role="searchbox"]` and `[role="combobox"]` match none of the selectors. No component in `src/` currently uses those forms — I checked — so this is latent risk, not a live defect.

**Expected.** One guard, one behavior. `AGENT-IMPLEMENTATION-GUIDE.md` §2: "Reuse, don't fork."

**Impact.** Today: minor inconsistency in which controls suppress shortcuts. The moment a rich-text field is added anywhere, whichever copy governs that surface decides whether typing a `q` opens a modal mid-sentence. This will bite once and be hard to trace.

**Correction.** Delete the three inline copies, import `isTypingTarget`, and widen the shared selector to `input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="searchbox"], [role="combobox"]`.

**Overlap.** `AssignmentsPanel` is Academics-adjacent. Note also that its listener at `:423` has **no dependency array**, so it detaches and reattaches on every render — worth fixing in the same pass. That one is Codex's call.

---

## S27 · LOW · Translucent surfaces are back on Overview, Settings and Review after being fixed in Academics

- **Confidence:** medium-high · **Evidence:** source-confirmed (class names), **needs measurement** to confirm the visual collapse
- **Files (reachable, non-Academics):** `Settings.tsx:194, 267, 513, 592, 603, 631, 648, 694`; `TrackerTable.tsx:406, 457, 496, 598, 614`; `OverviewSupport.tsx:41, 275, 481`; `OverviewTasks.tsx:403, 558, 715`; `OverviewStatus.tsx:201, 209`; `OverviewHero.tsx:186, 197` (`bg-card/88`); `ReviewItemPage.tsx:103, 121`; `FirstLoginSetupPage.tsx:294`

**Observed.** `CLAUDE.md` records the Aug 19 2026 finding: *"nine Academics surfaces shipped with `bg-muted/15–50` where the recipe rules solid `var(--muted)`, and the translucency collapsed page, panel and inner card into one tone."* The rule that followed was to measure `getComputedStyle().backgroundColor` against the mockup's own CSS rule, in both themes, before calling a surface done.

A sweep of the current tree finds **162** `bg-muted/NN` occurrences repo-wide, of which roughly **25 sit on reachable non-Academics surfaces** — Settings has 8, TrackerTable 5, the Overview components 10, ReviewItemPage 2. `OverviewHero` additionally uses `bg-card/88`.

**Expected.** Solid `var(--muted)` where the recipe rules it, so page / panel / inner card stay three distinguishable tones.

**Impact.** Not every one of these is wrong — a hover tint (`hover:bg-muted/35` at `TrackerTable.tsx:406`) is a legitimate use of alpha, and `bg-card/88` on a hero chip may be a deliberate glass judgment under `04` §0c. What the sweep shows is that **the Academics fix was applied locally and the rule was never enforced elsewhere**, so the same pattern regrew on the pages I audited.

**Correction.** Do the measurement pass `CLAUDE.md` prescribes on Settings and the Overview components: for each of the ~25, compare the computed background against the mockup's rule in both themes, and convert the ones that are meant to be surfaces (not hovers) to solid `bg-muted`. Then add the check to `.claude/commands/verify-premedhq.md` so it runs before push rather than being rediscovered per-page.

**I am explicitly not calling all 25 defects** — that would be eyeballing class names, which is the exact error the rule was written against. This is a scoped work item with a defined verification step (RT-12).

**Overlap.** The Academics occurrences (LectureCapturePanel 21, ClassCenter 16, and others) are Codex's.

---

## S28 · LOW · Unused dependencies, dead components, and nine orphaned page modules

- **Confidence:** high · **Evidence:** source-confirmed
- **Impact:** maintenance and install weight, not user-facing

**Unused shadcn primitives** (zero importers in `src/`): `accordion`, `calendar`, `carousel`, `drawer`, `hover-card`, `input-otp`, `pagination`, `radio-group`, `sheet`, `sonner`.

**Dependencies those pull in, with no consumer:** `sonner@^2.0.7` (a full toast library, while `ToastProvider` reimplements it — see S10), `vaul@^1.1.2` (drawer), `react-day-picker@^10.0.1` (calendar — while `DateField` reimplements it, see S18), and whatever backs `carousel`. `CLAUDE.md` lists "No new dependencies without flagging first" as a standing rule; these arrived and were never used.

**Dead components:** `src/components/layout/AlertsStrip.tsx` (no callers), `src/components/common/SegmentedBar.tsx` (no callers; its doc comment also disagrees with its `100 / segments.length` implementation), and in `src/components/common/HeroDailySchedule.tsx` two of three exports — `HeroCountdown` and `HeroSchedulePanel` — have no consumers. Only `useHeroScheduleSource` is used, by `OverviewHero.tsx:6`.

> **Note for whoever reads the `/code-review` output directly:** it flagged `HeroDailySchedule.tsx:165` — a greeting that rotates every 9 seconds off a 1-second timer — as a live bug. The logic is real but sits inside `HeroCountdown`, which nothing renders. It is dead code, not a shipped defect. Recorded here so it is not fixed as a user-facing bug or, worse, dismissed as a false positive when the dead code is one day revived.

**Orphaned page modules** (written, never imported): `Archive`, `Essays`, `ExperiencePillar`, `Extracurriculars`, `Letters`, `Mcat`, `NorthStar`, `Schools`, `Timeline`. These are the pillar implementations sitting behind `ReservedSpace`. Being unreferenced, they are tree-shaken out of the bundle, so there is no runtime cost — but they are also not typechecked against the specs anyone is currently changing, and one of them (`Extracurriculars.tsx:579`) holds the only filtered-empty implementation in the repo (S20).

**Correction.** Deliberate call, not an automatic cleanup: decide per item whether it is *reserved* (keep, and say so in a comment) or *abandoned* (delete). Reconcile `sonner`/`ToastProvider` and `react-day-picker`/`DateField` as part of S10 and S18 rather than separately — those are the two that duplicate real functionality.

---

# Part B — Spec disagreements and open questions

These are **not** defects. They are places where the code, the docs, and the observable product disagree, and where `AGENT-IMPLEMENTATION-GUIDE.md` §0 says to stop and ask rather than guess.

**C1 — Is the reserved-pillar navigation strategy intentional as presented?**
`ReservedSpace`'s copy reads as a deliberate product stance, and holding the nav slots so the IA does not shift under users later is defensible. But the shell currently routes users into reserved surfaces from five directions with no advance signal: the sidebar (S17), the command palette's Navigate group, Quick Add's toast (S3), the attention bell (S7), and Smart next actions. **Question for Andy:** is the intent "the nav shows the finished product" — in which case S3/S7/S17 should add a "Soon" signal but keep every entry — or "only ship what works", in which case reserved entries should be hidden until their pillar lands? The correction differs completely. I did not change anything pending this.

**C2 — `settings.sidebarCollapsed` versus `premed_os_desktop_sidebar_locked`.**
Two stores for one boolean; the schema field is written by the palette and read by nobody (S11). Which is canonical? If the store field is, `AppShell` should read it and the localStorage key should be migrated away. If localStorage is, the schema field should be removed — with the versioned, lossless migration `CLAUDE.md` requires for any localStorage schema change.

**C3 — `AppErrorBoundary`'s "dependency-free" contract.**
The header comment claims no store, no UI kit, no router. The file imports `@/lib/demoMode` (`:13`). Either the comment should be narrowed to what is actually guaranteed, or the `activeStorageKey()` call should be inlined. As written, the comment is being used to justify the hard-coded light theme (S21), and it is not accurate.

**C4 — `mcat/session` is routed outside the shell while `/mcat` is reserved.**
`App.tsx:53` puts `McatFocusSession` at the top level, outside `AppShell`, so it has no nav, no topbar and no exit affordance, while its parent pillar renders "coming soon". Reachable by direct URL. Intentional focus-mode design, or a leftover? I could not determine this from the docs and did not audit the page.

**C5 — Deep links rewrite a saved preference.**
`Academics.tsx:166` — `if (linkedMode !== storedMode) update(...)` — means clicking a notification permanently changes the student's saved Academics mode. The surrounding comment argues for it deliberately ("authored cross-mode links remain deterministic") and the reasoning holds. Flagging only because "a notification click mutates a persisted preference" is the kind of thing worth having said out loud. Codex's surface; no action proposed.

---

# Part C — Optional polish

- **P1 — Settings is ten cards in one scroll** (`Settings.tsx`, 723 lines): Backup, Local data, AI study data, Cloud sync, Account & security, Google Calendar, Preferences, Danger zone, Archive, Public layer reset. No in-page navigation, no grouping, no progressive disclosure. Danger zone sits between Preferences and Archive rather than last. Consider sections with a sticky mini-nav, and move Danger zone to the bottom.
- **P2 — The topbar status chip has two different contracts behind one appearance** (`Topbar.tsx:95-114`): for `alert`/`due` tones it is a `<button>` that opens the attention popover; for `system`/`clear` it is a `<Link>` to `/settings`. Same pill, same styling, different outcome, no indication which you will get. Consider always opening the popover, or differentiating the affordance.
- **P3 — Notifications have three entry points** (topbar bell, sidebar account menu, command palette), two of which route through the fragile global event (S16). Once S16's state lift lands, consider whether all three are earning their place.
- **P4 — The attention popover reserves a fixed `h-[min(60vh,30rem)]`** (`AttentionBell.tsx:70`) regardless of content, so a single item floats in a tall empty panel. Let it size to content up to that maximum.
- **P5 — Patch Notes says "version 0.0.0"** (`Sidebar.tsx:115`) and describes capabilities on reserved pillars. Either wire a real version or drop the number.
- **P6 — Vestigial sidebar hover-peek code**: `desktopSidebarVisible = desktopSidebarLocked` and `keepDesktopSidebarVisibleOnNavigate = useCallback(() => {}, [])` (`AppShell.tsx:50-51`) are leftovers from a removed behavior. Harmless; confusing to read.
- **P7 — Two localStorage keys skip workspace scoping**: `premed_os_desktop_sidebar_locked` (`AppShell.tsx:32`) and `premed_hq_patch_notes_seen` (`Sidebar.tsx:36`), while `workspaceKeyMigration.ts:29-33` namespaces three others. Per-browser is a defensible choice for both — a UI preference is arguably not per-account. Listed so the inconsistency is a decision rather than an oversight.

---

# Part D — Preserve intentionally

Things I looked at closely, found strong, and would resist changing during any of the fixes above.

- **`AuthPage`'s enumeration safety and ARIA wiring** (`AuthPage.tsx:13-20, 66-83, 542-549`). One generic credential error for both a wrong password and an unknown account, `role="alert"` for errors and `role="status"` for notices, correct `autoComplete` values, live password-requirement feedback, a resend cooldown, and a genuine busy state. Aside from S1's missing arrow keys, this is the best-built surface in the app. Fix S1 without disturbing any of it.
- **The unified attention model** (`attention.ts:1-11`). One deterministic source feeding the bell, the status chip and the review queue, so a warning can never say one thing in one place and another elsewhere. Every item carries a plain-language `why`. Keep the single-source shape when filtering reserved routes for S7 — filter in `buildAttention`, not in the consumers.
- **`motion-safe:` / `useReducedMotion` discipline.** Nearly every animation in the app is guarded, including skeletons (`CollectionState.tsx:26`) and layout animations (`SmartActionPanel.tsx:42-46`). S24 is the exception that proves the rule, and it fails only because of a CSSOM detail.
- **The recovery stack and undo plumbing** (`store.ts`, `meta.recoveryStack`, `undoRecovery`). Real, considered reversibility. S10's fix should extend its reach, not replace it.
- **Workspace key namespacing and its migration** (`workspaceKeyMigration.ts`). Adopt-once-into-the-first-workspace, legacy key removed only after the scoped write succeeds, wrapped so a quota failure cannot block boot. This is the standard `CLAUDE.md` sets for localStorage changes and it is met properly.
- **`AppErrorBoundary`'s export-first design.** Offering a raw data export before Reload and Reset, in that order, on a crash screen that assumes the store may itself be the problem. Correct instinct. S21 is about the paint, not the design.
- **`ReservedSpace` as a concept.** A single component, honest copy, consistent treatment, and a reassurance that existing data survives. The problem is everything upstream of it, not the page.
- **The comment culture.** Several findings here were *faster* to confirm because the code explains its own reasoning (`attention.ts`, `workspaceKeyMigration.ts`, `Academics.tsx:153-156`, `main.tsx:1-9`). Two of my hypotheses died on a comment that told me why the code was already right. Worth protecting.

---

# Part E — Unresolved runtime checks

Every finding above is static analysis. These are the checks that would turn "source-confirmed" into "beta-tested". Run them after `npm i && npm run dev`.

**Record for every screenshot:** viewport (w×h), theme (warm-dark / paper), and build (`git rev-parse --short HEAD`). Use a **disposable synthetic workspace** — never real coursework. Fastest safe route: open the app, Settings → Danger zone → Reset workspace in a throwaway browser profile, or use the demo namespace (`isDemoMode()`), which is isolated by design (`demoMode.ts:95-107`).

| # | Finding | Check | Pass criterion |
|---|---|---|---|
| RT-1 | S1 | `/auth`, password method. Tab through the entire page; then press ←/→/Home/End on the "Sign in" tab. | "Create account" receives focus by some key. **Currently expected to fail.** |
| RT-2 | S2 | ⌘K, type the full name of a course and of a task you created. | Both appear. Currently expected: "No matches for …". |
| RT-3 | S2 | ⌘K, type `log hours`. | The "Log hours" action appears. |
| RT-4 | S3 | Quick Add → School → Create → click **Open** in the toast. | Lands somewhere that shows the school. Currently expected: reserved card. |
| RT-5 | S5 | Open any dialog, focus a button inside it, press `q`, then `[`. | Neither fires while a modal is open. |
| RT-6 | S6 | With ≥2 classes: Quick Add → Assignment → Create. Check which class it attached to. Then repeat with **0** classes and look for the record in Academics and in the bell. | A course is chosen explicitly; no orphan is created. |
| RT-7 | S14 | On `/`, note a quarterly hours goal's progress. Quick Add → Hour log → 5 hours → Create. **Do not navigate.** | The progress bar moves. |
| RT-8 | S8 | Scroll to the bottom of `/settings`, then navigate to `/profile`. | Profile opens at the top. |
| RT-9 | S19 | Load `/` at exactly **1152×800**. Screenshot. Then 1280×800 and 1024×768. | No card sits alone in a half-empty row at any width. Measure, do not eyeball. |
| RT-10 | S9 | Click `?` → **Open help**. | Help page renders with no modal over it. |
| RT-11 | S10 | Quick Add → Task → Create. Hover the toast for 8s. Repeat and press Tab toward Undo. | Timer pauses on hover and on focus. |
| RT-12 | S27 | On `/` and `/settings`, in **both themes**, run `getComputedStyle(el).backgroundColor` on each surface listed in S27 and compare against the mockup's own CSS rule. | Page, panel and inner card resolve to three distinct values. This is the `CLAUDE.md` Aug 19 procedure. |
| RT-13 | S16 | Sidebar avatar → **Notifications**. Note where the focus ring lands; press Escape. | Focus is inside the popover; Escape closes it. |
| RT-14 | S18 | Open any date field. Press ArrowRight, PageDown, Home. Count Tab presses to reach the last day of the month. | Arrows move by day; the grid is one tab stop. |
| RT-15 | S15 | Open a record in split mode, make an edit, click Close, press Escape on the discard dialog. | Only the dialog closes; the peek stays in split. |
| RT-16 | all | `/` and `/settings` at **200% browser zoom**, 375px width, and with OS reduce-motion on, in both themes. | No horizontal scroll on `<body>`; no clipped controls; no animated scrolling. |

Two things I could not assess at all and am not claiming either way:

- **Performance.** `Topbar.tsx:29` and `AttentionBell.tsx:30` both call `useStore()` with no selector, subscribing to the entire store, and each recomputes the full attention model on every store write. On a data-heavy page that means the deadline scan plus `dataHealthWarnings` runs twice per keystroke that touches the store, alongside a full topbar re-render. That is a plausible contributor to input latency and it is worth profiling — **but I did not reproduce a hang, and I am not attributing Codex's inherited "table hangs" report to it.** Narrowing both to selectors and memoising `buildAttention` on a stable input would be cheap regardless. Treat as a lead, not a finding.
- **Anything requiring live Supabase, Google Calendar, or Drive.**

---

# Part F — Overlap and ownership

**Mine, no coordination needed:** S1, S2, S3 (shell half), S4 (Settings + shared component), S5, S7, S9, S11, S12, S13, S14, S16, S17, S19, S21, S22, S25, and Parts B–D.

**Shared components — tell Codex before editing:**

| Finding | File | Why it matters to them |
|---|---|---|
| S20 | `CollectionState.tsx` | **This is the root cause of their filtered-empty report.** Proposal: I extend the primitive, they adopt it in `AssignmentsPanel` and the schedule surfaces. Agree the API once, before either side starts. |
| S6 | `QuickAddDialog.tsx` writes → their `AssignmentsPanel` reads | The orphan-`courseId` record is created by the shell and hidden by their filter. Fix both ends in one pass. |
| S8 | `AppShell.tsx` + `Academics.tsx:74-79` | Their local scroll-reset should be trimmed once the shell handles `pathname`. Land the shell fix first; theirs is harmless in the meantime. |
| S15, S18, S23, S24, S26, S27 | `CenterPeek`, `DateField`, `TrackerTable`, scroll helper, `keyboard.ts`, muted surfaces | All shared. Their Academics occurrences are theirs; the primitives are mine. |

**Theirs, untouched by me:** all Academics interactions, uploads, assignment/calendar overflow, table hangs, lecture preview vs. generation state, source receipts, GPA/archive clarity, page hierarchy.

**Inherited, not reproduced:** long assignment overflow; filtered-empty schedules saying Free/Nothing due (root cause reported as S20); raw transcript shown as a Study Guide; final build receipts omitting failed-source counts; confusing ledger/GPA eligibility counts. I treated all five as context only. Only the second one led me anywhere, and what I found was a shell-level gap, not a confirmation of their symptom.

**Not owned by anyone yet:** C1 needs a product decision from Andy before S3, S7 and S17 can be corrected the right way.
