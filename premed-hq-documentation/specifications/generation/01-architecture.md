# 01 · Proposed generator architecture

**Deliverable 2.** Plus versioning (your §7) and source traceability (your §8), which are
architectural rather than per-artifact.

---

## 1. The layer stack

Six inputs assemble into every request. The first four are the specification; the last two are the
request itself.

```
L1  GLOBAL LEARNING RULES        ── every educational artifact, always
L2  ARTIFACT GENERATOR RULES     ── study-guide-v1 | flashcards-v1 | …
L3  PRESET / STYLE RULES         ── premedOS Default | Concise Cloze | …
L4  USER PREFERENCES             ── persistent, per student
    ─────────────────────────────
L5  SOURCE MATERIAL              ── retrieved chunks + slide positions
L6  IMMEDIATE REQUEST            ── this topic, this scope, this action
```

**Precedence: L1 > L2 > L3 > L4.** Later layers may *narrow, weight, or elaborate* earlier ones.
They may never contradict them.

### 1.1 Invariant vs tunable

Every rule in every layer is declared one of two kinds. This is what makes "user preferences must
not override factual or safety constraints" enforceable rather than aspirational.

| Kind | Meaning | Who may change it |
|---|---|---|
| `invariant` | Factual fidelity, safety, scope, citation integrity | **Nobody.** Not a preset, not a preference, not the request |
| `tunable` | Density, depth, tone, format preference, coverage | Any later layer |

The assembler **rejects at build time** a preset or preference that targets an `invariant` rule id.
That is a unit test, not a code review.

```
"Do not invent facts not supported by the source"        → invariant
"Prefer concise tested answers"                          → tunable
"MCAT: qbank questions must be externally sourced"       → invariant
"Use tables when comparison improves comprehension"      → tunable
```

### 1.2 What each layer contributes

| Layer | Contributes | Example |
|---|---|---|
| L1 | Shared pedagogy + fidelity rules | "Explain relationships, not isolated facts" |
| L2 | Artifact objective, required structure, output schema, artifact-specific rules | Study guide: AT A GLANCE → full-detail sections → FINAL SYNTHESIS |
| L3 | Weighting of tunables | Exam Cram: explanation depth low, high-yield weight high |
| L4 | Per-student overrides of tunables | "I prefer cloze"; "no analogies" |
| L5 | Retrieved chunks with `chunkId`, `fileId`, offsets, `sourcePosition` | The actual lecture text |
| L6 | Scope and action | "Topic: Glycolysis. Action: generate. Coverage: full." |

---

## 2. The assembler

One function. Deterministic, pure, and unit-testable without a model.

```
assembleGenerationRequest({
  artifact: 'study-guide',   version: 'v1',
  scope:    'academics',     courseId, topicIds,
  preset:   'premedos-default',
  preferences: UserGenerationPreferences,
  sourceMode: 'SOURCE_PLUS_CLARIFICATION',
  controls: Partial<GenerationControls>,   // request-level overrides
  action:   { kind: 'generate' | 'regenerate-section' | … },
}) → AssembledRequest {
  specId: 'study-guide-v1',
  specHash: string,              // content hash of L1+L2+L3+L4 as resolved
  systemPrompt: string,
  outputSchema: JSONSchema,
  resolvedControls: GenerationControls,
  sourceMode, chunkIds: string[],
}
```

**Properties that matter:**

- **Pure.** Same inputs → same `systemPrompt` and same `specHash`. This is what makes A/B testing
  and rollback real rather than nominal.
- **`specHash` is stamped on every stored artifact.** Answers "did this change because I changed the
  prompt, or because the model moved" — the question the audit found unanswerable today.
- **Layer resolution is inspectable.** A debug view can show which layer set each resolved control.
  Build this early; you will need it the first time a preset misbehaves.

### 2.1 File layout — the anti-monolith requirement

Your §7: *do not bury all generation behavior inside one hard-coded API route.*

