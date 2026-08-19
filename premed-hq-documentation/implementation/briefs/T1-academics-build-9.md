# T1 · Academics — Term rollover

**Stage:** C · DECIDED, NOT BUILT

**Scope:** The §4.1 end-of-term transition — its three views (`ritual`,
`paused`, `january`) and the records they write. Frontend and backend.

---

## 1. Fidelity audit

### a–c. Paper, app, already built

- Drawn and decided: `academics-term-rollover.html` + `.md`. No variant open —
  the three views are states of one flow.
- Nothing in `src/` references rollover; `grep -rln "rollover" src/` is empty.
- **Do not rebuild:** `Course.status` already carries `completed`, the Grades &
  archive tab already holds archived courses, and `Topic.fsrs` already holds
  study state. Carrying a topic must **preserve that state untouched** — this
  flow changes where a topic is offered, never what it knows.

### d. Gate

Passes — manifest carries the mockup as **`YES`**.

### e. Decisions file

Passes — behaviour, appearance, component translation, and the three views.

### f. Integrations and services

**None.** Entirely local. **No ANDY CHECKLIST items.** This is why it was taken
ahead of lecture capture, which is service-blocked (`T1-academics-build-8.md`).

---

## 2. The records

Additive and optional, so old data reads unchanged:

1. `Topic.termFate?: 'retired' | 'mcat' | 'prerequisite'` — where a completed
   course's topic goes next. **Absent means undecided**, which is what makes
   the January re-offer possible.
2. `Course.rolloverAt?: number` and `Course.rolloverDismissedTerm?: string` —
   when the ritual was completed, and the one term its re-offer was dismissed
   for. **Dismissal is per-term, never permanent** — but it is also never
   re-asked within that term.

---

## 3. The work

### Backend — `src/lib/academics/termRollover.ts` (new)

1. `pendingRollovers(courses, now)` → completed courses with no `rolloverAt`,
   excluding any dismissed for the current term.
2. `defaultFate(topic, course, plannedCourses)` → the pre-sorted default:
   - a topic whose title/unit matches a planned course's prerequisite need →
     `prerequisite`, naming the course it supports;
   - a topic with recorded review history worth carrying → `mcat`;
   - otherwise → `retired`.
   **Defaults are proposals.** Nothing is applied until the student confirms,
   and every fate is reversible afterwards.
3. `applyFates(state, { courseId, fates })` → writes `termFate` and
   `rolloverAt`. **Asserts study state is untouched**: no `fsrs` field, no
   `ReviewEvent`, and no topic is deleted. Retiring stops scheduling; it does
   not erase.
4. `pauseEverything(state, courseId)` → every topic `retired`, ritual complete,
   fully reversible later.
5. `dismissUntilNextTerm(state, courseId, term)` → records the one re-offer
   dismissal.
6. `termRollover.test.ts` — defaults sort correctly, carrying preserves FSRS
   exactly, retiring deletes nothing, pause is reversible, and a dismissed
   course does not reappear in the same term.

### Frontend — `src/components/academics/TermRollover.tsx` (new)

7. A transition map, not three equal columns: completed course at the origin, a
   connector expressing the irreversible ledger archive, three narrow fate
   paths receiving topics, each with its own small directional mark.
8. Per-fate bulk action, a spacious non-celebratory `Pause everything`, and the
   archive promise as a thin boundary note beneath the flow.
9. The January re-offer is a small calendar reminder — **not a modal wizard**,
   and it asks exactly once per term.
10. Mounted in Planning, appearing only when a rollover is pending.

---

## 4. Do not break

- **Nothing is deleted, ever.** Retiring stops scheduling and keeps the topic
  searchable.
- Carried topics keep their existing FSRS state exactly; no list is reset.
- The course ledger archives regardless of any topic choice.
- One re-offer per term, then silence. No modal, no wizard, no celebration.
- U-9: no completion meter over "topics sorted".
- Every choice is reversible afterwards.

## 5. Done when

- [ ] The ritual renders only for a completed, un-rolled course.
- [ ] Defaults are pre-sorted and every one is editable.
- [ ] Carrying preserves FSRS byte-for-byte; retiring deletes nothing.
- [ ] Pause everything is one action and is reversible.
- [ ] A dismissed course does not re-offer within the same term.
- [ ] Build passes; suite green.

## 6. Commit

`feat(academics): add the end-of-term rollover ritual (§4.1)`

## 7. Next stage

Planning decisions and planning cold start remain decided-not-built. Lecture
capture stays blocked pending Andy's transcription decision.
