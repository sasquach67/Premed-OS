# 09 · Migration plan

**Deliverable 12.** Sequenced against the real dependency graph from `00`.

---

## 1. The good news

**Nothing needs unpicking.** From `00` §7: generation behavior is not duplicated anywhere. One
model-calling file, one client boundary, one consumer, one placeholder. No scattered prompts, no
second call path, no existing preferences to migrate.

This is a build, not a rescue. The plan is therefore about **sequencing new work so nothing
half-ships**, which is the failure mode the audit already caught once with `aiPracticeService`.

---

## 2. Blockers to clear first

### 2.1 The 64 KB request cap — **decision D-3**

`MAX_REQUEST_BYTES = 64 * 1024`. A study guide over a full lecture will exceed it, because today the
client ships chunk **content** in the request body (`AcademicRecallSession.tsx:183`).

**Recommended fix — invert the flow.** The function already has the chunks in
`academic_source_chunks`. The client sends `chunkIds`, not content. The function retrieves.

Three problems resolved at once:

1. Request size becomes bounded by id count, not content length.
2. **Audit finding E1 partly resolves** — content stops being uploaded on every call. The mirror
   becomes an explicit, disclosed ingestion step rather than a side effect of pressing a button.
3. The server stops trusting client-supplied source text, which matters because citation
   verification is only meaningful against chunks the server owns.

**This is a prerequisite, not a nice-to-have.** Generation cannot ship on the current transport.

### 2.2 Delete the placeholder generator

Audit **A8**. `aiPracticeService` and its button. Do this **before** building, not after — it
currently occupies the conceptual slot the real engine will fill, and leaving it live while a real
generator lands next to it guarantees confusion about which is which.

Keep: `assertGenerationAllowed`, the request/response type shape, the
`request → gate → generate → persist` flow.

### 2.3 Decide the disclosure and deletion story

Audit **E1** and **E2**. Generation *increases* how much course material lives server-side. Shipping
more generation before there is a disclosure at first use and a delete path makes an existing problem
materially worse. This is a small piece of work and it gates beta regardless.

---

## 3. Sequence

Each phase is independently shippable and leaves the product in a coherent state.

### Phase 0 — Clear the blockers
- Invert chunk transport (§2.1)
- Delete the placeholder generator (§2.2)
- First-use disclosure + server-data deletion (§2.3)
- Weighted `claim_ai_request` so limits are per-artifact (`08` §2.5)

**Ships:** nothing user-visible except the disclosure. **Unblocks:** everything.

### Phase 1 — The spine, with no new artifact
- `src/lib/generation/` scaffolding per `01` §2.1
- L1 global rules, source modes, the assembler, `specId` + `specHash`
- **Refit gap-check onto it** as the first consumer

**Why gap-check first:** it is the only working generation feature, it is small, and its output shape
is already validated. Refitting it proves the layer stack on something whose correct behavior is
already known — and it fixes audit **A2** for the feature that currently ships a three-sentence
prompt.

**Ships:** better gap-check, versioned. **Risk:** low. **Proves:** the architecture.

### Phase 2 — Structured output and the two-pass pipeline
- `07` schemas for study guides
- Pass 1 → verify → pass 2, with the closed citation set (`01` §5.1)
- Deterministic quality checks (`08` §2.1)
- Persistence, `conceptId` derivation, `edited` tracking

**Ships:** nothing user-visible. **Proves:** the hardest technical claim in the design — that
citations survive the structuring pass. **If this fails, the two-pass decision (D-2) gets revisited
here**, before anything is built on top of it.

### Phase 3 — `study-guide-v1`
- L2 artifact spec, required structure, gap and contradiction markers
- Presets and controls (`05`)
- Renderers for prose, bullets, steps, callouts, comparison tables
- **Visual primitives 1, 2, 4, 7** — table, flowchart, hierarchy, timeline

**Ships:** Create Study Guide. **Deliberately deferred:** cycle, labeled diagram, cause-effect,
concept map. Four primitives is enough to prove the visual grammar; eight is a lot of rendering work
to do before a single student has seen one.

### Phase 4 — `flashcards-v1`
- L2 card spec, six card types, deck rules
- Card-specific deterministic checks (`08` §2.1)
- Attach to topics and existing FSRS
- Flashcard presets

**Ships:** Create Flashcards.

### Phase 5 — Regeneration and quality
- Scoped regeneration, transforms, edit protection (`08` §1)
- Model quality pass with the escalation rule (`08` §2.5)
- Remaining four visual primitives

### Phase 6 — Deferred
- Version A/B testing and the comparison view
- Source-figure extraction, then `source_figure` blocks (`06` §6)
- Anki export if **D-6** says yes
- Remaining generation artifacts from the `generationPolicy` allow-list

---

## 4. What must not break

| Existing behavior | Protection |
|---|---|
| `GapCheckResult` shape | Phase 1 keeps the schema; only the prompt is layered |
| `openGapCitation` → `sourceItem.provenance` | `SourceRef` is a superset of `StudyCitation`; keep both shapes until Phase 2 lands |
| `PracticeExam` / `PracticeQuestion` types | Retained even after the placeholder is deleted — a real generator will use them |
| `generationPolicy` gate | Unchanged. New generators register behind it |
| FSRS state | Never reset by generation or regeneration (`08` §1.5) |
| Signed-out mode | Generation requires sign-in; nothing else may start to |
| localStorage-canonical | Artifacts persist locally first, sync after |

---

## 5. Storage

Generated artifacts are user data and belong in the local store, synced like everything else.

**Two things to decide before Phase 2 persists anything** — both are audit findings that generation
will amplify:

1. **Size.** Study guides with diagrams are large. `trash` already has no cap (audit **B5**) and the
   whole dashboard is one JSONB row (**B3**). A semester of generated guides could realistically
   approach the localStorage ceiling on its own. **Generated artifacts are the strongest argument yet
   for splitting the store per collection.**
2. **Merge.** New collections must be added to `MergePage`'s `AREAS`, or they inherit the silent-drop
   bug (**B1**). Add them at creation, not later.

---

## 6. Estimated shape

Not time estimates — relative size and risk.

| Phase | Size | Risk | Gate |
|---|---|---|---|
| 0 | S | Low | Blocks everything |
| 1 | M | Low | Proves the layers |
| 2 | M | **High** | Proves citations survive structuring |
| 3 | **L** | Medium | First user-visible feature |
| 4 | M | Low | Reuses Phase 2–3 machinery |
| 5 | M | Medium | |
| 6 | — | — | |

**Phase 2 is the one to de-risk first.** Everything downstream assumes verified citations survive a
structuring pass. If that assumption is wrong, the answer is a different pass model (`01` §5.2), and
it is far cheaper to learn that before three phases are built on it.

**Recommendation: prototype Phase 2 against one real lecture's chunks before committing to Phase 3.**
