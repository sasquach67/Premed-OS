# 08 · Regeneration · Quality control

**Deliverables 10 and 11.**

---

# §1 · Regeneration

## 1.1 Supported operations

| Operation | Scope | Passes |
|---|---|---|
| `regenerate-artifact` | Whole guide or deck | Full pipeline |
| `regenerate-section` | One section | 1–2, section-scoped |
| `regenerate-block` | One block | 1–2, block-scoped |
| `regenerate-card` | One card | 1–2, card-scoped |
| `transform:shorter` | Artifact or section | Transform pass only |
| `transform:deeper` | Artifact or section | Transform pass |
| `transform:simplify` | Block or card | Transform pass |
| `transform:convert-card-type` | Card | Transform pass |
| `transform:density` | Deck | Full regeneration of the deck |

## 1.2 Transforms are not free-form

Each transform is a **named, versioned instruction** in the artifact spec — not a user-typed request
appended to the prompt. `transform:shorter` on a study guide means something specific:

> Reduce prose length. **Do not** drop concepts, gap markers, contradiction markers, or source
> references. **Do not** drop a required section. Prefer converting prose to a structural
> representation over deleting content.

This matters because "make it shorter" naively applied deletes the honest parts first — gap markers
and contradictions are the easiest things to cut and the most costly to lose.

**All transforms inherit every invariant.** `transform:simplify` may not simplify past `G-ECON-4`
(oversimplification losing nuance). `transform:density` may not breach `FC-10`.

## 1.3 Scoped regeneration needs scoped grounding

Regenerating one section still requires the **whole topic's** source context, or the regenerated
section will contradict its neighbours. The request carries:

- the full chunk set for the topic (as grounding)
- the **existing artifact** (as context, so the new section fits)
- the target `sectionId`
- **an explicit instruction that only that section may change**

Server-side, the response is validated to contain only the targeted section. Anything else is
discarded rather than merged.

## 1.4 Edit protection — **decision D-5**

**The rule: a block the student has edited is never silently overwritten.**

When the student edits generated content, the client sets `edited: true` and stores `editedAt`. The
original generated content is retained as `originalContent` so the edit is reversible and so a diff
can be shown.

**Specced behavior:**

| Situation | Behavior |
|---|---|
| Regenerating an artifact with **no** edited blocks | Proceeds. No prompt |
| Regenerating with edited blocks present | **Blocked pending a choice.** Dialog names how many blocks are affected |
| Choice A — *Keep my edits* | Edited blocks are **pinned**: passed to the model as fixed context, reproduced verbatim in the output, and re-verified verbatim on return |
| Choice B — *Replace everything* | Edits discarded. Requires explicit confirm; `originalContent` history retained so it is recoverable |
| Choice C — *Show me a diff* | Generates to a staging copy; student accepts per block |
| Regenerating a **single** block that is edited | Always warns, never proceeds silently |

**Default is A.** Silently destroying a student's own writing is the single worst outcome in this
feature, and it is the one users will not forgive — they will have spent real effort on those edits.

**Matching across regeneration** uses `conceptId` (`07` §5), not position. A concept that moves from
section 3 to section 5 keeps its edits. **A concept that disappears from the new generation keeps its
edited block, moved to an `orphaned` section** with an explanation — never deleted.

## 1.5 Flashcards keep their review history

An edited card retains its FSRS state (`04` §6). A **regenerated** card — same `conceptId`, new
content — also retains it, because the student's memory of the concept did not reset when the
wording changed. A card whose `conceptId` changes is a new card with fresh state.

---

# §2 · Quality control

## 2.1 Deterministic checks — no model call

**Roughly two-thirds of your quality list is computable.** These run in TypeScript, always, on every
artifact, at zero cost and zero latency. This is the addition flagged in the README.

### Study guides

