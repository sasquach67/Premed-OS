# T2 · Overview — local file-capture persistence

**Stage:** D · **BACKEND MISSING**
**Scope:** add the safe, device-local attachment model required by Overview
Quick Capture. This is a backend/data pass only. The disabled File control and
all Overview layout remain unchanged in this stage.

> **Gate:** Andy cleared `overview-capture-goals-states.html` as **YES** in
> `BUILD-MANIFEST.md` on Aug 17, 2026. This brief implements only that approved
> file-capture backend; it does not widen the capture surface.

---

## 1. Fidelity audit

### a. Spec → paper

Every ruled Overview feature has a reviewable paper surface. Nothing is
undrawn.

| Ruled feature | Paper source | Finding |
|---|---|---|
| Eight-block bento, Hero, tasks, standing, stat tiles, quick access, Capture, and roadmap | `mockup-lab/03-overview/overview-bento-control-panel.html` + `.md` | Present; its populated content is appearance-only. |
| Task detail/edit, empty, completed, and expanded states | `overview-task-states.html` + `.md` | Present. |
| Where I Stand expansion, Smart Actions empty/dismissed state, launchers, roadmap empty state | `overview-status-states.html` + `.md` | Present. |
| Quarterly goals, thought/link/file Capture paths, local widget loading/error/mobile states | `overview-capture-goals-states.html` + `.md` | Present. File capture is deliberately drawn as a compact third mode, not a new page. |
| Evidence-backed pace absence/collapsed/expanded states | `overview-projection-states.html` + `.md` | Present. |
| Optional milestone → separate implementation-task handoff | `overview-roadmap-task-linkage.html` + `.md` | Present and approved. |

The older bento's percentage treatment conflicts with `general.md` U-9. It is
not a missing requirement and must not be recreated.

### b. Mockup → app

| Mockup | Existing app surface | Fidelity finding |
|---|---|---|
| Bento control panel | `src/pages/Home.tsx` and `src/components/overview/*` | Built; eight ordered mixed-span blocks, with glass confined to Hero. |
| Task states | `OverviewTasks.tsx`, `/overview/tasks` | Built in `3abdb68`; one task system at widget and expanded sizes. |
| Status states | `OverviewStatus.tsx`, `SmartActionPanel.tsx`, `OverviewSupport.tsx`, `OverviewRoadmap.tsx` | Built in `3abdb68` plus follow-ups; targetless domains have no bar and empty Smart Actions unmount. |
| Capture and goal states | `OverviewSupport.tsx`, v13 goal migration | Thoughts and valid URLs persist to Story Bank. The File control is visibly disabled because there is no attachment persistence. |
| Projection states | `OverviewStatus.tsx`, dated-hour selectors | Built in `5358d39` and `36b512b`; pace is dormant without attributable dated evidence. |
| Roadmap task linkage | `OverviewRoadmap.tsx`, `OverviewTasks.tsx`, v16 migration | Built in `3bd691e`; the normal linked task remains distinct from its Timeline milestone. |

### c. Already built — do not rebuild

- `3abdb68` — Overview state coverage: Tasks, standing, goals, Capture,
  Smart Actions, Quick Access, and resilience states.
- `bec129c` — Timeline owns canonical milestone records.
- `5358d39` and `36b512b` — evidence-backed pace plus dated experience logs.
- `3bd691e` — one optional linked Overview implementation task per Timeline
  milestone.
- `src/components/overview/OverviewHero.tsx`,
  `src/components/common/HeroDailySchedule.tsx`,
  `src/components/layout/Sidebar.tsx`, and
  `src/components/layout/AppShell.tsx` are frozen approved work.

### d. Gate

`overview-capture-goals-states.html` now has its own **YES** row in
`BUILD-MANIFEST.md`, alongside the existing bento, target, standing, and
roadmap sources. The exact Capture state board is eligible to implement.

### e. Decisions files

All current Overview decision files record both behaviour and appearance.
`overview-capture-goals-states.md` specifically settles a compact solid
Capture field, adjacent thought/link/file affordances, a quiet privacy line,
and a short success confirmation. It does not authorize a file-card library,
an upload dashboard, glass, a progress meter, or Atlas as a live route.

### f. Integrations and services Overview owns

