# 10 · Reading Summary Generator — `reading-summary-v1`

**PROPOSED, Aug 2026 — not approved for build.** Layer 2 for the reading-summary artifact.
Drafted after Andy asked for a third generator alongside `03` and `04`. **Three decisions at
the bottom are his; the rest follows from the layers that already exist.**

Maps to the `summary` and `explanation` entries already permitted in `generationPolicy.ts`'s
Academics allow-list (`00` §5). Sequenced in `09` Phase 6 unless Andy moves it.

---

## 1. Objective

**Make a reading usable — not shorter.**

`G-PURPOSE-1` is an invariant and it forbids the obvious reading of the word "summary":

> Optimize for comprehension, retention, and retrieval — **not** summarization. An artifact
> that faithfully compresses the source but does not improve learning has failed.

This artifact therefore is not a précis. Its objective is to answer the questions a student
cannot answer after one pass over an unfamiliar reading: **what is being claimed, on what
evidence, and what am I supposed to take from it.**

The test a finished artifact must pass: **a student who reads this and then reads the source
should extract more from the source than they would have unaided** — and should be able to say
what the reading does *not* establish. If it only saves them the reading, it has failed and is
the thing `G-PURPOSE-1` was written to prevent.

---

## 2. Why one artifact and not three

A primary research paper, a textbook chapter, and a Writing-course assigned reading need
different structures — but they share one objective, one source-mode model, one schema, and one
quality gate. Splitting them into three L2 documents would triplicate `02` compliance for
nothing.

**One artifact, three section skeletons, selected by a `reading_kind` control** (new, `05` §1):

| `reading_kind` | For | Selected by |
|---|---|---|
| `primary-research` | A study: an original claim resting on data | student, at generation |
| `textbook-chapter` | Expository material teaching established content | student, at generation |
| `assigned-reading` | A Writing-course reading argued over in discussion (§4.1-N) | student, at generation |

**The student picks; the generator never infers the kind from the filename or the text.** Guessing
wrong produces a confidently mis-shaped artifact, which is worse than asking.

---

## 3. Section skeletons

Sections marked *conditional* are **omitted entirely** when the source does not support them
(same rule as `03` §2 — an empty heading is worse than no heading).

### 3.1 `primary-research`

| # | Section | Required? | Purpose |
|---|---|---|---|
| 1 | **CITATION** | always | Authors, year, journal, as the source states them. Never reconstructed |
| 2 | **THE QUESTION** | always | What the paper set out to establish, and why it was open |
| 3 | **WHAT THEY DID** | always | Design, model system, measurement — enough to judge the claim |
| 4 | **WHAT THEY FOUND** | always | Findings tied to the figure or table each rests on |
| 5 | **WHAT IT DOES NOT ESTABLISH** | always | Stated limits, and limits the design implies |
| 6 | **TERMS AND TECHNIQUES** | conditional | Methods a student meeting them first time cannot read past |
| 7 | **HOW IT CONNECTS** | conditional | To the course's own topics — only where genuinely supported |
| 8 | **ACTIVE RECALL** | always | Self-test prompts, answerable from this artifact (`03` §2.1 rules apply) |

**§5 is the section that makes this artifact worth building.** Pre-meds routinely read a paper as
a set of true facts rather than one bounded claim. It is also where `G-FID-5` bites: where the
source itself hedges, the hedge is preserved, never firmed up.

### 3.2 `textbook-chapter`

⚠️ **This skeleton overlaps `study-guide-v1` substantially, and that overlap is a decision, not
an accident — see D-3 below.** Expository content organised by concept is what `03` already does
well.

| # | Section | Required? |
|---|---|---|
| 1 | **BIG PICTURE** | always |
| 2 | **CORE CLAIMS** | always |
| 3 | **MECHANISMS** | conditional |
| 4 | **WHERE STUDENTS GO WRONG** | conditional |
| 5 | **MUST MEMORIZE** | always |
| 6 | **ACTIVE RECALL** | always |

### 3.3 `assigned-reading` (Writing courses)

**The case with no existing home.** `study-guide-v1` is grounded in a class's topics; Writing
classes have no topics, no FSRS, and no recall loop (§4.1-N). This skeleton is the only generated
artifact those classes can receive.

