# MCAT: feature catalog (all 88)

**Companion to `tabs/02-mcat.md`.** That file is the spec; this is the readable index. **Where they conflict, the spec wins.** Copy in "What you see" is illustrative, not final.

**Built Aug 2026** by extraction from the spec, which was already complete. Nothing here is a new decision.

## Part 1 — What is actually built

**Verified Aug 2026 by reading `src/pages/Mcat.tsx` (1,646 lines), `McatFocusSession.tsx` (228), and `McatSessionSetupDialog.tsx`** — the code, not the spec.

> ### ⚠️ The headline, stated plainly: **MCAT is the most convincing façade in the app.**
>
> **All six tabs render. Almost nothing behind them is real.** **There is no `src/lib/mcat/` at all** — no plan generator, no mastery tracker, no M2M analytics, no readiness model. **Every engine the spec describes is absent**, while the surfaces that would display them are fully drawn.
>
> **This is the opposite of Academics**, where the engines are real (`ts-fsrs`, recall queues, tested) and some surfaces are missing. **Here the surfaces exist and the engines do not.**

### A. Real and working

| | Where | Note |
|---|---|---|
| **Six-tab structure + routing** | `Mcat.tsx:186–226` | `dashboard · plan · content · mistakes · stats · advisor` |
| **Mistake Map** | `MistakeMap()` at 620 | **Reads and writes `store.mcat.errorLog`.** Real persistence, real user data |
| **Setup dialog** | `McatSetupDialog()` at 234 | Writes to the store |
| **Content reader** | `ContentReaderPage()` at 1074 + `MarkdownPreview` + `FormulaLine` | **Genuinely renders PrepCat content**, formulas included |
| **Focus session** | `McatFocusSession.tsx` | A real route |
| **Score arithmetic** | `Mcat.tsx:127–135` | `currentScore` from real attempts; `projectedScore` and `readiness` are **derived, but by three lines of inline arithmetic** — see B |

### B. Placeholder — looks built, is not

**Four, and they are the four things a student would look at first.**

| | What is actually there |
|---|---|
| **The study plan** | **`const PLAN_DAYS` at line 74 — a hardcoded array.** `McatPlan`, `PlanDay`, and `StudyQueueRow` all render from it. **The spec's plan generator does not exist**; there is no code that produces a plan from a date, a score goal, and a capacity pool |
| **The activity heatmap** | **`const HEATMAP = Array.from({ length: 70 }, (_, i) => ((i * 7 + 3) % 5))` at line 120.** **A modulo pattern.** It has a tooltip reading *"N study blocks"* for blocks that were never studied |
| **Readiness ring** | Three lines of inline arithmetic clamped between 18 and 92, with `projectedReadiness` set to `readiness + 8`. **`+ 8` is a literal.** The spec's readiness model — intervals, evidence, `U-4` — is not present |
| **Advisor** | `McatAdvisor()` at 839 | No AI, no analysis behind it |

> **`U-4` and `U-9` are both violated by the shipped code today.** The readiness ring is **a point estimate presented as a percentage**, and it reads as a verdict on whether the student is ready. **This is the pillar where `U-8` matters most** and the one place the app currently breaks it.

### C. Specced, not built at all

**There is no `src/lib/mcat/` directory.** Everything the catalog's totals row calls *"the plan generator, mastery tracker, all 16 smart features, all M2M analytics"* — **77 deterministic features by that row's own count** — has no code.

Also absent: the Bookshelf (Wave 4, 9 features) · the M2M loop (Wave 5, 13) · full-lengths and CARS (Wave 6, 11) · flashcards (Wave 8, 6) · test day and retake (Wave 9, 5).

### Summary

**6 real · 4 placeholder · the rest missing.** **The Mistake Map is the only feature on this pillar that stores and reads the student's own work.**

**Consequence for the build manifest:** all three MCAT mockups are `NO`, which is right. **But when they are cleared, the work is not "wire up the UI" — the UI exists.** **It is writing every engine from nothing, then deleting `PLAN_DAYS` and `HEATMAP`.**

---

## How to read the columns

