# T2 · Overview — File Capture fidelity

**Stage:** E · **FRONTEND MISSING**  

> **VERIFIED EXECUTED Aug 19, 2026 — tested in the running app, not inferred
> from the code.** Quick Capture offers Thought · Link · File; selecting File
> reveals the input, a chosen file's name is shown, and submitting reports
> "Saved file to Story Bank."
**Scope:** translate the approved Quick Capture File mode into the existing
Overview widget, using the completed device-local attachment service. This is
a fidelity pass only: it must not alter the attachment model, migration,
storage policy, Hero, calendar, Story Bank ownership, or the page layout.

> **Gate:** `03-overview/overview-capture-goals-states.html` is **YES** in
> `implementation/briefs/BUILD-MANIFEST.md` (cleared Aug 17, 2026 by Andy).
> The manifest permits this approved File state and no new Capture surface.

---

## 1. Fidelity audit

### a. Spec → paper

All ruled Overview features have a paper surface. The approved Capture board
draws one compact control with Thought, Link, and File input paths, a
per-entry **Keep local; never sync** choice, a short success confirmation, and
an inert Atlas connection slot. Its companion document records both the
interaction and the appearance.

`03-overview.md`'s older §6.9 Atlas wording is superseded for v1 Capture by
the later `SB-64` amendment and the approved board: Capture lands in **Story
Bank**. Atlas is a reserved connection slot, never a live destination or a
second save path.

### b. Mockup → app

| Approved source | App surface | Finding |
|---|---|---|
| `overview-capture-goals-states.html` + `.md` | `src/components/overview/OverviewSupport.tsx` → `ActivityAndCapture` | Thought and valid-Link capture match the compact existing widget and persist to Story Bank. File is still a disabled tab/button with the obsolete explanation that safe local storage does not exist. |
| Same board | `src/lib/overviewFileCapture.ts`, `src/lib/localBlobStore.ts`, `src/store/store.ts` | Backend now exists: `createOverviewFileCapture` retains student-supplied bytes in IndexedDB and creates exactly one Story Bank record with device-local attachment metadata. |

### c. Already built — do not rebuild

- `3abdb68` — translated the approved Overview bento, tasks, standing, goals,
  thought/URL Capture, and resilience states.
- `8e06a39` — completed the shared local-blob service, Story Bank attachment
  reference, v17 migration, lifecycle cleanup, and `createOverviewFileCapture`.
- `3bd691e`, `5358d39`, `36b512b`, and `bec129c` — roadmap ownership,
  honest pace, dated logs, and Timeline milestones; none are Capture work.
- `OverviewHero.tsx`, `HeroDailySchedule.tsx`, `Sidebar.tsx`, and
  `AppShell.tsx` remain frozen approved work.

### d. Gate

The only source governing this pass is explicitly **YES**. No shell, Calendar,
Atlas, or undisplayed mockup source is being smuggled into the scope.

### e. Decisions files

`mockup-lab/03-overview/overview-capture-goals-states.md` is decision-complete:
solid compact field; small adjacent Thought/Link/File affordances; quiet
privacy line; short green-accent confirmation; no upload library; no glass;
no inbox; and no live Atlas route. No decisions-stage work remains.

### f. Integrations and services Overview owns

| Dependency | Classification | Student sees today | Closure |
|---|---|---|---|
| Quick Capture thought and URL | CODE BUILT AND CONFIGURED locally | An untyped thought or valid `http`/`https` link becomes a Story Bank record. | No work in this brief. |
| Quick Capture File | **CODE BUILT, UI NOT WIRED** | The File control is disabled even though safe device-local storage now exists. | This fidelity brief. |
| Google Calendar Hero | CODE BUILT, NOT CONFIGURED for public OAuth | Calendar connection remains subject to Andy's Google/Supabase configuration and Google verification. | Andy checklist only; do not change it here. |

## 2. Why this lands at Stage E

Stage A passes: File Capture is drawn and reviewable. Stage B passes: its
decisions file records behaviour and appearance. Stage C passes for the
existing Overview widget. Stage D passes because commit `8e06a39` supplied the
safe attachment model, persistence, migration, cleanup, and focused tests.

**Stage E is the first failure:** the screen has not been translated to call
that service. The only File affordance is disabled and still says storage is
missing. This brief makes the approved UI truthful; it does not modify the
already-working data layer.

## 3. References

- `premed-hq-documentation/specifications/03-overview.md` §5–§6.9, §9–§11,
  and the later `SB-64` Capture amendment
- `premed-hq-documentation/tabs/09-essays-story-bank.md` §2 and §6–§6a,
  including `SB-64` through `SB-73`
