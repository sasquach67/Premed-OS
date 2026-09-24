# T4 Research build evidence — 2026-09-24

Scope: approved brief revision `5c0ff8fa6c02c7e8bbcc9a4bba102257df6c63cf`, pinned in documentation revision `3a22d1d2c2163bf2c40782da77ef8379c2b0bcdf`. Branch `research/t4-first-release`, base `5c7a3e4f1c28c3b36392815c0a63fe3c963cb225`. No release, main merge, production unlock, or real-account writes.

## Automated evidence

- Full suite: **289 files / 2,177 tests passed**, `npm test -- --maxWorkers=2`, 150.05 seconds. Log: `/tmp/research-t4-final-tests.log`.
- First run found one obsolete version-50 cold-entry fixture. It now uses `CURRENT_STORE_VERSION` while retaining byte-for-byte preservation assertion; no production behavior was loosened.
- Full lint: **0 errors, 55 warnings** (existing files), `/tmp/research-t4-full-lint.log`. Focused final UI lint: no diagnostics, `/tmp/research-t4-final-focused-lint.log`. Recovery-label lint: no diagnostics, `/tmp/research-t4-recovery-lint.log`.
- Build flag off and on both passed `npm run build` (TypeScript plus Vite). Final on artifact: `dist/research-on`. Off artifact: `dist/research-off`. Existing bundle-size warning remains.
- `node scripts/research/audit-controls.mjs`: **32 controls inspected across 6 Research and shared component files; 0 inert controls. Submit buttons require an ancestor form with onSubmit.** This proves handler wiring, not every possible interaction.
- Final recovery-label change followed by focused Research UI/persistence tests: **14 passed**, `/tmp/research-t4-recovery-tests.log`.
- `src/store/researchData.test.ts`: structural/semantic validation, additive migration, original records and long text retained, repeated migration, deleted estimates and parent/person lifecycle.
- `src/lib/research.test.ts`: fixed term windows, leap/date boundaries, search/ranges, zero-hour rows, distinct positive lab days, estimates, multiple labs, archived/deleted entries, goals and projections.
- `src/pages/Research.test.tsx`: rejected and pending durable saves, retained drafts, duplicate-submit prevention, zero-hour Thoughts, search/edit/delete, full-week pagination totals, empty Earlier notes, cloud-pending text, period precision, access to empty second labs, stale contact-date regression, shared capture compatibility.
- `src/store/researchPersistence.integration.test.ts`: actual IndexedDB commit/cold reload, JSON and real ZIP round trips, remote outgoing payload validation/account activation, rejection and account-switch isolation. Cloud service is mocked; these are **not live cloud checks**.
- Merge tests exercise Research collections with parents/hours/people/organizations, the separate Notes merge area, and record-based guest-work detection including zero-hour logs.

## Observed local browser checks

All writes used synthetic records in a fresh **signed-out** local origin `http://127.0.0.1:53024`. No demo seed and no real account data. Separate test-account alpha is still pending.