**`Surface`** uses a fixed vocabulary, never prose, so the question *"what lives on Plan?"* is answerable by filtering:

`Dashboard` · `Plan` · `Content` · `Questions` · `Mistakes` · `Stats` · `Advisor` · `session` (focus mode, outside the tab chrome) · `Overview` · `shell` · `none` (a rule or engine behavior with no surface of its own)

**`AI`** answers *"does this need an API key?"*

| | Meaning |
|---|---|
| ○ | Deterministic. No AI, ever. |
| ◑ | **Deterministic today, meaningfully better with AI.** Works without a key, but the non-AI version is the crude one. **This is the upgrade list.** |
| ◐ | AI-assisted, **degrades gracefully**. The feature still works without a key, just plainer. |
| ● | **Requires** an LLM. Without a key it does not exist. |

**Components are not duplicated here.** `Surface` is the join: look the surface up in `02-mcat.md` §7a. One source, no drift.

**Universal rules applying to every row:**

> ⚠️ **Consolidated Aug 2026 → `general.md` § *The nine universal rules*. Do not maintain a copy here.**
>
> **Three catalogs had independently written their own version** — this one, Academics, and Clinical — **already drifting.** **`general.md` holds all nine.** Missing from the list below and binding on this pillar: **`U-2`** (deterministic by default, degrade never break) · **`U-6`** (hours in exactly one pillar) · **`U-7`** (no non-events) · **`U-8`** (may decline to assert, may not withhold) · **`U-9`** (nothing scored, ranked, or compared).
>
> **`U-8` matters here more than anywhere.** **This pillar is full of numbers a student could read as verdicts** — readiness, projected score, percentile. **HQ states them and never tells a student whether they are ready.**

**The four this file already had, retained so it reads standalone:**

- Each smart feature states its cause and is dismissible; none fires more than once per cycle.
- Every nudge competes in the **3-per-week attention auction** (`01` §6.11).
- Probabilistic outputs render as **intervals, never point estimates** (`01` §6.12).
- Insufficient data → **dormant with a reason**, never a zero or an empty chart (`01` §6.10-A).

**Also missing, flagged rather than fixed: no `St` column and no `Part 1`.** Nothing here says what is built versus specced.
- **§2a is MCAT-scoped law:** AI generates **only** M2M drills and flashcard phrasing. QBank, CARS passages, and content are always external.

---

## Wave 1 · The study session (#1–11)

*The centerpiece (§3.0). Studying happens here; everything else is upstream or downstream of it.*

| # | Feature | Surface | AI | What it does | What you see |
|---|---|---|---|---|---|
| 1 | **Study home** | Dashboard | ○ | Today's slice of the plan only; the full schedule lives on Plan | Anki block · CARS passages · UWorld set · content review · due drills, each with a duration |
| 2 | **Start session** | Dashboard | ○ | The tab's primary action | One hero button; readiness and countdown sit beside it, never above it |
| 3 | **Customize your session** | Dashboard | ○ | Adjust before starting | Pick tasks/resources, total duration, Pomodoro on/off + interval lengths |
| 4 | **Focus mode** | session | ○ | Distraction-reduced screen with a timer, outside the shell | Named external tasks to check off: *"CARS · Jack Westin 2 passages"* |
| 5 | **Pomodoro** | session | ○ | Optional work/break cycling | Configurable intervals; off by default |
| 6 | **Auto-logged hours** | session | ○ | Time flows to plan, stats, streak with no separate entry | Nothing. The absence of a timesheet is the feature |
| 7 | **Quick-capture in session** | session | ○ | Log a mistake or a note without leaving focus | Inline capture → M2M (§4) |
| 8 | **Pause / resume / end early** | session | ○ | Ending early logs actual time, not planned time | No penalty framing anywhere |
| 9 | **End-of-session summary** | session | ◐ | Recomputes readiness, streak, coverage; prompts to log misses | Time, tasks done, cards/questions; **the coach's one line lives here (#87)** |
| 10 | **Mark content reviewed** | session | ○ | Session completion updates the mastery tracker | *"Mark amino acids reviewed?"* |
| 11 | **Overview widget** | Overview | ○ | The only non-MCAT surface that launches studying | Compact card: today's target, `Start session` / `Resume`, streak, next task |

