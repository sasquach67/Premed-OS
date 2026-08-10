# Decisions — Calendar overlay

**Mockups (two, read both):**
- `00-shell/shell-calendar-overlay.html` — the views. Week (default) + Month.
- `00-shell/shell-calendar-sequence.html` — the **flow**, five steps as a user experiences it. **Read this one first** — it's what settles ownership vs reachability.

**Spec:** `specifications/00-product-shell.md` §7.9 · §11b (hour budget) · `tabs/01-academics.md` §6.9 (the don't-build-a-calendar rule this clarifies)
**Exact visual values:** `_shared/_visual-recipes.md` — used literally.

---

## Why this exists

A physical planner's signature artifact is the **week grid**, and HQ had no equivalent. Meeting times, deadlines, exams, and study sessions were all *stored* but never laid out against time. A student who expects a planner looks for that view and doesn't find it.

## The two decisions this settles

### 1. Ownership: Overview. Reachability: global top bar.

**Andy, July 2026:** *"I think it should lie in overview, the top bar there."*

Two separate questions, resolved separately:

- **Overview owns it.** The calendar spans every pillar — classes, MCAT sessions, clinical shifts, deadlines. Academics has no business owning a view that shows an EMT shift. Overview is the cross-pillar home. It appears there as a **week-strip panel** with `Open full calendar ›`.
- **The toggle is in the global top bar**, present on every screen. If reaching the calendar required navigating to Overview first, it stops being a glance and becomes a destination — which costs exactly the thing that made it worth building.

Same split already used for the shared hour budget (§11b): shell-owned, consumed everywhere.

**The two entry points are not redundant.** The Overview panel answers *"how is my week shaped"* while you're surveying. The toggle answers *"wait, when is that"* mid-task. Different questions, same data, one component.

### 2. Overlay, not a route.

Sequence steps 3 → 4b are the argument: the underlying page **stays visible behind the veil**, and `Esc` returns to the **exact same scroll position**. In the mockup you check your week from inside CHEM 261 and land back in CHEM 261.

---

## Locked

1. **Toggle in the global top bar** (lucide calendar icon) beside palette and bell. Keyboard shortcut. **Not a route, not a tab, not a sidebar item.**
2. **Opens as an overlay/sheet.** Underlying page remains visible. `Esc` dismisses and restores position.
3. **View switcher inside:** **Week** (default) · **Month** · **Agenda**. Persist last view.
4. **Overview carries a week-strip panel** — compact, seven cells, coloured bars per item kind, with `Open full calendar ›`.
5. **Shows:** class meeting times · assignment deadlines · exams · MCAT sessions, CARS blocks, **full-lengths and their reserved review blocks** (`02` §3.6) · imported calendar events.
6. **Deadlines sit in a separate rail above the time grid** — they're dates, not durations.
7. **HQ-owned vs imported must be visibly distinct.** Pillar accents for HQ items; **one muted, dashed treatment** for anything from Google Calendar. A student must be able to tell at a glance or the view stops being trustworthy.
8. **Week footer carries the shared hour budget** — *"22 of 34 planned hours"* (§11b) — surfacing without needing its own screen.
9. **Month is density-first:** coloured dots for item kind, small tags only for the few that matter (`Exam`, `FL3`, `W deadline`). **Not a wall of text at one-seventh width.**
10. **Compact by default.** Week fits a screen without scrolling at normal load.

## Read-mostly — what keeps this from becoming a scheduler

- **No event creation. No drag-to-reschedule. No in-place editing.**
- **Clicking an item deep-links to its owner** (sequence step 4a): an assignment opens in Assignments, an exam opens exam prep mode (`01` §4.1-R), a full-length opens the FL record in MCAT where rescheduling and logging live. **Editing happens where the thing lives.**
- **No new entity.** This is a projection over `Course` meeting times, `ClassAssignment`, `PlanSession`, `FullLength`, and imported events. **If a builder proposes a `CalendarEvent` table, that's the wrong turn** — it stops being a view and becomes a calendar.
- **Never writes to Google Calendar** beyond what `01` §6.9 already permits (HQ's own deadlines).
- **Works with no calendar connected** — shows HQ's own items and says imported events aren't connected.
- **Not a planning surface.** Term planning stays in the Planner (`01` §4.2); MCAT scheduling stays in the Plan tab.

> **Why this doesn't violate `01` §6.9:** that rule forbids HQ **owning** time — becoming the place you schedule your life. This overlay owns nothing; it renders. The distinction is **create vs display**, and it must stay on the display side.

## Do not

- Do not make it a tab, a route, or a sidebar item.
- Do not scope the toggle to Overview only — that was considered and rejected (it kills the mid-task glance).
- Do not add event creation, drag-to-reschedule, or inline editing.
- Do not introduce a `CalendarEvent` entity.
- Do not render HQ items and imported events with the same treatment.
- Do not let Month view become a text list.
