# T1 · Academics — Class Hub connected-folder intake

**Stage:** D · BACKEND MISSING

**Scope:** Add the server-side Google Drive material-source capability that the
existing selected-folder intake can use later. This is the first connected
provider only: it lets a student explicitly connect one Google Drive backup
folder, lists its metadata as reviewable proposals, and retrieves one accepted
file only on the student's request. It does **not** add a Materials control,
restyle Class Hub, or claim Dropbox/OneDrive support.

## 1. Step-1 audit

### A. Spec → paper

**Pass for this surface.** The relevant ruled states are already drawn:

- `mockup-lab/01-academics/academics-class-hub.html` has the five-tab Class
  Hub, including Materials ownership and the shared banner;
- `mockup-lab/01-academics/academics-materials-extensions.html` has folder
  intake/review, watched-note setup, mapping exceptions, and the recovery
  states; and
- its companion decision record names both the review-first behaviour and the
  literal visual composition. No connected-folder feature needs a first
  drawing.

### B. Mockup → app

`ClassHub.tsx` already translates the five-tab route and its Materials shelf.
It has the source-selected output picker, local uploads, text excerpts,
generated artifacts, lecture capture, and the review-first local-folder
**foundation** committed in `2640d20`.

What is still absent is the service behind a connected backup folder. The only
Google Drive code is `src/lib/googleDrive.ts`, which uses
`drive.appdata` for one private dashboard backup. It cannot list a user's
selected Drive folder, read its metadata, refresh a token server-side, or
retrieve an accepted course file. `rg` finds no Drive material-source Edge
Function, no encrypted source connection, and no Google `drive.readonly`
scope. Dropbox and OneDrive likewise have no adapter.

One direct measurement was made on the running local PHYS 118 Class Hub,
Materials route (Aug 24):

| surface | mockup value | running app value |
| --- | --- | --- |
| page field, light | `#f7efe1` | `rgb(247, 239, 225)` |
| banner stat strip | `rgba(20,26,34,.50)`, `13px` radius | `rgba(20, 26, 34, 0.62)`, `13px` radius |
| Materials body | solid `#2b2722` panel → `#322e28` inner object | current route has the chosen output/shelf controls but no folder review surface to measure |

The field matches. The stat-strip opacity remains a known later **E fidelity**
correction. The missing connected-folder behaviour is earlier in the ladder,
so this brief must not adjust that CSS yet.

### C. Already built — preserve, do not rebuild

- `27ddd73` — Class Hub record hierarchy;
- `4671c42` and `8a2a0f6` — Materials intake and grouped study actions;
- `4f734e4` — local lecture evidence/capture;
- `326a17a` — browser `.apkg` export;
- `4fe210f` — Academics control sweep; and
- `2640d20` — selected local-folder discovery, proposal mapping, acceptance,
  lossless v35 migration, and tests.

In particular, retain the existing `drive.appdata` backup. It is not a
course-material reader and must not be widened accidentally.

### D. Manifest gate

`BUILD-MANIFEST.md` marks both
`01-academics/academics-class-hub.html` and
`01-academics/academics-materials-extensions.html` **YES**. This backend work
is cleared. Canvas REST Path B remains explicitly forbidden.

### E. Decisions files

**Pass.** `academics-class-hub.md` records the one-way, confirm-once folder
rule and the shared-banner/material hierarchy. `academics-materials-extensions.md`
records folder/watched-note behaviour **and** the warm-dark appearance:
page `#211e1a` → solid panel `#2b2722` → decision object `#322e28` or recovery
inset `#262320`, with `#3c352d` borders. No variant decision is open; folder
states are safety states, not A/B/C treatments.

### F. Integrations and services owned by this surface