---

## Wave 2 · The plan (#12–22)

*Fully rules-based (§3.3). No LLM anywhere in this wave, which is why it ships early and works offline.*

| # | Feature | Surface | AI | What it does | What you see |
|---|---|---|---|---|---|
| 12 | **Intake** | Plan | ○ | Hours/day, study days, test date, year, background | A wizard, once |
| 13 | **Phased generation** | Plan | ○ | Foundation → Practice → Polish → Full-length | Colour-legended phases, day by day to test day |
| 14 | **Busy-period awareness** | Plan | ○ | Intake captures periods the plan must route around | Finals weeks and trips are not filled with sessions |
| 15 | **Drag to reschedule** | Plan | ○ | The plan adjusts around your edits rather than fighting them | Drag a session to another day; hover a day to change its hours |
| 16 | **Projected vs goal** | Plan | ○ | States the gap plainly | *"Projected 500 · 20 pts to go"* |
| 17 | **Rebuild to close the gap** | Plan | ○ | Recomputes for the best achievable score in the time left | Asks hours/day + study days, then rebuilds |
| 18 | **Honest unreachability** | Plan | ○ | Refuses to pretend a goal is reachable when it is not | *"Add a day or an hour to close it"* |
| 19 | **Week / Month views** | Plan | ○ | Two zoom levels on the same plan | Segmented switcher (a filter, not a mode) |
| 20 | **FL as a scheduled object** | Plan | ○ | An FL is 7.5 hours and cannot happen after class on a Tuesday | Placed on a day with contiguous hours, **at real exam start time** where possible |
| 21 | **FL review block reserved** | Plan | ○ | The 3–5 hour review is scheduled as its own item | *"People skip FL review because they never budgeted for it"* |
| 22 | **Google Calendar export** | Plan | ○ | Sessions, FLs, and review blocks leave the app | §3.3-F; a global capability, not MCAT-only |
| 89 | **Study-hour target, optional** | Plan | ○ | A **second** target beside the score goal, answering *am I putting in the time* rather than *am I on track for the score*. Reuses `03-clinical.md` §7a wholesale | *"Students commonly report studying **300 to 400 hours**. Community consensus, not an official figure."* Shown **once**, at the set-a-target moment. **Field starts empty**; a pre-filled 350 would become the standard regardless of the caption. §3.3-G |

---

## Wave 3 · Content & mastery (#23–33)

*§3.5. The honest answer to "am I ready?", and the input to every readiness number.*

| # | Feature | Surface | AI | What it does | What you see |
|---|---|---|---|---|---|
| 23 | **Content mastery tracker** | Content | ○ | Checklist across all AAMC categories from `mcat-content.json` | Per category: not started → reviewing → confident → mastered |
| 24 | **Section rollups** | Content | ○ | Feeds the readiness number instead of a vague estimate | % of each section's categories at each state |
| 25 | **Performance nudge on state** | Content | ○ | Repeated M2M misses can flag a category needing review | Even if the student marked it confident |
| 26 | **Mastery decay (FSRS)** | Content | ○ | A `mastered` checkmark drifts back toward `needs review` | *"Amino acids, reviewed in June, worth a refresh"* |
| 27 | **Per-section decay rates** | none | ○ | P/S fast · C/P and B/B moderate · **CARS barely** | Invisible. **A uniform curve would nag about CARS and under-warn P/S** |
| 28 | **Student-set states win** | none | ○ | Marking `mastered` again resets the curve | HQ proposes, never overrides |
| 29 | **Coursework cross-feed** | Content | ○ | Academics pre-seeds categories already covered in class | §8 |
| 30 | **Study library** | Content | ◐ | Guides, equation sheets, pathway worksheets, mnemonics, games | Section-filtered. **Summaries may be LLM-synthesized; practice items never are** |
| 31 | **Tied to your mistakes** | Content | ◑ | Flags the parts relevant to logged weaknesses | Highlight, not a separate list |
| 32 | **Points outward** | Content | ○ | A weak category links the **external** resource for it | Khan Academy, a content guide. **No generated content** |
| 33 | **AAMC trademark disclaimer** | shell | ○ | Required legal line | *"MCAT is a program of the AAMC, which does not sponsor or endorse this product"* |

