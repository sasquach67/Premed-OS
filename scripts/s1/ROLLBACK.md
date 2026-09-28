# S1 rollback, roll-forward and repair (column contract)

**Out-of-band only.** Nothing here is a migration, nothing here runs automatically,
and nothing here has been run against production. Every production step needs
Andy's separate, explicit approval for that step. No one reads, inspects or repairs
a real account row (including Andy's) without it.

This replaces the Revision 1/2 `INVALID-MARKER-REPAIR.md` (in-document `_schema`
marker), which described a guard that was never shipped. That file does not exist
on this branch and must not be revived.

## Prefer roll-forward

Once **any** row is claimed (`write_rev` is not NULL):

- dropping the trigger reopens the original loss: old tabs can again replace newer data;
- dropping the columns breaks every current client: they fail closed ("cloud sync is
  paused") because they will not write without the columns (brief item 15).

So fix problems by replacing the function in place (`create or replace function
public.guard_dashboard_write()`), which keeps the trigger and both columns. Re-run
`scripts/s1/run-local.mjs sql` against a disposable copy first.

## If a real rollback is unavoidable

Only with Andy's explicit production approval, in a maintenance window:

1. Stop dashboard writes (approved mechanism; none is implemented here).
2. Take and verify a backup of `public.dashboards`.
3. Run `scripts/s1/rollback.sql` (drops the trigger, the function, both columns, and
   reloads the PostgREST schema cache).
4. Accept the consequence: every current client shows "cloud sync paused" until the
   migration is re-applied; every claimed account is exposed to old tabs again.
5. Roll forward by re-applying `supabase/migrations/20260924233000_s1_dashboard_write_guard.sql`.
   Rows come back **unclaimed** (the counter history is gone), and current clients
   reclaim each row the next time they open it.

`run-local.mjs rollback-check` rehearses steps 3 and 5 in one rolled-back transaction.

## Repairing an illegal stored state

The guard fails closed on a stored state that is neither legacy (both NULL) nor a
valid claim: half-set, zero/negative, or `write_rev` above 2^53 − 1. Every write to
that row is rejected, including a client's attempt to "fix" it. The row's `data` is
never touched by the guard, so nothing is lost; the account is just read-only in the
cloud until repaired.

Repair, with Andy's approval for that exact row:

1. Read only that row's metadata (not its content): `cloud_schema`, `write_rev`,
   `updated_at`, and the document's logical `_schema` if it must be confirmed.
2. Choose the repaired values:
   - `cloud_schema` = the document's logical `_schema` (never lower than any value
     already present in either place; if they disagree, stop and ask);
   - `write_rev` = the old counter + 1 when it is valid and below the cap, otherwise 1;
   - `updated_at` = a **fresh** timestamp (`clock_timestamp()`), verified different
     from the value read in step 1. A client's compare-and-set matches on
     `updated_at`, `cloud_schema` and `write_rev` together, so the fresh timestamp
     alone guarantees no client still holds the repaired tuple, even when
     `write_rev` restarts at 1.
3. In one transaction, as the database owner, bypass user triggers for that single
   statement and change only the three metadata columns. Predicate on **all** the
   metadata read in step 1, null-safely, and roll back unless exactly one row changed:

   ```sql
   begin;
   set local session_replication_role = replica;   -- this statement only; not for app roles
   do $$
   declare changed int;
   begin
     update public.dashboards
        set cloud_schema = <verified>, write_rev = <chosen>, updated_at = clock_timestamp()
      where user_id = '<exact id>'
        and updated_at = '<updated_at read in step 1>'
        and cloud_schema is not distinct from <cloud_schema read in step 1, or null>
        and write_rev is not distinct from <write_rev read in step 1, or null>
        and clock_timestamp() <> '<updated_at read in step 1>';
     get diagnostics changed = row_count;
     if changed <> 1 then raise exception 'repair matched % rows; expected exactly 1. Rolled back.', changed; end if;
   end $$;
   commit;
   ```

4. Clients holding any pre-repair metadata get a zero-row compare-and-set, reread and
   reconcile. They never overwrite.

`scripts/s1/sql-tests.sql` section H rehearses this on a synthetic row.