| Dependency | Classification | Student sees today | Closure |
|---|---|---|---|
| Google Calendar Hero | **CODE BUILT, NOT CONFIGURED for verified public OAuth** | A consented tester can connect the Primary calendar; public sign-in still shows Google's unverified-app treatment. No mock calendar events should appear. | Andy completes the Google/Supabase production OAuth checklist already recorded in `T2-overview-build-roadmap-linkage.md`. |
| Quick Capture thought and URL | **CODE BUILT AND CONFIGURED locally** | A thought or valid `http`/`https` link persists as a Story Bank record. | No work here. |
| Quick Capture file | **CODE MISSING** | The File control is disabled and honestly explains that the device lacks safe local attachment storage. | This backend brief. |
| Dated experience logs | **CODE BUILT AND CONFIGURED locally** | Only attributable dated logs feed the honest pace disclosure. | No work here. |

## 2. Why this lands at Stage D

Stage A passes: File is a real mode in the Capture board, with a button,
destination, privacy treatment, result treatment, and mobile placement.
Stage B passes: its companion document records both its behaviour and
appearance. Stage C passes for the translated Overview surface.

Stage D is the first failure: a ruled Capture path is knowingly nonfunctional.
`OverviewSupport.tsx` disables File because `StoryEntry` has no durable file
reference and the app has no general local-blob lifecycle. This brief supplies
that model only. It must not make the File control look available yet.

## 3. References

- `premed-hq-documentation/specifications/03-overview.md` §0, §5–§6.9, §9,
  §10, §11, and the later `SB-64` Capture amendment
- `premed-hq-documentation/tabs/09-essays-story-bank.md` §2 and §6–§6a,
  especially `SB-73` local-only handling
- `mockup-lab/03-overview/overview-capture-goals-states.html` + `.md`
- `premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md`
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`
- `premed-hq-documentation/implementation/component-inventory.md`
- `premed-hq-documentation/general.md` U-7, U-8, U-9, U-10, and the
  authenticated-user / direct-file-upload requirements
- `src/components/overview/OverviewSupport.tsx`
- `src/lib/types.ts` (`StoryEntry`, `CaptureRecord`, `AcademicFile`)
- `src/lib/academics/localSyllabusFiles.ts` — existing IndexedDB blob pattern
- `src/lib/dataIo.ts`, `src/store/store.ts`, and the migration test suite

## 4. BACKEND — one safe local attachment foundation

### 4.1 Shared local blob boundary

1. Extract the existing `idb-keyval` syllabus primitive into one shared local
   blob service. Preserve the current academic syllabus key exactly
   (`idb://academics/syllabus/<file-id>`); do not move, rename, or re-upload
   existing syllabus blobs.
2. The shared service owns `retain`, `read`, `exists`, and `remove` for a
   caller-provided namespaced `blobRef`. It stores the supplied browser `File`
   or `Blob` in IndexedDB, never in Zustand, localStorage, a data URL, a Vite
   variable, or an external service.
3. Add the Overview namespace only: `idb://overview/capture/<story-id>`.
   It may be used only for a student-supplied File selected for Quick Capture.
   It is not a generic file browser, a cross-tab media library, or an Atlas
   ingest path.
4. Keep the academic syllabus adapter as a thin caller of the shared service;
   this is an infrastructure extraction, not an Academics behaviour or UI
   change. Two IndexedDB wrappers doing the same job would be component
   drift.

### 4.2 Durable Story Bank attachment reference

1. Add one optional, typed `attachment` value to `StoryEntry`:
   `blobRef`, `fileName`, `mimeType`, `fileSize`, and
   `storage: 'device-local'`. It describes the file; the binary remains in
   IndexedDB. Do not create a second Capture collection or attach the binary
   to `CaptureRecord`.
2. A file capture creates one ordinary Story Bank record with `origin:
   'overview'`, `capturedAt`, and that attachment reference. It has no required
   title, prompt, tag, theme, experience link, score, status, or AI-derived
   interpretation. An optional student-written note remains commentary, not
   extraction.
3. `localOnly` keeps its existing per-entry meaning. An attachment's
   `storage: 'device-local'` is separate: its bytes never silently sync even
   when the entry metadata is eligible for a future sync. Do not imply that a
   JSON backup contains the binary.
4. Add an availability helper that returns the truth for a reference:
   available on this device, missing on this device, or no attachment. A
   restored metadata record whose blob is absent must be detectable; it must
   never yield a fake download or a broken object URL.
