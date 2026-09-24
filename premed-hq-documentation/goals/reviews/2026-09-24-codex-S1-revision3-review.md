# S1 Revision 3 contract review — September 24, 2026

Reviewed the actual rewritten brief at `docs/dev-workflow 779ec6ee564b662daf19a9598ac7a8c37760e423`, not the earlier incorrect d1b51e4 pointer. The rewrite is present. This is a planning review only; no implementation, local schema changes, production access or release.

**Verdict:** the central design and A–E corrections are sound. Three remaining contract clarifications should be incorporated before Andy approves the exact revision. These resolve ambiguous behavior, not additional features.

## 1. Explicit portable-marker/column read cases (items 9, 11, 13)

“Block if they disagree” and “a missing marker means legacy” are insufficient together for nullable columns and a portable marker. Write the cases:

- Both row metadata columns NULL and logical `_schema` absent: legacy candidate, but perform the evidenced T4-signature check **before destructive hydration/migration or snapshot rebuilding**, not just immediately before the claim.
- Both columns NULL and a valid logical `_schema` present: unclaimed, portable-versioned data. Apply the logical version gate; a supported version may undergo the authorized claim/upgrade. Do not treat null vs a present logical marker as a contradiction that blocks all such rows. A future logical version blocks and preserves raw recovery.
- Claimed row: require a present, valid logical marker equal to `cloud_schema`; missing marker is a mismatch, **not permission to treat the claimed row as legacy**. Higher version in either location blocks; invalid metadata fails closed.
- An offline snapshot/backup has no server-column context. Its logical marker is the portable gate; it does not confer a server claim or supply an account's write_rev.

Schema-1 refusal for unmarked T4 signatures must cover local recovery/import as well as the remote first claim when those paths otherwise hydrate or rewrite the data. Keep detection bounded; do not broaden into a universal version-inference system.

## 2. Define the exact claim payload (items 10, 11, 14)

An unmarked legacy document cannot be saved literally unchanged while also satisfying “on write, the two [schema versions] must be equal.” Define “same content” as **the exact decoded, reviewed remote payload with only the justified portable `_schema` addition/upgrade**, plus row metadata and the intentional updated_at change. Preserve all known, unknown and nested fields losslessly. No implicit restore, local-device replacement, seed defaults, domain migration, or privacy-filter rewrite is authorized merely by automatic claiming.

Use that captured remote revision for the conditional claim. If a legitimate migration/content update is needed, perform it as a separately validated supported-version normal save, or block the claim until it is ready. Do not overwrite the current dirty/offline local workspace during this metadata transition: maintain existing reconciliation/conflict behavior, invalidate/rebase its remote baseline correctly, and distinguish claim acknowledgement from “all local edits synced.”

Add two synthetic checks: (a) decoded data before/after claim is identical apart from the portable marker, including nested T4 fields and encoded Unicode; (b) dirty local data survives claiming and a concurrent old-client write/CAS miss. Only a supported, acknowledged row revision yields “Cloud protection: on.” This closes the ambiguity without adding a new user workflow.

## 3. Make missing-column behavior unambiguously fail closed (item 15)

“Fail safe (no claim, clear status) and don't break sync” can be read as permission to fall back to the old writer. State: absent/stale API schema columns mean **no cloud writes and no fallback unguarded upload**. Keep local edits durable, show that cloud sync/protection is unavailable, preserve applicable recovery/backup fences, and re-read metadata after the deployment/cache problem is resolved. Do not pretend sync is successful. Existing legacy clients staying functional before the migration is a separate rollout property, not a fallback for the new client.

## No further objections

Every-UPDATE fencing, legal states/counter bounds, conditional CAS, non-auto-increment, portable version identity, schema-2 sequencing, no bulk claims, removal of the old guard, protected roll-forward and remaining real-browser acceptance are addressed. Exact-key old decoding remains unchanged. The two-column/client-path override and combined S1/T4 sequencing still need Andy's recorded approval; integration is not a release approval. Prior SQL/test evidence is not Revision 3 acceptance.