| # | Section | Required? | Purpose |
|---|---|---|---|
| 1 | **CITATION** | always | As stated |
| 2 | **THE ARGUMENT** | always | The claim being advanced, in one paragraph |
| 3 | **HOW IT ARGUES** | always | Evidence and rhetorical moves — the thing a Writing course grades |
| 4 | **WHAT IT ASSUMES** | conditional | Unstated premises the argument requires |
| 5 | **WHERE IT SITS** | conditional | Against other assigned readings, only where the course's own records support it |
| 6 | **DISCUSSION PREP** | always | Open questions to take into section — **not** self-test prompts |

**No ACTIVE RECALL, no cards, no FSRS state.** A Writing reading is argued about, not retrieved.

---

## 4. Reading-summary rules

| id | Rule | Kind |
|---|---|---|
| `RS-1` | The artifact never replaces the reading; it prepares the student to read it | invariant |
| `RS-2` | Every claim carries the figure, table, section, or page it rests on (`G-FID-7`) | invariant |
| `RS-3` | Never state a finding more confidently than the source states it | invariant |
| `RS-4` | Never infer `reading_kind`; the student selects it | invariant |
| `RS-5` | Citation metadata is transcribed, never reconstructed from memory | invariant |
| `RS-6` | A paper's limitations section is never omitted as unimportant | invariant |
| `RS-7` | Do not evaluate the research's quality, novelty, or importance — report what it claims and bounds it | invariant |
| `RS-8` | Length follows the reading's structure, not its page count | tunable |
| `RS-9` | Terms are explained only where a first-time reader would stall | tunable |
| `RS-10` | Every major claim gets a representation decision (`06` §2); prose is not the default | tunable |

`RS-7` is the boundary between this artifact and a literature review. Premed OS says what a paper
claims and where it stops. It does not tell a student whether the paper is any good.

---

## 5. Inherited without restatement

Gap markers (`03` §5), contradiction markers (`03` §6), source modes (`02` §2), coverage
disclosure (`D-8`), block identity (`07` §5), edit protection and regeneration (`08`), and the
quality gate all apply unchanged. **A contradiction between a reading and the course's lecture
material is surfaced, never resolved** — that case is common and pedagogically important.

## 6. Sizing

| `coverage_depth` | Target |
|---|---|
| `essential` | Sections 1–5 of the selected skeleton; 6–10 blocks |
| `standard` | Default; 12–20 blocks |
| `thorough` | Every supported section; 20–34 blocks |

## 7. What `reading-summary-v1` deliberately does not do

- **No figure extraction.** Ingestion is text-only (`00` §3). A finding cites its figure by number
  and says the figure must be looked at. Deferred with `06` §6, not forgotten.
- **No multi-reading synthesis.** One reading per artifact. Comparing three papers is a different
  artifact with a different grounding problem.
- **No quality or novelty judgement** (`RS-7`).
- **No cards.** Flashcards from a reading go through `04`, grounded in the artifact's own blocks.
- **No Writing-course recall loop.** §3.3 produces discussion prep, and that is the whole output.

---

## 8. Decisions for Andy — this document is not buildable until these close

- **D-1 · Does `textbook-chapter` exist at all?** It overlaps `study-guide-v1` by design (§3.2).
  Options: keep it, or drop it and route textbook chapters to `03` with a
  `guide_structure: source_first` preset instead. **Dropping it is the smaller system**; keeping it
  is better if a chapter should read differently from a lecture. One or the other, not both.
- **D-2 · Where does this sit in `09`?** Phase 6 (deferred) as written, or promoted after Phase 3.
  Promoting is cheap — it reuses the study-guide machinery — but it competes with Phase 4
  flashcards for the same build slot.
- **D-3 · Is `assigned-reading` in scope for v1?** It is the only generated artifact a Writing
  class can ever receive, which argues for including it. It also has no topic grounding, so
  Guardrail 1 ("grounded in the class's own materials") is satisfied by the uploaded reading alone
  — a weaker grounding than any other artifact in this set. **This is a real loosening and needs
  an explicit yes.**