---

## Wave 4 · The Bookshelf (#34–42)

*§3.10, P2. **Inside Content**, not a new tab. The "your copy" layer over the resource bank.*

| # | Feature | Surface | AI | What it does | What you see |
|---|---|---|---|---|---|
| 34 | **The one-question hero** | Content | ◑ | Answers *"what should I use right now?"* with a reason | One recommendation on top; **the catalog sits below it, not as a grid of logos** |
| 35 | **Phase-aware** | Content | ○ | Reads the plan's phase; never asks | Foundation surfaces content review, Polish surfaces AAMC material |
| 36 | **One line, one link** | Content | ○ | *"Today's block is amino acids, and Khan Academy covers both"* | `Open` opens externally, never embedded |
| 37 | **Honest empty day** | Content | ○ | Says so rather than manufacturing a suggestion | One line, per `01` §6.10-A |
| 38 | **`ShelfItem` tracking** | Content | ○ | Access, acquisition, expiry, cost, last used, consumed % | Grouped **by purpose, not price** |
| 39 | **Expiry, paid items only** | Content | ○ | Free resources carry **no expiry field at all** | Khan Academy shows `Free` and nothing else. `lifetime` is a real value, not a null date |
| 40 | **Collision-only warnings** | Content | ○ | Fires once, and **only when an expiry hits a planned block** | *"An expiry three months away from anything is not news"* |
| 41 | **Gaps, not just holdings** | Content | ○ | Names what the shelf does not cover | *"Nothing on your shelf covers P/S content review"* → links the bank |
| 42 | **No affiliate, no upsell** | none | ○ | Free options first; cost shown only for what you already own | **HQ is not a sales channel for prep companies** |

---

## Wave 5 · Questions & the M2M loop (#43–55)

*§4. The loop inside studying, and the only place AI generates practice.*

| # | Feature | Surface | AI | What it does | What you see |
|---|---|---|---|---|---|
| 43 | **QBank, DEFERRED** | Questions | ○ | **Locked: not built until legitimately sourced.** No copying another product's bank | Questions links out to AAMC/UWorld; in-app practice is M2M drills |
| 44 | **Per-answer-choice explanations** | Questions | ○ | Why correct, and why each wrong one is wrong | The reusable pattern; **the differentiator, not owning a bank** |
| 45 | **Per-question AI Tutor** | Questions | ● | *"Still unsure? Talk it through"* | Chat: why the right answer works, why your pick was off |
| 46 | **M2M Stage 1, Capture** | Mistakes | ○ | Screenshot or paste a missed question | From anywhere, including mid-session |
| 47 | **M2M Stage 2, Diagnose** | Mistakes | ◑ | **The spine.** Concept + miss-reason | Searchable concept picker + reason `Select` |
| 48 | **M2M Stage 3, Drill** | Mistakes | ● | Same concept, new context. **The only AI-generated practice in HQ** | A bespoke question targeting *your* specific error |
| 49 | **M2M Stage 4, Analytics** | Mistakes | ○ | **Deterministic, no AI** | Cause × section heatmap, most-missed breakdown |
| 50 | **M2M Stage 5, Resources** | Mistakes | ○ | Points at external material for the concept | Resource bank links |
| 51 | **Drill scheduling** | Mistakes | ◑ | **The answer is the grade** (§3.9-a, locked) | Drill performance drives scheduling; nothing else does |
| 52 | **Post-clearing behavior** | none | ○ | Cleared concepts return to decay; repeat misses rank above first-timers | Two cycles escalate to content review |
| 53 | **Mistake cards → Anki** | Mistakes | ◐ | Turns a miss into a card; **AI helps phrase front/back** | Exports `.apkg` to `MCAT Mistakes::{SECTION}`; **HQ never reviews it after export** |
| 54 | **Screenshot front, diagnosis on back** | Mistakes | ○ | The card carries the diagnosis, not just the answer | Front shows no original answer |
| 55 | **Section practice, REJECTED** | none | ○ | P3, closed July 2026 | Recorded so it is not retried |

