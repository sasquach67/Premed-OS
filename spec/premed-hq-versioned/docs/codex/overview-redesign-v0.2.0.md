# Premed OS — Overview Redesign Implementation Brief

## Primary objective

Redesign the **Overview/Home experience** so it feels intentional, calm, useful, and action-oriented rather than like a collection of loosely related cards.

This is primarily an information-architecture and UI/UX pass. Do not rewrite the application into React or introduce a build system.

## Existing architecture

Preserve the current global module structure:

- `index.html`
- `css/styles.css`
- `js/app.js`
- `js/pillars.js`
- `js/ui.js`
- `js/store.js`
- `js/seed.js`

Preserve:

- static-file operation
- existing `PremedStore`, `PremedUI`, and `PremedPillars` patterns
- current localStorage data
- JSON import/export compatibility
- Google Drive backup behavior
- existing user data and seed data
- event delegation through `data-*` attributes

Before editing, inspect the complete application and identify all existing implementations of:

- Overview/Home
- greeting hero
- Tar Heel mascot
- daily quote
- top header or utility bar
- student-status banner
- task bar
- Today’s Focus
- roadmap/timeline
- North Star
- sidebar navigation
- sidebar collapse behavior
- Search Everything
- Archive
- settings

Some controls described below may be implemented in a different file or version than expected. Modify the actual implementation rather than creating duplicate controls.

---

## 1. Redesign the Overview information hierarchy

The Overview should prioritize:

1. what Andy needs to do now
2. what is happening soon
3. high-level premed progress
4. long-range application direction
5. optional inspiration and reference material

Use a responsive desktop grid that collapses cleanly on tablets and phones.

Recommended desktop structure:

1. compact utility/header area
2. greeting and daily guidance hero
3. primary task workspace
4. upcoming schedule and alerts
5. compact progress snapshot
6. visual premed roadmap
7. expandable North Star/reference content
8. lower-priority widgets such as ideas, goals, recent activity, and MCAT question

Do not simply retain every existing card in its current position.

---

## 2. Remove duplicate mascot usage

The mascot should not appear in three simultaneous locations.

### Sidebar branding

Replace the current ram emoji beside “Premed OS” with a small, polished **Premed OS application mark**.

Do not use another full mascot illustration here.

Create the mark with local HTML/CSS or an inline SVG so no external image dependency is required. Suitable visual direction:

- rounded Carolina-blue badge
- subtle medical or academic symbolism
- simple enough to remain legible at approximately 28–32 px
- visually distinct from the Tar Heel mascot

Examples of acceptable symbolism:

- an abstract shield and book
- a minimal medical cross combined with a graduation-cap line
- a stylized `PHQ` monogram

Do not use copyrighted UNC trademarks or an official UNC logo.

### Overview mascot

Use the mascot only once as the principal daily-guide character inside the greeting hero.

The mascot should:

- sit on or visually intersect the bottom edge of the greeting rectangle
- feel grounded rather than floating in the middle of the card
- remain visible without covering text
- use responsive positioning
- have a speech bubble whose tail clearly points toward the mascot’s mouth/head area
- never appear to originate from the grass, card border, or unrelated background element

Use a dedicated layout container rather than arbitrary negative margins.

The speech bubble should contain the rotating daily tip and source label currently shown in “Tar Heel Ram Tip.”

Remove the standalone “Tar Heel Ram Tip” card after integrating its content into the hero.

---

## 3. Redesign the greeting hero

Retain the current scenic/banner visual direction, but improve the composition.

The hero should contain:

- time-aware greeting, such as “Good morning, Andy”
- one concise supporting sentence
- the integrated mascot and daily tip
- the daily quote in a visually secondary treatment
- no redundant quote card elsewhere
- optional contextual quick action or two, but do not overload the hero

The quote can appear:

- beneath the greeting in a compact italic style, or
- in a small upper-left or lower-left quote region

It should not occupy an entire standalone card below the hero.

Increase visual alignment between the greeting, bubble, mascot, and banner artwork.

Avoid placing interactive pill buttons in a way that competes with the greeting.

---

## 4. Simplify the top utility area

Remove the standalone MCAT button from the global top utility area if one currently exists.

Reason: MCAT is already a full navigation destination and does not deserve arbitrary global prominence over academics, tasks, or other pillars.

Retain theme switching, but redesign it as an accessible toggle switch:

- clear light and dark states
- keyboard operable
- visible focus state
- `aria-label`
- persist the selected preference
- do not rely on color alone to convey state

Retain the student-status banner if it currently exists, but make it dismissible:

- include a visible `×` close control
- persist dismissal in localStorage/store state
- provide a reasonable way to restore it from Settings
- do not permanently delete the underlying content

---

## 5. Make tasks the primary Overview module

The task area is Andy’s highest-priority Overview function.

Replace the current thin task strip with a more intentional **Today / Tasks workspace**.

