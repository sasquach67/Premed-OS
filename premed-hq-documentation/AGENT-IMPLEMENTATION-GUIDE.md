# Agent Implementation Guide — READ THIS FIRST

**You are implementing Premed OS. This documentation folder is your SINGLE SOURCE OF TRUTH.**

Everything you build must come from these `.md` and `.json` files. Do not invent features, rename things, change flows, or "improve" on the spec from your own priors, from other apps, or from generic best practice. If it is not in these docs, it is not in scope. When the docs and your instincts disagree, **the docs win.**

---

## 0. The prime rule

- **Build only what the docs specify.** No extra features, no omitted ones, no reinterpretations.
- **If the docs are silent, ambiguous, or contradictory on something you need: STOP and ask the user.** Never guess, never fill the gap with an assumption. Flag it explicitly ("Spec X §Y doesn't define Z — how should this behave?").
- **Never silently deviate.** If you believe the spec is wrong or infeasible, say so and wait — do not quietly do something else.

## 1. Read in this order (this is also the precedence order when specs conflict)

1. `general.md` — global entity system, privacy, cross-cutting rules.
2. `architecture/` — the global laws. Especially `01-global-design-system`, `02-global-intelligence-framework`, `04*-admissions*`, `06-service-foundation`. These govern everything.
3. `specifications/` — app-wide UX:
   - `00-product-shell` (IA, sidebar, center-peek, Quick Add),
   - `01-shared-interface-patterns` (center-peek model, lean inspector, **layout discipline §5c**),
   - `04-visual-craft-standards` (**the non-negotiable design rules**),
   - `05-experience-pillar` (the shared FRAME for the five experience pillars; the builder itself serves Clinical/Volunteering/Shadowing/Research, while Extracurriculars is a separate page),
   - `02-atlas...`, `03-overview`,
   - **`generation/`** — the AI generation engine (layers, source modes, study-guide and flashcard specs, schemas, visual system, regeneration, quality). **APPROVED Aug 2026; all nine decisions resolved.** Start at `generation/README.md` for the decision log, then build against `09-migration-plan.md` §3 from Phase 0. It governs every generated artifact; `lib/academics/generationPolicy.ts` remains the enforcing gate.
4. `data/` — reference datasets (`*.json`). Treat as data, not code; wire the app to read them.
5. `tabs/` — the per-page specs. Implement these **one at a time** (§3).

Higher in this list wins: a `tabs/` page never overrides a global rule in `architecture/` or `specifications/04`.

## 2. Global rules you apply to EVERY screen (do not re-derive per page)

- **Visual craft:** obey `specifications/04-visual-craft-standards.md` in full — tokens only, 4-size type scale, restrained color, compact stats (NOT big number boxes — §6/§10), one primary action, empty/loading/error states, accessibility AA, and the §10 anti-pattern list.
- **Layout discipline:** `specifications/01-shared-interface-patterns.md` §5c — equal-height side-by-side elements, bounded dimensions, nothing protruding or overflowing.
- **Design system:** use the repo's existing fonts, tokens, and shadcn/Tailwind components.
- **VISUAL MOCKUPS — read `specifications/mockups/README.md` first.** That folder now contains two kinds of file:
  - **APPROVED visual references** (`overview-bento-control-panel.html`, `academics-nav-hierarchy.html`, `academics-daily-main-page.html`) — **open the relevant one in a browser before writing code for that page.** They are law for **layout, density, and hierarchy**; the specs remain law for **behavior and data**. Never copy their markup — rebuild from the page's *Components used* table.
  - **Older concept mockups** (`academics-mode-switch`, `class-center-study-hub`, `clinical-pillar`, `mcat-plan`) — **flow/structure only**; their visuals defer to the approved references.
- **Global patterns you must apply to every page** (do not re-derive): bento control panel (`03-overview` §5) · banner compaction + variable-metrics-only stat strip (`01` §4b-ii) · three-level nav in three forms (`01` §4b-i) · glass judgment (`04` §0c) · interactive card states (`01` §4e) · pacing/projections (`01` §4d) · right-click context menu (`01` §4c) · one shared intelligence surface per tab (same component as Overview's Smart next actions).
- **Reuse, don't fork:** the five experience pillars are ONE configurable builder (`specifications/05`), not five pages. Shared patterns (center-peek, inspector, Quick Add) are implemented once.
- **AI / content rule (from `tabs/02-mcat.md` §2a):** AI generates practice items in only two places — Mistake-to-Mastery drills and flashcards. QBank questions, CARS passages, and content are always externally sourced, never generated. The LLM is otherwise for guidance/synthesis. Never copy another product's questions (IP).
- **Data trust separation:** Category A = factual reference data (official sources, `data/*.json`); Category B = opinionated community consensus (present WITH the debate, never as fact). See `implementation/knowledge-sources.md`. Never mix them.
- **AI acts permission-first:** any AI surface (Advisor, Atlas Assistant, data-refresh) proposes → confirms → then acts. Never silently edits user data.
- **"Do Not Generalize" sections are binding:** each tab lists what must NOT be copied to other tabs. Respect them.

## 3. How to implement — one chunk at a time

The user will prompt you in chunks (usually one tab/spec at a time). For each chunk:

1. **Read the full relevant docs** for that chunk — the tab spec AND everything it lists under "Depends on," plus the global rules (§2).
2. **Read the existing repo code** for that area first. The app already partly exists (`sasquach67/Premed-OS`, Vite + React 19 + React Router 7 + Tailwind 4 + shadcn). **Extend and align with what's there — do not rebuild from scratch** unless the spec explicitly says to replace it.
   - **Target the current top-level source only.** The repo contains an **older nested `premedos/` folder that is stale — do not read it as truth or modify it.** All implementation happens against the top-level source tree; if the two ever disagree, the top-level wins. When in doubt about which copy is canonical, ask before touching `premedos/`.
3. **Produce a short plan before coding:** which files you'll add/change, which shared components you'll reuse, and a spec-section → code mapping. Surface any ambiguity now (§0).
4. **Implement** to the spec, applying all §2 global rules.
5. **Verify against that spec's own "Acceptance criteria" section** — it is your test checklist. Also self-check `04` §11 build checklist and states (empty/loading/error, light/dark, mobile, keyboard, reduced-motion).
6. **Report** what you built, mapped to the acceptance criteria, and stop for the next chunk.

Do not batch multiple tabs in one pass. Do not run ahead to the next chunk unprompted.

## 4. Definition of done (per chunk)

- Every acceptance-criteria checkbox in that spec is satisfied (or explicitly flagged as blocked/deferred with the reason).
- No new design tokens, fonts, or colors outside the system; no `04` §10 anti-patterns.
- Reuses shared builders/components; nothing double-implemented.
- Any spec gaps were raised with the user, not silently filled.

## 5. What to do when stuck

Ask. Specifically: name the file + section, state what's missing or contradictory, and propose options if you have them — then wait. A blocked-and-asking agent is correct; a guessing agent is not. These docs are the only thing you rely on.
