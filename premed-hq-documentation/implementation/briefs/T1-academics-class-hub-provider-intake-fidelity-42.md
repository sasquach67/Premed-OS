# T1 · Academics — Class Hub connected-folder intake fidelity

**Stage:** E · FRONTEND MISSING

**Scope:** Translate the approved Materials folder-intake, review, mapping, and
recovery states into the existing Class Hub. Wire those screens to the already
shipped local-folder discovery and Google Drive adapter. This is a frontend
fidelity pass: it must not change provider/server semantics, create a new
Class Hub tab, or pretend Google Drive is configured before Andy completes the
account checklist.

## 1. Step-1 audit

### A. Spec → paper

**Pass for the selected-folder surface.** `tabs/01-academics.md` §4.1-A and
its watched-notes rules require a one-way, review-first folder route: one
student-selected backup folder; inferred path mapping confirmed once; an
unplaceable week held as **Confirm week**; a **Review each import instead**
escape hatch; and no write/move/rename operation. The same tab's §4 placement
rule keeps Material controls inside the existing Materials tab.

Those states exist in `academics-materials-extensions.html` as Folder intake,
Folder review, Watched notes, and Mapping exception. They are product states,
not another row of Class Hub tabs. There is no ruled provider state without a
mockup surface in this scope.

### B. Mockup → app

`ClassHub.tsx` has a real Materials tab, a class shelf, local uploads,
source-grounded output intake, transcript capture, calendar review, and the
existing generic Material filters. It has **no UI call site** for
`intakeWatchedNotesManifest()` or `googleDriveMaterialSourceClient`; a student
cannot select a local folder, connect Drive, see proposals, accept one, keep
one unfiled, confirm a mapping, recheck, disconnect, or recover from an
unavailable source.

The measured running PHYS 118 Materials route (Aug 24, dark) shows the exact
gap and must be used as the before-state, not hand-waved as visually close:

| surface | mockup value | running app value |
| --- | --- | --- |
| page field | `#211e1a` | `rgb(33, 30, 26)` / `#211e1a` |
| Materials folder panel | solid `#2b2722` | no folder panel exists |
| folder decision/recovery object | `#322e28` / `#262320`, `#3c352d` border | no folder object exists |
| banner stat strip | `rgba(20,26,34,.50)` | `rgba(20, 26, 34, 0.62)` |

The page field matches. The stat strip is one ladder step too opaque, and the
folder work surface has not been translated at all. Both themes must be
measured after this pass; a token class name is not evidence.

### C. Already built — preserve, do not rebuild

- `27ddd73` — Class Hub record hierarchy.
- `4671c42` and `8a2a0f6` — Materials intake and grouped study actions.
- `4f734e4` — lecture evidence/capture.
- `2640d20` — local selected-folder discovery, proposal mapping, acceptance,
  and lossless v35 migration.
- `dec8770` — server-side reviewed Google Drive material-source adapter.

Keep the current output-first behaviour: **Create study material** opens a
contextual source picker; it is not a permanent `Add material` toolbar. Keep
the existing `drive.appdata` dashboard backup separate from a course folder.

### D. Manifest gate

`BUILD-MANIFEST.md` marks both `academics-class-hub.html` and
`academics-materials-extensions.html` **YES**. This fidelity work is cleared.

### E. Decisions files

**Pass.** `academics-class-hub.md` records the shared banner and Materials
ownership. `academics-materials-extensions.md` records both behaviour and
appearance: folder intake is a three-part safety composition; review is one
broad decision sheet; watched notes is a path-to-placement map; and mobile
stacks in the same file → path → decision order. It also records the literal
warm-dark ladder and the ruling that these are safety states, not A/B/C
treatments.

### F. Integrations and services owned by this surface

| dependency | classification | what exists today / what the student sees |
| --- | --- | --- |
| local selected-folder manifest | **code built, frontend missing** | local discovery and proposal persistence exist; no Materials entry point or review UI is visible |
| Google Drive selected-folder reader | **code built, not configured; frontend missing** | `dec8770` supplies the server contract, encrypted server token storage, metadata-only listing, accepted-file transfer, and disconnect; the student sees no connection control yet |
| `drive.appdata` dashboard backup | **built, different capability** | remains unchanged; it cannot be widened into course-file access |
| Dropbox / OneDrive | **not built, not claimed** | no provider action may imply support |
| Canvas REST | **forbidden** | no browser fetch, token, or REST route may be added |

## 2. Why this lands at Stage E

Stages A–C pass: the safety states are drawn, their appearance is decided,
the manifest clears them, and the local record/proposal model already exists.
Stage D is now code-complete in `dec8770`: the connected-provider boundary is
server-side and review-first. It remains externally unconfigured, which is an
Andy checklist item rather than another backend brief. Stage E fails because
none of the approved folder surfaces exists in the app and neither source
contract has a student-facing entry point.

