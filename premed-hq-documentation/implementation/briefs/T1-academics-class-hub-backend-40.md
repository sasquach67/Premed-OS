# T1 · Academics — Class Hub watched-notes intake foundation

**Stage:** D · BACKEND MISSING

**Scope:** Build the persisted, local-first foundation that lets a class turn a
student-selected GoodNotes/Drive/Dropbox-style backup folder into reviewed
material-placement proposals. This is a data and interaction pass only: it
must not restyle the existing Class Hub, change its banner, or add a new top
level tab.

## 1. Step-1 audit

### A. Spec → paper

**Pass.** Every ruled Class Hub surface now has a drawing:

- `academics-class-hub.html` covers the five-tab shell, shared banner,
  Materials/Topics/Assignments/Notes grouping, ownership marks, priming, and
  the class-specific review loop (`tabs/01-academics.md` §4.1-I);
- `academics-materials-extensions.html` covers folder intake, placement review,
  watched-note mapping, mapping exceptions, source cataloging, and source
  selection; and
- the related syllabus-import, topic-linking, study-method, forgetting-curve,
  lecture-capture, and exam-prep drawings cover their contextual destinations.

There is no remaining Class Hub feature that needs a first drawing. Stage A
passes.

### B. Mockup → app

`src/components/academics/ClassHub.tsx` owns the live deep-linkable class
page. It has the approved class-type shell, class-specific data grouping,
Materials, Topics/Readings, Assignments, Notes, the review entry point, and
the source-selected generation flows. `MaterialCatalog.tsx` gives existing
files an honest provenance shelf.

The **watched-note** part is not translated: a course can store only a
`goodNotesUrl` / `driveFolderUrl` link. There is no watched-folder mapping,
no file placement proposal, no `confirm week` recovery, no review-each-import
setting, and no persisted import history. Grep finds no folder/directory/watch
implementation in the Academics components or libraries.

One required visual measurement was made on the populated PHYS 118 Class Hub;
this is evidence only, not authorization to touch the visual layer in this
backend pass.

| surface | mockup value | running app value |
| --- | --- | --- |
| page field, dark | `#211e1a` | `rgb(33, 30, 26)` |
| banner art | `#233448 → #2c3a4a → #3a3730` | `rgb(35, 52, 72) → rgb(44, 58, 74) → rgb(58, 55, 48)` |
| banner stat strip | `rgba(20, 26, 34, .50)`, 13px | `rgba(20, 26, 34, .62)`, 13px |
| page field, light | `#f7efe1` | `rgb(247, 239, 225)` |

The art ladder and geometry match. The stat strip opacity differs, so a later
E fidelity brief must resolve it; it is explicitly out of scope here.

### C. Already built — preserve, do not rebuild

- `27ddd73` — Class Hub record hierarchy;
- `4671c42` and `8a2a0f6` — contextual Materials intake and grouped study
  material actions;
- `997fd0a` and `c2b6f53` — Writing-specific class tools;
- `4f734e4` — local lecture capture/evidence index;
- `326a17a` — browser `.apkg` export; and
- `4fe210f` — prior Academics control sweep.

Do not replace the existing Materials source picker, AI generation routes,
lecture capture, or the Google Drive *backup* facility. The latter writes a
single private `appDataFolder` backup and is not a course-material reader.

### D. Manifest gate

`BUILD-MANIFEST.md` marks both
`01-academics/academics-class-hub.html` and
`01-academics/academics-materials-extensions.html` **YES**. This backend work
is cleared. It does not clear Canvas REST Path B, which the spec forbids until
Calendar Path A proves insufficient.

### E. Decisions files

**Pass.** `academics-class-hub.md` records both hierarchy and appearance:
one shared banner, five tabs, solid bodies, and glass only on the stat strip.
The Materials extensions decision record encodes the folder intake/review and
watched-note recovery states. No variant decision is open for this pass.

### F. Integrations and services owned by this surface

| dependency | state today | classification |
| --- | --- | --- |
| Google Drive backup | private app-data backup code and a local client-id value exist | **built, but not the required capability** — it cannot enumerate or read a GoodNotes backup folder |
| GoodNotes/Dropbox/OneDrive backup folders | link fields only | **code missing** — no provider adapter, folder selection, mapping, proposal store, or import flow |
| Calendar Path A | separate Calendar review code is present; it is not needed for watched-note intake | **outside this brief** — keep its existing review-before-apply boundary |
| Canvas REST Path B | no course-sync proxy is in scope | **do not build** — §4.1-O says Path B waits until Calendar Path A is proven insufficient |
| AnkiConnect | `.apkg`/TSV export works; no local bridge is needed for materials | **optional and deferred** — no sync chip or scheduler ownership is allowed |

The app today can let a student upload/select material manually. After this
pass it can also remember and review one-way backup-folder placement proposals.
It **cannot** silently poll a remote cloud folder until the provider-specific
OAuth scope and callback configuration is supplied by Andy.

## 2. Why this lands at Stage D

Stages A–C pass: paper exists, the visual decision exists, the manifest clears
it, and the live Class Hub has substantial persisted behavior. A ruled data
path has no implementation, though: the app cannot turn a backup folder into
an explicit, reviewable course-material import. That fails the data/behavior
test for Stage D before any fidelity adjustment is allowed.

## 3. Work — safe watched-note intake foundation only

### 3.1 Add durable proposal entities and a pure mapping engine

Add a narrow Academics data model for a user-selected note-backup source and
its proposed files. It must be independent of cloud-provider credentials:

- a source records provider label, user-visible root label, selected-at time,
  course association, `reviewEachImport`, and confirmed path-level mappings;
- a proposal records the external display path/name, optional modified time,
  proposed course/week/category, confidence/reason, and status
  `pending | accepted | skipped`;
