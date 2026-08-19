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
| Calendar review (Canvas → Google Calendar) | ✅ **CODE BUILT AND CONFIGURED** — `googleCalendar.ts` is complete and `VITE_GOOGLE_CLIENT_ID` is set in `.env.local`, read by `useBackup.ts:30` and `useCalendarSync.ts:22` | **Buildable. Not a checklist item.** |
| Source-selected study-guide generation | **CODE MISSING** — `study-tools/index.ts` has `sync-sources`, `delete-sources`, `gap-check` and **no generate action at all**. The whole generation engine is `specifications/generation/09` Phases 0–2, unbuilt | **Out of scope. Not built here.** |

**⚠️ CORRECTED Aug 19, 2026.** The first version of this brief claimed the
Google OAuth client was missing. **That was wrong.** It read
`googleClientId: ''` out of `demoSeed.ts` — a seeded demo default that
describes demo state and says nothing about Andy's own configuration. The real
client id has been in `.env.local` as `VITE_GOOGLE_CLIENT_ID` all along.

**Lesson for future audits: `.env.local`, `.env.example`, and the code paths
that read them are the evidence for step 1f — never a seed default.**

**ANDY CHECKLIST — one item, and it is unverifiable from this repo:**

1. **`ANTHROPIC_API_KEY` in Supabase Edge Function secrets**, plus a deployed
   `study-tools` function (`supabase/DEPLOY.md` §3–4). Secrets live in the
   Supabase dashboard, so **no audit run here can confirm or deny it** — this
   entry is a "please confirm", not a finding. It is needed by `gap-check`
   today. **It does not unblock the study-guide view on its own**, which also
   needs the generation engine written.

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
- [x] The calendar claim was corrected once `.env.local` was actually read.
- [x] Build passes; suite green.

## 5. Commit

`feat(academics): add the material catalog with visible provenance (§4.1)`

## 6. Next stage

Calendar review is now unblocked and buildable — it needs its own pass, not a
checklist. The study-guide
view returns after `specifications/generation` Phases 0–2 exist — a separate
workstream from this tab.
