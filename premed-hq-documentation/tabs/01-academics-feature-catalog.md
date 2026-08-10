# Academics: feature catalog (all 68)

**Companion to `tabs/01-academics.md` §6.** That file is the spec; this is the readable index. **Where they conflict, the spec wins.** Copy in "What you see" is illustrative, not final.

**Reformatted Aug 2026** to match `02-mcat-feature-catalog.md` and `03-clinical-feature-catalog.md`. **Two columns added, no features changed.**

## Part 1 — What is actually built

**Verified Aug 2026 by reading `src/pages/Academics.tsx` (1,189 lines), `AcademicRecallSession.tsx` (567), `ClassCenter.tsx` (2,629), `ClassHub.tsx` (1,001), and `src/lib/academics/`** — the code, not the spec.

**This is the pillar cleared for building, so *"is it real"* matters more here than anywhere.** **The headline: Academics is the most genuinely-built pillar in the app, and the three biggest features in its spec do not exist.**

### A. Real and working

| | Where | Note |
|---|---|---|
| **Class Center** | `ClassCenter.tsx`, 2,629 lines | **The largest single component in HQ.** Notes, topics, files, contacts, links, inline editing |
| **Class Hub** | `ClassHub.tsx`, 1,001 lines | Five product views, real |
| **Active recall runner** | `AcademicRecallSession.tsx` + `lib/academics/activeRecall.ts` | **Queue building, scope items, calibration, confidence mapping — all real functions with tests** (`activeRecall.test.ts`) |
| **FSRS scheduling** | `lib/academics/fsrs.ts` | **Genuinely the `ts-fsrs` library, correctly wired.** Not a hand-rolled approximation |
| **Chunk assignment** | `lib/academics/chunkAssignment.ts` + tests | Real |
| **Planner & GPA ledger** | `Academics.tsx:241` | Course names, credits, grades, BCPM status, term placement |
| **What-if simulator** | `Academics.tsx:396` | Projects GPA against hypothetical grades. **A real function** |
| **Tar Heel Tracker** | `Academics.tsx:584` | The requirement audit |
| **Mode + tab routing** | `Academics.tsx:97` | `Daily` / `Planning`, tabs, counts, deep links |

### B. Placeholder — looks built, is not

| | What is actually there |
|---|---|
| **Practice-exam generator** | `ClassCenter.tsx:1863` — **its own dialog says so:** *"Local placeholder generator for now. It uses selected topics and saved class material, then can be replaced by a backend endpoint later."* **The UI is complete: topic picker, source notes, source files. The generation is local and provisional** |

**Only one, and it is honest about itself in its own copy** — which is better than Clinical's three silent ones.

### C. Specced, not built at all

**Three, and they are the three largest features in the Academics spec:**

| | Spec | Reality |
|---|---|---|
| **Syllabus import** | `01-academics.md` §4.1-M, `A-BIG-1` — *"the single largest data-entry saving available anywhere in HQ"* | **Grep for `importSyllabus`, `parseSyllabus`, `syllabusImport` returns nothing.** The only `syllabus` in the code is `syllabusUrl`, a text field on a course |
| **Exam prep mode** | §4.1-R, a 68K mockup | **Grep for `examPrep`, `examPlan` returns nothing** |
| **Lecture capture → emphasis detection** | §Stage 1–4, the four-stage pipeline | Not present |

> ⚠️ **All three are `YES` in `BUILD-MANIFEST.md`.** **That is correct — they are cleared to build — but the manifest reads as though they might already partly exist.** **They do not. These are greenfield.**

### Summary

**9 real · 1 self-declared placeholder · 3 missing.** **The daily loop genuinely works** — capture a class, take notes, build topics, run active recall on a real FSRS schedule. **What is missing is everything that gets data *in* automatically** (syllabus, lecture) **and the exam-prep flow.**

---

## How to read the columns

**`Surface`** uses a fixed vocabulary, never prose, so *"what lives on the Planner?"* is answerable by filtering. Academics is the only tab with a **mode** above its tabs (§4), so surfaces are written `mode/tab`:

