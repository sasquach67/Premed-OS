# T1 · Academics — Calendar review

**Stage:** C · DECIDED, NOT BUILT

**Scope:** The Materials-extensions **calendar review** view — the read-only
Canvas → Google Calendar handoff, and the proposed-difference review it makes
possible. The third view of that drawing (study-guide generation) stays
unbuilt; its engine still does not exist.

---

## 1. Fidelity audit

### a. Spec → paper

Pass. `academics-materials-extensions.html` draws `canvas` and
`feed-unavailable`; the `.md` records behaviour, appearance, and every state:
the handoff, a date conflict that must be reviewed, connected-but-empty, the
non-destructive disconnect, and the reconnect recovery.

### b. Mockup → app

**Missing.** Nothing in Academics reads `settings.calendar.cachedEvents`. The
Materials tab has the shelf (`8703804`) and the transcript import (`42a6f70`)
and no calendar surface at all.

### c. Already built — reuse, do not fork

- **`useCalendarSync()`** already owns connect / silent-reconnect / disconnect /
  fetch, resolves the client id from `VITE_GOOGLE_CLIENT_ID` → settings →
  backup, and writes `cachedEvents` with `lastSyncedAt` and `lastError`.
  **Write no second calendar client and no second connection state machine.**
- `NormalizedScheduleEvent` is the event shape: `{ id, title, start, end?,
  allDay?, location?, status? }`.
- `ClassAssignment.dueDate` is the record a calendar date is compared against.

### d. Gate

**Passes.** `01-academics/academics-materials-extensions.html` is **`YES`**.

### e. Decisions file

**Passes** — no variant open; the views are states.

### f. Integrations and services

**CODE BUILT AND CONFIGURED.** Corrected Aug 19 2026 in
`T1-academics-build-7.md`: `VITE_GOOGLE_CLIENT_ID` is present in `.env.local`
and read by `useBackup.ts:30` and `useCalendarSync.ts:22`. **No ANDY CHECKLIST
item.**

⚠️ **Canvas is never called.** Premed OS asks for no Canvas token and holds no
Canvas credential. Canvas publishes a personal calendar feed; the student
subscribes to it **in Google Calendar**; Premed OS reads Google. That
indirection is the feature, not a limitation, and nothing in this brief may
shorten it.

---

## 2. The work

### Backend — `src/lib/academics/calendarReview.ts` (new)

1. `matchEventToAssignment(event, assignments)` → the assignment a calendar
   event plausibly refers to, matched on **normalised title containment**, not
   fuzzy scoring. **No match is the common answer** and returns nothing.
2. `proposedDateChanges(events, assignments)` → one row per event whose date
   differs from its matched assignment's `dueDate`:
   `{ assignment, recordedDate, calendarDate, event }`.
   **A proposal, never an application** — this module has no writer.
3. `applyProposedDate(assignments, { assignmentId, date })` → the explicit
   accept, called only from a confirmed click. Writes `dueDate` and nothing
   else; **it never touches status, weight, points, or links.**
4. `feedState({ connected, events, lastError, lastSyncedAt })` →
   `'disconnected' | 'unavailable' | 'connected-empty' | 'connected'`.
   **`connected-empty` is an ordinary state, not an error** — a student whose
   calendar has no course dates yet is normal.
5. `calendarReview.test.ts` — a differing date proposes exactly one change; an
   identical date proposes none; an unmatched event proposes nothing; accepting
   changes only `dueDate`; `connected-empty` is distinguished from
   `unavailable`.

### Frontend — `src/components/academics/CalendarReview.tsx` (new)

6. A left-to-right handoff trail, per the decisions file: **Canvas → Google
   Calendar → your class record**, drawn as a sequence rather than three
   settings cards.
7. Each proposed difference states both dates plainly — *"Calendar says Thu
   Oct 24 · your record says Tue Oct 22"* — with **Accept** and **Keep mine**.
   Neither is styled as the recommended one.
8. `connected-empty` renders the ordinary line from the drawing: *"Connected,
   no course match yet. That is ordinary."*
9. `unavailable` is the reconnect recovery: **no date was changed**, the class
   record is intact, and the student can continue with the syllabus and manual
   records.
10. The disconnect consequence is stated where disconnect is offered: feed
    context stops, **no course date is removed**.
11. Mounted in the Materials tab under the shelf and transcript import.

---

## 3. Do not break

- **No Canvas token, no Canvas API call, ever.** Read-only Google.
- **No silent overwrite.** A date changes only on an explicit accept.
- A failed refresh or a disconnect never removes a confirmed course date.
- No U-9 sync-health score, streak, or "in sync" badge.
- Do not fork `useCalendarSync` or write a second connection state.
- Do not build the study-guide generation view.

## 4. Done when

- [ ] A differing calendar date surfaces as a reviewable proposal, not a change.
- [ ] Accepting writes only `dueDate`.
- [ ] Connected-but-empty reads as ordinary, distinct from unavailable.
- [ ] Disconnect and refresh failure leave every recorded date intact.
- [ ] Build passes; suite green; verified in the running app.

## 5. Commit

`feat(academics): add read-only calendar review with reviewable date proposals (§4.1)`

## 6. Next stage

Saved plans and the course catalog remain the two Planning gaps, both needing
a new entity and a decision before design.
