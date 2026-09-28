# T4 · Research: first release (daily log + Your lab + People + stats)

**Stage:** build (ladder C/D), frontend and backend together. **Written by:** Claude, Sep 24, 2026. **Builds in:** Codex "Research" chat (`01a081de-5aa2-79a1-a816-6a5b1ac293c5`). **Reviewed by:** Claude. **Board:** Codex Planning.
**Goal:** `goals/research.md` (decisions 1–25). **Design:** `mockup-lab/06-research/research-lab-log.html`, **variant B, approved and structure fixed** (notes in `research-lab-log.md`). **Reviews that bind this brief:** `goals/reviews/2026-09-23-codex-research-goal-review.md`, `2026-09-24-codex-research-redesign-review.md`, `2026-09-24-codex-research-hours-import-review.md`, and **`2026-09-24-codex-T4-research-build-review.md`** (feasibility review of this brief; its data shapes, ordering and tests are part of this brief).
**Branch:** `research/t4-first-release` from `origin/main`, in Codex's own worktree. If something you need isn't here, read the named goal or review section, and tell Claude the brief was incomplete.

## Scope decisions (Andy, Sep 24, Claude planning chat; selected options)

| # | Question | Andy selected | Result |
|---|---|---|---|
| 1 | What the goal measures | "All research hours (Recommended)" | `goals.research` compares with **total research hours** (all labs, estimates included), the same as Overview: "Total 91.5 / 150 h". "This term" shows hours with no goal. |
| 2 | Term dates | "Fixed windows (Recommended)" | Fall = Aug 1–Dec 31, Spring = Jan 1–May 15, Summer = May 16–Jul 31, inclusive, labeled "Fall 2026" etc. |
| 3 | Pace projection | "Keep it" | Research keeps the shared hour-row pace estimate on Overview (from dated logged hours only) and in the header when a goal is set. |
| 4 | Claude's additions | Selected "Earlier notes" only | **Earlier notes: yes** (one Research-wide, read-only, unassigned list). **Lab switcher: no.** |

