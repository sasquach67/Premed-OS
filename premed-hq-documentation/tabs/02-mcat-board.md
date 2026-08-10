# MCAT — the board before speccing

Companion to `tabs/02-mcat.md`. **Reference index, not spec** — that file wins on any conflict.

---

## 1. Surfaces that already exist in the spec

**Sub-tabs (flat, no mode switch):** `Dashboard · Plan · Content · Questions · Mistakes · Stats · Advisor`

| Surface | § | Status |
|---|---|---|
| **Study session** — the centerpiece: study home, focus mode + timer/Pomodoro, end summary, Overview widget | 3.0 | specced |
| **Dashboard** — readiness hero, projected score, today's plan, right rail, FL logging | 3.1 | specced |
| **Plan** — intake → phased day-by-day plan (Foundation/Practice/Polish/FL), editable, rebuild-to-close-the-gap | 3.1, 3.3 | specced |
| **Content** — study library + content mastery tracker | 3.1, 3.5 | specced |
| **Questions (QBank)** — per-answer-choice explanations + AI Tutor. **Browsable bank DEFERRED until legitimately sourced** | 3.1 | specced, content deferred |
| **Mistakes (M2M)** — capture → diagnose → drill → mastery | 4 | specced |
| **Stats** — score/readiness trends, consistency, most-missed | 3.1 | specced |
| **Advisor** — AI counselor, permission-first, tool-calls the plan generator | 3.1, 3.4 | specced |
| **Full-length review workflow** | 3.6 | specced |
| **CARS trainer** — daily timed passages, reasoning-based review | 3.7 | specced |
| **Flashcards** — pre-made decks first (MilesDown/AnKing/Pankow), custom cards from misses | 3.8 | specced |
| **Plan generator engine** — rules-based, no LLM; projection model; Google Calendar export | 3.3 | specced |

---

## 2. Existing smart features (§5b) — 15, all deterministic

1. Stale plan · 2. Falling behind · 3. Goal unreachable · 4. Weakest-section nudge · 5. Never-reviewed content · 6. Overconfidence pattern · 7. Mistake cluster · 8. Cause concentration · 9. CARS habit break · 10. FL cadence · 11. FL not reviewed · 12. Resource gap · 13. Prereq coverage (Academics cross-feed) · 14. Cram-risk · 15. Exam-date drift

Plus app-wide lifecycle/attention/trust (§5d) and course-topic inheritance from Academics at term rollover.

---

## 3. Brainstormed — PROMOTED, needs speccing

Ordered by how much they change the tab.

| # | Thing | Why it matters | Shape |
|---|---|---|---|
| **P1** | **Content-mastery decay** ⭐ | §3.5 currently treats mastery as permanent checkmarks. A 6-month prep means month-1 content is 5 months stale at test day. **This is how people plateau at 505 after "finishing" content review.** FSRS already exists. | change to §3.5 + plan generator |
| **P2** | **Bookshelf** ⭐ | Phase-aware resource shelf. Hero answers *"what should I use right now"* — one recommendation, catalog below. Subscription expiry vs plan (*"UWorld 90-day ends Mar 3, heaviest block is Mar–Apr"*), **AAMC burn rate**, owned-and-untouched. **No affiliate links, ever.** | new surface, likely inside Content |
| **P3** | **Per-section training modes** ⭐ | CARS got a bespoke surface because it's a skill. All four sections fail differently and the other three are treated identically. **Per-section miss-reason taxonomies** — otherwise mistake analytics collapse to "I got it wrong" for 3 of 4 sections. C/P + CARS = daily; P/S = deck; B/B = weekly block. | restructures Questions/Content |
| **P4** | **Test Day** ✅ SPECCED → §3.11 | Phase-gated and **hidden until actionable** — logistics must not compete with studying. Registration (~6mo) → logistics (~3wk) → after (score release, retake-or-apply). Void briefing delivered **before** the exam, since you can't use your phone during it; its content is mostly *"feeling bad is not information."* **No seat-availability checking — no AAMC API exists.** | **RULED: Dashboard panel, phase-gated — NOT a tab** (§3.11) |
| **P5** | **Stamina training** ✅ SPECCED → §3.12-A | Progression: 2-section → 3-section → full FL with real breaks, at least one at your true exam time of day. **Metric: score decay within an FL** — first section 128, last section 124, consistently, is fatigue not knowledge. Computable from section scores already logged; nobody computes it. | **RULED: generator behavior, no surface** (§3.12-A) |
| **P6** | **Retake mode** ✅ SPECCED → §3.12-B | ~A third of test-takers retake, and a retake plan should not look like a first attempt. Target the gap using your own FLs, mistakes, and section scores. **Prep companies can't do this — they don't have your history.** | **RULED: generator weights, same Plan tab** (§3.12-B) |
| **P7** | **The taper** ✅ SPECCED → §3.12-C | Final week: stop new content, go light, rest. Students do the opposite. Must **override the plan generator**, not be a note. | **RULED: hard generator override** (§3.12-C) |
| **P8** | **Coach (non-content)** ✅ SPECCED → §5j | Everything that isn't material: focus, session patterns, time-of-day performance vs scheduled exam time. **Observed and specific, never generic** — *"your last three sessions ended 20 min early, your average is 50"* not *"remember to sleep."* **Hard boundary: must not handle distress** — when signals look heavier, stop coaching rather than coach harder. | **RULED: no surface — one line in the end-of-session summary** (§5f placement · §5j behavior) |