| dependency | state today | classification |
| --- | --- | --- |
| local selected-folder manifest | mapping, proposal persistence, and a capability check are in `2640d20`; no Material UI calls it yet | **code built, frontend missing** |
| Google Drive dashboard backup | browser GIS token + `drive.appdata` backup only | **built, different capability** |
| Google Drive selected-folder read | no server token store, folder picker callback, list/metadata route, or accepted-file retrieval | **code missing** — this brief |
| Dropbox / OneDrive | no adapter, OAuth app, or callback | **code missing, not claimed by this pass** |
| Canvas Path A | read-only Google Calendar review exists, but a real individual feed has not been proven here | **code built, configuration not proven** |
| Canvas REST Path B | no code | **intentionally forbidden** |

## 2. Why this lands at Stage D

Stages A–C pass: the surface is drawn, its visual and interaction decisions
exist, the manifest clears it, and the local-only model persists correctly.
Stage D still fails because the product wording promises an optional backup
folder route but only stores a link. There is no secure Drive reader behind
that route. A Material UI for the existing local folder can follow only after
this provider boundary is honest and review-first.

## 3. Work — one Google Drive provider adapter, server-side and review-first

### 3.1 Create a provider-neutral server contract

Add a narrow, typed material-source service whose first provider is
`google-drive`. Its client-facing contract is metadata-only:

- connection status, human-visible source label, selected Drive folder id,
  selected-at/last-checked timestamps, and a `needs-reconnect` reason;
- a `list` operation returning relative display path/name, MIME type, modified
  time, byte size, and stable Drive revision identity; and
- an `open accepted file` operation that runs **only after** the student has
  accepted a particular proposal and explicitly asks to attach/read it.

Do not expose a refresh token, access token, absolute local path, Drive web
URL with bearer credentials, or raw provider response to Zustand, localStorage,
logs, or the generated artifact prompt. Reuse `WatchedNotesManifestEntry` and
`intakeWatchedNotesManifest()` as the single proposal path—do not create a
second material importer.

### 3.2 Add a secure Google Drive read adapter

Implement the adapter behind a Supabase Edge Function, not in the static
GitHub Pages bundle:

1. Start an OAuth authorization-code + PKCE flow from an explicit user
   gesture. Request only the minimum Google Drive read scope needed for a
   folder the student selects: `https://www.googleapis.com/auth/drive.readonly`.
   Keep calendar and `drive.appdata` scopes separate; do not silently enlarge
   the existing backup grant.
2. Handle the callback and token refresh server-side. Store the refresh token
   encrypted at rest in a per-user connection record guarded by RLS; only the
   Edge Function can decrypt/use it. The browser receives a connection status,
   never provider credentials.
3. Use the Drive API to list the selected folder recursively enough to produce
   a relative logical manifest. Request only needed metadata (`id`, `name`,
   `mimeType`, `modifiedTime`, `size`, `md5Checksum`/revision where
   available). Treat Google-native Docs as a clearly named handoff or an
   unavailable source until an explicit export path is implemented—never
   pretend their bytes were parsed.
4. A refresh/list creates or updates **pending proposals only** through the
   existing stable-identity intake engine. It must not create an `AcademicFile`,
   overwrite student labels/links, or invoke generation.
5. On an accepted-file request, stream/download only that file to the
   student's authenticated browser for existing local retention/processing.
   State clearly in the server response whether this is a cloud transfer. Do
   not bulk-download a folder, mirror course PDFs to Supabase Storage, or
   process file text in the background.
6. `disconnect` revokes/deletes the encrypted provider token and stops future
   checks while preserving accepted Materials and proposal history. It does not
   delete Drive files or existing local material.

The server must require a verified Supabase user for every operation and must
check that the connection belongs to that user. Use stable Drive file/revision
identity so folder reorganization does not turn every file into a new proposal.

### 3.3 Honest update semantics

Do **not** call this a background watcher in v1. A static browser client
cannot keep watching while closed, and silent material creation violates the
review boundary. The eventual Material UI may offer **Check selected folder**;
the server lists changes and stages them for review. A later scheduled sync is
only permitted if it still creates pending proposals and a user has chosen the
review-each-import setting.

When the Drive grant is missing, expired, inaccessible, empty, or points to a
non-file-only folder, return a typed recoverable reason. Never fall back to a
public share link, a Canvas fetch, guessed file content, or another user's
connection.