5. Supply one asynchronous domain service that accepts a selected File and
   creates the matching Story Bank record only after local retention succeeds.
   If creating the record fails after blob retention, remove the orphaned blob.
   If blob retention fails, leave `stories`, activity, and recovery state
   untouched. The next fidelity stage will connect the existing UI to this
   service.

### 4.3 Migration, backup, and recovery

1. Advance the persisted store version with a v17, lossless attachment-schema
   migration. It is additive: existing Story Bank records receive no invented
   attachment, `blobRef`, file metadata, privacy value, or content change.
   It must return a fresh structure only when necessary and be idempotent on
   frozen v16 input.
2. Keep attachment metadata in the ordinary Story Bank record so existing
   JSON export/import remains structurally valid. Keep the binary out of JSON
   export/import because it is device-local. Importing metadata alone must
   report `missing on this device` through the availability helper; it must not
   claim the file was restored.
3. Soft delete and restore preserve the attachment reference and retain its
   device-local bytes. Provide an explicit cleanup helper for a permanently
   discarded Story Bank record; it is safe to call repeatedly and never
   touches any other blob namespace. Do not delete bytes at soft-delete time.
4. Do not add cloud storage, Drive upload, AI file parsing, OCR, content
   indexing, a file-size/type policy, or a new remote permission. Those are
   separate product decisions and may not be invented to make this pass feel
   complete.

### 4.4 Tests and verification

Add focused tests for all of the following:

- shared blob operations retain/read/exists/remove a test File and preserve
  the existing academics syllabus key convention;
- file-capture service writes no Story Bank record when IndexedDB retention
  rejects, and cleans up a retained blob if record creation fails;
- a successful capture produces one Story Bank record with exact file metadata
  and an Overview-only device-local ref, never a blob/data URL in persisted
  state;
- v17 leaves every preexisting record byte-equivalent, does not invent an
  attachment, is safe for frozen input, and is a no-op when run twice;
- export/import retains metadata only and the availability helper correctly
  returns missing on a fresh device store;
- soft delete/restore retain the ref, and permanent-cleanup removes only that
  exact Overview blob and is idempotent;
- existing syllabus retain tests still pass unchanged;
- full suite and production build pass.

## 5. Do not break

- Do not edit `OverviewSupport.tsx`, `Home.tsx`, Hero, shell, CSS, lab files,
  or the disabled File affordance in this stage.
- Do not change thought or URL Capture, Story Bank record ownership, the Atlas
  reserved connection slot, quarterly goals, tasks, roadmap linkage, or pace.
- Do not put binary data into localStorage, app JSON backups, exports, demo
  seed data, or remote sync.
- Do not silently parse, summarize, classify, OCR, upload, or otherwise act
  on the student's file. The student supplied it; persistence is not consent
  to machine processing (U-10).
- No score, progress bar, readiness judgment, file queue, upload dashboard,
  or generic file-management UI.

## 6. Done when

- [ ] One shared IndexedDB blob service supports the existing syllabus store
  and Overview's separate capture namespace without changing old keys.
- [ ] A Story Bank record can truthfully describe a locally retained Quick
  Capture file, while its bytes never enter Zustand/localStorage/JSON.
- [ ] Missing-on-this-device is detectable and no read path can pretend a
  missing blob exists.
- [ ] Existing data, privacy semantics, soft-delete/restore behaviour, and
  syllabus storage remain lossless.
- [ ] The File control remains disabled; no unreviewed frontend is exposed.
- [ ] Full tests and the production build pass.

## 7. Commit

```text
feat(overview): add local file-capture persistence
```

Commit only the shared blob foundation, Story Bank attachment model, v17
migration, tests, and directly supporting documentation. Keep the dirty lab,
research, School List, and other tab work separate.

## 8. Next stage — not in this brief

After this backend pass and the manifest gate, rerun `TAB-BRIEF-PROMPT.md` for
Overview. It should next land at **E · FRONTEND MISSING**: wire the already
approved compact File mode to the new service, expose truthful retained/missing
states, and preserve the existing appearance. That later fidelity pass must
not add a file-management product.

Overview reaches Stage F only after that fidelity pass **and** Andy completes
the real Google Calendar public-OAuth configuration; console configuration is
not code for this brief.
