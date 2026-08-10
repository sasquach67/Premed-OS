# D6 brief — AI layer + coverage ledger

> **⚠ This chunk reads WIDE.** Unlike D2–D5, this one spans the data model, retrieval, and cross-tab wiring. **Read the full sections named in §6, not just this brief.** A narrow read here causes silent structural mistakes.
> **If something you need isn't here, read the spec and tell me the brief was incomplete.**

---

## 1. Goal

The plumbing that makes the study tools and the active-recall gap report work — and the guarantee that no uploaded material is ever lost.

## 2. Providers (locked)

- **Anthropic is primary, using the Citations API.** Source documents are passed in; Claude returns structured citation objects with **character-level offsets**, guaranteed at the API layer. This powers the clickable "from your materials" provenance chips.
- **OpenAI is an optional drop-in.** Keep orchestration **provider-agnostic** behind one interface (`architecture/02`).
- **Explicitly rejected — do not build:** NotebookLM / Gemini Notebook (no public consumer API), multi-model cross-checking on every response (cost/latency/no tiebreak), Gemini File Search as the retrieval layer (unnecessary — Supabase is in-stack).

## 3. Retrieval

**Supabase pgvector.** Chunks carry `courseId` + `topicId`. **Retrieval at review time is scoped to the topic**, never the whole drive.

## 4. Output contract

Every study-tool call returns **schema-constrained JSON** — e.g. `{covered, missed, wrong, suggestedGrade}` with a citation per item — never prose. The UI renders the JSON.

## 5. Coverage ledger — "nothing gets lost" (locked)

- **Chunks are never dropped, only labelled.** Topic assignment is a *label*, never a filter.
- **Enforced invariant:** after key-point extraction, check the reverse direction — any `SourceChunk` that **no `KeyPoint` claims** is flagged `uncovered` and surfaced.
- **Three-tier assignment (no cross-semester junk drawer):**
  1. **Semantic** — the chunk clearly discusses the topic.
  2. **Positional fallback** — came from the Lecture 12 deck, and the syllabus maps Lecture 12 → Unit 5, so it files under **Unit 5**. Position is always known.
  3. **Unanchored file only** — becomes **its own topic named after the document**.
  > **Never** create a semester-wide "Loose ends" topic — mixing week 2 and week 14 in one review is incoherent (rejected).
- **`timesSurfaced = 0` items get priority** and are explicitly pulled into the pre-exam plan.
- **Coverage meter** in the class hub: mapped %, unassigned items **with their source**, never-reviewed count.

## 6. Read these fully (wide read — this chunk needs it)

- `tabs/01-academics.md` **§3 (data model), §6.2, §6.3, §6.4, §6.5, §8 (cross-tab), §12 (do not generalize)**
- `architecture/02-global-intelligence-framework.md` — explainability, permission-first, trust separation
- `implementation/knowledge-sources.md` — Category A vs B
- `implementation/data-refresh.md` — freshness metadata

## 7. Non-negotiables

- **AI generates practice items in two places only:** M2M drills (MCAT) and flashcards. QBank questions, CARS passages, and content are **externally sourced**. The LLM is otherwise for guidance/synthesis.
- **AI acts permission-first** — propose → confirm → act. Never silently edits user data.
- **Degrade to zero keys.** FSRS scheduling, the coverage ledger, calibration, timers, summaries, and manual review must all work with **no API key at all**. AI is a layer, never a dependency.
- **Never silently guess** a week, unit, or topic mapping — flag "confirm" instead.

## 8. Done when

- [ ] Provider-agnostic interface; Anthropic + Citations returns char-offset provenance the UI can link to.
- [ ] pgvector retrieval scoped by `topicId`.
- [ ] All tool calls return schema-validated JSON; malformed responses fail safely, never render as prose.
- [ ] Coverage ledger: no chunk dropped; uncovered chunks flagged; three-tier assignment with positional fallback; no semester-wide misc bucket; `timesSurfaced = 0` prioritised; coverage meter renders.
- [ ] **Full app function with zero API keys** verified explicitly.
- [ ] Cross-tab wiring intact (§8) and no "do not generalize" violations (§12).
- [ ] `npm run build` passes.

## Commit (required)

`npm run build` must pass, then **commit before reporting**: `feat(academics): ai layer + coverage ledger`.
If unrelated pre-existing changes are in the working tree, commit them **separately** with their own message — never bundled into this chunk.

## 9. Report

Diff summary + explicitly confirm the zero-key path was tested.
