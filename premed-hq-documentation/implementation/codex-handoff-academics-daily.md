# Codex handoff — Academics, Daily mode

**Paste this as the opening prompt. Do not batch chunks; plan first, stop for approval per chunk.**

---

You are implementing the **Academics tab, Daily mode** for Premed HQ.

## Source of truth

Your only source of truth is `premed-hq-documentation/`. Read `AGENT-IMPLEMENTATION-GUIDE.md` first — it defines read order, precedence, and workflow. Ignore the root `rules/`, `spec/`, the nested `premed-hq/` folder, and the loose handoff `.md` files; all are stale. Implement against `src/` at the repo root.

**If the docs are silent, ambiguous, or contradictory on something you need: stop and ask. Never guess.**

## Read before coding

1. `general.md` — global entity system, privacy
2. `architecture/01-global-design-system.md`, `architecture/02-global-intelligence-framework.md`
3. `specifications/01-shared-interface-patterns.md` — center-peek (§2), lean inspector (§3), **3-level nav (§4b-i)**, banner compaction (§4b-ii), context menu (§4c), **pacing/projections (§4d)**, **interactive cards (§4e)**, **`MascotNote` (§4f)**, layout discipline (§5c), states (§8), density/saved views (§9), **Resolved Decisions (§13)**
4. `specifications/04-visual-craft-standards.md` — **binding**, especially §6 (compact stats), §10 (anti-patterns), §11 (build checklist)
5. `tabs/01-academics.md` — the spec. §3 (data model), §4.0–4.0e, §4.1, §4.1-G, §4.1-H, §4.1-I, §4.1-J, §6.2–6.5, §7a, §13
6. **Mockups** (layout law, rebuild from library components — never copy markup):
   - `mockups/03-overview/overview-bento-control-panel.html` — the design language
   - `mockups/_shared/nav-hierarchy-3-levels.html` — the 3-level nav rule
   - `mockups/01-academics/academics-daily-main-page.html` — Class Center
   - `mockups/01-academics/academics-assignments.html` — Assignments
   - `mockups/01-academics/academics-class-hub.html` — the class page
   - `mockups/01-academics/academics-review-session.html` — the active recall runner
   - `mockups/_shared/mascot-note-pattern.html` — `MascotNote`

## Chunks — implement one at a time, plan first

- **D1 — Data model migration.** Canonical `Course` + `ClassWorkspace` (1:1 by `courseId`, current-term only); assignments link by `courseId`; add `Topic` (status + FSRS via `ts-fsrs`, **no `scheduler` field**), `KeyPoint`, `SourceChunk`, `File`. Migrate existing data **with a review step for unmatched records**. Every localStorage change needs a **versioned, lossless migration**.
- **D2 — Nav + Class Center main page.** Mode switch (Daily/Planning) swapping the tab bar; 3-level nav chrome; the bento per `academics-daily-main-page.html` including the **new Contacts panel** (§4.0-e).
- **D3 — Assignments** (§4.1-H). Agenda default, Weekly, Calendar; table demoted to overflow; Add as primary; projected workload panel.
- **D4 — Class page** (§4.1-I). Five sub-tabs (Overview · Materials · Topics · Assignments · Notes) sharing one banner. Center peek → expand from a class card.
- **D5 — Active recall runner** (§4.1-J). One mode, one composer, scope chips, gap report with provenance, calibration, scenic start/summary.
- **D6 — AI + coverage plumbing** (§6.3, §6.4). Provider-agnostic (Anthropic + Citations primary), Supabase pgvector scoped by `topicId`, JSON-schema outputs, coverage ledger with the uncovered-chunk invariant. **Must degrade fully to zero API keys.**

## Non-negotiables (do NOT violate)

- **Compact stats.** No oversized stat cards / giant number boxes for routine stats (`04` §6, §10). One primary metric may go large.
- **Bento, not a stack.** Mixed-size panels; a uniform column of equal rectangles is a defect.
- **Glass only where a surface floats** — banner chrome, overlays. Panels, rows, tables, fields, badges are solid.
- **In-app styled controls only** — never native OS selects or date pickers (`01` §4a).
- **One primary action per view.**
- **Anki is decoupled.** No `scheduler` field, no sync chips, no "reviewed in Anki", no due-count reads. Only: card generation → TSV/`.apkg` export, plus a "Send to Anki" button that appears **only** if AnkiConnect is detected on `localhost:8765`.
- **AI generates practice items in two places only:** M2M drills (MCAT) and flashcards. Everything else is externally sourced or user-authored.
- **Never silently guess** a week, a unit, or a topic mapping — flag "confirm" instead.
- **Never drop material.** Chunks are labeled, never filtered out.
- **No new dependencies without flagging first.** `ts-fsrs` is approved.
- Signed-out mode must stay fully functional; localStorage is primary.

## Per chunk: plan → build → verify → report

1. Read the relevant spec sections + mockup, and the existing repo code for that area. **Extend, don't rebuild.**
2. Produce a short plan: files added/changed, library components reused, spec-section → code mapping, and any ambiguity. **Stop for approval.**
3. Build.
4. Verify against that spec's **Acceptance criteria** (§13) plus `04` §11: tokens only, grid-aligned, nothing overflowing, AA contrast in light **and** dark, empty/loading/error states, keyboard + focus + reduced-motion, real data, no §10 anti-patterns.
5. `npm run build` must pass. One feature per commit, conventional commits (`feat(academics): …`).
6. Report what you built mapped to the acceptance criteria, then stop.

Start with **D1** and give me the plan.