```
src/lib/generation/
  index.ts
  assemble.ts                  ← the only place layers combine
  types.ts                     ← shared TS types
  schemas/
    studyGuide.v1.ts           ← JSON Schema + TS type, adjacent, drift-tested
    flashcards.v1.ts
    diagram.ts                 ← shared visual primitives
  layers/
    global.ts                  ← L1
    sourceModes.ts             ← the three modes
    presets.ts                 ← L3
    preferences.ts             ← L4 resolution
  artifacts/
    studyGuide.v1.ts           ← L2
    flashcards.v1.ts           ← L2
    registry.ts                ← version registry
  quality/
    deterministic.ts           ← checks that need no model
    modelPass.ts               ← checks that do
```

The edge function becomes **transport and enforcement only** — auth, rate limit, retrieval, provider
call, citation verification. **It contains no pedagogy.** Prompts ship with the client build, are
versioned in git, and are reviewable in a diff.

---

## 3. Versioning

**Spec id = `{artifact}-{version}`** — `study-guide-v1`, `flashcards-v2`.

| Rule | Detail |
|---|---|
| Versions are **immutable once shipped** | Fix a bug by publishing `v2`, never by editing `v1` |
| The registry declares one **default per artifact** | Rollback = change one line |
| Stored artifacts record `specId` **and** `specHash` | Two artifacts from `v1` with different presets are distinguishable |
| A version pins its **output schema** | `v2` may change the schema; renderers dispatch on `specId` |
| Deprecated versions stay **readable** | Old artifacts keep rendering. Never delete a shipped schema |

**A/B testing** — the registry may map an artifact to a weighted set of versions. Assignment is
sticky per user (hash of `userId + artifact`) so a student never sees their guides change style
mid-semester. Results carry the assigned `specId`, so comparison is a group-by.

**Comparison across versions** — because generation is grounded in stored chunks, re-running an old
artifact under a new spec is reproducible. Keep the `chunkIds` used, and `v1` vs `v2` on identical
input is a supported operation rather than an approximation.

---

## 4. Source traceability

**Rule (invariant): a citation may only ever be narrowed or dropped. It may never be minted.**

Citations originate in exactly one place — the provider's attested citation blocks in Pass 1 —
verified server-side against real chunk offsets, exactly as `validateResult` does today. No later
pass, transform, or regeneration may introduce a citation that did not survive that check.

### 4.1 The reference shape

```ts
SourceRef {
  chunkId: string
  fileId: string
  start: number          // absolute char offset, within the chunk's range
  end: number
  // resolved client-side from SourceChunk.sourcePosition — never model-authored:
  display?: { lectureNumber?: number; slideLabel?: string; fileTitle: string }
}
```

`display` is **derived, not generated.** The model never writes "Lecture 6, Slide 14"; it emits a
`chunkId`, and the client resolves the human label from `SourceChunk.sourcePosition`. A model cannot
fabricate a slide number it never authors.

### 4.2 What carries a reference

| Artifact element | Reference | Why |
|---|---|---|
| Study-guide `concept` block | Required | The core claim |
| `mechanism`, `comparison_table`, `flow_diagram` | Required | Derived structure must be traceable |
| `callout` (Clinical Connection) | Required under SOURCE_ONLY / CLARIFICATION | Otherwise it is background |
| `overview`, `final_synthesis` | Optional | Legitimately span the whole topic |
| `active_recall` question | Required | The answer must exist in the source |
| Flashcard tested target | Required | Every card is anchored to student-supplied material |
| Marked `background` supplement | No `SourceRef`; permitted only in `SOURCE_PLUS_BACKGROUND` | Must attach to a source-backed concept and remain subordinate under `02` §2.6 |

### 4.3 Uncitable content

If a generator produces a claim that cannot be tied to a chunk, it is **not** silently dropped and
**not** silently kept. It is emitted with `provenance: 'background'`, which under SOURCE_ONLY causes
the block to be **rejected by the validator before the student sees it**. See `02` §2.

---

## 5. The pass model — and its cost

The runtime keeps generation, verification, and review as separate roles. OpenAI currently performs
primary generation, the server closes every source reference against its own chunk store, and
Anthropic performs an independent audit without rewriting the artifact.

### 5.1 The passes