- `mockup-lab/03-overview/overview-capture-goals-states.html` + `.md`
- `mockup-lab/_shared/_visual-recipes.md`
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`
- `premed-hq-documentation/implementation/component-inventory.md`
- `premed-hq-documentation/general.md` U-7 through U-10
- `src/components/overview/OverviewSupport.tsx`
- `src/lib/overviewFileCapture.ts`, `src/lib/localBlobStore.ts`, and
  `src/store/store.ts`

## 4. FIDELITY — wire the approved File mode

### 4.1 Keep one compact Capture widget

1. Change the existing three-way Capture control from `thought | link` to
   `thought | link | file`. File remains a peer affordance beside Thought and
   Link. Do not create a new route, dialog, page, file library, upload queue,
   drag-and-drop canvas, or a second Capture list.
2. Selecting File reveals only a native file chooser and an optional compact
   note field. The File tab itself must be keyboard reachable and visibly
   selected using the same quiet selected treatment as Thought and Link.
3. After a file is selected, show its **name** and a human-readable size before
   Capture is enabled. This is confirmation of the student-selected file, not
   an analysis, preview, OCR result, type badge collection, or upload progress
   meter. A clear/remove control restores the chooser state before submission.
4. Preserve the existing `Keep local; never sync` checkbox and make its
   meaning apply to File captures too. Keep the quiet explanation immediately
   below the control: attachment bytes are stored on this device and are not
   included in JSON backup/restore. Do not claim a cloud file was uploaded or
   synced.
5. Keep the approved Story Bank badge, current compact solid card geometry,
   existing spacing, card hierarchy, mobile normal-flow placement, keyboard
   focus order, and reduced-motion behaviour. Do not introduce glass, a new
   icon system, a different font, a glowing CTA, or a full-page state.

### 4.2 Use the existing service exactly once

1. On Capture in File mode, call the existing
   `useStore.getState().createOverviewFileCapture(file, { commentary,
   localOnly })`. Do not recreate IndexedDB calls, blob keys, attachment
   metadata, an attachment collection, or a second Story Bank record in the
   component.
2. Await the result. A returned ID is the only success signal. Clear the chosen
   file, note, local-only choice, and any prior error only after that success.
3. If it returns `null`, retain the selected File and optional note in component
   state, show the same restrained destructive left-rule error used by the
   existing link path, and provide a Retry that returns focus to the chooser or
   Capture action. Do not claim the file saved, add a fake activity row, or
   leave a partial Story Bank record.
4. The existing short success treatment becomes type-aware:
   **“Saved to Story Bank.”** for thought/link and **“Saved file to Story
   Bank.”** for File, with the existing `Open it` link. It is a short success
   confirmation, not an inbox, alert, toast-only confirmation, or upload log.
5. Preserve the inert text-only Atlas reserved connection slot. It must not
   become clickable, navigate, create data, or name a live Atlas destination.

### 4.3 Truthful local-file states

1. The File input must accept only an explicit student selection; no dropped,
   pasted, inferred, URL-fetched, generated, AI-parsed, OCR'd, indexed, or
   automatically classified file enters the service.
2. Make the device-local limit visible once in the File mode and once after a
   successful save if space permits: the metadata may travel in a future
   backup, but the bytes remain on this device. Do not add a repeated warning
   to the Thought/Link modes.
3. Do not add a binary reader, download button, file preview, or Story Bank
   attachment viewer in this pass. `storyAttachmentAvailability()` is already
   available for the eventual Story Bank surface, but that surface is outside
   this Overview-only fidelity scope.
4. Keep Capture deletion behaviour intact. Existing activity rows associated
   with thought/link remain as-is; do not invent a matching file activity row
   merely to fill the list. If the app already creates one through an approved
   generic activity path, it may use it, but File must not ship fabricated
   recent activity.

## 5. Tests and visual verification

Add focused UI-level coverage appropriate to the existing test stack:

- selecting File makes the chooser reachable, while Thought and Link retain
  their current inputs and validation;
- a selected file name/size appears, removal returns the control to its empty
  File state, and Capture is disabled until a file exists;
- submitting calls `createOverviewFileCapture` once with the exact File,
  trimmed optional note, and `localOnly` value;
- success clears File-mode draft state and exposes the short file-specific
  Story Bank confirmation;
- a `null` result keeps the selected File in place, shows a retryable error,
  and creates no optimistic success state;
- keyboard-only use reaches File, chooser trigger, local-only control, and
  Capture in order; reduced-motion does not add a new animation requirement;
- production build and the full test suite pass.

Visually check desktop and mobile against the approved Capture state board:
File is a compact peer input path inside the current Overview bento. It must
not expand the widget into a document-management surface or disrupt adjacent
Quarterly Goals / Recent Activity geometry.

## 6. Do not break

- Do not edit `src/lib/overviewFileCapture.ts`, `src/lib/localBlobStore.ts`,
  the v17 migration, store attachment lifecycle, or Academics syllabus storage
  unless a direct wiring defect makes it strictly necessary; this is a
  frontend-fidelity pass.
- Do not change thought/link Capture validation, `StoryEntry` ownership,
  Story Bank routing, the local-only meaning, tasks, goals, pace, roadmap, or
  Smart Actions.
- Do not create an Atlas route, a cloud bucket, Drive integration, AI file
  processing, automatic metadata extraction, file screening policy, or a
  generic media manager.
- Do not use a score, rank, readiness language, progress bar, streak, queue,
  or fabricated sample file/activity data (U-7, U-9, U-10).
- Do not touch frozen Hero/shell files or Calendar OAuth code/configuration.

## 7. Done when

- [ ] The former disabled File control is a keyboard-accessible third Capture
  mode in the existing widget.
- [ ] It calls only `createOverviewFileCapture`; a repository search confirms
  no duplicate Overview IndexedDB/attachment persistence path was added.
- [ ] Success is shown only after the service returns an ID; failed retention
  remains retryable and preserves the selected file.
- [ ] The UI states local-only storage truthfully and never claims binary
  backup, sync, upload, file analysis, or live Atlas routing.
- [ ] The component retains the approved compact solid visual treatment,
  responsive placement, and accessible focus/error/success behaviour.
- [ ] Focused tests, the full suite, and the production build pass.

## 8. Commit

```text
feat(overview): wire local file capture to Story Bank
```

Commit only the Capture-widget fidelity change and directly supporting tests.
Keep the dirty mockup-lab, School List, research, and other tab work separate.

## 9. Next stage — not in this brief

After this pass, rerun `TAB-BRIEF-PROMPT.md` for Overview. No further Capture
code should be necessary. Overview still cannot reach Stage F until Andy
finishes Google Calendar's Google Cloud + Supabase public OAuth configuration
and verifies real events load. That is an account-access checklist, not a code
task and not permission to add another integration in this brief.