`Daily/Class Center` · `Daily/Assignments` · `Daily/class page` · `Planning/Planner` · `Planning/Tracker` · `Planning/Grades` · `recall runner` · `shell` · `Overview` · `none` (a rule or engine behavior with no surface of its own)

**`AI`** answers *"does this need an API key?"*

| | Meaning |
|---|---|
| ○ | Deterministic. No AI, ever. |
| ◑ | **Deterministic today, meaningfully better with AI.** Works without a key, but the non-AI version is the crude one. **This is the upgrade list.** |
| ◐ | AI-assisted, **degrades gracefully**. The feature still works without a key, just plainer. |
| ● | **Requires** an LLM. Without a key it does not exist. |

**Components are not duplicated here.** `Surface` is the join: look the surface up in `01-academics.md` §7. One source, no drift.

**Universal rules that apply to every row below:**

> ⚠️ **Consolidated Aug 2026 → `general.md` § *The nine universal rules*. Do not maintain a copy here.**
>
> **This catalog had written its own four**, Clinical had six at the bottom of its file, and MCAT had five. **Three independent copies of an app-wide rule set, already drifting.** **`general.md` now holds all nine** — the four below plus **`U-6`** (hours in exactly one pillar), **`U-7`** (HQ does not track non-events), **`U-8`** (may decline to assert, may not withhold), **`U-9`** (nothing scored, ranked, or compared), and **`U-2`** (deterministic by default, degrade never break).
>
> **`U-8` and `U-9` were never written here and this pillar is bound by both.**

**The four this file already had, retained so it reads standalone:**

- Each states its cause and is dismissible; none fires more than once per cycle.
- Every nudge competes in the **3-per-week attention auction** (§6.11). Firing is a privilege, not a right, and most of these are *discoverable* rather than pushed.
- Probabilistic outputs render as **intervals, never point estimates** (§6.12).
- Insufficient data → **dormant with a reason**, never a zero or an empty chart (§6.10-A).

**Also missing from this catalog, flagged rather than fixed:** **no `St` column and no `Part 1`.** Clinical audits its real code and splits features into *real · placeholder · unbuilt*; **Academics does not, so nothing here says what exists.** Given Academics is the only fully-mocked pillar and the one cleared for building, **that is the most consequential `Part 1` gap in the project.**

---

## Wave 1 · The record (#1–12)

*Grades, requirements, sequencing. Deterministic, available as soon as courses exist. This wave plus the grade ledger is a complete useful product on its own.*

| # | Feature | Surface | AI | What it does | What you see |
|---|---|---|---|---|---|
| 1 | **Prereq pacing vs MCAT timing** | Planning/Planner | ○ | Ties course sequencing to roadmap milestones | Right rail: *"CHEM 430 is your last MCAT-content prereq. Take it by Spring 2029 to sit the MCAT on your timeline."* |
| 2 | **BCPM watch** | Planning/Grades | ○ | Flags a science-GPA drop and names the cause | *"BCPM fell 0.08 this term. PHYS 118 (C+) is the driver."* |
| 3 | **Requirement gap alerts** | Planning/Tracker | ○ | Surfaces unmet requirements from the audit | Header: *"Missing one upper-level BIOL. Not currently scheduled."* |
| 4 | **Term load balance** | Planning/Planner | ○ | Warns before you commit to a brutal term | On the Fall 2027 column: amber chip *"3 BCPM courses, demanding term"* |
| 5 | **Upward-trend detection** | Planning/Grades | ○ | Spots a rising GPA trajectory as an application asset | *"Your GPA has risen each of the last 3 terms, worth naming in your essays."* with a link to Essays |
| 6 | **Graduation & credit pace** | Planning/Tracker | ○ | On track for credits by the matriculation target? | Pace bar: *"On pace, 62 of 120 credits, 4 terms remaining"* |
| 7 | **AMCAS retake reality** | Planning/Grades | ○ | Models the true impact of a retake (every attempt counts) | What-if panel: *"UNC replaces the D. AMCAS counts both. Your AMCAS GPA moves 3.61 → 3.58, not 3.61 → 3.71."* |
| 8 | **BCPM classification check** | Planning/Grades | ◑ | Data-quality guard on science/non-science tagging | *"NSCI 175 isn't classified. AMCAS goes by content. Confirm?"* with the syllabus attached |
| 9 | **Live semester GPA projection** | Planning/Grades | ○ | Projects the term's GPA from in-progress grades | Header: *"This term projecting 3.4–3.6"*, updating as work is returned |
| 10 | **MCAT content-coverage map** | Planning/Tracker | ○ | Which MCAT-content courses are done vs pending | Category grid: done / pending / never-scheduled |
| 11 | **UNC course difficulty intel** | Planning/Planner | ○ | Crowd-sourced course reputation (Atlas) | On a course chip: *"CHEM 251, commonly reported GPA dip. Consider a lighter term."* sourced and dated |
| 12 | **Prereq-order validation** | Planning/Planner | ○ | Catches an out-of-order or too-late chain | On drop: *"CHEM 262 needs CHEM 261, which isn't scheduled before it."* |

