# D9a · Syllabus ingestion — close the four gaps

**Follow-up to `D9-syllabus-ingestion.md`, which shipped in `69a0b41`.** Read only this file plus the references below. If something you need isn't here, read `tabs/01-academics.md` §4.1-M and **tell me the brief was incomplete.**

**What already works and must not regress:** client-side-only parsing, the key-free deterministic parser, `evidence.quote` + `location` on every item, `searched[kind]` naming what wasn't found, scan detection, the weight-gap warning that explicitly does not normalise, `AnimatedFileUpload` reuse, `useToast`. **Verify these still hold when you're done.**

---

## Gap 1 ⭐ — parsed grade weights are discarded on Apply

**Today:** `importSyllabus()` writes `units → topics` and `exams/deadlines → assignments`. **`weights`, `policies`, and `logistics` items are parsed, validated against 100%, displayed with their source text — and then dropped.**

**The cause is not carelessness: there is no destination.** `grep` finds no `GradeCategory`, no weight field on `ClassWorkspace`, nothing. **§6.8's grade ledger has no brief and is not built**, so the parse has nowhere to land.

> **⚠️ This is the highest-stakes field on the review screen** (§4.1-M-c: *"a mis-parsed weight corrupts every downstream projection"*). Validating it and then throwing it away is worse than not parsing it — the student confirms a number that silently evaporates.

### Build a minimal parked entity — NOT the ledger

```ts
export interface GradeCategory {
  id: ID
  courseId: ID
  name: string          // "Problem sets"
  weight: number        // 15  (percent, not fraction)
  policyNote?: string   // "lowest quiz dropped" — verbatim, unparsed
  source?: string       // evidence.location + quote, same shape assignments use
  createdAt: number
  updatedAt: number
  order: number
}
```

- **Store it, surface it in the class page as a plain editable list, and compute nothing from it.**
- **⚠️ Do NOT build the weight engine, projections, "what do I need?", drop-lowest handling, or any letter-grade math.** That is §6.8 and it needs its own brief. **A half-built projection is exactly the "if the projection is ever wrong, the user stops trusting the number" failure §6.8 opens with.**
- **`policies` items land in `policyNote` as verbatim text**, attached to the whole course where they don't map to one category. **Never parse a policy into behaviour in this chunk.**

### Logistics is different — its destination already exists

`ClassWorkspace` already carries `instructor`, `meetingDays`, `meetingTime`, `location`. **Wire parsed `logistics` items into those fields on Apply.** No new entity. **Only fill fields the student left empty** — never overwrite something they typed.

## Gap 2 — `Add manually` destroys the proposal

**Today:** `onClick={() => setProposal(null)}` at `ClassCenter.tsx:2076`. Clicking it under *any* group discards **everything parsed** — the opposite of adding.

**Fix:** append one empty, editable item to **that group only**, focused, with `confidence: 'low'` and no evidence. **The rest of the proposal is untouched.**

**Why it matters beyond the bug:** this affordance exists for the case §4.1-M-d doesn't cover — a parse that is confidently *incomplete*, 8 assignments found where there are 12. It is the only path for the missing 12th, and today it deletes the 8.

## Gap 3 — Apply doesn't state its consequence

**§4.1-M-c is explicit:** *"Apply is one action and states its consequence: 'Adds 9 units, 12 deadlines, 3 exam dates, and 5 grade categories to CHEM 262.'"*

- **Real counts from the current proposal**, recomputed as the student edits or removes items.
- **Names the class.** For unscoped cold-start entry, the name comes from the `Which class is this?` block.
- **Only lists non-zero groups.** *"Adds 9 units and 3 exam dates to CHEM 262"* — never `0 deadlines`.

## Gap 4 — re-import diff is not built

**§4.1-M-d.** `grep` finds no diff or re-import path. Entered from **Materials → the existing syllabus row → `Re-import`**.

- **Three-way: added / changed / removed.** Old and new side by side, **each item individually accept-or-keep.**
- **⚠️ Confirmed data is never silently overwritten.** Default on every changed row is **keep**, not accept.
- **Unchanged items are collapsed and counted, not re-listed.**
- **Match on stable identity, not array position** — title + date for assignments, title for topics. **A syllabus that inserts one week must not read as "every later week changed."**
- **Removed does NOT mean delete.** Flag it, let the student choose. A student may have added work the syllabus never listed.

## References

| What | Where |
|---|---|
| Spec | `tabs/01-academics.md` §4.1-M-c (Apply, review), §4.1-M-d (failure, re-import) |
| Grade ledger — **read to know what NOT to build** | `tabs/01-academics.md` §6.8 |
| Prior brief | `implementation/briefs/D9-syllabus-ingestion.md` |
| Mockup + decisions | `specifications/mockups/01-academics/academics-syllabus-import.html` · `.md` |
| Exact values | `specifications/mockups/_shared/_visual-recipes.md` — **literally, never approximated** |
| Universal rules | `general.md` — **`U-5`, `U-8`, `U-9`** |

## Done when

- [ ] A `GradeCategory` entity exists; parsed weights survive Apply and appear as an editable list on the class page.
- [ ] **No projection, letter grade, "what do I need?", or drop-lowest math exists.** Grep proves it (§6.8 not started).
- [ ] Policy items persist as **verbatim text**; nothing parses a policy into behaviour.
- [ ] Parsed logistics fill `instructor` / `meetingDays` / `meetingTime` / `location` **only where empty**.
- [ ] `Add manually` appends one empty item to **its own group**; the rest of the proposal survives. **Verified by adding under one group and confirming the others remain.**
- [ ] Apply states real, live-recomputed counts and names the class; **zero-count groups are omitted**.
- [ ] Re-import shows added / changed / removed, per-item accept, **default keep on changed**, unchanged collapsed and counted.
- [ ] Re-import matches on identity, not index — **verified by inserting a week mid-syllabus and confirming later weeks are not all "changed."**
- [ ] Removed items are flagged, never auto-deleted.
- [ ] **Still true from D9:** no file bytes leave the device · parser runs with no API key · weight gap shown without normalising · `AnimatedFileUpload` not forked · one toast system · no completeness score.

## Commit

```
fix(academics): persist syllabus weights and add re-import diff (§4.1-M)
```

**Unrelated working-tree changes commit separately.** ⚠️ At time of writing the tree holds uncommitted spec edits, `mockup-lab/` changes, a **deleted** `academics-requirements.html`, and `data/research-only/` — **none belongs in this commit.**
