# Generation · Phase 1 — the spine, with no new artifact

**Stage:** C · DECIDED, NOT BUILT · **EXECUTED Aug 19, 2026**
**Spec:** `specifications/generation/09` §3 Phase 1, `01` §2, `02` §1–2

---

## 1. Audit — **Phase 0 is already done**

`09` §3 lists four Phase-0 blockers. Checked one by one against the code today,
**three are complete and the fourth is built as a mechanism**:

| Phase-0 item | State |
|---|---|
| §2.1 Invert chunk transport (**D-3**) | ✅ **Done.** `GapCheckRequest` sends `chunkIds`; the function retrieves from `academic_source_chunks` ([index.ts:93](../../../supabase/functions/study-tools/index.ts)) and never trusts client source text |
| §2.2 Delete the placeholder generator | ✅ **Done.** `grep -rn "aiPracticeService" src/` returns nothing |
| §2.3 Disclosure + deletion | ✅ **Done.** First-use gate at [AcademicRecallSession.tsx:191](../../../src/pages/AcademicRecallSession.tsx); `deleteSources()` wired into Settings |
| `claim_ai_request` weighting | ✅ **Mechanism built.** `AI_REQUEST_WEIGHT` exists and is passed as `p_weight`; it holds one entry because one artifact exists. Per-artifact weights arrive with the artifacts |

**So this brief is Phase 1, not Phase 0.** Also confirmed since the last audit:
the function **is now deployed** and `ANTHROPIC_API_KEY` **is set** — the two
things that were previously blocking.

---

## 2. What Phase 1 is

> **Ships:** better gap-check, versioned. **Risk:** low. **Proves:** the architecture.

Build the layer stack and **refit gap-check onto it as its first consumer** —
the only working generation feature, small, with an output shape already
validated. Refitting proves the architecture on something whose correct
behaviour is already known, and fixes audit **A2**: gap-check currently ships a
three-sentence prompt written inside the edge function.

**No new artifact type ships in this phase.**

---

## 3. The work

### `src/lib/generation/` — the layout `01` §2.1 requires

The anti-monolith rule is explicit: *"do not bury all generation behavior
inside one hard-coded API route"*, and **"the edge function becomes transport
and enforcement only … it contains no pedagogy."**

1. `types.ts` — `SourceMode`, `GenerationControls`, `LayerRule`
   (`{ id, text, kind: 'invariant' | 'tunable' }`), `AssembledRequest`.
2. `layers/global.ts` — **all 49 L1 rules transcribed from `02` §1** with their
   ids and their invariant/tunable classification. Ids are the contract: `05`
   presets and `08` checks reference them by id.
3. `layers/sourceModes.ts` — the three modes and what each admits
   (`SOURCE_ONLY` / `…CLARIFICATION` / `…BACKGROUND`), including **D-1**: under
   `…BACKGROUND` the header always carries a non-dismissible count.
4. `artifacts/registry.ts` + `artifacts/gapCheck.v1.ts` — L2 for the one
   artifact that exists today.
5. `assemble.ts` — `assembleGenerationRequest()` per `01` §2:
   **pure**, same inputs → same `systemPrompt` and same `specHash`.
   - **`specHash` is a content hash of L1+L2+L3+L4 as resolved.** It is what
     answers "did this change because I changed the prompt, or because the
     model moved" — the question the audit found unanswerable.
   - **The assembler rejects at build time any preset or preference targeting
     an `invariant` rule id** (`01` §1.1). That is a unit test, not a code
     review.
   - Layer resolution stays inspectable: the result records which layer set
     each resolved control.

### Refit gap-check

6. The client sends `specId`, `specHash`, and the assembled `systemPrompt`
   alongside its existing `chunkIds`.
7. **The edge function keeps its current prompt as a fallback** when those
   fields are absent, so a function that has not been redeployed keeps working
   exactly as it does today. **The redeploy is Andy's** — one command.
8. Nothing about auth, rate limiting, retrieval, or citation verification
   changes. The function still owns all four.

### Tests

9. `assemble.test.ts` — purity (same in, same `specHash`), a different preset
   changing the hash, an invariant-targeting preference **throwing**, and
   layer-resolution provenance being recorded.
10. `global.test.ts` — a **drift test**: every `G-*` id in
    `02-global-rules-and-source-modes.md` appears in `global.ts`, and vice
    versa. The doc is checked in, so this stays honest as the spec moves.

---

## 4. Do not break

- **No pedagogy in the edge function.** Prompts ship with the client build,
  versioned in git, reviewable in a diff.
- No new artifact type, no study guide, no flashcards, no summaries.
- Gap-check's request/response shape and its citation verification are
  unchanged — `validateResult` stays the load-bearing check.
- A preset or preference may never override an `invariant`.
- No new dependency.
- MCAT generation stays restricted; `generationPolicy.ts` remains the gate.

## 5. Done when

- [x] `src/lib/generation/` exists in the `01` §2.1 layout.
- [x] All 49 L1 rules are present with ids and classification, drift-tested
      against the spec document.
- [x] `assembleGenerationRequest` is pure and stamps a `specHash`.
- [x] A preference targeting an invariant throws, with a test.
- [x] Gap-check sends the assembled prompt; an un-redeployed function still works.
- [x] Build passes; suite green.

## 5a. ⚠️ One action left, and it is Andy's

**Redeploy the function** so gap-check uses the assembled prompt rather than
its fallback:

```
npx --yes supabase@latest functions deploy study-tools
```

Until then everything still works — the client sends the spec, the deployed
function ignores fields it does not know, and its own three-sentence prompt
runs exactly as before. **Nothing breaks either way**, which is the point of
shipping the fallback.

## 6. Commit

`feat(generation): add the layer stack and refit gap-check onto it (Phase 1)`

## 7. Next stage

Phase 2 — structured output and the two-pass pipeline, which `09` §6 names as
**the one to de-risk first** and recommends prototyping against one real
lecture's chunks before committing to Phase 3.
