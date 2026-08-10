# Build Prompt 06 — Foundation Layer 6: deterministic intelligence (rules engine + attention model)

*Handoff prompt for Claude Code / Codex. ONE chunk. The **deterministic** intelligence foundation — **no LLM**. Completes the pluggable interface the shell (chunk 05) left open. Plan first, stop for approval.*

---

You are implementing **Premed OS**. Goal: build the **deterministic intelligence layer** — the rules engine that produces data-health warnings, dedup candidates, explainable rules-based recommendations, and the **unified attention model** that feeds the bell, status chip, Overview, and review queue. This is `architecture/02`'s **"Deterministic Before Probabilistic"** foundation: everything here is computed from rules over the entity graph, **no AI model calls**.

## Read first

1. `architecture/02-global-intelligence-framework.md` — **"Deterministic Before Probabilistic"**, **Entity Intelligence**, **Recommendation Architecture** (eligibility, prioritization, explanations, confidence, timing, lifecycle, suppression, outcome tracking), **Proactive Intelligence** (opportunity/risk/missing-info/stale/deadline/longitudinal, triggers, **notification thresholds**, alert-fatigue), and the **Design Review Checklist**.
2. `general.md` — the data-health warnings list, completeness states, deduplication, review queue, smart recommendations (rules-based, explainable).
3. `implementation/data-model.md` — §6 derived properties (compute, never store), §7 validation/completeness, §3 source.
4. `specifications/00-product-shell.md` §7.5 (the attention **bell** — it shipped with the deadlines feed and a **pluggable interface** for data-health + system feeds; this chunk fills it) and the LiveStatusChip.
5. `specifications/03-overview.md` §6.3 (Smart Next Actions). Repo: `src/lib/selectors.ts` (`gpaStats`, `hourTotals`, `upcomingAlerts` — extend these), the store.

## What to build (deterministic only)

1. **Derived-properties layer** — formalize `data-model` §6 as pure selectors: GPA (cum / science / AO), hour totals + per-pillar signals (longevity, cadence, streak, hrs/wk, pace projection), distinct-population/specialty counts, completeness %, days-since-update, next deadline. **Compute, never store.**
2. **Data-health + completeness engine** — per-entity rules producing a **completeness state** (Incomplete → Usable → Well-documented → Ready-for-export) and the `general.md` warnings (missing verification contact, missing/invalid date range, stale active record, deadline without owner, broken file link, unlinked reflection, duplicate org, completed-with-unresolved-tasks…). Each warning carries: **severity** (blocking / important / suggested), the entity, and a **plain "why" string.**
3. **Dedup detection** — extend the Person/Org matchers into a general dedup pass (people, orgs, courses, schools): candidates + confidence + differing fields; **never auto-merge** (reversible, `general.md`).
4. **Rules-based recommendations** — explainable, cross-entity where the rule is deterministic (e.g. "active experience, no verifier → add supervisor"; "shift reflection not in Story Bank → send it"; "research project + output + PI → add PI as recommender"; "no clinical shift for 3× this experience's median gap, floor 2 weeks, cap 12 → exposure going stale" — **the threshold is derived per experience, never a fixed N; see `tabs/03-clinical.md` §7**). Each: a **why**, a **priority/rank** (impact × urgency × confidence), an **action** (deep-link / create task / open record), and a **lifecycle** (generated → presented → accepted/dismissed → suppressed → expired) with **suppression** (remember dismissals; don't nag). **Permission-first — recommend, never auto-act.**
5. **Unified attention model** — one deterministic model merging three feeds: **deadlines** (extend `upcomingAlerts`), **data-health** (#2), **system** (backup off, sync conflict). It is the single source the shell **bell** (§7.5), **LiveStatusChip**, Overview **Smart Next Actions** (§6.3), and the **review queue** (`general.md`) all read. Severity map (arch/02 notification thresholds): **Critical → blocking, Important → important, Helpful/Informational → suggested.** Include an **alert-fatigue guard** (suppress repeatedly-dismissed / low-value).
6. **Explainability + honest confidence** — every warning/recommendation states its reason; **deterministic facts are never dressed as probabilistic** and vice-versa (arch/02). Show confidence only where a rule truly has uncertainty (dedup) — never fabricated.

## Out of scope / must NOT — deferred to the service-foundation / Atlas phase (needs an LLM + backend)

- **No LLM calls**, orchestration, capability registry, routing, or task classification.
- No context-assembly, memory (working/session/workspace/user/platform), or retrieval/grounding systems.
- No LLM reasoning modes (coaching, synthesis, critique, forecasting-via-model, document extraction); no LLM-generated recommendations.
- **No automation that acts on the user's behalf** — recommend + require confirmation only (permission-first).
- No new dependencies; extend existing selectors/store; compute, don't store.

## Process

Plan first (files, spec→code mapping, ambiguities), **stop for approval**; deterministic-first; `npm run build` passes; report against acceptance, then stop.

## Acceptance criteria (arch/02 Design Review Checklist + general.md)

- [ ] Derived properties are pure selectors (computed, never stored); GPA / hours / pace / completeness correct.
- [ ] Data-health engine emits per-entity warnings with severity + a plain "why"; completeness states surface.
- [ ] Dedup returns candidates + confidence and **never auto-merges**.
- [ ] Rules-based recommendations are explainable, prioritized, actionable, with lifecycle + suppression; **permission-first (no auto-act)**.
- [ ] One unified attention model feeds the bell, status chip, Overview Smart Next Actions, and the review queue; severity maps blocking/important/suggested; alert-fatigue guard works.
- [ ] Deterministic vs. probabilistic cleanly separated; no fabricated confidence; **nothing calls an LLM**.
- [ ] Light/dark, keyboard-only, reduced-motion; `npm run build` passes.
- [ ] Commit: `feat(intel): deterministic intelligence — data-health, dedup, rules-based recs, unified attention (foundation L6)`.
