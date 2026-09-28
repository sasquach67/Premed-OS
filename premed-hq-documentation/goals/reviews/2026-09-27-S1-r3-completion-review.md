# S1 Revision 3 completion review — September 27, 2026

Codex Planning review. This records evidence and remaining gates; it is not production authorization.

## Closed findings

- **Legacy baseline compatibility**: adding `_schema` to digests falsely classified unchanged cloud data as a conflict against pre-S1 baselines. Fixed at `6e01440`; the fixture uses the actual `d60f682` algorithm.
- **Opaque `digest` collision**: arbitrary account data could be mistaken for a precomputed baseline. Fixed with separate record/rebase APIs at `6e01440`. Independent review: 63 tests passed.
- **Acceptance exit status**: browser runner now exits nonzero on failed or empty runs (`b82692d`); cleanup and reporting remain intact.
- **Empty Research collections during upgrade**: the combined client first compares exact hashes, then permits only four empty Research arrays in a compatibility fallback. Nonempty collections and nested/opaque content remain significant. Independent review at `dd5e24f`: 99 tests passed, no findings. `27eed33` adds the required fresh lease check after awaited comparisons.
- **Repair tuple reuse**: the out-of-band runbook now matches the full reviewed metadata tuple, requires exactly one row, and changes `updated_at` so a held pre-repair CAS tuple cannot replay (`4734662`). Local SQL rehearsal passes. No real repair is authorized or performed.

## Reload finding closed

The combined real-API fixture found a bare-JSONB reload failure while gzip and text passed. A field-by-field diff was empty. Independent source review identified full-snapshot `JSON.stringify` equality in `assertDurableWorkspace`: PostgreSQL object-key ordering plus hydration normalization can reject identical logical data.

Fixed at `ed6acff`: full logical JSON equality ignores object-key order only. Independent narrow review found no actionable issues. The regression was verified to fail with the old comparison. The guard must retain array ordering, every value, metadata and private fields; `syncContent` is unsuitable because it filters fields. Unit and store regressions cover reordered keys, changed values and array order. The final real-API and returning-account browser checks pass, as recorded below.

## Revision-bound evidence

Historical acceptance at `7cf5bbc`: 54 SQL cases, 23 PostgREST cases, 20 hook cases for each old client, 23 current hook cases plus missing-column refusal, and 21 real-browser scenarios with 135 assertions. These results do not prove later changes.

At `4734662`: full suite 289 files / 2,208 tests passed; build passed; lint zero errors. SQL now passes 57 cases, including the corrected repair. Combined fixture uses runtime `a054d407` with all current-main Academics changes through `230975d`; reload acceptance remains open as described above. Final post-fix evidence must be recorded below before release.

The current production dependency audit reports zero vulnerabilities. The existing production security-header check fails CSP, HSTS, Referrer-Policy, Permissions-Policy and X-Content-Type-Options. This predates S1 and has not been waived.

## Release boundaries

The already-approved T4 integration uses schema 2 and store version 52, preserving both historical version-51 migration paths. Four Research collections are registered. Research remains preview-only until release readiness is confirmed. No extra Research feature scope is introduced.

The explicit production database-apply checklist remains required by the S1 brief. Final verified app work deploys by default under Andy's newer standing instruction, while pending user review/testing and specific database/account/security gates remain. No real account contents have been read or modified for this work.

See `implementation/briefs/S1-T4-release-checklist.md` for the exact proposed migration scope, deployment order and Andy's server-confirmed protection check.

## Final automated verification

Combined runtime `8dd37c6f5df5b39328eae7dc8029a70a2f081b36` passes 298 files / 2,285 tests, 85 focused tests, build, and lint (zero errors, 55 existing warnings). The source tree is `ac34252cd1afd5051b065ed372c84964c1291083`; logs are preserved in `implementation/evidence/S1-T4-integration-8dd37c6/`.

S1 runtime last changed at `ed6acff`; final standalone checks at `4076ebd` pass 290 files / 2,212 tests, build and lint. Real local API acceptance passes 25 current-client cases, with one missing-columns-only case separately covered in the historical fixture. The combined five-case API fixture at `8dd37c6` passes exact unmarked Research claim, later save and reload for bare/gzip/text, plus schema-1 upgrade.

The final browser reports initially passed 10 current-client scenarios and three combined scenarios. Those injected-session fixtures did not mark first-login review complete; their reload assertions prove durable storage only, not a usable returning-account route. This limitation was identified during evidence review. A separate returning-account scenario must close it before a normal-reload UI claim.

## Returning-account browser closure

`browser-returning/browser-report-combined.json` records the exact combined runtime `8dd37c6f5df5b39328eae7dc8029a70a2f081b36`. Its reviewed-onboarding fixture passes all 10 assertions: Settings after reload; no account conflict/paused sync; server-confirmed protection on; saved theme applied; zero reload writes; every T4 field preserved. The original injected-session reports remain unchanged as narrower durability evidence.

No remaining source-code findings from Codex review. Local implementation/acceptance is complete. Production is not applied or deployed; the explicit DB checklist, final planning review, and preexisting hosting-security gate remain.
