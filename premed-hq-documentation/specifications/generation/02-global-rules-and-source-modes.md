# 02 · Global learning rules · Source modes

**Deliverables 3 and 8.** Layer 1 of the stack, plus the three source modes.

---

# §1 · Global learning rules (L1)

Applied to **every** educational artifact — study guides, flashcards, summaries, explanations,
recall prompts, and gap-check. Each rule carries a stable id so presets and preferences can
reference tunables, and so the assembler can reject any attempt to touch an invariant.

## 1.1 Purpose (invariant)

| id | Rule |
|---|---|
| `G-PURPOSE-1` | Optimize for comprehension, retention, and retrieval — **not** summarization. An artifact that faithfully compresses the source but does not improve learning has failed. |
| `G-PURPOSE-2` | The student is a pre-med studying for real coursework. Assume motivation, assume limited time, assume the material will be tested. |

## 1.2 Factual fidelity (invariant — the load-bearing block)

| id | Rule |
|---|---|
| `G-FID-1` | Preserve factual fidelity to the source material. |
| `G-FID-2` | Under `SOURCE_ONLY`, introduce **no** fact not supported by the supplied sources. |
| `G-FID-3` | Never fabricate a source reference, slide number, page, or figure. |
| `G-FID-4` | **Do not silently resolve contradictions in the source.** If two sources disagree, surface both and mark the disagreement. |
| `G-FID-5` | **Surface ambiguity when the source itself is unclear.** Do not smooth it into false confidence. |
| `G-FID-6` | **If material is incomplete, say so.** Emit an explicit gap marker. Never invent to fill it. |
| `G-FID-7` | Every claim carries `provenance`: `source` \| `clarification` \| `background`. Never omit it. |

> **On `G-FID-4` and `G-FID-5`:** these are the two rules most likely to be quietly dropped, because
> a clean-looking artifact scores better on first impression than an honest one. A study guide that
> says *"Lecture 4 gives the Km as 5 mM; the assigned reading says 2 mM — check with your
> instructor"* is doing its job. One that silently picks 5 mM is not.

## 1.3 Terminology (invariant)

| id | Rule |
|---|---|
| `G-TERM-1` | Preserve the instructor's terminology when it is meaningful — if the lecture says "sodium-potassium ATPase," do not silently switch to "Na⁺/K⁺ pump." |
| `G-TERM-2` | When a synonym genuinely aids understanding, give it **alongside** the instructor's term, never instead of it. |
| `G-TERM-3` | Preserve important qualifiers. "Usually," "in most tissues," "at physiological pH" change meaning and must not be trimmed for concision. |

## 1.4 Structure and relationships (tunable unless noted)

| id | Rule | Kind |
|---|---|---|
| `G-STRUCT-1` | Explain **relationships** between concepts, not isolated facts | invariant |
| `G-STRUCT-2` | Prefer meaningful chunking over arbitrary fragmentation | invariant |
| `G-STRUCT-3` | Reorganize by concept; do not preserve source order merely because it existed | tunable |
| `G-STRUCT-4` | **Do** preserve sequence when the sequence is itself pedagogically meaningful — a pathway, a developmental series, an action potential | invariant |
| `G-STRUCT-5` | Distinguish conceptual understanding from pure memorization | invariant |

## 1.5 Economy (tunable)

| id | Rule |
|---|---|
| `G-ECON-1` | Reduce unnecessary repetition. Restating a concept in a second section requires a distinct learning purpose. |
| `G-ECON-2` | Avoid decorative verbosity. No throat-clearing, no restating the prompt, no "in this section we will." |
| `G-ECON-3` | **Do not inflate output to appear comprehensive.** Length is not evidence of quality and will not be treated as such. |
| `G-ECON-4` | Avoid oversimplifying to the point that nuance is lost. Economy is not the same as thinness. |

> `G-ECON-3` and `G-ECON-4` pull against each other on purpose. The resolution is that **coverage is
> set by `coverage_depth`** (`05` §2), and within that budget the artifact should be as short as it
> can be while still teaching. Neither rule licenses the other's failure.

