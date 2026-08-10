# MCAT

**Status:** Core designed (July 2026) — **study session is the centerpiece** (§3.0); Mistake-to-Mastery is a loop inside it (§4). Content mastery tracker (§3.5), full-length review workflow (§3.6), and CARS trainer (§3.7) added. AI/content rule locked (§2a). Refining with incoming materials (Andy's build screenshots, walkthrough).
**Sidebar group:** Foundation · **Spec type:** domain tab
**Repo:** `sasquach67/Premed-OS` — `src/pages/Mcat.tsx` (1071L), `src/components/mcat/McatSessionSetupDialog.tsx`
**Depends on:** `specifications/00-product-shell.md`, `specifications/01-shared-interface-patterns.md`, `specifications/04-visual-craft-standards.md`, `architecture/02-global-intelligence-framework.md`, `data/mcat-content.json`
**Models after:** Mistake to Mastery (mistaketomastery.com) — its mistake-review loop is the reference for the Mistakes feature.

---

## 1. Purpose

The MCAT tab is the most functionality-heavy page, and its centerpiece is **the act of studying itself** — the **study session** (§3.0). You land on what you need to study today, hit **Start session**, and study inside a focused timer. Everything else exists to serve that loop: the **plan** decides what today's session is, the session *is* the studying, and its byproducts — logged mistakes, covered content, practice scores — flow into **Mistake-to-Mastery** (§4), the **content mastery tracker** (§3.5), and the **stats/projection**. M2M is a powerful loop *inside* studying, not the point of the page.

> **Hierarchy (locked):** Plan → **Study Session (centerpiece)** → produces mistakes (M2M), content coverage, and scores → feed readiness/projection → Advisor reshapes the plan. Start-a-session is the tab's primary action and an **Overview widget** (§3.0).

## 2. Ownership (from shell §2.2)

- **Owns:** **study sessions** (focus/Pomodoro logs), practice scores + full-lengths, study schedule/plan, content-mastery/coverage state, **mistakes + their diagnoses**, **drills**, error/analytics, MCAT resources.
- **References:** Tasks; `data/mcat-content.json` (section structure, AAMC content categories, percentile table — reference data, not owned here).

## 2a. AI & content rule (LOCKED — **MCAT-scoped**, not app-wide)

> **Scope note (July 2026):** this rule governs **the MCAT tab only**. It exists because MCAT practice must be *representative of a real standardized exam* — generated questions mislead about difficulty, style, and answer logic, and copying real ones is an IP problem. Neither concern applies to coursework. **Academics has a permissive generation policy** (`tabs/01-academics.md` §6.3): AI may generate practice exams, problem sets, quizzes, and study guides grounded in that class's own materials. Do not apply the MCAT restriction to Academics.

- **AI generates practice *items* in exactly TWO places: (1) Mistake-to-Mastery drill questions** (§4, bespoke to your specific error) **and (2) flashcards** (§3.8, AI-assisted card creation). Nowhere else.
- **QBank questions, CARS passages, and content are externally sourced / curated, never AI-generated** — real external sources (e.g. Khan Academy — one example — plus AAMC, UWorld, Jack Westin, open materials). The app links to / ingests these; it does not manufacture them.
- **Flashcards are the deliberate exception, because good MCAT card sources are scarce and card-making is a legitimate study act.** But the center of gravity differs by domain (§3.8): **MCAT = pre-made decks first** (MilesDown / AnKing / Pankow), with AI-assisted custom cards reserved for **missed questions** (synced to M2M); **Academics = AI-generated from your own notes/study guides first** (no pre-made deck exists for your class — `tabs/01-academics.md` §6.2).
- **The LLM is for guidance, synthesis, and now card-drafting — not for question banks:** the Advisor, the per-question Tutor's *explanations*, mistake auto-classification, study-guide *summaries*, flashcard phrasing, and research/synthesis. It never fabricates QBank/CARS/content practice questions.

## 2b. Data model (added July 2026 — was missing; define before building)

Mirrors the discipline of `tabs/01-academics.md` §3. **Define these entities before any MCAT chunk is built** — otherwise the builder invents them and you get the duplicate-record problem D1 had to untangle in Academics.

- **`StudySession`** (owned) — the centerpiece record. `id`, `startedAt`, `endedAt`, `plannedMinutes`, `actualMinutes`, `pomodoro { enabled, workMin, breakMin }`, `tasks[]` (each: kind `anki|cars|qbank|content|drill|full-length`, resource name, planned/actual minutes, completed), `notes`, `mistakeIdsCaptured[]`, `topicsCovered[]`. Auto-logs hours to plan + stats + streak.
- **`Mistake`** (owned) — `id`, `capturedAt`, `section` (`c/p | b/b | p/s | cars`), `sourceKind` (`screenshot | paste | text | full-length`), `image?`, `questionText?`, `yourAnswer`, `correctAnswer`, `guessed`, `flagged`, **`conceptId`** (→ `data/mcat-content.json` content category, Sciences only), `subConcept?`, **`missReason`** (locked taxonomy — §4 Stage 2), `linkedDrillIds[]`, `linkedFlashcardIds[]`, `resolvedAt?`.
#### `missReason` — ONE general taxonomy (LOCKED July 2026 · Andy)

**Six causes, shared with `AcademicMistake` (`01` §3.3) — one vocabulary across the whole app:**

`didnt-know` · `knew-it-but-blanked` · `wrong-method` · `misread` · `arithmetic` · `ran-out-of-time`

**Plus CARS only** — `trap-answer` · `missed-main-idea` · `wrong-inference` (existing, §4). CARS earns extensions because it has no content dimension at all; these are not expressible in the base set.

> **REJECTED July 2026 — do not reintroduce: per-section cause extensions.** An earlier draft added ~10 (`unit-conversion`, `misread-figure`, `confused-control`, `term-confusion`, `failed-to-estimate`, …). **Andy: keep it general.** He's right on two counts:
> - **The base set already covers them.** `misread` covers misreading a figure. `wrong-method` covers confusing a control or failing to connect the passage. `arithmetic` covers a unit-conversion slip. `didnt-know` covers a formula not recalled.
> - **They were finer without being more actionable**, and a longer list turns tagging from a reflex into a decision — a friction-rule failure (`01` §6.7). **Nine options is the ceiling; a taxonomy nobody fills is worth nothing.**

**Rules:**

- **One tap to tag.** If the student has to think about which cause applies, the list is too long.
- **`ran-out-of-time` and `arithmetic` carry most of the MCAT-specific weight** — timing is *the* MCAT failure mode (#8 routes it to a pacing fix, not more content) and calculator-free arithmetic is *the* C/P failure mode.
- **Analytics segment by section** — a cause-frequency chart mixing C/P arithmetic with CARS inference is meaningless — but the **vocabulary does not change per section.**
- **Extensible as config**, though the bar for adding one is now explicitly high.
- **`section` already carries the sectional dimension.** Cause × section gives the cross-tab you want without duplicating the vocabulary four times.

- **`Drill`** (owned, generated) — `id`, `mistakeId`, `conceptId`, `prompt`, `choices[]`, `answer`, `explanationPerChoice[]`, `source` (`ai-generated | free-bank`), plus **FSRS fields** (`stability`, `difficulty`, `retrievability`, `dueAt`, `lastReviewedAt`) via `ts-fsrs` — **the same engine as Academics; never a second scheduler**.
- **`ContentMastery`** (owned) — one row per AAMC content category: `categoryId`, `section`, `state` (`not-started | reviewing | confident | mastered`), `selfRatedAt`, `missCount` (from `Mistake`), `overrideFlag` when performance contradicts the self-rating. **Drives the readiness number** (§3.5).
- **`FullLength`** (owned) — `id`, `provider` (`aamc-fl1..4 | third-party`), `takenOn`, `sectionScores { cp, cars, bb, ps }`, `total`, `pacingNotes`, `reviewedMistakeIds[]`, `usedForCalibration` (bool). Recalibrates the projection (§3.3-C).
- **`McatFlashcard`** (owned) — `id`, `origin` (`missed-question | manual`), `mistakeId?`, `front`, `back`, `deckRef?` (external pre-made deck name, bookmark only), FSRS fields, `exportedAt?`. Custom cards only; **pre-made decks are external and never modelled as HQ cards** (§3.8).
- **`StudyPlan` + `PlanSession`** (owned) — plan: `testDate`, `hoursPerDay`, `studyDays[]`, `targetScore`, `diagnosticScore?`, `resourcesOwned[]`, `weakSections[]`, `phase` boundaries. Session: `date`, `phase` (`foundation | practice | polish | full-length`), `block` kind, named resource, minutes, `completed`, `movedFrom?`.
- **`CalibrationRecord`** (owned) — `sessionId`, `itemId`, `predictedConfidence`, `actualOutcome`. Deterministic; powers the over/under-confidence read. **Shares shape with the Academics `ReviewEvent`** — reuse, don't fork.
- **References (not owned):** `data/mcat-content.json` (sections, content categories, percentiles), `data/mcat-resources.json` (Category B resource bank), Tasks, Timeline milestones.

> **Do not model:** QBank questions or CARS passages as owned records — those are **external** (§2a). HQ stores *your results and review*, never the provider's content.

## 3. Structure — seven flat sub-tabs (modeled on PrepCat)

**Also models after: PrepCat** — a comprehensive MCAT prep app Andy is already partially building into HQ. It shows the finished shape of the whole tab, not just mistakes. **Flat sub-tabs (no Daily/Planning mode switch — PrepCat validates flat, and Andy likes it):**

**Dashboard · Plan · Content · Questions · Mistakes · Stats · Advisor**

(Resolves the earlier mode-switch open decision → flat, matching the proven reference. Mistakes keeps Premed OS's Mistake-to-Mastery design, §4, which is stronger than PrepCat's logger.)

### 3.0 Study Session — the centerpiece

The tab's primary action. Studying happens *here*; the plan decides what's in it, and its byproducts feed everything else.

**A. Study home (what you land on).**
- **"What you need to study" + today's schedule** — today's slice of the plan (Anki block, CARS passages, UWorld set, content review, due M2M drills), each with duration. The **full** schedule lives on the Plan tab; here you see only today.
- **Primary button: `Start session`.** Secondary: **`Customize your session`** — adjust before starting (which tasks/resources to include, total duration, **Pomodoro on/off** + work/break interval lengths).
- Readiness snapshot + exam countdown + streak sit alongside, but the button is the hero.

**B. The session itself (focus mode).**
- A clean, distraction-reduced **focus screen with a timer**, optionally **Pomodoro-backed** (work → break → repeat, configurable intervals).
- Shows the task(s) for this block (named external resources — "Anki · MilesDown 240," "CARS · Jack Westin 2 passages," "UWorld · B/B 40q"); check tasks off as you go.
- **Auto-logs hours** to the plan, stats, and streak — no separate time entry.
- **Quick-capture inside the session:** log a mistake (→ M2M §4) or jot a note without leaving focus mode.
- Pause/resume; end early is fine (logs actual time).

**C. End-of-session summary.**
- Time studied, tasks completed, cards/questions done → updates readiness, streak, content coverage.
- Prompts to **log any misses** into M2M and to mark content reviewed (§3.5).

**D. Overview widget.**
- A compact card on the Overview page: today's target, a **`Start session` / `Resume`** button, streak, next task. One tap deep-links into the session. (Overview is the only non-MCAT surface that launches studying.)

### 3.1 Sub-tab designs (PrepCat-derived)

**Dashboard — the study home (§3.0-A).** The landing surface for the study session.
- **Start session** primary CTA + **Customize your session** (§3.0-A).
- **Readiness hero:** overall readiness % + **projected score by exam day** (with +delta) + per-section bars (Bio/Chem/CARS/Psych). Honest "just getting started" state at 0. Readiness is driven by the **content mastery tracker** (§3.5) + diagnostics + logged full-lengths, not a guess.
- **Diagnostic entry:** "add your diagnostic score" so readiness/projection build on a real baseline.
- **Today's plan:** today's sessions (Anki, CARS, UWorld set, review mistakes, content) with time/duration; tap to check off or launch into a session.
- **Right rail:** catch-up alert (unfinished tasks + hours), focus-on-weakest-section nudge, exam countdown ("Your exam · date/taken"), stat tiles (day streak, hours logged, mastered, current MCAT score), study-consistency heatmap.
- **Full-length logging:** "Log a full length" — opens the **FL review workflow** (§3.6).

**Plan — the personalized, phased study plan.**
- Built from an **intake** (hours/day, which days, test date, year/bio) — personalized to who the user is.
- **Phased:** Foundation → Practice → Polish → Full-length (color legend), paced around full-length dates. Day-by-day to test day.
- **Editable:** drag a session to another day, check sessions off, hover a day to change its hours — the plan **adjusts around your edits**.
- **Projected vs goal:** "Projected 500 · 20 pts to go" + a **"Rebuild my plan to close the gap"** flow (asks hours/day + study days, then recomputes to earn the highest score possible in the time left). Honest when the goal isn't reachable ("add a day or an hour to close it").
- Week / Month views. "Talk to your advisor" to recalibrate.
- MCAT-specific analog of the roadmap; the exam is an Overview roadmap milestone (Timeline).

**Questions (QBank) — in-app practice.**
- A bank of practice questions across all four sections — full **passages + standalone discretes** — each with a **deep explanation for every answer choice** (why correct / why each wrong).
- Per-question **AI Tutor** ("Still unsure? Talk it through"): why the right answer works / why your pick was off / explain the concept simply. LLM-powered (same engine as Advisor + Atlas Assistant).
- Wrong answers flow into the **Mistakes** loop (§4) — Questions and Mistakes are linked.
- **Source (locked): the browsable QBank is DEFERRED until legitimately sourced.** A practice bank must be real/representative, and every good MCAT source (AAMC, UWorld, PrepCat) is copyrighted — **do not copy another product's questions** (IP/legal risk). Owned questions come later via original writing, licensing, or genuinely open sources. Until then, "Questions" links out to real banks (AAMC/UWorld) and the **in-app practice you actually get is the M2M AI drills** (§4).
- **AI generation is reserved for Mistake-to-Mastery drills only** — the one place synthetic questions belong, because a drill is bespoke to *your* specific error (same concept, new context). **Never AI-generate the browsable QBank.**
- **Required:** AAMC trademark disclaimer ("MCAT is a program of the AAMC, which does not sponsor or endorse this product").
- **Reused pattern:** the per-question review UI (per-answer-choice "why correct / why wrong" + AI Tutor chat) applies to M2M drills and any logged question — that's the differentiator, not owning a bank.

**Content — the study library + mastery tracker.**
- Houses the **content mastery tracker** (§3.5) — the AAMC content-category checklist that drives readiness — alongside the study materials.
- Study guides (per topic; ~length, sections, cheat sheet), equation hack sheets, pathway worksheets, mnemonic sheets, and games (arcade), **section-filtered** (Bio/Chem/CARS/Psych).
- **Tied to your mistakes:** the parts relevant to your logged weaknesses are flagged for you.
- Fed by the resource bank (§7) + external materials. Study-guide *summaries* may be LLM-synthesized (that's synthesis, not question-generation, per §2a); the practice items themselves are always external. Games are optional personality (à la `04` house style — sparingly).

**Stats — progress measured.** (Distinct from Mistakes analytics: Stats = score/readiness; Mistakes = cause/concept.)
- Final/current score with a diagnostic → now → goal slider; readiness by section (now → projected); stat tiles; consistency heatmap + hours/week; most-missed topics; mistakes mastered-vs-due.

**Advisor — AI study counselor.**
- Chat that knows your plan, pace, score, and time left; **reshapes the plan from today**. Quick-reply chips ("I'm falling behind / make next week lighter / what should I focus on? / I have an exam this week").
- LLM-powered; shares the engine with the per-question Tutor and the Atlas Assistant. Manual fallbacks where possible; full chat needs the API.

### 3.5 Content mastery tracker (drives readiness)

The honest answer to "am I ready?" — a checklist across **all AAMC content categories** (from `data/mcat-content.json`), section by section (C/P, B/B, P/S; CARS is skill-based, tracked separately).

- **Per content category:** a mastery state the student sets/updates — e.g. *not started → reviewing → confident → mastered* — optionally nudged by performance (repeated misses in a category from M2M can flag it "needs review" even if marked confident).
- **Section rollups:** % of each section's categories at each state; this **feeds the readiness number** (§3.1) instead of a vague estimate.
- **Session integration:** finishing a content block in a session prompts "mark [category] reviewed?"; the tracker updates from real study, not manual bookkeeping alone.
- **Points you outward, non-AI:** a weak/not-started category links to the **external** resource for it (Khan Academy video, a Content study guide, etc. from the resource bank §7) — no generated content.
- **Coursework cross-feed:** the Academics MCAT content-coverage map (§8) pre-seeds categories you've already covered in classes.

#### Mastery decays — states are not permanent checkmarks (added July 2026) ⭐

**The flaw this fixes:** a six-month prep means content reviewed in month one is five months stale on test day, but a `mastered` checkmark never changes. **This is how a student finishes content review with 90% "mastered" and plateaus at 505.**

- **Mastery carries FSRS state**, using the shared scheduler (never a second one). A category marked `mastered` **drifts back toward `needs review`** over time, and the plan generator schedules re-review the way it schedules everything else.
- **Decay rates differ by section — one curve for everything would be wrong in both directions:**

| Section | Decays | Why |
|---|---|---|
| **P/S** | **fast** | largely memorised terminology — the classic "I knew this in June" section |
| **C/P** | moderate | formulas and constants fade; problem-solving method persists |
| **B/B** | moderate | pathways and details fade; experimental reasoning persists |
| **CARS** | **barely** | a skill, not content — **must not be nagged about at all** |

**A single uniform curve would nag about CARS (which doesn't rot) and under-warn on P/S (which does)** — the two worst possible errors. **Build this together with the per-section training modes (P3), not sequentially**, since the per-section structure is where these curves naturally live.

- **Never presented as losing progress.** *"Amino acids — reviewed in June, worth a refresh"*, not *"mastery lost."* (§6.15 / `01` §6.10-B.)
- **Student-set states still win.** Marking something `mastered` again resets the curve; HQ proposes, never overrides.

### 3.6 Full-length review workflow (the biggest score-mover)

More than "log a score" — a real post-exam flow, because full-lengths move scores more than anything.

- **Log an FL:** which exam (AAMC FL1–4, third-party), date, **section scores** + total, timing/pacing notes.

#### FL logging — section granularity is the FLOOR (added July 2026)

**A total score alone destroys the inputs for weakest-section (#4), stamina decay (P5), and any honest projection.**

- **Four section scores are the minimum accepted entry.** Total-only is not a valid FL record.
- **AAMC's content-category breakdown is the ceiling** and is worth the extra entry friction — it's what makes §3.5 and the retake plan (P6) precise instead of directional.
- **Validity flags, captured at entry:** one sitting? real breaks? fully timed? start time of day?
  - **An FL taken across two evenings with pauses is not a data point about your score.** If it lands on the trend line unmarked, **it corrupts the projection.**
  - Invalid or partial FLs are **kept and shown, excluded from the projection**, and labelled why. Never silently dropped, never silently counted.

#### The FL is a SCHEDULED object, not a logged one (added July 2026) ⭐

An FL is a 7.5-hour commitment that cannot happen after class on a Tuesday, and **its review takes another 3–5 hours.** #11 currently catches unreviewed FLs *after the fact*; the fix is upstream, in the generator:

- **The plan places each FL on a day that actually exists** — enough contiguous hours, respecting intake busy periods (§3.3-A2).
- **At the real exam start time** where possible, which doubles as stamina rehearsal (P5).
- **The following block is reserved for review** — explicitly, in the plan, as its own scheduled item.
- **People skip FL review because they never budgeted for it**, not because they don't know it matters. Budgeting it is the whole fix.
- Google Calendar export (§3.3-F) carries both the FL and its review block.
- **Review misses:** walk the questions you got wrong or flagged; each pushes into **M2M** (§4) with its concept + miss-reason — turning one FL into a batch of targeted drills.
- **Recalibrates the projection:** a real FL score replaces the heuristic for that point (§3.3-C), so the estimate sharpens over time.
- **Trends:** FL scores over time per section (are you climbing where you need to?), pacing per section, and a pre-test-day readiness read.
- **External only:** the FL content is the provider's (AAMC/third-party); HQ tracks *your results and review*, never reproduces their questions.

### 3.7 CARS trainer (its own skill, daily)

CARS is a reasoning skill, not content — high scorers do **1–2 timed passages daily**, so it gets a dedicated mode rather than being just another session type.

- **Daily CARS habit:** a passage-timer mode (passage + questions, timed), surfaced as a standing daily block in the plan/session.
- **External passages only:** pulled from real sources (AAMC CARS QPacks, Jack Westin daily passages, etc.) — **never AI-generated** (per §2a). HQ links out / ingests; it doesn't write passages.
- **Reasoning-based review:** misses diagnose by the CARS miss-reasons (trap answer / missed main idea / wrong inference / misread / time), feeding the CARS lane of M2M and its analytics (§4).
- **Pacing focus:** tracks per-passage timing, since running out of time is the classic CARS failure.
- **Jack Westin nuance (from resource bank):** treat third-party CARS as *stamina/volume*; AAMC defines the actual logic — the trainer should say so, not present third-party as gospel.

### 3.8 Flashcards (MCAT view — pre-made decks first, custom cards from misses)

Shares the flashcard **engine** with Academics Class Center (`tabs/01-academics.md` §6.2 — `ts-fsrs` review + Anki-import text export), but a **different center of gravity**, because the MCAT reality differs from a class:

- **Fact (community consensus):** for the MCAT, high scorers **use pre-made decks, not homemade ones** — building a full custom deck is a known time sink. Near-universal decks: **MilesDown** (content), **AnKing MCAT**, **Pankow** (Psych/Soc). Students *customize* rather than *create*: unsuspend relevant cards, edit wording, add their own notes/mnemonics.
- **Default view = pre-made decks.** Import/track the big decks (from the resource bank §7), see due counts, and **customize** — edit wording, add personal notes, suspend/unsuspend. This is **external content** (not AI-generated); HQ tracks and augments it.
  - Anki-owned decks follow the **one-scheduler rule** (§5g): **Anki owns all card timing.** HQ may optionally *display* due counts via AnkiConnect on desktop; it never schedules, writes, or depends on them.
- **Custom cards = targeted, from missed questions (REVISED July 2026 — see §5h).** An **"add flashcard" button on any missed question** turns that miss into a card; **AI helps phrase the front/back** from the question + its diagnosis; **HQ tags it with the cause, section, concept, and source**; and it **exports as an Anki-import text file** (tab-separated with a tags column, no API). **HQ does not review it and does not track it after export.** There is **no in-app card queue** — the card's job is to live in Anki beside the pre-made decks. Mastery is measured by **M2M drill performance**, never card activity (§5g).
- **Not a from-scratch deck builder.** HQ never nudges the user to hand-build a comprehensive MCAT deck; it points them to the pre-made decks and only helps make cards where it's actually useful — the stuff they keep missing.

### 3.10 The Bookshelf — P2 (added July 2026)

**Andy's name, and it's the right one.** MCAT prep runs on paid third-party material, and nothing tracks what you own, what it cost, when it expires, or what you should be using right now.

**Placement: inside Content**, not a new tab. Content already holds the study library; the Bookshelf is the *your copy* layer over the resource bank (§7).

#### The hero answers ONE question

**"What should I use right now?"** — a single recommendation, with its reason, at the top. **The catalog sits below it.** A shelf that opens as a grid of twenty logos is a storefront; the point is that HQ knows your phase, your weakest section, and what you own, so it can just answer.

> *"Foundation phase, weakest section B/B → **Khan Academy: Biological Molecules**, then MilesDown's amino-acid deck. You own both."*

**Phase-aware, from the plan generator** (§3.3-B) — Foundation surfaces content review (Khan Academy, content guides, MilesDown/Pankow); Practice surfaces question banks (UWorld, Jack Westin, section banks); Polish surfaces AAMC material. **The shelf reads the phase; it does not ask.**

#### It reads what's scheduled and links out. That's it. (Andy, July 2026)

The recommendation is derived from **the block you're already scheduled to study or drill today**, and it **redirects to the resource** — Khan Academy, a study guide, a deck, whatever the bank says is relevant.

> **REJECTED — do not build:** `First pass` / `Refresher` role labels, estimated durations, or an `Add as warm-up` action that inserts the resource into the session. **Andy: not needed.** The redirect is sufficient; the student knows whether they're learning it or brushing up.

- **One line of reason, one link.** *"Today's block is amino acids and protein structure — Khan Academy covers both."*
- **`Open` is the action.** External resources open externally (`implementation/integration-map.md` §0 tier 3 — deep link, don't embed).
- **If nothing scheduled today maps to a resource, say so in one line** rather than manufacturing a suggestion (§6.10-A).

#### The three things a list can't tell you

1. **Expiry against your plan, not expiry alone.** *"Your UWorld 90-day ends Mar 3, but your heaviest practice block is Mar–Apr."* Buying early and burning the window before you need it is a common and expensive mistake, and **the plan already knows when your heavy blocks are.**
2. **AAMC burn rate.** ⭐ AAMC material is **finite and the single best predictor of your score** — *"you've used 60% of AAMC material and you're four months out."* Near-universal advice is to save it; this makes that a tracked number rather than a tip someone read once. Feeds the plan generator so **AAMC is scheduled late by construction.**
3. **Owned and untouched.** *"You bought Bootcamp six weeks ago and have opened it twice."* This is Academics' material-staleness feature (#30) pointed at things you paid for, where it matters considerably more.

**Plus gaps, not just holdings:** *"Nothing on your shelf covers P/S content review."* → links the bank, never fabricates a recommendation.

> **Mockup:** `specifications/mockups/02-mcat/mcat-bookshelf.html`

#### Entity

**`ShelfItem`** (owned): `resourceId` (→ `data/mcat-resources.json`), `access` (`free | owned | trial | expired`), `acquiredAt?`, **`expiry?`** (`lifetime` | date), `cost?`, `lastUsedAt`, **`consumedPct?`** (finite material only — AAMC bundles, section banks), `notes`.

- **Expiry tracking applies to PAID items only** (Andy, July 2026). **Free resources carry no expiry field at all** — Khan Academy and Jack Westin show `Free` and nothing else. Only `owned` and `trial` items enter the subscription tracker, and a free resource must never render an empty or "n/a" expiry.
- **`lifetime` is a first-class value, not a null date** — several paid resources genuinely are (some UWorld tiers, purchased books, AAMC bundles), and an empty date field would read as missing data and nag forever.
- **`cost` is displayed only for things already bought.** No prices on anything the student doesn't own — that turns the shelf into a storefront.
- **`consumedPct` is student-entered, coarse, and optional.** Never demand precision; a rough slider beats an unfilled field (§6.7 friction rule).
- The **resource bank (§7) stays the reference** — `ShelfItem` is *your copy of it*, and the bank is never duplicated per user.

#### Rules

- **No affiliate links, no sponsored placement, ever.** The moment recommendations carry a revenue interest they stop being trustworthy, and this surface only works if it's trusted (`implementation/integration-map.md` §0).
- **Recommendations are Category B** — community consensus, attributed, `verifiedAsOf` dated (`implementation/knowledge-sources.md`). *"Widely recommended"* is a claim that needs a source and a date.
- **Never nudge a purchase.** Free options are surfaced first where they're genuinely competitive (Khan Academy, Jack Westin dailies, AAMC free material). **HQ is not a sales channel for prep companies.**
- **Works with an empty shelf** — a student who owns nothing sees free options and one honest line, not a wall of things to buy.
- **Expiry warnings fire once**, through the attention auction (§6.11), and **only when the expiry actually collides with a planned block** — not on a countdown. **An expiry three months away from anything is not news.**
- **The shelf is grouped by PURPOSE, not by price:** Content review · Question banks · Decks · Full-lengths — matching the plan's phases, so the group you currently need is the group that's highlighted.
- **Method-to-outcome** (§5c add-on) feeds recommendations over time: *"you reviewed amino acids with Khan Academy twice and still miss them"* → suggest a different modality, not more of the same.

### 3.11 Test Day — phase-gated, hidden until actionable (P4, added July 2026)

Everything that isn't studying but decides whether studying pays off: registering, getting to the right building on the right morning, the void decision, and what happens after the score lands.

**PLACEMENT RULING — not a tab (LOCKED, overrides the board's "new tab" note).** The board proposed a Test Day tab; **standing rule: no new tabs**, and the seven flat sub-tabs (§3) are settled. Test Day is a **phase-gated panel on Dashboard** (§3.1), rendered only when a phase is open.

- **Reasoning:** a permanent tab would be **empty for most of prep** and, having space, would fill it — the same failure mode already ruled against for the coach (§5f). Logistics must not compete with studying for attention. This panel **appears, does its job, and disappears.**
- It never occupies Dashboard's primary slot; it sits below the study home and collapses once its phase closes.
- **Nothing here is ever a notification during a study block.** Phase openings route through the attention auction (§6.11) like everything else.

**A. Three phases, each gated, each hidden until its gate opens.**

| Phase | Gate | Closes when |
|---|---|---|
| **1 · Register** | exam date chosen but not yet registered, **or** ~6 months out | registration confirmed |
| **2 · Logistics** | ~3 weeks before the exam | exam day passes |
| **3 · After** | exam day passes | retake-or-apply decision recorded |

If no exam date exists, **no phase opens** — the panel does not render at all. The date decision itself is **not** here; it belongs to intake (§3.3-A1), which owns the *forward* half. Test Day owns the *backward* half.

**B. Phase 1 — Register.** A short checklist, not a guide.

- **Accommodations first, and loudly.** ⭐ AAMC accommodation requests take substantially longer to process than students expect, and the deadline is functionally months before the exam. **If a student may need accommodations, this is the only item that matters in Phase 1** — everything else can be done late; this cannot. Surface it above registration itself.
- **Fee Assistance Program** — eligibility affects both cost and registration timing. Surface once, factually, with no persuasion.
- **Registration checklist:** AAMC account, ID that matches registration exactly (the name-mismatch failure is common and unrecoverable at the door), date + test center selection, payment.
- **The date/center choice links back to §3.3-A1**, which already computed the recommended window and its reasoning. Test Day does not re-derive it.
- **NO seat-availability checking — REJECTED (LOCKED).** There is **no AAMC API**, so any availability display would be scraped, stale, or fabricated. A wrong "seats available" is worse than none. HQ links out to the AAMC registration system and says so plainly.

**C. Phase 2 — Logistics.** Delivered ~3 weeks out, when it's actionable and not before.

- **Getting there:** test center address, travel time, and a prompt to do a **dry run** if the center is unfamiliar. Prefer the student's own note over anything HQ guesses about parking or entrances.
- **What to bring / what's provided:** ID requirements restated, what is and isn't allowed in the room, what the center supplies. **Category A with freshness metadata** — AAMC policies shift and a stale packing list is worse than none (`implementation/knowledge-sources.md`).
- **The day's shape:** section order, break structure and lengths, total seat time. Students consistently underestimate the length of the day; showing the actual shape is the point.
- **Snack/meal planning tied to the real break structure** — trivial to state, disproportionately useful, and it connects to the stamina work (P5): the breaks you trained with should be the breaks you get.
- **⭐ The void briefing is delivered HERE — before the exam, never after.** You cannot use a phone during the test, so a briefing that lives on the other side of the exam is a briefing the student will never read at the moment they need it.

**D. The void briefing (content, LOCKED in substance).**

The decision is made at the test center, minutes after finishing, while exhausted and with no information. The briefing exists to make that decision *in advance*, calmly.

- **The core message: feeling bad is not information.** ⭐ Feeling wrecked after the MCAT is the *normal* experience, including among people who score well. **Post-exam emotional state is close to uncorrelated with performance**, and the void decision made on that feeling is made on noise.
- **State the actual costs plainly:** a voided exam produces no score, and — the part students routinely miss — **the attempt still counts against attempt limits.** Voiding is not a free reset. *(Attempt-limit specifics are **Category A**, verified and dated — they are AAMC policy and can change.)*
- **Give a decision rule, not encouragement.** The student writes their own rule *in advance* — e.g. *"I void only if I had a documented disruption or a medical event, not because it felt hard"* — and HQ shows them **their own words** on the morning of the exam. A rule written calmly beats a judgment made depleted.
- **Tone: factual, brief, once.** This is not a pep talk and not repeated. One briefing, one restatement on exam morning, done.
- **Hard boundary (inherits §5f):** if a student's written rule or notes read as distress rather than strategy, **HQ stops advising and surfaces support resources.** It does not coach harder.

**E. Phase 3 — After.**

- **Score release:** the expected release window, shown as a **date range, not a point estimate** (standing rule: intervals, not point estimates), with the source dated. Roughly a month is the shape; the exact schedule is **Category A**.
- **The waiting period is explicitly empty.** ⭐ HQ generates **nothing** during it — no predictions, no "reflect on your performance," no re-analysis of how it felt. **There is no information available in this window and manufacturing some is worse than silence.** The panel says when the score comes and otherwise stays quiet.
- **Score entry** → the score becomes a first-class record: it updates readiness, closes the projection (§3.3-C), and feeds School List fit.
- **Retake-or-apply — a decision surface, not a recommendation.** ⭐ HQ lays out what it knows and **never picks**:
  - the score against the school list's ranges (cross-tab),
  - **the cycle-timing cost** — the same constraint as §3.3-A1 in reverse: a retake pushes submission later into a rolling cycle, and that cost is often larger than the point gain,
  - remaining attempts and the calendar room for another sitting,
  - what a retake plan would actually target, drawn from the student's own FLs and mistakes (**hands off to P6 retake mode**).
  - Output is a **comparison with consequences stated**, in the app's projection voice — never *"you should retake."*
- **If the student retakes:** Phase 3 closes, P6 generates the retake plan, and the whole panel returns to Phase 1 for the new date.

**F. What Test Day does NOT do.**

- No seat availability (B).
- **No score prediction from how the exam felt.** Same reasoning as the void briefing — the input is noise.
- **No countdown theatrics.** The exam countdown already exists on the study home (§3.0-A); Test Day does not add a second, larger one. **Anxiety amplification is not a feature.**
- No AI generation anywhere in this panel (§2a) — every line here is either the student's own text or dated factual content.

**G. Data.** `TestDayState` on the MCAT plan: `registrationStatus`, `accommodationsNeeded`, `testCenter`, `dryRunDone`, `voidRule` (the student's own sentence), `voidedAttempts`, `scoreReleaseWindow`, `retakeDecision`. All optional; the panel degrades to whatever exists.

**H. Components.** `Card` (panel) + `Collapsible` (phases) + `Checkbox` (checklists) + `Badge` (phase state) + `MascotNote` teaching variant for the void briefing (`01` §4f — it is exactly a "explain this once, calmly" moment) + `Alert Dialog` for recording the retake decision. No new components.

---

### 3.12 Generator overrides — stamina, retake, taper (P5 · P6 · P7, added July 2026)

**These three are one engine, not three features.** Each is a **rule that modifies the plan generator** (§3.3-B), not a screen. Speccing them separately produced three surfaces nobody needed; speccing them together produces a small set of generator behaviors. **None of them adds a tab or a sub-tab.**

Shared frame: the generator normally distributes hours across phases (Foundation → Practice → Polish → Full-length). These three change *what it schedules*, *what it targets*, and *when it stops*.

---

#### 3.12-A Stamina (P5) — the metric first, the training second

**The metric: score decay within a single FL.** ⭐ First section 128, last section 124, **consistently across FLs**, is fatigue — not knowledge. You cannot fix it with content review, and content review is what students do instead.

- **Computable from data already logged.** §3.6 requires four section scores per FL. Decay = the trend across the four sections within one sitting, averaged over the student's FLs. **Nobody computes this**, and it needs no new input.
- **Descriptive, not predictive** (standing rule). HQ states *"across your last 3 FLs your fourth section averages 3.7 points below your first"* — it does not claim what a rested version of the student would score.
- **Report it as an interval**, and **only when there are enough FLs to see a pattern** — a single FL is noise. Below the threshold: the honest *"not enough full-lengths yet"* state, never a number.
- **Surface:** an observation in **Stats** (FL analytics), and — when it clears the specificity bar — at most one line in the end-of-session summary via the coach channel (§5f). **No stamina screen.**

**The training: a progression the generator schedules.**

- **2-section → 3-section → full FL**, advancing as decay narrows rather than on a fixed calendar.
- **Real breaks, matching the actual exam structure** (the break lengths shown in §3.11-C). Practicing with breaks you won't get trains the wrong thing.
- **At least one full FL at the student's true exam time of day.** ⭐ A student who has only ever tested at 8pm has no evidence about an 8am exam. The generator schedules this deliberately and says why.
- Sessions appear in the plan as normal blocks — *"Full length · AAMC FL3 · 8:00am start (exam-time rehearsal)"* — not as a separate mode.
- **REJECTED: a stamina "training mode" surface.** It is scheduling, and scheduling belongs to the plan.

---

#### 3.12-B Retake mode (P6) — a different plan, from the student's own history

**A retake plan must not look like a first-attempt plan.** ⭐ Roughly a third of test-takers retake, and the default behavior of every prep product is to hand them the same linear content-review plan again — which is why retakes so often move two points.

**What makes HQ's version possible: it already holds the student's history.** A prep company cannot target this because it does not have the student's FLs, section scores, mistake taxonomy, or content-mastery record. **This is the single clearest case in the tab of HQ doing something competitors structurally cannot.**

- **Triggered from §3.11-E** ("Plan a retake"), which reopens Phase 1 for the new date and hands off here.
- **The generator inverts its default.** A first-attempt plan is **breadth-first** (cover the material). A retake plan is **gap-first**:
  - **Section-weighted by the real score report** — the section that underperformed gets the hours, not an even split.
  - **Mistake-taxonomy-weighted** — if `missReason` (§2b) is dominated by *misread the question* rather than *didn't know the content*, more content review is the wrong prescription and the plan says so.
  - **Content mastery is not reset.** Topics the student demonstrably knows are **not re-taught**; they are maintained by the decay schedule (§3.5) at low cost. Re-covering known material is how retake plans burn their hours.
  - **Stamina weighting** — if §3.12-A shows meaningful decay, the retake plan front-loads FL rehearsal over new content, because that is where the points were lost.
- **The plan states its own reasoning at generation:** *"Weighted toward CARS (126) and timing. Your B/B and P/S held; those are on maintenance, not review."*
- **Honest about ceiling.** Projection (§3.3-C) applies unchanged — a **range with a confidence gate**, and if the data doesn't support a projection it says so rather than promising a number.
- **REJECTED: a separate "retake" sub-tab or a distinct UI.** It is the same Plan tab with different weights. A student on their second attempt should not have to learn a new screen.

---

#### 3.12-C The wind-down (P7) — the generator stops adding, and that is the feature

**Evidence honesty first (REVISED July 2026).** An earlier draft specced a structured *week-long taper* borrowed from endurance-training language. **That overstated its evidence base and the framing has been cut.** What is actually well supported in MCAT practice is narrower:

- **"Don't take in new content in the last few days"** — near-universal advice across prep resources and community consensus.
- **"Rest the day before"** — likewise near-universal.
- **A structured week-long taper that outperforms studying through** is *not* established. **Category B — community consensus, attributed, `verifiedAsOf` dated** (`implementation/knowledge-sources.md`). HQ does not assert it as fact.

**A. The hard override is short — the final 2–3 days.** In that window the generator **stops scheduling new content, full-lengths, and heavy question sets** regardless of what remains in the plan. This is the part with real consensus behind it.

**B. Unfinished content is explicitly released, not silently deferred.** ⭐ *"Three Foundation topics won't be covered before the exam. That's the correct trade — starting them now costs more than they're worth."* **This is the mechanic worth keeping regardless of window length**: quietly rescheduling work into a void the student never reaches is lying by omission. Honest scheduling states what it dropped.

**C. A longer wind-down is an option, defaulted OFF.** Students who prefer a full light week can enable it, framed as *"some people prefer this"* — never as the correct protocol. HQ presents it as a preference, sourced and dated.

**D. What it does schedule:** light maintenance review of already-strong material, the daily CARS habit if that habit exists, logistics from §3.11-C, and rest.

**E. No new full-lengths inside the window** — the last FL must sit far enough out that its review can be absorbed.

**F. Visible in the plan as a phase**, so the student sees it coming and doesn't experience it as the app giving up on them. Overridable; if overridden, HQ complies and does not nag.

**G. Tone:** strategy, not permission — *"you stop adding now so you can use what you have."* **Not wellness.** It ends where §5j's boundary begins: if signals look heavier than performance, HQ stops advising rather than advising harder.

---

**Shared acceptance:** all three are generator behaviors with **zero new surfaces**; each states its reasoning where it acts; each degrades to an honest "not enough data" state rather than a fabricated number; none introduces AI generation (§2a).

### 3.9-a Drill scheduling — the answer is the grade (LOCKED July 2026 · Andy)

> **Andy:** *"don't know why we have the spaced repetition cards (hard, easy, again) when they're multiple choice questions."*

**REJECTED — remove from M2M drills: `Again / Hard / Good / Easy` self-grading.** Self-grading exists for **open recall**, where only the student knows how well they produced an answer (which is why it stays in Academics' topic runner, `01` §4.1-J). **A multiple-choice drill has already scored the student objectively.** Asking how it felt afterwards is redundant, adds a tap, and invites the self-flattery problem (`01` §6.14 — prefer observed over self-reported).

**Spacing itself stays.** Without it a concept is drilled once and never verified, and M2M becomes Mistake-to-Drilled-Once. **What changes is where the grade comes from: the drill outcome, not a button.**

#### Three outcomes, all objective

| Outcome | Interval | Why |
|---|---|---|
| **Wrong** | soon (same session or next day) | Not fixed. |
| **Right, but flagged or guessed** | medium | **#16 doing real work here.** A lucky guess is not mastery, and the student already told us with one tap at answer time. |
| **Right and unflagged** | longer | Genuine evidence. |

- **`ts-fsrs` still drives the intervals** — it needs a graded outcome, and these three map onto it cleanly. **Still one scheduler; no second engine** (§5g).
- **No self-rating anywhere in the drill flow.** Answer → explanation → next. **Intervals are shown** (*"back in 5 days"*) so scheduling stays legible rather than magic, but they are **displayed, not chosen.**
- **Mastery is cleared-N-times-spaced**, never a self-rating: a concept clears when it's answered correctly and unflagged across **at least two spaced encounters**. One correct answer immediately after seeing the explanation proves nothing.
- **`resolvedAt` is set by that criterion**, not by the student declaring it fixed.

**Where self-grading legitimately remains:** the Academics active-recall runner (open production, `01` §4.1-J) and content-mastery states the student sets themselves (§3.5). **Never on a scored multiple-choice item.**

#### After clearing — the concept returns to decay, it does not disappear (added July 2026)

Clearing ends the *remediation* loop, not the concept's existence. Otherwise the backlog would drain into a false "mastered forever" state, which is exactly what content decay (§3.5 / P1) exists to prevent.

- **Cleared → handed to normal content decay.** The concept leaves the M2M drill queue and is maintained by the decay schedule at low cost. It stops consuming remediation time; it does not stop being tracked.
- **A cleared concept that is missed again re-enters M2M** as a new mistake, and **HQ says so**: *"You cleared this in March — it's back."* ⭐ A repeat miss on cleared material is a **different and more important signal** than a first miss, because it means the remediation didn't hold. It ranks above a first-time miss in drill priority.
- **Repeat-clear-then-miss cycles are surfaced, not hidden.** Two or more cycles on the same concept escalates it out of drilling and into **content review** — the same leech-escalation logic as `01` §5b #7. **More drilling is the wrong prescription for something that keeps coming back.**
- **The backlog is expected to drain and refill.** The mistake list is not a to-do list to reach zero; a permanently empty M2M queue would mean the student stopped logging, not that they stopped missing.

### 3.9 Section practice — REJECTED (July 2026 · P3 closed)

> **Andy:** *"if we're drilling, isn't the M2M enough? … the specialized drilling stuff as a whole is not necessary."*
> **And on what P3 actually reduces to:** *"what P3 would consider is when we're creating that .txt or .apkg file to be exported into Anki, and in the process tagging them with the MCAT section, why we got it wrong, concept, and source of the question. That may be it for P3."*

**P3 requires no new work. It is entirely satisfied by the tagged export already specced in §5h.**

**Do not build:** per-section training modes · a B/B reasoning surface · a P/S volume surface · **C/P calculator-free speed drills** (also cut) · per-section cause taxonomies (already rejected, §2b) · any second drilling surface.

**Why each fell:**

| Proposed | Why cut |
|---|---|
| B/B reasoning mode | You do those passages externally anyway; **M2M already does the diagnosis** (§4). |
| P/S volume mode | **§3.5 already tracks category coverage**, and §5h forbids card review in HQ. |
| C/P speed drills | Specialised drilling isn't needed. **Cut in full — no procedural generator either.** |
| Per-section taxonomies | Already rejected (§2b): one general vocabulary, `section` carries the sectional dimension. |

**What P3 is, in full:** the export file (`.txt` TSV or `.apkg`) carries **section · cause · concept · source** as tags (§5h). That's it.

**Per-section decay curves (P1) are unaffected** — they live in §3.5 and never depended on P3.

**Standing rule going forward:** if a section seems to need different treatment, it is a **plan-generator cadence rule**, never a new surface.

### 3.2 New dependencies from the PrepCat scope

- **LLM API** now powers four surfaces: Advisor, per-question Tutor, QBank generation, and M2M classification/drills. All gated behind the key; curated/manual fallbacks where feasible.
- **QBank content** = **deferred** — legitimately-sourced real questions come later (original/licensed/open, never copied from another product). For now, in-app practice = M2M AI drills; "Questions" links out. Only M2M drills are AI-generated.
- **Plan generator** — rules-based + the intake; produces the phased, paced, projection-aware schedule and the "rebuild to close the gap" recompute.
- **Projection model** — readiness % → projected score by exam day, recalibrated by diagnostics + logged full lengths. Deterministic + transparent (no fake precision; it's an estimate, labeled).
- **AAMC trademark disclaimer** wherever MCAT-branded.

### 3.3 Plan generator (engine + UI)

> **Concept mockup:** `specifications/mockups/02-mcat/mcat-plan.html` (functionality/flow only; visual defers to `04`).

Builds the personalized, phased, day-by-day schedule. **Fully rules-based — no LLM/API** (deterministic scheduling + projection math); the Advisor chat is the only AI layer on top. So this ships early and works offline.

**A. Intake (fuller — locked).** A short first-run wizard collects: **test date** (or "not scheduled" — see A1), **hours/day**, **study days** (day-of-week toggles), **target score**, a **diagnostic/current score** (or "haven't taken one"), **resources owned** (AAMC, UWorld, Anki decks, Bootcamp, Jack Westin, etc. — from the resource bank), **weakest sections** (or derived from the diagnostic), and **known busy periods** (A2). Re-openable to edit.

**A1. The exam date is a DECISION, not an input (added July 2026) ⭐.** Everything downstream hangs off it, and #15 only catches drift after the fact. **Choosing the date is the single highest-leverage move in the tab**, and it's determined by four things HQ already holds:

1. **Coursework completion** — which MCAT-content prereqs are done vs scheduled (Academics §8 cross-feed, #13).
2. **Realistic weekly hours** — what the student actually has, not what they'd like.
3. **Retake headroom** — attempt limits and whether a second sitting still fits before the cycle closes.
4. **AMCAS submission timing** ⭐ — **the one nobody accounts for.** Admissions are rolling, so **a test date whose scores land after the early-submission window costs more than a few points would.** Scores release roughly a month after the exam; that lag is the constraint.

**This belongs in intake, not Test Day.** P4's Test Day tab holds the *backward* half (retake-or-apply, after the score); this is the *forward* half and it must exist before a plan is generated.

- Output is a **recommended window with its reasoning**, not a single date: *"Late April fits — biochem finishes in December, you have ~15h/week, and scores land before the early AMCAS window. A June date pushes your submission into July."*
- **Cross-tab dependency with the application timeline.** Verify AMCAS cycle dates as **Category A with freshness metadata** — they shift annually and a stale window is worse than none.
- **Never picks for the student.** Proposes windows with consequences stated; the student chooses.

**A2. Capture known busy periods.** Finals weeks, EMT shifts, family obligations, travel. **The plan bends around them instead of breaking on them** — which is the difference between a plan a student follows and one they abandon in week three.

**B. Scheduling algorithm.**
- **Phases**, paced by time-to-test: **Foundation** (content review + Anki) → **Practice** (QBank sets + daily CARS + mistake review) → **Polish** (weak-area targeting + timing) → **Full-length** (spaced FLs + full review). Earlier start = more Foundation; short timeline compresses toward Practice/FL.
- **Daily allocation:** distribute the day's available hours across session types — always a daily **Anki** block + daily **CARS** habit + **mistake review** (M2M due drills) + a **practice/content** block; insert **full lengths** roughly weekly in the back third, each followed by a **review** day.
- **Named resources (locked):** sessions name the actual resource the user owns — "90 UWorld · C/P," "Anki · MilesDown 240," "AAMC Section Bank · B/B," "CARS · Jack Westin 2 passages." Pulled from `resources owned` + the resource bank's `purpose`/consensus (prefer near-universal). If a needed resource isn't owned, suggest one (link to the bank), never fabricate.
- **Personalization:** weight practice toward weakest sections; respect owned resources; honor the day/hour budget exactly.

**B0. ONE hour budget across tabs (added July 2026 · GOVERNING) ⭐.** When prep overlaps a semester, **MCAT and Academics are bidding for the same evenings** — and right now neither generator knows the other exists. **Two individually reasonable plans sum to something impossible, and the student fails both.**

- **A single shared weekly capacity**, owned at the shell level, that **both generators draw from.** Neither may allocate hours the other has already taken.
- Academics' claims (class time, review queue, exam prep mode, assignment deadlines) and MCAT's claims (sessions, CARS habit, FLs + review blocks) **draw down the same pool.**
- **When the pool is oversubscribed, say so before generating** — *"your Fall plan needs 34h/week and you have 22."* Never silently produce two plans that can't both happen.
- **Academics wins during exam weeks; MCAT wins in dedicated periods.** The precedence rule is explicit rather than emergent, and the student can override it.
- **This is the clearest "only HQ can do this" feature in the app** — a prep company doesn't know your course load, and a gradebook doesn't know your test date.

**B1. Slack is mandatory, or #2 ("falling behind") dies (added July 2026) ⭐.** A zero-buffer six-month plan means **every user is behind by week three.** The alert then fires constantly, gets ignored, and the tab has spent its attention budget on noise.

- **The generator emits explicit catch-up days** — real, visible, unscheduled slack, not a hidden fudge factor. Roughly one per week is the starting point; tune against real use.
- **"Falling behind" (#2) then means you have burned your buffer**, which is a genuine signal and worth one of the three weekly notifications (§6.11).
- **Busy periods from intake (A1/A2) bend the plan**, they don't create debt.
- Slack days are **not** presented as free time to fill. If the student wants to work them, fine; the plan never asks.

**B2. Pre-prep staleness shapes the initial plan (added July 2026) ⭐.** Content-mastery decay (§3.5) handles rot *during* prep. The other half is rot *before* it: **biochem two years ago, psych in freshman fall.**

- **This is a generator input, not a smart feature.** #13 flags the gap; **the generator consumes it** — tier-one content review is your **stale AND heavily-weighted** categories (time-since-completion × AAMC content share, per Academics #64), and everything else gets a skim rather than a full pass.
- **Reads directly from the Academics coursework timeline** (§8) — which is exactly why **prep companies structurally cannot do this.** They have no idea when you took psych.
- Never assigns a full content pass to material a student genuinely knows, and never skims material that has decayed to nothing.

**C. Projection model (labeled estimate — locked · REVISED July 2026).**
- projected score = current level (diagnostic, or a default baseline) + expected gain from planned study, using a transparent gain-per-hour heuristic with **diminishing returns** and a cap near the AAMC ceiling.
- **Output a RANGE, never a point** — *"509–515"*, with the gap to goal. **REVISED:** an earlier draft specified "a single number tagged estimate." A point estimate on the tab's hero number is false precision (`01` §6.12), and one visibly wrong number costs belief in everything else.
- **Recalibrates from logged full lengths** — real scores replace the heuristic as they come in.
- **Honest when unreachable:** if the plan tops out below the goal, say so and prompt "add a day or an hour to close it." Never present the estimate as a promise.

**C1. Publisher normalization — or the hero number of the tab is wrong (added July 2026) ⭐.** Full-lengths from different publishers are not comparable, and **averaging them into one projection corrupts the single most prominent number in the tab.**

- **AAMC full-lengths are the trend line.** They are the representative material and the actual predictor. The projection is computed on AAMC FLs.
- **Third-party FLs render separately and are flagged `directional only`.** They show progress; they do not move the projection.
- **Never average across publishers.** Never display a converted third-party score as though it were an AAMC score.
- **Encode ORDERING, not offsets.** Store a rank ordering plus a `directional_only` flag. **Do not hardcode point conversions** — publishers recalibrate, and a stale offset is worse than no adjustment because it looks authoritative. Keep any numbers in **config with a `verifiedAsOf` date** and cite it in the UI.
- **Research task, Category A, freshness-tracked** (§7): current community read is that AAMC FLs are most representative (commonly cited within a few points), Blueprint runs harder and is directionally reliable but imprecise, Kaplan is widely reported several points low, and the **AAMC Section Bank is harder than the real exam**. **Verify before encoding; treat these as a snapshot, not fact.**

**C2. Gate the projection on sample size.** A projection from one or two full-lengths is noise wearing a number.

- **Below the threshold, show nothing** — the same honest-empty-state discipline as the forgetting curve (`01` §4.1-L): *"one full-length logged — not enough to project yet."*
- Above it, show the range, and **widen the range when the sample is small.**

**C3. Score the projection (REQUIRED — and it is free).** The projection is the hero number; it must earn belief.

- Log **each projection against the next actual full-length**, and eventually against the real exam score. Report the hit rate plainly.
- **Below the accuracy gate, suppress the projection** rather than caveat it (`01` §6.12).
- **Why this one is required when lecture-emphasis scoring was rejected** (`01` §4.1-Q): that needed the student to tell HQ what was on the exam — real work, and a friction-rule violation. **This needs nothing.** The next FL score is already being logged for its own sake, so the comparison is free. **Scoring is required wherever the outcome arrives on its own, and rejected wherever it would create a chore.**

**C4. Percentiles are re-published annually.** A 512 is not a fixed percentile. If a percentile is shown at all, it comes from a **dated table with the year stated**, Category A with freshness metadata — never a hardcoded constant.

**D. Adaptation.**
- **Drag** a session to another day, **check off**, **hover a day to change its hours** — the plan re-solves around edits.
- **"Rebuild to close the gap"** re-runs the intake's schedule question (hours/day + days) and regenerates the remaining schedule to reach the highest score possible in the time left.
- **Falling behind:** missed sessions redistribute forward; the catch-up alert (Dashboard right rail) surfaces the backlog.

**E. UI presentation.**
- **First run:** the intake as a friendly ≤6-step wizard (one question per step, live "6 days × 5h → ~508" feedback as they answer), then reveal the generated plan.
- **Plan tab:** projected-vs-goal banner + rebuild button up top; **phase color legend**; **today's sessions** prominent (named resources, times, check-off); **week / month** views (day cards with session chips, full-lengths marked); "Talk to your advisor" entry.
- Craft per `04` + layout discipline `01` §5c (equal-height day cards, bounded week grid, projection clearly an estimate). All controls in-app styled (`01` §4a).

**F. Add to Google Calendar (integration).** One-tap **"Add my plan to Google Calendar"** pushes the scheduled sessions (and full-lengths) as calendar events, so the plan lives where the user already looks. Reuses the shell's **Google Calendar integration** (`architecture/06-service-foundation.md` — priority #1 integration; not MCAT-specific plumbing). Behavior:
- **Full sync (OAuth connected):** sessions become events; when the plan is edited or rebuilt, the calendar updates (add/move/remove). Connect/disconnect + sync status per `06`.
- **Lightweight fallback (no OAuth):** per-session "add to calendar" via a `googleCalendarUrl` link (the pattern already used in `AlertsStrip`), and a full `.ics` export of the plan.
- This is a **global capability** — Timeline events, deadlines, and the roadmap can use the same calendar export; the Plan is just its first big consumer.

---

## 3.3-G Study-hour target, optional and community-sourced (added Aug 2026)

**Andy, Aug 2026:** *"there is a recommended study time for the MCAT, which is 300 to 400 hours... users can choose to get a study target."*

**This is a second target, not a replacement.** MCAT already has a **score** target (§3.3-C, *"Projected 500 · 20 pts to go"*). This adds an **hours** target, which answers a different question: *am I putting in the time*, rather than *am I on track for the score*. A student can set either, both, or neither.

### The number, and how honestly to state it

**300 to 400 hours is Category B, not Category A.** It is **community consensus**, widely and consistently repeated, and it is **not** an AAMC publication. `implementation/knowledge-sources.md` governs the difference, and §7's resource-bank rule already binds this tab: recommendations are shown as *community consensus, with the debate intact*, never as HQ's factual claim.

**So the copy says what it is:**

> Students commonly report studying **300 to 400 hours** across a full prep period. Community consensus, not an official figure.

- **A range, never a midpoint.** "About 350" would launder a spread into a precision nobody published. `01` §6.12 already requires intervals over point estimates.
- **Attributed and `verifiedAsOf` dated**, like every other Category B claim in this tab.
- **Shown once**, at the set-a-target moment. It is not a persistent banner and it does not reappear.

### Rules, inherited from `03-clinical.md` §7a

The hour-target apparatus is already designed. This reuses it rather than inventing a parallel one:

- **No target by default.** The plan works fine without one, and HQ says nothing about it until the student opens the target control.
- **Nothing is pre-filled.** The field starts empty even though a range is displayed beside it. **A pre-filled 350 would become the standard in the student's mind regardless of the caption**, which is the exact failure §7a exists to prevent.
- **Whatever is set is labelled `Your target`**, never *the* target.
- **Two ways in, both linked**, as in §7a: set weekly hours and HQ derives the total, or set a total and HQ shows the weekly rate it implies against the time left to test day.
- **The intake (#12) already captures hours/day and study days**, so the weekly figure is usually derivable rather than asked twice.
- **Optional forever.** With none set, the plan still reports hours logged and pace without judgment.

### What it must not do

- **Never gate anything.** No phase, no readiness number, and no plan behavior depends on the hours target existing.
- **Never rank the student against the range.** *"You're below average"* is a comparison to other applicants, which is a standing rejection (`03-clinical-board.md` §5).
- **Never treat hours as readiness.** §3.5's content mastery tracker and logged full-lengths drive readiness. **A student can hit 400 hours and not be ready**, and the tab must never imply otherwise.
- **No separate surface.** It lives in the existing target control on `Plan`, beside the score goal.

### 3.4 Advisor & per-question Tutor (the LLM layer)

Conceptually simple (Andy): an **Anthropic/OpenAI API + a tailored system prompt + the user's context**. `02` makes it **provider-agnostic** — swap providers behind one orchestration interface. What makes it good, not generic:

- **Context assembly (the "personalized" part).** Each turn, assemble the user's real context: plan, test countdown, target vs. projected score, diagnostic + logged full-lengths, weakest sections, recent mistake patterns (from M2M), resources owned. Quality tracks context quality (`02`).
- **Conversational and permission-first (core behavior).** The Advisor **talks with you before it touches anything.** It can be **proactive** — open a conversation, surface a suggestion ("you've slipped a bit this week — want to adjust?") — but it **always proposes, discusses, and asks permission before making any change** to your plan, schedule, or settings. Converse → suggest → confirm → then act. **Never silently edits.** This is `02`'s augment-not-replace + human-approval principle; it applies to every AI-acting surface (Advisor, Atlas Assistant, data-refresh).
- **It acts *on confirm*.** Once you agree, it **tool-calls the deterministic plan generator** (§3.3) — reshape the schedule, "make next week lighter," redistribute after falling behind. It edits the real plan, but only after you say yes. Quick-reply chips: "I'm falling behind / make next week lighter / what should I focus on / I have an exam this week."
- **Grounded + honest.** Reasons only over the user's real data; never fabricates scores; explains its reasoning; same trust rules as `02`.
- **Per-question Tutor = proactive walkthrough.** Same engine, narrower context (this question + the user's answer). In question/mistake review it **opens by offering to talk you through it** ("want me to explain why the right answer works, why your pick was off, or the concept it's testing?") rather than sitting passive — then teaches interactively. Lives in Questions + Mistakes review.
- **No-API fallback:** the chat is hidden/disabled and shows a "connect an AI provider" prompt; **every deterministic feature (plan, analytics, drills-from-bank, calendar) still works.** The LLM is a layer, never a dependency.
- Shares its engine with the **Atlas Assistant** (same intelligence, academic/MCAT domain).

## 4. The Mistake-to-Mastery loop (a loop inside studying — see §1 hierarchy)

Five stages. **Sciences (C/P, B/B, P/S)** and **CARS** are two lanes throughout — different diagnosis, shared engine.

### Stage 1 — Capture
- Log a missed question by **screenshot-drag or paste** (existing `MistakeMap`), or text.
- Tag **section** (C/P / B/B / P/S / CARS), your answer vs. correct, and whether you **guessed / flagged**.
- Manual now; **AI later** reads the screenshot (vision) to pre-fill question, answers, and a suggested tag.

### Stage 2 — Diagnose (the spine)
Two tags per mistake:
- **What (Sciences only) — concept.** A *structured* picker powered by `data/mcat-content.json` content categories (e.g., "CP-5B Chemical Bonding"), not freeform. Sub-concept optional.
- **Why — miss-reason (both lanes).** Locked taxonomy:
  - **Shared causes:** Knowledge Gap · Reasoning Error · Misread · Time Pressure · Computation.
  - **CARS-specific extras:** Fell for trap answer · Missed main idea · Wrong inference.
  - Sciences use concept + shared causes; CARS uses the reasoning causes.
- Manual now (you pick from dropdowns — in-app styled, per `01` §4a); **AI later** auto-classifies concept + likely miss-reason from the question (needs LLM API — Anthropic/OpenAI; Atlas Intelligence).

### Stage 3 — Drill
- On tagging, serve a **drill on the same concept in a new context**; schedule follow-up drills via **spaced repetition using `ts-fsrs`** (same engine as the Class Center — reuse, not a second scheduler).
- **Drill source (locked): AI-generated + free question bank.** LLM writes MCAT-style drills from the concept + AAMC content outline; supplement with real questions pulled from the researched free-resource bank (§7). AI generation is phased (turns on with the API); until then, drills draw from the bank + your own re-logged items.
- One drill immediately, more spaced over time until the weakness clears.
- **Add flashcard (optional, §3.8):** the same miss can also spawn a **flashcard** — AI-drafts the front/back from the question + diagnosis, synced here; it reviews via `ts-fsrs` and exports to Anki. One weakness, two optional tools (drill + card); clearing the concept retires both.

### Stage 4 — Analytics (deterministic — no AI)
Computed from the tagged mistake log. Mirrors Mistake-to-Mastery's dashboard:
- **Mistake-cause × Section heatmap** (causes × C/P, B/B, P/S — CARS shown alongside).
- **Mistake-cause breakdown** (share by cause).
- **Top weak concepts** and **top weak sub-concepts** (by frequency, flagged high-yield where the content data says so).
- **Weakest test section** with a "needs focus" flag and % of logged mistakes.
- CARS analytics segment by its reasoning causes (trap / main-idea / inference / time).

### Stage 5 — Resources
- Each weak concept links to a **free resource** (Khan Academy video, Jack Westin for CARS, etc.) from the resource bank. Points you at exactly what to review for your weaknesses.

---

## 5. Sciences vs CARS

- **Sciences:** concept-diagnostic — *what* content you're missing (via `mcat-content.json` categories) + shared cause. Drills test the concept.
- **CARS:** skill-diagnostic — *why* your reasoning failed (trap / misread / main idea / inference / time). Can't be memorized; drills target the reasoning pattern, not a fact.
- Analytics, drills, and resources all branch on this split.

## 5a. Primary metrics (added July 2026)

What this tab measures. Each is **deterministic and explainable**; none is a black-box score.

- **Readiness %** — driven by the **content mastery tracker** (§3.5) + diagnostics + logged full-lengths. Never a guess.
- **Projected score by exam day** — labelled an *estimate*, recalibrated from real FLs (§3.3-C). Honest when unreachable.
- **Section readiness** (C/P · CARS · B/B · P/S) — the weakest-section signal.
- **Content coverage** — % of AAMC categories at each mastery state, per section.
- **Calibration** — predicted confidence vs actual outcome; over/under-confidence rate.
- **Mistake profile** — cause × section, top weak concepts, mastered-vs-due.
- **Effort** — hours logged, day streak, consistency heatmap, plan adherence (% of planned sessions completed).
- **Days to exam** and **plan feasibility** (does the remaining plan reach the target).

Never center raw question count or hours as the headline — readiness and projection are the outputs; hours are an input.

## 5b. Smart features — consolidated (added July 2026)

All **rules-based and explainable** (`architecture/02`); each states its cause. AI is never required for any of these.

1. **Stale plan** — no session logged in N days; plan silently drifting behind.
2. **Falling behind** — missed sessions redistribute forward; catch-up backlog surfaced with hours owed.
3. **Goal unreachable** — the plan tops out below target; states the extra day/hour needed rather than pretending.
4. **Weakest-section nudge** — practice allocation skewed away from your worst section.
5. **Never-reviewed content** — categories at `not-started` with the exam approaching.
6. **Overconfidence pattern** — calibration gap trending; "you rate yourself Pretty sure and miss 40% of those."
7. **Mistake cluster** — same concept missed ≥3 times; escalates from drill to content review.
8. **Cause concentration** — one miss-reason dominating (e.g. Time Pressure) → suggests a pacing fix, not more content.
9. **CARS habit break** — daily CARS lapsed; the one habit that decays fastest.
10. **FL cadence** — no full-length in N weeks during the practice/polish phase.
11. **FL not reviewed** — a logged FL whose misses were never worked through (the highest-value missed action).
12. **Resource gap** — the plan names a resource you don't own; links the resource bank instead of fabricating.
13. **Prereq coverage** — Academics shows a content area you've never taken coursework in (cross-feed, §8).
14. **Cram-risk** — planned hours in the final two weeks exceed a sustainable ceiling.
15. **Exam-date drift** — test date passed or moved without the plan being rebuilt.

16. **Flagged-but-correct** ⭐ (added July 2026) — **the cheapest high-value capture in the tab.** On every question, let the student mark uncertainty; then track the ones they **guessed and got right.** Those look like mastery in every metric HQ has and are **latent misses** — they are why a 78% practice average becomes a 62% on test day once the distractors get better.
    - **One tap at answer time** (`flagged` / `guessed`), no extra workflow. Nothing else in the tab buys this much for this little.
    - **#6 (overconfidence) is the aggregate; this is the per-question data that makes it real.**
    - **It changes what §3.5 is allowed to call `mastered`.** A category carried by lucky guesses must not read as mastered — flagged-but-correct items count toward *review needed*, not toward mastery.
    - Feeds M2M as a distinct kind of entry: **right answer, wrong confidence.** Same concept, needs a drill, not a content review.

**Restraint:** max one pace line per panel, dismissible (`01` §4d); never a pace line on the streak.

## 5g. Who owns the review loop (RESOLVED July 2026 — LOCKED, answered once for both tabs)

**The axis is the unit of review.** Get that right and the ownership question dissolves.

| | Unit | Owner | Scheduler |
|---|---|---|---|
| **Academics** | a **topic** — *"explain SN1 vs SN2,"* a spoken/written answer graded against scope chips | **HQ** | HQ's `ts-fsrs` |
| **Academics** | a **card** — one fact, one line | **Anki** | Anki |
| **MCAT** | a **card** — pre-made decks (MilesDown, AnKing, Pankow), 4,000+ cards of broad coverage | **Anki** | Anki |
| **MCAT** | an **M2M drill** — same concept, new context, bespoke to *your* logged error | **HQ** | HQ's `ts-fsrs` |
| **MCAT** | a **CARS passage** | external source | HQ schedules the habit, not the item |

**Andy's ruling (July 2026): Anki owns MCAT content review.** Pre-made decks are the community standard and rebuilding a mature SRS for them would be pointless. **HQ does not import, mirror, or re-schedule pre-made decks.**

### Mistake cards — the answer is that the DRILL is the review, and the card is an export

- **HQ schedules M2M drills.** That is HQ's review loop for the MCAT, it is already specced (§4), and **mastery is measured by drill performance.**
- **The flashcard generated from a missed question is an export convenience**, not a second scheduled queue — front/back written with AI help, reviewable in-app if the student wants, and **exportable as an Anki-import text file** so it lands beside their real decks (§3.8).
- **HQ never runs a second daily card queue.** A student already opening Anki every day will not maintain two review apps, and asking them to is how adherence dies.
- **Exactly parallel to Academics:** HQ schedules the concept-grain thing it owns (topics there, drills here) and exports card-grain material to Anki. **One pattern, two tabs.**

### Consequence for content-mastery decay (P1) — this is the important part

**HQ cannot see Anki reviews, so decay must never depend on review activity.** It reads **performance only**:

- M2M drill results · in-app practice results · FL section and content-category performance · time since the student marked a category reviewed.

**This is more honest than reading review counts anyway** — clicking through 90 cards is not evidence of knowing something; answering drill questions correctly is. A decay model driven by Anki activity would also be **structurally impossible on web and mobile**, where AnkiConnect doesn't exist.

**Optional enrichment, never a dependency:** if the student runs Anki desktop with AnkiConnect (`localhost:8765`, add-on `2055492159`), HQ may *read* deck due-counts for display. **Never required, never written to, never load-bearing for any calculation** — same rule as Academics §4.1.

## 5h. No flashcard review in HQ — export only (Andy, July 2026 · LOCKED, applies to BOTH tabs)

> **Andy:** *"I don't think there should be any sort of review thing or flashcard mechanism that's in HQ, because that's just confusing, and I want Anki to take care of the flashcards anyway."*

**REJECTED — remove from both tabs:** in-app flashcard review, an in-app card queue, and the earlier "reviewable in-app via `ts-fsrs`" language on `Flashcard`. **Also rejected:** my proposal to split remediation between HQ-reviewed cards and HQ-reviewed drills — *"it's confusing to split it up into two."*

### The rule

**HQ generates cards. HQ tags cards. HQ exports cards. Anki reviews cards.** One direction, no sync, no queue, no card UI anywhere in the product.

### What this does NOT remove — read carefully before deleting code

**HQ's `ts-fsrs` scheduler stays.** It schedules:

- **Academics topics** — *"explain SN1 vs SN2"* (`01` §4.1-J)
- **MCAT M2M drills** — a question testing the same concept in a new context (§4)

**Neither is a flashcard.** A drill is a question with a stem, answer choices, and an explanation, reviewed inside the daily mistake-review block the plan generator already schedules (§3.3-B). **Do not interpret this ruling as removing the topic or drill scheduler.**

### Mistake cards — generated, tagged, exported

A logged mistake produces **one export-ready card**, with AI help phrasing front/back from the question and its diagnosis. It leaves HQ and does not come back.

#### Card faces (Andy, July 2026 · LOCKED)

**Front = the question as you actually saw it.** The captured **screenshot** of the stem and answer choices, unaltered. Not a paraphrase, not a retyped version — ⭐ recognising the real question in its real formatting is part of what's being trained, and re-typing it loses the figure, the graph, and the passage context that made it hard.

- Below the image, a single line of context: `AAMC FL3 · Q41 · B/B`.
- **Your original answer is not shown on the front** — it would prime the recall.

**Back = everything that makes it a learning object.**

1. **The correct answer**, stated plainly.
2. **The explanation** — why the right answer is right *and* why your pick was wrong. AI-drafted from the question plus your diagnosis; editable before export.
3. **Your diagnosis, visible on the card:** the concept (`Enzyme kinetics & inhibition`) and the miss-reason (`Reasoning error`). Seeing *your own* failure mode on the card is the point — over weeks it makes a pattern legible that a bare answer never would.
4. **Source line** — where it came from, so you can go back to the original review.

**Screenshot capture is a first-class part of the card, not a nicety** — which drives the export format below.

#### Export format — `.apkg` (LOCKED — now a GLOBAL rule, `01` §4g)

> **Generalised July 2026:** `.apkg` is no longer an MCAT decision. **Every Anki export in HQ is `.apkg`, always, on every surface** — see `01-shared-interface-patterns.md` §4g for the format rule, the note-type set (Basic · Cloze · Image Occlusion), and the Anki 23.10+ constraint. The reasoning below is what drove it.

**Images cannot travel in a tab-separated text import.** Anki's text importer treats `<img src="q41.jpg">` as a *reference*; the file must already exist in `collection.media`. A `.txt` export would therefore require the student to manually copy a folder of screenshots into Anki's media directory on every export, with broken images whenever anything mismatched. **That is a chore, and it violates the friction rule.**

- **Export is a `.apkg` package** — notes plus their media, bundled. **Double-click to import**, no field mapping, no media shuffling, deck structure and note type included.
- The package carries the **deck assignment** and the **`HQ::` tags** described below, so everything in this section still holds.
- **Cost, stated honestly:** `.apkg` is a SQLite database inside a zip and is meaningfully harder to generate than a text file, with Anki-version compatibility to watch. **It is still the correct call** — the alternative pushes that complexity onto the student every single export.
- **`.txt` remains available as a fallback** for text-only cards (no screenshot captured) and for anyone who prefers it, but it is **not the default**.
- **Note type:** HQ ships a simple two-field note type (`Front` / `Back`) plus the tag field. **No custom card templates, no styling** — the card must look native in whatever Anki setup the student already has.

**Tags carry the diagnosis**, so the student can filter, suspend, and study by cause inside Anki the way AnKing-style tag hierarchies already work:

```
HQ::cause::didnt-know          (one of the six; CARS may add its three)
HQ::section::bio-biochem       (c-p · b-b · cars · psych-soc)
HQ::concept::amino-acids
HQ::source::aamc-fl3          (where the miss came from)
HQ::added::2026-07
```

- **Export format:** tab-separated with a **tags column**, which Anki's text importer reads natively. No API, no add-on, no AnkiConnect.
- **Cause tags reuse the locked taxonomy** shared with `AcademicMistake` (`01` §3.3) — not a second vocabulary.
- **Batch export** — a whole FL review or a week of misses in one file, not one download per card.
- **HQ marks the mistake `card-exported`** and **does not count card review toward mastery**, because it cannot see it.

### Target deck — `MCAT Mistakes`, subdecked by section (Andy, July 2026 · LOCKED)

**The export carries a deck column.** Without one, Anki drops the cards into whatever deck is currently selected — which for most students is their content deck, and **that is exactly the interference this whole ruling exists to prevent.**

```
MCAT Mistakes::C-P        (Chem/Phys)
MCAT Mistakes::CARS
MCAT Mistakes::B-B        (Bio/Biochem)
MCAT Mistakes::P-S        (Psych/Soc)
```

- **Deck name is `MCAT Mistakes`**, subdecked **by section** — matching how students already reason about their misses, and how Anki's per-deck options work.
- **Why subdecks and not just tags:** tags let you *filter*; **decks control scheduling and daily limits.** Subdecking by section means the student can cap Psych/Soc at 10 new cards/day without touching Bio/Biochem, and can suspend a whole section during a phase that isn't targeting it. Tags cannot do that.
- **Concept, cause, and source stay as `HQ::` tags** (above) — they're cross-cutting and don't map to a deck hierarchy.
- **Never writes into an existing deck.** ⭐ HQ produces a file; the student imports it. The deck column means the import lands in `MCAT Mistakes` regardless of what deck was selected at import time. **Content decks (AnKing, MilesDown, Bootcamp, class decks) are never read, never modified, never merged with.**
- **Consequences that make this load-bearing:** mistake cards get their **own** daily limits, their **own** FSRS parameters, and their **own** statistics. A heavy FL review week spikes the mistakes deck without disturbing the content deck's schedule — which is the whole point.
- **Academics parallel:** the Academics tab's exported mistake cards use `Academics Mistakes::{COURSE CODE}` on the same principle. Same rule, different root — the two never mix.
- **The root deck name is a setting**, defaulted to `MCAT Mistakes`, for students who already have a deck naming convention.

### Consequence: mastery is measured by drill performance only

Already established in §5g, and this ruling makes it load-bearing. HQ has **no visibility into card review by design**, so:

- **Mastery, content decay (P1), and readiness read drill and practice results** — never card activity.
- **Nothing in HQ ever waits on, or reports on, an Anki review.**
- AnkiConnect due-counts remain optional display only (§5g).

## 5i. FSRS presets — named, community-sourced, with Advanced (Andy, July 2026)

Anki exposes an enormous settings surface. **Most of it is card-app machinery that has no meaning in HQ** — learning steps, insertion order, sibling burying, audio, auto-advance. HQ schedules topics and drills, so those don't apply.

**What actually transfers: desired retention · maximum interval · leech threshold and action · Easy Days.** That's the whole surface.

### Presets, named

Two kinds, in one picker:

**By effort level** — the real tradeoff, in plain language:

- **Light** — fewer reviews, lower retention target. Maintenance and low-stakes classes.
- **Standard** — the default.
- **Exam-heavy** — more reviews, higher retention. A class with an exam coming, or MCAT crunch.

**By community source** — *"AnKing has a preset, and there are other known people in the MCAT world with their own"* (Andy):

- **AnKing** and other recognised community presets, each shown with **whose it is, what it optimises for, and a `verifiedAsOf` date.**
- **Category B — opinionated community consensus** (`implementation/knowledge-sources.md`). Research task: identify which presets are genuinely well-known before shipping any. **Do not invent attributions.**
- **Extensible as data, not code** — adding a preset is a config entry.

### The Advanced panel — exactly four controls (YES, it gets built)

Revealed behind `Advanced`, collapsed by default. **Four controls. Nothing else.** Any deviation from a preset relabels it `AnKing · modified`, and `Reset to preset` is always one click.

| Control | Form | Range / default | What the UI says |
|---|---|---|---|
| **Desired retention** | slider | 80–95%, default **90%** | Live plain-language consequence: *"90% — you'll blank on about 1 in 10 at review time. Higher means more reviews, less forgetting."* **This is the only knob most people should ever touch.** |
| **Maximum interval** | days | default **365** | *"How far out a topic can be pushed."* **Not Anki's 1825** — coursework ends and MCAT prep is under a year, so multi-year intervals are meaningless here. |
| **Leech threshold + action** | number + select | default **8 lapses** | *"After 8 failed reviews, stop drilling and change approach."* **Action is `escalate to content review`, never `suspend`** — HQ has no cards to suspend, and this routes into the existing mistake-cluster escalation (§5b #7). |
| **Easy Days** | 7 sliders (minimum / reduced / normal) | all **normal** | Per-weekday load reduction, exactly Anki's model. **Global, not per-class** — it describes your week. |

**Explicitly NOT rendered — these are card-app concepts and have no meaning in HQ:** learning steps · relearning steps · insertion order · new-card gather/sort order · new/review order · sibling burying · audio · auto-advance · maximum answer seconds · historical retention · custom scheduling · **and the 19 FSRS parameters** (§5i, settings-not-parameters).

**No per-day item caps** (`new cards/day`, `max reviews/day`). Those govern volume, and volume is already governed in **hours** by the shared budget (§3.3-B0). Capping by item count on top of capping by hours would produce two sources of truth that disagree.

**Changing retention or max interval** asks once whether to reschedule existing items or apply going forward. **One confirm, not a persistent toggle.**

### Scope — global with per-class override (Anki's `Preset / This deck` pattern)

- **Default is one global preset**, since most students want one stance on effort.
- **Academics allows a per-class override** — an orgo course in an exam month genuinely wants `Exam-heavy` while a gen ed wants `Light`. Only `stem` classes expose it; `writing` and `general` have no topic scheduler to configure (`01` §4.1-N).
- **MCAT uses one preset for the whole tab** — drills aren't divided by class.
- **Easy Days is always global.**
- The picker mirrors Anki's familiar layout so the pattern is recognisable to anyone arriving from it.

### The one hard line: presets copy SETTINGS, never PARAMETERS

Anki's 19 FSRS parameters are **optimised against a specific person's review history on a specific set of cards.**

- **Never accept a pasted parameter string, and never ship someone else's parameters.** Applied to HQ — where the review unit is a two-minute spoken explanation, not a flashcard — borrowed parameters would perform **worse than defaults** while looking authoritative.
- **Settings are opinions and transfer fine** (a retention target is a stance on effort-vs-forgetting). **Parameters are history-derived and do not.**
- HQ ships sane defaults and **re-optimises from the user's own review history** once there is enough of it — automatically, never as a text field.
- **State this in the UI where a community preset is chosen**, so nobody expects parameter parity with their Anki setup.

### Easy Days — worth stealing outright

Per-weekday load reduction (minimum / reduced / normal), exactly as Anki does it. **It plugs straight into intake busy periods (§3.3-A2) and the shared hour budget (§3.3-B0)** — the same information expressed at the scheduler level instead of the plan level. Cheapest high-value borrow in the list.

## 5j. The coach — behavior (P8, added July 2026 · LOCKED)

Placement was ruled in §5f: **no surface.** The coach is **at most one line appended to the end-of-session summary** (§3.0-C). This section specs what it says and when.

Domain: **everything that isn't material** — focus, session patterns, time-of-day performance versus the scheduled exam time. Never content, never scores as such.

### A. The specificity bar (the whole feature, really)

**An observation ships only if it is a real number about a real pattern in the student's own logged behavior.** Otherwise nothing is said.

| Ships | Never |
|---|---|
| *"Your last three sessions ended around 30 minutes — your average is 50."* | *"Remember to get enough sleep!"* |
| *"You score 4 points higher on morning full-lengths. Your exam is at 8 AM."* | *"You seem to be struggling lately — keep your head up."* |
| *"You've started 6 sessions after 10 PM this week and missed at a higher rate in each."* | *"Great work today! Consistency is key."* |

The failing column isn't merely unhelpful — it is **actively corrosive**, because generic encouragement from software teaches the student to stop reading anything it says. **A coach that can be ignored safely has failed.**

- **Observed, never inferred.** It reports behavior HQ logged. It does not model motivation, discipline, or mood.
- **Descriptive, not prescriptive** (standing rule). State the pattern; the consequence is at most a clause (*"the plan is budgeted at 50"*). **No instructions.**
- If the data doesn't clear the bar, **say nothing** — the honest-empty-state discipline applied to advice.

### B. Frequency — the constraint that keeps it credible

- **At most one observation per session**, plus a **hard rate limit of roughly one per week.** ⭐ A coach that speaks every night is noise by Thursday.
- **Silence is the default case**, not the exception. Most sessions end with no coach line at all, and the summary must look complete without one.
- **No history, no log, no "insights" list.** An observation appears once and is gone. **Retaining them would recreate the surface §5f exists to prevent.**
- **Dismiss suppresses that observation *type*, not just that instance** — declining a pattern once is an answer.
- **Settings: a single on/off toggle.** No granularity — granular controls imply it should be tuned rather than trusted.

### C. The hard boundary — when signals look heavier than performance

**The coach stops. It does not coach harder.** ⭐ This is the one place in the product where more signal produces **less** output.

Triggering conditions are behavioral and coarse (e.g. many consecutive days without a break, a sustained run of late-night sessions). When they're met:

- The performance observation is **suppressed entirely** — never both.
- HQ states **one factual observation**, offers **one concrete option**, and gives **one pointer**: *"That's 11 days straight, most past midnight. Taking a real day off is a legitimate study decision, not a lapse."* + `Schedule a rest day` + *"If things feel heavier than the studying itself, support resources are in Help."*
- Then it **stops** — no follow-up next session, no escalation, no tracking of whether the student complied.

**Never:** interpret emotional state · use clinical language · ask how the student is feeling · attempt any assessment. **HQ does not triage, and it is not a substitute for support** — the pointer is static and lives in Help.

**Never punish rest.** A streak counter that guilts a student for taking a day off is the exact failure this boundary exists to prevent, and it overrides any streak display.

### D. Data & implementation

Reads only what's already logged: session start/end times, planned vs. actual duration, session-level accuracy, FL start times and section scores. **No new fields**, no new surface, no new component: the line renders inside the existing summary sheet.

### E. Why detection is deterministic — and what that costs (LOCKED)

Every shipped observation is **comparison over logged numbers**, not reasoning:

| Observation | The computation |
|---|---|
| *"last three sessions ended around 30 min — your average is 50"* | recent durations vs. rolling mean, threshold |
| *"4 points higher on morning FLs; your exam is at 8 AM"* | FL scores bucketed by start hour, means compared, vs. registered exam time |
| *"6 sessions after 10 PM this week, missed at a higher rate in each"* | filter by start hour, compare accuracy |

**The reason to keep it deterministic is the whole point of the feature: the claims must be *checkable*.** *"Three sessions below 60% of your average"* can be verified against the log. *"You seem to be losing steam"* cannot — and one unfalsifiable line poisons trust in all the others. That is the same failure as generic encouragement, only better dressed.

**The cost, stated plainly:** ⭐ a deterministic coach can only notice patterns someone thought to program — realistically **5–8 observation types, ever. It will never surprise you.** That is an accepted trade, not an oversight.

**The LLM boundary:**

| Layer | LLM? |
|---|---|
| **Detecting** the pattern | **No** — never. Verifiability is the feature. |
| **Phrasing** the line | **Optional polish only.** Templates with data slots are the default; an LLM may smooth wording but **may never alter a number, add a claim, or change the observation's meaning.** |
| **Discovering new patterns** | **Dev-side only.** An LLM may help *propose new rules* offline, which are then reviewed and hard-coded. **Never runtime generation.** |

Consequence: **the coach works with no API connected**, like every other deterministic feature (§3.4 no-API fallback).

## 5f. Placement rulings (July 2026 — LOCKED)

**Per-section training modes live in Questions, as modes.** Section practice is about *how you practice and how you fail*, so it belongs to the practice loop, and the **per-section miss-reason taxonomy attaches to the `Mistake` object**, not to Content. **Content stays about material.** Splitting practice across Content and Questions would fracture the one loop that has to stay tight. **CARS keeps its bespoke surface** (§3.7) because its daily-habit cadence genuinely differs; C/P, B/B, and P/S are **modes inside Questions**.

**The coach (P8) gets NO surface — and this is the ruling, not a deferral.** It goes in the **end-of-session summary** (§3.0-C), which is already built, already reflective, and already earned.

- **At most one observation per session**, and only when it clears a specificity bar — a real number about a real pattern, or nothing.
- **Reasoning:** a tab is the worst possible home. It would be a place you visit to be evaluated, competing for attention against studying, in the tab already flagged as most at risk of burying the student. **A surface has space to fill and will fill it** — which is precisely how "your last three sessions ended 20 minutes early" drifts into wellness boilerplate.
- The hard boundary stands: **performance observations only, and when signals look heavier than performance, stop coaching rather than coach harder.**

## 5e. Brainstorm rulings (July 2026)

**Promoted — spec these:** Test Day tab (phase-gated, hidden until actionable) · Bookshelf (phase-aware resource shelf with subscription expiry and AAMC burn rate) · per-section training modes with **per-section miss-reason taxonomies** · **content-mastery decay** (mastery states are not permanent checkmarks) · stamina training incl. **within-FL score decay** · retake mode · the taper.

**Minor add-ons — build, but not headline features:** review-to-practice ratio · pacing analysis (post-hoc only; scoped to what HQ can see) · timed-vs-untimed honesty · Anki deck pace · method-to-outcome.

**REJECTED — do not build:** target score derived from the school list ("not that deep") · a separate diagnostic surface (AAMC FL1 covers it) · live pacing cues during practice exams · seat-availability checking (no AAMC API exists).

**Governing note (Andy, July 2026): do not bombard the user.** MCAT prep is already overwhelming. This tab is the most at risk of burying the student in metrics, and the §6.11 attention budget applies here with the least slack of anywhere in the app. **One clear next action beats twelve accurate readouts.**

## 5c. Candidate features (extensible — keep adding)

Not committed; captured so nothing is lost. Promote deliberately.

Score-band targeting per school list · per-section time-per-question analytics · "why I got it right" tracking (lucky guesses flagged as weak) · question-type taxonomy beyond concept (discrete vs passage-based) · pseudo-full-length (two sections, half the fatigue) · test-day simulation (real timing, breaks, no pausing) · anxiety/stamina log across FLs · retake planning (score delta expectations, what changed) · void-decision guidance on test day · study-partner comparison (opt-in) · content-review method tracker (which resource actually moved a category) · "explain it to me differently" on a stuck concept · formula/equation sheet auto-built from your misses · high-yield weighting from AAMC content weights (`data/mcat-content.json` section weights) · post-exam reflection loop feeding the next attempt · sleep/energy correlation with FL performance · question-flagging strategy coaching · calculator-free arithmetic drills (C/P speed) · CARS passage-source variety tracker · burnout guard (hours vs mood check-in).

## 5d. Lifecycle, attention, and trust (APP-WIDE — defined in `01` §§6.10–6.12)

These are **not Academics-only**. They are defined in full in `tabs/01-academics.md` §§6.10–6.12 and apply verbatim here; MCAT is where several of them bite hardest.

- **Cold start.** A student 14 months out has no FLs, no mistakes, no mastery data. Every metric in §5a must stay **dormant with a reason** ("needs one full-length before this means anything") rather than render a zero. Day one shows **one** action: set a test date and take a diagnostic.
- **Abandonment recovery.** ⭐ MCAT prep gets dropped constantly — a hard exam week, an illness, a bad practice score. Returning after 12 days must trigger **amnesty**: name the gap, one bulk-clear of the stale drill queue, then the two or three things that still matter. **The study plan reflows; it does not present a backlog.** A plan that shows 40 missed sessions is a plan the user abandons permanently.
- **Test-date rollover.** Moving or retaking the exam is the MCAT equivalent of term rollover: the old plan archives, `Mistake` and `ContentMastery` history **stays queryable** (a retake depends entirely on it), and the retrospective fires.
- **Inherits topics from finished courses (`01` §6.10-C).** At term end, MCAT-tagged Academics topics **transfer ownership to this tab** — a student finishing PSYC 101 in December still faces psych/soc on the MCAT fourteen months later. Transferred topics arrive **seeded with their existing FSRS state** (stability, difficulty, last review), never restarted at zero, and enter the **existing** content queue prioritised by AAMC content weight. **Do not build a separate maintenance scheduler or priority system** — stretched FSRS intervals plus the queue that already exists are the whole mechanism. The volume guard is the same one this tab already applies.
- **Attention budget.** MCAT competes for the **same global 3-per-week cap** as Academics — not its own budget. During a heavy exam week, Academics nudges will usually outrank MCAT ones, and that's correct.
- **Score your own predictions.** ⭐ The projected-score band (§5a) is the app's most consequential claim. **Log every projection against the actual next full-length** and show the hit rate. Suppress the projection entirely until it clears a minimum sample and accuracy — a projected score that has never been checked is a horoscope, and on this metric specifically a wrong number does real damage to a student's decisions.
  - **But lead with the fast-resolving version** (per `01` §6.12): full-lengths are weeks apart, so projection accuracy says nothing for months. **Score drill retrievability instead** — every M2M drill review resolves a prediction immediately, giving a usable hit rate within weeks (*"when HQ calls a concept solid, you get it right 8 of 10 times"*). Full-length projection accuracy accrues underneath and is reported later as a secondary line.
- **Intervals, not points.** Projected score is always a **band** ("508–513"), never a single number. This is already the §5a convention; §6.12 makes it a rule.

## 6. Intelligence & API (phasing)

- **Manual now (no API):** tagging, analytics, spaced-repetition drills from the bank — a fully usable loop today.
- **AI later (needs LLM API):** screenshot→auto-extract, auto-classification (concept + miss-reason), on-demand drill generation, and the Advisor. This is Atlas Intelligence; it needs an API key wired via the service foundation. Every AI classification stays explainable + user-correctable (`02`).

## 7. MCAT resource bank (research task — Category B, opinionated)

**This is Category B, not Category A** (`implementation/knowledge-sources.md`): MCAT resources are *opinionated community consensus*, not factual reference data. It must **not** carry a factual `confidence` field or be presented as settled truth — it captures what the pre-med community *thinks*, with the debate intact.

A source-cited guide to MCAT resources (free + paid, content + practice + CARS + full-lengths), committed as `data/mcat-resources.json`. Each resource carries:

- **consensusTier:** `near-universal` (UWorld, AAMC official materials + FLs) · `widely-used-debated` (Kaplan, AnKing/MilesDown Anki, Jack Westin CARS, Blueprint/Princeton) · `niche`.
- **purpose:** content review / practice questions / CARS / full-length / spaced-repetition.
- **cost:** free / paid.
- **debate:** who champions it and who skips it, and why (both sides — never one verdict).
- **communitySources:** cited (r/MCAT, YouTube, tutors, blogs) — the Category-B source hierarchy.

Research: Claude synthesizes community consensus from forums/social/YouTube; Andy supplies optional cues and cross-references against his own knowledge. Long-term this is an **Atlas** feed (crowdsourced knowledge, cited, distinguishable from fact); interim is this vetted guide. Free entries feed drill supplementation (§4); the full guide informs study planning + Stage-5 resource pointers. Freshness-tracked (`data-refresh.md`) but volatile — opinions shift.

**Trust rule:** in the UI, resource recommendations are shown as *community consensus* (with the tier + the debate), never as HQ's factual claim (`architecture/02` trust separation).

## 7a. Components used (feature → library component)

Explicit traceability (from `implementation/component-inventory.md`); motion from the shared system (`04` §7a). **LLM surfaces (Advisor, Tutor) are no longer deferred (Aug 2026).** The shared chat primitive (`AI Input` + `Typewriter Text` + `Message`/`Message Scroller`) builds now rather than waiting on Atlas, per `implementation/component-inventory.md` §8. No-API fallback keeps every deterministic feature (plan generator, mastery tracker, M2M) fully working regardless.

| Feature | Component(s) |
|---|---|
| Seven flat sub-tabs | **Animated Tabs** (flat — no mode switch) |
| Study home / Start session | `Card` + **Smooth Button** (primary CTA) |
| Session focus mode + Pomodoro | `FocusModeLayout` (outside shell) + timer |
| Readiness hero (%/projected/section bars) | **Animated Progress Bar** (sections) + **Number Flow** (projected) + **Chart** (readiness) |
| Score slider (diagnostic→now→goal) | `Slider` + **Number Flow** |
| Today's plan (check off) | list + `Checkbox` / **Animated Toggle** |
| Right rail (countdown/nudges/tiles/heatmap) | `Card` + stat tiles + **Contribution Graph** + **Notification Badge** |
| Plan tab (phased, drag sessions) | **Reorder** (drag) + day `Card`s + phase legend + **Calendar** (week/month) |
| Projected-vs-goal banner | `PageBanner` + **Number Flow** |
| Content mastery tracker | checklist + **Animated Tags** (states) + **Animated Progress Bar** (rollups) |
| Questions / per-answer explanations | `Accordion` (per choice) + `AI Input` + `Message`/`Message Scroller` Tutor |
| Mistake capture (screenshot/paste) | **Animated File Upload** / paste |
| Diagnosis pickers (concept + miss-reason) | **Searchable Dropdown** (concept from `mcat-content.json`) + `Select` (in-app, `01` §4a) |
| M2M analytics (cause×section heatmap, breakdown) | **Chart** (heatmap + bar) |
| Mistake inspector | `CenterPeek` + `ObjectInspector`; Split = mistake + drill |
| Stats (trends, bars, heatmap, most-missed) | **Chart** (line) + **Animated Progress Bar** + **Contribution Graph** + **Number Flow** |
| Advisor chat + quick-reply chips | `AI Input` + `Message`/`Message Scroller` + `Typewriter Text` (streaming) + `Badge` chips |
| Full-length review workflow | `Input`/`Select` (log FL) + **Chart** (FL trends) |
| CARS trainer (timed passages, pacing) | `FocusModeLayout` + timer + **Scrubber** (pacing) |
| Flashcards (pre-made + custom) | `ts-fsrs` review + **Animated Tags** (Anki sync) |
| Plan intake wizard (≤6 steps) | **Animated Stepper** |
| Add plan → Google Calendar | Calendar integration (`06`) |
| Resource bank | `ResourceGrid` + **Preview Link Card** |
| Exam countdown / streak / diagnostic entry | **Number Flow** + `Input` |
| Catch-up alert (right rail) | **Notification Badge** + Attention bell |
| Most-missed topics | **Chart** / list |
| Flashcard pre-made deck import + customize | list + **Animated Tags** (Anki sync) |
| Quick-reply chips (Advisor/Tutor) | `Badge` chips |
| "Add flashcard" from missed question | `Smooth Button` → card (AI-assisted, deferred) |
| Games / arcade (optional, sparingly `04`) | Carousel / mini-widgets |
| AAMC trademark disclaimer | text (persistent) |
| **Test Day panel** (§3.11) | `Card` + `Collapsible` (phases) + `Checkbox` + `Badge` (phase state) + **`MascotNote`** teaching variant (void briefing, `01` §4f) + `Alert Dialog` (retake decision). **No new components.** |
| **Stamina decay** (§3.12-A) | **Chart** — per-section scores *within* an FL, overlaid across FLs; honest empty state below the FL threshold |
| **Retake plan reasoning** (§3.12-B) | existing Plan tab + a reasoning line; **no new surface** |
| **Wind-down phase** (§3.12-C) | plan phase chip + released-content notice (`Badge` + text) |
| **Coach line** (§5j) | one row inside the **existing** end-of-session summary — no new component, no new surface; dismiss suppresses the observation *type* |
| **Anki export** (`01` §4g) | `.apkg` builder (notes + media + deck + tags) + `Dialog` + `Badge` (Anki 23.10+ notice) |
| Empty / loading / error | `EmptyState` · **Skeleton** (Shimmer) |

## 8. Cross-tab & reuse

- `mcat-content.json` → concept taxonomy, section structure, percentiles (score context).
- `ts-fsrs` → drill spaced repetition (shared with Academics Class Center).
- Academics **MCAT content-coverage map** → which content you've covered in coursework feeds readiness.
- Best practice score → Overview MCAT domain row + roadmap (exam-timing milestone).

## 9. Inspector, states, mobile

- A mistake opens in the **center peek** (`01` §2): question, your/correct answer, diagnosis tags, linked drills, resource. Expand = full review; Split = mistake + its drill.
- Empty: "Log your first missed question" invitation; the loop's value shown. Loading/error per `01` §8.
- Mobile: capture via screenshot/photo; analytics reflow (heatmap → stacked bars per `01` §5c).

## 10. Do Not Generalize

MCAT score/readiness logic is MCAT-only. QOTD stays rejected (handoff) — not here, not on Overview. Do not build a second spaced-repetition engine — reuse `ts-fsrs`. Miss-reason taxonomy is fixed (§4); don't let tabs invent parallel ones. **Do not AI-generate QBank practice questions** — the browsable bank is curated real questions; AI generation is only for bespoke M2M drills.

## 11. Acceptance criteria

- [ ] **Study session (centerpiece):** study home shows today's schedule + Start session / Customize; focus timer with optional Pomodoro; auto-logs hours; quick-capture (mistake/note) inside; end summary updates readiness/streak/coverage; Overview widget launches it.
- [ ] **AI/content rule (§2a):** AI generates only M2M drills + flashcards; QBank/CARS/content stay external; LLM otherwise for guidance/synthesis only.
- [ ] **Flashcards (§3.8, §5h):** pre-made decks are the default and **Anki owns all card timing**. "Add flashcard" from a missed question is AI-assisted, **tagged with cause/section/concept/source**, and **exported as tab-separated text with a tags column** — batch export supported. **NO in-app card review UI or card queue exists anywhere in HQ**, in either tab; verify by grep. Mastery reads **drill and practice performance only, never card activity**. AnkiConnect due-counts are optional display only.
- [ ] **The topic and drill schedulers are NOT flashcard mechanisms** — HQ's `ts-fsrs` still schedules Academics topics and MCAT M2M drills. §5h must not be read as removing them.
- [ ] **FSRS presets (§5i):** picker offers **effort-level presets** (Light/Standard/Exam-heavy) **and named community presets** (AnKing and others, each with attribution, what it optimises for, and `verifiedAsOf`), extensible **as config data**. **Advanced panel is built and renders exactly four controls** — desired retention (slider 80–95%, default 90%, with live plain-language consequence), maximum interval (default **365, not 1825**), leech threshold + action (**action is `escalate to content review`, never `suspend`**), and Easy Days (7 sliders, **global**). **Nothing else renders** — no learning/relearning steps, insertion or gather order, burying, audio, auto-advance, historical retention, custom scheduling, **no per-day item caps** (hours govern volume, §3.3-B0), and **no parameter field**. Deviation labels as `modified` with one-click reset; retention/interval changes ask once about rescheduling rather than exposing a toggle. **Scope: global by default, per-class override for `stem` classes only, Easy Days always global.** **Presets carry SETTINGS only: never accept a pasted FSRS parameter string and never ship another person's parameters** — HQ ships defaults and re-optimises from the user's own history. The settings-vs-parameters distinction is **stated in the UI** where a community preset is chosen.
- [ ] **Content mastery tracker:** AAMC content-category checklist with mastery states; section rollups drive readiness; session/M2M update it; links to external resources only.
- [ ] **Full-length review workflow:** log FL (section scores), review misses → M2M, recalibrate projection, FL-score trends.
- [ ] **Anki export is `.apkg`, always** (`01` §4g, global): notes **plus media** bundled, double-click import, deck assignment carried in the package, no field mapping. **No `.txt` path is offered in the UI.** Note types are **Basic · Cloze · Image Occlusion only**, native, **no custom templates or styling**. Packages containing Image Occlusion **state the Anki 23.10+ requirement** rather than silently failing.
- [ ] **Mistake card faces (§5h):** front is the **captured screenshot** of the question as seen plus a one-line source context, and **does not show the student's original answer**; back carries correct answer, explanation of why their pick was wrong, **the diagnosis (concept + miss-reason) printed on the card**, and the source line.
- [ ] **Deck targeting (§5h):** cards land in `MCAT Mistakes::{C-P|CARS|B-B|P-S}` **because the package carries the deck**, regardless of which deck is selected at import. **Existing content decks are never read, modified, or merged with** — verify by importing with a content deck selected.
- [ ] **Test Day (§3.11):** renders as a **phase-gated Dashboard panel, not a tab**, and **does not render at all** when no phase is open or no exam date exists. Phase 1 surfaces **accommodations above registration**. Phase 2 delivers the **void briefing before the exam** and stores the student's **own void rule**, replayed on exam morning. Phase 3's waiting window **generates nothing** — no predictions, no reflection prompts — and retake-or-apply is a **comparison with consequences stated, never a recommendation**. **No seat-availability display anywhere.**
- [ ] **Stamina (§3.12-A):** decay is computed from existing per-section FL scores, reported as an **interval** and only above a minimum FL count (otherwise the honest empty state). Training appears as **normal plan blocks**, including **at least one FL at the student's true exam time of day**. **No stamina screen exists.**
- [ ] **Retake mode (§3.12-B):** generator inverts to **gap-first** — section-weighted by the real score report, miss-reason-weighted, and **content mastery is not reset** (known topics are maintained, not re-taught). The plan **states its own reasoning** at generation. **No separate retake UI** — same Plan tab, different weights.
- [ ] **Wind-down (§3.12-C):** hard override covers the **final 2–3 days** only; a longer wind-down exists as an **option defaulted off**, marked **Category B with attribution and date** — never asserted as established practice. **Unfinished content is explicitly released with a stated reason, never silently deferred.** No new full-lengths inside the window. Visible as a plan phase; overridable without nagging.
- [ ] **Coach (§5j):** **no surface** — at most **one line in the end-of-session summary**, rate-limited to roughly one per week, **silent by default**, with **no history or log**. Every observation is a **verifiable number about logged behavior**; generic encouragement never ships. **Detection is deterministic and works with no API**; an LLM may polish phrasing but **may never alter a number or add a claim**. When heavier signals appear, the performance line is **suppressed entirely**, replaced by one factual observation + one option + a static Help pointer, and then it **stops** — no escalation, no emotional interpretation, and **rest is never punished**.
- [ ] **Post-clearing (§3.9-a):** a cleared concept **returns to normal content decay** rather than disappearing; a **repeat miss on cleared material re-enters M2M, is labelled as a repeat, and outranks a first-time miss**; two clear-then-miss cycles **escalate to content review instead of more drilling**.
- [ ] **CARS trainer:** daily timed-passage mode from external passages; reasoning-based review into the CARS M2M lane; per-passage pacing.
- [ ] **Bookshelf (§3.10, P2):** lives **inside Content, not a new tab**. Hero is **ONE recommendation with its reason**, catalog below — never a grid of logos. **Phase read from the plan generator, never asked.** `ShelfItem` entity with **`lifetime` as a first-class expiry value**, optional coarse `consumedPct`, and `lastUsedAt`. **Expiry/subscription tracking is on PAID items only — free resources have no expiry field and never render an empty one.** `cost` shown only for items already owned. Shelf **grouped by purpose, not by price**. Mockup: `specifications/mockups/02-mcat/mcat-bookshelf.html`. Surfaces **expiry against planned blocks** (not expiry alone), **AAMC burn rate** (feeding the generator so AAMC schedules late by construction), **owned-and-untouched**, and **gaps in coverage**. **No affiliate links, no sponsored placement, no purchase nudges** — free options first where competitive. Recommendations are **Category B, attributed, `verifiedAsOf` dated**. Works with an empty shelf. Expiry warnings fire **once, via the attention auction, and only on a real collision**.
- [ ] **Drill scheduling — no self-grading (§3.9-a):** **`Again/Hard/Good/Easy` does not exist in the M2M drill flow.** The outcome is the grade — **wrong → soon · right-but-flagged/guessed → medium · right-and-unflagged → longer** — driven by `ts-fsrs` (still one scheduler). Intervals are **shown, never chosen**. `resolvedAt` is set by **clearing correctly and unflagged across ≥2 spaced encounters**, never by a self-rating. Self-grading remains **only** in the Academics open-recall runner and in student-set content-mastery states.
- [ ] **Section-aware drills (§3.9):** the M2M drill **template varies by section** — C/P produces a calculation with distractors matching the student's error, B/B a data-interpretation item, P/S a term-application item, **CARS a pattern drill with NO generated passage** (§2a). **One screen, one queue, one component set** — the origin card, spine, timer, submit, and tutor entry are identical across sections. Mockup: `specifications/mockups/02-mcat/mcat-section-aware-drills.html`.
- [ ] **No specialised drilling exists (§3.9 — P3 fully REJECTED).** Verify by grep: **no B/B mode, no P/S mode, no C/P speed drills, no procedural drill generator, no second drilling surface.** P3 is satisfied entirely by the tagged Anki export (§5h): section · cause · concept · source. Per-section differences appear only as **plan-generator cadence rules**, never UI.
- [ ] **Content-mastery decay is per section (§3.5, P1):** FSRS state on `ContentMastery` using the **shared scheduler**; **P/S fast · C/P and B/B moderate · CARS barely — CARS content is never nagged about.** Reads **performance only** (drills, practice, FL category results, time since marked reviewed) — **never Anki review activity**, which HQ cannot see. Framed as *"worth a refresh,"* never *"mastery lost."* Student-set state resets the curve. **Independent of §3.9 — unaffected by the P3 rejection.**
- [ ] **`missReason` is ONE general taxonomy (§2b):** six causes shared with `AcademicMistake` (`didnt-know` · `knew-it-but-blanked` · `wrong-method` · `misread` · `arithmetic` · `ran-out-of-time`) **plus CARS's three only**. **Per-section extensions are REJECTED — do not add them.** Nine options is the ceiling; tagging must be **one tap, not a decision**. Analytics segment by section but the **vocabulary never varies by section** — `section` already carries that dimension.
- [ ] **Shared hour budget (`00-product-shell` §11b):** MCAT registers **claims** (sessions, CARS, FLs **and their review blocks**) against shell-owned `WeeklyCapacity` — **it does not own capacity**. Oversubscription is reported **before** a plan is generated, never after. Precedence explicit and overridable. Slack reserved from the pool, not from a tab. Easy Days agrees with `WeeklyCapacity` as source of truth. **Works unchanged when only one tab is in use.** Never nudges the student to fill unclaimed hours.
- [ ] **Data model (§2b):** `StudySession`, `Mistake`, `Drill`, `ContentMastery`, `FullLength`, `McatFlashcard`, `StudyPlan`/`PlanSession`, `CalibrationRecord` defined before build; drills use the **shared `ts-fsrs`** engine (no second scheduler); `CalibrationRecord` reuses the Academics `ReviewEvent` shape; QBank/CARS content is **never** modelled as owned records.
- [ ] **Primary metrics (§5a)** render and are explainable — readiness driven by content mastery, projection labelled an estimate.
- [ ] **Smart features (§5b):** all 15 rules-based and explainable, each stating its cause; one pace line per panel, none on the streak; all function with no API key.
- [ ] Mistake capture (screenshot/paste/text) with section + guess/flag tagging.
- [ ] Diagnosis: structured concept picker from `mcat-content.json` (Sciences) + the locked miss-reason taxonomy (shared + CARS extras); all in-app styled controls.
- [ ] Drills serve same-concept-new-context, spaced via `ts-fsrs`, sourced from AI + free bank; AI generation gated behind the API, bank works without it.
- [ ] Analytics dashboard: cause×section heatmap, cause breakdown, top weak concepts/sub-concepts, weakest section — computed, no AI; CARS segmented by reasoning cause.
- [ ] Resources link weak concepts to free-bank materials.
- [ ] Manual loop fully usable with no LLM API; AI features light up when the key is wired.
- [ ] **Course-topic inheritance (§5d, per `01` §6.10-C):** MCAT-tagged topics from finished courses transfer into MCAT → Content **carrying their FSRS state**, never reset; they enter the existing AAMC-weighted queue; **no separate maintenance scheduler or priority system is introduced.**
- [ ] **Lifecycle/attention/trust (§5d, per `01` §§6.10–6.12):** metrics dormant-with-a-reason before there's data; **amnesty on return** with the plan reflowing rather than showing a backlog; test-date change archives the plan while keeping `Mistake`/`ContentMastery` queryable; MCAT nudges share the **global** 3-per-week cap; **projected score logged against the next actual full-length** with hit rate shown and suppressed below the accuracy gate; projection always a **band**, never a point.
- [ ] Verified light/dark, desktop/mobile, keyboard-only, reduced-motion; layout discipline (`01` §5c) — no protruding/overflowing analytics.

## 12. Open decisions / incoming

### Board closed — July 2026

**All five promoted items (P4–P8) are specced.** `tabs/02-mcat-board.md` is the record of what was promoted, resolved, and rejected.

- ✅ **P4 Test Day → §3.11.** **Ruled a phase-gated Dashboard panel, not a tab** (overrides the board's "new tab" note; standing rule: no new tabs). Hidden until actionable. Seat-availability checking **rejected — no AAMC API**.
- ✅ **P5 Stamina → §3.12-A.** **Ruled a generator behavior with no surface**; the metric lives in Stats, the training is normal plan blocks.
- ✅ **P6 Retake → §3.12-B.** **Ruled generator weights on the same Plan tab**, not a separate mode or UI.
- ✅ **P7 Wind-down (was "taper") → §3.12-C.** **Rewritten for evidence honesty** — the week-long taper framing was an unsupported extrapolation and was cut. Hard override is 2–3 days; longer version is an opt-in Category B preference.
- ✅ **P8 Coach → §5f (placement) + §5j (behavior).** **No surface**; one line in the end-of-session summary. **Detection is deterministic — LLM boundary written into §5j-E.**

### Also resolved this pass

- ✅ **Anki export format → `.apkg`, globally** (`01` §4g). Generalised out of MCAT: **every** export in HQ, both tabs. Driven by the screenshot requirement — `.txt` cannot carry media.
- ✅ **Note types → Basic · Cloze · Image Occlusion**, native only, no custom templates. **Anki 23.10+ required for Image Occlusion** and stated at export.
- ✅ **Mistake card faces → §5h.** Screenshot front (no original answer shown), back carries answer + explanation + **the diagnosis printed on the card** + source.
- ✅ **Target deck → `MCAT Mistakes::{SECTION}`**, carried in the package so content decks are untouched. Subdecks chosen over tags because **decks control daily limits and scheduling; tags only filter**.
- ✅ **Post-clearing behavior → §3.9-a.** Cleared concepts return to decay; repeat misses re-enter M2M ranked above first-time misses; two cycles escalate to content review.

### Still outstanding

- ⬜ **Decisions files for two mockups** — `class-types` has one; the **drill** and **Bookshelf** mockups do not.
- ⬜ **Research tasks** (unchanged): resource bank verification (§7), publisher FL normalization ordering (§3.3-C1), AAMC cycle dates + attempt-limit specifics + score-release schedule (**Category A, freshness-tracked**, §3.11).

---

- ✅ RESOLVED: Structure = seven flat sub-tabs (PrepCat model), no mode switch (§3).
- ✅ DONE: Resource bank built (`data/mcat-resources.json`, Category B, cross-referenced).
- ✅ DONE: Sub-tab designs (Dashboard/Plan/Content/Questions/Stats/Advisor) — via PrepCat (§3.1); Mistakes = M2M (§4).
- ✅ DONE: profile-popup + paywall + "?" help launcher captured in shell (§7.2).

- ✅ RESOLVED: AI-generation for **M2M drills only**; the browsable QBank is **deferred** until legitimately sourced (no copying other products' questions). In-app practice now = drills; "Questions" links out. All other PrepCat features (Dashboard/Plan/Content/Stats/Advisor) stay — they're workflow patterns with your own content, no IP issue.

- ✅ DONE: Plan generator specced (§3.3) — fuller intake, phased rules-based scheduling with named resources, labeled-estimate projection recalibrated from full lengths, drag/rebuild adaptation, wizard + Plan-tab UI. Rules-based, no API. Mockup: `mockups/02-mcat/mcat-plan.html`. + Google Calendar export (§3.3-F, global capability).
- ✅ DONE: Advisor + per-question Tutor specced (§3.4) — provider-agnostic LLM, context-assembled, tool-calls the plan generator to *act*, honest/grounded, no-API fallback keeps all deterministic features working.

- ✅ RESOLVED: **Centerpiece = the study session (§3.0)**, not M2M; M2M is a loop inside studying. Start-a-session is the primary action + an Overview widget.
- ✅ RESOLVED: **AI/content rule locked (§2a)** — AI generates only M2M drills + flashcards; QBank/CARS/content stay external; LLM otherwise for guidance/synthesis only.
- ✅ RESOLVED: **Flashcards (§3.8)** — MCAT = pre-made decks first (MilesDown/AnKing/Pankow) + AI-assisted cards from missed questions synced to M2M; Academics = AI-from-notes (already specced, `01` §6.2). Shared engine, different center of gravity.
- ✅ DONE: Added content mastery tracker (§3.5), full-length review workflow (§3.6), CARS trainer (§3.7).

Still open:
1. Andy's build screenshots / walkthrough → refine study-session interaction details (customize dialog, Pomodoro defaults) against the real `Mcat.tsx` + `McatSessionSetupDialog.tsx`.
2. Owned QBank sourcing (later) — original/licensed/open questions when ready.
3. Content-mastery state model — confirm the exact states (not started / reviewing / confident / mastered) and how strongly M2M performance overrides a self-marked state.