It should show:

- active tasks sorted by urgency
- due date or relative due label
- completion control
- a concise empty state
- a visible “Add task” control in the card header
- a link or button to open the full Timeline / Tasks page

### Add-task interaction

Use a compact button in the top-right corner of the Tasks card.

Clicking it should open the existing modal system:

- modal backdrop blurs or dims the application
- modal is keyboard accessible
- focus is moved into the dialog
- Escape closes it
- clicking the backdrop closes it
- include task name, date, category, notes, and status where supported
- save through the existing store methods

Reuse and improve the existing Quick Add logic rather than creating a second incompatible task-creation path.

---

## 6. Resolve redundancy between Task Bar and Today’s Focus

Do not present two visually equal to-do systems.

Combine them into one hierarchy:

- **Tasks** = actionable items with due dates and persistent workflow status
- **Today’s Focus** = a maximum of approximately three intentionally selected priorities for the current day

Today’s Focus should become a subsection or mode inside the main Tasks workspace, not a separate full-size competing card.

A suitable design:

- segmented tabs: `Today` and `All active`
- or a “Pinned for today” row above the regular task list
- focus items can be checked off
- a concise “Manage all tasks” route link remains visible

Preserve existing stored `focusTargets` and `tasks` data. Do not delete or silently merge records destructively.

---

## 7. Replace oversized stat boxes with a compact progress snapshot

The current large GPA, science GPA, clinical hours, and MCAT countdown boxes consume too much premium space.

Replace them with a denser **At a Glance** component.

It may use:

- a compact multi-column summary
- smaller metric chips
- mini progress bars
- sparklines where data exists
- icons and concise secondary labels

Recommended information:

- cumulative GPA
- science GPA
- clinical hours versus goal
- volunteering hours versus goal
- shadowing hours versus goal
- active courses or assignments due soon
- application-year or MCAT milestone

Do not fabricate data.

Every metric should link to its relevant page where useful:

- GPA → Academics
- clinical hours → Clinical
- service hours → Volunteering
- shadowing → Shadowing
- MCAT milestone → MCAT

Use semantic buttons or anchors and clear hover/focus states.

---

## 8. Redesign the roadmap as a visual timeline

Replace the existing AMCAS roadmap/list presentation with a genuine timeline.

Requirements:

- horizontal timeline on wide screens
- vertical timeline on narrow screens
- visible connecting line
- milestones represented as nodes
- current phase visibly distinguished
- completed, current, and future states
- concise date/timeframe labels
- expandable milestone details or a small supporting description
- clicking a relevant milestone can route to its associated dashboard page

Use existing timeline data and Andy’s personalized path:

- undergraduate foundation
- chemistry prerequisite sequence
- biochemistry completion
- MCAT preparation/testing
- application preparation
- primary submission
- secondaries/interviews
- matriculation

Do not hard-code completion states if they can be derived from dates or stored status.

---

## 9. Embed North Star within Overview

Remove North Star as an equal top-level sidebar route.

Do not delete its content.

Embed it within Overview as a lower-priority expandable resource module, such as:

- “Premed Roadmap & North Star”
- collapsed accordion by default
- summary text and current phase visible
- “Open full guide” expands the detailed content in place or opens a modal/drawer

Preserve:

- North Star introduction
- application systems
- master timeline
- mindset themes
- community resources
- official/community source distinctions

If backward compatibility is needed, visiting an old `northstar` route should redirect to Overview and automatically open or scroll to the embedded North Star section.

Increase the North Star heading size and contrast over any decorative background image. Ensure it remains readable in light and dark modes.

---

## 10. Redesign the sidebar Home destination

Make Overview/Home visually distinct from all ordinary pillar navigation items.

It should:

- appear at the top
- be slightly larger or use a separate home-card treatment
- clearly communicate that it returns to the main dashboard
- remain aligned with the rest of the sidebar
- not look like another subsection inside a group

Remove the redundant “Home” navigation group label if it no longer adds value.

North Star should no longer appear beside Overview.

Do not alter the logical grouping of the remaining Foundation, Experiences, Your Story, Application, and Profile destinations unless necessary for spacing.

---

## 11. Fix sidebar collapse behavior

There is a hover/collapse interaction problem where the expanded sidebar remains visually open until the pointer leaves the region.

Correct this so clicking the collapse control immediately applies the collapsed state.

Requirements:

- no dependency on a later `mouseleave`
- update layout immediately
- no visual ghost state
- focus remains predictable
- preserve keyboard support
- prevent layout jank
- test repeated expand/collapse actions

Use an explicit persisted or in-memory class/state rather than relying primarily on hover.

---

## 12. Move Archive under Settings

If an Archive destination or standalone archive navigation item exists:

- remove it from primary sidebar navigation
- add it as a subsection/tab inside Settings
- preserve all archived data and functionality
- provide filters and restore actions where already supported

