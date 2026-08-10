# Build Prompts — foundation-first sequence

Paste-ready handoff prompts for Claude Code / Codex, in **dependency order**. Build one chunk at a time: hand off the prompt → review Codex's *plan* before it codes → let it build → it verifies against the acceptance criteria → next chunk. **Foundation before tabs; Overview and the tabs come last.**

These prompts are handoff artifacts, **not** specs. The source of truth is the rest of `premed-hq-documentation/` (architecture / specifications / tabs / implementation). Each prompt just points Codex at the right spec sections and fences the scope.

## Order

| # | Chunk | Spec | Status | Depends on |
|---|---|---|---|---|
| 01 | Data-model alignment + Person/Organization (Phase 1) | `implementation/data-model.md` | **Ready** | — |
| 02 | Record-open model (center-peek) + object inspector | `specifications/01` §2–3 | **Ready** | 01 |
| 03 | List presentations + inline autosave editing + states | `specifications/01` §4–5, 8, 11 | **Ready** | 01, 02 |
| 04 | Bulk + undo/trash + saved views + focus mode | `specifications/01` §6–7, 9–10 | **Ready** | 01–03 |
| 05 | Shell wiring (nav, Quick Add, palette, bell, popup) | `specifications/00` | **Ready** | 01–03 |
| 06 | Deterministic intelligence — data-health, dedup, rules-based recs, unified attention model (no LLM) | `architecture/02` + `general.md` | **Ready** | 01, 05 |
| tooling-01 | shadcn `components.json` preset wired to the theme | `implementation/data-model.md` | **Done** | 01 |
| tooling-02 | Component & motion pass (Motion engine, full shadcn + charts + blocks, SmoothUI/Animate UI) | `04` §7a + `implementation/component-inventory.md` | **Ready** | 01–05 |
| tooling-03 | Standardization sweep — normalize every existing screen to the §0b contract | `04` §0b | **Ready** | tooling-02 |

Then: tabs (each = configure the shared machinery + domain logic), with **Overview last** because it composes other pages' data.

## Notes

- **05 (shell) stays after 02–03** by decision (July 2026): Quick Add and the palette reuse the record-open + forms machinery, so strict dependency order keeps the shell late. Tradeoff accepted: visible change comes later, less rework.
- **The bell (05) ships with the deadlines feed only.** Its data-health + system feeds are a pluggable interface that **06** fills — so 05 doesn't block on the intelligence layer.
- **06 is the *deterministic* intelligence layer only** (rules engine + attention model, no LLM). The probabilistic/LLM half of `architecture/02` (orchestration, memory, retrieval, reasoning modes, coaching, LLM recommendations, automation-that-acts) is deferred to the **service-foundation / Atlas phase** — it needs an LLM integration + backend.
- **Deferred to the service-foundation phase (after the product exists):** auth, cloud sync, integrations, and billing/Stripe (`architecture/06`, `08`). Not part of this foundation sequence.

## Open threads parked (not build chunks)

- **Quick Capture box** design detail — revisit before building the Overview capture inbox.
- **Application hub page** — a dedicated cockpit tying School List / Essays / Letters / Timeline together; needs its own design pass + spec (shell §14.8) before a prompt.
- **Data-model §14.2/§14.3** — envelope backfill order; `Application` as a first-class entity.