---

## Wave 2 · The habit (#13–20)

*Behaviour, not record. This is where the app starts changing what you do rather than logging it.*

| # | Feature | Surface | AI | What it does | What you see |
|---|---|---|---|---|---|
| 13 | **Post-lecture capture window** | Daily/Class Center | ○ | 24h after a scheduled lecture, one tap to log what was covered | Strip: *"CHEM 261 met 2h ago, what did you cover?"* with unit chips, one tap each |
| 14 | **Pre-lecture priming reminder** | Daily/Class Center | ○ | Surfaces prime/pretest/predict the day before | *"CHEM 261 tomorrow covers Unit 5. Three questions to hold in mind →"* |
| 15 | **Office-hours nudge** | Daily/class page | ○ | Connects saved questions to the moment they're useful | *"You have 4 saved questions for Dr. Elamin. Office hours tomorrow 2–4."* |
| 16 | **Interleaving check** | Daily/Class Center | ○ | Notices five straight sessions in one class | *"Five sessions in a row on CHEM. Mixing subjects improves retention, want a mixed queue?"* Suggests, never blocks |
| 17 | **Exam autopsy** | Daily/class page | ○ | Compares what you flagged weak against what appeared | Post-exam: *"You predicted 3 of the 5 hardest topics. Two you called Ready were on it."* |
| 18 | **Deadline collision** | Daily/Assignments | ○ | Three things due the same day, surfaced a week out | Bell + Assignments: *"Oct 21, problem set, lab report, and ENGL draft all due."* |
| 19 | **W-deadline awareness** | Planning/Grades | ○ | Withdrawal deadline nearing while a class trends badly | *"PHYS 118 is trending C−. The W deadline is Oct 30. UNC allows 16 W-hours; you've used 0."* States context, never advises |
| 20 | **Best time of day** | Planning/Grades | ○ | When your recall actually succeeds | *"Your recall is strongest 9–11am."* Descriptive only |

---

## Wave 3 · Cycle & memory (#21–31)

*Reads the learning cycle and your retrievability data. Several ask questions no study app currently asks.*