---

## 4. Brainstormed — MINOR ADD-ONS (build, don't headline)

- **Review-to-practice ratio** — re-read detection (#26) pointed at QBanks. *"60 questions in 90 min, reviewed for 20."*
- **Pacing analysis** — post-hoc only, **no live cues during practice exams**. Scoped to what HQ can see (in-app practice + manual entry); UWorld and AAMC don't export per-question timing.
- **Timed-vs-untimed honesty** — *"your 78% was untimed; timed average is 64%."*
- **Anki deck pace** — 4,000 cards ÷ 5 months = required cards/day vs actual. Pure arithmetic.
- **Method-to-outcome** — which resource actually moved a category; feeds Bookshelf recommendations.

---

## 5. REJECTED — do not build

- **Target score from school list** — "not that deep."
- **Separate diagnostic surface** — AAMC FL1 covers it.
- **Live pacing cues during practice exams** — the real exam has none; training with a crutch trains the wrong thing.
- **Seat-availability checking** — no AAMC API exists.
- **AI-generated QBank, CARS passages, or content** — M2M drills and flashcards only (§2a, locked).

---

## 6. Governing note

**Do not bombard the user** (Andy, July 2026). MCAT prep is already overwhelming, and this is the tab most at risk of burying someone in metrics. The §6.11 attention budget applies here with the least slack of anywhere in the app. **One clear next action beats twelve accurate readouts.**

---

## 7. Resolved (July 2026)

- **P8 placement — no surface.** The coach lives in the **end-of-session summary** (§3.0-C): at most one observation, only when it clears a specificity bar. A tab would have space to fill and would fill it with boilerplate. See §5f.
- **P3 structure — Questions, as modes.** Miss-reason taxonomy attaches to the `Mistake` object; Content stays about material. CARS keeps its bespoke surface for cadence reasons. See §5f.
- **Difficulty ordering — encode ORDERING, not offsets.** Rank + `directional_only` flag, numbers in config with `verifiedAsOf`, never a converted score displayed as an AAMC score. See §3.3-C1.

## 8. Added July 2026 — gaps found after the first board

| # | Thing | Why |
|---|---|---|
| **P9** | **Exam date as a decision** ⭐ (§3.3-A1) | The highest-leverage move in the tab, currently just an input field. Determined by coursework completion, real weekly hours, retake headroom, and — **the one nobody accounts for — AMCAS submission timing.** Admissions are rolling, so scores landing after the early window cost more than a few points would. Belongs in **intake**, not Test Day. |
| **P10** | **Publisher normalization** ⭐ (§3.3-C1) | If the projection averages mixed-publisher FLs, **the hero number of the tab is wrong.** AAMC is the trend line; third-party renders separately and `directional only`; never averaged. |
| **P11** | **Slack in the plan** ⭐ (§3.3-B1) | Without explicit catch-up days, **every user is behind by week three**, #2 fires constantly, gets ignored, and the attention budget is spent on noise. With slack, "falling behind" means you burned your buffer — a real signal. Busy periods captured at intake so the plan bends rather than breaks. |
| **P12** | **Pre-prep staleness as a generator input** ⭐ (§3.3-B2) | Biochem two years ago, psych freshman fall. Tier-one review = **stale AND heavily weighted**; everything else skims. Reads the Academics coursework timeline — **prep companies structurally cannot do this.** |
| **P13** | **Projection: range, gated, and scored** (§3.3-C, C2, C3, C4) | Range not point. Silent below a minimum FL count. **Scored against the next FL — and this one is free**, because that score is already logged for its own sake. Percentiles from a dated table, never a constant. |

**On P1 × P3:** decay rates differ by section — **P/S fast, C/P and B/B moderate, CARS barely at all.** One uniform curve would nag about CARS and under-warn on P/S. **Build P1 and P3 together, not sequentially** (§3.5).

---

## 9. Round-three additions (July 2026)

| # | Thing | Why |
|---|---|---|
| **P14** | **Flagged-but-correct** ⭐ (§5b #16) | **Cheapest high-value capture in the tab.** Guessed-and-right items look like mastery in every metric and are latent misses — why a 78% practice average becomes 62% on test day. One tap at answer time. **Changes what §3.5 may call `mastered`.** |
| **P15** | **FL as a scheduled object** ⭐ (§3.6) | 7.5 hours can't happen after class on a Tuesday, and review is another 3–5. The generator places the FL on a day that exists, at the real start time, **and reserves the review block.** People skip FL review because they never budgeted for it. |
| **P16** | **FL section granularity + validity flags** (§3.6) | Total-only entry destroys #4, P5, and the projection. **Four section scores is the floor**, AAMC category breakdown the ceiling. An FL taken across two evenings with pauses **must be excluded from the projection, not silently counted.** |
| **P17** | **One hour budget across tabs** ⭐ (§3.3-B0) | MCAT and Academics bid for the same evenings and neither generator knows the other exists. **Two reasonable plans sum to impossible and the student fails both.** Shared weekly capacity at the shell level. **The clearest "only HQ can do this" feature in the app.** |

## 10. Review-loop ownership — RESOLVED (§5g)

**Anki owns MCAT content review** (pre-made decks). **HQ owns M2M drills.** The mistake *card* is an export, not a second scheduled queue — because a student already opening Anki daily will not maintain two review apps.

**Consequence for P1:** content-mastery decay reads **performance, not review activity** (drill results, practice results, FL category performance, time since marked reviewed). HQ cannot see Anki reviews — and performance is the better signal anyway. AnkiConnect due-counts are optional display only, never load-bearing.

**Same axis answers Academics:** HQ owns topics, Anki owns cards. One pattern, two tabs.

---

## 11. Anki boundary + FSRS presets — RESOLVED (§5h, §5i)

**No flashcard review in HQ, either tab.** HQ generates → tags → exports. Anki reviews. One direction, no sync, no card queue, no card UI. The earlier "reviewable in-app via `ts-fsrs`" language is removed from both specs.

**Not removed:** HQ's `ts-fsrs` still schedules **Academics topics** and **MCAT M2M drills**. Neither is a flashcard. Drills live in the daily mistake-review block the plan generator already schedules.

**Mistake cards carry the diagnosis as tags** — `HQ::cause::misread`, `HQ::section::bio-biochem`, `HQ::concept::amino-acids`, `HQ::source::aamc-fl3` — so cause-based filtering and suspending work inside Anki. Tab-separated export with a tags column; batch supported; no API or add-on.

**Consequence:** mastery and content decay read **drill and practice performance only**. HQ has no visibility into card review by design.

**FSRS presets** — effort-level (Light/Standard/Exam-heavy) **plus named community presets** (AnKing and others, attributed, `verifiedAsOf`, Category B research task). Advanced exposes only what transfers: retention, max interval, leech threshold/action, Easy Days. **Settings transfer; the 19 parameters do not** — never paste, never ship someone else's, re-optimise from the user's own history.

**Easy Days** is borrowed outright and plugs into intake busy periods and the shared hour budget.

---

## 12. P3 REJECTED (July 2026)

**Per-section training modes are not built.** Andy: *"if we're drilling, isn't the M2M enough?"* — correct.

- **B/B reasoning mode** — redundant; you do those passages externally anyway and **M2M already does the diagnosis**.
- **P/S volume mode** — redundant; **§3.5 already tracks category coverage**, and §5h forbids card review in HQ.
- **Per-section cause taxonomies** — already rejected in §2b, which was half of P3's rationale.

**M2M is the drilling surface. There is not a second one.**

**Survives:** C/P calculator-free speed drills as a **minor add-on** (procedurally generated, no LLM) — M2M is reactive and nobody logs a mistake for being slow at division. Per-section **cadence** becomes a plan-generator rule, not UI. **Per-section decay curves (P1) are unaffected** and stay in §3.5.

---

## 13. P2 Bookshelf — SPECCED (§3.10)

Inside **Content**, not a new tab. **Hero = one recommendation with its reason**; catalog below. Phase read from the plan generator.

The three things a list can't do: **expiry against your planned blocks** · **AAMC burn rate** (feeds the generator so AAMC schedules late by construction) · **owned-and-untouched**. Plus coverage gaps.

`ShelfItem` with `lifetime` as a real value, coarse optional `consumedPct`, `lastUsedAt`. Resource bank (§7) stays the reference; the shelf is your copy of it.

**Hard rules:** no affiliate links, no sponsored placement, no purchase nudges, free options first where competitive, recommendations attributed and dated, works with an empty shelf.

## 14. P3 — CLOSED (§3.9, §3.9-a)

**No section surfaces, no specialised drilling.** P3 reduces to two things:
1. **Section-aware drill templates** inside the one M2M screen — C/P calculation · B/B data item · P/S term item · **CARS pattern drill with no generated passage** (§2a turned into a better drill). Mockup: `specifications/mockups/02-mcat/mcat-section-aware-drills.html`.
2. **Tagged Anki export** — section · cause · concept · source (§5h).

**Also fixed:** `Again/Hard/Good/Easy` removed from drills. **The answer is the grade** — wrong → soon · right-but-flagged/guessed → medium · right-and-unflagged → longer. Intervals shown, never chosen. Mastery = cleared correctly and unflagged across **≥2 spaced encounters**.
