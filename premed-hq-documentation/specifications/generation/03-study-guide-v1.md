# 03 · Study Guide Generator — `study-guide-v1`

**Deliverable 4.** Layer 2 for the study-guide artifact.

## Runtime briefing mirror

The API receives the following compact Layer-2 contract, compiled from this
document by `src/lib/generation/artifacts/studyGuide.v1.ts`.

**Runtime objective:** Reorganize the supplied source material into a structure that improves understanding. This is not a rewrite of the lecture notes and not a compression of them. A student who reads this guide and then re-reads the lecture should find the lecture easier to follow than they did the first time.

| id | Runtime rule | Kind |
| --- | --- | --- |
| `SG-1` | Do not preserve bad source organization merely because it appeared in that order. | tunable |
| `SG-2` | Do preserve sequencing when the sequence is pedagogically important. | invariant |
| `SG-3` | Avoid paragraph walls. | tunable |
| `SG-4` | Use hierarchy deliberately; every level must carry meaning. | tunable |
| `SG-5` | Tables only when tabular comparison actually improves comprehension. | tunable |
| `SG-6` | Avoid excessive bullet nesting — maximum depth 2. | tunable |
| `SG-7` | Do not restate a concept across sections unless the repetition serves a distinct learning purpose. | tunable |
| `SG-8` | Do not inflate output to appear comprehensive. | invariant |
| `SG-9` | If material is incomplete, mark the gap explicitly; never invent. | invariant |
| `SG-10` | Every major concept gets an explicit representation decision. Bullets are not the default and must be justified by structure — a process in bullets, a comparison in bullets, and a hierarchy in bullets are all defects. | tunable |
| `SG-11` | Visual grammar is consistent across the whole artifact. | invariant |
| `SG-SHORT-TITLE` | The TITLE section must contain one concise, content-specific label of two to six words. Omit lecture numbers, file names, and words such as generated, transcript, script, or study guide; the app owns chronology and presentation labels. | invariant |
| `SG-AT-A-GLANCE` | The Study Guide is the one canonical lecture-learning document. Begin with an AT A GLANCE section that performs the former Lecture Brief job: give a concise connected orientation, surface the strongest source-supported instructor emphasis, anchor essential vocabulary in context, and name the highest-risk distinction or misconception. This opening is a map into the full guide, not a second summary artifact. | invariant |
| `SG-FULL-DEPTH` | Combining the overview and guide must not reduce coverage or explanatory depth. After AT A GLANCE, teach every supported major concept, process, relationship, comparison, and application at the depth warranted by the selected sources. | invariant |
| `SG-NO-DUPLICATE-LAYERS` | AT A GLANCE names and connects what matters; later sections expand it with mechanism, evidence, examples, and application. Do not repeat the same stand-alone explanation, list, table, or wording in both layers. | invariant |
| `SG-SPLIT` | MUST UNDERSTAND and MUST MEMORIZE must not collapse into two lists of the same items. Test each item: could a student who has memorized this still fail to use it? Then understand. Could a student who understands it still not produce it from memory? Then memorize. Items may legitimately appear in both, but if more than about a quarter do, the split is not being made. | invariant |
| `SG-SECTIONS` | Conditional sections are omitted entirely when the source does not support them. An empty section rendered as a heading with nothing under it is worse than no section. | invariant |
| `SG-PRACTICE-EXAMPLES` | When supplied questions instantiate a concept, use their source-supported scenario, representation, or reasoning move as an explanatory example in the relevant concept, process, or relationship section. Explain what the example teaches without copying its stem or answer choices and without turning the guide into a question bank. | invariant |

---

## 1. Objective

**Reorganize source material into a structure that improves understanding.** Not a rewrite of
lecture notes; not a compression of them.

The test a finished guide must pass: **a student who reads this guide and then re-reads the lecture
should find the lecture easier to follow than they did the first time.** If the guide is only
navigable by someone who already understood the lecture, it has failed.

---

## 2. Required structure

The guide is a sequence of **sections**, each holding **content blocks** (`07` §2). The sections
below are the default skeleton. Sections marked *conditional* are **omitted entirely** when the
source does not support them — an empty section rendered as a heading with nothing under it is worse
than no section.

