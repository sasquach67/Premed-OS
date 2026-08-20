# T2 · Overview — the hero shows a fabricated day

**Stage:** D · BACKEND MISSING · **EXECUTED Aug 19, 2026** — the surface is built and its data is invented.

---

## 1. The finding

`HeroDailySchedule` renders **hard-coded events** as the student's day when
Google Calendar is not connected:

```
CHEM 101 Lecture · 9:00, Genome Sciences 100
Neuroscience Seminar · 11:00
Clinical Shift · 15:00
```

They are literal constants in [`schedule.ts:33`](../../../src/lib/schedule.ts),
and `seed.ts:716` enables the path by default (`useMockPreview: true`). The
student sees them labelled **"Class schedule"**, which implies they were
derived from their own classes.

**CHEM 101 is not one of Andy's courses.** Neither of us noticed while looking
straight at it in a screenshot, which is exactly why this matters: fabricated
data is hardest to catch when it looks plausible.

This is the same failure class as a fabricated citation, and it breaks the
stage-F rule outright: *"every surface renders from real records or a live
service. Nothing on the tab is on mock or placeholder data."*

## 2. The fix — derive the day from records that exist

`ClassWorkspace` already records `meetingDays`, `meetingTime` and `location`.
**Today's classes are computable from the student's own data**, so the honest
replacement is not an empty state but a real one.

Precedence, most-trustworthy first:

1. **Google Calendar cache** when fresh — a live service.
2. **Derived class schedule** from `meetingDays` / `meetingTime`, labelled as
   what it is: *from your class records*, not "your calendar".
3. **Nothing**, with a one-line reason. An empty day is a fact.

## 3. The work

1. `classScheduleEvents(workspaces, courses, date)` in `schedule.ts` — parse
   `MWF` and `Tue/Thu` forms and a `10:10–11:00 AM` range. **A workspace whose
   meeting pattern cannot be parsed contributes nothing**; it is never
   approximated to a plausible hour.
2. **Delete `createMockDailyEvents`.** Leaving a fabricator in the codebase
   invites its reuse; it exists for no other caller.
3. Stop reading `calendar.useMockPreview`, and remove its Settings toggle — a
   switch for a deleted behaviour is another dead control. The field stays on
   the type, marked deprecated, rather than forcing a migration to drop a
   boolean.
4. Tests: day parsing in both forms, unparseable patterns excluded, the right
   classes on the right weekday, and **no event invented when nothing matches**.

## 4. Do not break

- Never present derived data as calendar data. The label says which it is.
- No fabricated event, ever, under any flag.
- A day with no classes renders as an honest empty day.

## 5. Done when

- [x] `grep -rn "createMockDailyEvents" src/` returns nothing.
- [x] The hero shows real classes on their real days, or an honest empty state.
- [x] The Settings toggle for mock preview is gone.
- [x] Build passes; suite green.

## 5a. Two parser bugs the tests caught

Both would have put a class on a day nobody scheduled:

1. **`TTh` parsed as Thursday only.** A bare `T` is ambiguous, so two-letter
   tokens are now consumed first, and `R` is read as Thursday — the convention
   that exists precisely to remove that ambiguity.
2. **`TBD` parsed as Tuesday.** Compact parsing of arbitrary text produces
   false positives, so the whole string must now be day tokens; a partial match
   means it was not understood at all.

Demo meeting times were also staggered. The old rule gave every MWF course the
same 10:10 slot, so the hero triple-booked the student — believable demo data
matters on the one surface people judge the app's honesty by.

## 6. Commit

`fix(overview): derive the daily schedule from real class records`
