# Spec-session handoff — July 2026

For picking up the **speccing** conversation. (`HANDOFF.md` is the separate doc for implementation agents — don't confuse them.)

---

## Where we are

**Academics: complete.** 77 features across 9 waves, ~15 surfaces, every locked decision written down. Nothing outstanding.

**MCAT: in progress.** Structure was already strong (7 sub-tabs + study session + M2M). This session built a board of 17 promoted items, resolved ~11 into real spec sections, rejected several outright. **4 remain unspecced.**

**Everything else: untouched.** Clinical and Volunteering have candidate feature lists nobody has picked from. Shadowing, Research, Extracurriculars are still ~82-line stubs. **That's the largest remaining gap in the docs.**

---

## Key files

| File | What it is |
|---|---|
| `tabs/02-mcat-board.md` | **Start here for MCAT** — promoted / add-ons / rejected + resolution notes |
| `tabs/02-mcat.md` | The MCAT spec |
| `tabs/01-academics.md` | Academics spec; §6 holds all 77 features |
| `tabs/01-academics-feature-catalog.md` | Readable index of all 77 + cross-cutting dependency table |
| `implementation/briefs/README.md` | Build order, brief↔mockup↔decisions map, what has no brief |
| `implementation/integration-map.md` | §0 = **build-vs-handoff** governing principle (4 tiers) |
| `specifications/00-product-shell.md` | §11a guided walkthrough · §11b **shared hour budget** |
| `specifications/02-atlas-interface-and-knowledge-map.md` | §5 conversation capture (coffee chats) |

---

## Still to spec — MCAT

| # | Thing | Notes |
|---|---|---|
| **P4** | **Test Day tab** | **Next up.** Phase-gated and **hidden until actionable**: registration (~6mo) → logistics (~3wk) → after (score release, retake-or-apply). Void briefing delivered **before** the exam — you can't use a phone during it — and its content is mostly *"feeling bad is not information."* **No seat-availability checking (no AAMC API).** |
| **P5** | Stamina training | Metric: **score decay within an FL** — first section 128, last 124, consistently, is fatigue not knowledge. Progression 2-section → 3 → full with real breaks, one at true exam time of day. |
| **P6** | Retake mode | A retake plan ≠ a first-attempt plan. Targets the gap from the student's own FLs and mistakes. |
| **P7** | The taper | Final week **overrides the generator**, not a note. |
| **P8** | Coach | **Placement ruled: no surface.** Lives in the end-of-session summary (§3.0-C), at most one observation, specificity bar. Behaviour still unspecced. Hard boundary: **must not handle distress.** |

**P5/P6/P7 are the same engine — spec them together.**

**Mockup chain status:** `mcat-section-aware-drills` and `mcat-bookshelf` now have decisions files. **`mcat-plan.html` still needs one.** No MCAT brief exists yet — when one is written, it must name these mockups explicitly (see the mockup-workflow rule in `implementation/briefs/README.md`).

---

## What got specced this session

**Academics (finished):** class types (§4.1-N, exactly three) · Canvas two-path (§4.1-O) · two-stream bell · lecture capture (§4.1-Q) · exam catalog (§4.1-P) · exam prep mode (§4.1-R) · timer + canvas folded into the review session (§4.1-J) · term rollover with three topic fates (§6.10-C) · AMCAS-shaped record (§4.2-D) · MCAT decay mapping (§4.2-E) · attention budget (§6.11) · trust (§6.12) · pacing stance (§6.15) · shared hour budget (§6.16).

**MCAT:** content decay per section (§3.5) · exam date as a decision (§3.3-A1) · busy periods (A2) · shared hour budget (B0) · mandatory slack (B1) · pre-prep staleness (B2) · projection range/gate/scoring (C–C4) · publisher normalization (C1) · Bookshelf (§3.10) · drill scheduling without self-grading (§3.9-a) · Anki boundary (§5h) · FSRS presets (§5i) · placement rulings (§5f) · review-loop ownership (§5g) · FL as scheduled object + section granularity (§3.6) · flagged-but-correct (§5b #16) · one general `missReason` taxonomy (§2b).

---

## Rejected this session — all recorded in-spec with reasoning

Target score from school list · separate diagnostic surface · live pacing cues during practice exams · seat-availability checking · **per-section training modes and all specialised drilling (P3)** · C/P speed drills · `Again/Hard/Good/Easy` on multiple-choice drills · per-section `missReason` extensions · Bookshelf role labels + warm-up insertion · a coach surface · transcript pre-filtering before analysis · an accuracy ledger for lecture emphasis.

**Recording rejections in-spec has already prevented several regressions. Keep doing it.**

---

## How Andy works

- **Generate abundantly; he cuts.** He rejected roughly a third of what was proposed this session, usually correctly.
- **He trims hard.** *"Don't overanalyze"* and *"don't bombard the user"* are direct quotes, and both are now written into the specs as constraints.
- **Talk → mockup → critique → revise → approve.** He asks for a mockup when a concept isn't landing. Build from `decisions/_visual-recipes.md` values **literally**.
- **Push back; don't comply silently.** He's overruled me and I've overruled him, and both improved the spec.
- **Keep replies short.** Long responses get called out.
- **Mockups: always ask before filing.** On his go-ahead, move it into `specifications/mockups/` **that turn**, write the matching `decisions/` file, and update the table in `implementation/briefs/README.md`. **Every prompt or brief touching that surface must name the mockup file explicitly** — see the mockup-workflow rule in that README.

---

## Standing rules that keep getting violated

1. **No new tabs.** Everything lands in an existing surface as a mode or sub-view.
2. **Hand off before building** (`integration-map` §0). Ask tier 1 first — Wispr Flow needed zero integration.
3. **No AI generation in MCAT** beyond M2M drills and flashcards. QBank questions and CARS passages are external, permanently.
4. **No flashcard review in HQ**, either tab — generate → tag → export → Anki. **But `ts-fsrs` still schedules topics (Academics) and drills (MCAT); those are not flashcards, don't delete them.**
5. **Descriptive beats predictive.** If a claim needs verification and verification would create user work, make the feature descriptive instead.
6. **Intervals, not point estimates.** Everywhere.
7. **M2M is the only drilling surface.** Section differences are generator cadence rules or templates, never new screens.