### 3.4 Tests and migration

- Add a lossless migration only if a new persisted local connection-summary
  field is truly needed; all prior `ClassCenterData`, watched sources, files,
  and proposals must remain byte-identical apart from additive defaults.
- Unit-test manifest normalization, relative path sanitization, stable Drive
  identity/revision matching, changed-file proposal staging, inaccessible
  folders, Google-native-document recovery, disconnect, and cross-user access
  rejection.
- Add Edge Function tests or mocked fetch contract tests proving no token,
  full folder content, or raw provider response is returned to the client.
- Prove an accepted material remains intact after source disconnect and an
  empty personal store receives no demo provider/source/proposal data.

### 3.5 Andy checklist — configuration required after this code exists

This checklist is **not** a substitute for the code above. Once the code is
merged, Andy must configure the external account pieces before a user sees a
live connected Drive source:

1. In the existing Google Cloud project, enable **Google Drive API**.
2. Add `drive.readonly` to the OAuth consent screen, preserving the existing
   Calendar scope and app-data backup scope. Update the public privacy policy
   explanation to say that a student-selected folder may be read only to stage
   material proposals.
3. Add the exact production callback URL emitted by the deployed Supabase Edge
   Function and the local development callback URL. Do not guess or add broad
   wildcard redirects.
4. Create/update the server-only Google OAuth client secret in Supabase Edge
   Function secrets; keep it out of `VITE_*`, `.env` committed files, Zustand,
   and GitHub Pages.
5. Apply the connection-table/RLS migration, deploy the function, sign in as
   a non-admin test account, connect one disposable Drive folder, and verify:
   list → pending proposal → explicit accept → explicit file retrieval →
   disconnect. Then revoke the Google grant and verify the reconnect state.

## 4. Do not break

- Do not touch `ClassHub.tsx` layout, banner art, stat strip opacity, shared
  tabs, Material toolbar, local folder UI, or any mockup CSS. Those are the
  later E fidelity pass.
- Do not widen `src/lib/googleDrive.ts`'s `drive.appdata` backup scope or send
  its browser token to Supabase.
- Do not build Dropbox, OneDrive, Canvas REST, browser-side Canvas fetches,
  generic CORS proxies, Anki sync/scheduling, or a sixth Class Hub tab.
- Do not silently scan, import, overwrite, delete, move, or rename material.
- Do not add score/composite/ranking/progress-bar language (U-9), or make an
  unconfirmed folder placement look certain (U-2/U-8).
- Preserve all unrelated working-tree changes, especially Flashcards V1,
  generated output artifacts, other brief edits, and current class-card visual
  annotations.

## 5. Done when

- [ ] A signed-in user can connect exactly one selected Google Drive folder
      through a server-side read-only grant, with no credential stored in the
      browser store or emitted in a response.
- [ ] List/recheck returns metadata-only entries and stages only the existing
      reviewed proposals; no `AcademicFile` exists before accept.
- [ ] Explicit accepted-file retrieval is single-file, authenticated, and
      cloud-transfer disclosure-capable; there is no bulk mirror.
- [ ] Disconnect removes future Drive access but leaves accepted material and
      history intact.
- [ ] Tests prove user isolation, stable identity, changed-file proposal
      handling, recovery states, no token leakage, and lossless migration.
- [ ] Focused tests, full suite, production build, and `git diff --check`
      pass. The live Google round-trip is recorded separately after Andy’s
      checklist—until then the UI must say configuration is required.

## 6. Commit

`feat(academics): add reviewed Google Drive material-source adapter`

Commit only this adapter, its migration/function/tests, and any required
deployment documentation. Keep unrelated work separate.

## 7. Next stage — not in this brief

After the Drive adapter's tests and configuration state are verified, rerun the
Academics brief. The next blocked stage is **E · frontend fidelity**: wire the
already-built local/connected source contracts into the approved Materials
folder intake/review states and correct the measured banner stat-strip opacity.
It must be a separate visual pass; no provider logic or remote-account work is
in that pass.