| # | Section | Required? | Purpose |
|---|---|---|---|
| 1 | **TITLE** | always | One concise, content-specific label of two to six words; no lecture number, file name, or generated/transcript/script/study guide wording |
| 2 | **AT A GLANCE** | always | The former Lecture Brief role inside this same document: a concise connected orientation, strongest instructor emphasis, essential vocabulary in context, and highest-risk distinction. It points into the detailed guide without replacing or duplicating it. |
| 3 | **LEARNING OBJECTIVES** | conditional | Preserved verbatim when the professor supplied them; inferred only when clearly supported |
| 4 | **CORE CONCEPTS** | always | Organized by concept, not slide order |
| 5 | **MECHANISMS / PROCESSES** | conditional | Causal or sequential processes, step by step, with *why* |
| 6 | **RELATIONSHIPS** | conditional | Explicit connections: cause/effect, contrast, prerequisite, feedback, hierarchy |
| 7 | **HIGH-YIELD DETAILS** | conditional | Only what passes the §1.7 defensibility test |
| 8 | **COMPARISONS** | conditional | Comparison tables where ≥2 concepts are genuinely confusable |
| 9 | **COMMON CONFUSIONS** | conditional | Plausible confusion points, with the distinction made explicit |
| 10 | **CLINICAL / REAL-WORLD** | conditional | Only where the source supports it or the mode permits |
| 11 | **MUST UNDERSTAND** | always | Concepts requiring comprehension |
| 12 | **MUST MEMORIZE** | always | Facts, terms, formulas, pathways, values requiring direct recall |
| 13 | **ACTIVE RECALL** | always | Concise self-test prompts on the most important concepts |
| 14 | **FINAL SYNTHESIS** | always | Compact integrated overview |

### 2.1 Notes on specific sections

**AT A GLANCE** — the first reading depth of the same Study Guide, not a separate Lecture Brief.
It should orient a student before the detail by answering: *what problem does this topic solve, what
are its major parts, how do they relate, what did the instructor emphasize, which terms anchor the
map, and what distinction is most likely to cause an error?* Keep it compact and connected. Later
sections may expand an idea named here, but must not repeat the same explanation or list.

**LEARNING OBJECTIVES** — when the professor supplied objectives, they are **preserved verbatim** and
marked `provenance: 'source'`. Inferred objectives are permitted only when the source structure makes
them unambiguous, are capped at 5, and are marked as inferred. **When neither applies, omit the
section.** A guessed objective list is actively misleading — students treat objectives as a contract.

**CORE CONCEPTS** — the ordering decision. Default to conceptual grouping (`G-STRUCT-3`); preserve
source order only where sequence is pedagogically load-bearing (`G-STRUCT-4`). When the generator
reorders, that is not surfaced to the student as a note — but the guide must remain navigable by
someone holding the original slides, so concept blocks carry their `SourceRef` and the renderer can
show slide provenance.

**MUST UNDERSTAND vs MUST MEMORIZE** — this split is one of the most useful things the artifact does
and must not collapse into two lists of the same items. Test: *could a student who has memorized
this item still fail to use it?* Yes → understand. *Could a student who understands the concept
still not produce this from memory?* Yes → memorize. Items may legitimately appear in both, but if
more than ~25% do, the split is not being made.

**ACTIVE RECALL** — questions test the concepts the guide itself marked important. A recall question
about something the guide did not treat as significant is a defect. Target 5–12 depending on
`coverage_depth`. Every question's answer must exist in the guide.

**FINAL SYNTHESIS** — not a repeat of AT A GLANCE. At a Glance frames the topic before the detail;
Final Synthesis integrates *after* it, and should connect concepts that were introduced separately.

---

## 3. Study-guide rules

