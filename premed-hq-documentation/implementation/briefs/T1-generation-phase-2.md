# Generation · Phase 2 — structured output and the two-pass pipeline

> **Superseded September 2, 2026:** the runtime now assigns OpenAI to primary generation and Anthropic to independent secondary review. The server still owns citation closure. Anthropic no longer performs both draft and structuring passes; this brief remains as the history of the original closed-citation implementation.

**Stage:** C · **EXECUTED Aug 19, 2026 — the pure half**
**Spec:** `09` §3 Phase 2, `01` §5.1, `07`, `08` §2.1

---

## 1. Why this one, and why now

`09` §6 is explicit: **"Phase 2 is the one to de-risk first. Everything
downstream assumes verified citations survive the structuring pass."** And the
phase's own note: *"Proves the hardest technical claim in the design… If this
fails, the two-pass decision (D-2) gets revisited here, before anything is
built on top of it."*

**That claim is pure logic and needs no model to test**, which is exactly why it
could be built and proven before spending a single token.

## 2. What shipped

| Piece | File |
|---|---|
| `07` §1 primitives + §2 content blocks | `schemas/studyGuide.v1.ts` |
| The closed citation set (`01` §5.1) | `citations.ts` |
| Deterministic quality checks (`08` §2.1) | `quality/deterministic.ts` |
| `conceptId` derivation (`07` §5.1) | `conceptId.ts` |

**The invariant, made mechanical.** Pass 1 drafts with provider-attested
citations → the server verifies each against real chunk offsets → **only
survivors pass forward as a closed set** → pass 2 may reference those and no
others → after pass 2 the server re-verifies, and **a citation outside the set
rejects the artifact rather than repairing it.** Repairing would mean choosing a
citation on the model's behalf, which is the fabrication the mechanism exists
to prevent.

Three failure modes are covered explicitly, because they are the ones that
would otherwise ship silently:

- an offset **past the end of a chunk** is dropped, never clamped — clamping
  invents a quotation the source does not contain;
- a citation to a **chunk the server does not own** is dropped;
- **right chunk, shifted span** is treated as minted. This is the subtle one: it
  looks verified and is a fabricated quote.

**22 tests**, none of which call a model.

## 3. Wired Aug 19, 2026 — the `generate` action

The edge function now carries the two-pass pipeline as a `generate` action:
pass 1 drafts with attested citations → **the server** verifies each against
the chunk text it owns and forwards only survivors as a closed set → pass 2 is
handed that set and told it may reference nothing else → the server re-verifies
and returns `citation-not-carried` if anything was minted. `AI_REQUEST_WEIGHT`
gains `generate: 2` so the limit counts artifacts rather than calls (`08` §2.5,
decision D-2).

⚠️ **The same rule now exists in two places** — `citations.ts` client-side and
`closeCitationSet` in the function. That is deliberate: the client module is
the readable, exhaustively tested reference, and the function is the
enforcement, because only the server owns the chunk text. The shapes are
identical so a divergence shows up in a diff. **If one changes, change both.**

⚠️ **Unverified at runtime.** It parses and typechecks, but no request has run
through it. `09` §6's advice stands and is now actionable: prototype against
one real lecture's chunks before trusting Phase 3.

## 4. What is still NOT in this pass
- **The deploy.** `npx --yes supabase@latest functions deploy study-tools`.
- **Persistence and `edited` tracking.** They depend on where a generated
  artifact is stored, which is a schema decision, not a pipeline one.
- **A UI that calls it.** Nothing in the app invokes `generate` yet.

## 5. Recommendation, carried from `09` §6

> "Prototype Phase 2 against one real lecture's chunks before committing to
> Phase 3."

The verification half is now provable in isolation. The remaining risk is
entirely in whether a real model's pass-2 output carries its citations
faithfully — which is measurable the moment the edge function runs both passes,
and cheap to abandon if it does not.

## 6. Commit

`feat(generation): add the closed citation set and deterministic checks (Phase 2)`