| # | Feature | Surface | AI | What it does | What you see |
|---|---|---|---|---|---|
| 21 | **Prerequisite decay** ⭐ | Daily/class page | ◑ | Your foundation for the current unit has rotted | *"CHEM 262 Unit 3 builds on three CHEM 261 topics now around 40%. Review these first →"* |
| 22 | **Cross-class overlap** | Daily/class page | ● | Semantic match across classes. **The tab's only hard AI dependency** | *"Amino acid chemistry (CHEM 430) and protein structure (BIOL 252) share 4 key points. Link them?"* Proposes; **never auto-merges** |
| 23 | **Cycle stall** | Daily/class page | ○ | Covered two weeks ago, never recalled | *"Unit 4 was covered Sep 12 and never reviewed."* |
| 24 | **Skipped-stage notice** | recall runner | ○ | Practice questions on never-recalled material | *"You haven't recalled this yet, so questions now test lookup, not memory."* Informational, never blocking |
| 25 | **Cram detection** | Daily/class page | ○ | First exposure within 48h of the exam | *"First time seeing Unit 7, exam in 2 days. This produces exam-day recall and near-total loss after, and this content returns on the MCAT."* |
| 26 | **Re-read detection** | Daily/class page | ○ | Files opened often, recalls rare | *"You've opened CHEM materials 14 times and run 2 recall sessions. Re-reading feels productive and is the weakest common method."* |
| 27 | **Topic difficulty outlier** | recall runner | ○ | Needs 3× your average reps | *"This topic is taking 3× your usual reps. It may need a different approach, not more repetitions. Try Feynman →"* |
| 28 | **Confidence drift per class** | Planning/Grades | ○ | Calibration tracked by subject | *"You're overconfident in CHEM, underconfident in BIOL."* |
| 29 | **Forgetting-curve preview** | Daily/class page | ○ | Where retrievability lands on exam day | Curve panel: solid history, dashed projection, exam line, *"~60–75% on Friday at this pace"* |
| 30 | **Material staleness** | Daily/class page | ○ | Orphaned files and unlinked notes | Materials: *"6 files were never opened. 3 notes aren't linked to any topic."* |
| 31 | **Weekly ritual** | shell | ○ | One Sunday prompt, **the only recurring nudge** | *"This week: 2 exams, 3 stalled topics, 5 decayed."* Also the destination for everything that lost the auction |

---

## Wave 4 · Exam, workload, self-knowledge (#32–43)

*Requires the app to hold both the academic record and the study history. Several exist nowhere else.*

| # | Feature | Surface | AI | What it does | What you see |
|---|---|---|---|---|---|
| 32 | **Exam-day readiness forecast** | Daily/class page | ○ | Projected retrievability on the exam date, rolled up | *"At this pace, 6 of 9 topics above 80% on Friday."* Turns FSRS into a decision |
| 33 | **Review-debt** | Daily/Class Center | ○ | Hours due vs hours available | *"4.5h of reviews due, ~3h before Thursday."* |
| 34 | **Optimal session length** | recall runner | ○ | Where accuracy falls off within a session | *"Your recall drops after about 35 minutes."* |
| 35 | **Effort-to-outcome** | Planning/Grades | ○ | Hours per class vs grade earned | *"Most hours went to PHYS; it's your lowest grade. Usually a method problem, not an effort one."* |
| 36 | **Lecture-lab lag** | Daily/class page | ○ | Lab and lecture out of sync | *"Lab is covering material lecture taught 2 weeks ago."* |
| 37 | **Assignment-to-topic linkage** | Daily/Assignments | ○ | Study the right units before the deadline | *"Problem set 6 covers Units 5–6, both currently Weak. Due Friday."* |
| 38 | **Grade-trajectory warning** | Planning/Grades | ○ | Trend projected forward while the W deadline is open | Sparkline + *"Trending toward a C+ if the pattern holds."* |
| 39 | **Concept-map gaps** | Daily/class page | ◑ | Topics with no links at all | *"7 topics aren't connected to anything. Isolated knowledge is fragile."* |
| 40 | **Question-quality nudge** | Daily/class page | ◑ | Your saved questions are all lookups | *"Your questions are mostly 'what is X'. Try 'why does X happen when Y', that's the difference between memorising and understanding."* |
| 41 | **Post-exam decay check** | Daily/class page | ○ | Two weeks later, did you keep it? | *"Two weeks after Exam 1, tested material sits around 45%. Did you learn it or rent it?"* |
| 42 | **Syllabus change detection** | Daily/class page | ◑ | A newer syllabus differs | *"Your syllabus changed: Exam 2 moved to Oct 21, Unit 8 dropped from scope. Review changes →"* |
| 43 | **Term retrospective** | Planning/Grades | ◑ | The one backward-looking surface | End of term: what worked, which methods correlated with your best outcomes, what to carry forward |

---

## Wave 5 · Grade ledger & mistakes (#44–50)

*Needs §6.8 and `AcademicMistake`. All deterministic and cheap once those exist.*