## 1.6 Emphasis (invariant)

| id | Rule |
|---|---|
| `G-EMPH-1` | Preserve instructor emphasis. Explicit signals — "this will be on the exam," bolding, repetition across lectures, a stated objective — are the strongest available evidence of importance. |
| `G-EMPH-2` | **Do not assume all details deserve equal emphasis.** Flat treatment is a failure mode, not neutrality. |
| `G-EMPH-3` | Do not emphasize excessively. See §1.8 for the hard budget. |

## 1.7 The high-yield defensibility test (invariant) — *added; you asked for a defensible basis*

You wrote: *differentiate "high-yield" only when there is a defensible basis.* Without a definition,
the model guesses and everything becomes high-yield. **A claim may be marked high-yield only on one
of these five bases, and the basis must be recorded on the block:**

| Basis | Evidence in source |
|---|---|
| `instructor-emphasis` | Explicit signal — "know this," "exam," bold/starred, repeated across slides |
| `stated-objective` | Appears in the professor's own learning objectives |
| `cross-source-repetition` | Independently present in ≥2 supplied sources |
| `structural-load` | Other concepts in this topic depend on it — a prerequisite in the relationship graph |
| `assessment-form` | The source itself presents it in tested form — a practice question, worked problem, or review item |

**Not admissible:** the model's general sense that pre-meds find it important; that it is a common
MCAT topic; that it sounds fundamental; that it appeared in the source at all.

**Hard budget: at most 20% of a topic's concepts may be marked high-yield.** Over budget, the
generator must rank by basis strength (in the order above) and cut. If nothing meets a basis, the
high-yield section is **empty** — an empty section is a valid and honest outcome.

## 1.8 Emphasis budget (invariant) — *added; makes "do not highlight everything" checkable*

| id | Rule |
|---|---|
| `G-EMPH-4` | **≤ 8% of body words** may carry semantic emphasis, per section. |
| `G-EMPH-5` | **≤ 3 callouts per section**, and never two adjacent callouts of the same type. |
| `G-EMPH-6` | A term is emphasized on **first meaningful occurrence only** within a section. |

All three are deterministic and enforced in code (`08` §2.1), not left to model judgment.

## 1.9 Scope (invariant)

| id | Rule |
|---|---|
| `G-SCOPE-1` | Generation is always for one course and grounded in that course's own materials (`generationPolicy.ts` guardrail 1). |
| `G-SCOPE-2` | MCAT scope permits only `missed-to-mastery` and `flashcards`. QBank questions and CARS passages are **never** generated. |
| `G-SCOPE-3` | Generated artifacts are marked `owner: 'generated'` and never titled as the genuine article. |

---

# §2 · Source modes

**One setting, three values, applied at L1 and enforced server-side.** The mode determines *what
knowledge may enter the artifact* — never what quality it should have.

Every claim carries `provenance`. The mode is the filter over that field.

| Mode | `source` | `clarification` | `background` |
|---|---|---|---|
| `SOURCE_ONLY` | ✅ | ❌ | ❌ |
| `SOURCE_PLUS_CLARIFICATION` | ✅ | ✅ marked | ❌ |
| `SOURCE_PLUS_BACKGROUND` | ✅ | ✅ marked | ✅ marked |

## 2.1 `SOURCE_ONLY`

**Every claim must be traceable to a supplied chunk.**

- No definition, mechanism, example, or clinical connection the source does not contain.
- No filling of gaps. Where the source is incomplete, emit a `gap` marker naming what is missing.
- **Clinical connections are suppressed entirely** unless the source itself makes them.
- Analogies are permitted **only** as restatements of a source analogy.
- Every block carries a `SourceRef`. A block without one is rejected by the validator.

**Use when:** the exam is explicitly lecture-scoped; the instructor's framing is idiosyncratic; the
student is being tested on *this* material rather than *the* material.

**Cost:** thinner artifacts. That is correct behavior, not degradation, and the UI should say so
rather than let the student read thinness as a failure.

