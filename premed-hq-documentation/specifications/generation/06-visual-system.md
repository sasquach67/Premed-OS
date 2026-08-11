# 06 · Visual learning system

Study guides are **visual learning documents**, not text with occasional decoration.

---

## 1. The division of responsibility

Your correction, which is the right one:

> **The model chooses what visual representation best communicates the information.
> premedOS determines exactly how that representation looks.**

| Model decides | premedOS decides |
|---|---|
| This is a comparison → `comparison_table` | Column widths, borders, zebra striping, header weight |
| This is a pathway → `flow_diagram` | Node shape, line thickness, arrowheads, spacing, colour |
| "nucleolus" is a `key_term` | Whether key terms are bold, tinted, underlined, or chipped |
| This warrants a `common_confusion` callout | Icon, border, background, placement |
| This process has 4 nodes and 3 directed edges | Layout algorithm, orientation, responsive collapse |

**The model never emits styling.** No colours, no font sizes, no CSS, no markdown emphasis as
styling, and — critically — **no ASCII diagrams**. It emits semantic type and structure.

**The purpose test, applied to every visual:** does this *reduce cognitive load*, *clarify a
relationship*, *improve scanning*, or *strengthen retrieval*? A visual that does none of these is
decoration and must not be emitted.

---

## 2. The representation decision

For every major concept the generator makes an explicit choice from this set. **Bullets are not the
default.**

| Representation | Use when |
|---|---|
| `prose` | A single idea needing explanation, not decomposition |
| `bullets` | A genuinely unordered set of peer items |
| `numbered_steps` | Ordered steps where order matters but there are no branches |
| `comparison_table` | ≥2 entities compared across ≥2 shared dimensions |
| `flow_diagram` | A pathway or process with direction, and possibly branching |
| `hierarchy_tree` | Containment or classification — taxonomy, cell lineages, system organization |
| `labeled_diagram` | Spatial or structural understanding is the point |
| `cycle_diagram` | A process that returns to its start |
| `timeline` | Events or phases along time |
| `cause_effect_chain` | A causal chain where each link drives the next |
| `formula_block` | A mathematical or chemical relationship |
| `concept_map` | Several concepts with multiple non-hierarchical relationships |
| `process_map` | A process with parallel tracks or actors |

### 2.1 Structure-matching rules

| Signal in the material | Correct representation | Common wrong choice |
|---|---|---|
| "First… then… finally" | `numbered_steps` or `flow_diagram` | bullets |
| "A differs from B in…" | `comparison_table` | prose paragraph |
| "X activates Y, which inhibits Z" | `flow_diagram` with typed edges | bullets |
| "Type I, Type II, Type III under Class A" | `hierarchy_tree` | nested bullets |
| "Returns to the starting compound" | `cycle_diagram` | `numbered_steps` |
| "Occurs during phase 3 of 5" | `timeline` | prose |
| Anatomical parts and their positions | `labeled_diagram` | bullets |

**A process rendered as bullets, a comparison rendered as prose, or a hierarchy rendered as nested
bullets are all defects**, checkable in the quality pass.

---

## 3. The eight visual primitives

The native block types premedOS renders. Schemas in `07` §3.

| # | Primitive | Structure | Example |
|---|---|---|---|
| 1 | **Comparison table** | columns × rows | Organelle · Structure · Function |
| 2 | **Flowchart** | nodes + directed typed edges | Secretory pathway |
| 3 | **Cycle diagram** | ordered nodes, closed loop | Krebs, cardiac, menstrual |
| 4 | **Hierarchy / tree** | parent → children | Immune cell lineages |
| 5 | **Labeled diagram** | regions + labels + relations | Nephron, neuron |
| 6 | **Cause-effect chain** | ordered causal links | Pathophysiology cascades |
| 7 | **Timeline / sequence** | ordered phases with optional durations | Action potential phases |
| 8 | **Concept map** | nodes + labelled non-hierarchical edges | Endocrine axis relationships |

### 3.1 Tables

Use when students compare multiple entities across **shared dimensions**.

```
Organelle       | Structure          | Function
Hormone         | Source | Target    | Effect
Transport type  | Energy | Direction | Example
```

**Do not convert arbitrary lists into tables for appearance.** A table needs ≥2 rows and ≥2 columns
of genuinely varying content. A two-column table where one column is a term and the other a
definition is a definition list, not a comparison.

### 3.2 Processes

Encode **structurally**, never as text arrows. The generator identifies:

**sequence · direction · branches · feedback · inhibition · activation · dependencies**

Edge relation vocabulary (closed set):

```
leads_to | converts_to | activates | inhibits | requires
produces | feeds_back  | part_of   | regulates
```

`inhibits` and `feeds_back` exist because a flow diagram that renders inhibition as a plain arrow has
lost the biology. The renderer draws a bar-headed line for `inhibits` and a dashed return path for
`feeds_back` — **consistently, everywhere in the product.**

### 3.3 Labeled diagrams

Use where **spatial or structural** relationships carry the understanding: cell anatomy, organelles,
nephron structure, neuronal signaling, cardiac circulation, DNA replication forks.

**Do not add a diagram merely because the topic is biological.** The test: would a student who read
the prose still be unclear about *where* things are relative to each other? If no, no diagram.

v1 emits regions and labels structurally; premedOS renders a schematic. It does **not** attempt
anatomically accurate illustration.

---

## 4. Semantic emphasis

The model marks emphasis **semantically**. The frontend styles it.

