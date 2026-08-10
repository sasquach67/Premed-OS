# Final audit — run once, after D6

**This is the one wide read.** D2–D5 were built from narrow briefs, which is fast but risks *silent omission* — things nobody thought to put in a brief. This pass exists to catch exactly that.

Run it in a **fresh session** so the full spec gets clean attention.

---

## Prompt

> You are auditing a completed implementation. **Fix presentation; report behaviour.**
>
> **AUTO-FIX inline (no approval needed)** — purely presentational, no data or logic risk:
> focus rings scoped to `:focus-visible` · missing counts/badges · off-scale tokens (colour, spacing, radius, type size) · contrast failures in light or dark · Title Case → sentence case · alignment, overflow, protruding elements · missing empty/loading/error states · `04` §10 anti-patterns (oversized stat cards, unlabelled bars, emoji-as-icons, five radii) · reduced-motion fallbacks.
>
> **REPORT ONLY — do not change:**
> anything touching stored data, schemas, or migrations · cross-tab wiring · behavioural or scheduling logic · adding, removing, or re-scoping a feature · anything needing a product decision.
>
> The line is: **how it looks = fix it. What it does = report it.** If you're unsure which side something falls on, report it.
>
> Read the full Academics spec and its dependencies:
> - `premed-hq-documentation/tabs/01-academics.md` — **entire file**
> - `specifications/01-shared-interface-patterns.md`, `specifications/04-visual-craft-standards.md`
> - `general.md` (entity system, privacy), `architecture/02-global-intelligence-framework.md`
> - `implementation/data-model.md`
>
> Then read the implemented code for Academics.
>
> Produce a gap report — **no code changes**:
>
> 1. **Acceptance criteria (§13):** every checkbox, marked pass / fail / partial, with the file and line where it's satisfied or the reason it isn't.
> 2. **Cross-tab relationships (§8):** verify each one is actually wired. Specifically confirm: contacts use shared `Person` records and reach Letters + Profile/CV; class data feeds Overview; assignments are excluded from Home's to-do widget; topic/coverage state feeds the exam plan.
> 3. **"Do Not Generalize" (§12):** list any violation.
> 4. **Locked decisions that could have been silently dropped:**
>    - Anki fully decoupled — no `scheduler` field, no sync chips, no due-count reads
>    - AI generates practice items only for M2M drills + flashcards
>    - No unlabelled stacked bars; exam scope carries a legend **and** an on-screen explanation
>    - Everything grouped — Materials by week, Topics by unit, Assignments by syllabus category, Notes by kind
>    - Two note kinds kept separate (about the class vs on the material)
>    - Coverage ledger invariant: no chunk dropped, uncovered chunks flagged, no semester-wide misc bucket
>    - Zero-API-key path fully functional
>    - One pace line per panel, dismissible, none on streaks
>    - Compact stats — no oversized stat cards for routine metrics
>    - **Class types: exactly three** (`stem`/`writing`/`general`) — no fourth, no per-feature toggle checklist, no type badge on cards, daily list never grouped by type
>    - **Zero reads of `type`** in GPA, BCPM, requirement audit, Planner, Overview — check by grep, and report the grep
>    - **Writing pages carry the same visual weight as STEM pages** — no greyed-out or empty-shell panels standing in for absent features
> 5. **Craft check (`04` §11):** tokens only, grid alignment, nothing overflowing, AA contrast in light **and** dark, empty/loading/error states everywhere, keyboard + focus + reduced-motion, no §10 anti-patterns.
> 6. **Brief gaps:** anything the spec requires that **no brief mentioned** — these are my blind spots and the main reason this audit exists. List them explicitly.
>
> Output two sections:
> 1. **Fixed** — the presentational issues you corrected, as a diff summary.
> 2. **Reported** — everything else as a prioritised list (**blocking / should-fix / nice-to-have**) with file references, unchanged.
>
> `npm run build` must pass. Commit the presentational fixes separately from nothing else — one commit, `fix(academics): craft audit corrections`.

---

## After the audit

Feed the **blocking** reported items back as a small remediation chunk (D7) using the same narrow-brief format. Fold any "brief gaps" into the relevant brief so the next feature area doesn't repeat them.