## 2.2 `SOURCE_PLUS_CLARIFICATION`

**Source content, plus explanation that makes the source's own claims comprehensible.**

Permitted: defining a term the source uses but does not define · restating a mechanism in plainer
language · adding a connective sentence that makes an implicit relationship explicit · an analogy
that illuminates a source claim · naming a prerequisite the source assumes.

**Forbidden:** any *new* fact — a value, structure, step, exception, or entity not in the source.
The test is: **does this add information, or make existing information easier to grasp?** Only the
second is clarification.

Clarification blocks carry `provenance: 'clarification'` and no `SourceRef` (they are not source
claims), but must name the source claim they clarify via `clarifies: blockId`.

**This is the default mode.** It matches how a good TA explains a lecture.

## 2.3 `SOURCE_PLUS_BACKGROUND`

**Source content, clarification, plus genuinely external knowledge.**

Permitted: standard background the course assumes · a clinical correlation the source omits · a
common-confusion warning drawn from general knowledge of the subject · connecting the topic to
material from a different course.

**Constraints (invariant even in this mode):**

- `G-FID-1` still holds — **background may never contradict the source.** Where it appears to, that
  is a contradiction to surface (`G-FID-4`), not to resolve.
- Background carries `provenance: 'background'` and **no `SourceRef`** — fabricating one is
  `G-FID-3`.
- Background may **never** be marked high-yield. High-yield is a claim about *this course's*
  assessment, and external knowledge cannot support it (§1.7).
- Background is capped at **25% of blocks** in a study guide. Past that it is a textbook, not a study
  guide for this lecture.

### ✅ Decision D-1 — RESOLVED Aug 2026

**Andy's call: background is marked, and the student may hide the inline markers.**

The risk in a plain hideable toggle is that it gets switched off once, persists, and the
source-fidelity guarantee quietly stops being visible — which is the same outcome as never marking
it. The following rules keep his choice while closing that hole. **The distinction throughout is
between the inline *decoration*, which may be hidden, and the *fact* that background is present,
which may not.**

| id | Rule |
|---|---|
| `G-BG-1` | Inline markers are **ON by default** on every newly generated artifact. A student never meets an unmarked guide first. |
| `G-BG-2` | The hide toggle is **per artifact**, not a global setting. Hiding markers on one guide never pre-hides them on the next. |
| `G-BG-3` | **The artifact header always shows the count** — *"3 sections include background knowledge"* — even with markers hidden. This is the part that cannot be dismissed. |
| `G-BG-4` | Hiding is **presentation only.** `provenance` is never removed from the data, from export, or from the source panel. |
| `G-BG-5` | A `contradiction` block (`G-FID-4`) is **never** hideable, in any mode. Where the source and background disagree, that is not decoration. |
| `G-BG-6` | Where markers are hidden, the source panel filter (§2.8) still separates source from background on demand. |

`G-BG-3` is the load-bearing one. The student can have the clean reading experience they asked for,
and still cannot end up believing a background claim came from their professor — because the count is
always on the page, one click from being made visible again.

## 2.4 Interaction with preferences

`source_only_preference` (`05` §3) sets the **default** mode. It does not lock it — the mode is
per-request and visible at generation time. A student who prefers source-only should be able to ask
for background on a topic they are struggling with without changing a setting.

## 2.5 Enforcement

Mode is **not** advisory. Post-generation, server-side, before persistence:

```
for each block:
  if block.provenance not permitted by mode        → reject artifact
  if mode == SOURCE_ONLY and block has no SourceRef → reject artifact
  if block.provenance == 'background' and block.highYield → reject artifact
  if block.sourceRef not in verified citation set   → reject artifact
```

**Reject, not strip.** A model that ignored the mode produced an artifact built on a different
premise; salvaging blocks from it silently ships the half that happened to comply.

---

## 2.6 Source primacy (invariant) — *added Aug 2026, Andy's question*

