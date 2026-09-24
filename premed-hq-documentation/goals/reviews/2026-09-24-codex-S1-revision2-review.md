# S1 Revision 2 feasibility review — September 24, 2026

Reviewed: `docs/dev-workflow @ 175d8969feaf14d97f22108df26a6f2bb81adc95`, Revision 2 of `implementation/briefs/S1-sync-schema-guard.md`. Source comparisons: deployed-baseline `d60f682`, stale-tab `5c7a3e4`, prepared S1 `3883610`. This is source/documentation review, not execution of the proposed two-column schema. No new DDL, containers, production reads/writes, or implementation dispatch. The two-column expansion is not approved yet.

## Verdict

**The encoding-independent counter + schema-column approach is feasible and preferable to decoding gzip inside SQL. Revise the contract below before asking Andy to approve it.** It fences existing old writers after a correctly versioned claim; it is neither payload validation nor protection before the claim. A schema-1 claim is NOT sufficient protection for an existing T4/schema-2 workspace.

## Direct answers to the four questions

1. **PATCH: yes. Merge-upsert: yes for the actual omitted-column request shape, with a correction to the premise.** Both app revisions use conditional PATCH for existing rows and INSERT for absent rows; I found no production dashboard `.upsert()` call in either revision. `useCloudSync.ts:195`, `accountMutationSafety.ts:135,139,241` at d60f682 are the relevant writers. Do not call a synthetic merge-upsert test an observed old-app path.

   PostgREST v16.2 query generation builds UPDATE assignments from request columns. Its `MergeDuplicates` branch also emits assignments only for `iCols` (`QueryBuilder.hs:137`). Consequently an old single-object POST with merge-duplicates and keys user_id/data/updated_at leaves the two omitted columns unchanged on conflict, and the proposed exact-next-revision guard rejects a claimed row. Null/default filling of INSERT fields is not the same as overwriting every column on conflict. Explicit nulls, mixed-key bulk payloads, `columns` and `missing=default` still deserve separate tests; acceptance should assert unchanged data, timestamp and both contract columns for every rejected case.

2. **Old reads: yes by source inspection.** The main reader and mutation review readers select `data, updated_at`; MergeGate, FirstLoginSetupPage and MergePage select `data`. Extra columns are not returned. Even a `select('*')` transport response is structurally compatible: `dashboardTransport.ts:51–55` preserves row siblings while transforming only `row.data`. Its exact-two-key rule is inside the data envelope, so sibling columns do not violate it. Verify both real old browsers; this review does not close the prior Failed-to-fetch browser gap.

3. **Insert and lost CAS: workable, but specify the complete state machine and conditional-write protocol.** Preserve INSERT-on-absence (unique conflict leads to reread/review, never blind overwrite). For an existing legacy row, the first claim must be conditional on the exact reviewed `updated_at` plus both contract columns being null. Claimed updates compare the captured `write_rev` as well as the existing account/timestamp conditions, and send captured revision + 1. Two new writers then have one winner; the loser gets a zero-row CAS miss and reconciles. A blind new-client upsert can overwrite an existing unclaimed row and must not be introduced.

4. **Encoding can remain unchanged. The new metadata cannot.** Every dashboard reader/writer, baseline, review/recovery and local/backup version gate must carry the contract explicitly. Updating just DashboardRow and the main PATCH is insufficient. Details below.

## Required revisions

### A. Make the SQL state machine null-safe, immutable after claim and comprehensive

Define legal states: legacy = both columns NULL; claimed = valid positive cloud_schema and positive write_rev. Reject half-initialized, zero/negative and out-of-range states, and fail closed on malformed stored states. Legacy writes that omit both columns remain allowed. A first claim is valid only with write_rev=1; subsequent accepted writes increment exactly once and never lower or null cloud_schema. Do not auto-increment/default a missing revision on the server: that would authorize old writers too.

Use explicit null checks / `IS DISTINCT FROM` / acceptance predicate `IS NOT TRUE`, not only `IF NEW.write_rev <> OLD.write_rev + 1`: a NULL comparison does not evaluate true. A nullable CHECK alone can also pass an unknown result. Define valid old/new inserts, claim, subsequent write, and reject outcomes. First INSERT may remain compatible for old clients, but that does not justify accepting malformed claimed metadata.

**`BEFORE UPDATE OF data` alone is insufficient.** A metadata-only PATCH could clear the two columns without firing it, then update data as a legacy row. Guard changes to data, cloud_schema and write_rev (or every UPDATE) and prohibit unclaim/downgrade. Explicitly define metadata-only claim behavior if supported; do not accidentally add such a writer. DELETE/reinsert remains the already-declared limit; do not expand RLS/auth scope here.

Choose a JS-safe bigint representation. Either validate/cap write_rev to Number.MAX_SAFE_INTEGER everywhere (including DB) or use lossless decimal-string transport and arithmetic. Avoid silent JSON number rounding and bigint overflow at +1; tests must show deterministic rejection at the chosen bound.

### B. Carry row metadata through every account path; separate CAS misses from old-client rejection

At minimum update `supabase.ts` DashboardRow; all selects in useCloudSync/accountMutationSafety; public merge/setup readers before actions; `SyncBaseline` and its persisted version (`accountSyncSafety.ts:68–80` currently contains only digest/updatedAt); account conflict/raw recovery objects; first-login insert, device-choice replacement, normal upload, reset/restore reconciliation, account switches and readonly/future gates. Stale baseline records lacking the new metadata need a fresh read, not an invented revision.

Read the row's cloud_schema and reject unsupported future versions **before hydration/migration, asset sync, edits or preparing a replacement**. Every writer declares its own supported version; it never echoes a future version onto a rebuilt document. Metadata belongs to an account and reviewed row snapshot; never restore another account's write_rev from a backup. Use returned server metadata to confirm success.