---

## Wave 6 · Full-lengths & CARS (#56–66)

*§3.6 and §3.7. FLs move scores more than anything; CARS is the habit that decays fastest.*

| # | Feature | Surface | AI | What it does | What you see |
|---|---|---|---|---|---|
| 56 | **FL logging** | Dashboard | ○ | Which exam, date, scores, pacing notes | `Log a full length` opens the review workflow |
| 57 | **Section granularity is the FLOOR** | none | ○ | **Total-only is not a valid FL record** | Four section scores minimum. A total alone destroys weakest-section, stamina, and projection |
| 58 | **Content-category breakdown** | Dashboard | ○ | AAMC's per-category data is the ceiling | Worth the entry friction; makes §3.5 and retake precise |
| 59 | **Validity flags** | Dashboard | ○ | One sitting? Real breaks? Fully timed? Time of day? | **An FL across two evenings is not a data point about your score** |
| 60 | **Invalid FLs kept, not counted** | Stats | ○ | Shown, excluded from projection, labelled why | **Never silently dropped, never silently counted** |
| 61 | **FL review walk** | Mistakes | ◑ | Each miss pushes into M2M with concept + reason | One FL becomes a batch of targeted drills |
| 62 | **Projection recalibration** | Stats | ○ | A real FL replaces the heuristic for that point | The estimate sharpens over time |
| 63 | **FL trends** | Stats | ○ | Scores per section over time, pacing, readiness read | Are you climbing where you need to? |
| 64 | **Stamina decay** | Stats | ○ | Trend across four sections within one sitting | *"Your fourth section averages 3.7 points below your first"* as an **interval**. **No stamina screen** |
| 65 | **CARS daily trainer** | session | ○ | Timed passage mode, a standing daily block | **External passages only, never AI-generated** |
| 66 | **CARS reasoning review** | Mistakes | ○ | Diagnoses by CARS miss-reasons, tracks per-passage timing | Trap answer / missed main idea / wrong inference / misread / time |

---

## Wave 7 · Readiness & stats (#67–73)

*§3.1 and §5a. Stats measures score and readiness; Mistakes measures cause and concept. Different questions.*

| # | Feature | Surface | AI | What it does | What you see |
|---|---|---|---|---|---|
| 67 | **Readiness hero** | Dashboard | ○ | Driven by the mastery tracker + diagnostics + logged FLs | Overall % + per-section bars. **Honest "just getting started" at 0** |
| 68 | **Projected score** | Dashboard | ○ | Interval, never a point estimate | Projected by exam day, with delta |
| 69 | **Diagnostic entry** | Dashboard | ○ | Gives readiness a real baseline | *"Add your diagnostic score"* |
| 70 | **Score slider** | Stats | ○ | Diagnostic → now → goal | One control, three points |
| 71 | **Stat tiles** | Dashboard | ○ | Streak, hours, mastered, current score | **Never a pace line on the streak** |
| 72 | **Consistency heatmap** | Dashboard | ○ | Study consistency over time | Heatmap ∈ the approved graphic vocabulary |
| 73 | **Percentiles are dated** | Stats | ○ | A 512 is not a fixed percentile | Year stated, Category A, **never a hardcoded constant** |

---

## Wave 8 · Flashcards (#74–79)

*§3.8, §5h, §5i. **Export only.** HQ never reviews a card.*