**Consequence of "no lab switcher"** (Claude's reading; Andy can correct):

- "Your lab" and People show the **current lab**: the one the student marks current, defaulting to the most recently logged.
- The log shows **all research entries**, each labeled with its lab name only when there's more than one lab.
- Totals always cover all research.
- Other labs' data stays intact and editable from their entries. Nothing is merged.

## Approvals

| Date | Chat | Andy's exact answer | Brief revision | Covers |
|---|---|---|---|---|
| Sep 24, 2026 | Claude planning (session 429b1fa7) | Selected **"Approve build"** to the question "Approve the first Research build (brief T4 at commit 5c0ff8f)? … It does NOT release anything" | `5c0ff8fa6c02c7e8bbcc9a4bba102257df6c63cf` | **Building this brief** on `research/t4-first-release`, with preview-only route enablement and alpha on a local preview with the separate test account. **Not** release, production unlock, merge to `main`, or any change to real account data. |
| Sep 24, 2026 | Claude planning (session 429b1fa7) | Asked "can't i use my elephon08@gmail.com account just to access it", then "well can't i just use it as if it was on my actual premed with my data??? and then any changes i could make could just be wiped locally in the reserach sectio n", then answered **"real account"** after Claude explained that the whole workspace syncs and recommended an alias first | same brief | **Extends the alpha only:** Andy signs into the **local preview** with his **real account** (`elephon08@gmail.com`) instead of a separate test account. **Required precautions, all before he signs in:** (1) Andy exports a full JSON/ZIP backup to his Mac; (2) premedos.app is closed on every device and tab during testing; (3) Research test entries may be dropped by the old live app until S1 is live, which is accepted. Codex never signs in for him and never writes to his account except through his own actions in the preview. Still **not** release, production unlock or merge. |

## 1. Already built (don't rebuild)

- `ExperienceHourEntry` (`date`, `hours`, `kind`, `note`, period bounds) and hour totals: `src/lib/experienceHours.ts`, migration `experienceHoursV15.ts`
- `PositionDetail` add-only capture in `components/experiences/ApprovedPillarLayouts.tsx`. Its patterns can be reused; it is **not** the finished log.
- `Person` / `persons`, `Organization`; `ExperienceEntry.supervisorId` / `organizationId`
- `Goals.research` already exists (`types.ts:2011`), and Overview already offers "Research hours" as a target (`OverviewSupport.tsx:249`)
- Overview's "Hours logged" research bar (`OverviewStatus.tsx`)
- `ReservedSpace` for `research` in `App.tsx` **and** `src/app/availability.ts`

Old `ResearchWorkspace` / `LabNotebookView` / PI checkboxes in `ExperiencePillar.tsx` are unrendered patterns, not working features. Don't count them as built.

## 2. References

- Mockup B (read the HTML, not just the `.md`), both themes, 375px
- `mockup-lab/_shared/_visual-recipes.md`, **but** the X1 sweep measured the real app. Where they differ, match the implemented Academics pages.
- Spec `tabs/06-research.md` with its **Sep 24 revision notes** (§2.1, §7, §9, §14, §15)
- Shared components: `PillarShell`, `InlineAddRow`, `ExpandableEntryRow`, `ContactCard`. Reuse them; never fork variants.

## 3. The work

### 3a. Page (route `research`, design B)

- **Header:** "Research", the lab name as subtitle, and the stat strip:
  - **This term** hours (dated logged hours inside the fixed term window (decision 2); inclusive dates, local midnight rollover)
  - **Goal** (decision 1): "Total 91.5 / 150 h" when `goals.research > 0`, with the pace estimate (decision 3). The same numerator as Overview. Never a per-lab goal. Totals always cover all research.
  - **Total** hours, with estimates labeled ("Total · 60 est.")
  - Search and date filters affect **only the log**, never the header stats.
  - **Lab days** = distinct dates with logged hours > 0
- **Tabs:** "Log" only. No tabs for unbuilt features.
- **Control bar:**
  - search (What I did + Thoughts)
  - date range (this term / last 30 days / all time / custom)
  - primary action **"Log a lab day"** (the one blue pill)
- **Left: the daily log**
  - **Quick capture:** date, hours (**optional**), "What I did" (one line), Save; "+ Thoughts" opens a second field. ≤5 seconds for date + hours + one line.
  - **Save state line:** "Saved on this device" is separate from sync pending/failed. Never show a failure as saved.
  - **Entries grouped by week.** Each week header shows its hours and lab days. Each row shows date · hours chip ("No hours recorded" when 0) · What I did · Thoughts clamped to one line, expanding to full with **Edit** and **Delete**.
  - "Show earlier entries"
- **Right: "Your lab"** (the working box)
  - **Lab facts, one line:** department · institution · research type · since. Plus "Last PI contact <date> · Update" (a date the student records).
  - **Upcoming (+ Add):** dated items the student adds (date, title, optional short note), sorted by date; past items are **hidden from view, not deleted** (inclusive of today; rolls over at local midnight). A list only: **no calendar, no recurrence engine, no notifications** in this release.
  - **Pinned reminders (+ Add):** short text lines; add, edit, remove, reorder.
  - **Timeline:** dated role notes (date + one line), newest first.
  - **Not in this release:** Key reading and the onboarding-doc footer (they arrive with the onboarding import). Don't render them or their empty shells.
- **Right, below: People**
  - **Cards:** avatar initials · name · role in this lab · short bio · "Project: …" (text).
  - **"+ Add person"** uses a shared select/create/link control over `persons`, and never auto-merges by name.
  - **No status tracking** on people (decision 16).
- **Empty states:**
  - no lab yet: one action, "Add your lab"
  - lab, but no entries: "Log your first lab day"
  - empty Upcoming / Reminders / People: one line each with its + Add

  Friendly one-liners, never blank.

### 3b. Overview (small, same release)

- The Research status row uses the shared **`hourRow`** (`OverviewStatus.tsx:75`), like Clinical/Volunteering/Shadowing: hours, `goals.research` progress, and the pace projection. That replaces "N projects · record count".
- The "Hours logged" research bar and the "Research hours" target option stay.

### 3c. Data & backend

- **One hours ledger.**
  - A log entry is one `ExperienceHourEntry` (`kind: 'logged'`) under the lab's `ExperienceEntry` ID.
  - "What I did" = `note`, kept verbatim and never truncated.
  - Add optional `thoughts`.
  - Zero-hour entries use `hours: 0` and are excluded from sums and lab days.
  - Estimates stay estimates: never dated, never lab days.
- **Lab = the existing research `ExperienceEntry`, extended in place** (decision 3).
  - Keep its ID, fields, hours and story links.
  - Link an `Organization` only when the student picks one.
  - Unknown type/PI/dates stay unresolved.
  - Never merge same-name entries.
  - With several research entries: no switcher (decision 4). The rail shows the **current lab**; the log shows all entries, lab-labeled when there's more than one lab. No merging.
- **New records (names to settle in code):**
  - Upcoming items, Pinned reminders and role-timeline notes, each linked to the lab
  - a lab-membership link (lab ↔ Person) holding role-in-lab and "their project" text
  - `bio` as an optional field on `Person`
  - "last PI contact" date on the lab extension
- **Register every new collection/field** (redesign review §6, all 8 points):
  - `AppData` / `CollectionKey`
  - seed defaults
  - the versioned migration chain + `workspaceVersion.ts`
  - `DATA_KEYS`
  - structural **and** meaning validation at local load, import, cloud and restore
  - merge areas and local-work detection
  - JSON/ZIP round-trip
  - old-client protection (a stale-client test, or a documented safe refusal)
- **Shared fixes this release depends on:**
  1. `MergePage.tsx:44`: the experiences merge area must carry `experienceHourEntries` and the new Research collections, kept together with their parent lab.
  2. `publicLayer.ts:144–187`: local-work detection counts **records**, not the deprecated `ExperienceEntry.hours` sum, so a guest with only log entries (including zero-hour ones) is detected.
  3. **Estimated-block deletion tombstone**, so a later migration can't recreate a deleted estimate.
- **Record shapes** (from the T4 review; exact names are settled in code):
  - `ExperienceHourEntry` gains optional `thoughts`. Log retrieval must **not** reuse `activeEntries` (it drops zero-hour rows).
  - Lab facts (department, institution, research type, since) are **named additive fields** on the lab extension or explicit mappings to existing fields.
  - Upcoming `{experienceId, date, title, note?}`, reminders `{experienceId, text, order}`, timeline notes `{experienceId, date, text}`: independent collections with `EntityEnvelope`. These are not Tasks, calendar events or Timeline milestones.
  - Membership `{experienceId, personId, roleInLab?, projectText?}`. `Person.bio` is shared, so editing it changes that person everywhere. Removing a card **unlinks** the membership and never deletes the Person. Duplicate links are prevented. Existing `supervisorId` links are kept.
  - **Last PI contact** is a manual date only in this release.
- **Delete/restore:**
  - Define parent-delete, restore and dangling-reference behavior (generic delete doesn't cascade).
  - Validation separates preserved historical/deleted links from a malformed *active* link. Rejecting every historical orphan would not be lossless.
  - The **estimate tombstone must survive a permanent Trash purge** and later import/re-migration.
- **Earlier notes** (decision 4, accepted):
  - Research `NotePage`s stay **unassigned**, one Research-wide read-only list, including when no lab exists. Nothing is assigned by lab name or selection.
  - Guest merge must carry `notePages` (today's merge areas don't).
  - Other pillars' notes are untouched.
- **Validation** also covers `persons` / `organizations` (not in today's structural validator).
- **Sync:** whole-workspace sync carries the registered data, Thoughts included (decision 5). Test the real outgoing and reloaded payload. No new backend API, no file storage, no integrations.

### 3e. Old-app compatibility (blocks production, not alpha)

- The local version guard protects only the persisted envelope. **Cloud writes send bare `AppData`**, and remote validation ignores unknown collections, so an older production app can load an account and save it back **without** the new Research data.
- **Required outcome:** a new app writes, then the **actual current production app** reads, edits an unrelated field and saves. Either every new field, collection and tombstone survives, or the old app refuses before replacing anything.
- A guard added only to the new app can't protect old ones. If the fix needs shared sync changes, it becomes a **separate shared-system brief** (`DEV-WORKFLOW.md` §4), not silent scope growth here.
- **Alpha runs on the separate test account** in the meantime. New-schema data must never meet the old production app until this passes.

### 3d. Route availability (preview only)

- One **explicit, default-off build flag**, read by both `App.tsx` and `src/app/availability.ts`. It is not tied to Vite dev mode, because a deployed preview is a production build. Direct URLs follow the same rule. Test two built artifacts: flag off stays reserved; flag on opens Research with consistent navigation.
- Alpha uses a **local `npm run preview`** until hosted previews exist, signed in with the **separate test account** (`DEV-WORKFLOW.md` §9). Recovering the Cloudflare work is **not** a hidden prerequisite.
- **Production stays `ReservedSpace`.** Unlocking production (`App.tsx` + `availability.ts`) is part of the release step and needs Andy's separate release authorization.

## 4. Do not break

- Other pillars' hours, totals, projections, pages and Overview rows
- Existing research records, hours (logged vs estimated), story links and legacy notes. Keep old research `NotePage`s intact and reachable (listed read-only under the lab as "Earlier notes" if any exist).
- Signed-out mode
- The `CLAUDE.md` must-not-change list (tokens, fonts, sync layer schemas only via versioned migration)
- lucide icons only; one primary action; ≤5-second logging

## 5. Done when

1. **Log:**
   - add, edit, delete, search and date-filter entries
   - zero-hour entries show "No hours recorded"
   - **totals recompute correctly:**
     - editing only What I did/Thoughts changes no hours
     - editing hours changes the sum
     - delete subtracts once, and restore adds back once
     - two positive logs on one date = one lab day
     - zero-only dates count none
2. **Header:**
   - this-term hours use the fixed windows (decision 2, inclusive)
   - the goal appears only when set, against total research hours (decision 1), and matches Overview
   - total hours label estimates
   - lab days
   - fixtures: two labs, missing term, estimated-only, zero-hour-only, archived/deleted rows, date and leap-day boundaries, and goal absent vs positive
3. **Your lab:** facts line, last-contact update, Upcoming, Reminders and Timeline all add/edit/remove and survive a reload. Past Upcoming items are hidden, not deleted. Key reading is not rendered.
4. **People:**
   - add, link, edit and unlink, with bio and project
   - unlinking never deletes the Person
   - same-name different Persons stay distinct
   - no name auto-merge
5. **Overview:** the Research row uses the same numerator/goal as the header (with the pace projection, decision 3). The old "projects" wording is gone.
6. **Migration:**
   - **Complete legacy records are compared before and after**, and only enumerated additive changes are allowed.
   - Cover null/absent optionals, long legacy text (never truncated), unknown PI identity and old notes.
   - Re-running it is idempotent.
   - A deleted estimate stays deleted through **delete → purge → export/import → migrate twice**, and restore-before-purge brings it back once.
   - Restore works parent-before-child and child-before-parent.
7. **Round-trips:**
   - reload
   - JSON/ZIP export/import
   - a Research-only guest→account merge that carries hours and notes
   - account switch
   - cloud reload

   Malformed payloads are rejected. Also exercise storage rejection, offline sync, cloud rejection, and switching account mid-write. "Saved on this device" appears only after durable acknowledgment.
8. **Old-app compatibility** (§3e) passes before any production unlock. It isn't needed for alpha on the test account.
9. **Five seconds**, measured this way: page already open, default date, a short known entry, no Thoughts, ending at durable confirmation. Sync time is recorded separately.
10. **Six promotion proofs** (`DEV-WORKFLOW.md` §6) against the exact approved B revision, plus:
    - build, **lint**, test
    - signed-out mode
    - both themes
    - 375px with no horizontal scroll
    - keyboard access
    - empty store showing real empty states

    Unconfigured preview checks are listed as **blockers**, never passed by reading source.
11. **Route:** the production build is still reserved (flag off), and the preview build opens Research (flag on).

**Build order** (from the review):

1. freeze scope decisions
2. types, defaults, validation and versioned migration, including the tombstone
3. persistence, merge, local-work detection and round-trips
4. pure selectors (log retrieval, date windows, totals, lab days), tested against fixtures
5. the UI and the preview flag
6. the full acceptance matrix and alpha

## 6. Commit

One feature per commit (conventional): e.g. `feat(research): …`, `fix(merge): carry experience hour entries`, `fix(public): count local work by records`. The build report is appended to this brief as `## Build report`.

## 7. Next stage (not in this brief)

Andy tries it on the preview (alpha). Then a **release brief**: production unlock, release authorization, live check. After that, **T4-b: onboarding import** (reminders, key reading, standing meetings, people and checklist from the lab's document).

## Build report

**2026-09-24 · Codex · implementation `c222550` · branch `research/t4-first-release`.** Built in `/Users/andyquach/.codex/worktrees/research-t4-first-release/premed-os`, from production/main base `5c7a3e4`. Approval scope was observed: preview-only flag, no main merge, no release, no real-account data writes. The page remains **unpromoted**, pending authenticated alpha and Claude review.

Implemented the daily log (optional hours, Thoughts, search/range, week grouping, edit/delete/recovery), lab facts/current-lab selection, manual PI contact, Upcoming/reminder/timeline CRUD, reminder reorder, explicit shared Person links, Earlier notes, total-hours goal/pace, and shared Overview hour row. New data is registered through v51 migration, local/remote/import validation, snapshots, merge and local-work detection. Deleted-estimate and historical relation markers preserve lossless delete/restore/purge behavior. All four new collections survive the tested storage/export/account round trips.

`PillarShell` did not exist, and the named entry/contact primitives were private to the old ExperiencePillar. As reported to Planning, minimal shared primitives were extracted, retaining legacy callers, and InlineAddRow gained an additive controlled-form path. Existing PageHeader supplies the shell. No new framework or dependency was added. The fourth review was absent from the pinned commit; its supplemental planning-worktree copy was read and its requirements applied.

Validation:

- **289 test files / 2,177 tests passed**; final recovery-label change additionally checked with 14 passing focused UI/persistence tests.
- Both flag-off and flag-on TypeScript/Vite builds passed. Flag-off built UI stays reserved, including direct route; flag-on built UI opens Research.
- Full lint: **0 errors / 55 warnings** in existing files; final changed UI/recovery paths lint clean.
- Inert-control audit: **32 controls / 0 inert**.
- Actual local preview: clean signed-out state; add/edit/delete/restore log with recomputed totals; rail and Person CRUD/reload; manual date via keyboard; both themes; **375px client width = 375px scroll width**; keyboard capture; automated short-entry durable confirmation **422ms**.
- Measured approved B surfaces match in both themes, along with column ratio, gap, panel radius and typography. Header decoration uses the existing shell and is not pixel-identical to the standalone mockup; final fidelity review remains explicit.
- Detailed acceptance evidence and test-account checklist: [`../evidence/T4-alpha-build.md`](../evidence/T4-alpha-build.md).

**Production blocker (§3e): confirmed.** The actual old production client accepts new data and drops all four new collections on an unrelated write. Reproducible proof and exact old revision are in [`../evidence/T4-old-client-compatibility.md`](../evidence/T4-old-client-compatibility.md). Its passing test asserts the incompatibility; it is not a compatibility pass. Fix requires a separately approved shared-sync brief. No shared sync fix was added here.

**Alpha blocker: separate test account has not been identified or signed in.** Public auth configuration is present, but authenticated cloud save/reload, network-offline/rejected-cloud behavior and live account-switch checks are not verified. Mocked-cloud/real-IndexedDB tests are recorded separately. The local preview is `http://127.0.0.1:53024/#/research`, served with `npm run preview -- --host 127.0.0.1 --port 53024 --outDir dist/research-on`.

Next: Planning receives this revision and evidence, notifies Claude for review, and coordinates test-account alpha. Production unlock/release/main merge remain outside this build's approval. No mockup or board status was promoted.


### Claude visual review follow-up — 2026-09-24

Review: `docs/dev-workflow` revision `c2624f0137545612933ac447b90c59841d5911a5`, `goals/reviews/2026-09-24-claude-T4-build-review.md`. Claude accepted the build, variant B, and existing PageHeader; three visual corrections were requested before alpha.

**Fix revision: `3f02a0ab53898afceae8ff573ad6cef86885aa87`.** Only `src/pages/research.css` changed: chips use `justify-self:start` and `white-space:nowrap`, the zero-hours width cap is removed, and the Research row chevron uses flex order to appear after the summary. Full visible wording remains “No hours recorded.” No shared component markup, handlers, selection behavior, data, schema, merge or sync changes.

Fresh checks against the rebuilt local preview (signed out, synthetic Example Lab):

- Desktop 1422 CSS px and mobile **375 CSS px**, **both light and dark**: populated chips remain 26.736px (`2 h` / `3 h`) or 35.339px (`1.5 h`), zero-hours chip 100.634px wide. These widths are identical across viewport/theme combinations. Chips are single-line: populated height 16.997px, zero-hours height 18.108px including its border.
- Every measured chevron's left edge is right of its summary's right edge. Screenshot inspection confirmed the right-side placement and compact chip sizing.
- Mobile document client/scroll width **375/375** in both themes; row width 322.448px. No horizontal overflow. Browser zoom compensation as documented above; viewport override reset.
- Enter expanded the zero-hour row (`aria-expanded=true`); Space collapsed it (`false`). Existing button and accessible label are unchanged.
- `npx vitest run src/pages/Research.test.tsx --maxWorkers=2`: **8/8 passed**, `/tmp/research-t4-visual-tests.log`.
- Flag-on `npm run build`: **passed**, `/tmp/research-t4-visual-build.log` (existing bundle-size warning only). `git diff --check` clean. No new JS/TS was introduced, so no additional JS lint run was necessary.
- Control audit remains **32 controls / 0 inert**. Earlier full-suite result **2,177 passing tests** remains historical evidence for the preceding implementation, not a newly repeated full-suite claim.

Local preview updated at `http://127.0.0.1:53024/#/research`. This resolves review findings 1–3. Header acceptance supersedes the earlier pending decorative-header fidelity note. Authenticated alpha still awaits Andy's separate test account/environment; production remains blocked on S1 and separate release approval. No merge, push, deployment, production unlock, real-account writes, or promotion occurred.


### Manual real-account alpha preparation — 2026-09-24

Planning verified Andy's explicit “real account” decision (Claude user event `88c3527f-e232-4d0f-8593-bbe2ed29e3e2`, `2026-09-24T15:50:57.447Z`), now recorded in the Approvals table at documentation revision `3e93dc2`. This **supersedes the separate-test-account requirement for Andy's manual local alpha only**. It does not authorize agent sign-in, emails, account writes, Auth configuration changes, production unlock, merge, push, deployment, release, or the S1 production migration. Earlier separate-test-account blocker text is historical, not the current approval.

Read-only preparation:

- The preview points to Supabase project `poichxqptuupzrkyewrq`. Source `src/lib/supabase.ts` defines origin plus Vite base. The actual built `dist/research-on/assets/sharedMaterialFiles-BhSkExwE.js` contains `window.location.origin}/`: **effective `authRedirectTo` is `http://127.0.0.1:53024/`**, without a hash route. Source/base configuration and the compiled artifact agree.
- **Hosted allow-list remains unverified.** Opened the actual hosted [Auth URL Configuration](https://supabase.com/dashboard/project/poichxqptuupzrkyewrq/auth/url-configuration); it redirected to Supabase's Welcome back / Sign in page. No sign-in was attempted. Available Supabase connector tools expose no Auth config reader; CLI is not installed and no management access token is configured in this shell. Repository `config.toml` was not treated as hosted evidence.
- Required next action: Andy/project owner signs into that Supabase dashboard himself, then shows/opens URL Configuration for read-only verification that **`http://127.0.0.1:53024/**`** is covered (including the actual root callback above). If absent, configuration addition must be performed/authorized separately by the owner before requesting a preview magic link. Neither absence nor presence is currently established. The Site URL must not be inferred from local config or changed for this preparation.
- Guest separation: `useCloudSync.ts` pauses first-login reconciliation when unreviewed local work exists; `MergePage.tsx` defaults every area to the account's copy and writes only after explicit Apply. The exact safe deferral label is **“Use my account workspace and review this later.”** It activates the existing account workspace with no merge upload and leaves Guest records in their namespace. Do not choose “Use this device's” for synthetic records. No browser data was erased.
- Fresh synthetic `src/pages/public/MergePage.test.tsx` run: **7/7 passed**, `/tmp/research-t4-alpha-merge-check.log`; includes no upload on deferral and preservation of Guest records. This is mocked account evidence, not a real sign-in or cloud test.

Andy's manual sequence (sign-in waits on hosted redirect verification):

1. In the current live account, Settings → **Export complete backup**, save the full ZIP to the Mac and confirm the download completed. JSON may accompany it; JSON alone omits attached assets. This backup must come from the real account, not the preview's synthetic Guest workspace.
2. Close premedos.app in every tab/device during alpha. The preview uses the same account/database and syncs the **whole workspace**; test edits are not disposable local-only Research changes. Old live versions can drop new Research collections until S1 ships.
3. After hosted redirect verification, open `http://127.0.0.1:53024/#/research`, and Andy signs in himself. Request and open the magic link in the same browser/profile so PKCE can use its saved verifier. Agents do not send the email or perform login.
4. If “You've got work on this device” appears, choose **“Use my account workspace and review this later.”** Do not apply the synthetic device copy. If a recovery/conflict prompt appears, stop and download the offered recovery copies; preserve Guest through its own Settings → Export complete backup if needed. Do not reset/clear browser data or force a sync winner.
5. Verify existing real classes, notes, hours and files before editing. Andy may personally exercise normal Research capture (with/without hours and Thoughts), edit/search/filter, working-rail and People changes, reload and visible device/cloud status. Do not call these checks complete until actually observed. If unexpected data or sync conflict appears, stop. Machine-driven offline/rejection/destructive tests remain synthetic only.

Status: manual real-account alpha is authorized with the required precautions, **but hosted redirect verification and all real-account/cloud alpha checks are still pending**. No live session/account writes or Auth changes were made. No runtime code changed in this preparation; preview remains at the reviewed visual build.


### Hosted redirect verified by Planning — 2026-09-24

**Current status update; supersedes the hosted allow-list blocker above.** Planning (task `01a07de1-ad82-7df0-aede-00af15f1b673`) reports a read-only observation in Andy's Arc browser of project `poichxqptuupzrkyewrq`, production main, Auth → URL Configuration:

- Redirect URLs visibly includes **`http://127.0.0.1:53024/**`**, among six entries.
- Site URL remains **`https://premedos.app/`**.
- Andy reported adding the redirect. Planning made no configuration changes or sign-in action. This Research task records **Planning-observed hosted configuration**, not an independently repeated observation and not a successful authentication roundtrip.

The hosted redirect observation blocker is resolved. Andy must still complete the real-account full ZIP backup to his Mac and close premedos.app on every device/tab before self sign-in. Neither precaution is yet confirmed complete. He can then sign into `http://127.0.0.1:53024/#/research` himself, requesting/opening the link in the same browser/profile. If prompted about synthetic Guest work, choose **“Use my account workspace and review this later.”** Keep recovery copies and Guest records separate; do not clear browser data.

Actual login, real-account cloud reload, and manual alpha checks remain **unperformed/unverified**. No agent login, sign-in email, account writes, runtime change, new build, merge, push, deployment or production unlock. S1 and separate release approval still block production. The earlier synthetic test evidence is unchanged.


### S1 integration prerequisites for a later T4 release — 2026-09-24

Source: Claude's prepared-S1 review at `docs/dev-workflow` revision `2ea9ad8`, `goals/reviews/2026-09-24-claude-S1-prepared-review.md`, relayed by Planning. This records future integration requirements; it does not revise the approved T4 build scope or authorize integration/release work.

Before T4 can release on top of S1:

1. Register `researchUpcomingItems`, `researchReminders`, `researchTimelineNotes`, and `researchMemberships` in S1's **`KNOWN_WORKSPACE_KEYS`** (the source for `DATA_KEYS`).
2. Set **`CURRENT_CLOUD_SCHEMA = 2`** under S1's contract. Top-level preservation alone does not protect T4's nested additions: hour-entry `thoughts` / `parentDeletedAt`, experience `research` / `estimatedHoursDeletedAt`, and `Person.bio`. Schema-1 clients must be prevented from overwriting schema-2 workspaces and dropping these fields. Cloud schema numbering is separate from T4's local store v51.
3. Add a regression using an **actual S1-era client** against a T4/schema-2 workspace. Exercise edits to the affected known records and verify full preservation or refusal before any replacement. Record the exact S1 client revision, T4 revision and guard configuration. A newly written T4-only guard test is not evidence that the old client is safe.
4. Re-verify the deployed revision at release time. Claude's Sep 24 review reports `https://premedos.app/release-assets.json` listing **`d60f682` then `5c7a3e4`**. This is attributed review evidence, not a fresh production check by this task. Keep the exact existing `5c7a3e4` compatibility evidence; include both historical clients where appropriate because old tabs may persist. Do not relabel old test results as tests against `d60f682` or a future release.

S1's own database/old-browser acceptance and production application are separate gates. **No rebase, merge, schema/code change, migration, push, deployment, production unlock or release was performed or authorized by this note.** The current preview and alpha evidence are unchanged.


### Andy-reported signed-in alpha and revised S1 blocker — 2026-09-24

**Human alpha feedback:** Andy said **“i already tried, ti's fine”**, then selected **“Signed in (real account)”**. Planning verified Claude user events `364ebbc8-3130-4674-9f91-aac1969efb80` at `2026-09-24T18:42:32.986Z` and `4bd5afde-a43e-4c23-9d20-17b630617678` at `2026-09-24T18:49:18.528Z`. Goal decision 28 at `docs/dev-workflow` revision `3307a8d` records this feedback and was read by this task.

Record this as **Andy-reported local-preview alpha feedback on his real account, before the `3f02a0a` visual fixes**. The exact alpha build revision is **unknown**; the event timestamps date the report, not proof of the tested artifact. It is not an independent observation of login, successful cloud reload/cross-device behavior, backup completion, closure of all live tabs, or every scripted acceptance case. Earlier statements that manual alpha was unperformed are superseded by this human report; the unverified acceptance checks remain unverified. Later automated and signed-out UI evidence for `3f02a0a` remains separate and is not attributed to Andy's earlier test.

**Reported real-row state:** Claude reports that Andy's cloud row contains new Research data without `_schema`. This task has not read or modified that row and has not added a marker. Do not treat the report as permission to inspect, stamp, migrate or otherwise write real account data.

**S1 release protection is unresolved:** Planning reports S1 local acceptance **FAILED at `3883610`** because `dashboardTransport` gzip/text wrappers hide logical schema and keys; old encoded-to-encoded writes can still lose newer data. A contract revision is pending. Revised S1 must explicitly handle existing unmarked rows and encoded rows, with evidence of preservation/refusal for the logical Research data. Merely deploying something called “S1,” or checking an outer marker/key set, does not establish that Andy's specific existing row is protected. Goal decision 28's “until S1 is live” wording therefore must not be treated as a sufficient safety gate by itself.

The prior S1 integration notes remain a record of the then-reviewed proposal. Before any eventual T4 integration/release, reconcile them with the revised approved S1 contract and prove protection across the applicable actual old/S1-era clients and encoded/unmarked formats. Exact historical test revisions remain unchanged; no failed acceptance is relabeled as passing.

No new code, schema, row read/write, rebase, merge, push, deployment, production unlock or release work was performed. This update records human feedback and reported blockers only. Production/release approval and demonstrated compatible protection remain outstanding.