| Check | Rule | Severity |
|---|---|---|
| Required sections present | Per `03` §2 | blocking |
| Empty sections | A rendered section with no blocks | blocking |
| Oversized section | > 8 blocks without subsections (`VIS-2`) | advisory |
| Prose run | > 2 consecutive prose blocks (`VIS-1`) | advisory |
| Prose block length | > ~120 words (`VIS-3`) | advisory |
| Bullet nesting | > 2 levels (`SG-6`) | blocking |
| Emphasis density | > 8% of body words (`G-EMPH-4`) | blocking |
| Callout density | > 3 per section, or adjacent same-type (`G-EMPH-5`) | advisory |
| Emphasis repetition | Same term emphasized twice in a section (`G-EMPH-6`) | advisory |
| High-yield budget | > 20% of concepts marked high-yield (`§1.7`) | blocking |
| High-yield basis | Any high-yield block missing `basis` | blocking |
| Background as high-yield | `provenance: background` + `highYield` | blocking |
| Source-mode compliance | Any block whose provenance the mode forbids (`02` §2.5) | blocking |
| Citation integrity | Any `sourceRef` not in the verified set | blocking |
| Citation required | Missing on a block type that requires one (`01` §4.2) | blocking |
| Diagram structure | Per `07` §3.1 | blocking |
| Representation variety | < 30% non-prose blocks (`06` §9.1) | advisory |
| Visual grammar consistency | Same `concept.kind` → different block types (`06` §8) | advisory |
| Recall answerability | A recall answer with no matching concept in the guide | advisory |
| Must-memorize surfacing | A `must_memorize` term never emphasized as `key_term` | advisory |

### Flashcards

| Check | Rule | Severity |
|---|---|---|
| Near-identical cards | > 90% overlap on **both** front and back (`04` §5.2) | blocking |
| Redundancy **candidate** | Same `conceptId` + high answer overlap — classification is model-judged (`04` §5) | → model pass |
| Oversized answer | `back` > ~40 words | advisory |
| Cloze — unrelated multi-deletion | `clozePattern: 'independent'` with no declared relationship (`04` §2.4) | blocking |
| **List — over cap** | `enumerated-list` with > 6 items (`FC-L1`) | blocking |
| **List — missing cardinality** | `enumerated-list` whose sentence does not state the count (`FC-L2`) | blocking |
| **List — non-contiguous indices** | Indices not `c1..cn` without gaps | blocking |
| **List — count deleted** | The cardinality itself is a deletion target (`FC-L2`) | blocking |
| **List — order undeclared** | `enumerated-list` with no `listOrdered` value (`FC-L3`/`L4`) | blocking |
| **List — non-peer items** | Deleted spans differ in category or abstraction level (`FC-L6`) — heuristic, escalate to model | advisory |
| Cloze grammatical giveaway | Deleted span preceded by `a`/`an` that disambiguates; deleted token is a stopword | blocking |
| Cloze region size | Deleted span > ~12 words — paragraph reconstruction, not retrieval | blocking |
| Cloze context | Remaining sentence < 6 words | advisory |
| **Banned stock phrasing** | Front matches `04` §8 list — *"What is the primary function of"*, *"What is the significance of"*, *"Explain the role of"*, *"Describe the process by which"*, *"What are the key characteristics of"* | advisory |
| **Extra longer than tested answer ×3** | Suggests a hidden card in Extra (`FC-EX-2`) — escalate to model | advisory |
| Vague prompt | Front matches known-vague patterns — *"What do you know about"*, *"Describe X"* with no axis, *"What is its…"*, bare *"Explain X"* | blocking |
| Missing context | Front contains an unbound pronoun or deictic — *it, its, this, these, next* — with no antecedent | blocking |
| Multi-fact card | `back` contains ≥ 2 independent clauses joined by `and`/`;` without a declared unit | advisory |
| Trivial card | `back` is a single stopword, a bare number with no unit, or restates ≥ 80% of `front` | advisory |
| Type mix | One type > 60% where the preset does not permit (`04` §5) | advisory |
| Conceptual floor | < 15% conceptual/application outside Concise Cloze | advisory |
| Field discipline | `CLOZE` with non-empty `front`/`back`, or non-cloze with `clozeText` | blocking |
| Source attribution | `sourceReference` missing or outside the verified set | blocking |