| Check | Observed result |
| --- | --- |
| Built flag-off route | `http://127.0.0.1:5198/#/research` showed reserved Research page and Research Soon navigation. |
| Built flag-on route | Research page and available Research navigation agree. |
| Empty state | Local profile, 0 term/total/lab days, no goal, single Add your lab action; no invented lab/person/log. |
| Lab | Added Example Lab with Biology, Example University, and free-text Fall 2026; survived reload. |
| Quick capture | Default date, 1.5 hours, Reviewed protocol, no Thoughts: **422 ms** from first automated fill to new row and durable Saved on this device confirmation. This is automation timing, not a human usability study. Signed out, so cloud timing is unavailable. |
| Totals | 3 h + 1.5 h on the same date = 4.5 h and 1 lab day. Search left these header statistics unchanged. |
| Zero hours | Observed setup + Thoughts, no hours: No hours recorded; searchable by Thoughts; sums unchanged. |
| Edit/delete/restore | Changed that entry to 2 h: 6.5 total; delete: 4.5; Trash restore: 6.5; reload: still 6.5 and one day. |
| Working rail | Upcoming, reminders and timeline added, edited, reloaded, removed and reloaded. Reminder reorder visibly moved Check inventory above Label tubes first. |
| Manual PI date | Keyboard-edited Sep 23, saved and observed after reload. Browser automation date-fill alone did not dispatch the same effective change; keyboard editing was used for the actual check. |
| People | Created Alex Example with shared bio, lab role and project; edited project and reloaded. Unlink removed card but existing-person picker still offered the same Person ID; explicit relink worked. |
| Keyboard | Log action focuses What I did; Tab reaches Save; native date keyboard editing saved. Automated coverage is not a full screen-reader audit. |
| Recovery | Link reaches Settings Archive/Trash. Final labels expose Hour entries and Research labels, not new collection implementation names. |

## Visual measurements against approved B

Reference: `mockup-lab/06-research/research-lab-log.html` at `3a22d1d`, `variant=B`. Read its actual CSS. Browser `getComputedStyle` yielded:

| Property | Approved CSS | Observed light / dark |
| --- | --- | --- |
| Body background | #f7efe1 / #211e1a | rgb(247,239,225) / rgb(33,30,26) |
| Muted row surface | #efe6d4 / #322e28 | rgb(239,230,212) / rgb(50,46,40) |
| Card surface | #fffaf0 / #2b2722 | rgb(255,250,240) / rgb(43,39,34) |
| Border | #e9e2d5 / #3c352d | rgb(233,226,213) / rgb(60,53,45) |
| Base / heading | 12px / 24px | 12px / 24px; Nunito / Baloo 2 |
| Panel radius / gap | 10px / 12px | 10px / 12px |
| Desktop columns | 1.55fr / 1fr | 709.957px / 458.047px at 1422px viewport |
| Mobile | One column below 760px | **375px client width = 375px scroll width**, both themes; panels 343.559px wide at x=15.998px |

The browser was at 0.9 zoom, so viewport capability width 338 produced the measured 375 CSS pixels. Override reset afterward. Both light and dark desktop screenshots were inspected. Header uses the existing PageHeader shell with a scoped token-based gradient; its decorative gradient/glass is not a pixel-identical copy of the standalone mockup. Shared control sizes and accessible labels are retained. Exact visual promotion remains for Claude review, alongside the missing authenticated alpha proof.

## Blockers and promotion status

1. **Production blocker — demonstrated old-client data loss.** See `T4-old-client-compatibility.md`. The actual production-base client accepts new data, then drops all four new collections on an unrelated write. The reproducible probe reports 1 compatibility case plus 47 existing safety tests passing while asserting that loss. A separate shared-sync brief is required; no fix was smuggled into T4.
2. **Authenticated alpha blocker — test account not supplied/confirmed.** Public Supabase configuration is available, but no separate test-account session has been selected. Live cloud save/reload, offline/rejection experience, and cross-device checks are unverified. Synthetic integration tests do not replace them.
3. **Not promoted to built.** Core geometry/surface measurements, wiring, local persistence, empty-state and commit evidence exist. Authenticated integration proof and Claude's final fidelity review remain. Mockup promotion markers and planning board are unchanged.

## Test-account checklist / handoff

- Open local preview `http://127.0.0.1:53024/#/research` while its server is running.
- Sign in only with the separate disposable test account. Do not open that account in the old production app.
- Confirm guest merge with synthetic Research records/notes; save a new log with Thoughts and one record in each working-rail collection, then reload from cloud and switch account away/back.
- Exercise network-offline and rejected cloud write; device acknowledgment must remain distinct from sync status.
- Claude reviews branch diff and this evidence. Planning owns the board and notification to Claude. Release requires a separate brief after compatibility passes.


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