| # | Feature | Surface | AI | What it does | What you see |
|---|---|---|---|---|---|
| 44 | **Regrade window** | Daily/Assignments | ○ | Dispute deadline on returned work | *"Problem set 4 returned Oct 8. Regrade requests close Oct 15."* |
| 45 | **Mathematically irrelevant** | Daily/Assignments | ○ | This can't change your letter grade | On the assignment: grey chip *"Can't change your grade"* |
| 46 | **Highest leverage** | Planning/Grades | ○ | The single item that moves your grade most | *"Of what's left, the final moves your grade most, 30% and unlocked."* |
| 47 | **Mistake-cause profile** | Planning/Grades | ◑ | Your errors by cause, per class | *"Half your CHEM losses are misreads, not knowledge."* A completely different fix from more studying |
| 48 | **Blanking vs not-knowing** | Planning/Grades | ◑ | The most actionable cut in the taxonomy | *"9 of 14 were 'knew it but blanked', that's retrieval practice, not content review."* |
| 49 | **Professor-model insight** | Daily/class page | ◑ | Patterns from your own graded work | *"Dr. Elamin's exams tracked lecture over textbook in 3 of 3."* Sample size always shown |
| 50 | **Policy-aware projection** | Planning/Grades | ○ | Applies drop-lowest, replacement, curve, and says which | *"Projecting B+, applying drop-lowest quiz and the stated 3% curve."* |

---

## Wave 6 · Lifecycle, attention, trust (#51–56)

*Where trackers live or die. Not glamorous; decides whether anyone is still using the app in week six.*

| # | Feature | Surface | AI | What it does | What you see |
|---|---|---|---|---|---|
| 51 | **Amnesty on return** ⭐ | shell | ○ | **Shell-owned since Aug 2026**, `00-product-shell.md` §7.10 | The shell detects the 10-day gap and enforces no-count / no-streak / one bulk-clear. **Academics supplies at most three facts**: which courses went quiet (never a due count), and any external date that moved into range. Nothing about pacing |
| 52 | **Forecast accuracy ledger** ⭐ | Planning/Grades | ○ | The app scores its own predictions | *"When HQ calls a topic solid, you've recalled it 8 of 10 times. When it says shaky, you blank about half the time."* Suppressed entirely below the accuracy gate |
| 53 | **Dormancy notices** | none | ○ | Features with no data say what they need | *"Needs two more reviews before this means anything."* Never a zero, never an empty chart |
| 54 | **Nudge auction** | none | ○ | Enforces the 3-per-week cap | Invisible. Its effect is that HQ rarely interrupts, and when it does it matters. Losers roll into #31 |
| 55 | **Term rollover ritual** | Planning/Tracker | ○ | December: sort every topic's fate | One pre-sorted screen: retire / carry for MCAT / carry as prereq, bulk actions, plus one-tap **Pause everything** |
| 56 | **Shareable syllabus parse** | Daily/class page | ○ | One upload serves a whole section | *"Someone in your section shared a parse of this syllabus. Import?"* Structure only, **never the document, never anyone's grades** |

---

## Wave 7 · Class types & instrumentation (#57–60)

*#57–59 are Writing-type only (§4.1-N).*

| # | Feature | Surface | AI | What it does | What you see |
|---|---|---|---|---|---|
| 57 | **Draft-stage tracking** | Daily/class page | ○ | Your own target tracked separately from the professor's | Rail: outline ✓ → **draft** → revision → submitted, with *"Your draft deadline was Oct 28. The professor's is Nov 3."* |
| 58 | **Reading debt** | Daily/class page | ○ | Behind on assigned readings | *"3 readings behind going into Thursday's discussion."* **Suppressed entirely without a complete reading list** |
| 59 | **Recurring feedback themes** ⭐ | Daily/class page | ◐ | The same criticism across papers | *"Thesis placement, flagged on 3 papers,"* with the professor's actual quotes. You'd never assemble this yourself |
| 60 | **Usage instrumentation** | none | ○ | For the builder, not the user | Nothing visible. Records opened/dismissed/acted-on **locally**, exportable, no off-device telemetry. **Build day one or never** |

---

## Wave 8 · External data (#61–63)

