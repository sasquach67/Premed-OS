# Academics

**Status:** Designed — approved for implementation (core decisions locked July 2026). Intelligence list is intentionally extensible.
**Sidebar group:** Foundation · **Spec type:** domain tab
**Repo:** `sasquach67/Premed-HQ` — `src/pages/Academics.tsx` (917L), `src/components/academics/ClassCenter.tsx` (1890L), `src/components/common/AssignmentsPanel.tsx`
**Depends on:** `specifications/00-product-shell.md`, `specifications/01-shared-interface-patterns.md`, `specifications/03-overview.md`, `architecture/04-admissions-framework.md`, `general.md`

---

## 0. Scope decision (locked)

**Premed HQ is UNC-only.** Users differ by *path and timeline* (grad year, cycle, traditional vs. gap year), not by institution. The Requirements's UNC-specific requirements, programs, and term plans are therefore correct as-is — do **not** generalize to other institutions.

---

## 1. Purpose

Academics is the bedrock: it produces the **AMCAS GPA** (the number that feeds Overview, Profile/CV, School List, and every readiness signal), tracks coursework day-to-day, and keeps the student on pace through UNC + med-prereq requirements. It must be both a precise transcript/GPA engine and a usable daily academic workspace.

## 2. Ownership (from shell §2.2)

- **Owns (canonical create/edit/archive):** Courses (the canonical academic record), the ClassWorkspace extension, class assignments, class notes/materials, GPA calculations, requirement audit results.
- **References only:** Tasks (a course/assignment can spawn one), files, roadmap milestones (prereq sequencing feeds them).

---

## 3. Data model (the key fix)

### 3.1 The problem being fixed

Today, a real class exists as **two disconnected records**: a `Course` (ledger: `code`, `credits`, `grade`, `bcpm`, `term`, `satisfies`, `prereqOf`) and a `ClassCenterClass` (workspace: `courseCode`, `instructor`, meeting info, `syllabusUrl`/`canvasUrl`/`driveFolderUrl`/`goodNotesUrl`, etc.). They share only a `courseCode` string — **no linking ID**. So CHEM 241 lives twice; editing one never updates the other, and a Class Center class doesn't count toward GPA. This violates single-source-of-truth (`01`).

### 3.2 Target model (locked)

**Canonical `Course` + linked `ClassWorkspace` extension.**

- **`Course`** stays the clean academic record (code, title, credits, grade, `bcpm`, term, status, `inResidence`, `satisfies[]`, `prereqOf`, notes). Exists for every course ever — past, AP/transfer, planned. This is what GPA, requirements, and the ledger read.
- **`ClassWorkspace`** holds the operational layer (instructor, meeting days/time, location, color/icon, syllabus/Canvas/Drive/GoodNotes/Anki links, current topic, materials). Linked **1:1 by `courseId`**, and exists **only for current/active-term courses** — so the GPA ledger stays lean and past/AP courses carry no operational clutter.
- **`ClassWorkspace.type`** — `'stem' | 'writing' | 'general'` (§4.1-N). **Exactly three. A five-value union and a per-feature toggle set were both rejected** — do not widen. Required; defaults to a **suggestion** derived from the parsed syllabus (falling back to course code, then user history), never silently applied. **Determines which features render, never what the course counts for** — GPA, BCPM, credits, and requirement satisfaction read `Course` and are type-blind by construction. Type changes are non-destructive: dormant data is hidden, never deleted, and restores intact on switch-back.
- **Assignments** (`ClassAssignment`) link to the **course** (via `courseId`), not a separate class record. One assignment dataset.
- **Migration:** existing `ClassCenterClass` records reconcile to their matching `Course` by `courseCode`+`term` (create the `Course` if missing, then attach the workspace); surface unmatched ones in a review step (`general.md` import reconciliation). Do not silently drop data.

Result: Class Center, Planner, Assignments, and the Tracker all become **stateless views of one course set** (`01` "views are projections"). Change a grade anywhere → GPA, requirements, Overview all update.

### 3.3 Study-hub entities (Class Center)

- **`Topic`** — a unit within a class (e.g., "Unit 1: Alkanes"), owned by a course. The **unit of review**. Fields: title, order, review status (Not Started / Seen / Notes Made / Reviewing / Weak / Ready), linked files, notes, optional Anki deck **link** (a bookmark only — see §4.1 decoupling), and **FSRS scheduling fields** (stability, difficulty, retrievability, due date, last-reviewed). **Every topic is HQ-scheduled — there is no `scheduler` field and no Anki-owned topics.** Cards under a topic are optional/later (finer granularity).
> **Legacy status migration (locked):** `mastered → Ready`; **`cards-made → Notes Made`** (not Reviewing — producing cards is a *preparation* act, not evidence of recall). **A migration must never inflate apparent progress**; under-calling is corrected upward by the first review, over-calling silently hides a gap.

