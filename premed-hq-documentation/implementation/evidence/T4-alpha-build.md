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
