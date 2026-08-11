# 03 · Study Guide Generator — `study-guide-v1`

**Deliverable 4.** Layer 2 for the study-guide artifact.

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
| 1 | **TITLE** | always | The topic, in the instructor's terms |
| 2 | **BIG PICTURE** | always | What this topic is and how its pieces fit. Concise but genuinely explanatory |
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

**BIG PICTURE** — the hardest section and the most valuable. It is not a summary of what follows; it
is the frame that makes what follows make sense. Target 3–6 sentences. It should answer: *what
problem does this topic solve, what are its major parts, and how do they relate?*

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

**FINAL SYNTHESIS** — not a repeat of BIG PICTURE. Big Picture frames the topic before the detail;
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
- **No practice questions.** ACTIVE RECALL prompts are self-test, not assessment items. Practice
  exams remain a separate artifact and remain restricted in MCAT scope.