| # | Feature | Surface | AI | What it does | What you see |
|---|---|---|---|---|---|
| 61 | **Canvas sync** ⭐ | Daily/Assignments | ○ | Assignments, grades, announcements pulled read-only | Deadlines and grades already populated on day one. Announcements in the bell's **Class** stream. **Path A (calendar feed) first, Path B (API) only for grades** |
| 62 | **Course grade distributions** | Planning/Planner | ○ | What this course actually averages | *"CHEM 251 averages a B−. This instructor's section runs about half a letter lower."* **Research task first**, confirm availability and licence, or cut |
| 63 | **Registration-day plan** | Planning/Planner | ○ | Ranked backups decided in advance | 7am, one screen: your cart in priority order, conflicts flagged, backups ready. **The one moment a student opens the app unprompted** |

---

## Wave 9 · MCAT decay & the AMCAS record (#64–68)

*#64 is the strongest feature in the tab. #65–67 are unglamorous and prevent a real disaster.*

| # | Feature | Surface | AI | What it does | What you see |
|---|---|---|---|---|---|
| 64 | **MCAT decay mapping** ⭐⭐ | Planning/Planner | ◑ | #21 re-pointed at your MCAT date | Ranked list: *"PSYC 101, taken 2.5 years before your test date, ~65% of Psych/Soc, expect substantial relearning."* Also in the Planner, where it changes when you take biochem. **Ranked, never scored**, no invented retention percentages |
| 65 | **Transcript-fidelity export** ⭐ | Planning/Grades | ○ | AMCAS Coursework generated from fields captured at enrollment | Add a class → it quietly stores the exact transcript number, title, credits, grade. Three years later: *"Export AMCAS coursework."* **The capture is the feature; the export is a bonus** |
| 66 | **Dual GPA, always paired** | Planning/Grades | ○ | UNC and AMCAS side by side | *"UNC 3.71 · AMCAS 3.66, every attempt counts, all institutions included, truncated not rounded."* Prevents the May-of-application-year discovery |
| 67 | **Grade trend by year** | Planning/Grades | ○ | AMCAS reports by year; adcoms read trajectory | Four bars, one per academic year, with the trend line. A rough freshman fall inside a rising trend reads differently from a flat 3.4 |
| 68 | **MCAT content coverage map, extended** | Planning/Tracker | ◑ | Coursework mapped onto AAMC categories | *"Sociology, 30% of Psych/Soc, no coursework. Self-study list."* Known years ahead instead of discovered during prep |

---

## Totals

**68 features.** By AI dependency:

| | Count | Which |
|---|---|---|
| ○ deterministic and sufficient | 55 | The grade ledger, FSRS scheduling, every projection and threshold |
| ◑ **better with AI** | 11 | #8 · #21 · #39 · #40 · #42 · #43 · #47 · #48 · #49 · #64 · #68 |
| ◐ degrades gracefully | 1 | #59 recurring feedback themes |
| ● requires an LLM | 1 | **#22 cross-class overlap** |

**Still only one hard dependency**, but the re-audit (Aug 2026) found **eleven** features whose deterministic version is the crude one. The pattern is consistent: **anything that has to compare the MEANING of two things** rather than match identifiers. #49 compares exam content to lecture content. #64 and #68 map coursework onto AAMC categories. #21 links topics across courses. #40 parses question structure. These ship deterministic and get materially better later, which is what ◑ is for.

By surface, the load sits on **Planning/Grades** (17) and **Daily/class page** (17). Both are the deep-detail surfaces of their mode, so the distribution is expected rather than a warning sign.

---

## Cross-cutting dependencies

| If this doesn't exist | These don't work |
|---|---|
| **Syllabus ingestion (§4.1-M)** | 13, 14, 18, 19, 32, 36, 37, 42, 44, 45, 46, 50, 56, 58, **plus exam scope and the grade ledger** |
| **Canvas (§4.1-O)** | nothing breaks, but 18, 38, 44, 45, 46 and the ledger require manual entry without it |
| **`AcademicMistake` + §6.8** | 44–50 |
| **`TopicLink`** | 21, 22, 39 |
| **AI layer (§6.3)** | 22 only |
| **AAMC content weights** | 10, 64, 68 |

**The keystone remains §4.1-M.** Fourteen features plus two subsystems depend on it.
