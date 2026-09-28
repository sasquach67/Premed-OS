# S1 + Research (schema 2): production-apply checklist

**Status: draft for Andy's decision. Nothing here has been run against production.** Every
step below needs Andy's explicit yes for the combined release. No step reads or writes a
real account's `data`. The metadata inspection in step 1 reads schema catalogs only.

- Code: S1 `s1/sync-guard-r3` at `4076ebd`, reviewed by the Claude planning chat (Sep 28).
  Combined client: `codex/s1-research-r3` at `8dd37c6f`, whose review belongs to the Codex
  parent.
- Migration: `supabase/migrations/20260924233000_s1_dashboard_write_guard.sql`.
- Evidence: `implementation/evidence/S1-r3/final-4076ebd/README.md`.

## 1. Pre-apply inspection (read-only, catalogs only)

1. **No other trigger on `dashboards`.**
   ```sql
   select tgname, pg_get_triggerdef(oid) from pg_trigger
    where tgrelid = 'public.dashboards'::regclass and not tgisinternal;
   ```
   Expect **no rows**. The client confirms each save only when the server echoes back the
   exact `updated_at` it sent. A trigger that rewrites `updated_at` (for example
   `moddatetime`, possibly created in the dashboard UI and absent from the migrations)
   would make every save stop with "The cloud did not confirm this save's version".
   If any row appears, **stop**.
2. **Columns absent:**
   ```sql
   select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'dashboards' and column_name in ('cloud_schema', 'write_rev');
   ```
   Expect no rows. The migration is idempotent, but an unexpected existing column means
   someone changed production outside the migrations. **Stop** and investigate.
3. **Migration history:** confirm production's applied migrations match `supabase/migrations`
   up to the one before S1. Also confirm the v1 guard (`dashboards_schema_guard`,
   `guard_dashboard_schema`) was never applied; the migration drops it if present.

## 2. Order (this matters)

1. **Apply the migration** to production. It claims no row, so there is no behavior change
   for anyone: the deployed `d60f682`/`230975d` apps keep working exactly as today.
2. **Verify through PostgREST** as an authenticated synthetic or test account (never Andy's
   row): `GET /rest/v1/dashboards?select=cloud_schema,write_rev&limit=0` returns 200. This
   proves the schema cache reloaded. Optionally repeat step 1.1 and confirm exactly one
   trigger, `dashboards_write_guard`.
3. **Deploy the client** (the combined schema-2 build).

**Reverse order fails closed, deliberately.** If the client deploys before the migration,
every signed-in user sees "Cloud sync is paused: the server has not been updated for this
version of Premed OS yet. Your changes are saved on this device." Nothing is lost and no
unguarded save happens, but sync stays off for everyone until the migration lands.

## 3. Andy's confirmed-claim check (hold 4)

1. Close or refresh **every** old premedos.app tab, on every device. A stale tab can still
   overwrite the unclaimed row until step 3 completes.
2. Open **one** current premedos.app tab and sign in.
3. Confirm Settings → Cloud sync shows **"Cloud protection: on"**.
4. Confirm the row metadata shows `write_rev = 1` (read-only: `cloud_schema`, `write_rev`,
   `updated_at` only). Make one small edit, and confirm it becomes `2`.
5. From then on, any old tab that tries to save gets "This tab is out of date…", and
   nothing is overwritten.

## 4. Rollback

See `scripts/s1/ROLLBACK.md`. **Once any row is claimed, roll forward only**: dropping the
trigger reopens the loss, and dropping the columns breaks every current client.

## Separate decisions for Andy (not S1 blockers)

- **DELETE hardening.** `authenticated` still has DELETE on `dashboards`, and the guard does
  not cover DELETE, so a hand-crafted DELETE followed by a legacy INSERT could bypass it. No
  deployed app deletes the row; account deletion goes through the auth cascade. Option:
  revoke DELETE from `authenticated` after confirming account delete does not rely on it.
- **`supabase/schema.sql` drift.** The run-once snapshot does not list the two columns.
  Option: add them so the snapshot matches the migrations.
- **Security headers.** `verify-production-security.mjs` fails all 5 header checks on
  premedos.app. The site is served by GitHub Pages (`server: GitHub.com`), which cannot set
  response headers, so every release fails this check, including today's `230975d`. This is
  a hosting decision (for example, the Cloudflare cutover), not an S1 code fault.