If there is no actual Archive feature in the current source, do not invent one merely to satisfy this line. Document that it was not present.

---

## 13. Improve Search Everything organization

Enhance the existing Search Everything interface with result-type tabs:

- `All`
- `Dashboard`
- `Files`
- `External links`

Definitions:

- **Dashboard**: internal pages, records, modules, and routes within Premed OS
- **Files**: Google Drive documents, uploaded files, or previously accessed file references stored in the application
- **External links**: websites outside Premed OS

Requirements:

- show counts per tab if feasible
- keep the search query when switching tabs
- support keyboard navigation
- clearly distinguish internal navigation from external opening behavior
- open external links safely with `target="_blank"` and `rel="noopener"`
- include an appropriate empty state per tab

If the existing application does not yet store enough metadata to distinguish Files from External links, add a backward-compatible `kind` or inferred-category layer without breaking old records.

---

## 14. Reorganize lower-priority Overview widgets

Retain useful existing features, but demote them below primary actions:

- MCAT Question of the Day
- Ideas Capture
- Quarterly Goals
- Experience Gap Analysis
- Recent Activity

Use a balanced two-column or collapsible layout.

Do not allow the page to become excessively long or visually repetitive.

Consider:

- accordions
- compact cards
- progressive disclosure
- a customizable lower-widget grid

Do not remove user-entered data.

---

## 15. Personal description in sidebar/footer

Replace or expand the minimal “Neuroscience BS” identity line with a concise personalized descriptor.

Suggested content direction:

`UNC Neuroscience • Pre-Med • EMT`

or:

`Neuroscience B.S. • Pre-Med • Class of 2030`

Choose the version best supported by existing profile data. Do not hard-code uncertain facts if profile fields already exist.

Where possible, render this from `state.profile` with sensible fallbacks.

---

## 16. Information icons

Introduce a reusable subtle information control for explanatory UI copy.

Design:

- small gray circular `i`
- visible focus state
- tooltip on hover and keyboard focus
- click support on touch devices
- tooltip does not overflow the viewport
- accessible description through ARIA

Use it sparingly where an interface relationship needs explanation.

Do not place an info icon beside every obvious label.

This component will later be reused in Academics and School List.

---

## 17. Responsive and accessibility requirements

Test at minimum:

- desktop around 1440 px
- laptop around 1024 px
- tablet around 768 px
- mobile around 390 px

Ensure:

- no mascot overlap
- no speech-bubble clipping
- no horizontal page overflow
- timeline transforms correctly
- task modal fits mobile screens
- all icon-only controls have labels
- focus rings are visible
- contrast remains acceptable
- reduced-motion preferences are respected
- dialogs properly trap or manage focus if the existing modal system supports it

---

## 18. Data and migration requirements

Do not erase existing localStorage data.

Add defaults through non-destructive migration logic in `store.js`.

Possible additions may include:

- `_ui.studentBannerDismissed`
- `_ui.sidebarCollapsed`
- `_ui.northStarExpanded`
- `_ui.overviewTaskMode`
- theme preference if not already persisted

Use `||=` or explicit migration checks consistent with the current store implementation.

Do not reset seed data merely to expose new UI.

---

## 19. Explicitly out of scope for this pass

Do not yet implement:

- real Google Calendar API synchronization
- the `ncssmtime.com`-inspired live class countdown widget
- full Notion-style Academics database redesign
- course relation/select property system
- School List Notion-style database redesign
- external authentication changes
- backend infrastructure
- framework migration

Leave clean extension points for these features.

---

## 20. Acceptance criteria

The work is complete when:

1. Only one full mascot appears on Overview.
2. The mascot is grounded at the bottom of the hero.
3. The speech-bubble tail clearly points to the mascot.
4. The separate quote card is removed.
5. The daily quote remains visible in the hero.
6. The sidebar uses a non-mascot app icon.
7. The arbitrary top-level MCAT utility control is removed.
8. Theme switching is an accessible toggle.
9. The student banner can be dismissed and restored.
10. Tasks are the dominant action area on Overview.
11. Add Task opens a functional modal.
12. Today’s Focus is integrated into the task workspace.
13. Large stat cards are replaced by a compact snapshot.
14. The roadmap is visibly a timeline rather than a list.
15. North Star is embedded within Overview.
16. North Star is removed from normal sidebar navigation.
17. Overview is visually distinguished as the main home destination.
18. Sidebar collapse updates immediately on click.
19. Archive is under Settings if an Archive feature exists.
20. Search Everything supports the requested result categories.
21. Existing local data, JSON backups, and Drive backup remain functional.
22. No new console errors are introduced.
23. The Overview works on desktop and mobile.

---

## Required implementation report

After implementation, provide:

- a concise summary of changed files
- a list of UX decisions made
- any migration fields added
- any requested item not found in the current codebase
- manual testing steps
- known limitations