- do **not** persist a raw OAuth token, a filesystem handle, local machine
  path, or a file's full content in the Zustand store; and
- treat a filename/path as untrusted input: no HTML rendering and no automatic
  link navigation.

Implement a pure, tested mapper:

- exact enrolled-course names/codes can propose a course;
- `Week 3`, `Wk 3`, and `W3` can propose a week;
- `Notes`, `Homework`, and `Practice problems` can propose a category;
- unrecognised levels must produce `needs-confirmation`, never an invented
  week; and
- a previously confirmed mapping is reusable only for the exact same logical
  level. A new/unclear level asks again.

### 3.2 Add review-before-apply and material conversion actions

Build the store actions and controller seam used by the existing Materials
surface:

1. intake accepts a caller-supplied file manifest (display name, relative
   logical path, type, optional modified time), creates proposals, and changes
   no class material;
2. accepting a proposal creates an `AcademicFile` owned by the selected course,
   carrying the appropriate source/provenance and `confirm week` state if a
   student deliberately accepts an unresolved placement;
3. skipping preserves the proposal/history and never deletes an existing
   material record;
4. rerunning intake matches stable source identity (provider/source + logical
   display path + content/modified identity when available), so an inserted
   folder level cannot duplicate every later file; and
5. no proposal can overwrite a student-edited material title, unit, topic link,
   or provenance. Changed source metadata remains a proposal.

The existing folder-intake, folder-review, watched-notes, and mapping-exception
mock states are the intended frontend clients. Do not add their UI in this
backend pass.

### 3.3 Provide a local, opt-in discovery adapter — no remote sync yet

Add a browser-safe interface that lets a Materials caller obtain a manifest
from a user-chosen local folder only when the browser supports it. It should:

- return a capability/dormant reason where folder selection is unavailable;
- require a fresh user gesture for folder access;
- read filenames and metadata only at this stage, not silently upload every
  PDF; and
- be one-way and review-first. No writes back to GoodNotes, Drive, Dropbox,
  OneDrive, Canvas, or the local folder.

Do not claim this is a background watcher. Static GitHub Pages cannot keep a
remote provider watch alive while closed. The UI must call it a selected-folder
import until the provider integration below is configured.

### 3.4 Tests and migration

- Add migration coverage for old stores: new arrays/settings default empty and
  all existing Academics records survive byte-for-byte.
- Test exact course/week/category detection, each ambiguous/unmatched case,
  confirmed-mapping reuse, and new-level re-prompting.
- Test accept/skip/rerun with stable identities; prove a changed source does
  not overwrite a student-edited `AcademicFile`.
- Test personal empty state: no demo folder, course, proposal, or imported
  material appears.
- Test local-folder unsupported state has an explicit reason and creates no
  partial record.

### 3.5 Andy checklist — required before remote automatic sync

Do **not** wait on this checklist to complete 3.1–3.4. It is required only for
a later provider adapter that reads remote folders.

1. In Google Cloud, enable **Google Drive API** for Premed OS and add the
   minimal read scope required to list/download selected files (likely
   `https://www.googleapis.com/auth/drive.readonly`).
2. Update the OAuth consent screen’s scope declaration, test users, production
   authorized JavaScript origins, and redirect URLs for `premedos.app` and any
   retained local development origin.
3. In Supabase, keep tokens server-side only; add an encrypted per-user token
   storage and an Edge Function boundary. Never put a provider token in
   `VITE_*`, Zustand, browser storage, or GitHub Pages.
4. If Dropbox or OneDrive support is wanted, create separate developer apps
   and complete their provider approval/configuration. Do not reuse Google
   credentials or pretend a pasted share link is a watch connection.
5. Before rollout, test revocation, a folder with no PDFs, a changed file, a
   new semester folder, and GoodNotes for macOS’s no-auto-backup limitation.

## 4. Do not break

- Do not touch `ClassHub` visual classes, banner art, stat-strip opacity,
  page tabs, card composition, or source-picker copy. That is E fidelity and
  not part of this brief.
- Do not build Canvas REST Path B, a browser-side Canvas fetch, a third-party
  CORS proxy, or any Canvas write path.
- Do not create an Anki scheduler, sync chip, or read-back channel.
- Do not silently import, overwrite, delete, or relabel existing materials.
- Do not write a raw path, OAuth credential, or local filesystem handle to the
  persisted store.
- Preserve the existing Google Drive backup behavior and all unrelated briefs,
  Flashcards V1 specification work, and `output/` artifacts.
- U-2/U-8/U-9 apply: deterministic mapping first; decline to infer an unclear
  week; do not render scores, rankings, or invented readiness facts.

## 5. Done when

- [ ] The store can persist a selected-source mapping and reviewed placement
      proposals without storing credentials, raw paths, or handles.
- [ ] Mapper tests prove exact recognized levels, ambiguous levels, and
      confirmed-mapping reuse; unknown weeks are never guessed.
- [ ] Accept, skip, and re-intake have stable identity semantics and never
      overwrite student material.
- [ ] The local folder capability reports an honest unavailable state and only
      produces a manifest after a user gesture.
- [ ] Empty personal mode contains no demo materials or proposal records.
- [ ] Migration, focused tests, full suite, production build, and
      `git diff --check` pass.

## 6. Commit

`feat(academics): add reviewed backup-folder material intake foundation`

Keep this commit separate from unrelated working-tree changes.

## 7. Next stage — not in this brief

**E · Class Hub fidelity.** After this backend foundation is verified, measure
and resolve the small banner-stat-strip opacity mismatch and any remaining
Class Hub ladder/composition differences. Remote provider adapters are also
not in this brief: they wait for Andy’s OAuth/provider checklist.