The modes above say what knowledge *may* enter. This section says what is **primary** when more than
one kind is present. Without it, `SOURCE_PLUS_BACKGROUND` drifts into a textbook chapter with the
student's lecture as a footnote — which is the opposite of the product.

| id | Rule |
|---|---|
| `G-PRIM-1` | **The student's own materials are the spine of every artifact.** Background and clarification are subordinate to them in all three modes, including `SOURCE_PLUS_BACKGROUND`. |
| `G-PRIM-2` | A `background` block may **never lead** a section. It attaches to a source claim via `elaborates: blockId` and is rendered after it. Background with nothing to attach to is out of scope for this topic and is dropped. |
| `G-PRIM-3` | The **structure** of the artifact — which concepts exist, how they are grouped, what is high-yield — derives from the source alone. Background may add depth to a concept; it may never introduce one. |
| `G-PRIM-4` | Where source and background disagree, this is a `contradiction` (`G-FID-4`), and **the source's version is stated first**. |
| `G-PRIM-5` | Background is capped at **25% of blocks** (§2.3) and is excluded from the high-yield budget entirely. |

**Deterministic checks:** every `background` block has a resolvable `elaborates` target · no section's
first block is `background` · background block share ≤ 25% · no concept exists whose only support is
background.

## 2.7 Cross-referencing across your files — *added Aug 2026*

Retrieval is scoped by `courseId + topicId` and is **file-agnostic within that scope.** One
generation therefore sees the lecture slides, the assigned reading, and the student's own notes for
that topic together, and the following behaviors fall out of that:

| Behavior | Rule |
|---|---|
| **Agreement across sources** | ≥2 independent sources supporting a claim is `cross-source-repetition`, one of the five admissible high-yield bases (§1.7) |
| **Disagreement across sources** | `G-FID-4`. Emit a `contradiction` block citing both. Never resolve, never average, never prefer the more recent file |
| **Coverage in one source, silence in another** | Not a contradiction. Not remarked on |
| **The professor's framing wins on terminology** | `G-TERM-1`. Where a `sourceType: 'course'` file and a student note use different terms, the course file's term is primary |

**Out of scope for v1:** cross-*topic* and cross-*course* synthesis. One artifact grounds in one
topic. A guide that reaches across a whole course is a different artifact with a different retrieval
and grounding problem, and is deferred (`03` §8).

## 2.8 Source coverage must be visible (invariant) — *added Aug 2026*

Retrieval caps mean an artifact may be built from **less than all** of the student's uploaded
material for a topic — `MAX_CHUNKS = 24`, semantic top-12 — and today that truncation is silent
(audit findings A11/A12).

**For a product whose promise is "grounded in your materials," silent partial coverage is the most
damaging possible failure**: the student reads a complete-looking guide and concludes their reading
contained nothing the lecture didn't.

| id | Rule |
|---|---|
| `G-COV-1` | Every artifact records `chunksUsed`, `chunksAvailable`, and the **set of `fileId`s actually drawn from**. |
| `G-COV-2` | The UI states coverage plainly — *"Built from 3 of your 5 files for this topic."* |
| `G-COV-3` | A file in scope that contributed **zero** blocks is named, so the student can tell whether it was irrelevant or missed. |
| `G-COV-4` | When retrieval falls back to non-semantic ordering (no embedding key), the artifact is **marked as reduced-quality retrieval**. The same label must never cover two different retrieval qualities. |

This also gives the source panel its data: because every block carries a `chunkId` → `fileId`, the
renderer can filter a guide by source file — *"show me only what came from the assigned reading"* —
with no additional model work. **Specced here as required data; the UI is not designed in this set.**

---

# §3 · Source sufficiency — *added Aug 2026, Andy's question*

## 3.0 The governing principle

**Never offer an action that cannot succeed, and never let correct thinness look like failure.**

Today's behavior is a single hard failure — `if (!chunks.length) return failure(422, 'no-sources')`
— surfaced to the student as generic copy after they have already pressed the button. That conflates
four states that need four different responses.

## 3.1 The four states