| id | Rule | Kind |
|---|---|---|
| `SG-1` | Do not preserve bad source organization merely because it appeared in that order | tunable |
| `SG-2` | Do preserve sequencing when the sequence is pedagogically important | invariant |
| `SG-3` | Avoid paragraph walls. See the density rules in `06` §7 | tunable |
| `SG-4` | Use hierarchy deliberately; every level must carry meaning | tunable |
| `SG-5` | Tables only when tabular comparison actually improves comprehension | tunable |
| `SG-6` | Avoid excessive bullet nesting — **max depth 2** | tunable |
| `SG-7` | Do not restate a concept across sections unless the repetition serves a distinct learning purpose | tunable |
| `SG-8` | Do not inflate output to appear comprehensive | invariant |
| `SG-9` | If material is incomplete, mark the gap explicitly; never invent | invariant |
| `SG-10` | Every major concept gets a **representation decision** (`06` §2) — bullets are not the default | tunable |
| `SG-11` | Visual grammar is consistent across the whole artifact (`06` §8) | invariant |
| `SG-SHORT-TITLE` | The TITLE section must contain one concise, content-specific label of two to six words. Omit lecture numbers, file names, and words such as generated, transcript, script, or study guide; the app owns chronology and presentation labels. | invariant |
| `SG-AT-A-GLANCE` | The Study Guide is the one canonical lecture-learning document. Begin with an AT A GLANCE section that performs the former Lecture Brief job: give a concise connected orientation, surface the strongest source-supported instructor emphasis, anchor essential vocabulary in context, and name the highest-risk distinction or misconception. This opening is a map into the full guide, not a second summary artifact. | invariant |
| `SG-FULL-DEPTH` | Combining the overview and guide must not reduce coverage or explanatory depth. After AT A GLANCE, teach every supported major concept, process, relationship, comparison, and application at the depth warranted by the selected sources. | invariant |
| `SG-NO-DUPLICATE-LAYERS` | AT A GLANCE names and connects what matters; later sections expand it with mechanism, evidence, examples, and application. Do not repeat the same stand-alone explanation, list, table, or wording in both layers. | invariant |
| `SG-PRACTICE-EXAMPLES` | When supplied questions instantiate a concept, use their source-supported scenario, representation, or reasoning move as an explanatory example in the relevant concept, process, or relationship section. Explain what the example teaches without copying its stem or answer choices and without turning the guide into a question bank. | invariant |

---

## 4. The representation decision

**For every major concept, the generator explicitly chooses a representation.** This is the core of
the visual system and is specified in full in `06`. Summary of the obligation here:

Prose · bullets · numbered sequence · comparison table · flowchart · hierarchy/tree · labeled
diagram · cycle · timeline · cause-effect chain · formula block · process map · concept map.

**Bullets are not the default and must be justified by structure** — a genuinely unordered set of
peer items. A process in bullets, a comparison in bullets, and a hierarchy in bullets are all
defects.

---

## 5. Gap markers

When the source is incomplete, the guide emits a `gap` block rather than filling it:

```
{ type: 'gap', scope: 'concept' | 'section',
  missing: "The lecture references the citric acid cycle but the supplied
            slides stop at pyruvate oxidation.",
  suggestion: "Check Lecture 12 or the assigned reading." }
```

**A gap block is a feature.** It tells the student their materials are incomplete, which is
information they cannot otherwise get, and it is the honest alternative to a model quietly supplying
the missing content from background knowledge under a mode that forbids it.

---

## 6. Contradiction markers

Per `G-FID-4`, contradictions are surfaced, never resolved:

```
{ type: 'contradiction',
  claims: [ { text: "Km = 5 mM", sourceRef: … },
            { text: "Km = 2 mM", sourceRef: … } ],
  note: "These sources disagree. Confirm which your course uses." }
```

The renderer treats this as a **Warning / Exception** callout. The generator does **not** guess which
is right, does not average them, and does not silently pick the more recent source.

---

## 7. Section sizing

| Control | Effect |
|---|---|
| `coverage_depth: essential` | Core concepts only; sections 5–10 largely omitted; target 8–14 blocks |
| `coverage_depth: standard` | Default. Target 18–30 blocks |
| `coverage_depth: thorough` | Every supported section; target 30–50 blocks |

**A section over ~8 blocks should split into subsections.** Oversized sections are a deterministic
quality check (`08` §2.1), not a judgment call.

---

## 8. What `study-guide-v1` deliberately does not do

Recorded so a later version does not treat these as oversights:

- **No source figures.** Ingestion is text-only (`00` §3). Deferred, not forgotten — `06` §6.
- **No cross-topic guides.** v1 generates for one topic (or one tightly-scoped topic set) within one
  course. Whole-course synthesis is a different artifact with a different grounding problem.
- **No spaced-repetition scheduling.** The guide does not create FSRS state. Flashcards generated
  *from* a guide do (`04` §6).
- **No standalone practice-question set.** ACTIVE RECALL prompts are self-test, not assessment
  items. Supplied question scenarios and reasoning moves may still serve as source-grounded teaching
  examples under `SG-PRACTICE-EXAMPLES`; generated practice exams remain a separate artifact and
  remain restricted in MCAT scope.
