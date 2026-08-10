# Atlas: the retrieval and answering layer

**Status:** Board (Aug 2026). **Reference index, not spec.** Companion to `specifications/02-atlas-interface-and-knowledge-map.md`, which owns the four Atlas surfaces. **This file is about how an answer gets made.**

---

## 1. Andy's brief, recorded (Aug 2026)

**The example he gave, because it is the whole spec in one paragraph:**

> *"I'm a UNC sophomore pre-med. I have a chemistry exam next week, I'm struggling with the material, and the Learning Center appointments are full."*

**And the answer it should produce:** start with CHEMpossible if enrolled in a supported course · because tutoring is full, also check its Canvas group and instructor or TA office hours · **if the problem is how you study rather than the chemistry itself, book Academic Coaching** · with links, and *"schedules and course coverage change each semester."*

**The pipeline:**

> **Student's explanation → AI extracts needs and context → Atlas retrieves matching evidence → safety and eligibility checks → AI writes the response**

**And the rule that makes it trustworthy:** *"The AI would not invent the advice. It would receive a controlled evidence package."*

**The package carries:** UNC resources · external resources UNC refers students to · access instructions · eligibility and cost · deadlines and capacity limits · **student experiences and reported access problems** · official-versus-community distinction · source links · last-verification dates.

**Tiered disclosure:** regular users get concise guidance; **confidence, record IDs, contradictions, and evidence logistics sit behind *"Why Atlas suggested this."***

**Higher-risk cases** — medical emergencies, mental health, immigration, legal, accommodations — **use stricter routing, prioritise official instructions, and do not improvise from Reddit.**

---

## 2. What this is, in standard terms — and why that matters

**This is retrieval-augmented generation, done properly.** Corpus-first, model-second, evidence package as the contract between them. **That is textbook, well-understood, and has known failure modes** — which is good news, because it means the risks are documented rather than novel (`implementation/reference-sources.md` §1: check the established method).

**Three things in the brief are genuinely beyond standard RAG, and they are the good parts:**

| | |
|---|---|
| **Eligibility, cost, and capacity in the package** | Most RAG returns *text*. **Returning constraints means the answer can say "you are not eligible" or "this is full"** rather than cheerfully recommending something unavailable |
| **Student-reported access problems as first-class evidence** | **The most valuable idea in the brief.** Official pages say *"walk-ins welcome."* Students know you have to arrive thirty minutes early. **That gap is exactly what a student needs and no official source will ever contain** |
| **Official-versus-community carried through to the answer** | Already the app's law (`knowledge-sources.md` Category A/B). **Atlas is the first place a single answer mixes both**, so the distinction has to survive into the sentence, not just the database |

---

## 3. What I would add — the gaps

### 3a. Define the record schema BEFORE Codex fills the corpus — this is urgent

**Andy:** *"I'm having Codex research and have a whole encyclopedia for the med information that is out there."*

> **If the schema is not fixed first, the output is prose — and prose cannot be retrieved against, filtered by eligibility, or checked for staleness.**

**The good news: the schema is already written. It is the evidence package.** Every field Andy listed is a column:

`id` · `title` · `whatItIs` · `whoRunsIt` · **`eligibility`** · **`cost`** · **`capacity` / typical wait** · `howToAccess` · **`deadlines`** · `links[]` · **`tier` (official | community)** · **`sourceUrl`** · **`verifiedAt`** · `appliesTo` (course codes, majors, years) · `campus` / location · **`studentReports[]`** · `supersedes` / `contradicts`.

**Two fields that will be forgotten and matter most:** **`verifiedAt`** (§3b) and **`appliesTo`** — *"CHEMpossible supports these specific courses"* is the difference between a useful answer and a wrong one.

**Actionable now:** hand Codex the schema, not just the research question.

### 3b. Staleness is the whole game, and this corpus rots in a semester

*"Schedules and course coverage change each semester."* **Andy wrote that as a disclaimer. It is actually the central engineering problem.**

**Med-school stats change annually. Campus resources change every four months** — tutoring coverage, program hours, staff, whether a thing still exists. **A confidently stale answer is worse than no answer**, because the student acts on it and finds a locked door.

**HQ already has the machinery** (`implementation/data-refresh.md`): **automated detection, human-approved updates**, freshness blocks, and the Attention bell as the surface. **Atlas records must carry the same `freshness` block as `data/*.json`.**

**And the interface consequence:** a record past its review date **is still returned, and says so** — *"last verified March; check before you go."* **Never silently dropped, never silently trusted.**

