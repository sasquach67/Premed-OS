# S1 + Research T4 release checklist

Prepared September 27, 2026 by Codex Planning. This is a concrete release checklist, not an approval record. Combined runtime: `8dd37c6f5df5b39328eae7dc8029a70a2f081b36` (schema 2, store 52), preserving main through `230975d`. Full suite: 2,285 tests; focused: 85; build passes; lint: zero errors. Evidence: `../evidence/S1-T4-integration-8dd37c6/` and the S1 revision-specific evidence directory. S1 schema1 alone must not deploy; Andy approved shipping it together with Research as schema2.

## Acceptance and review checklist

- Exact combined revision reviewed; S1 baseline/opaque-digest/runner findings closed.
- Store52 joins S1 and T4 store51 histories losslessly; all four Research collections registered; schema2 gate retained in exports/local/import/remote.
- Synthetic unmarked T4 row is claimed with exact logical preservation (apart from justified marker); subsequent edits keep collections and nested fields. Cover bare/gzip/text encodings; a pinned schema1 client refuses schema2.
- Actual pre-S1 writes to claimed rows rejected with unchanged server data, timestamp and counters; genuine concurrent writes reconcile.
- Final full tests, lint, build, dependency audit, live-security preflight, and route/preview behavior checked. Named failures remain blockers.
- Test resources stopped and synthetic data cleaned; no real row inspected.

Local acceptance is complete, including the returning-account browser check: reload opens Settings with protection on, no conflict, and no extra write. Final planning review and the existing public-host security failure remain release gates.

## Specific production permission still needed

The existing S1 brief requires Andy's explicit yes to apply the migration to the verified Premed OS Supabase production project. That permission covers exactly:

1. Verify table/column/trigger definitions and API schema availability (metadata only), and verify the target project matches the app deployment.
2. Apply `supabase/migrations/20260924233000_s1_dashboard_write_guard.sql`: two nullable columns, no defaults; insert/update guard; remove never-shipped v1 guard if present; reload PostgREST schema cache.
3. Verify installed columns/function/trigger and API select shape without reading account contents or changing any account row.

No bulk claims, account-content reads, real-row edits/repairs, RLS/auth changes or rollback permission is implied. The SQL does not claim existing accounts; the compatible client claims its own supported data after sign-in.

## Release order after all gates pass

1. Apply and verify the authorized DB migration first. Missing columns intentionally stop new-client cloud writes.
2. Merge only the reviewed combined S1/T4 release revision, including authorized Research route unlock; preserve current main changes. The normal final-app deployment policy covers this release once all review/testing/specific gates are cleared.
3. Confirm deployment succeeds, release-assets.json identifies the exact commit, and live signed-out/approved test-account acceptance and security verification pass.
4. Andy opens the released client himself and checks `Cloud protection: on`. Do not claim his account is protected merely because deployment or a local test passed. Dirty local changes may still need reconciliation separately.
5. Report live revision, evidence and any remaining limits. Roll forward on a guard issue; dropping protection reopens old-client overwrite risk and needs a separate decision.

## Current external blocker

The public site's `verify-production-security.mjs` check currently fails CSP, HSTS, Referrer-Policy, Permissions-Policy and X-Content-Type-Options headers. This predates S1. Resolve through the approved hosting/release work; do not waive or silently remove the check. No hosted configuration changed during this task.