## 2.2 Model-judged checks — the pass 3 call

Only what genuinely requires reading comprehension:

| Check | Why a model is needed |
|---|---|
| **Missing major concepts** | Requires understanding what the source covers vs the artifact |
| **Hallucinated information** | Requires comparing claims against source meaning, not strings |
| **Contradiction with source** | Semantic, not lexical |
| **Unsupported high-yield claim** | Requires judging whether the stated basis is real |
| **Poor hierarchy** | Requires judging whether the organization aids understanding |
| **Unnecessary repetition** | Requires judging whether a restatement serves a distinct purpose |
| **Answerable from superficial cues** | Requires judging whether a prompt is guessable |
| **Poor cloze target choice** | Whether the *concept* was deleted, vs an adjacent word |
| **Cloze triviality** | Whether someone who merely *heard of* the topic could fill the blank from context (`04` §4.2) |
| **Redundancy classification** | `COMPLEMENTARY` / `USEFUL_REINFORCEMENT` / `REDUNDANT`. Only the third is removed (`04` §5) |
| **Hidden card in Extra** | Whether Extra holds a retrieval target tested nowhere in the deck (`FC-EX-2`) |
| **Retrieval value** | Whether anything meaningful is being retrieved at all (`04` §12.1) |
| **Prompt ambiguity** | Whether more than one defensible answer fits the prompt |
| **Visual value** | Whether a diagram, equation, or table would materially improve the card |
| **Representation mismatch** | Whether a process was rendered as bullets, etc. |

**Structure of the pass:** the checker is given the artifact and the source chunks and returns a
findings list — `{ checkId, severity, blockId?, cardId?, explanation }`. **It does not rewrite.**
Separating detection from repair keeps the repair path auditable and stops a "fix" from introducing
new unattested content.

## 2.3 Why the split matters

Asking a model to audit its own output for hallucination is the weakest check in the system —
it is the same model, with the same context, that produced the error. Asking it to count cloze
deletions wastes a call on something `String.prototype.match` does perfectly.

**So: machines check mechanics, models check meaning.** The deterministic set is also what makes
**decision D-2** viable — it catches most defects for free, so the model pass can be conditional.

## 2.4 What happens on a finding

| Severity | Behavior |
|---|---|
| `blocking` | **Artifact is not persisted.** One scoped regeneration of the offending section/card; if it fails again, surface the error. Never ship a blocking-failed artifact |
| `advisory` | Artifact persists. Findings attached and shown as a dismissible quality note |

**Cards with `owner: 'user'` are exempt from every check in §2.1 and §2.2** (`04` §10.1, `FC-IO-5`).
Andy's hand-authored image-occlusion cards will sit inside generated decks, and a card with no
`front`, no `back`, and no `cloze_text` is malformed *for a generator* and perfectly valid *for a
person*. Running generator checks over user-authored cards would flag the student's own work as
defective — the same class of mistake as regeneration overwriting their edits.

**Advisory findings are shown to the student, not hidden.** *"This guide is heavier on prose than
usual — regenerate the Mechanisms section?"* is more useful than silence, and it teaches the student
what a good artifact looks like.

## 2.5 The escalation rule (**decision D-2**)

Recommended trigger for the pass-3 model call:

```
run pass 3 IF
     any advisory finding fired in the deterministic pass
  OR artifact block/card count > 25
  OR sourceMode == SOURCE_PLUS_BACKGROUND     ← highest hallucination surface
  OR the user explicitly requested a quality check
```

Typical clean artifacts cost 2 calls; risky ones cost 3. Combined with a **weighted rate limit** —
`claim_ai_request` taking a cost so one artifact debits one unit regardless of passes — the student
sees a limit expressed in artifacts, which is the unit they actually think in.