| # | Feature | Surface | AI | What it does | What you see |
|---|---|---|---|---|---|
| 74 | **Pre-made decks first** | Content | ○ | High scorers use MilesDown / AnKing / Pankow, not homemade | Default view; **HQ never nudges you to build a deck from scratch** |
| 75 | **Anki owns all timing** | none | ○ | One-scheduler rule (§5g) | HQ may *display* due counts via AnkiConnect; it never schedules |
| 76 | **`.apkg` export, globally** | Content | ○ | Every export in HQ, both tabs | Driven by the screenshot requirement: `.txt` cannot carry media |
| 77 | **Three note types only** | none | ○ | Basic · Cloze · Image Occlusion, native only | **Anki 23.10+ required for Image Occlusion**, stated at export |
| 78 | **FSRS presets, named** | Content | ○ | Community-sourced presets, global with per-class override | **Presets copy SETTINGS, never PARAMETERS** |
| 79 | **Advanced panel, four controls** | Content | ○ | Exactly four, and yes it gets built | Plus Easy Days, "worth stealing outright" |

---

## Wave 9 · Test day & retake (#80–84)

*§3.11 and §3.12. Phase-gated: invisible until actionable.*

| # | Feature | Surface | AI | What it does | What you see |
|---|---|---|---|---|---|
| 80 | **Test Day panel** | Dashboard | ○ | **Ruled a phase-gated panel, not a tab** | Hidden until the phase opens |
| 81 | **What to bring** | Dashboard | ○ | ID rules, what's allowed, what the centre supplies | **Category A, freshness-tracked.** A stale packing list is worse than none |
| 82 | **Void honesty** | Dashboard | ○ | A voided exam produces no score **and still counts against attempt limits** | The part students routinely miss. **Voiding is not a free reset** |
| 83 | **Score release window** | Dashboard | ○ | A date **range**, never a point estimate | Source dated; Category A |
| 84 | **Retake mode** | Plan | ○ | Generator inverts: breadth-first becomes **gap-first** | *"Weighted toward CARS (126) and timing. Your B/B and P/S held."* **Not a separate sub-tab** |

---

## Wave 10 · Smart features, Advisor, coach (#85–88)

*§5b's sixteen are deterministic. The Advisor and coach are the tab's only true LLM surfaces.*

| # | Feature | Surface | AI | What it does | What you see |
|---|---|---|---|---|---|
| 85 | **The 16 smart features** | various | ○ | Stale plan · falling behind · goal unreachable · weakest section · never-reviewed · overconfidence · mistake cluster · cause concentration · CARS habit break · FL cadence · FL not reviewed · resource gap · prereq coverage · cram-risk · exam-date drift · **flagged-but-correct** | Each states its cause, dismissible, one pace line per panel max |
| 86 | **Flagged-but-correct** ⭐ | Questions | ○ | **The cheapest high-value capture in the tab.** Tracks guessed-and-right as latent misses | One tap at answer time. **Changes what §3.5 may call `mastered`** |
| 87 | **The coach** | session | ◐ | One line in the end-of-session summary. **No surface of its own** | **Detection is deterministic**; the specificity bar is the whole feature |
| 88 | **Advisor chat** | Advisor | ● | Knows plan, pace, score, time left; **reshapes the plan from today** | Quick-reply chips: *"I'm falling behind"* · *"make next week lighter"* |

---

## Totals

**89 features.** By AI dependency:

| | Count | Which |
|---|---|---|
| ○ deterministic and sufficient | 77 | The plan generator, mastery tracker, all 16 smart features, all M2M analytics |
| ◑ **better with AI** | 5 | #31 · #34 · #47 · #51 · #61 |
| ◐ degrades gracefully | 4 | #9 session summary · #30 study-guide summaries · #53 card phrasing · #87 coach |
| ● requires an LLM | 3 | **#45 Tutor · #48 M2M drills · #88 Advisor** |

**Only three features hard-require an API key**, and all three have manual paths around them, so §3.3's claim that the tab ships early and works offline still holds.

**The five ◑ cluster around diagnosis.** #47 makes the student pick a concept and miss-reason from long lists; #61 asks that per question across a whole full-length. Suggesting both from the question text is the single highest-leverage AI addition in this tab, because **the diagnosis is the spine of M2M** and every drill downstream depends on it being right.

By surface, the busiest are **Dashboard** (13) and **Content** (16, inflated by the Bookshelf living inside it), which is worth watching: §3.10 already ruled the Bookshelf a *layer* within Content rather than its own tab, and 16 items is the pressure test on that ruling.