```json
{ "text": "nucleolus", "emphasis": "key_term" }
```

| Emphasis type | For |
|---|---|
| `key_term` | Vocabulary the student must know by name |
| `molecule` | Named chemical species |
| `structure` | Named anatomical or cellular structure |
| `pathway` | Named pathway or process |
| `formula` | Equation or expression |
| `value` | A number that must be retained — Km, pH, normal range |
| `distinction` | The word carrying a discriminating difference |
| `instructor_emphasis` | Flagged by the source as emphasized |

### 4.1 The emphasis budget (invariant)

From `02` §1.8, repeated because this is where it gets violated:

- **≤ 8% of body words** emphasized, per section
- **≤ 3 callouts per section**, never two adjacent of the same type
- **first meaningful occurrence only** within a section

**Emphasis loses all value when everything is emphasized.** These are deterministic checks (`08`
§2.1) — the model is not trusted to self-police them.

---

## 5. Semantic callouts

Model chooses the type; frontend chooses the appearance.

| Callout | Use for |
|---|---|
| `key_idea` | The one thing to take from this section |
| `must_know` | Required for the exam, per the §1.7 defensibility test |
| `common_confusion` | A distinction students reliably get wrong |
| `mechanism` | The causal explanation behind a stated fact |
| `clinical_connection` | Real-world relevance — mode-gated (`02` §2) |
| `exam_emphasis` | Instructor explicitly flagged it |
| `memorization` | Must be committed to memory as stated |
| `conceptual_understanding` | Must be understood rather than memorized |
| `warning_exception` | An exception, edge case, or **contradiction marker** (`03` §6) |
| `memory_tip` | A mnemonic or retrieval aid |

`clinical_connection` under `SOURCE_ONLY` is **only** emitted when the source itself makes the
connection. `exam_emphasis` requires an `instructor-emphasis` basis. `memory_tip` under `SOURCE_ONLY`
requires the source to supply the mnemonic — the model may not invent one.

---

## 6. Source figures — deferred (**decision D-3 resolved: defer**)

Ingestion stores text only (`00` §3). There is no figure, image, or table extraction anywhere in the
pipeline.

**v1 behavior:**

- **Never fabricate a figure reference.** `G-FID-3`. No "see the diagram on slide 14" unless the
  system knows a diagram is there — and it does not.
- **Do** emit native structural diagrams for processes and relationships the *text* describes. This
  is the value the visual system delivers in v1 and it does not depend on ingestion.
- Slide/page anchors **are** available — `SourceChunk.sourcePosition.lectureNumber` and `.label` —
  and are resolved client-side from the `chunkId` (`01` §4.1). "See Lecture 6, Slide 14" is
  therefore buildable and honest, because the model never authors the number.

**When ingestion gains figure extraction**, the addition is: a `source_figure` block type
referencing an extracted asset id, and a global rule permitting figure references only against
extracted assets. Deferred cleanly — nothing in v1 needs redesign to accommodate it.

---

## 7. Density and whitespace

**Comprehensive does not mean visually dense.**

Preferred rhythm:

```
short explanation → visual → supporting detail
```

not:

```
paragraph → paragraph → paragraph
```

| Rule | Detail | Check |
|---|---|---|
| `VIS-1` | ≤ 2 consecutive prose blocks in a section | deterministic |
| `VIS-2` | A section > 8 blocks splits into subsections | deterministic |
| `VIS-3` | Prose blocks ≤ ~120 words; longer must decompose | deterministic |
| `VIS-4` | Bullet nesting ≤ 2 levels (`SG-6`) | deterministic |
| `VIS-5` | ≥ 1 non-prose representation per major section, where the material supports one | model-judged |

---

## 8. The consistency rule (invariant)

**The same semantic type is represented the same way throughout the artifact.**

- Key term → same emphasis type, every time
- Memory aid → always `memory_tip`, never sometimes prose
- Process → same representation for processes of the same shape
- Comparison → always a `comparison_table`, never sometimes a bulleted contrast
- High-yield exception → always `warning_exception`

**Why this is invariant rather than stylistic:** predictability is a learning affordance. A student
who has read two sections of a premedOS guide should know how to read the third without re-deriving
its conventions. Attention spent decoding the document is attention not spent on the biology.

Deterministic check: within one artifact, the same `concept.kind` must map to the same block type.
Two comparisons rendered differently in one guide is a defect.

---

## 9. The scan test

Before finalizing, the guide is checked against:

> **If a student spent 30 seconds scanning this page, could they identify the major topic, the
> important terminology, the major relationships, the major processes, and the most important
> distinctions?**

### 9.1 Made computable — *added; the prose version is not checkable*

The scan test as written is a model judgment, and a model asked "is this scannable?" will say yes.
These proxies are deterministic and correlate with the real thing:

| Metric | Threshold |
|---|---|
| Heading coverage | Every section has a heading; nesting ≤ 3 levels |
| Representation variety | ≥ 30% of blocks in a guide are non-prose |
| Emphasis presence | Every major section has ≥ 1 emphasized term and ≤ 8% emphasized words |
| Prose run length | No run of > 2 consecutive prose blocks (`VIS-1`) |
| Terminology surfacing | Every `must_memorize` term appears as an emphasized `key_term` somewhere |
| Relationship visibility | If the section describes ≥ 2 typed relationships, ≥ 1 is a structural block |

Failing thresholds are `advisory` findings that trigger a targeted regeneration of the offending
section — not a whole-artifact regeneration (`08` §2.4).