## 3. Work — translate the selected-folder flow, do not redesign it

### 3.1 One temporary Materials state, not a sixth tab or permanent toolbar

- Add a scoped `MaterialFolderIntake` owner (or an equivalently focused,
  testable component) beneath the existing Materials owner. Enter it from a
  quiet Materials overflow/action labelled **Connect a notes folder**. It
  replaces the Materials body while open and preserves the Class Hub banner,
  Materials underline, course context, and Back action.
- Do **not** add a permanent `Add material` button, a Drive tab, a provider
  settings dashboard, or a generic upload wall. `Create study material` keeps
  opening the existing output-first picker. Individual-file fallback remains
  available inside folder intake.
- Use the mockup's three-part layout at desktop: narrow source tree / central
  week-ordered placement board / compact review rail. At narrow width hide the
  nonessential tree first, then stack without changing the file → proposed
  path → decision order.

### 3.2 Local-folder route — existing engine only

- Expose one deliberate browser-directory selection using the existing local
  discovery helper. If the API is unavailable, show the mockup's inline
  recovery and a working individual-file fallback; do not fake selection or
  surface a machine path.
- Feed discovered metadata **only** into the existing
  `addWatchedNotesSource()` + `intakeWatchedNotesManifest()` path. Do not
  create a second parser/importer or an `AcademicFile` before explicit accept.
- Render actual pending proposals as the broad review sheet: file identity at
  left, proposed class/week/category path in the middle, and **Confirm** /
  **Keep unfiled** at right. A missing or ambiguous week must render
  **Confirm week**, never a false placement. `Keep unfiled` is history, not
  deletion.
- The review rail states counts, skipped/unsupported entries, the one-way
  boundary, and that accepted records are metadata until the student asks to
  retrieve the source. It must not show a score, confidence percentage,
  progress bar, or automatic import claim.

### 3.3 Google Drive route — wire the existing client, keep credentials absent

- In the same temporary state, offer **Google Drive backup folder** only as an
  optional provider row. A student explicitly supplies/selects a folder link
  or ID and human label; validate the ID locally and call the existing
  `beginGoogleDriveMaterialSource()` client. Never ask the student to paste a
  token, never persist a Drive URL/ID in Zustand, and never widen
  `src/lib/googleDrive.ts`.
- On return from OAuth, query the existing status/list client. Render only its
  public connection state and metadata entries, then send those entries to the
  same watched-note proposal engine as local-folder entries. The browser must
  never receive a refresh token, raw Drive response, or folder file bytes.
- For each explicit proposal acceptance, call
  `recordAcceptedGoogleDriveMaterial()` and create the existing local
  metadata-only Material through `acceptWatchedNotesProposal()`. Opening a
  retrieved item calls `openAcceptedGoogleDriveMaterial()` for one accepted
  file only and visibly discloses the cloud transfer. There is no folder sync,
  background scan, bulk mirror, or automatic Material creation.
- Make all configured/not-configured/reconnect/unavailable states recoverable.
  If the Edge Function says configuration is unavailable, explain that the
  class and local-folder route still work and show only local selection plus
  individual-file fallback. Do not render a dead Connect button.
- Disconnect calls the existing client only after an explicit confirmation,
  then refreshes connection status. It stops future Drive access but does not
  remove accepted local Materials, proposal history, or mappings.

### 3.4 One-time mapping, exceptions, and accessibility

- After a first inferred local or Drive path, show the left-to-right
  `class → week → category → document` map. **Confirm this mapping** and
  **Review each import instead** are working, mutually understandable choices;
  persisted mappings remain exact-level only.
- Render the two bounded exception cards only for a genuinely new course
  folder or an unguessable path level. Do not restart setup or add wildcard
  matching.
- Every button/menu item must have a handler. All actions use visible
  `:focus-visible`; hover/mode changes use `.15s cubic-bezier(.16,1,.3,1)`;
  `prefers-reduced-motion` resolves directly. Use the existing `Dialog` for
  disconnect confirmation, `AnimatedFileUpload` only for individual fallback,
  and `ToastProvider` for reviewed outcomes. Do not install a second component
  system.

### 3.5 Visual fidelity requirements

- Use the exact Materials ladder from `_shared/_visual-recipes.md` and the
  decision record: page `#211e1a` → solid panel `#2b2722` → decision object
  `#322e28` / recovery `#262320`; borders `#3c352d`; outer panels `16px`;
  inner objects `13px`. Only the existing banner stat strip may be glass.