Keep existing CAS predicates; add write_rev/null-state filters so ordinary concurrency is a zero-row result handled by reconciliation, not an incorrectly permanent “outdated tab” pause. Test a committed write whose HTTP response is lost: retry must retain the same attempted counter/predicate, then reread and reconcile; never increment blindly and resubmit stale data. Current cloudRequest retries transport failures, so this is a concrete writer requirement.

### C. Keep portable schema identity after moving enforcement out of data

The current S1 reader checks `input._schema` (`workspaceSchema.ts:15–32`), durable store snapshots use it, and JSON/ZIP/Drive backup paths carry AppData. Column-only schema information disappears when passing `row.data` into these paths. Dropping the marker without a replacement would make a newer backup/local snapshot look legacy and defeat Part 2's future-version block.

Define an explicit persisted/exported contract version and precedence with cloud_schema. A practical choice is to retain a logical `_schema` inside the decoded document as portable metadata while treating the sibling column as server authority; SQL no longer inspects the logical marker. Another versioned local/backup envelope is possible but is more work. Specify legacy absence, contradictions, future versions, raw recovery, offline reload, account switches and Drive/JSON/ZIP restore. A higher version in either trusted metadata location must not be silently stamped down. Do not conflate local store migration number, backup format and cloud contract. Both existing S1 and T4 use store v51, so local store version alone does not distinguish their compatibility.

### D. Fix the known T4 exposure statement and claim sequencing

The proposed sentence “protected after a post-S1 new client writes once” is too broad. An unmarked T4 workspace already contains nested fields requiring schema 2. If S1's schema-1 client claims it as 1, other schema-1 clients remain permitted to replace it; top-level opaque preservation alone does not prove nested-field preservation.

The named rollout case must use a **T4/schema-2-capable writer** or an explicitly designed, separately approved lossless transition that validates the existing data's required version. A schema-1 client must refuse to claim this known unsupported legacy shape, not stamp 1 and call it safe. Use synthetic T4 fixtures to design and verify this behavior; no access to Andy's row is needed for this review. No real-row read, inspection, stamping or repair is authorized.

Do not assume every undocumented legacy payload's version can be inferred perfectly. Bound detection to evidenced T4 signatures, fail safely for unresolved cases, and document limits. Opening the new app is not proof of a claim: current sync can skip equal/clean data. If claiming remains “next write,” the UI/checklist needs an actual verified claimed-write result before saying protection is active. Account remains exposed until then.

### E. Replace superseded requirements; finish rollout and acceptance definitions

The top amendment currently contradicts the lower mandatory sections (in-data marker writer, SQL omission tests, no row-shape change, old environment, original Done when). Consolidate them into one revised approvable contract; keep old approvals/history visibly limited to their revisions. The new override must cover the columns AND corresponding readers/writers/baselines/portable metadata/first-claim changes, not merely DDL.

Retain client logical-preservation tests and state the narrower server promise: it rejects known obsolete/nonconforming writers after claim. A conforming buggy client can still lose keys, and an intentional authorized caller can supply a counter; this is not payload validation or a new authorization boundary.

The migration leaves rows unclaimed, reloads/verifies PostgREST schema cache, and keeps old clients working before deployment. New clients must fail safely if columns are absent. Never deploy both the failed in-document guard and the replacement guard accidentally; the former rejects legitimate encoded transitions. No production v1 guard was applied. Keep rollback protected: dropping columns/guard after claims reopens loss and breaks new readers; prefer roll-forward with both columns retained. Update the obsolete marker repair runbook to match the approved column contract rather than silently retaining executable wrong-schema instructions.

Acceptance must include: real PATCH plus synthetic merge-upsert omission/null/default cases; unclaimed→claimed race against old writer; two new writers; competing inserts; lost response retry; unsupported future column before hydration; metadata-only downgrade/unclaim; malformed states and safe numeric bounds; both old builds and current in real browsers (resolve Failed to fetch first); all bare/gzip/text-JSON combinations; portable future-data block across reload/restore; synthetic unmarked T4 nested preservation/refusal; claimed status proof; cleanup. Re-run final tests/build/lint after source changes. The completed bare-SQL measurements and old hooks do not constitute Revision 2 acceptance.

## Evidence and primary references

- Local source at the revisions above; no shared sync/store/transport source diff between 5c7a3e4 and d60f682.
- PostgREST **v16.2**, tree `47ef77b88091ceeb570992dc775b8292b9c45907`: [QueryBuilder.hs](https://github.com/PostgREST/postgrest/blob/v16.2/src/library/PostgREST/Query/QueryBuilder.hs#L137), request-column-only merge conflict assignments. Source reading supports the inference; exact installed local runtime behavior still needs acceptance testing.
- [PostgREST tables/update/upsert reference](https://docs.postgrest.org/en/stable/references/api/tables_views.html): PATCH, merge-duplicates and explicit selection semantics.
- [PostgreSQL 17 triggers](https://www.postgresql.org/docs/17/sql-createtrigger.html): UPDATE OF fires for listed target columns, and upserts can execute insert/update triggers.
- [PostgreSQL 17 Read Committed](https://www.postgresql.org/docs/17/transaction-iso.html): concurrent update WHERE predicates are rechecked; supports the conditional counter approach.
- [PostgreSQL 17 constraints](https://www.postgresql.org/docs/17/ddl-constraints.html) and [PL/pgSQL conditionals](https://www.postgresql.org/docs/17/plpgsql-control-structures.html): explicit null-state validation is required.

No implementation approval is inferred from this review. Return the consolidated revision for review/Andy approval before dispatch.