- **`KeyPoint`** — a cached, structured recall target extracted per topic from its sources ("the 8–12 things you must be able to recall for Unit 5"). Fields: text, `topicId`, source chunk refs, `timesSurfaced`, `lastSurfaced`. The gap check compares your response against these, so coverage is consistent between sessions.
- **`AcademicMistake`** (owned — **added July 2026; this was a real gap**) — every wrong answer, logged once, on homework, quizzes and exams. Fields: `id`, `courseId`, `topicId?`, `sourceKind` (`homework | quiz | exam | practice | mock`), `capturedAt`, `questionText?`/image, `yourAnswer`, `correctAnswer`, and **`cause`** — the locked taxonomy:
  `didnt-know` · `knew-it-but-blanked` · `misread-the-question` · `arithmetic` · `ran-out-of-time` · `wrong-method`.
  **These have completely different fixes**, and lumping them together is exactly why "reviewing your mistakes" teaches nothing: a blank needs retrieval practice, a misread needs slowing down, arithmetic needs no studying at all. This is what strong students already keep in a notebook, so it **passes the friction rule** (§6.7) by replacing an existing habit rather than adding one. Feeds exam autopsy (#17) with far better signal than topic-level weak flags, and mirrors the MCAT `Mistake` shape (`02-mcat.md` §2b) — **reuse it, don't fork it.**
- **`ProfessorModel`** (owned, derived — **added July 2026**) — built from *your own graded work in their course*, never rumour: `personId` (the instructor), `courseId`, and observed tendencies — lecture-vs-textbook emphasis, application-vs-recall balance, question format mix, partial-credit generosity, how closely the stated exam scope matched reality. **Only meaningful in the second half of a term**; must display its sample size and stay silent below it. This is the thing students currently learn by rumour and would rather learn from evidence.
- **`TopicLink`** (owned, §6.6 Connect) — an explicit relation the student authors between two topics: `fromTopicId`, `toTopicId`, `relation` (`builds-on | contrasts-with | same-mechanism | prerequisite | shared-mcat-category`), `note`, `createdAt`. Turns the topic set into a graph rather than a list; feeds the concept-map candidate and gives the gap report cross-topic context.
- **`PreLectureAct`** (owned, §6.6) — `topicId`, `kind` (`prime | pretest | predict`), `promptedAt`, `response`, `revisitedAt?`. **Never** carries a score or affects FSRS/weak state — these are preparation acts, not assessments.
- **`SourceChunk`** — an indexed slice of a `File` with `courseId`, assigned `topicId`, embedding, and `coveredByKeyPoint` flag. The **coverage ledger** (§6.4) is built on these.
- **`File`** — supports **both uploaded blobs (stored in HQ) and embedded/linked external docs** (Drive, GoodNotes, Canvas, PDF). Fields: source type (upload | link | embed), url/blob ref, kind (syllabus, slides, study guide, resource, exam, notes), linked course/topic. Storage lands in the service-foundation phase (Supabase storage exists in-stack).
- **`Flashcard`** (generated) — Claude-generated from materials; front/back + cloze; **tagged and exported as an Anki-import text file** (tab-separated, tags column). **NOT reviewed in HQ** — see `tabs/02-mcat.md` §5h: HQ has no flashcard review mechanism in either tab. Generate → tag → export → Anki owns it from there. No Anki API dependency.

**Writing-type entities (§4.1-N — added July 2026).** These exist only for `type: 'writing'` classes and are the substitute for the memory layer, not an addition to it:

- **`PaperDraft`** — `assignmentId`, `stage` (`outline | draft | revision | submitted`), `selfDeadline?`, `completedAt?`, optional file link. The real deadline lives on the `ClassAssignment`; the self-imposed one lives here, so missing your own target never reads as missing the professor's.
- **`AssignedReading`** — `courseId`, `week`, `title`, `source?`, `status` (`not-started | skimmed | read`), `dueForDiscussion?`. Extracted by syllabus ingestion (§4.1-M) where the syllabus lists readings by week.
- **`FeedbackNote`** — `assignmentId`, `theme`, `quote?`, `createdAt`. Recurring themes across papers are the whole point (*"thesis placement flagged on three papers"*); a single note in isolation is not surfaced.

**Do not reuse `Topic` or FSRS fields for any of these.** Readings and drafts are not reviewed on a schedule, and modelling them as topics would silently pull Writing classes back into the memory machine.

---

## 4. Structure — two modes, each with its own tab set (locked)

> **Concept mockup:** `specifications/mockups/01-academics/academics-mode-switch.html` — an openable, clickable prototype of the Daily/Planning switch.

Academics is organized by a **mode switch** (a segmented pill at the top: **Daily · Planning**) rather than one flat 5-tab bar. The mode switch is the *only* primary nav layer; selecting a mode **swaps the entire tab bar** to that mode's tabs, so the user never sees two tab levels at once. All five existing tabs are preserved — just grouped under the two mental modes. This also resolves the "Trajectory is a lot" concern: each mode gets the full screen, so Planning's density is fine.

### Daily mode — this-semester operational work

1. **Class Center** — operational workspace for *current-term* courses: class cards, per-class workspace (materials, topics, that class's assignments, links), the "across your classes" strip. Reads courses where a `ClassWorkspace` exists.
2. **Assignments** — cross-course calendar + deadline list (`AssignmentsPanel`). The aggregate view of the same assignment dataset Class Center shows per-class. **Owns assignments; they are excluded from Home's to-do widget** (`03-overview` §6.4) but their *deadlines* may surface in the attention bell.

### Planning mode — the long game

> **SUPERSEDED — see §4.2, which re-scoped these by job (July 2026).** The three Planning tabs are **Planner · Requirements · Grades & Archive**. The old "Planner & GPA / Requirements / Archive" split cut across jobs — *what to take next term* sat in the Tracker while term-building sat in the Planner, and Archive was a thin destination that is really a filter on the ledger.

3. **Planner** — *what do I take next term?* Build future terms with requirement coverage and GPA projection live beside you (§4.2-C).
4. **Requirements** — *what's left, and am I on pace?* The requirement audit; course library; AP-credit and custom-course entry.
5. **Grades & Archive** — *what have I earned?* Full ledger, cumulative/term/**AMCAS BCPM**, What-if, plus withdrawn/completed/superseded **as a filter, not a separate destination**.

### Mode-switch behavior

#### Navigation chrome — three levels, three forms (LOCKED)

Academics stacks three levels of chrome. They must **not** all be pill rows — see the global rule in `specifications/01-shared-interface-patterns.md` §4b-i. Visual reference: `specifications/mockups/_shared/nav-hierarchy-3-levels.html`.

| Level | Element | Form | Placement |
|---|---|---|---|
| 1 | **Daily · Planning** mode | `ModeSwitch` — segmented pill, **frosted glass** (floats over banner art), white active thumb, icons | on the **banner**, under the title |
| 2 | **Tabs** (mode's own set) | **Underline tabs** — no container/track; label + count `Badge`; **Carolina-blue `--cat-gpa` underline** on active | along the **banner's lower edge** |
| 3 | **Term · search · view** | `Select` (term) + search `Input` + result count + `Toggle Group` (cards/list) | **filter bar** on the solid page, under the banner |

- The old build rendered mode, tabs, **and** the term picker (`Fall 2026 / Spring 2027 / All / Archived`) as three near-identical pill groups — replaced. **The term picker becomes a `Select` dropdown**, not a pill row (it must scale past 6+ terms), and it sits in the filter bar with search, not in the nav stack.
- Only the **active mode's** tabs render — Daily shows 2 (Class Center · Assignments), Planning shows 3 (Planner & GPA · Requirements · Archive). The old flat 5-tab bar is gone.
- Glass judgment (`04` §0c): the mode pill is glass **because it floats over banner imagery**; underline tabs, the filter bar, and every control below are **solid-with-depth, no blur**.

- Segmented control (`ModeSwitch`), iOS-Focus-like; default mode is **Daily**. Persist the last-used mode per user (shell-owned setting).
- Deep links preserve mode + tab (e.g. `/academics?mode=planning&tab=tracker`); the existing `?tab=` param extends with `?mode=`.
- Keyboard: the mode switch is focusable; arrow keys move between the two modes; tab set updates on change.
- Reusable pattern candidate: MCAT has the same operational-vs-strategic split, so the mode switch should be specced once in `specifications/01-shared-interface-patterns.md` and reused. (Confirm MCAT adoption when that tab is designed.)

> **Concept mockups:** `specifications/mockups/01-academics/academics-mode-switch.html` (Daily/Planning switch) and `specifications/mockups/01-academics/class-center-study-hub.html` (the per-class hub below). These show **functionality and flow only** — the visual design defers to `architecture/01-global-design-system.md` and the app's existing design language. Treat as direction, not pixel/visual law; implementation may reinterpret layout to match the design system.

### 4.0 Daily mode — main page layout (APPROVED July 2026)

> **▶ APPROVED VISUAL REFERENCE — open before building:** `specifications/mockups/01-academics/academics-daily-main-page.html`
> Companion refs: `mockups/_shared/nav-hierarchy-3-levels.html` (nav rule) · `mockups/03-overview/overview-bento-control-panel.html` (design language).
> The mockup is law for **layout, density, hierarchy**; this spec is law for **behavior and data**. Do not copy its markup — rebuild from §7a components.

The Class Center tab is a **bento control panel** (mixed-size panels, per `03-overview` §5), not a stack of equal rows.

| Panel | Span | Contents |
|---|---|---|
| **Heads up** | 12 | Academics smart features (§6) — **the same component as Overview's Smart next actions**: card + explain-line + act/dismiss, dismissal → `06` suppression, whole-widget unmount when the last is dismissed. Placed **above** the classes so intelligence leads. |
| **Your classes** | 12 | Class cards (below). Wraps to further rows past 5. |
| **Today's review queue** | 7 | FSRS-due topics, interleaved cross-class, each with a **why-due explainer** and retrievability meter. **Every topic is HQ-scheduled — no Anki-owned topics, no sync chip** (§4.1, fully decoupled). |
| **Where you're weak** | 5 | **Exam-scoped by default** (below). |
| **Up next** | 7 | Dynamic "biggest thing on your plate" (below). |
| **GPA** | 5 | Term-projected / cumulative / science + trend chart with **dashed projection** + per-class **contribution bars** (dragging ← → lifting) + one pace line. |
| **Upcoming** | 4 | Important dated items only — exams, presentations, major deliverables; starred/important float to top. Not a generic due list. |
| **Mastery trend** | 4 | Topics-ready over time, actual line + **dashed projection**, "42 of 65 ready · +7 this week". |
| **Consistency** | 4 | Reviews-per-day contribution grid (7-wide, week rows) + streak. Labeled **"reviews per day — not mastery"**. **No pace line** (per `01` §4d restraint). |

**Banner** follows `01` §4b-ii: title **"Academics"** only (no group crumb, no subtitle line), a glass strip of **variable** stats (term GPA ▼ · cumulative ▲ · due today · day streak — *never* credit count or class count), and a **"How to study"** ghost button (the §4.1-F always-open guide entry point).

**Removed / do not reintroduce:** a cross-class "study tools" panel (tools have no subject without a class — §4.0b); a floating "quick capture" panel (syllabus import lives in add-class + the hub; "covered in lecture" lives on the card); an MCAT content-coverage panel on this page; a generic "Due soon" list (superseded by Upcoming + per-card deadlines).

### 4.0-e Contacts panel (added July 2026)

A **Contacts** panel on the Class Center bento: professors, TAs, study groups, and the pre-health advisor for the current term. Each row: avatar, name, `class · role · location`, a status chip where relevant (`Office hrs Tue 2–4`, `Potential letter`, `Letter requested`, `Meet before Nov`), and a one-tap email action.

- These are the **shared canonical `Person` records** (`general.md`) — never re-entered per class. A TA tagged "potential letter" here appears in **Letters** without duplication; contacts also feed **Profile/CV**.
- The class page's Overview repeats only *that class's* contacts (professor, TA, study group).

### 4.0a Class cards (APPROVED)

Follows the global interactive-card pattern (`01` §4e).

- **Rest:** neutral border, **no accent bar**; class identity = a small colored dot beside the code. **Hover:** left bar ignites in the class accent, border + glow turn accent, card lifts, and the deadline line swaps to **"Open class hub →"**. No corner ↗ badge. Hovering the Review button leaves the card **unlit**.
- **Contents:** code + full name · letter grade **and** exact percent · status chips (`3 weak`, `BCPM`) · **one line** — *"8 of 18 topics ready"* with a single progress bar · next deadline. **No `Anki` chip** — Anki owns cards, not topics (§4.1).
- **Deliberately excluded:** instructor, meeting days/time, room, credit count — clutter at this zoom. They live in the class hub's Class Info section.
- **Actions:** **one primary (`▶ Review`)** + **overflow `⋯`**, divider-separated. Overflow holds Quiz me, Covered in lecture today, Generate study guide, Materials, Notes, Class settings. Right-click gives the same set (`01` §4c).
- Cards **wrap** to additional rows; they never scroll horizontally.

### 4.0b Study tools are per-class, never page-level (LOCKED)

Study tools (§6.2) **generate from a specific class's materials**, so a page-level tool panel with no class selected has no subject and is a defect. Placement: **class card overflow** (the frequent few) and the **class hub** (the full set). Cross-class tooling is limited to the review queue's own controls (Start, Plan 90 min) — which are session planners, not content generators.

### 4.0c "Where you're weak" — exam-scoped (LOCKED)

Organized by **topic, not by class** — a class isn't actionable, a topic is; class is a grouping key.

- **Default view: "Next exam."** Topics filtered to the next exam's **unit scope**. Deterministic: `Topic` carries a unit/order, an exam (assignment of type exam) carries a unit range from syllabus import (§4.1-G), so scope = topics whose unit falls in that range. Header shows countdown + course + unit range + "N topics in scope"; footer shows "*4 of 9 exam-ready*".
- **Second view: "All topics"** — same topics **grouped under collapsible class headers** with per-class counts (`6 weak · 8/18 ready`), sorted weakest-first. Cap the list at genuinely weak topics; never render all topics as a wall.
- A toggle switches views; an **info affordance (eye icon → `InfoTip`)** explains the scoping.
- Rows: topic name · unit tag · strength bar · retrievability %.
- If no exam is scheduled, the panel opens on **All topics** and the toggle's exam option is disabled with a reason.

### 4.0d "Up next" — dynamic next-thing widget (LOCKED)

Replaces a fixed "next exam" card. Surfaces **the single highest-stakes upcoming item** of any type — exam, presentation, paper, project deliverable — ranked by weight × proximity × unreadiness.

- Shows: countdown · title · when/where · **why it matters** (e.g. "worth 25% of your grade") · a **readiness meter** with a **projection marker** showing where the user lands versus the deadline · the remaining weak items · one **pace line**.
- Primary action is **type-appropriate and routes to the owner**: exam → "Build exam plan"; presentation/paper → "Build a plan" → that record's page.
- A secondary chip row shows the next 2–3 items with status (`on pace` / `not started`).
- Empty state: hides entirely when nothing dated is pending.

### 4.1 Class Center (Daily) — per-class coworking study hub

Class Center is **not** just a class list — it's a per-class study hub built around **active recall and spaced repetition**, where everything for a class is centralized and Claude helps you review. Opening a class uses the **center peek → expand** pattern (`01` §2); this also fixes the current "messed-up format." Each class hub has:

**A. Materials (the coworking layer).** Centralize everything per class: syllabus, exam dates, study guides, slides, resources, notes. **Upload files into HQ + embed viewers (Drive/GoodNotes/PDF) + link external (Canvas).** Bulk-import a folder of Canvas files and auto-file them. Read docs inline (embedded), not just linked — the "move everything from Canvas into HQ" vision.

**B. Topics (the revision tracker).** The class breaks into `Topic`s, each with a status (Not Started → Seen → Notes Made → Reviewing → Weak → Ready) and **FSRS scheduling via `ts-fsrs`** — the exact algorithm Anki uses, run natively in-app (works everywhere, no Anki-desktop dependency, nothing built from scratch). Topic is the review unit; cards optional later. A cross-class **"today's review queue"** surfaces what FSRS says is due (like the MCAT study queue, for classes).

**C. Study & recall tools (Claude-powered).** See §6.2.

**D. Assignments** — this class's assignments (linked to the course; also shown in the Assignments tab).

**E. Class info** — instructor, meeting times, exam dates, deck/resource links.

**F. Learn how to study (the education layer).** A core purpose of the Academics section is teaching students *how to learn*, not just tracking. The evidence-based study loop (active recall → spaced review) must feel obvious to someone who's never heard of FSRS. Woven in three ways:

- **First-run walkthrough** — a short guided tour (mascot, ~4 steps) that teaches the loop and points at the real UI ("this is your review queue — do these first"). Not an essay; dismissible; persisted per user.
- **Just-in-time micro-lessons** — the first time a topic goes due, a one-liner explains *why* ("FSRS predicts you're about to forget this — recall it now"). The mechanism teaches itself through use.
- **Always-open "How to study" guide** — revisitable, evidence-based (active recall, spacing, interleaving, elaboration), living in the Academics section; ties to the existing Ultimate Guide.
- **Explainable scheduling (transparency)** — every "due" decision states its reason ("last recall 4 days ago, retrievability ~87%"), per `architecture/02` explainability. Learning the science by using it.
- Related: **confidence-rating before reveal** (teaches calibration — the gap between "I know this" and knowing it).

**Anki relationship — FULLY DECOUPLED (locked, July 2026).** The earlier "one scheduler per topic" model (`scheduler: 'hq' | 'anki'`, sync chips, "reviewed in Anki", AnkiConnect reconciliation) is **removed.** It created conflict where none exists.

**They test different grain, so they never compete:**
- **Anki owns cards** — atomic facts, its own scheduling, its own daily limits and buried siblings. HQ never reads, mirrors, or fights any of it.
- **HQ owns topics** — conceptual recall (explain it, get gapped). **Every topic is FSRS-scheduled by HQ, always**, including topics you also have cards for.
- **No schedule sync, ever.** Nothing to reconcile; no "HQ says review but Anki says otherwise," because they were never scheduling the same unit.

**Why not sync anyway:** universal sync is impossible. AnkiConnect is a desktop add-on requiring Anki to be running; AnkiWeb has no public API; AnkiDroid's is Android-only. Any sync design would work for a minority of users.

**The one relationship that stays — card generation (one direction):**
- **Default, everyone, zero dependencies:** HQ generates flashcards from the class's materials → **TSV / `.apkg` export** → user imports to Anki.
- **Optional power-user path:** if **AnkiConnect** is detected on `localhost:8765`, show a **"Send to Anki"** button with a deck picker — replacing download-and-import with one click. Requires the add-on (code `2055492159`) and adding HQ's origin to its `webCorsOriginList`; surface a short **opt-in tutorial at the moment the user first wants to push cards**, never as onboarding. If AnkiConnect isn't present the button simply never appears — no error, no nag.
- **Nothing else crosses.** No due counts, no review history, no scheduling data.
- A topic may store an Anki deck name as a **plain link** ("open deck") — a bookmark, not a data channel.

### 4.1-G Class Center — confirmed functionality (consolidated)

Grouped by workflow (all confirmed; list stays extensible):

- **Setup / capture (reduce friction):** **Syllabus import → auto-populate** (drop the syllabus PDF; Claude/Atlas extracts topics, exam dates, and grade weights and fills the class — the biggest adoption unlock); **bulk Canvas import** (drop a folder, auto-file per class); **fast lecture capture** (one tap "covered Unit 4 today" → marks the topic Seen and starts its FSRS clock — the habit that keeps the tracker current).
- **Review engine:** FSRS topics + statuses; cross-class **today's review queue**; **why-due explainers**; **flashcard generation → tagged Anki export, one-directional, never reviewed in HQ** (§4.1 · `02` §5h); **mastery / weakness view** (retrievability heatmap across a class's topics, with Atlas resource suggestions for weak ones).
- **Study tools (Claude-powered):** see §6.2 (study guide, quiz me, summarize/explain, active recall, free-recall/blurting, Feynman, auto-flashcards→Anki, FSRS session planner).
- **Notes & materials:** **per-topic notes** (makes "Notes made" real; notes sit next to material + recall prompts); materials upload + embed + link (§4.1-A).
- **Exam loop:** **exam-prep countdown plan** ("review these before Friday" from due + weak topics); **grade calculator** ("what do I need on the final" from syllabus weights + current grades); **post-exam reflection loop** (log grade + missed topics → auto-flag Weak + feed a per-class mistake review — closes study→outcome→adjust).
- **Effort:** **study timer + consistency** (focus timer tied to a topic, logs study time, subtle streak — not over-gamified, per `00-vision` non-goals).
- **Education:** the learn-how-to-study layer (§4.1-F).

---

### 4.1-S Anki export — card types from class material (added July 2026)

Follows the **global export rule** (`01-shared-interface-patterns.md` §4g): **`.apkg` always**, no custom styling, native note types only, `HQ::` tags, deck-targeted so existing decks are never touched.

**Academics generates all three note types**, chosen by what the material is:

| Type | Used for | Source |
|---|---|---|
| **Basic** | term/definition, "what does X do", cause→effect | notes, topics |
| **Cloze** | sequences, pathways, lists, facts that need context — the default for most science coursework | notes, topics, study guides |
| **Image Occlusion** | anything where **location is the fact** — anatomy, orgo mechanisms, biochem pathways, labelled diagrams, histology | **uploaded class materials** (slides, lab handouts, textbook figures) |

- ⭐ **Image Occlusion from lecture slides is the highest-value generation in Academics** — it's the card type students most often skip making by hand, and HQ has the slide already.
- **HQ proposes the type, never silently decides.** Default per material kind, always changeable before export.
- **Requires Anki 23.10+** for Image Occlusion (built-in since then); HQ states the minimum version and flags packages containing IO notes (`01` §4g).
- **Decks:** `Academics::{COURSE CODE}` for material cards, `Academics Mistakes::{COURSE CODE}` for cards generated from misses. Root names are settings.
- **Unchanged:** no flashcard review inside HQ (`02-mcat` §5h). `ts-fsrs` still schedules **topics**, which are not flashcards.

---

### 4.1-H Assignments (Daily) — the deadline surface (APPROVED July 2026)

> **▶ APPROVED VISUAL REFERENCE:** `specifications/mockups/01-academics/academics-assignments.html`

#### Scope rule (LOCKED)

**Anything tied to a class lives here. Anything not tied to a class lives in Overview → Tasks.**

- **Here:** assignments, exams, quizzes, labs, presentations, papers, projects — **a `courseId` is required**.
- **Not here:** advisor meetings, scholarship deadlines, research symposia, personal errands → **Overview → Tasks** (`03-overview` §6.4).
- One rule, no overlap, nothing lost. This also preserves the existing boundary: assignments are **excluded from Home's task widget**, though their *deadlines* still reach the attention bell (§4 Daily mode, `03-overview` §6.4).

#### Why not a table (locked)

The original design was a Notion-style table. A table is optimized for **comparing and editing many records across many fields**; assignments are **time-anchored commitments** where the dominant question is *"what's coming and how bad is it."* A table answers that poorly — urgency isn't visible, and the user must read and mentally sort every date. **The table is kept but demoted** to an overflow action (below), where its real strengths live.

#### Views — three in the switcher

A `Toggle Group` in the level-3 filter bar (`01` §4b-i). **Agenda is the default.**

| View | Shape | Answers |
|---|---|---|
| **Agenda** *(default)* | Cards in **time buckets** — Overdue → This week → Next week → Later → Completed | "what's coming and how bad" — position encodes urgency, no date-reading required |
| **Weekly** | Seven day-columns; each day carries a plain-language **load badge** (Free / Light / Busy / Heavy); cards drag between days to reschedule | "how is my week shaped" |
| **Calendar** | Month grid + **detail rail**; heavy days carry a subtle tint | "what's coming further out" — a *navigation* view (cells truncate at 2–3 chips), which is why it pairs with a rail |

#### Row anatomy

`checkbox · title · class chip · type chip · [readiness, exams only] · weight · due (relative) · exact date`

Due text is **relative and severity-colored** ("3 days late" destructive, "Friday" warning, "in 14 days" neutral). Exams additionally show readiness from the topic model (*"4 of 9 topics ready"*, §4.0c).

#### Add — the page's primary action (locked)

Users must immediately understand this is **where due dates get entered**.

- **Large accent "Add assignment" button in the banner** with a `⌘N` hint — the page's one primary action (`01` §4b-ii).
- **Plus a dashed add-row at the bottom of the list** ("Add an assignment, exam, or important date…") so it's reachable without scrolling back up.
- Both open the same create flow; the class field is required.

#### Volume control (locked)

Assignment lists get overwhelming — three mechanisms, all required:

1. **Buckets are collapsible** (chevron per bucket header, state persisted).
2. **Each bucket caps visible rows** with `+N more →`.
3. **Completed is collapsed by default** behind a count ("6 finished this term — show").

#### Projected workload (bottom panel, not a view)

A separate panel at the **bottom of the page** titled **"Projected workload"** — deliberately *not* in the view switcher, because it answers a different question than the three views.

- One row per week for the next ~6: `week · load badge (Free/Light/Busy/Heavy) · stacked bar segmented by class with inline labels ("CHEM 25%") · total %`.
- Load thresholds: **Light** under 10% · **Busy** 10–30% · **Heavy** over 30% (of course grade due that week). Legend always shown.
- One actionable recommendation beneath: *"Two heavy weeks ahead — this week and finals. Week 4 is free: starting the PSYC presentation then would take 15% off Week 2."*
- Computed from assignment `weight` values (`data-model`); **if weights are missing, show the honest "not enough graded work yet" state — never estimate** (`01` §4d).
- Collapsible; state persisted.

#### Table — demoted to overflow

`TrackerTable` lives in the `⋯` menu as **"Edit as table"** (alongside Import syllabus, Show completed, Export). Full sort / inline edit / bulk select — for entering a syllabus at once or updating grades after they post. **Never the landing view.**

#### Components used

| Feature | Component(s) |
|---|---|
| View switch (Agenda/Weekly/Calendar) | `Toggle Group` in the filter bar |
| Agenda buckets | grouped list + `Collapsible` + `AnimatePresence` (add/remove/complete) |
| Agenda row | `Checkbox` + `Badge` (class · type · weight · due severity) + `Sonner` (undo) |
| Weekly board | `Kanban` + `Reorder` (drag between days) + `Badge` (load) |
| Calendar + rail | `Calendar` + day cells + `Card` rail |
| Projected workload | stacked **Animated Progress Bar** + `Badge` (load) + `Collapsible` + pace line (`01` §4d) |
| Add (primary + inline row) | `Smooth Button` (banner) + dashed inline row → `CreateExperienceDialog`-style form |
| Overflow (Edit as table / Import / Export) | `DropdownMenu` → `TrackerTable` |
| Row right-click | `Context Menu` (`01` §4c) |
| Empty state | **`MascotNote`** empty variant (`01` §4f) |

---

### 4.1-I Per-class study hub (APPROVED July 2026)

> **Mockup:** `specifications/mockups/01-academics/academics-class-hub.html` (APPROVED — layout law).
> The largest view in Academics; every class card on the Class Center page routes into it.

#### Open model — center peek → expand (`01` §2)

- **Peek** (click a class card) = the lean subset: class identity + grade, due-today count, the **top 2 due/weak topics** with `Recall`, **Start review**, and **Open full hub →**. Enough to act without leaving the page.
- **Expand** = the full hub below (deep-linkable). **Split** = hub + its assignment list.

#### Banner (per `01` §4b-ii)

- Back-crumb to Class Center; title = `CHEM 262` + course name; a **compact info line** (`Dr. Elamin · MWF 10:10a · Kenan B12 · BCPM`) — class info is a *line, not a panel*; fixed facts don't earn panel space.
- **Glass stat strip — variable metrics only:** grade · topics ready (`8/18`) · due today · next-exam countdown.
- **One primary action: `Start review`** (opens the review session runner) + `⋯` overflow.

#### Five sub-tabs (revised July 2026 — a semester of content will not fit on one screen)

**Overview · Materials · Topics · Assignments · Notes.** Shared chrome on every tab: breadcrumb to Class Center, class dot + code + name, the **compact info line** (`Dr. Elamin · MWF 10:10a · Kenan B12 · BCPM · office hours, links ⌄`), the glass stat strip (grade · ready · due today · exam countdown), **`Start review`** as the single primary action, and `⋯`.

**A. Overview — master view of *this* class** (distinct from Class Center, which is cross-class):
| Panel | Span | Role |
|---|---|---|
| Status row | 12 | Grade · topics ready · exam countdown · streak · **MCAT-relevant count** · course coverage bar + mapped %. |
| Due today | 4 | This class's due topics + **one** pace line. |
| Exam scope | 4 | See below. |
| Coming up | 4 | Next deadlines with their weights. |
| Recently covered | 5 | Last 3 lectures **and whether you've reviewed them** — plus a warning when a covered unit has never been reviewed. |
| Grade breakdown | 4 | Category averages + **weight-sum validation** ("weights sum to 100% ✓"). |
| Class contacts | 3 | Professor, TA, study group (shared `Person` records). |
| Mastery over the semester | 12 | Topics-ready actual vs projected. |

**B. Materials** — grouped **by week/module** (syllabus gives week → unit). Each module header shows its unit range **and study state** ("2 weak topics", "3 never reviewed"). Three-way **ownership marker on every file: `Course` / `Mine` / `Generated`** — your own notes sit beside the lecture they belong to but are visually distinct. Filters: All / From the course / **My notes** / Generated / Unassigned. Inline reading; bulk Canvas import; the unassigned-files notice explains positional filing (§6.4).

**C. Topics** — grouped into **unit sections in course order**; each unit header carries name, weeks, exam-scope flag, and its own "1 of 3 ready" progress. Rows: name · last-recall recency · retrievability bar · status chip · **MCAT tag** · notes affordance. Filters by state. Fast-capture add row.

**D. Assignments** — grouped by **syllabus category** (Problem sets 15% · Labs 20% · Exams 35+30%), because that is how the grade is computed. Each category header shows weight, completion, and **your average in that category**. Footer validates weights sum to 100% and states what share of the grade is in. Contains **grades** and the **what-if calculator** (§6.5).

**E. Notes** — see the notes-about/notes-on split below.

#### Exam scope — how it's built (must be explained on screen)

Segmented bar + **labeled legend** (`Ready 4 · Reviewing 2 · Weak 3`) + a plain-English explainer: *"Scope comes from your syllabus: the exam covers Units 4–7, so every topic in those units counts — 9 in total. The bar is those 9 by review state."* Colours reuse the topic-status vocabulary. **Never an unlabeled stacked bar** (rejected July 2026 — implied proportions of something unnamed).

#### Two kinds of notes (LOCKED — do not merge)

- **Notes tab = notes *about* the class** (meta): **Exam intel** (what this professor actually tests), **Questions to ask** (checkboxes, tied to office hours), **Priming questions** (rolled up from Materials), **Lecture notes** by unit, Admin. Filed by kind with counts — never one undifferentiated pile. Per-topic notes roll up in a side rail.
- **Materials → My notes = notes *on* the material** (content): your handwritten pages, annotated slides, whiteboard photos. Lives beside the lecture, tagged `Mine`, indexed like any other source — so **the active-recall gap report can cite your own page**, not just the professor's slide.

#### Priming questions (new)

Each Materials module carries a **"Prime yourself"** block — questions to hold in mind *before* reading ("If both E1 and E2 remove the same H, why does base strength decide which happens?"). Visually its own thing, user-authored or suggested, and rolled up into the Notes tab as a category. Evidence-backed and nothing else in the app was doing it.

#### Note ingest — watched folders (GoodNotes et al.)

**No GoodNotes API is needed.** GoodNotes **Auto Backup** (Settings → Cloud & Backup) writes a fresh PDF to Google Drive / Dropbox / OneDrive on every edit. HQ **watches that folder** and ingests new/updated PDFs. Same pattern serves Notability, OneNote, or anything with auto-export.

- **One-way only** — HQ reads; it never edits, moves, or writes back.
- **Structure is inferred, then confirmed once.** HQ reads the folder path and **pre-fills** a mapping: a level matching an enrolled course → **class**; `Week 3` / `Wk 3` / `W3` → **week**; `Notes` / `Homework` / `Practice problems` → **category**; the file → document. Arbitrary depth. The user **confirms once**; every later import is silent.
- **It only re-asks** when a genuinely new folder appears (next semester's course) or a level is unguessable ("Misc") — and then only about that level.
- **Never silently guess a week:** unplaceable pages still import into the class, flagged *"confirm week."*
- Import preview states what will land, what needs confirming, and that nothing is overwritten. A **"Review each import instead"** switch exists.
- Caveats to surface in the setup guide: fixed backup roots (Dropbox `/Apps/Goodnotes 6`, Drive base level) and **not available on GoodNotes for macOS**.

#### Locked decisions

1. **Hero = the review loop.** Due-today + `Start review` lead; **Topics** is the backbone. Materials / tools / assignments **support**. The hub is a study surface, not a file cabinet.
2. **Study tools = primary + overflow.** ONE prominent **"Generate study guide"** + a quiet menu for the rest (§6.2), **plus contextual entry points**: a topic's `⋯` → "Quiz me on this", a file's `⋯` → "Summarize". **No 8-button grid** (declutter, `04` §6).
3. **Topic row anatomy:** status chip (Not Started → Seen → Notes Made → Reviewing → Weak → Ready) + retrievability bar + **per-topic notes** affordance + `⋯`. Fast-capture **"＋ Covered a topic today"** starts its FSRS clock (§4.1-G).
4. **Anki is decoupled** (§4.1) — no sync chips, no scheduler ownership. Every topic is HQ-scheduled. A topic may show an optional "open deck" link only.
4a. **Coverage meter** (§6.4) sits in the Materials panel header: *"94% mapped · 3 items from Lecture 12 unassigned · 1 never reviewed."*
5. **Materials open inline** (embedded viewer), not just linked — the "move everything from Canvas into HQ" vision (§4.1-A); bulk **Import from Canvas** sits in the panel header.
6. **Pacing (`01` §4d):** max one deterministic pace line per panel — exam-readiness in the review core, mastery pace in "Where you stand". None on the streak.
7. **Every due row states its reason** ("last recall 4 days ago · retrievability ~87%") — explainability (`architecture/02`, §4.1-F).

#### Components used

| Feature | Component(s) |
|---|---|
| Open model | center peek → expand (`01` §2) |
| Banner stat strip | glass strip (`01` §4b-ii) + `Smooth Button` (Start review) |
| Coach note | **`MascotNote`** teaching variant (`01` §4f) |
| Due row / topic row | `Card` row + `Badge` (status) + **Animated Progress Bar** (retrievability) + `Context Menu` (`01` §4c) |
| Pace line | pace chip (`01` §4d), dismissible → "Show projection" pill |
| Materials | file rows + `Dialog`/embed viewer + dashed drop zone |
| Study tools | `Smooth Button` (primary) + `DropdownMenu` (overflow) + per-row `⋯` entries |
| Focus timer | timer control + `Badge` (streak) |
| Empty states | **`MascotNote`** empty variant |

---

### 4.1-J Active recall session runner (APPROVED July 2026)

> **Mockup:** `specifications/mockups/01-academics/academics-review-session.html` (APPROVED).
> What happens after `Start review` / `Recall`. Full-screen focus surface.

#### One mode — "Active recall"

The earlier three-mode split (quick recall / blurting / Feynman) is **removed**. They are one act at different depths: *produce from memory, then be told what you missed.* **Do not reintroduce modes.**

#### One composer, three input affordances

Used together or alone: **mic (default) · keyboard · image attach.** The primary path is narrating while drawing — speak, then attach the page. **Full video analysis is deliberately not built** (cost/latency); the audio transcript + the final image is the 90% solution. The image drop stays available at any point, including after speaking.

#### The loop

1. **Cue with stated scope.** The prompt names what to cover (`substrate · nucleophile · solvent · stereochemistry`). Those scope chips **are** the checklist the grader uses — you are never marked down for something you weren't asked for. This is the "am I on the right page?" guarantee.
2. **Respond** via the composer.
3. **Confidence before reveal** — No idea / Shaky / Pretty sure / Know it cold. Plain language, not a 1–5 scale.
4. **Gap report** (below) — *not* a notes dump.
5. **Self-grade** Again / Hard / Good / Easy, **with intervals shown** (`<10 min · 2d · 5d · 12d`) so FSRS is legible, not magic. Keyboard: space reveals, 1–4 grade.

#### Output is a gap report, not a notes dump (LOCKED)

Revealing full notes teaches nothing — you skim and think "I knew that." Show only **what you had · what you missed · what you got wrong**.

**Every gap item carries clickable provenance:**
- **Blue chip = "from your materials"** → opens the file at the cited passage, **highlighted** (Anthropic Citations returns character-level offsets).
- **Amber chip = "general knowledge — not in your notes."**
- Never silently blend the two. If your professor's material contradicts general chemistry, you see both.
- **"Second opinion"** is available per-claim, on demand — never run by default.

#### Calibration (the teaching layer, deterministic)

Predicted confidence vs actual grade. Works with **no API**. The summary leads with it ("Overconfident on 2 of 9 — you said Pretty sure, then graded both Again"), because that gap is what re-reading hides.

#### Session start & summary — scenic treatment

- **Start:** background art + veil, **`9 topics up`** (numeral, not a word), the **full comprehensive queue** with faint hairline dividers and `Weak` / `Never reviewed` tags, `+ N more due`, a wide primary **Start active recall** with mic/settings squares, and a preferences line. **No panel container. No giant orphan numeral.**
- **Reading states dim the scene hard** so legibility never fights the art; **start and summary run it at full strength.**
- One `MascotNote` per session surface.

#### The session is the study container (EXPANDED July 2026 — Andy's placement calls)

**One place where studying happens.** The timer and the concept canvas were both looking for a home; both belong here, and putting them here means a student never has to decide *which surface to open in order to study.*

**This does not reintroduce modes.** The one-mode rule (above) rejected three *depths of recall*. What follows is a session **wrapper** and an additional **input affordance** — neither is a mode switcher, and the rejected split stays rejected.

##### A. Timer + Pomodoro — inside the session, not a separate surface

- **Start review starts the clock.** The timer runs in the session shell, unobtrusive, tied to the class and the topic being worked.
- **Pomodoro and session preferences live in the session's settings square** (already in the start screen), not in global settings: work length, break length, whether breaks are enforced, sound. Modelled on the MCAT study session.
- **This is the app's only source of study-hours data.** #33 (review-debt), #34 (optimal session length), and #35 (effort-to-outcome) all read from it and are otherwise unbuildable.
- **Pausing is free and unpunished.** No streak penalty, no "you abandoned a session" copy. (§6.10-B, §6.15.)

**Focus sessions — the one addition beyond Andy's placement, and the reason for it.** Recall sessions capture only *recall* hours. Reading, problem sets, and lab reports are most of a STEM student's time, and #35 compares hours-per-class against grade — which is wrong if it only sees recall.

So the shell supports **two session purposes**, chosen at start:

| | Runs | Logs |
|---|---|---|
| **Recall** | the full loop above | hours + retrieval data |
| **Focus** | timer only, tied to a class and optionally a topic | hours only |

**Focus has no recall loop, no grading, no FSRS write.** It exists so the hours data isn't systematically missing two-thirds of study time. **This is a session *purpose*, not a recall *depth*** — the distinction that keeps the one-mode rule intact.

##### B. Concept canvas — a retrieval affordance, not a drawing app

Andy: *"my maps are a retrieval kind of thing, so it could be inside the review."* Correct — a concept map produced from memory **is** active recall, and it's the **Connect step of UNPATCHED 2026** (§6.6), which otherwise has no surface.

- **A fourth composer affordance** alongside mic, keyboard, and image attach: **draw**. Combinable with the others — narrate while drawing is the intended path, same as today.
- **Opens on request**, never by default. The composer stays a text field for the student who just wants to type.
- **Upload is equal to drawing.** Andy is a GoodNotes user; photographing a map drawn on paper or in GoodNotes goes through the identical pipeline. **Neither path is the degraded one** — the in-app canvas exists for people without a tablet, not to replace one.
- **Graded like any other response** — against the scope chips, into the same gap report. HQ's job is to say *what's missing from the map*, which is exactly the gap-identification Andy described.
- **Confirmed relations may be written as `TopicLink`s** (proposed, confirmed by the student, never auto-written) — so drawing a map feeds #22 and #39 instead of being a dead artifact.
- **Deliberately simple:** nodes, labelled edges, text. **Not** a diagramming tool, no shape libraries, no styling. If someone wants a real canvas they already have GoodNotes, and §0 of `integration-map` says don't rebuild it.

#### Backend (how it works — see §6.3)

FSRS picks the topic deterministically → retrieval pulls **that topic's** chunks (scoped by `topicId`) + the cached key-point checklist → one prompt template the app ships (the user never writes one) → model returns **structured JSON** (`covered / missed / wrong / suggestedGrade`, each with a citation) → the UI renders it. Schema-constrained output, not prose.

#### Acceptance criteria

- [ ] One mode; no mode switcher anywhere.
- [ ] Composer accepts voice, text, and image, combinable in one response.
- [ ] Scope chips shown before responding and used as the grading checklist.
- [ ] Confidence captured **before** reveal; calibration computed deterministically and surfaced in the summary.
- [ ] Gap report only (never a full notes dump); every item carries a provenance chip; source chips open the file at the highlighted passage.
- [ ] Grade buttons show intervals; keyboard shortcuts work.
- [ ] Scene full-strength on start/summary, dimmed behind reading states.
- [ ] Entire loop works with **no API key** except the AI gap-check (FSRS, calibration, scheduling, summary all deterministic).
- [ ] **Timer runs in the session shell**, tied to class + topic; Pomodoro and session preferences live in the session's own settings, not global settings. **This is the sole source of study-hours data** for #33/#34/#35. Pausing carries **no penalty and no guilt copy**.
- [ ] **Two session purposes — Recall and Focus.** Focus is timer-only (no loop, no grading, no FSRS write) so reading and problem-set hours are captured. **This is a purpose, not a recall depth — the one-mode rule still holds and the three-depth split stays rejected.**
- [ ] **Canvas is a fourth composer affordance**, opened on request and never by default, combinable with mic/keyboard/image. **Uploading a GoodNotes/paper map is equal to drawing in-app — neither is the degraded path.** Graded against the scope chips into the same gap report. Confirmed relations may write `TopicLink`s **only with user confirmation**. **Nodes, labelled edges, and text only — no shape libraries, no styling, not a diagramming tool.**

---

### 4.1-K "Study method — UNPATCHED 2026" — the study-cycle surface (ADDED July 2026)

**Official name: `Study method · UNPATCHED 2026`.** The gaming framing is intentional — *unpatched* means never nerfed, still overpowered. It reads as a method that works rather than a chore list, and the **year is a version**: when the method evolves, ship `UNPATCHED 2027` and the name carries its own changelog. Earlier working title "The Loop" is retired — too abstract, said nothing about what it was.

The nine-step cycle (§6.6) needs a home. **It is not a tab** — a tab would make it a place you visit instead of a thing you do. It appears in three places, each doing a different job.

#### A. Per-topic lifecycle track (the atom)

Every topic row carries a **compact 9-dot track** in three groups, so the cycle is legible at a glance:

```
before ● ● ○   after ● ○ ○   retain ● ● ○
       prime pretest predict   recall feynman connect   spaced practice mock
```

Filled = done, hollow = not. Hovering names the step. **This replaces nothing** — the existing status chip and retrievability bar stay; the track sits beside them.

Why per-topic: the cycle isn't a class-level ritual, it's what has and hasn't happened to *this piece of material*. A class is never "at step 4" — its topics are all at different stages.

#### B. The `Study method · UNPATCHED 2026` panel on the class Overview (the hand-holding)

A section — not a tab — that groups this class's topics by **what stage they need next**, so the page answers *"what do I do right now?"*:

| Group | Contains | Action |
|---|---|---|
| **Before class** | topics for the next scheduled lecture | `Prime · Pretest · Predict` |
| **Just covered** | marked covered in the last 7 days, not yet recalled | `Recall it` |
| **Needs connecting** | recalled but no `TopicLink` | `Connect it` |
| **Due to review** | FSRS says due | `Start review` |
| **Exam-ready check** | in exam scope, never mock-tested | `Full mock` |

Each group shows a count and collapses when empty. **The panel disappears entirely when every group is empty** — a congratulation, not a permanent fixture.

The insight: the cycle is *inherently prescriptive*. Knowing a topic is "covered but never connected" tells you exactly what to do next, with no judgment required. That's the hand-holding you asked for, and it costs no AI.

#### C. Lecture-day anchoring (the timing)

`ClassWorkspace` already stores meeting days/times (`MWF 10:10a`). Use it:

- The **evening before** a lecture day → "Before class" group surfaces its prompts.
- **Within 24h after** → "Just covered" prompts to mark what was actually covered (§6 #13).
- No lecture schedule set → the groups still work, just without the timing nudge. **Never require the schedule.**

#### Rules

- **Never show all nine steps as a checklist to complete.** That converts a learning cycle into a chore list and guarantees abandonment. Show only *the next* step per topic.
- **Skipping is legitimate.** A student who only does recall and spaced repetition is studying correctly. The panel surfaces opportunities; it never scolds.
- **One `MascotNote` maximum** on the panel, teaching one unfamiliar step at a time (Pretest first, since it's the counter-intuitive one).
- The dot track is **decorative-free** — it encodes state, nothing else. No animation on load.

### 4.1-L Forgetting curve — "will I still know this on Friday?" (ADDED July 2026)

> **Mockup:** the sawtooth panel — Ebbinghaus decay with spaced-repetition resets.

The single best explanation of *why* the app schedules reviews the way it does, and the honest answer to the only question that matters before an exam.

**What it draws.** Retention over time for one topic. Each review is a vertical line resetting to 100%; **each reset makes the following decay flatter**, so the gaps widen (`2 → 5 → 12 → 26 days`). The curve after the last review is **dashed** — it is a projection, not history.

**What makes it useful rather than decorative:**
- **An exam line** at the exam date, with the projected retention where the curve crosses it: *"≈78% on exam day."* That converts an abstract algorithm into an actionable number.
- **A plain-language legend**, always present: each review resets you to 100% · every reset slows the next fall · reviews are timed **just before** you'd forget, because earlier wastes effort and later loses the memory.
- Deterministic from FSRS stability/retrievability. **No API.**

**Rules:** history is solid, projection is dashed — never blur the two. If a topic has fewer than two reviews there is no curve to draw; show the honest *"not enough history yet"* state rather than a fabricated shape. One curve at a time (a chosen topic), never a spaghetti of all eighteen.

**Where:** the class page, reachable from a topic row and from the exam-scope panel. Also the teaching artifact behind the §4.1-F "how to study" guide — this is the picture that makes spaced repetition click.

### 4.1-M Syllabus ingestion — THE KEYSTONE (added July 2026)

> **Build this first. Without it, most of §6 is decorative.**

Upload or paste a syllabus → extract **units/topics · exam dates · assignment deadlines · grade weights and categories · late/drop/replacement policies · attendance rules · meeting times · instructor and office hours**.

**Why it comes first, stated plainly:** a student who must hand-enter nine units and twelve deadlines per course will do it once, for one course, in week one — and never again. Every feature that depends on knowing *what's due, what's on the exam, and what it's worth* dies with it. It is the single dependency for #13, #18, #32, #37, #42, exam scope, the grade ledger (§6.8), the positional coverage fallback (§6.4), and the lecture-day anchoring in §4.1-K.

**Review before apply (non-negotiable).** Extraction proposes; the user confirms. A confirm screen shows each extracted item with its **source text**, flags low-confidence items, and lets the user edit inline. **Never silently apply** — a mis-parsed grade weight corrupts every projection downstream, and the user would have no idea why.

**Partial success is success.** If dates parse but weights don't, keep the dates and say what's missing. All-or-nothing parsing is how these features fail in practice.

**Re-ingestion is a diff, not a replacement.** A newer syllabus shows *what changed* (dates moved, weights adjusted, scope altered) and asks — it never overwrites confirmed data (#42).

**Formats:** PDF, DOCX, pasted text, photo of a printed syllabus. Falls back to manual entry, which must stay fully usable — **the app is never blocked on parsing.**

**Shareable parses (#56).** One person in CHEM 262 uploads the syllabus; everyone else in the section imports the parsed **units, dates, weights, and policies**. Amortises the app's single worst friction across a whole section, and it is **the only social feature that doesn't import pre-med comparison anxiety** — the shared object is the professor's document, never anyone's grades or progress.

#### Security and privacy model (LOCKED — the design rests on one distinction)

**Share the extracted structure, never the source document.** This single rule resolves both the privacy problem and the copyright problem at once:

- A syllabus is **the professor's copyrighted work**. Redistributing the PDF or its full text through HQ is republication and is **not permitted**.
- *"Exam 2 is Oct 14; problem sets are 15%; lowest quiz dropped"* are **facts about a course**. Facts are not copyrightable, they're the part students already text each other, and they're the only part HQ needs.

So the shared payload is a **structured record — dates, weights, unit names, policy flags — and nothing else.** No PDF, no page images, no extracted prose, no lecture descriptions copied verbatim.

**Enforced structurally, not by policy:**

- Shared parses live in a **separate table with no join path to any user's grades, notes, progress, topics, or files.** It must be *impossible* to leak personal data through this feature, not merely against the rules. If a future schema change would create such a join, that's a blocking review.
- The payload schema is an **allow-list of fields.** Anything not on the list is dropped at serialise time, so a later field addition can never silently ride along.

**Identity:**

- Shares are **anonymous by default.** Attribution is *"shared by someone in this section,"* never a name, never an email, never a user ID visible to the recipient.
- The **instructor's name and office hours may travel** (they're on a public course listing); a **student's contact records never do**.
- Uploading is **opt-in per syllabus**, never a default, never retroactive to already-uploaded files.

**Trust and correctness:**

- Import always runs through the **same review-before-apply screen** (above). A shared parse is a proposal like any other and is never auto-applied.
- **Corroboration over authority:** when several people independently upload the same course's syllabus, agreement across parses raises confidence and disagreement is **surfaced as a conflict**, not silently resolved. A parse twelve people imported without correcting is stronger evidence than one nobody has checked.
- Every shared parse shows **provenance** — term, section, when parsed, how many imports, how many corrections.
- **Report / correct** on any shared parse; corrections propagate as a diff to importers (#42), never as a silent overwrite.
- A shared parse is **scoped to a term and section** and expires with it. Last spring's parse is offered as history, clearly labelled, never as current.

**The one real risk, stated:** a wrong shared parse propagates faster than a wrong private one. Mitigated by review-before-apply, corroboration, correction diffs, and the fact that **the user's own uploaded syllabus always wins** over a shared one.

#### 4.1-M-a Where it lives — four entry points, one destination (added July 2026)

**No new tab.** Like exam prep mode (§4.1-R), import is a **temporary full-screen flow**, not a permanent surface. It is reached from wherever the absence of a syllabus is felt:

| # | Entry point | Context | What it does |
|---|---|---|---|
| 1 | **Cold start** — the single day-one CTA (§6.10-A) | no classes exist | **Creates the class from the syllabus.** This is the primary path and the reason the feature exists. |
| 2 | **Class page → Materials, top of tab** | class exists, no syllabus | Attaches to that class. Matches the placement rule that catalog/capture controls sit at the top of Materials. |
| 3 | **Class Center card overflow** → `Import syllabus` | cross-class view | Attaches to that class. |
| 4 | **Add a class** flow | mid-term additions | Offered as the fast path, with manual entry always beside it. |

**Entry determines scope, and scope changes one screen only.** Entered **unscoped** (#1), the review screen leads with *"Which class is this?"*, prefilled from the parsed course code, and creates the `Course` + `ClassWorkspace` on apply. Entered **scoped** (#2–4), that block is replaced by a static class header. Everything after it is identical.

**Re-import is the same flow in diff mode** (§4.1-M re-ingestion), entered from Materials → the existing syllabus row → `Re-import`.

#### 4.1-M-b The upload step — one dropzone, no wizard

**Reuse `AnimatedFileUpload`** (`components/motion/`) — it already provides drag-and-drop, click-to-browse, an `accept` filter, and the drag-state lift. **Do not fork a variant** (design foundation: reuse shared components).

- **One target, drop or click.** Drag a file anywhere onto the zone, or click to open the file picker. Both are equal paths — neither is the degraded one.
- **Accepts PDF, DOCX, images (photo of a printed syllabus), and pasted text.** A `Paste text instead` affordance sits under the zone for the copy-from-Canvas case, which is common and must not require making a file first.
- **Multiple files at once.** Students often have a syllabus plus a separate course schedule. Parse them together into one proposal rather than forcing two passes.
- **No wizard, no step counter.** Upload → parse → review → apply is one screen that changes state, not four screens. A four-step wizard for a 40-second task is how this feature gets abandoned.
- **Parsing state is honest about time and cancellable.** It names what it's doing ("reading week structure…") rather than showing an indeterminate spinner, because a 20-second silent wait reads as a hang.
- **Manual entry is always visible**, never behind a failure. The app is never blocked on parsing (§4.1-M).

#### 4.1-M-c The review screen — the one screen that matters

Review-before-apply is non-negotiable (§4.1-M above). The screen is a **proposal to confirm, not a form to fill.**

- **Grouped by what was found**, in the order a student cares: **class identity → exam dates → grade weights → units/topics → deadlines → policies → logistics** (meeting times, instructor, office hours).
- **Every group carries a count and a confidence state.** Groups that parsed cleanly are **collapsed with a summary line** ("12 deadlines · all confident"); groups with any low-confidence item are **expanded by default**. The student's attention goes where it is needed instead of onto 40 correct rows.
- **Every item shows its source text**, quoted from the syllabus, with the page or line. This is what makes the confirmation meaningful rather than ceremonial — a student cannot verify a grade weight they cannot trace.
- **Low-confidence items are flagged, never hidden or dropped**, and are inline-editable in place. No modal, no separate correction screen.
- **Weight validation is explicit.** Categories must sum to 100%; if they don't, say so and show the gap. A mis-parsed weight corrupts every downstream projection, so this is the single highest-stakes field on the screen.
- **Partial success is presented as success** (§4.1-M): what parsed is kept, what didn't is named plainly with a manual-entry affordance beside it — never an error state for the whole import.
- **Apply is one action** and states its consequence: *"Adds 9 units, 12 deadlines, 3 exam dates, and 5 grade categories to CHEM 262."* Nothing is written before it.
- **Everything applied stays editable afterwards**, and the source file is retained and linked so any value can be re-checked later.

#### 4.1-M-d Failure and re-import states

- **Nothing parsed.** Say what was tried, keep the file attached to the class, and go straight to manual entry with the file open beside it. **Never a dead end and never a bare error.**
- **Wrong document.** If the upload doesn't read as a syllabus (a problem set, a slide deck), say so and offer to file it in Materials instead — which is where it belongs.
- **Re-import diff** (§4.1-M): a newer syllabus shows only **what changed**, three-way — added / changed / removed — each with old and new values side by side, each individually accept-or-keep. **Confirmed data is never silently overwritten.** Unchanged items are collapsed and counted, not re-listed.

### 4.1-O Canvas / LMS integration — two paths, cheap one first (added July 2026 · REVISED)

> **Read `implementation/integration-map.md` §0 first.** The governing principle is **hand off before building**. Canvas has a tier-2 path and a tier-4 path, and **the tier-2 path ships first.**

#### Path A — the calendar feed (BUILD THIS FIRST · near-zero cost)

Canvas publishes a per-user **ICS calendar feed** containing assignments and due dates. No token, no OAuth, no proxy.

- The student subscribes that feed to **Google Calendar** — many already have.
- **HQ reads Google Calendar, which §6.9 already committed to doing.**
- **Canvas-specific engineering: none.** Deadlines arrive through an integration that was already on the roadmap.

This alone delivers deadline collision (#18), the capture window's timing, and workload projection. **Verify the feed URL format and that browser-side ICS fetching isn't CORS-blocked** — if it is, the Google Calendar hop resolves it anyway, which is the point of routing through it.

#### Path B — the REST API (ONLY IF PATH A PROVES INSUFFICIENT)

The one thing the calendar feed can't carry is **grades**, and grades are what make the grade ledger (§6.8) self-populating. Everything below applies to Path B only.

**Do not build Path B until Path A is shipped and someone has asked for more.** Path A is about a day of work. Path B is a proxy, a token-security design, and a sync engine — the most expensive integration in the app.

---

#### Path B detail ⭐

**UNC runs Canvas, and Canvas already holds assignments, due dates, submitted work, and posted grades.** Students can generate their own read-only access token from Canvas account settings. Not pulling that data is asking students to hand-type what their university already has.

**Why this is nearly as important as syllabus ingestion:** §4.1-M solves *"what's on the exam and what's it worth."* Canvas solves *"what's due and what did I get."* Together they mean **the app is useful in week one instead of week five — and week five is after most people have quit.**

#### What Canvas gives you that a syllabus can't

- **Assignments and due dates**, live and updated when the professor moves them
- **Posted grades** as they're returned — the grade ledger (§6.8) populates itself
- **Submission state** — turned in, late, missing
- **Assignment groups with weights** — Canvas often carries "Problem sets 15%" natively
- Course list, instructor, term

Which means **#18 (deadline collision), #38 (grade trajectory), #44 (regrade window), #45/#46 (irrelevant / highest-leverage), and the entire grade ledger work on day one with zero typing.**

#### What Canvas can't give you — why the syllabus still matters

Canvas has no idea what a *unit* is. It doesn't know exam scope, drop-lowest rules, curve policy, attendance rules, or the reading schedule. **Those live in a PDF Canvas has never read.** So:

- **Canvas = dates, grades, submissions, group weights.**
- **Syllabus = units, exam scope, policies, meeting times, readings.**
- **Neither replaces the other. Pair them.** Where both supply the same fact (a weight, a due date), **Canvas wins for dates and grades** (it's live), **the syllabus wins for policies** (Canvas doesn't model them). Conflicts surface for confirmation, never silently.

#### Architecture — verified July 2026, and it is not optional

**Canvas cannot be called from the browser.** Canvas sends no `Access-Control-Allow-Origin` header and rejects the CORS preflight with a 405; on Instructure-hosted instances (which UNC is) those headers cannot be changed. Instructure also states plainly that **API requests carrying an authorization token are not meant to be made from within a browser.**

**Therefore:**

```
HQ (static, GitHub Pages)  →  Supabase Edge Function  →  Canvas REST API
                              ^ holds the token, adds CORS
```

- **This is the same proxy already required for AI provider keys (§6.3).** One pattern, two consumers — Canvas adds no new infrastructure category, which is the main reason it's affordable.
- **The token never reaches the browser and is never in client bundles or `localStorage`.** It is stored server-side, encrypted at rest, scoped to one user.
- **A purely client-side Canvas integration is impossible.** Any plan that assumes otherwise is wrong; do not attempt a browser-side fetch and do not add a third-party CORS proxy.

**Verify before building:** institutions can disable student-generated access tokens. **Confirm UNC permits them** — if not, the whole feature is blocked and should be cut rather than worked around.

#### Announcements — triage, never relay (locked)

Andy wants Canvas announcements inside HQ and reaching the notification bell. **Straight relay would break the app.** Canvas announcements are a firehose — a professor posts "reminder, office hours today," "great job on the midterm," "room change for Thursday," and "Exam 2 moved to Oct 21" with **identical notification weight**. Piping all of that into the bell exhausts the 3-per-week attention budget (§6.11) in a day, the student mutes HQ, and every event-driven feature dies with it.

**Resolved by splitting the bell into two streams (§6.11).** Announcements are **not filtered** — they get their own uncapped, pull-based **Class** stream, separate from HQ's pushed **Alerts**:

| | Where it goes | Interrupts? |
|---|---|---|
| **Every announcement** | Class page **and the bell's Class stream**, full text, unread-marked | **No** — quiet count only |
| **Announcements that change something** | **Also promoted** into Alerts | **Yes**, subject to the auction (§6.11) |

**Promotion, never removal.** A promoted announcement stays in the Class stream too. Nothing a professor posts is ever withheld.

**"Changes something" is a short, closed list** — extracted from the announcement text, not guessed at:

- A **date moved** (exam, deadline, class cancelled)
- **Exam scope changed** (units added or dropped)
- An assignment **added, cancelled, or reweighted**
- A **policy change** (extension granted, curve announced, drop-lowest applied)

Everything else — encouragement, logistics, general reminders — **sits in the class page and never interrupts.**

**Rules:**

- **Extraction proposes; it never edits.** An announcement saying the exam moved surfaces *"Exam 2 looks like it moved to Oct 21 — update?"* with the announcement quoted. **The student confirms.** Never silently rewrite a date from parsed prose (§6.4: never silently guess).
- **The announcement is always linked** so the student can read the original. HQ's summary is never the only version.
- **Unread state is HQ's own** — HQ never marks anything read in Canvas, because it never writes to Canvas.
- **When extraction is uncertain, don't escalate.** It sits in the class page like any other announcement. A missed escalation costs one unread item; a false one costs trust.

**This is the actual value.** Canvas notifies you about everything with equal weight, which is why students turn Canvas notifications off. **HQ's version is worth having precisely because it doesn't.**

#### Scope — what HQ mirrors, and where it stops

**Mirror (read):** courses · assignments + due dates · assignment groups and their weights · submissions and their state · posted grades · **announcements** · **modules and module items** · files and pages · `syllabus_body` · calendar events.

**Never (write):** submitting assignments · taking quizzes or exams · posting to discussions · anything proctored · anything that changes state in Canvas. **HQ is read-only against Canvas, permanently.** This is not a phase-one limitation to revisit later — a bug in a write path could cost a student a grade.

**The goal is a mirror, not a replacement (Andy, July 2026 — he keeps using Canvas).** Content flows **in** so HQ can reason over it; doing things still happens in Canvas. Mirroring grades, deadlines, announcements, and modules covers nearly everything checked routinely; quizzes, submissions, and proctored work stay in Canvas because they must.

**Formats to handle when mirroring:** announcement and assignment bodies are **HTML** — render them **sanitised** (strip scripts, event handlers, and remote-loading tags), preserve lists, tables, links, and basic formatting. Images load from Canvas or degrade to a link. **Attachments are linked, never copied** — HQ does not become a file mirror of Canvas. Anything that fails to render safely falls back to plain text plus a link to the original. **Never render unsanitised instructor HTML.**

**Do not build toward a full Canvas client.** No discussion threads, no inbox, no course navigation, no quiz surfaces. Every added endpoint is permanent maintenance for something Canvas already does well.

#### Rules (locked)

- **Read-only. HQ never writes to Canvas** — never submits, never posts, never edits. Non-negotiable.
- **Student-generated token, entered by the student.** No OAuth app registration with the university, no institutional agreement to negotiate.
- **The token lives only server-side, behind the Edge Function.** Never in the browser, never in `localStorage`, never in a synced store unencrypted. **Revocable from HQ in one action**, and revoking must actually delete it.
- **Import runs through review-before-apply**, same as syllabus ingestion. Nothing auto-applies.
- **Sync is a diff, never an overwrite.** A changed due date shows as a change (#42); user edits are never clobbered by a re-sync.
- **Degrades completely.** Everything in Academics works with no Canvas connection. This is an accelerant, never a dependency.
- **Not every professor uses Canvas well.** Many post nothing but a syllabus; some run everything through Sakai or email. **The empty case must be normal, not an error** — a connected course with no Canvas assignments says so plainly and manual entry stays first-class.
- **Provider-agnostic behind one interface.** Canvas first because UNC runs it; the seam should permit Blackboard/Moodle later without a rewrite.

### 4.1-R Exam prep mode — the two weeks that decide the grade (added July 2026)

**The debt this closes:** §4.1-I already specs a primary action `Build exam plan`, and it has never had a destination. D7 listed "the full exam-plan surface" as out of scope. **Every ingredient exists and nothing assembles them** — exam date, scope from the syllabus, per-topic states, retrievability projections, review-debt, past exams, lecture guidance.

**This is the highest-stakes recurring moment in a semester** and, after the class page, likely the second-most-used surface in the app.

#### It is a mode, not a tab

Entered from `Build exam plan` on the class banner, or offered automatically as an exam approaches. **Full-screen, temporary, and it ends when the exam does.** It is not a permanent destination and must not become one — a student is in it for ten days, three or four times a term.

#### What it assembles

Nothing here is new intelligence. It is **one surface over data seven existing features already produce**:

- **Scope** (§4.1-I) — the units the exam covers, and why HQ believes that
- **Per-topic state** — ready / reviewing / weak / never touched
- **Exam-day projection** (#32, §4.1-L) — retrievability **as a band**, on the exam date
- **Review-debt vs time available** (#33) — from session-timer data (§4.1-J)
- **Past exams** covering this scope, and whether you've taken them (§4.1-P)
- **Lecture guidance** for in-scope topics — quotes and timestamps (§4.1-Q), descriptive only
- **Never-reviewed material** — `timesSurfaced = 0` items pulled in explicitly (§6.4)

#### The plan itself

**A day-by-day sequence to the exam**, not a checklist:

- Ordered by **what decays soonest against what's weakest**, interleaved across units rather than blocked (#16).
- **Sized to hours the student actually has**, taken from their calendar (§6.9) — not to an idealised schedule.
- **Every day states its own why**: *"Units 4 and 5 today — both weak and both heavily weighted on the last three exams."*
- **Re-plans on change.** Falling behind reflows the remaining days; it does not accumulate a backlog. **The plan is never a debt ledger** (§6.10-B).
- **Editable.** The student can drop, move, or add topics and the projection updates.

#### Catch-up is a state of this mode, not a separate surface (#73)

When there isn't enough time to cover scope properly, the mode **changes what it says** rather than handing over an impossible plan:

- **It must be willing to name what to abandon.** *"You can't cover nine topics in three days. These four are highest-weight and most recoverable; these three are worth skipping."* **No other study app will say this, and it is the single most useful thing to hear in that position.**
- **Honest about consequence, never moralising** — cram detection's framing (#25): this produces exam-day recall and near-total loss afterwards, which matters because the content returns on the MCAT.
- **Never implies failure.** Per §6.15, being behind HQ's targets usually means being on pace with everyone else.

#### After the exam

The mode closes into the **exam autopsy** (#17) — what you flagged weak vs what appeared — and schedules the **post-exam decay check** (#41) for two weeks out. **Closing is one tap and skippable**; the autopsy is offered, never demanded.

#### Rules

- **Assembles, never invents.** No new scoring, no readiness number that doesn't come from #32, no blended "prepared %".
- **Projections stay bands**, never point estimates (§6.12).
- **Works with no API key** — scope, states, decay ordering, and hours are all deterministic.
- **Degrades without a syllabus:** with no parsed scope it asks which units are covered and continues. **Never blocked on §4.1-M**, just less informed.
- **One exam at a time.** Two exams in one week are two entries, not a merged plan — merging them hides which one is in trouble.

### 4.1-P Exam & resource catalog (added July 2026)

**The gap:** HQ can *generate* practice questions. It has no home for **real exams** — the professor's past exams, your own returned exams, the department's practice finals, and whatever else circulates. Those are strictly better than generated questions, and students already hoard them in group chats and shared Drive folders where nothing is organised and half of it is the wrong year.

**A per-class catalog of real assessment material.** Andy's framing: *"maybe you didn't want to generate an exam and wanted to take an actual one."*

#### What it holds

| Source | Examples |
|---|---|
| **Instructor** | past exams, practice finals, released keys, review sheets |
| **Your own** | your returned graded exams |
| **Department / university** | common finals, department problem banks, tutoring-centre material |
| **External** | textbook chapter tests, publisher banks, open courseware, MCAT-adjacent sets |

Each entry carries: **source and permission status · term/year · which units it covers · answer key present? · timed length · whether you've taken it, and your score.**

#### What makes it more than a folder

- **Tagged by unit**, so it answers *"what can I practice for Exam 2's scope?"* — not "what files exist."
- **Coverage evidence.** Once several past exams are tagged, HQ can say *"the last three exams drew 40% of points from Unit 2, which your syllabus lists as minor."* **Exam scope becomes verifiable rather than merely declared**, and this feeds `ProfessorModel` (#49) with far more than the two or three exams a single term produces.
- **Taking one is a first-class action** — timed mode, then score entry, then misses tagged into `AcademicMistake` with the locked cause taxonomy. **This is the highest-signal input the mistake features will ever get** (#47, #48), and it's real exam questions rather than generated ones.
- **Untaken-but-relevant surfaces during exam prep**: *"You have 2 past exams covering Units 4–7 and haven't taken either."*

#### Permissions — the part that must not be sloppy

- **Every entry carries an explicit source and permission status:** `instructor-provided` · `publicly posted` · `my own returned work` · `unknown origin`.
- **`unknown origin` is flagged and never shared** beyond the person who uploaded it.
- **This is not a distribution network.** Sharing follows the same rule as syllabus parses (§4.1-M): **share only what is clearly permitted.** Some instructors expressly forbid redistributing exams, and HQ must not be the tool that ignores that. When in doubt, the file stays private to the uploader.
- **No scraping** of course-material sites, and no integration with paid answer-sharing services.
- Where an instructor has posted material publicly, **link rather than copy** (`integration-map` §0 tier 3).

### 4.1-Q Lecture capture — the professor-insight engine (added July 2026)

**Andy's argument, and it's the right one:** professors telegraph. They spend eight minutes on one slide and forty seconds on another, they repeat the thing they care about, and they say *"this is the kind of thing that shows up on an exam."* **A student who attends and listens has real information that a student reading the slide deck does not** — and currently nobody captures it, because you can't take notes and listen closely at the same time.

**So this isn't a transcription feature. It's an emphasis-detection feature.** Transcription is the input; the output is *what the professor signalled.*

**And professors mostly do not say it outright** (Andy, July 2026). They rely on you listening. So the detector reads **everything they said** — see the processing section below, and note that filtering the transcript before analysis is explicitly rejected.

#### The pipeline

Record (or upload the professor's own Panopto/Zoom recording) → transcribe → **align against that lecture's uploaded materials** → surface emphasis and links.

**Three outputs, in order of value:**

1. **Material linking.** The professor talks about DNA replication for six minutes; HQ links that stretch of transcript to the DNA replication slides already uploaded. Result: the slide deck gains *what was actually said about each slide*, and the coverage ledger (§6.4) gets fed automatically.
2. **Emphasis signals** ⭐ — the actual edge, and **read from the words**, since those are the only thing that doesn't vary with teaching style. Explicit cues are the easy case; **implicit telegraphing is the valuable one** — *"I'd look out for this," "be careful here,"* a distinction drawn deliberately, a hypothetical that is really a rehearsed exam question. Computed signals (time-per-slide, repetition, divergence from the deck, speaking-pace drop) are **corroboration shown alongside a finding, never the detector.**
3. **Automatic coverage.** Closes the #13 loop — the capture-window nudge becomes unnecessary for recorded lectures, because HQ already knows what was covered. **Propose, don't apply** (§6.4).

Feeds `ProfessorModel` (#49) with lecture-level evidence rather than exam-level only.

#### Processing — read everything (LOCKED · corrected July 2026)

> **REJECTED — do not build: filtering the transcript before analysis.** An earlier draft ranked segments by time-on-topic, repetition, slide-divergence, and speaking pace, then sent only the top ~8 to a model. **Andy killed it, correctly, on two grounds.**
>
> **1. Proxies are unreliable; words are not.** *"Tone can change, rhythm can change, volume can change, but the words themselves cannot… words are the most reliable indicator of what the professor's saying."* Teaching style varies enormously, so any proxy is really a measure of *that professor's habits*, not of importance. **And the failure mode is exactly the case that matters:** a professor can say the most important sentence of the term in eight seconds, quickly, once — and a ranked filter would guarantee the model never sees it.
>
> **2. The cost argument behind the filter was simply wrong.** It confused *audio hours* with *tokens*. A 50-minute lecture is ~7–8k words ≈ **~10k tokens**; fifteen lectures a week ≈ **150k tokens/week**; a full semester is on the order of **2M tokens** — **a couple of dollars per student on a small model.** Analysis was never the expensive part.

**So: transcribe the whole lecture and analyse the whole transcript. No pre-filtering, ever.**

**Stage 1 — transcribe.** **On-device (Whisper-class) is the default**, because transcription — not analysis — is the real cost driver, and running locally makes it free *and* keeps the audio on the device. A cloud transcription service is optional, opt-in, and disclosed at the point of use (§6.12).

**Stage 2 — segment (no LLM). For structure, never for filtering.** Align the transcript to that lecture's slides by timestamp plus embedding match. Segmentation survives the rewrite because it makes analysis *better* — the model knows which slide is under discussion — and it lets **every claim cite a precise timestamp**. **It must never be used to decide what gets read.**

**Stage 3 — analyse every segment (small model).** Full transcript, segment by segment, asking what the professor signalled and requiring **quote + timestamp** on every claim. A small/fast tier is sufficient — noticing *"I'd look out for this"* in a 300-word passage is not a frontier-model task. Route to the cheapest capable model and **spend the savings on completeness rather than on cleverness.**

This is what catches implicit telegraphing, which is the entire point:

- *"I'd look out for this"* · *"be careful with the sign here"* · *"this trips people up every year"*
- **Distinctions drawn deliberately** — X vs Y comparisons are exam material almost by definition
- **Hypotheticals that are rehearsed exam questions** — *"what happens if we change the substrate?"*
- **Worked examples on the board** — near-certain exam formats
- **Explicit de-emphasis** — *"you don't need to memorise this"* — equally valuable, and inverse
- **Asides and tangents** — often where the wink lives, and precisely what a ranked filter discards

**Stage 4 — corroborate (no LLM).** Computed signals — time-per-slide, repetition across lectures, divergence from the deck, speaking-pace drop from word-level timestamps — **survive as supporting evidence displayed alongside a finding, never as a gate.** *"Flagged at 23:41; also the longest single stretch of the lecture and returned to twice."* A finding corroborated across two lectures outranks a singleton, and singletons are marked as such.

**Storage pyramid unchanged:** raw audio **local, never uploaded**; transcript stored but cold after extraction; **only the extracted layer is in the working set**, and term-level aggregation reads extracted rows — **never re-reads transcripts.**

**Timing:** transcription and segmentation at capture. **Analysis on demand and before exams**, not automatically on every lecture — this is now a *user-control* decision, not a cost one. **Never transcribe in the background without the user starting it.**

#### Descriptive, never predictive — which is why it needs no scoring (LOCKED · Andy, July 2026)

> **REJECTED — do not build: an accuracy ledger for emphasis detection.** An earlier draft scored flagged concepts against what appeared on each exam. **Andy killed it:** *"I don't want to do more work cross-referencing what I got vs what the transcription missed."* **He's right, and it violates the friction rule (§6.7)** — HQ has no way to know what was on your exam unless you tell it, and that is work nobody will do four times a term across five classes.

**The resolution is not to drop the feature. It is to drop the claim.**

A prediction (*"this will be on the exam"*) requires verification. **A report of what was said does not.**

- **Output is descriptive fact only:** *"Dr. Elamin spent 9 minutes on this slide and said 'be careful with the sign here' — 23:41."* Quote, timestamp, and the computed context. **The student draws the conclusion**, which is what they would do sitting in lecture anyway.
- **HQ never asserts importance, likelihood, or exam relevance.** No "high-yield" labels, no ranked "most likely on the exam" list, no confidence scores.
- **Therefore nothing needs a hit rate**, and the student is never asked to grade the app. **Zero added friction — the feature's entire cost to the user is pressing record.**
- **This is a search-and-index feature, not an intelligence feature.** It reorganises the lecture the student attended so the guidance is findable later. That is genuinely useful and it cannot be wrong.
- Consistent with §6.14: this is **observed** data — the professor's own words and measurable time — so it may state plainly. It is inference that must hedge, and by removing the inference the hedging problem disappears with it.

**If the feature ever grows a predictive claim, the §6.12 scoring obligation comes back with it.** Keep it descriptive and it stays free.

#### Honest limits

- **Tone is lost.** Speech-to-text discards intonation; only pace and pauses survive. Delivery signal is a **proxy for the wink, not the wink.**
- **Some professors don't telegraph at all.** The per-professor hit rate will correctly show near-zero for them, and the feature should then go quiet for that course rather than manufacture signal.
- **Never phrase output as a prediction.** *"Dr. Elamin spent 9 minutes here and returned to it twice — 'be careful with the sign' (23:41)"* is reportable. *"This will be on the exam"* is not, ever.

#### Constraints

- **Local storage is not a privacy problem** — GoodNotes does the same and nothing leaves the device. **Cloud transcription is different**, because the audio then reaches a third party. **Prefer on-device transcription**; when a cloud transcription service is used, say so plainly at the point of use (§6.12 data residency).
- **Some courses forbid recording in the syllabus.** That's institutional permission, not privacy, and the risk sits with the student. **One line in Settings, shown once — no per-course consent gate, no repeated prompts.** Uploading the instructor's own posted recording avoids the question entirely and is the preferred path.
- **Wispr Flow is the wrong tool here.** It is *dictation* — your voice into a focused text field — not a transcription service for recorded audio. Use a transcription API behind the provider-agnostic seam (`integration-map` §4). Wispr Flow remains tier 1 for typed input everywhere in HQ.
- **Emphasis claims must be evidenced and hedged.** Show the quote and the timestamp: *"'This is the kind of thing that shows up on an exam' — 14:22."* Counted signals (time, repetition) may state; inferred importance must hedge (§6.14 — this is inference over one lecture, not a measurement). **Never say "this will be on the exam."**
- **Optional, always.** Notes-taking by hand stays fully supported; nothing degrades for a student who never records.

### 4.1-N Class types — three, and only three (added July 2026 · SIMPLIFIED)

**The problem.** The whole model — topic → covered → recalled → tested — fits CHEM 261 and BIOL 202 exactly, and fits ENGL 105 or a gen ed not at all. A paper-driven course has deadlines and drafts, no units and no recall. **A student whose humanities courses look broken will conclude the app isn't for them**, and they'll stop adding those classes — which breaks GPA, BCPM, credit load, and the requirement audit, all of which need *every* class.

**The requirement (Andy):** every class a student takes goes in, always. What varies is which features that class turns on.

#### Three types. Not five.

| Type | What it turns on | Typical |
|---|---|---|
| **STEM** | The full memory layer — everything currently specified | CHEM, BIOL, PHYS, ORGO, MATH, most BCPM |
| **Writing** | Papers, drafts, readings, feedback | ENGL, HIST, seminars, most humanities |
| **General** | Grade, deadlines, materials, notes | gen eds, electives, P/F, labs, language, studio, the fun class |

> **An earlier draft proposed five types** (adding Language and Studio/Lab) **and a per-feature toggle checklist. Both were rejected — REJECTED July 2026, do not reintroduce.** Reason (Andy): *"if there are five different modes, five different configurations for a class, users obviously aren't going to know how to navigate around that."* Five specialised types optimise for accuracy at the cost of the thing that actually matters, which is that a student can pick correctly in one second without thinking. **Three buckets, generalised as far as they'll go.**

**Do not add a fourth type.** If a course shape seems unhandled, it goes in **General** — that is what General is for.

#### Variation within a type is just assignments — not a new type

*"For your bio final you might have a paper. For your chem final you might have a final project."* True, and it needs no mechanism at all. **A paper in a STEM class is an assignment with a due date and a weight** — the assignment system already handles it, in every type. Type decides which *study* features exist, never what work can be logged.

This is the whole reason three buckets are sufficient: **course-to-course variation lives in the assignment list, not in the type system.**

#### Naming — use the student's words

The picker says **STEM · Writing · General**. Not "Mastery," not "concept-driven," not a question about pedagogy. A student knows instantly whether they're adding a STEM class. An earlier draft argued department is an imperfect proxy — it is, and it doesn't matter: it's right nearly every time, it's understood without explanation, and a wrong pick is a one-tap fix.

#### What each type shows

**Universal — all three types, never gated.** These are why the class is in HQ at all:

- Syllabus, materials, notes, contacts, meeting times
- Assignments and deadlines, the grade ledger and what-if (§6.8), the regrade window
- GPA, **BCPM**, credit load, requirement satisfaction, the Tracker, Overview, the Planner
- Everything in `Grades & Archive`

**STEM** adds the full memory layer: topics and units, FSRS scheduling, the active recall runner (§4.1-J), the forgetting curve (§4.1-L), `Study method · UNPATCHED 2026` (§4.1-K), exam scope, coverage ledger, prerequisite decay, MCAT-relevance tagging. **This is the layout as currently specified — nothing changes for STEM classes.**

**Writing** turns those off and puts its own layer in their place. **Writing is not STEM-minus-features**, or taking English reads as a downgrade:

- **Draft stages** on each paper — outline → draft → revision → submitted, with the real deadline and your own earlier one
- **Reading tracker** — assigned readings by week, read/skimmed/not-started, with *"3 readings behind going into Thursday"*
- **Feedback log** ⭐ — what the professor's comments actually said, across papers, so recurring criticism becomes visible (*"thesis placement flagged on three papers"*). The strongest thing in Writing type: students receive this feedback weeks apart and never connect it.
- **Participation** where the syllabus weights it

**General** is the honest default: grade, deadlines, materials, notes, contacts. No study layer of any kind. **This is not a penalty box** — it's the correct amount of app for a class you're taking to fill a requirement, and it's where labs, language, and studio courses live until there's evidence they need more.

#### Picking it — one row of chips at add time

1. Enter the course code. HQ resolves title, credits, `bcpm`, requirement mapping from the catalog.
2. **One row of three chips**, with a suggestion preselected. That is the entire interaction — no wizard, no second screen, no sub-options.
3. `Add class`.

**Suggestion order:** parsed syllabus (§4.1-M) → course code → user's own history. Show the reason in one short line (*"Suggested Writing — papers are 55% of your grade, no final"*), because a visible reason gets corrected when wrong and a bare one gets accepted when wrong. **No confident answer → nothing preselected; ask rather than guess.**

Changeable any time from class settings. **Changes are non-destructive both ways** — switching STEM → General hides topics and recall history, never deletes it, and switching back restores it intact.

#### Same page, one tab different

The class page banner (§4.1-I) is **identical in all three types**. So are Overview, Materials, Assignments, and Notes.

| Type | Third sub-tab | Primary action |
|---|---|---|
| **STEM** | **Topics** | `Start review` |
| **Writing** | **Readings** | `Open current draft` |
| **General** | *(none — four tabs)* | `Add a grade` |

One page structure, one component set, three configurations. **Not three pages to maintain.**

#### Class cards and the daily list

- **Card**: same shell, same size, one differing signal line — `3 topics due · Exam in 6d` / `Draft due Thu · 2 readings behind` / `B+ · final Dec 12`. **No type badge** — the signal line already tells you what kind of class it is.
- **"What's due today" is ordered by urgency across all classes, never grouped by type.** A paper due tomorrow and three chem topics sit in one list. Each row carries its own verb — `Recall` · `Draft` · `Read` · `Log` — so the kind of work is obvious without ever naming the type. Grouping by type would be the app organising around its own schema instead of the student's day.

#### When the syllabus can't be parsed — the common Writing failure

**This is the most likely failure mode in Writing type and must be designed, not defaulted.** Topics in a STEM class come from units, which syllabi state plainly. **Readings often aren't stated in any parseable form** — a table screenshotted into a PDF, a bare "readings posted weekly on Sakai," or a reading list that lives in the LMS and never in the syllabus at all.

- **Never render an empty Readings tab as if extraction succeeded.** Say what happened: *"Your syllabus doesn't list readings by week — add them as you go, or paste the list."*
- **Three entry paths, all first-class:** paste a list (one per line, HQ splits and asks which week), add one inline as it's assigned, or `＋ Add this week's readings`. **Manual entry is not a fallback here — for many courses it is the primary path**, and it must feel like the intended one.
- **Partial parses keep what worked** (§4.1-M). Weeks 1–6 listed and the rest "TBA" → keep six weeks, say the rest are unlisted.
- **Reading debt (#58) degrades honestly.** With no complete reading list there is no denominator, so **the "3 behind" line is suppressed entirely** rather than computed against a partial list. It returns when the list is complete. Per §6.12: no number is better than a wrong one.
- **A Writing class with no readings at all is valid** — some are pure workshop. The Readings tab then shows its empty state and nothing anywhere implies something is missing.

The same rule generalises: **any feature whose input can fail to parse must state that it has no data, never imply the user has no work.**

#### Rules

- **Type is a view concern, never a data concern.** `Course` — grade, credits, `bcpm`, `satisfies[]` — is **type-blind by construction**. GPA, BCPM, requirement audit, Planner, and Overview must contain **no reads of `type` whatsoever**. If a calculation branches on type, that's a bug — and it's the specific bug that would make a humanities semester look like a failure.
- **Dormant means invisible, not empty.** A Writing class renders no greyed-out forgetting curve and no "0 topics ready" — those panels don't exist on that page (§6.10-A).
- **Say why once.** First non-STEM class added: *"Recall and review tools are off for this one — they're built for cumulative-concept courses. You can switch any time."* Once, dismissible, never repeated.
- **Never imply the class matters less.** It counts identically toward GPA, BCPM, and graduation.
- **Empty states are per-type.** A Writing class with no papers says *"No papers assigned yet"* — never a generic "no topics."
- **The attention budget (§6.11) is shared.** A paper due tomorrow outranks an interleaving suggestion every time.

### 4.2 Planning mode — the academic big-picture

Planning mode is **everything not actively being done** — the zoomed-out, read-mostly counterpart to Daily's hands-on studying. Two halves: **where you stand / how you're doing** (GPA, record, requirement progress, trend) and **a vision of what's ahead** (future/planned classes, on-pace-for-graduation-and-MCAT). Daily is where you *do* the work; Planning is where you *see the whole picture, past and future*. It is a calm outlook, **not** a heavy drag-around scheduler.

Philosophy (Andy): **better too much guidance than not enough — the worst you can do is decline it.** So Planning is as guided as possible, always optional. **Outlook is the default; suggestions are sprinkled in.**

#### Tabs — re-scoped by job (REVISED July 2026)

**Planner · Requirements · Grades & Archive.** The former "Planner & GPA / Requirements / Archive" split cut across jobs: *"what to take next term"* sat in the Tracker while the term-building sat in the Planner (split brain), and Archive was a thin destination that is really a filter on the ledger. Three jobs, three tabs:

| Tab | The one question it answers |
|---|---|
| **Planner** | *What do I take next term?* — build future terms, with requirement coverage and GPA projection live beside you. |
| **Requirements** | *What's left, and am I on pace?* — the audit. Standalone; checked a few times a semester. |
| **Grades & Archive** | *What have I earned?* — full ledger, cumulative/term/**AMCAS BCPM**, what-if, plus withdrawn/completed/superseded as a filter. |

> Do **not** merge Planner and Tracker into one page, and do not put the whole degree on one screen (`04` §10 cramming; same failure the class page's sub-tabs fixed).

#### C. Planner — purpose, logic, and candidate views

**Purpose (locked).** Not "arrange courses into buckets." It is: *sequence my remaining degree so prereqs finish before the MCAT, I graduate on time, my BCPM survives, and I don't get trapped by a prereq chain.*

##### C1. Layout — term columns (CHOSEN July 2026)

**Horizontally-scrolling term columns** (past → current → planned), one column per semester. This is the approved layout; alternatives were explored and set aside.

- **Course chips** carry code, name, `BCPM` marker, **what each clears** (`Med prereq` · `Major core` · a named gen-ed capacity), and the **`❄` offering flag**. Past terms show the earned grade and term GPA; future terms are editable with `＋ Add course`.
- **A per-term load line** with honest warnings: credits vs. on-time graduation, and BCPM-heavy terms.
- **The MCAT sits *in* the timeline** as a milestone divider between terms — the real deadline, so the plan is visibly built around it. A term after it can be deliberately planned light for prep.
- **Summer terms** are addable columns; a gap year is a modelled span.
- **An unplaced tray** sits below the columns — requirements with no term yet, always visible.
- **Right rail, live as you edit:** "If this plan holds" (projected cumulative + BCPM + graduation, labelled as assuming current averages, plus the prereq-vs-MCAT verdict) · "What this plan clears" (and what's *still* open after it) · ranked suggestions · watch-outs.

> Explored and set aside (July 2026): a **subway/track map** (prereq chains as connected tracks) — structurally honest but too metaphorical; a **requirements × terms matrix** and a **backward-from-MCAT** framing — both still viable as *secondary view toggles* if the columns prove too sparse, but not the default.

##### C2. Requirement satisfaction — "if you take this, it clears that" (LOCKED)

**The Planner and the Tracker stay separate surfaces** — the Tracker is the audit (*what's left, am I on pace*), the Planner is where you build (*what do I take*). But the Planner must **consume the Tracker's data** so every course states what it would satisfy, at the moment you're deciding.

**Behaviour:**
- Every course chip lists **what it clears** — `Med prereq` · `Major core` · the **named** gen-ed capacity (e.g. "Power and Society"), never a generic "gen ed."
- **Preview before committing.** Hovering/selecting a candidate course shows its marginal effect as a diff: *"adding this takes you from 14 requirements left → 12."*
- **Also show what it *unlocks*** (forward-looking, not just backward): "CHEM 262 → unlocks CHEM 430." This makes the cost of dropping a course visible at the moment you'd drop it.
- **Redundancy warning** — flag a planned course whose requirements are already satisfied ("you already have Quantitative Reasoning; this only adds credits").
- **Double-count rules must be encoded**, not assumed. Where UNC caps how many requirements one course may satisfy, the cap is applied and explained. Never inflate the "cleared" count.
- **Mapping confidence is labelled** exactly like the Tracker's (`✓ verified` / `◑ inferred — confirm with your advisor`). A wrong mapping costs a semester, so it is never presented as settled fact.

**Data dependency (new — required):** a **course → requirement mapping** dataset. `data/unc-requirements.json` defines the *requirements*; this defines which **courses** satisfy them, from the UNC catalog's per-course gen-ed attributes plus major/prereq lists. Category A, sourced, freshness-tracked (`implementation/data-refresh.md`), same annual catalog cadence. **A catalog change must flag plans built on the old mapping** rather than silently re-deriving them.

##### C3. Planner logic

- **Prereq-chain validation, at drop time** — warn *as* a course is placed, not after the plan is built ("CHEM 430 requires CHEM 262, which you've passed").
- **Critical path** — which course, if delayed, pushes everything downstream *including the MCAT date*.
- **Offering-term awareness (`❄`)** — which courses run fall-only / spring-only, with a warning when a plan assumes otherwise. **The most common way a pre-med loses a year** ("CHEM 430 is spring-only; miss Spring 2027 and biochem slips a full year, pushing your MCAT to 2029").
- **Unplaced requirements always visible** — the tray. The gap is never hidden.
- **Summer terms and a gap year are first-class planning slots.**
- **Scenario compare** — **named, saved plan versions** ("Plan A / Plan B"), restorable, compared side by side on MCAT date, BCPM, and graduation date, with the cost stated.
- **Load warnings** — credits vs. on-time graduation; **BCPM-heavy terms**.
- **Cross-pillar load** — a term stacking labs against heavy planned research/clinical hours is flagged; Academics can see this because the experience pillars share the app.
- **Retake / AMCAS awareness** — every attempt counts toward BCPM; a repeat does **not** replace the original.
- **Substitutes on tap** — a course fills constantly during registration; one tap gives alternatives satisfying the same requirement.
- **Registration-window nudge** — when enrolment opens for a planned term, surface it with that term's planned courses ready to copy. *This is what converts a plan into action; without it the page is a nice diagram.*
- **Lock a term** — freeze a semester you've actually registered for so suggestions and rebalancing never touch it.
- **Term notes** — "why I planned it this way," because the reasoning is forgotten by next year.
- **Export for your advisor** — a clean one-page version to bring to pre-health advising.
- **"If this plan holds"** — projected cumulative + BCPM (labelled as assuming current averages), graduation date, and the prereq-completion verdict relative to the MCAT.
- Nothing is enforced; every suggestion is optional (philosophy above).

#### A. Requirement audit — rebuild from research (Requirements)

Current state: **broken / not functional / misaligned with UNC's real requirements.** Cause: it's modeled on the retired "Making Connections" curriculum. UNC's live curriculum is **IDEAs in Action** (Fall 2022+, applies to every current student). Requirements also shift (e.g., the UNC System dropped the U.S. Diversity requirement in 2025), so this needs a real rebuild against the current catalog, not a patch.

- **Model IDEAs in Action fully:** First-Year Foundations (First-Year Seminar/Launch, University Writing, Global Language, Triple-I "Ideas, Information & Inquiry", College Thriving), Focus Capacities, Reflection & Integration, Supplemental Gen Ed (B.A.), plus grading rules (IDEAs courses can't be Pass/Fail).
- **Plus med prerequisites** (bio, gen/orgo chem, physics, biochem, math/stats, English, psych/soc) and **per-major requirements.**
- **"Every major":** build the requirement data model so *any* UNC major plugs in as data; populate the shared gen-ed + med prereqs first, then common pre-med majors, expandable to all UNC majors over time (later Atlas-sourced). Still UNC-only — comprehensive across UNC majors, not multi-institution.
- **Deliverable:** a structured, sourced requirements dataset (research task against `catalog.unc.edu`) driving a real done/remaining audit. **Built: `data/unc-requirements.json`** — IDEAs in Action gen-ed (4 groups: First-Year Foundations, Focus Capacities, Reflection & Integration, Additional), 9 med prereqs, 6 majors. Category A, freshness-tracked, annual refresh against the catalog.

##### Tracker layout — gap-and-pace first, everything still present (APPROVED July 2026)

A requirement audit is normally a dead checklist. This one must answer three questions at once, so it leads with the answers and keeps the lists below:

1. **Status row** — requirements left · **prereqs left before the MCAT** · credits · **double-counted count** · degree progress (met / planned / open).
2. **"Am I on pace?"** — measured against the **MCAT date, not graduation**. States the verdict plainly ("the 3 remaining prereqs fit in Spring + Fall 2027, done 5 months before your MCAT") and flags anything unscheduled.
3. **"What to take next term"** — ranked by boxes cleared, each with its reason.
4. **Overlap panel** — *the thing no UNC tool does*: one course often satisfies a major requirement, a med prereq, and a gen-ed simultaneously. Show the count and the total boxes cleared "for free"; every requirement row carries its `also:` line.
5. **All requirements** — the full sets (med prereqs, major, each IDEAs in Action group) with per-set progress, `met / planned / unmet` states, and the satisfying course named.

**Data confidence is labeled, never hidden** (`architecture/02` trust separation):
- Verified sets (gen-ed, med prereqs, Neuroscience — Claude-verified live from `catalog.unc.edu`) carry a **✓ Verified** chip and the verification date.
- Unverified majors carry **◑ Not yet verified** plus a plain warning to confirm against the official degree audit, and a one-tap **"I confirmed this"**. They are still shown and usable — never hidden, never silently presented as fact.
- The panel header shows `last verified <date>` with a **re-check** action (`implementation/data-refresh.md`).

#### B. Guided planning & suggestions (Atlas-powered)

The forward-looking half. Read-mostly outlook by default, with an optional, richly-guided suggestion engine:

- **Outlook (default):** future/planned classes laid out by term; gentle heads-up if something's off (missing prereq, prereq-order error, heavy term, off-pace for grad/MCAT). Mostly a clear view of what's coming.
- **Suggestions (sprinkled, optional):**
  - **Interests questionnaire** — "what are you into?" (updatable), so suggestions reflect the person, not just requirements.
  - **Course-description intelligence** — reads UNC course descriptions (Atlas knowledge) to recommend classes/seminars/electives you'd genuinely enjoy, not just requirement-fillers.
  - **Conversational advisor** — talk to an agent about your schedule ("what should I take next spring?"); it knows your record, interests, requirement gaps, and pacing. This is the **Atlas Assistant** applied to academics.
  - **Preference learning** — learns what you like over time (`02` personalization) and improves suggestions.
  - **Suggested path** — an optional recommended semester-by-semester sequence to finish prereqs before the MCAT and graduate on time; shown as a suggestion to eyeball and tweak, never enforced.
- Ties: this suggestion engine + prereq sequencing is what **generates the academic Overview roadmap milestones** (Timeline). Course knowledge + advisor are Atlas surfaces (phased).

#### D. The record must be AMCAS-shaped from day one (added July 2026) ⭐

**The whole argument in one line:** AMCAS makes you hand-enter every course from every institution — exact course number, title *as printed on the transcript*, credit hours, grade as recorded — and AAMC states that omissions or wrong grades can alter your GPAs and cause delayed processing or missed deadlines. Students do this from memory and PDFs **three years after the fact**. **If HQ stores those exact fields at enrollment, the entire section becomes an export.**

This costs almost nothing at the moment a course is added, and is unrecoverable later. It is the clearest case in the app of *capture now or reconstruct badly*.

**Transcript-fidelity fields — captured at enrollment, on every course:**

- Institution (**every** postsecondary institution, not just UNC)
- Course number **exactly as the transcript prints it**
- Course title **exactly as the transcript prints it** — not the catalog title, not your shorthand
- Credit hours as recorded · grade as recorded · term and year
- Course type (regular · AP · transfer · dual enrollment · repeat · withdrawal · P/F)
- **A scan or photo of the transcript line** where available

**Do not normalise, prettify, or auto-correct these.** A cleaned-up title is a wrong title for this purpose. HQ's display name is a **separate field** from the transcript string.

**Classification at enrollment, with evidence.** AMCAS classifies by **course content, not title or department** — the live question for a neuroscience major, where some courses classify as Biology and some as Other. So classify each course *when you take it*, and store **the syllabus and your reasoning alongside it**. If AMCAS reclassifies something later your science GPA moves, and you'll want the evidence to appeal or to understand it.

**Dual GPA, permanently side by side.** UNC's GPA and the AMCAS GPA are different numbers and students discover the gap in **May of their application year**, which is the worst possible time.

- **Every attempt of a repeated course counts** — there is no AMCAS grade replacement, unlike UNC's policy (existing #7).
- **All institutions are included.**
- **AMCAS truncates rather than rounds** — 3.667 reports as **3.66**, not 3.67.
- Show both numbers continuously **with the delta explained in one line**, never one number alone.

**Grade trend by academic year.** AMCAS reports GPA broken out by year, and admissions committees read the **trajectory**, not the endpoint. Render the shape. A rough freshman fall inside a rising trend is a materially different situation from a flat 3.4 — and #38 already holds the data to say so.

#### E. MCAT decay mapping (#64) — the one that needs its own design

**What it is:** prerequisite decay (#21) re-pointed from *your next course* to *your MCAT date*. Output is a **ranked list of courses whose content you will be relearning from zero**, available years before prep starts.

**Rank, don't score — this is the whole design constraint.** For a course finished two years ago, HQ has **no retention data**, because you weren't reviewing it. Claiming *"you retain 23% of PSYC 101"* would be invented precision and would violate §6.12 on the app's most consequential planning number.

So there are two honest cases, and they must be visibly different:

| | What HQ has | What it may say |
|---|---|---|
| **Course tracked in HQ** | topic-level FSRS state | projected retrievability **as a band**, per §4.1-L |
| **Course taken before HQ, or never reviewed** | dates and content weights only | **relative rank only** — *"taken 2.5 years before your test date · ~65% of Psych/Soc · expect substantial relearning"* |

**The ranking inputs are all things HQ already holds:** AAMC content share (`data/mcat-content.json`) × months between course completion and test date, with actual retrievability substituted wherever it exists. **No new model, no second decay engine** — reuse #21's.

**Two surfaces, two jobs:**

- **MCAT → Content** — *"here's your self-study order."* Feeds the study plan; pairs with #68's coverage gaps (untaken content ranks above decayed content, since 0% is worse than rusty).
- **Planner (§4.2-C)** — *"here's what this scheduling choice costs you later."* Taking biochem the year before your MCAT vs three years before is a materially different amount of future work. **This is the higher-value placement** and the one nobody else can offer.

**Must not:**

- **Never advise against taking a course.** Sequencing is one input among many — major requirements, prereqs, load, interest — and HQ sees only one of them.
- **Never imply cramming is the fix.** The honest framing is *plan the relearning*, not *avoid the decay*.
- **Never state a retention percentage for an untracked course.** Rank is defensible; a number is not.
- **Do not gate it behind an MCAT date.** With no date set, use the roadmap's projected window and say so.

#### The caveat that outranks all of the above (LOCKED)

**AMCAS mechanics change between cycles, and Andy's cycle is ~2029.** Anything written here is a snapshot of July 2026.

- **Classification rules, GPA logic, category definitions, and course-type handling are configurable DATA, never hardcoded logic.** A rule change must be a data edit, not a code change.
- **Category A** with freshness metadata (`implementation/data-refresh.md`), sourced from the **official AAMC Course Classification Guide and Applicant Guide**.
- **Cite the guide version in the UI** wherever an AMCAS-derived number is shown.
- **Prompt to verify against the official guide in the application year.** HQ's job is to have captured the right raw data — the arithmetic on top of it is re-derivable, the transcript strings are not.
- **Verify the "50% of content" classification threshold against the official guide before implementing** — it is widely cited but was not confirmable from primary sources in the July 2026 check.

---

## 5. Primary metrics (per `04` — Academics-appropriate)

- **AMCAS cumulative GPA** and **science (BCPM) GPA** — deterministic; the canonical outputs.
- Credits (total, in-residence, per term), academic trend, course sequencing, repeats/withdrawals, transfer/AP credit.
- Requirement completion (UNC gen-ed, major, med-prereq) — transparent components, not a single score.

GPA visualizations belong to Academics; never center hours here.

---

## 6. Smart features (intelligence layer)

All rules-based and **explainable** (`02`); each states why it fired. Confirmed for build:

1. **Prereq pacing vs. MCAT/app timing** — ties course sequencing to roadmap milestones: "CHEM 430 (Biochem) is your last MCAT-content prereq — take it by Spring 2029 to sit the MCAT on your timeline." Feeds/derives from Timeline roadmap milestones.
2. **Science-GPA (BCPM) watch** — flags a BCPM drop and names the course dragging it; BCPM is weighted heavily in admissions.
3. **Requirement gap alerts** — from the Tracker audit: "missing one upper-level bio for the major," "a med prereq isn't scheduled yet."
4. **Term load balance** — "Fall 2027 has 3 BCPM-heavy courses — a demanding term," warned before you commit.
5. **Upward-trend detection** — spots an improving GPA trajectory and flags it as an application/essay strength (cross-links to Essays); warns early on a downward slide.
6. **Graduation & credit pace** — on track to hit credits/degree requirements by the matriculation target?
7. **AMCAS retake reality** — AMCAS counts *every* attempt (unlike UNC grade replacement); models the true cumulative impact of a retake so expectations are honest. Uses What-if.
8. **BCPM classification check** — data-quality guard that each course is correctly tagged science/non-science, so the BCPM GPA feeding Overview/Profile/School List is accurate.
9. **Live semester GPA projection** — from in-progress assignment grades in Class Center, projects the current term's GPA and its cumulative effect *before* finals, while you can still act.
10. **MCAT content-coverage map** — which MCAT-content courses (bio, biochem, gen/orgo chem, physics, psych, soc, stats) are done vs. pending; feeds MCAT readiness. Ties Academics ↔ MCAT.
11. **UNC course difficulty intel (Atlas)** — crowd-sourced knowledge from other UNC pre-meds via Atlas: "CHEM 251 is a known GPA-dip — plan a lighter term around it." Atlas-grounded (phased); the exact community wisdom Atlas exists to hold.
12. **Prereq-order validation** — flags a course planned before its prerequisite (CHEM 262 before 261), or a chain that won't finish before the MCAT date.

**Added July 2026 — the study-behaviour layer.** The first twelve are about *the record* (grades, requirements, sequencing). These eight are about *the habit*, and they're what make the app change behaviour rather than just track it:

13. **Post-lecture capture window** — within 24h of a scheduled lecture, one tap to mark what was covered. Coverage decays because people forget to log, not because they refuse; this is the highest-leverage nudge in the tab.
14. **Pre-lecture priming reminder** — lecture tomorrow → surfaces that module's priming/pretest/predict prompts (§6.6). Without this the pre-lecture features never fire at the moment they'd work.
15. **Office-hours nudge** — you have N open "Questions to ask" saved and office hours are tomorrow. Connects a note you already wrote to the moment it's useful. **⭐ Aug 2026 — this nudge is now load-bearing for Letters (`10-letters.md` `LT-30`).** Questions may arrive **suggested** from a person's record in Letters (accept or ignore, never auto-accepted, never pre-checked, **no second notification** — it rides this trigger). **Checking one off bumps `lastContactAt` on that person and appends what was discussed to their notes.** **Do not add a reflection prompt on check** — `LT-25` was cut for that.
16. **Interleaving check** — five consecutive sessions in one class; interleaving beats blocking for retention. Suggests a mix, never blocks.
17. **Exam autopsy** — after a graded exam, compare topics you'd flagged weak against those that actually appeared. Calibration at *exam* level, not card level: "you predicted 3 of the 5 hardest."
18. **Deadline collision** — three items due the same day across classes, surfaced a week out while it's still fixable.
19. **W-deadline awareness** — the withdrawal deadline is approaching while a class trends badly. High-stakes, time-boxed, and nothing else in a student's life tracks it. Must state UNC's W-limit context (§6.1) without advising the decision.
20. **Best-time-of-day retention** — from `ReviewEvent` timestamps already stored: when your recall actually succeeds. Descriptive only, never prescriptive.

**Added July 2026 — the cycle & memory layer.** These read the learning cycle (§6.6) and the retrievability data you're already storing. Several answer questions no study app currently asks:

21. **Prerequisite decay** — *the strongest one here.* You're in CHEM 262 while your CHEM 261 topics have decayed to ~40% retrievability. This is precisely why students struggle in sequence courses: the foundation quietly rotted while they focused on the new material. Surfaces the specific prior topics the current unit depends on, using `TopicLink` prerequisite relations. **Nothing else in the market does this.**
22. **Cross-class concept overlap — semantic, not title-matching.** The same concept appears in two classes (amino acids in CHEM 430 and protein structure in BIOL 252). Review once, credit both, and *notice* the connection — which is itself the Connect step.
    - **Title matching would miss this entirely** — "amino acid chemistry" and "protein structure" share no words. Detection runs on **embeddings across `courseId` boundaries** using the pgvector layer already built for retrieval (§6.3). This is the one smart feature that genuinely needs the AI layer.
    - **Propose, never merge.** HQ surfaces the candidate pair with its evidence ("these share 4 key points"); the user confirms, and confirmation writes a `TopicLink` with relation `same-mechanism` or `shared-mcat-category`. **Never auto-merge topics** — a wrong merge corrupts two classes' review schedules at once.
    - **Degrades cleanly:** with no API, fall back to exact-title and MCAT-content-category matches only, and say so rather than pretending coverage is complete.
23. **Cycle stall** — a topic sat at "covered" for two weeks and was never recalled. The single most common failure mode: material gets taught, logged, and never touched again.
24. **Skipped-stage notice** — jumping to practice questions on a topic never actively recalled. Practice questions on unlearned material teaches the *lookup*, not the recall. Informational, never blocking.
25. **Cram detection** — a unit's first exposure is happening within 48h of its exam. States the honest consequence (cramming produces exam-day recall and near-total loss afterwards — which matters because this content returns on the MCAT).
26. **Re-read detection** — a class where materials get opened often but recall sessions are rare. Re-reading feels productive and is the least effective common strategy; naming that is the single highest-value teaching moment in the app.
27. **Topic difficulty outlier** — this topic needs 3× your average reps to reach ready. Not a failure signal — a flag that the material may need a different *approach* (Feynman or Connect) rather than more repetitions.
28. **Confidence drift per class** — calibration tracked by class, since people are systematically overconfident in some subjects and underconfident in others.
29. **Forgetting-curve preview** — for a chosen topic, where retrievability will be on exam day at the current review pace. Deterministic from FSRS; answers "will I still know this on Friday?"
30. **Material staleness** — files uploaded but never opened, or notes never linked to any topic (orphans). Small, but it's how a coworking space silently becomes a junk drawer.
31. **Weekly ritual** — one Sunday prompt: what's coming, what's stalled, what's decayed. **The only scheduled/recurring nudge in the tab** — everything else is event-driven, and this one exists because planning has no natural trigger.

**Added July 2026 — exam, workload, and self-knowledge.** The last wave. Several of these exist nowhere else because they require the app to hold *both* the academic record and the study history:

32. **Exam-day readiness forecast** — for each exam-scope topic, projected retrievability *on the exam date* (§4.1-L), rolled into one honest number: "at your current pace, 6 of 9 will be above 80% on Friday." Turns FSRS into a decision, not a schedule.
33. **Review-debt** — the hours needed to clear everything currently due, compared with the hours you actually have before the next deadline. The academic analogue of technical debt, and it grows silently.
34. **Optimal session length** — from `ReviewEvent` data, where your accuracy starts falling within a session. Descriptive: "your recall drops after ~35 minutes."
35. **Effort-to-outcome** — hours logged per class against grade earned. Names the class where effort isn't converting, which is usually a *method* problem, not an effort problem.
36. **Lecture-lab lag** — the lab is covering material the lecture taught two weeks ago (or hasn't yet). Common in science courses and quietly confusing.
37. **Assignment-to-topic linkage** — this problem set covers Units 5–6, so schedule those topics *before* it's due rather than after.
38. **Grade-trajectory early warning** — the trend across graded work, projected forward, surfaced while the withdrawal deadline is still open (pairs with #19).
39. **Concept-map gaps** — topics with **no `TopicLink` at all** are isolated islands. Isolated knowledge is fragile; this is the Connect step's own coverage meter.
40. **Question-quality nudge** — your saved office-hours questions are all factual lookups ("what is X?"). Nudge toward mechanism questions ("why does X happen when Y?"), which is what separates memorisers from understanders.
41. **Post-exam decay check** — two weeks after an exam, retrievability of *tested* material. Answers whether you learned it or rented it — and it matters because most of this content returns on the MCAT.
42. **Syllabus change detection** — the uploaded syllabus differs from a newer version; flag what changed (dates, weights, scope) rather than silently re-parsing.
43. **Term retrospective** — at term end, one honest page: what worked, which methods correlated with your best outcomes, what to carry into next term. The only backward-looking surface in the tab, and the one that makes the next semester better.

**Added July 2026 — grade-ledger and mistake-log features.** All deterministic, all cheap once §6.8 and `AcademicMistake` exist:

44. **Regrade window** — graded work returned, dispute deadline in N days. Points genuinely on the table and nothing else in a student's life tracks it.
45. **Mathematically irrelevant** — this assignment can no longer change your letter grade. Frees you to deprioritise it honestly.
46. **Highest leverage** — of everything left, this single item moves your grade most. The inverse of #45 and the more useful half.
47. **Mistake-cause profile** — your errors by cause, per class. *"Half your CHEM losses are misreads, not knowledge."* That's a completely different fix from more studying, and no topic-level weakness flag could ever reveal it.
48. **Blanking vs not-knowing split** — the single most actionable cut in the taxonomy: `knew-it-but-blanked` means retrieval practice, `didnt-know` means content review. Students conflate these constantly and study the wrong thing.
49. **Professor-model insight** — from `ProfessorModel` once sample size allows: *"Dr. Elamin's exams have tracked lecture over textbook in 3 of 3 exams."* Evidence from your own graded work, with the sample size shown.
50. **Policy-aware projection** — the grade projection visibly applies drop-lowest, replacement, and curve rules, and **says which it applied**. A projection that silently ignores a policy is worse than no projection.

**Added July 2026 — lifecycle, attention, and trust features.** These implement §§6.10–6.12 where they surface as UI:

51. **Amnesty on return** ⭐ — **now shell-owned** (`00-product-shell.md` §7.10, Aug 2026). The trigger, threshold, bulk-clear, and no-count/no-streak rules are the shell's; Academics supplies which courses went quiet and any external date that moved into range while the student was away (§6.10-B). Still **the single highest-value behaviour touching this tab** — it is the difference between a user who comes back and one who doesn't — but it is no longer an Academics feature.
52. **Forecast accuracy ledger** ⭐ — every prediction logged against what actually happened, hit rate shown. **Scores per-review retrievability predictions, not monthly exam forecasts**, so it has ~100 resolved data points within two weeks and says something useful by week four (§6.12). Below the sample/accuracy gate, forecasts are **suppressed entirely** rather than shown with a caveat. Nobody builds this; it is what separates a tool from a horoscope.
53. **Dormancy notices** — a feature with insufficient data says *"needs two more reviews before this means anything,"* never a zero or an empty chart.
54. **Nudge auction** — the interruption ranking that enforces the 3-per-week cap (§6.11); losers roll into the Sunday digest (#31), and any rule dismissed 3× is retired permanently.
55. **Term rollover ritual** — the December flow: archive courses, keep topics queryable for prereq decay (#21), fire the retrospective (#43), resolve or archive every loose end.
56. **Shareable syllabus parse** — one person uploads the CHEM 262 syllabus; everyone else in the section imports the parsed units, dates, and weights. Kills the app's worst friction, and is **the only social feature that doesn't import pre-med comparison anxiety** — you're sharing the professor's document, not your grades. See §4.1-M.

**Added July 2026 — Writing-type features (§4.1-N).** Only for `type: 'writing'`; deterministic, no API:

57. **Draft-stage tracking** — outline → draft → revision → submitted, with your self-imposed deadline shown separately from the professor's. The Writing-mode answer to "am I behind," and the one thing paper-driven courses actually need.
58. **Reading debt** — *"three readings behind going into Thursday's discussion."* Observed against the syllabus reading list, not self-reported.
59. **Recurring feedback themes** ⭐ — the same criticism across multiple papers, surfaced only once it repeats. *"Thesis placement flagged on three papers."* Students receive this feedback repeatedly and never aggregate it; the app can, and it's the highest-value thing in Writing mode.
60. **Usage instrumentation (for the builder, not the user)** — every feature surface records opened / dismissed / acted-on, **stored locally, owned by the user, exportable, no telemetry off-device without opt-in**. In three months this says which features are dead weight, which is a better roadmap than any list written today. **Build this from day one** — it cannot be added retroactively, because the data would start from zero.

**Added July 2026 — external data (§4.1-O and research tasks).** These reduce manual entry or tell the student something the app cannot know on its own:

61. **Canvas sync** ⭐ — assignments, due dates, submissions, posted grades, and group weights pulled read-only from Canvas with the student's own token (§4.1-O). **Makes the grade ledger, deadline collision (#18), grade trajectory (#38), and the regrade window (#44) work in week one with zero typing.** The single largest reduction in friction available (§6.7).
62. **Course grade distributions** — UNC publishes historical grade distributions by course and section. *"This course averages a B−; your instructor's section runs about half a letter below the other."* Reframes a mediocre grade honestly and is genuinely useful at registration. **RESEARCH TASK before building** — confirm what is currently published, in what form, and under what licence; Category A with freshness metadata (`implementation/data-refresh.md`). **Do not scrape a student-built tool without checking its terms.** If the data isn't cleanly available, cut the feature rather than approximate it.
63. **Registration-day plan** — enrollment window, section conflicts, closed sections, waitlists, and **ranked backups decided in advance**. Small feature, high stakes: the decision gets made in a four-minute panic at 7am, and **it is the one moment a student opens the app without being nudged.** Builds on the Planner (§4.2-C1) and the registration-window nudge already specced there.

**Added July 2026 — MCAT decay and the AMCAS-shaped record (§4.2-D).** The first is the strongest feature in the tab; the rest are unglamorous and prevent a real disaster:

64. **Coursework decay measured against the MCAT** ⭐⭐ — **the single most defensible feature in the app.** Prerequisite decay (#21) currently points at your *next course*. Point it at the **MCAT** instead. You take PSYC 101 in fall 2026 and sit the MCAT in early 2029 — 2.5 years of decay on material that is ~65% of an entire section. Same for biochem (~25% of two sections), and gen chem and physics taken freshman year. Output is a **ranked list of courses whose content you will be relearning from zero, weighted by MCAT content share × time since completion.**
    - **No prep company can produce this** — they don't have your coursework timeline. **No gradebook can** — it has no retention data. It is the sharpest instance of HQ holding both halves.
    - **It changes course selection.** Taking biochem the year before your MCAT versus three years before is a materially different amount of future work, and nobody currently makes that call on purpose. Surface it in the **Planner** (§4.2-C), not just as a warning.
    - **Cheap:** re-points an engine already specified. Needs the AAMC content weights already in `data/mcat-content.json` plus term dates already stored.
65. **Transcript-fidelity export** ⭐ — the AMCAS Coursework section generated from fields captured at enrollment (§4.2-D). Unglamorous; prevents delayed processing and wrong GPAs. **The value is entirely in having captured the data years earlier**, so the capture ships even if the export doesn't.
66. **Dual GPA, always paired** — UNC GPA and AMCAS GPA side by side with the delta explained: every attempt counted, all institutions, **truncated not rounded**. Prevents the May-of-application-year discovery.
67. **Grade trend by academic year** — AMCAS reports by year and adcoms read trajectory. Renders the shape rather than a single number; pairs with #38.
68. **MCAT content coverage map, extended** — deepens #10: map completed coursework onto **AAMC content categories** so uncovered ones become a known self-study list years ahead. **Sociology is the classic gap** — ~30% of a section, and most pre-meds never take it. Feeds #64 directly.

**Added July 2026 — new surfaces (§§4.1-J expanded, 4.1-P, 4.1-Q, 4.1-R) and the ahead-of-pace principle:**

69. **Exam & resource catalog** (§4.1-P) — real exams and practice material per class, tagged by unit, takeable in timed mode with misses routed into `AcademicMistake`. **The highest-signal input the mistake features will ever get.**
70. **Historical exam-scope evidence** — once several past exams are tagged: *"the last three exams drew 40% from Unit 2, which your syllabus lists as minor."* **Makes exam scope verifiable rather than declared.**
71. **Searchable lecture index** ⭐ (§4.1-Q) — what the professor actually said, organised by topic and linked to the slides, with guidance moments surfaced by quote and timestamp. **Descriptive only — never predicts exam content, so it never needs verifying.** Rewards the student who attends and listens, which nothing else does.
72. **Automatic lecture coverage** — recorded lectures feed the coverage ledger directly, making the #13 nudge unnecessary for those classes. Proposes, never applies.
73. **Catch-up triage** — *"three weeks behind, exam in ten days"*: what to skip permanently, what to skim, what to genuinely learn. **Deliberately small (§6.15)** — being behind in HQ usually means being on pace with everyone else. **Must be willing to say what to abandon**, which no study app will.
74. **Guided walkthrough** (`00-product-shell`) — replayable click-through tour, mascot-narrated, covering both **how to use HQ** and **how to study**. The app is dense; a first-run tour is not optional.
75. **Study session timer** (§4.1-J) — runs inside the review session, tied to class and topic; Pomodoro settings live in the session's own preferences. **The app's only source of study-hours data** — #33, #34, and #35 are unbuildable without it. **Focus sessions** (timer only, no recall loop) exist so reading and problem-set hours aren't systematically missing.
76. **Concept canvas** (§4.1-J) — a fourth composer affordance: draw a map from memory, graded against the scope chips into the same gap report. **The Connect step of UNPATCHED 2026**, which had no surface. Uploading a GoodNotes map is equal to drawing in-app.
77. **Exam prep mode** (§4.1-R) — the destination `Build exam plan` never had. Day-by-day plan sized to real available hours, **re-planning rather than accumulating backlog**, closing into the autopsy (#17).

**Restraint:** these are behaviour nudges, so the bar for firing is high — each is dismissible, each states its cause, and none may fire more than once per cycle (`01` §4d, `04` §10). **All of #21–77 are deterministic except #22** (semantic overlap), which needs embeddings and degrades to title/category matching without them. **Every nudge-type feature is subject to the §6.11 attention budget** — a feature that fires is a feature that won an auction, not a feature that had something to say.

### 6.2 Study & recall tools (Class Center, Claude-powered)

Confirmed for build — all generate from a class's own materials/notes/topics, all explainable:

1. **Generate study guide** — reads the class's uploaded files/notes/topics → structured study guide. The flagship "generate" button.
2. **Quiz me / practice questions** — per topic; your performance auto-updates that topic's Weak/Ready status and feeds FSRS scheduling.
3. **Summarize / explain a file** — point at a slide deck or reading → summary or plain explanation; turns dense material into something reviewable fast.
4. **Active-recall review sessions** — FSRS surfaces what's due; Claude prompts recall (free-response/Q&A), grades it, reschedules. The daily loop.
5. **Free-recall / blurting cues** — a cue (topic name or starter) → you brain-dump on a blank page → Claude checks your dump against your materials and highlights gaps. Pure active recall.
6. **Feynman / teach-back** — explain a concept simply → Claude flags where it's fuzzy or wrong; exposes the illusion of knowing.
7. **Auto-flashcards → Anki export** — Claude turns notes/materials into flashcards (incl. cloze), **tags them, and exports an Anki-import text file** (tab-separated, no API). **One-directional; HQ never reviews cards** (§5h in `02-mcat.md`).
8. **FSRS study-session planner** — "you have 90 minutes" → an optimal, interleaved mix of what's due across classes (interleaving beats blocking for retention).

Study-tool candidates (keep adding): confidence calibration (rate confidence before reveal, track over/under-confidence); concept map of related topics per class (mini knowledge graph, ties to Atlas); high-yield/exam-likely flagging from syllabus + Atlas course intel; spaced re-surfacing of past quiz mistakes (per-class mistake log); mastery/retrievability-over-time visualization; "explain to the exam / to the professor" leveled explanations.

### 6.3 AI architecture (LOCKED July 2026)

**Providers.** **Anthropic is primary**, using the **Citations API** — source documents are passed in and Claude returns structured citation objects with **character-level offsets**, guaranteed at the API layer. That is what powers the clickable "from your materials" provenance chips (§4.1-J). **OpenAI is an optional drop-in** the user can supply instead/additionally; keep the orchestration provider-agnostic per `architecture/02`.

**Explicitly rejected:**
- **NotebookLM / Gemini Notebook** — no public consumer API (Enterprise only). Not usable. Its appeal (source-only answers) is a *technique*, not a product feature — retrieval + strict instruction + citations reproduces it.
- **Multi-model cross-checking on every response** — triple cost, triple latency, multiple keys, and no principled tiebreak. Replaced by **provenance labelling** (materials vs general knowledge) plus an on-demand, per-claim **"second opinion"**.
- **Gemini File Search** as the retrieval layer — unnecessary; Supabase is already in-stack.

**Retrieval.** **Supabase pgvector** (already in the stack — no new vendor). Chunks carry `courseId` + `topicId`; retrieval at review time is **scoped to the topic**, not the whole drive.

**Output contract.** Every study-tool call returns **schema-constrained JSON** (e.g. `{covered, missed, wrong, suggestedGrade}` with a citation per item), never prose — so the UI can render it reliably.

**Generation policy for Academics — PERMISSIVE (revised July 2026).** The earlier app-wide "AI may only generate M2M drills + flashcards" rule was **too restrictive for Academics** and is lifted here. That rule exists because *MCAT* practice must mirror a real standardized exam; coursework has no such constraint.

**Within Academics, AI may generate any study artifact for a specific class:** practice exams, practice problems, problem sets, quizzes, worksheets, study guides, summaries, explanations, flashcards, and recall prompts.

Three guardrails, and only three:
1. **Grounded in that class's own materials.** Generated work derives from the uploaded syllabus, slides, readings, and notes — not invented from thin air. Where possible it carries citations like any other output.
2. **Labelled `Generated`.** The `AcademicFile` ownership marker (`course | mine | generated`) already exists — generated artifacts always carry it, so you can never mistake AI output for your professor's material.
3. **Never presented as the real thing.** A generated practice exam is never labelled or implied to be an actual past paper or the upcoming exam.

**The MCAT restriction is unchanged and stays scoped to MCAT** (`tabs/02-mcat.md` §2a): no AI-generated QBank questions or CARS passages there — those must be externally sourced. AI in MCAT remains limited to M2M drills + flashcards.

**Secrets & hosting (RESOLVED July 2026).** Premed HQ is a **static** deploy (GitHub Pages). **Provider API keys must never reach the browser bundle or localStorage** — an XSS in a static app would leak them. Therefore:

- Provider calls go through a **server-side proxy** (Supabase **Edge Function**) that owns the secrets, performs the topic-scoped retrieval, validates the response, and returns typed JSON.
- **D6 ships server-configured provider secrets only.** The earlier "user pastes their own API key in Settings" model is **deferred** — it needs a secure per-user credential vault, which is its own chunk. (It also fits the metered/paywall model in `architecture/08` better than BYO-key.)
- The Edge Function **must enforce usage limits** — per-user rate limiting and a request cap. With server-held keys, a runaway loop bills the operator, not the user.
- **Supabase is an optional acceleration layer.** localStorage stays canonical for user-facing records; remote embeddings/retrieval are not required for signed-out operation.

**No model output ever mutates stored data directly.** Extraction and topic mapping return **proposals for confirmation** (permission-first, `architecture/02`). Malformed responses become a typed failure state — **never rendered as prose**.

**Degradation.** The app must be fully usable with **zero keys and no Supabase configuration**: FSRS scheduling, the coverage ledger, calibration, timers, the summary, and manual review all work. AI adds the gap check, extraction, and generation.

### 6.5 Grades & the what-if calculator (weight-aware — LOCKED)

Lives in the class page's **Assignments** tab. **Category-based, because syllabus weights are per category, not per assignment.**

- **Reads the syllabus** (from import) for categories + weights; validates they **sum to 100%** and flags it if not. Manual weight entry if the syllabus didn't parse.
- Shows what is **locked in**: "37% of the grade is in · 32.3 points earned · standing 87.4% · B+".
- **You set assumptions per category**, not per assignment: remaining problem sets, remaining labs, Midterm 2, Final.
- Answers the real question directly: **"to land an A− you need 91.6% average across everything remaining — 63% of the grade is still unearned."**
- Shows the **GPA knock-on** (cumulative + BCPM).
- Explicitly **hypothetical** — nothing is saved to the record.

### 6.4 Coverage ledger — "nothing gets lost" (LOCKED)

The guarantee: **every piece of uploaded material is seen at least once**, because exams throw curveballs.

- **Chunks are never dropped, only labeled.** Topic assignment is a *label*, never a filter.
- **Enforced invariant:** after key-point extraction the app checks the reverse direction — any `SourceChunk` that **no `KeyPoint` claims** is flagged `uncovered` and surfaced. Deterministic and checkable.
- **Three-tier assignment (no cross-semester junk drawer):**
  1. **Semantic** — the chunk clearly discusses the topic.
  2. **Positional fallback** — can't tell semantically, but the chunk came from *the Lecture 12 deck*, and the syllabus maps Lecture 12 → Unit 5, so it goes to **Unit 5**. Position is always known.
  3. **Unanchored file only** — a document with no date and no syllabus match becomes **its own topic named after the document** ("Study guide — enzyme kinetics"). Coherent, because it's one artifact.
  > **Do not** create a semester-wide "Loose ends"/miscellaneous topic — mixing week 2 and week 14 material in one review is incoherent (rejected July 2026).
- **`timesSurfaced = 0` items get priority** and are explicitly pulled into the pre-exam plan.
- **Coverage meter** in the class hub reports mapped %, unassigned items *with their source*, and never-reviewed count.

### 6.6 The full learning cycle — pre-lecture, post-lecture, retention (ADDED July 2026)

**The structural insight:** HQ's study loop currently *starts too late*. Everything is built around reviewing material you've already been taught. The evidence-based cycle starts **before** the lecture.

Nine steps across three stages. HQ covers five; the four marked ✗ are new.

| Stage | Step | What it is | Status |
|---|---|---|---|
| **Pre-lecture** | Prime | skim ahead so you have hooks to hang the lecture on | ✓ §4.1-I priming blocks |
| | **Pretest** | answer questions on material you **haven't learned yet**, and get them wrong | ✗ **new** |
| | **Predict** | guess what the lecture will cover / what the answer will be | ✗ **new** |
| **Post-lecture** | Active recall | produce from memory, get gapped | ✓ §4.1-J |
| | Feynman | explain simply, get told where you're fuzzy | ✓ §6.2 #6 |
| | **Connect** | link new material to what you already know | ✗ **new** |
| **Retention** | Spaced repetition | FSRS scheduling | ✓ §4.1-B |
| | Practice questions | quiz me, drills | ✓ §6.2 #2 |
| | **Full mock** | a whole exam under real conditions | ✗ **new for classes** |

#### The four new features

- **Pretest (pre-lecture).** Before a lecture is covered, serve 3–5 questions on that upcoming topic. **Getting them wrong is the point** — the *pretesting effect* means a failed attempt before instruction improves retention of the subsequent instruction more than reading alone. The UI must say so plainly, or users will read a 0/5 as failure and quit. Score is **never recorded as performance**; it's a priming act, and it must not touch FSRS state or weak-topic flags.
- **Predict (pre-lecture).** One prompt before class: *"What do you think this lecture will cover?"* or *"What do you expect the answer to be?"* Answers are stored and **surfaced again after the lecture** so the user sees where their expectation was violated — the violation is where the encoding happens. Pairs with the priming block; same surface.
- **Connect (post-lecture).** After a topic is marked covered, prompt for an explicit link: *"How does this relate to something you already know?"* HQ suggests candidates — topics in the same course, in a prerequisite course, or sharing an **MCAT content category** — and the user writes the link. Stored as a **`TopicLink`** (`fromTopicId`, `toTopicId`, `relation`, `note`), which makes the knowledge a graph rather than a list. Feeds the Atlas concept-map candidate (§6.1) and gives the gap report cross-topic context. **This is the largest missing piece** — every current feature treats topics as independent islands.
- **Full mock (retention).** A whole practice exam for a *class*, under real conditions: scoped to the exam's unit range, timed to the real duration, no pausing, no peeking. Afterwards, a **post-exam autopsy** — which topics you'd flagged weak versus which actually appeared, and whether your self-assessment was calibrated at exam level rather than card level. Mirrors the MCAT full-length workflow (`02-mcat.md` §3.6); reuse that shape rather than inventing a second one. Generated from the class's own materials under the permissive Academics policy (§6.3).

#### Where each lives

Pretest and Predict sit in the **Materials module** beside the existing priming block (all three are pre-lecture acts). Connect fires from the **topic's post-covered state** and from the active-recall summary. Full mock sits in the **class page's exam surface**, launched from the exam countdown.

#### Rules

- **Pre-lecture acts never affect performance state.** No FSRS updates, no weak flags, no readiness change. They are preparation, and treating them as assessment would punish the user for doing the right thing.
- **The cycle is offered, never enforced.** A student who only does active recall must not be nagged about the other eight steps.
- **Teach the why, once.** Each new step gets a one-time `MascotNote` micro-lesson explaining the mechanism (§4.1-F) — particularly Pretest, which is counter-intuitive.

### 6.7 The friction rule (GOVERNING CONSTRAINT — added July 2026)

> **No feature may require data the user wouldn't have entered anyway for a different reason.**

This outranks every feature in §6. A feature that charges a new data tax will be used for one course in week one and abandoned, taking every downstream feature with it.

**Honest audit of the 43:**

| Cost | Features | Why |
|---|---|---|
| **Free** — data already exists | best-time-of-day (#20), optimal session length (#34), review-debt (#33), cycle stall (#23), re-read detection (#26), prereq decay (#21), forgetting curve (§4.1-L), effort-to-outcome (#35), post-exam decay (#41) | derived from `ReviewEvent` timestamps and grades already captured |
| **Paid by syllabus ingestion** — one upload | capture window (#13), deadline collision (#18), exam readiness (#32), assignment↔topic (#37), syllabus change (#42), exam scope, grade weights | **all of these are dead without §4.1-M** |
| **Paid by Canvas — one token, zero typing** | the whole grade ledger (§6.8), deadline collision (#18), grade trajectory (#38), regrade window (#44), mathematically-irrelevant (#45), highest-leverage (#46) | **§4.1-O is the difference between useful in week one and useful in week five** |
| **Charges a real tax** — decide consciously | confidence drift (#28) needs a rating on **every rep**; cross-class overlap (#22) needs embeddings; `TopicLink` (Connect) needs authored links; mistake log needs per-question tagging | each is a genuine ask — justify or cut |

**Rulings:** confidence rating stays (it's one tap inside a flow the user already started, and calibration is a headline feature) but is **skippable without penalty**. `TopicLink` stays because Connect *is* the learning act. Mistake tagging stays because it replaces a notebook students already keep. **Anything else that would add a new recurring entry step must be justified against this table or cut.**

### 6.8 Grade ledger, done properly (added July 2026)

The boring half nobody builds correctly — and the reason students keep a parallel spreadsheet. If the projection is ever wrong, the user stops trusting the number and the app becomes decoration.

- **Weight engine with policy handling.** Nearly every syllabus has at least one: *lowest quiz dropped* · *final replaces lowest exam* · *curve at instructor discretion* · extra credit · capped attendance points · rounding rules. Parsed from the syllabus (§4.1-M), **shown to the user, and editable**. A projection that ignores a drop-lowest rule is simply wrong.
- **"What do I need?" — inverse solve.** *You need 84 on the final for an A−.* This is the reason people open a grade tracker at all. Two corollaries worth showing, both cheap once the engine exists:
  - **Mathematically irrelevant** — which remaining items can no longer change your letter grade.
  - **Highest leverage** — the single remaining item that moves the outcome most.
- **Real GPA math.** Cumulative · term · major · science/BCPM subset, each computed separately. Plus/minus scale, repeats (**AMCAS counts every attempt**), pass/fail exclusion, credit-hour weighting. **Get this wrong once and credibility is gone permanently.**
- **Scenario mode.** *"If this term goes A / A− / B+ / A, cumulative lands at 3.74."* The most-used function of every GPA tool that exists.
- **Regrade window tracker.** Graded work returned → dispute window is typically 1–2 weeks → nobody tracks it. Time-boxed, points genuinely on the table, trivially cheap. **New, and nothing else does it.**

### 6.9 Structural decisions (locked before build)

- **Longitudinal, never term-scoped.** Most trackers are built per-semester and quietly discard history. The best features here — prereq decay, term retrospective, effort-to-outcome, GPA trend — are **all cross-term**. This must be in the schema from day one; retrofitting it is a migration nightmare.
- **Absorb prior credit.** AP, transfer, and dual-enrolment credit, plus gen-ed bucket double-counting, are part of the ledger from the start — not an afterthought.
- **Do not build a calendar. Read from one.** Deadlines are HQ's; class meetings, work shifts, and the rest of a student's life are not. **A second calendar that is 80% complete is worse than none.** Google Calendar integration is read-for-context, write-for-our-own-deadlines only.
- **Export everything, visibly.** Four years of coursework is a serious commitment to ask for. A complete, obvious export is what makes it a reasonable one — and it's also the honest answer to "what if I stop using this?"

### 6.10 Lifecycle — the three moments trackers die (added July 2026)

Every feature in §6 assumes a steady-state user. Trackers don't die in steady state; they die at three specific moments. Each needs an explicit design, not a default.

#### A. Cold start — day one the app knows nothing

Every one of the 50 features has nothing to say. **A home screen of forty empty cards showing zeros reads as "this app is broken."**

**Rule: features stay dormant and say why.** Not `0%`, not an empty chart — *"needs two more reviews before this means anything."* This is the same honest-empty-state discipline already applied to the forgetting curve (§4.1-L); **extend it to every feature.** A dormant feature is invisible or explains itself; it never renders a hollow shell.

Day one should show **exactly one thing to do**: import a syllabus (§4.1-M).

#### B. Abandonment recovery — Academics' specialization of the shell pattern ⭐

> **PROMOTED TO THE SHELL, Aug 2026.** This section specced amnesty-on-return
> first and called it the highest-value feature on the tab. It was right about
> the value and wrong about the scope — nothing in it was Academics-specific.
> **`specifications/00-product-shell.md` §7.10 now owns the pattern**: the
> trigger, the threshold, the no-count/no-streak rules, and the bulk-clear
> contract all live there and are not restated here. What remains below is only
> what Academics contributes to it.

**Being dropped for two weeks mid-semester is the normal case, not a failure case.** What the app does on return is the whole ballgame. Most greet you with 47 overdue items and a broken streak, and you close them forever.

**What Academics supplies to the rundown** (the shell renders it; §7.10 caps it
at three facts, each of which must be a real change during the absence):

- **Review load, as a shape rather than a count.** Not *"47 reviews due"* — that
  is exactly the number §7.10 forbids. What changed is that intervals lapsed,
  and the honest statement is which **courses** went quiet, not how many cards
  did.
- **Anything with an external date that moved into range** while they were gone:
  an exam now inside its prep window, an add/drop or withdrawal deadline now
  near, a registration window that opened.
- **Nothing about pacing.** Being behind HQ's targets usually means being on
  pace externally (§6.15), so a return is the single worst moment to say it.

**Academics-specific rule that does not generalise:** FSRS handles lapsed
intervals mathematically, and the UI must not editorialise about it. A returning
student's scheduling is already correct; there is nothing to forgive and no
recovery to perform. **The bulk-clear offered by §7.10 clears the surfaced
items, never the FSRS state.**

#### C. Term rollover — what happens in December (EXPANDED July 2026)

**The course ends. The knowledge doesn't.** An earlier draft said "archive the course," which is wrong for exactly the case Andy raised: *you finish PSYC 101 in December and the MCAT is fourteen months away.* The class is over; the content is not. Treating archive as one switch either keeps dead classes cluttering the app or throws away material the student will be tested on.

**So rollover separates two things that were conflated:**

| | The **course record** | The **topics** |
|---|---|---|
| What it is | grade, credits, `bcpm`, `satisfies[]` | what you actually learned |
| At term end | **always archives** — final, immutable, ledger-only | **sorted into three fates** |
| Lives in | `Grades & Archive` | wherever it's still needed |

#### The three fates of a topic

1. **Retired** — the topic served this class and nothing downstream needs it. **Stops being scheduled**; stays queryable forever so decay history and the retrospective still work. The default for most topics.
2. **Carried for the MCAT** — the topic is MCAT-relevant (already tagged, §4.1). **Ownership transfers to the MCAT tab.** It does not stay in Academics, because Academics is about classes you're taking and this one is finished.
3. **Carried as a prerequisite** — next term's course depends on it. CHEM 261 topics when CHEM 262 is on the schedule. **This is the entire mechanism behind prerequisite decay (#21)** — those topics must remain live and scheduled, or the app can't tell you your foundation rotted.

#### How carried topics actually behave — maintenance, not review

**Do not keep them on the active schedule.** A student finishing four classes would wake up in January to 200 due topics and quit — which is exactly the abandonment failure in §6.10-B, self-inflicted.

- **Let FSRS stretch the interval.** A topic that reached high stability naturally schedules 30, 60, 120 days out. **This needs no new mechanism** — it's what the algorithm already does. Maintenance is not a second scheduler; it's the same scheduler left alone.
- **Carried topics never appear in Academics' daily queue.** MCAT-carried topics surface in **MCAT → Content**, seeded with their existing FSRS state (stability, difficulty, last review) so nothing restarts from zero. Prereq-carried topics surface **only** when #21 fires — *"CHEM 262 Unit 3 builds on three CHEM 261 topics now at ~40%"* — not as a standing list.
- **The cap is the MCAT tab's problem, not a new one.** MCAT already prioritises by AAMC content weight; carried topics enter that queue and get triaged by the same rules. **Do not build a separate maintenance-priority system.**

#### The ritual — one screen, pre-sorted, ~30 seconds

Fires at term end. **Never asks the student to sort fifty topics by hand.**

- Everything arrives **already sorted** by the defaults: MCAT-tagged → carried for MCAT · prerequisite for a scheduled next-term course → carried as prereq · everything else → retired.
- The student adjusts anything they disagree with and confirms. **Bulk actions on each group** — "retire all," "carry all."
- **`Pause everything` is a first-class option**, one tap: retire all, carry nothing. Fully reversible. A student who is burnt out in December should not have to argue with the app.
- The **term retrospective (#43)** fires here — the natural moment.
- Unresolved items (unconfirmed mappings, unlinked files) are resolved or explicitly archived. **Never silently carried forward as clutter.**
- **Skippable.** Skipping applies the defaults; the ritual re-offers once in January and then stops asking.

#### Rules

- **Carried topics keep their FSRS state.** Restarting a psych topic at zero stability in January would be a lie about what the student knows and would flood the MCAT queue.
- **Un-archiving is always possible** and restores everything intact.
- **A retired topic is never deleted.** Prereq decay, the retrospective, post-exam decay (#41), and the forecast ledger (#52) all read history.
- **New term starts clean** — the Loop panel is empty and syllabus import is the one call to action.

### 6.11 Attention budget (GOVERNING CONSTRAINT — added July 2026)

Roughly 50 features, most wanting to interrupt. If each fires weekly that's 50 notifications, the user disables notifications, and **every event-driven feature dies at once.**

- **Global cap: 3 interruptions per week.** Not per feature — total.
- **Features compete on consequence.** A W-deadline (#19) or a deadline collision (#18) outranks an interleaving suggestion (#16). Rank by *what it costs the user to miss it*, not by recency.
- **Auction losers roll into the Sunday digest** (#31), which is the one scheduled surface and is exempt from the cap.
- **Dismissed three times → stop sending it.** Permanently, per rule, silently.
- **The home screen answers exactly one question: what should I do in the next hour.** Fifty signals rendered as fifty cards is paralysis, and the user experiences paralysis as the app's fault.

#### Two streams in the bell — push vs. pull (Andy, July 2026 · LOCKED)

The attention cap governs **what HQ decides to say**. It must not govern **what a professor said** — silently withholding a class announcement would be indefensible, and letting announcements consume the budget would starve everything else. So the bell has **two tabs**:

| Stream | Contains | Behaviour | Budgeted? |
|---|---|---|---|
| **Alerts** | HQ's own nudges — everything in §6 | **Push.** Interrupts. | **Yes — the 3/week cap** |
| **Class** | Every professor announcement, mirrored in full (§4.1-O) | **Pull.** A count you check. | **No — uncapped** |

**The separation only means something if the badge behaviour differs.** If both tabs push an identical red dot, nothing has been solved.

- **Alerts** may interrupt: badge, and whatever else the platform allows.
- **Class** shows a **quiet unread count only.** No push, no sound, no red dot competing for urgency. It's an inbox you open, not a tap on the shoulder.
- **Nothing is ever hidden.** Every announcement appears in Class, in full, always.

**Promotion, not filtering.** When an announcement genuinely changes something — a date moved, an assignment cancelled, exam scope altered — it **also** appears in Alerts and is subject to the auction. It never *leaves* the Class stream; it's duplicated up, not filtered out. Extraction still **proposes and never edits** (§4.1-O), and an uncertain extraction simply doesn't get promoted.

**Generalises past Canvas:** any future source of things *other people said* (advisor emails, program deadlines) belongs in a pull stream, never in the pushed one.

### 6.12 Trust — the app must earn belief (added July 2026)

- **Score your own predictions.** ⭐ **Log every forecast against its outcome and show the hit rate.** Nobody builds this, and it is the entire difference between a tool and a horoscope. Honest gate: **suppress forecasts until the model has earned the right to make them** (below a minimum accuracy or sample size, show nothing).
  - **Score the fast-resolving predictions, not the slow ones (REQUIRED — Andy, July 2026).** An earlier draft scored exam-readiness forecasts, which resolve roughly monthly and therefore say nothing useful until December. **A feature that pays off after the semester ends has no value.** Score **retrievability predictions instead**: FSRS predicts a recall probability on *every single review*, and the self-grade resolves it seconds later. That is ~100 scored predictions in two weeks.
  - **The bar: it must say something real by week four**, in plain language — *"When HQ calls a topic solid, you've recalled it 8 times out of 10. When it calls one shaky, you blank about half the time."* Exam-readiness accuracy accrues in the background and is reported later as a secondary line, never as the headline.
  - **If it cannot clear the week-four bar, it does not ship.**
- **Intervals, not point estimates.** *"Retention around 60–75%"* is true; *"61%"* is false precision. **One visibly wrong number costs the user's belief in the other 49 features.**
- **Say where the data goes.** Grades are among the most sensitive things a student owns, and #22's embeddings mean coursework leaves the device. **State that plainly in the UI at the point of use**, not buried in settings — and provide a **local-only fallback** that keeps everything deterministic on-device. Students are more privacy-alert about grades than about almost anything else.

### 6.16 Academics is a CONSUMER of the shared hour budget (added July 2026)

**Defined in full at `specifications/00-product-shell.md` §11b. Academics does not own capacity.**

When MCAT prep overlaps a semester, both tabs bid for the same evenings, and **two independently reasonable plans sum to something impossible.** So `WeeklyCapacity` is shell-owned and Academics **registers claims** against it:

- **Class time · the review queue · exam prep mode (§4.1-R) · assignment work.**

**Rules that bind Academics specifically:**

- **Review-debt (#33) and exam prep mode (§4.1-R) size themselves to the shared pool**, not to an idealised week. *"4.5h of reviews due, ~3h available"* must read hours from `WeeklyCapacity` **minus MCAT's claims**, or the number is a fiction.
- **Check before generating.** An exam plan that needs more hours than remain says so up front rather than producing a schedule that can't happen.
- **Precedence:** Academics wins during exam weeks; MCAT wins during dedicated study periods. **The rule is explicit and overridable** (§11b).
- **Busy periods bend the plan and never create debt** (§6.10-B).
- **Never nudge the student to fill unclaimed hours.** The pool describes what they have, not what they owe.

### 6.15 The pacing stance — HQ pushes you ahead, not merely on time (Andy, July 2026 · GOVERNING)

> *"The entire interface of HQ is so that you're basically on top of things and that you do things early… when you happen to be 'behind,' you're actually on track with the rest of the herd."*

**Every pacing calculation in the app targets ahead-of-schedule, not on-schedule.** This is a stance, not a tuning parameter, and it changes what "behind" means.

- **Suggestions run forward.** Priming and pre-lecture prompts (§6.6) point at material a lecture or two out, not just tomorrow's. Review schedules front-load rather than land on the deadline.
- **"Behind" in HQ ≈ on pace externally.** A student who is two weeks behind HQ's targets is roughly where the average pre-med is. **The copy must never imply failure at that point** — HQ's baseline is deliberately aggressive, and telling someone they're failing for meeting the normal standard is both wrong and corrosive.
- **Reasonably ahead, not absurdly.** The target is a lecture or two of lead time and exam prep starting earlier than feels natural — **not** three weeks ahead of the syllabus, which nobody sustains.
- **Same stance on the application timeline.** AMCAS-shaped capture (§4.2-D), the NCSSM-style transcript audit, prereq sequencing, and MCAT decay (#64) all exist to move decisions **years earlier** than the point at which students normally discover them.
- **Consequence for catch-up (#73): keep it small.** A pacing model this aggressive means "behind" is common and usually not serious. Catch-up is a **triage tool for the genuinely stuck**, not a major surface, and it must not become the app's default emotional register.
- **Never shame the gap.** Ahead-of-pace targets plus guilt copy is the fastest way to make someone quit (§6.10-B).

#### 6.15-A Treat the day like a 9–5 — the guilt-free evening (Andy, July 2026 · GOVERNING)

> *"Treat the day like a 9–5: lock in from 9, get all necessary work done, and then you can leave the rest of the night guilt-free."*

**Front-loading is only half the stance. The other half is that finishing has to actually end.** A plan that front-loads but never says "you're done" produces a student who works early *and* feels they should still be working at 10pm. That is strictly worse than not front-loading at all, and it is how most study apps behave — the list is always there, so the day never closes.

**Rules this imposes on every planning surface:**

- **Every day has a visible finish line.** A day's work is expressed as *when it ends* — "9:00–11:30, done by 11:30" — not merely as a quantity of hours. The hours number answers "how much"; the finish time answers "when am I free," which is the question that actually governs behaviour.
- **Completion is a real state with real copy.** When the day's plan is done, the surface says so plainly and stops asking for anything. **No "you could also…", no suggested bonus work, no next-item-up.** Offering more after completion silently revokes the promise.
- **Unclaimed evening hours are never solicited.** This is the same rule as `00-product-shell` §11b ("never nudge the student to fill unclaimed hours"), stated where it bites hardest: the pool describes what a student has, not what they owe.
- **Exam prep mode is the one sanctioned exception**, and only inside its window — the two weeks before an exam may legitimately claim evenings. It is bounded and temporary, and it still closes each day.

#### 6.15-B Two intensity modes — never three, catch-up is not one of them (LOCKED)

**Exactly two, and the more aggressive one is the default:**

| Mode | Default | What it means | Copy stance |
|---|---|---|---|
| **Accelerated** | **✓ default** | HQ's governing stance (§6.15). Front-loads, finishes the plan **before** the deadline, and reserves buffer for what practice work exposes. Earlier finish each day. | "on top of it" |
| **Steady** | | Same scope, same deadline, spread wider. Fewer hours per day, finishing nearer the deadline. **Still on pace** — it is a lighter shape, not a reduced target. | "on pace" — **never** "behind" |

- **Steady is not a failure state and must never be worded as one.** A heavy week in another class, a research deadline, or a bad stretch are legitimate and common reasons. Copy that implies falling short here contradicts §6.15 outright.
- **Switching is one control, reversible, and never celebrated or mourned** — no confirmation dialog, no "are you sure," no praise for switching back.

**The control is a status box, not a segmented pill (LOCKED July 2026).** A pill was designed and rejected for two reasons: the banner already uses a glass pill for the **view** mode (Daily / Planning, §4b-i), so a second one makes two unrelated questions look like one control; and a toggle displays options while answering nothing. The student's actual question is *"how's my pace?"*

- **At rest it answers** — `Pace · Accelerated · 2 days early`. Readable without interaction.
- **On hover/click it opens a menu** carrying the current state in plain language, the **diff if you switched** (load, finish date, buffer, exam-day band), **one** action, and the scope note. The menu is a preview, not a confirm step.
- **It also carries the catch-up signal without changing the setting** — `Steady · catching up`. This is why a box beats a pill: a toggle cannot show a detected state.
- Glass is correct on both halves — the box is banner-borne chrome, the menu floats (`04` §0c).

##### Scope: the value is GLOBAL, the control is LOCAL (LOCKED July 2026)

**Intensity is a property of the student's current week, not of one exam plan.** It is stored at the shell beside `WeeklyCapacity` (`00-product-shell` §11b) and there is exactly **one** value app-wide.

- **Why not per-plan.** Both Academics and MCAT claim hours against one shared pool. Two generators running at different intensities bid incoherently against that pool — the precise failure §11b exists to prevent. "Academics on Steady, MCAT on Accelerated" does not describe a real week.
- **Why not Settings-only.** Nobody opens Settings at the moment they are overwhelmed, which is exactly when the control has to be reachable.
- **So: the control appears wherever planning happens** — exam prep mode (§4.1-R), the Daily main page (§4.0), and MCAT's session planner — and every instance reads and writes the same shell-owned value.
- **The first flip states its reach, once.** *"Steady applies to your whole week, not just CHEM 262 — your MCAT sessions get lighter too."* Shown on first use and never again. Changing a global setting from a local control without saying so is the same silent-action failure forbidden for calendar reflow (§4.1-R) and for syllabus re-ingestion (§4.1-M).
- **HQ never switches it automatically.** When the pool is genuinely oversubscribed HQ may **offer** Steady **once**, dismissible, counting against the §6.11 attention budget. Flipping it silently would be the app deciding how the student feels.
- **Reverting is silent.** No "welcome back," no streak restored, no acknowledgement of any kind.
- **A third level was considered and rejected** (July 2026). "Steady / Accelerated / Push" put a real decision in front of a student who wanted a plan, and the marginal value of Push over Accelerated did not justify the choice. **Spare hours stay spare** — see §6.15-A.
- **Catch-up (#73) is orthogonal and never selectable.** Intensity is what the student *wants*; catch-up is what the calendar *permits*. HQ detects catch-up when even Steady no longer fits, and it does so in either mode. Exposing catch-up as a mode option would promote it to a standing surface, which §6.15 forbids.
- **Neither mode changes what is true.** Scope, the exam-day band (#32), and every projection remain as they are. Intensity changes **how much and how soon**, never the numbers reported.

### 6.13 HQ owns the review loop (RESOLVED — restated here because it determines the schema)

**The fork:** roughly fifteen features — prerequisite decay (#21), the forgetting curve (§4.1-L), post-exam decay (#41), re-read detection (#25), cycle stall (#24), exam readiness (#32) — all need **repeated recall attempts with graded outcomes over time.** Something has to produce that data. Three options existed: HQ generates it, HQ reads Anki's review history, or HQ observes materials only and the memory half has nothing to run on.

**Decision: HQ owns the review loop.** This was settled when Anki was fully decoupled (§4.1) and is restated here because it is a *schema* decision, not an integration preference.

- `ts-fsrs` is HQ's own scheduler. **Every topic is HQ-scheduled.** No `scheduler` field, no sync, no "reviewed in Anki" state.
- The **active recall runner (§4.1-J) is the generator** — confidence captured before reveal, self-grade `Again/Hard/Good/Easy` after. That is the graded-outcome stream every memory feature consumes.
- Reading Anki's review history was **rejected**: a sync dependency on a third-party desktop app's SQLite file, fragile across versions and unavailable on the web.

**This is not competing with Anki, because the review unit is different.** Anki reviews **cards** — one fact, one line, seconds. HQ reviews **topics** — *"explain SN1 vs SN2"*, a spoken or written answer graded against scope chips, minutes. Same algorithm, different grain. Running Anki for CHEM vocabulary and HQ for CHEM concepts is coherent, not redundant. **Do not add card-level review to HQ** — that is where the overlap would become real and where HQ would lose.

### 6.14 Observed vs self-reported — phrase claims accordingly (added July 2026)

Features do not have equal evidentiary standing, and **the UI must not phrase them as if they do.**

**Observed** — runs on behaviour and real outcomes; trustworthy:

- Re-read detection (#25) — files opened vs recalls logged
- Effort-to-outcome (#38) — timestamps against actual grades
- Coverage, `timesSurfaced`, review recency, deadline data, everything in the grade ledger (§6.8)

**Self-reported** — runs on the user's own judgement, and **users flatter themselves, most of all the ones who need the feedback**:

- Confidence ratings and confidence drift
- Self-graded `Again/Hard/Good/Easy`
- Topic weakness where it derives from self-grades rather than scored work

**Rules:**

- Observed features may **state**: *"You opened this file four times and never recalled it."*
- Self-reported features must **hedge**: *"By your own ratings, this looks shaky."* Never *"you don't know this."*
- **Calibration (§4.1-J) is the bridge** and deserves prominence — comparing predicted confidence against actual grade is precisely the measurement that catches self-flattery, and it's deterministic.
- Where a claim mixes both, it inherits the **weaker** standing.

### 6.1 Candidate features (extensible — keep adding)

Not yet committed; captured so nothing is lost: withdrawal/IP AMCAS-impact + UNC W-limit awareness; repeat-course detection (data quality); optimal term-by-term sequencing suggestions given prereq chains + timeline; study-system completeness nudges in Class Center ("Canvas linked, no Anki deck"); credit overload/underload vs. full-time status; "grade needed on the final to hit target" per class; semester-vs-cumulative comparison; honors/departmental-distinction eligibility tracking.

Severity mapping for all of the above → the attention model (blocking / important / suggested, per shell §7.5).

---

## 7. Views & inspector

- **Planner ledger:** `TrackerTable` of courses (per `01` list pattern), inline-editable typed cells.
- **Class Center:** card grid of current-term classes; opening a class uses the **center peek** (`01` §2), not the old `CourseDetailDialog` — migrate. Expand → full class workspace; Split → class + its assignment list.
- **Course inspector (peek) sections** (lean core + progressive, `01` §3): Overview/Details (academic fields), Workspace (instructor, links, materials — only if `ClassWorkspace` exists), Assignments (this course's), Requirements satisfied, Relations/Activity; Notes/Data-quality/History on demand.
- **Tracker:** requirement audit list with status (met / in-progress / unmet) and transparent component counts.
- **What-if:** scenario calculator overlaying hypothetical grades on the ledger without mutating canonical data (`01` derived/stateless).

## 7a. Components used (feature → library component)

Explicit traceability — every feature names its component (from `implementation/component-inventory.md`). shadcn primitives auto-theme; motion components re-skinned via the shared motion system (`04` §7a).

| Feature | Component(s) |
|---|---|
| Daily/Planning mode switch (level 1, glass on banner) | `ModeSwitch` (`01` §4b, §4b-i) |
| Mode's tabs (level 2, underline) | `Tabs` styled as underline tabs + `Badge` (count) — no container/track |
| Term · search · view (level 3, filter bar) | `Select` (term — **never** a pill row) + `Input` (search) + `Toggle Group` (cards/list) |
| Banner variable stat strip | glass strip (`01` §4b-ii) + **Number Flow** |
| "How to study" entry (§4.1-F guide) | `Smooth Button` (ghost, banner) → guide `Dialog`/route |
| **Heads up** (academics smart features) | *same component as Overview Smart next actions* — `Card` + explain-line + `Smooth Button` + `AnimatePresence` (dismiss → `06` suppression, unmount when empty) |
| **Pace / projection line** | pace chip (`01` §4d) — `Badge`-style + dismiss → collapsed "Show projection" pill |
| Chart projection segment | **Chart** with dashed forward series |
| Class Center card grid | `Card` + **Glow Hover Cards** (hover per `01` §4e); grid per `01` §5; wraps |
| Class card — one primary + overflow | `Smooth Button` + `DropdownMenu` (⋯) + `Context Menu` (right-click) |
| Class card — topics-ready line | **Animated Progress Bar** + **Number Flow** |
| **Where you're weak** (exam-scoped) | `Toggle Group` (Next exam / All topics) + `InfoTip` (scoping explainer) + **Animated Progress Bar** rows + `Collapsible` (class groups in All view) |
| **Up next** (dynamic next-thing) | `Card` + **Animated Progress Bar** w/ projection marker + `Smooth Button` (type-appropriate CTA) + `Badge` chips |
| **Upcoming** (exams/presentations) | list rows + `Badge` (type + severity) + star (important) |
| **Mastery trend** | **Chart** (area + dashed projection) + **Number Flow** |
| **Consistency** | **Contribution Graph** (7-wide week rows) + streak **Number Flow** |
| GPA panel (term/cum/science + contribution) | **Number Flow** + **Chart** (line + dashed projection) + diverging **Animated Progress Bar**s |
| Open a class / course inspector | `CenterPeek` → Expand/Split + `ObjectInspector` (`01` §2–3); **Expandable Cards** for the card→peek grow |
| Planner ledger (courses) | `TrackerTable` + **Data Table** (sort/filter/paginate/columns); inline-edit cells |
| AMCAS GPA (cum + BCPM) | compact stat row + **Number Flow** (counts to the real value) |
| GPA / academic trend | **Chart** (line) |
| What-if calculator | `Input`/`Select` + **Number Flow**; never mutates canonical |
| Requirements audit | `Accordion` (requirement groups) + **Animated Progress Bar** (completion) + **Animated Tags** (met/in-progress/unmet) |
| Materials: upload / embed / link | **Animated File Upload** · `DocEmbed` · **Preview Link Card** |
| Topics revision tracker | **Animated Tags** (status); retrievability **Contribution Graph** heatmap |
| Study tools (generate/quiz/…) | **Smooth Button** triggers; Advisor = LLM (deferred) |
| First-run how-to-study walkthrough | **Animated Stepper** + **`MascotNote`** (teaching variant, `01` §4f) |
| Why-due explainer (always-on, per row) | inline text on the queue row + `InfoTip` for detail |
| Just-in-time micro-lesson (first time a mechanism appears) | **`MascotNote`** teaching variant — fires **once** per concept, then permanently dismissed (`01` §4f) |
| Empty states (no classes / no topics / no assignments) | **`MascotNote`** empty variant + first action |
| Milestone recognition (real thresholds only) | **`MascotNote`** milestone variant |
| Assignments (calendar + list) | `AssignmentsPanel` + **Calendar/Date Picker** + `Kanban`/list |
| Study timer + consistency | timer + **Contribution Graph** (streak) |
| Dates / selects (in-app, `01` §4a) | **Calendar/Date Picker** · `Select` · `DropdownMenu` |
| Right-click record actions | **Context Menu** |
| Deep-route context | **Breadcrumb** (shell top-left) |
| Grade calculator / exam countdown | **Number Flow** + compact stats |
| Exam-prep plan / post-exam reflection loop | list + `Input`/`Textarea` |
| Confidence rating (pre-reveal) | `Radio Group` / `Slider` |
| ~~Anki sync status chip~~ | **REMOVED** — no sync exists (§4.1). Do not build this component. |
| Live semester GPA projection | **Number Flow** + **Chart** |
| Today's review queue (cross-class) | list + `CollectionState` |
| Mastery / weakness view | **Contribution Graph** (retrievability heatmap) |
| The 12 smart-feature alerts + severity | Attention bell + **Animated Tags** (blocking/important/suggested) |
| Archive (restore) | `TrashRecovery` |
| Interests questionnaire (Planning) | `Radio Group` / `Select` form |
| Conversational advisor (Planning) | `AI Input` + `Message`/`Message Scroller`. **UI primitive no longer deferred** (`implementation/component-inventory.md` §8), but the **feature** still depends on Atlas's course knowledge base (§14 open decision #6, unlike MCAT's self-contained Advisor or Clinical's reflection). Chat shell can be built now; content grounding cannot. |
| Empty / loading / error | `EmptyState` · **Skeleton** (Shimmer) · scoped error |

## 8. Cross-tab relationships

- **GPA (cum + BCPM)** → Overview domain row, Profile/CV, School List fit.
- **Prereq sequencing** → roadmap nodes (**Timeline**). **Assignment and exam dates do not go there** — they stay Academics' and surface in the Attention bell (Aug 2026).
- **MCAT content coverage** → MCAT readiness.
- **Course difficulty** ← Atlas knowledge.
- **Assignment deadlines** → attention bell (not Home to-do).
- **Upward trend** → Essays (narrative material).

## 9. Empty, loading, error states

- New user: empty ledger invites first course/import; Tracker shows the UNC requirement scaffold with everything "unmet" as the to-do; Class Center invites adding current classes.
- Loading: skeletons per view; GPA computes client-side (no spinner).
- Error: scoped inline; a Class Center workspace failing never blanks the ledger/GPA.

## 10. Mobile

- Ledger table → card rows; Class Center cards stack; peek → full-screen sheet; What-if usable in a sheet.

## 11. Admissions-aware reasoning

AMCAS GPA (cum + BCPM) and its accuracy is the highest-stakes output in the app. Honesty over flattery: no invented "academic score," transparent requirement components, truthful retake math.

## 12. Do Not Generalize From Other Tabs

GPA/requirement logic is Academics-only; never center hours here. Assignments are owned here (not Timeline, not Home to-do). The unified Course is canonical — other tabs reference it, never re-store course data. UNC-specific requirement data is intentional; do not add multi-institution logic.

## 13. Acceptance criteria

- [ ] One canonical `Course`; `ClassWorkspace` links 1:1 by `courseId` (current-term only); assignments link to `courseId`; no duplicate class/course records; existing data migrated with a review step.
- [ ] Editing a grade/credit anywhere updates GPA, requirements, and Overview consistently (single source of truth).
- [ ] AMCAS cumulative + BCPM GPA correct; What-if never mutates canonical data.
- [ ] Mode switch (Daily · Planning) swaps the tab bar; Daily = Class Center + Assignments, Planning = Planner & GPA + Requirements + Archive; mode persists and deep-links (`?mode=&tab=`). All tabs render as views over the unified course; Class Center opens via center peek (no `CourseDetailDialog`).
- [ ] The 12 smart features present with explanations and correct severity routing.
- [ ] UNC requirement audit intact; assignments excluded from Home to-do but deadlines reach the bell.
- [ ] Class Center is a per-class study hub: files upload into HQ + embed + link external; `Topic`s carry status + native FSRS (`ts-fsrs`) scheduling; a cross-class "today's review queue" surfaces due topics.
- [ ] Syllabus import auto-populates topics/exam dates/grade weights; fast lecture capture marks Seen + starts FSRS; per-topic notes exist; exam-prep plan, grade calculator, post-exam reflection loop, study timer, and mastery/weakness view are present; a first-run how-to-study walkthrough + always-open guide teach the loop.
- [ ] Study tools (§6.2) generate from the class's own materials; **flashcards are generated, tagged, and exported only — no in-app card review UI exists anywhere in HQ** (`02` §5h); no Anki-desktop dependency for core review. **HQ's `ts-fsrs` still schedules TOPICS — that is not a flashcard mechanism and must not be removed.**
- [ ] **Anki is decoupled:** every topic is HQ-scheduled; no `scheduler` field, no sync chips, no "reviewed in Anki", no schedule/due-count reads. The only crossing is card generation → TSV/`.apkg` export, plus an optional "Send to Anki" button that appears **only** when AnkiConnect is detected on `localhost:8765` (with a just-in-time opt-in tutorial, never in onboarding).
- [ ] **Full learning cycle (§6.6):** Pretest and Predict live beside priming in the Materials module and **never** affect FSRS, weak flags, or readiness; Connect prompts after a topic is covered and stores a `TopicLink` with suggested candidates; a class-level **full mock** runs timed against the exam's unit range with a post-exam autopsy. Each new step carries a one-time `MascotNote` explaining the mechanism. The cycle is offered, never enforced.
- [ ] **Study-behaviour smart features (§6 #13–20)** present, each dismissible, each stating its cause, none firing more than once per cycle.
- [ ] **Cycle & memory features (§6 #21–31)** present and deterministic — notably **prerequisite decay**, **cycle stall**, **re-read detection**, and the **weekly ritual** as the only recurring nudge.
- [ ] **Cross-class overlap (#22)** matches **semantically via embeddings across `courseId`**, proposes with evidence, **never auto-merges**, and degrades to title/category matching without an API key — stating that it has.
- [ ] **Syllabus ingestion (§4.1-M) built FIRST** — extracts units, exam dates, deadlines, weights, policies, meeting times; **review-before-apply** with source text and low-confidence flags; partial success kept; re-ingestion is a diff, never an overwrite; manual entry always available.
- [ ] **Syllabus import placement (§4.1-M-a):** **no new tab** — a temporary full-screen flow reached from **four** entry points (cold-start CTA · class page → Materials top · Class Center card overflow · Add-a-class). Entered **unscoped** it **creates** the class; entered **scoped** it attaches. Only the class-identity block differs between the two.
- [ ] **Upload step (§4.1-M-b):** reuses **`AnimatedFileUpload`** — no forked variant. Drop **and** click are equal paths; accepts PDF/DOCX/image/pasted text with a visible `Paste text instead`; multiple files parse into **one** proposal; **no wizard or step counter**; parsing names what it's doing and is cancellable; manual entry always visible, never gated behind a failure.
- [ ] **Review screen (§4.1-M-c):** grouped class identity → exams → weights → units → deadlines → policies → logistics; clean groups **collapsed with a summary**, low-confidence groups **expanded by default**; **every item shows quoted source text**; low-confidence items flagged and inline-editable; **weight sum validated to 100%** with the gap named; partial success framed as success; **Apply states its consequence** and nothing is written before it.
- [ ] **Failure and re-import (§4.1-M-d):** nothing-parsed goes straight to manual entry with the file retained — never a bare error; a non-syllabus upload is offered to Materials instead; re-import is a **three-way diff** (added / changed / removed) with per-item accept-or-keep and unchanged items collapsed.
- [ ] **Friction rule (§6.7) enforced** — no feature added that requires data the user wouldn't have entered anyway; confidence rating is **skippable without penalty**.
- [ ] **Grade ledger (§6.8):** weight engine handles drop-lowest / replacement / curve / extra credit / caps, shown and editable; **inverse solve** ("you need 84 on the final"); mathematically-irrelevant and highest-leverage flags; GPA math correct for plus/minus, repeats (every attempt), P/F, credit hours; scenario mode; **regrade-window tracker**.
- [ ] **`AcademicMistake`** logged with the locked cause taxonomy, reusing the MCAT `Mistake` shape (not forked); **`ProfessorModel`** derived only from the user's own graded work and silent below its sample-size threshold.
- [ ] **Structural (§6.9):** schema is **longitudinal, not term-scoped**, from day one; AP/transfer credit and gen-ed double-counting absorbed; **HQ never becomes a calendar** (reads for context, writes only its own deadlines); complete visible export. **Clarified July 2026:** the shell's calendar overlay (`00-product-shell` §7.9) is a **read-mostly projection**, not a scheduler — no event creation, no drag-to-reschedule, **no `CalendarEvent` entity**. Display, never ownership.
- [ ] **Grade-ledger & mistake features (§6 #44–50)** present, including the **blanking-vs-not-knowing split** and **policy-aware projection that states which policies it applied**.
- [ ] **Shared hour budget (§6.16, `00-product-shell` §11b):** Academics **registers claims** (class time, review queue, exam prep mode, assignment work) against shell-owned `WeeklyCapacity` — **it does not own capacity**. **Review-debt (#33) and exam prep mode read available hours minus MCAT's claims**, never an idealised week. Oversubscription reported **before** generating. Busy periods bend the plan and **never create debt**. Never nudges the student to fill unclaimed hours.
- [ ] **Class types (§4.1-N) — exactly three:** `stem` · `writing` · `general`. **No fourth type, no per-feature toggle checklist** (both rejected). Chosen from one row of three chips at add time with a suggestion prefilled from the syllabus and **its reason shown**; nothing preselected when confidence is low; changeable later and **non-destructive both ways**.
- [ ] **Type gates study features only:** universal set (grades, GPA/BCPM, requirements, deadlines, syllabus, materials, notes, contacts) is never gated. STEM = the memory layer exactly as specified today; Writing = draft stages + reading tracker + feedback log; General = grade, deadlines, materials, notes. **A paper in a STEM class is just an assignment** — course-to-course variation lives in the assignment list, never in the type system.
- [ ] **One page, three configurations:** identical banner and identical Overview · Materials · Assignments · Notes in every type; **only the third sub-tab and the primary action vary** (Topics/`Start review` · Readings/`Open current draft` · none/`Add a grade`).
- [ ] **Cards and daily list:** same card shell with one differing signal line, **no type badge**; "what's due today" ordered by **urgency across all classes, never grouped by type**, each row carrying its own verb (Recall/Draft/Read/Log).
- [ ] **Type is a view concern only:** GPA, BCPM, requirement audit, Planner, and Overview contain **zero reads of `type`** — verified by grep, not inspection. Dormant panels do not render at all; empty states are per-type; nothing implies a non-STEM class counts less.
- [ ] **Review loop ownership (§6.13):** `ts-fsrs` is HQ's own scheduler, every topic HQ-scheduled, **no Anki history read, no scheduler field, no card-level review anywhere**; the active recall runner is the sole generator of graded recall outcomes.
- [ ] **Observed vs self-reported (§6.14):** claims from behaviour and real grades state; claims from self-ratings hedge; mixed claims inherit the weaker standing; calibration is surfaced prominently as the check on self-flattery.
- [ ] **Usage instrumentation:** every feature surface records opened/dismissed/acted-on locally from day one, visible to the user as their own data and exportable. **No third-party analytics, no telemetry leaving the device without explicit opt-in.**
- [ ] **Cold start (§6.10-A):** no feature renders a hollow shell — insufficient-data features are dormant or **say what they need** ("two more reviews"). Day one presents **one** call to action: import a syllabus.
- [ ] **Abandonment recovery (§6.10-B):** the return path itself is verified against `00-product-shell.md` §7.10, not here. What this tab must satisfy: Academics supplies **at most three facts**, each a real change during the absence; it reports **which courses went quiet, never a count of due reviews**; it says **nothing about pacing** on return; and the shell's bulk-clear resolves surfaced items **without touching FSRS state**. Verified by simulating a 30-day absence across two courses.
- [ ] **Term rollover (§6.10-C):** the **course record** and its **topics** are handled separately — the record always archives; topics sort into **retired / carried for MCAT / carried as prerequisite**. Carried topics **keep their FSRS state** (never restart at zero), **never appear in Academics' daily queue**, and surface in **MCAT → Content** or only when #21 fires. **No second scheduler and no separate maintenance-priority system** — stretched FSRS intervals are the mechanism. Ritual is **one pre-sorted screen with bulk actions**, has a one-tap **`Pause everything`**, is skippable to defaults, fires the retrospective (#43), and never asks the student to sort topics by hand. Retired topics are queryable forever; un-archiving restores intact.
- [ ] **Canvas Path A first (§4.1-O):** the calendar-feed route (Canvas ICS → the student's calendar → HQ's existing calendar read) ships **before** any Canvas API work. **Path B is not started until Path A is live and demand for grades is real.**
- [ ] **Build-vs-handoff discipline (`implementation/integration-map.md` §0):** no capability rebuilt that a tier-1/2/3 handoff already covers. Text fields are **standard `input`/`textarea`** so system dictation (Wispr Flow, macOS Dictation) works untouched; **no keystroke interception**, no exotic contenteditable. **No paid third-party account is a dependency for any feature.** No download prompts interrupting an action.
- [ ] **Canvas architecture, Path B only (§4.1-O):** all Canvas calls route through the **Supabase Edge Function proxy** — the same one holding AI provider keys. **No browser-side Canvas fetch anywhere** (Canvas sends no CORS headers and rejects preflight; Instructure-hosted headers cannot be changed), **no third-party CORS proxy**. Token lives server-side only, encrypted, revocable in one action that actually deletes it. **UNC's permission for student-generated tokens confirmed before build.**
- [ ] **Canvas scope (§4.1-O):** mirrors courses, assignments, group weights, submissions, grades, announcements, modules, files, pages, `syllabus_body`, calendar. **No write path of any kind exists in the codebase** — no submission, no quiz, no discussion post. Verified by grep, not by inspection. Instructor HTML is **sanitised before render**, attachments are **linked not copied**, unsafe content degrades to plain text + link.
- [ ] **Bell has two streams (§6.11):** **Alerts** (HQ's own nudges — pushed, subject to the 3/week cap) and **Class** (every professor announcement — pull, uncapped, **quiet unread count only, no push, no red dot**). **Badge behaviour must actually differ between them**, or the split is cosmetic.
- [ ] **Announcements relayed in full, promoted not filtered (§4.1-O):** every announcement appears in the class page and the Class stream in full — **nothing a professor posts is ever withheld**. Change-events (date moved · scope changed · assignment added/cancelled/reweighted · policy change) are **additionally promoted** into Alerts and stay in Class too. Extraction **proposes with the announcement quoted and never edits silently**; uncertain extractions are not promoted; the original is always linked; HQ never marks anything read in Canvas.
- [ ] **Canvas integration (§4.1-O):** **read-only, never writes to Canvas**; student-generated token; **token never stored in plaintext `localStorage` or synced unencrypted** — resolved with the §6.3 secret-handling decision and **flagged before building**; import is review-before-apply; re-sync is a **diff, never an overwrite** of user edits; Canvas wins for dates/grades, syllabus wins for policies, conflicts surface for confirmation; **full function with no Canvas connected**; a connected course with no Canvas data reads as normal, not an error; provider-agnostic seam.
- [ ] **Grade distributions (#62):** **not built until the research task confirms** what UNC currently publishes, in what form, and under what licence; Category A with freshness metadata; **no scraping a third-party tool without checking its terms**; cut rather than approximate.
- [ ] **Attention budget (§6.11) enforced globally:** hard cap of **3 interruptions per week across all features**, ranked by consequence; losers roll into the Sunday digest; a rule dismissed **3×** is retired permanently. Implemented as one central auction, not per-feature restraint.
- [ ] **Home screen answers one question** — *what should I do in the next hour.* Not a wall of feature cards.
- [ ] **Forecast accuracy ledger (§6.12):** scores **retrievability predictions resolved at every review**, not monthly exam forecasts; **says something real by week four** in plain language, or it doesn't ship; hit rate visible; forecasts **suppressed entirely** below the sample/accuracy gate rather than shown with a disclaimer.
- [ ] **No false precision** — probabilistic outputs render as **intervals** ("around 60–75%"), never single-point percentages.
- [ ] **Data residency stated at the point of use** — where embeddings send coursework is disclosed in the UI, not buried in settings, with a **local-only fallback** that keeps deterministic features working.
- [ ] **Shareable syllabus parse (#56) — security model:** shares **extracted structure only, never the source document or its text** (copyright); payload is an **allow-listed field set** in a **separate table with no join path to grades, notes, progress, topics, or files** — structurally incapable of leaking, not merely disallowed; **anonymous by default**; opt-in per syllabus; review-before-apply on import; corroboration across independent parses raises confidence and disagreement surfaces as a conflict; corrections propagate as diffs; scoped to term + section; **the user's own syllabus always wins**.
- [ ] **Exam/workload/self-knowledge features (§6 #32–43)** present — notably **exam-day readiness forecast**, **review-debt**, **effort-to-outcome**, **concept-map gaps**, **post-exam decay check**, and the **term retrospective**.
- [ ] **Forgetting curve (§4.1-L):** history solid, projection dashed, exam line with projected exam-day retention, plain-language legend, honest "not enough history yet" below two reviews, one topic at a time, no API required.
- [ ] **`Study method · UNPATCHED 2026` (§4.1-K):** per-topic 9-dot lifecycle track; a class-Overview panel grouping topics by *what stage they need next*, which **disappears when every group is empty**; lecture-day anchoring from `ClassWorkspace` meeting times that **degrades gracefully when no schedule is set**. Never a tab, never a nine-item checklist, never scolds a skipped step.
- [ ] **Planning mode has three tabs re-scoped by job** (Planner · Requirements · Grades & Archive); Archive is a filter on the ledger, not a separate destination.
- [ ] **Planner** renders horizontally-scrolling **term columns** (§4.2-C1) with course chips (code · `BCPM` · what it clears · `❄`), per-term load warnings, the **MCAT as an in-timeline divider**, addable summer terms, an **unplaced tray**, and the live right rail.
- [ ] **Requirement satisfaction in the Planner (§4.2-C2):** every course states what it clears (named capacities, not "gen ed"); **preview diff** before committing; **what it unlocks**; redundancy warning; **double-count caps encoded**; mapping confidence labelled. Planner and Tracker remain separate surfaces over shared data.
- [ ] **Course → requirement mapping dataset exists**, sourced from the UNC catalog, Category A, freshness-tracked; a catalog change **flags** affected plans rather than silently re-deriving them.
- [ ] **Planner logic (§4.2-C3):** prereq validation **at drop time** · critical path · **offering-term (`❄`) warnings** · unplaced tray · summer/gap-year slots · **named saved plan versions** + compare · load/BCPM/**cross-pillar** warnings · AMCAS retake rule · substitutes · **registration-window nudge** · **term lock** · term notes · **advisor export** · "if this plan holds".
- [ ] **Requirements leads with gap-and-pace** (requirements left, prereqs before MCAT, on-pace verdict, what to take next, overlap) with the full requirement sets below — never a bare checklist.
- [ ] **Overlap is surfaced** — courses satisfying multiple requirements are counted and each row states its `also:`.
- [ ] **Requirement data confidence is labeled** — verified sets show ✓ + date; unverified majors show ◑ + a confirm-against-your-audit warning and "I confirmed this"; nothing is hidden or presented as settled fact.
- [ ] **Exam prep mode (§4.1-R):** entered from `Build exam plan`, **full-screen, temporary, ends with the exam — not a tab**. **Assembles existing data only** — no new scoring, no blended "prepared %", projections as **bands**. Day-by-day plan **sized to real available hours**, interleaved, each day stating its why; **re-plans on change and never accumulates a backlog**. **Catch-up is a state of this mode** and must be willing to **name what to abandon**. Closes into the autopsy (#17) and schedules the decay check (#41), both skippable. Works with **no API key**; **degrades without a syllabus** by asking which units are covered. **One exam per plan — never merged.**
- [ ] **Surface placement (§4 structure):** no new top-level tabs. Exam catalog and lecture-capture controls live at the **top of the class page's Materials tab**; the canvas and timer live **inside the review session**; catch-up is a **state of exam prep mode**. Any proposal that adds a sixth Academics tab is wrong.
- [ ] **Exam & resource catalog (§4.1-P):** per-class, tagged by unit, sources labelled with **permission status**; `unknown origin` never shared; **no scraping, no answer-sharing-service integration**; publicly posted material **linked not copied**; taking one is timed, scored, and routes misses into `AcademicMistake`; historical scope evidence surfaces once enough exams are tagged.
- [ ] **Lecture capture pipeline (§4.1-Q) — analyse the WHOLE transcript:** (1) transcribe, **on-device by default**; (2) segment against slides **for structure and citation only — never to decide what gets read**; (3) **every segment analysed** by a small model, **quote + timestamp required on every claim**; (4) computed signals (time-per-slide, repetition, divergence, speaking-pace) shown as **corroboration, never as a gate**. **Pre-filtering the transcript and keyword/phrase-list detection are both explicitly REJECTED** — professors telegraph implicitly, and proxies measure teaching style rather than importance. Raw audio **local, never uploaded**; transcripts cold; aggregation reads extracted rows only. Analysis **on demand and pre-exam**; no background transcription.
- [ ] **Lecture capture is descriptive, never predictive (§4.1-Q):** output is **quote + timestamp + measured context only**. **No "high-yield" labels, no likelihood ranking, no confidence scores, no claim about exam relevance.** Consequently **no accuracy ledger and no user verification step** — the student is never asked to tell HQ what was on the exam. Total user cost is pressing record.
- [ ] **Lecture capture behaviour (§4.1-Q):** outputs are material links, emphasis signals, and proposed coverage (**proposes, never applies**); every emphasis claim carries **quote + timestamp**; inferred importance hedges and **never predicts exam content**; cloud transcription disclosed at point of use with on-device preferred; **one Settings line about course recording policy, shown once — no per-course consent gate**; fully optional with no degradation for non-recorders.
- [ ] **Pacing stance (§6.15):** pacing targets are **ahead-of-schedule by design**; copy **never implies failure** when a student is behind HQ's targets but on pace externally; catch-up (#73) stays small and is willing to say what to abandon.
- [ ] **Guided walkthrough (`00-product-shell` §11a):** two replayable mascot-narrated tours (**how to use HQ** and **how to study**), spotlighting real UI, skippable, working on an empty workspace, never blocking, keyboard + reduced-motion accessible.
- [ ] **MCAT decay mapping (#64, §4.2-E):** prerequisite decay re-pointed at the **MCAT date**, reusing the #21 engine and `data/mcat-content.json` weights — **no second decay model**. **Ranked, not scored:** untracked courses show **relative rank plus their inputs only** and **never a retention percentage**; tracked courses may show a projected **band** per §4.1-L. Surfaced in **both** MCAT → Content (self-study order) and the **Planner** (what this scheduling choice costs later). **Never advises against a course, never implies cramming is the fix**, and works with no MCAT date set by using the roadmap window and saying so.
- [ ] **Transcript-fidelity capture (§4.2-D):** institution, course number and title **exactly as the transcript prints them**, credit hours, grade as recorded, term, course type, optional transcript image — captured **at enrollment**, for **every** postsecondary institution. **Never normalised or auto-corrected**; HQ's display name is a **separate field** from the transcript string.
- [ ] **Classification with evidence:** BCPM classified at enrollment **by content, not title or department**, with the syllabus and the user's reasoning stored alongside for later appeal.
- [ ] **Dual GPA always paired (#66):** UNC and AMCAS shown together with the delta explained — every attempt counted, all institutions included, **truncated not rounded** (3.667 → 3.66). Never one number alone.
- [ ] **AMCAS rules are configurable DATA, not hardcoded logic** — Category A, freshness-tracked, sourced from the official AAMC guides, **guide version cited in the UI**, with a verify-in-application-year prompt. **The "50% content" threshold is verified against the official guide before implementation.**
- [ ] **BCPM is computed the AMCAS way** (every attempt including retakes, AMCAS conversion) and is visibly distinguished from UNC's GPA.
- [ ] **Class page has five sub-tabs** (Overview · Materials · Topics · Assignments · Notes) sharing one banner; Overview is a master view of *this* class, not a copy of Class Center.
- [ ] **Organization:** Materials grouped by week with `Course`/`Mine`/`Generated` ownership markers; Topics grouped into unit sections with per-unit progress; Assignments grouped by syllabus category with per-category averages and a weight-sum check; Notes filed by kind. No undifferentiated lists anywhere.
- [ ] **Exam scope** renders a labeled legend plus an on-screen explanation of how scope was derived. No unlabeled stacked bars.
- [ ] **Two note kinds kept separate:** Notes tab = about the class; Materials → My notes = on the material, tagged `Mine` and citable by the gap report.
- [ ] **Priming block** on each Materials module, rolled up as a Notes category.
- [ ] **Watched-folder note ingest:** structure inferred and pre-filled, confirmed once, silent thereafter; re-asks only for new/unguessable levels; unplaceable pages import flagged "confirm week"; one-way, never writes back.
- [ ] **What-if (§6.5)** is category/weight-based, states what's locked in, answers "what do I need on the rest", shows GPA knock-on, and saves nothing.
- [ ] **Contacts panel** on Class Center using shared `Person` records; feeds Letters and Profile/CV.
- [ ] **Coverage ledger (§6.4):** no chunk is dropped; uncovered chunks are flagged; assignment falls back positionally (never a semester-wide misc bucket); `timesSurfaced = 0` items are prioritised pre-exam; the class hub shows a coverage meter.
- [ ] **AI architecture (§6.3):** Anthropic + Citations primary with clickable char-offset provenance, OpenAI optional, Supabase pgvector retrieval scoped by `topicId`, JSON-schema outputs, and full function with zero API keys.
- [ ] All form controls are in-app styled (per `01` §4a) — no native OS dropdowns or date pickers anywhere in Academics.
- [ ] Planning mode = read-mostly big-picture (standing + future outlook); requirement audit rebuilt against **IDEAs in Action** (current UNC curriculum) + med prereqs + per-major data model (all UNC majors pluggable); guided suggestion engine (interests questionnaire + course-description intelligence + conversational advisor + preference learning + optional suggested path), outlook-default with optional suggestions.
- [ ] Verified light/dark, desktop/mobile, keyboard-only, reduced-motion.

## 14. Open decisions

1. Candidate smart/study features (§6.1, §6.2) — promote which to committed.
2. ✅ RESOLVED (July 2026): **`ClassWorkspace` auto-creates when a course enters the current term.** Zero friction (matches the ≤5s logging rule); an unused workspace is empty and costs nothing. **Current term = the user's profile term setting** (the same value the Class Center term picker shows); if unset, infer from today's date and flag it for confirmation rather than guessing silently.
   - **Courses exist for every term** (past, current, planned) — they are the canonical ledger and drive GPA/requirements.
   - **Workspaces exist only for the current term.** A future-term (planned) course is a `Course` with **no workspace**; one is created automatically when that term becomes current. Past-term workspaces are dropped on term rollover (their `Course`, grades, and archived materials persist).
   - On migration, a legacy active workspace for a **non-current** term is **not** an error and must not go to review: drop the workspace, keep the `Course`, and retain the legacy snapshot in the migration journal.
3. ✅ RESOLVED (July 2026): **Live-semester GPA projection reads optional per-assignment `pointsEarned`, `pointsPossible`, `weight`, and syllabus category fields.** Missing grades or weights remain unknown and produce the honest "not enough graded work yet" state; migration never invents them.
4. File storage lands in service-foundation (Supabase); bulk Canvas import mechanism TBD.
5. **UNC requirements research (blocking the audit rebuild):** produce a structured, sourced dataset of IDEAs in Action gen-ed + med prereqs + per-major requirements from `catalog.unc.edu`. Start: gen-ed + med prereqs + common pre-med majors; expand to all UNC majors. Dedicated research task.
6. Guided suggestion engine + conversational advisor depend on Atlas (course knowledge, personalization, Assistant) — phased.
7. Interests questionnaire: standalone vs. part of onboarding — decide with service-foundation onboarding.

---

## `U-12` ruling — Canvas. DUPLICATE-MINIMAL, and integration is impossible. (Aug 2026)

**Full pass: `implementation/U-12-incumbent-audit.md` §2.**

**Canvas is the incumbent for assignments and due dates and UNC runs it.** **`U-12` tests 1 and 2 pass overwhelmingly. Test 4 — can HQ reach it? — fails, and the failure is architectural.**

- **Third-party access requires a Developer Key: an OAuth2 client ID and SECRET issued by a root account administrator after an institutional security review.**
- **A client secret cannot live in a static GitHub Pages bundle.** It would be in the shipped JavaScript.
- **The OAuth2 code exchange requires a server. HQ has no backend by design.**
- **Personal access tokens are the wrong instrument** — **one-hour expiry with refresh**, restricted by university policy, and **every institution's guidance says not to give one to a third-party application.** **Asking a student to paste one is asking them to breach their own university's policy.**

### The ruling

**`academics-syllabus-import.html` is the answer and it was already the right instinct.** **Paste the syllabus, extract the dates, the student confirms** (`U-10` — extraction proposes and waits).

**⚠️ Do not spec, propose, or prototype a Canvas sync. Recorded so it is not re-raised.** **The blocker is the client secret and no design removes it.**

**Store the least that works: title, due date, course, status. Not submissions, not Canvas grades, not attachments.**