- Correct that banner stat strip to the literal `rgba(20,26,34,.50)` while
  retaining its `blur(16px) saturate(1.1)`, inset highlight, white alpha
  border, and `13px` radius. Do not flatten the layered banner, restyle the
  Class Center cards, remove any app annotation, or copy mockup inline CSS.
- Measure the running app in dark **and** light after implementation and paste
  the `getComputedStyle` values for page / folder panel / decision object /
  stat strip into the execution report. Values, not utility-token names, are
  the proof.

### 3.6 Tests and verification

- Add component/integration tests with mocked local and Drive client results:
  no Material before Confirm; Confirm week for ambiguous placement; Keep
  unfiled preserves the proposal; exact mapping persists across remount;
  Google metadata reaches the shared engine; no token or raw Drive bytes
  appear in component props/state; accepted-only opening is one file; and
  disconnect leaves accepted Materials/history intact.
- Run the existing inert-control audit for the new Materials state and report
  **zero** handlerless `Button`, `DropdownMenuItem`, or `ContextMenuItem`.
- Empty the personal store and verify no demo source, provider connection,
  proposal, count, or folder path survives. Verify the local fallback still
  renders with no Supabase/Google configuration.
- Run focused tests, full suite, production build, `git diff --check`, and
  relevant manual dark/light + narrow-width screenshots. Do not claim a live
  OAuth round trip without the account configuration below.

## 4. Andy checklist — required before Google Drive is live

This is deliberately **not** implementation work and does not authorize
changing cloud resources during this brief. Before Drive may be called
working, Andy must follow `supabase/DEPLOY.md`:

1. Apply `20260824044417_academic_material_source_connections.sql` to the
   production Supabase project and deploy `google-drive-materials`.
2. Add server-only `GOOGLE_DRIVE_CLIENT_ID`,
   `GOOGLE_DRIVE_CLIENT_SECRET`, `MATERIAL_SOURCE_TOKEN_ENCRYPTION_KEY`,
   `PREMEDOS_APP_ORIGIN`, and `MATERIAL_SOURCE_ALLOWED_ORIGINS` to Edge
   Function secrets—never `VITE_*` or a committed `.env`.
3. Enable Google Drive API; add the read-only Drive consent disclosure and the
   exact deployed callback URL specified in `supabase/DEPLOY.md`.
4. Sign in to a disposable test account and prove connect → list → proposal →
   accept → one-file retrieval → disconnect → reconnect. Then revoke the
   Google grant and verify the reconnect recovery.

Until that happens, the app must say Drive is unavailable to configure, while
local-folder and individual-file flows remain usable.

## 5. Do not break

- Do not alter server function/migration/provider semantics from `dec8770`.
- Do not add Dropbox, OneDrive, Canvas REST, broad CORS, Drive file caching,
  background polling, Anki sync/scheduling, a sixth Class Hub tab, general
  course lookup, or a permanent generic Add-material toolbar.
- Do not move, rename, edit, overwrite, silently accept, or delete source
  files or student-confirmed material. Preserve existing Materials, notes,
  output-first generator behaviour, source selection, class-card annotations,
  lecture capture, and `drive.appdata` backup.
- Do not add U-9 score/composite/ranking/progress UI or U-2/U-8 certainty
  language for inferred placements.
- Keep unrelated working-tree edits and existing brief/spec work out of this
  commit.

## 6. Done when

- [ ] Local folder and configured Drive share one review-first Materials state;
      neither produces a Material before explicit acceptance.
- [ ] Folder review, Confirm week, Keep unfiled, one-time exact mapping,
      Review each import instead, unavailable, reconnect, individual fallback,
      and disconnect states match their approved compositions.
- [ ] Browser-visible Drive data is metadata only; each retrieval is
      authenticated, accepted-only, one-file, and transfer-disclosed.
- [ ] The app preserves accepted Material/history after disconnect, and the
      personal empty store contains no sample provider data.
- [ ] Both themes match the measured visual ladder; the stat strip is exactly
      `rgba(20,26,34,.50)` in dark banner state; desktop and narrow layouts
      preserve the review order.
- [ ] Inert-control audit reports zero, focused/full tests and production build
      pass, and `git diff --check` passes.

## 7. Commit

`feat(academics): wire reviewed folder intake into Materials`

Commit only the fidelity components, tests, and any required client-side
integration glue. Keep unrelated brief/spec/output changes separate.

## 8. Next stage — not in this brief

After implementation, rerun the Academics audit. It must still test the live
configuration checklist before this surface may be promoted to `built`; then
audit other unassessed Academics surfaces one at a time. No Dropbox/OneDrive
provider or Canvas REST work is implied by this brief.