| State | Condition | Where it is handled | Response |
|---|---|---|---|
| **A · No material** | Zero chunks for this topic | **Before the button** | Button disabled, inline reason. Not an error |
| **B · Unusable material** | Files exist but produced no text — `processingStatus: 'failed'`, scanned PDF, image-only slides | **Before the button** | Button disabled, names the file and the cause |
| **C · Thin but viable** | Above the artifact floor, below the comfortable range | **Generate normally** | **Not an error.** Generate, disclose scope, gap-mark |
| **D · Misrouted material** | Chunks exist for the course but none assigned to this topic | **Before the button** | Button disabled, offers the fix — assign chunks to the topic |

**State D is the one that will actually happen most.** `SourceChunk.assignmentMethod` can be
`'pending'`, and `assignmentConfirmed` can be false — material can be uploaded to a course and never
land on a topic. Telling that student "no source material" is wrong and unactionable; their material
exists and is one click from being usable.

## 3.2 State C is not an error — the rule that matters most

A topic with two slides of content yields a short guide. **That is the correct output.** It is what
`G-ECON-3` (do not inflate to appear comprehensive) and `SG-8` require, and the temptation to treat
it as failure is exactly the pressure that produces padded artifacts.

| id | Rule |
|---|---|
| `G-SUF-1` | Thin source produces a thin artifact. Never an error, never padding, never background substitution. |
| `G-SUF-2` | The artifact **discloses its own scope** — *"Built from 2 files · 6 sections of source material"* — so thinness reads as honest coverage rather than a broken feature. |
| `G-SUF-3` | Where the source is thin **because it is incomplete**, emit a `gap` block (`03` §5). Thin ≠ incomplete; only mark a gap when the source itself points at missing content. |
| `G-SUF-4` | Thin source **never** relaxes the high-yield defensibility test (§1.7). A four-concept topic with no emphasis signals has an empty high-yield section. |

**Mode interaction — worth noting because it self-corrects.** The background cap is 25% of *blocks*,
not an absolute count. A topic yielding 4 source blocks allows 1 background block. So under
`SOURCE_PLUS_BACKGROUND`, thin source automatically limits background rather than inviting the model
to fill the space. No extra rule needed.

## 3.3 Sufficiency floors (tunable)

**Judgment calls about pedagogy, not derived facts** — collected here so they can be retuned without
hunting through generators, following the `INTELLIGENCE_THRESHOLDS` pattern.

| Artifact | Floor | Comfortable | Rationale |
|---|---|---|---|
| `study-guide` | ≥ 3 chunks **or** ≥ 600 words | ≥ 8 chunks | Below 3 chunks there is no structure to reorganize, which is the artifact's entire purpose |
| `flashcards` | ≥ 1 chunk **or** ≥ 150 words | ≥ 4 chunks | One dense slide can legitimately yield several good cards |
| `gap-check` | ≥ 1 chunk | ≥ 3 chunks | Unchanged from today |

Below the floor → state A/B/D handling. Between floor and comfortable → state C.

## 3.4 Failures that remain errors

Distinct from insufficiency, and these **do** produce error messages, because they are conditions the
student cannot see in advance:

| Failure | Message must say |
|---|---|
| Pass 1 returns zero verified citations | Nothing was saved. Retry offered |
| Provider unavailable | Nothing was saved. Retry offered |
| Rate limit reached | **When it resets** (audit A4 — today it says "try again later" with no time) |
| Schema validation fails twice | Nothing was saved. This is a premedOS defect, not the student's |

Every one of these states plainly that **nothing was persisted**. A student who does not know whether
a failed generation left a half-artifact behind will go looking for it.

## 3.5 Where the check runs

Sufficiency is evaluated **client-side, from the local store, before the button renders** — the chunk
counts are already in `academics.classCenter.sourceChunks`. No model call, no network round trip, no
rate-limit consumption to discover you had nothing to generate from.

The server re-checks the floor as a guard (the client can be stale), but by then it is a defensive
assertion rather than the user-facing path.
