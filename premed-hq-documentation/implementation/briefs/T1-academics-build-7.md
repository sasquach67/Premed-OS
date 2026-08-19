# T1 · Academics — Materials extensions

**Stage:** C · DECIDED, NOT BUILT · **EXECUTED Aug 19, 2026 — catalog only**

**Scope:** The §4.1 Materials extensions. **One of its three views is
buildable today and two are not**, for different reasons recorded below. This
brief builds the Resource catalog and stops honestly at the other two.

---

## 1. Fidelity audit

### a. Spec → paper

**Pass.** `academics-materials-extensions.html` draws three views — Resource
catalog, Calendar review, Source-selected generation — plus their unavailable
and empty states.

### b. Mockup → app

**Missing.** The Materials tab renders `FileRow` lists with no unit shelf, no
provenance badge, and no catalog treatment.

### c. Already built — do not rebuild

- `AcademicFile` already carries `owner: 'course' | 'mine' | 'generated'` and
  `linkedTopicIds`. **Provenance is a field that exists**, not a new model.
- `ResourceGrid`, `ThreeLevelNav`, `CenterPeek`, and the Materials tab are the
  owners. No new card or grid family.
- `googleCalendar.ts` already implements connect / disconnect / fetch. Do not
  write a second calendar client.
- The `Summarize` button in `FileRow` is a stub that toasts; **leave it stubbed**
  until the generator exists (see §2).

### d. Gate

**Passes.** `BUILD-MANIFEST.md` carries the mockup as **`YES`**.

### e. Decisions file

**Passes.** Behaviour, appearance, component translation, and states recorded;
no variant left open.

### f. ⭐ Integrations and services — **the blocking section for this brief**

| Dependency | Classification | Consequence |
|---|---|---|
| Resource catalog | **No service.** Local `AcademicFile` records only | **Built in this brief.** |
| Calendar review (Canvas → Google Calendar) | **CODE BUILT, NOT CONFIGURED** — `googleCalendar.ts` is complete; `settings.backup.googleClientId` is empty and no OAuth client exists | **ANDY CHECKLIST. Not a brief item.** |
| Source-selected study-guide generation | **CODE MISSING** — `study-tools/index.ts` has `sync-sources`, `delete-sources`, `gap-check` and **no generate action at all**. The whole generation engine is `specifications/generation/09` Phases 0–2, unbuilt | **Out of scope. Not built here.** |

**⚠️ ANDY CHECKLIST — the first this tab has produced.** Both items need
account access nobody but Andy has:

1. **Google Calendar OAuth client** — create an OAuth 2.0 Web client in Google
   Cloud Console, add the app origin to Authorized JavaScript origins, enable
   the Calendar API, and paste the client id into Settings → Backup. Until then
   `isCalendarConnected()` is false and the Calendar review view has nothing to
   render. **What the student sees today: no calendar context at all.** What
   they see once configured: their own Canvas feed dates, read-only.
2. **`ANTHROPIC_API_KEY` in Supabase secrets**, plus deploying the
   `study-tools` edge function. Needed by `gap-check` today and by every
   generator later. **This does not unblock the study-guide view on its own** —
   that view also needs the generation engine written.

**Why the generation view is not built as a shell:** advertising a `Generate`
button that cannot generate is the mistake `studyMethod.ts` refused to make
with engineless cycle steps. A step the app cannot perform is not offered.

---

## 2. The work — Resource catalog only

### Backend — `src/lib/academics/materialCatalog.ts` (new)

1. `catalogUnits(files, topics)` → unit spine rows `{ unit, count }`, ordered
   by the class's own topic order, with an `Unfiled` row last **only when
   something is actually unfiled**.
2. `catalogEntries(files, topics, unit)` → the selected unit's materials with
   resolved provenance.
3. `provenanceOf(file)` → `'course' | 'mine' | 'generated' | 'unknown'`.
   **`unknown` is a real state**: a file with no recorded owner is private and
   labelled as such, never quietly assumed to be course material.
4. `materialCatalog.test.ts` — unit grouping, the unfiled row appearing only
   when earned, and `unknown` never collapsing into `course`.

### Frontend — `src/components/academics/MaterialCatalog.tsx` (new)

5. Three-column shelf: unit spine at left, compact material tiles at centre,
   one restrained empty rail at right. Hierarchy is unit → material →
   provenance, so a source badge is visible without turning every item into a
   long row.
6. Provenance badges: `Instructor-provided` / `Mine` / `Generated` /
   **`Unknown origin · private`** in a warning tone.
7. Empty state: one friendly line and the add path — never a blank void.
8. Mounted inside the existing Materials tab, above the current file list.
   The Materials tab does not become a sixth class tab.

---

## 3. Do not break

- No sixth class tab. No second card or grid family.
- No Canvas token, no Canvas write, ever. Calendar context stays read-only.
- No generation UI until the generator exists.
- A file's recorded owner is never inferred from its filename or type.
- U-9: no completion meter over "materials filed".

## 4. Done when

- [x] The catalog renders from real `AcademicFile` records, grouped by unit.
- [x] Unknown-origin material is visibly private and never labelled as course
      material.
- [x] No calendar or generation UI ships in this pass.
- [x] The ANDY CHECKLIST above is recorded, not silently skipped.
- [x] Build passes; suite green.

## 5. Commit

`feat(academics): add the material catalog with visible provenance (§4.1)`

## 6. Next stage

Calendar review returns when Andy completes checklist item 1. The study-guide
view returns after `specifications/generation` Phases 0–2 exist — a separate
workstream from this tab.