| Stage | Input | Output | Citations | Purpose |
|---|---|---|---|---|
| **1 · Generate — OpenAI** | L1–L6 + server-retrieved chunks | Typed content blocks / cards | Artifact emits exact source refs or source chunk IDs | Primary pedagogical work |
| **2 · Verify — server** | Generated artifact + server-owned chunks | Closed citation set or rejection | **Mechanically closed; never repaired** | Trust boundary |
| **3 · Review — Anthropic** | Verified artifact + same chunks + specification | Approve/reject verdict | Reviewer checks grounding and invariants | Independent quality assurance |

**After generation, server-side:** collect only references the artifact itself emitted, verify every
file, chunk, and offset against the real chunk text, and retain **only the survivors** as a closed
set. Any artifact reference outside that set is rejected, not repaired.

**During review:** Anthropic checks the already-closed artifact against the same source material and
the original specification. It may reject the result but never silently edit it. If the reviewer is
unconfigured or temporarily unavailable, the deterministic server checks still gate the OpenAI
result and the response records that the audit was skipped or unavailable.

### 5.2 The cost problem — **decision D-2**

Three calls per study guide against **20/hour, 100/day** means **~6 study guides an hour**. A student
generating guides for a full lecture set will hit the wall.

| Option | Effect |
|---|---|
| **A. Accept 3 passes; count them as 1 against the user limit** | Rate limit becomes per-*artifact*, not per-*call*. Honest to the user, and cost exposure triples per unit. Requires `claim_ai_request` to take a weight. |
| **B. Deterministic-only quality pass (drop pass 3)** | 2 calls. Loses hallucination and missing-concept detection — the two checks a model is uniquely able to do. |
| **C. Fold quality into pass 2** | 2 calls. Self-review in the same breath as structuring is the weakest form of the check. |
| **D. Pass 3 only when deterministic checks flag something** | 2 calls typical, 3 when warranted. Best expected value; the trigger rule needs tuning. |

**Recommended: D, with A's weighted rate limit.** Deterministic checks (`08` §2.1) are free and catch
most mechanical defects; escalate to a model pass only when they fire or when the artifact is large.

### 5.3 Provider roles — **decision D-7**

OpenAI is the default primary **Generator** and Anthropic is the default independent
**Reviewer**. `unit-question-bank-v1` is a narrow routing exception: Anthropic authors its
structured stimulus sets and OpenAI reviews them. If Anthropic is unavailable, the normal
OpenAI-primary path is the availability fallback. Provider assignment remains behind these
roles; it is not part of the artifact contract, and the server-owned citation and artifact
validators are deliberately provider-independent.

### 5.4 Failure behavior

| Failure | Behavior |
|---|---|
| Primary generation and its allowed fallback fail | No artifact. Surface the provider error. Nothing persisted |
| Generation returns zero verified citations | **Reject.** Under any source mode, an artifact with no traceable claim is not a premedOS artifact |
| Server validation fails | **Reject, do not repair.** A repair path is a fabrication path |
| Independent reviewer finds a blocking issue | **Reject.** Nothing persisted; return the distinct audit failure |
| Independent reviewer is missing or unavailable | Return only if deterministic checks pass, with `auditStatus: skipped` or `unavailable` |

**No partial artifact is ever persisted.** A half-generated study guide in the store is worse than
none, and the audit already found placeholder content persisted as real records once.

---

## 6. Where generation runs

**Client** — layer assembly, `specHash`, control resolution, deterministic quality checks, rendering,
persistence, edit tracking.

**Edge function** — auth, rate limiting, chunk retrieval, provider calls, **citation verification**,
schema validation.

Split on one rule: **anything that must be trusted runs server-side; anything that must be reviewable
in a diff lives in the repo.** Prompts are assembled client-side and sent, so the function has no
pedagogy embedded in it. The function does not trust the client's citations — it re-derives and
re-verifies them against `academic_source_chunks`.

**This means the request body no longer needs to carry source content** — the function already has it
in the table. That resolves the 64 KB problem (`09` §2, **decision D-3**) and removes the
mirror-on-every-call behavior flagged as audit finding E1.