### 3c. Mental health is not "stricter routing" — it is a different path entirely

**This is the most important thing in this file.**

Andy grouped mental-health crises with immigration and legal questions under *"stricter routing."* **I think that is the wrong shape.** The others are *retrieval problems with higher stakes* — find the official page, do not improvise. **A student in crisis is not a retrieval problem at all.**

> **A student who writes *"I can't cope, I don't know what to do"* must not be handed a ranked list of campus resources with eligibility notes.**

**So: a deterministic check that runs BEFORE retrieval, not a variant of it.**

- **No LLM in the path for the decision to route.** Pattern-matched, conservative, **erring toward routing**.
- **Surfaces real crisis resources immediately** — CAPS, 988, campus emergency — **and stops.** No ranking, no eligibility notes, no *"here are five options."*
- **Never assessment questions.** *"How bad is it?"* is not something an app should ask.
- **The corpus is not consulted.** Community reports about wait times are actively harmful here.
- **Written into the spec as a hard path**, not a prompt instruction, because prompt instructions fail.

**The general principle worth extracting:** **HQ is a premed tracker. There are questions it should decline to be clever about**, and being useful means knowing which.

### 3d. "I don't know" has to be a first-class answer

**RAG's characteristic failure is confident guessing at the edges of its corpus.** When retrieval returns nothing good, an LLM handed a thin evidence package will still write a fluent, plausible paragraph.

**So refusal must be designed, not left to the model:**

- **A retrieval-confidence floor.** Below it, **Atlas says it does not have current information** and points at who would — the advisor, the department, the office.
- **That is a good answer, not a failure state**, and the copy should treat it as one.
- **Never pad a thin result to look complete.** Two real resources beat two real ones plus three guesses.

### 3e. The contradiction case is a feature, not a defect to hide

Andy puts contradictions behind *"Why Atlas suggested this."* **For most contradictions that is right. For one kind it is exactly backwards:**

> **Official source says walk-ins welcome. Twelve students report you must arrive thirty minutes early.**

**That is not a contradiction to resolve — it is the single most useful thing in the corpus**, and burying it behind a disclosure panel throws away the reason to build a community layer at all.

**So: official-versus-reported disagreement about *practical access* surfaces in the answer.** Attributed, dated, clearly marked as reported rather than official (Category B). **Genuine conflicts between two official sources stay behind the panel** — those are a data-quality problem, not information.

### 3f. Scope — the chemistry example is not a premed question

**Worth naming before the corpus is built.** *"I'm struggling in chemistry and tutoring is full"* is **a UNC student question**, not a premed one. The brief's example, and most of the resources in it, serve every undergraduate.

**That is a product decision with real consequences:**

| | |
|---|---|
| **Atlas = premed knowledge** | Tight, defensible, the corpus stays small enough to keep fresh |
| **Atlas = all UNC student resources** | **Far more useful day to day**, and a much larger surface to keep from rotting (§3b) |

**No lean offered — this is Andy's call**, and it determines what Codex should be researching. **It should be answered before the corpus is built, not after.**

---

## 4. How this touches what is already decided

- **Sauce** (`06-knowledge-delivery-board.md`) is **the ambient half of the same corpus.** Atlas answers when asked; Sauce shows up unasked. **Same records, two doors** — and the human-approval gate in Sauce §9b-ii applies to anything Atlas surfaces proactively.
- **`knowledge-sources.md`'s Category A/B is the tier field** (§3a). Not a new concept, an existing one made structural.
- **`data-refresh.md` is the staleness machinery** (§3b). Already approved for implementation.
- **`01` §6.14 — claims phrased by their evidence** — governs the generated sentence. **"Reported by students" and "per the official page" are different claims and must read differently.**
- **`AGENT-IMPLEMENTATION-GUIDE` §2 — AI acts permission-first.** Atlas advises; it never acts on the student's records without confirmation.

---

## 5. Open

| # | |
|---|---|
| **A-a** | **§3f — premed-only, or all UNC student resources?** Determines what Codex researches. **Blocking** |
| **A-b** | **Who re-verifies, and how often?** §3b names the machinery, not the owner |
| **A-c** | **Where do student reports come from?** A shared pool has the same backend, moderation, and N-1 questions as the flyer pipeline (`07-campus-layer-board.md` §3a) |
| **A-d** | **What does Atlas do with no API key?** Everything else in HQ degrades to `○` or `◐`. **Atlas is `●`.** Is the corpus browsable without generation — a searchable directory rather than an answer? |
