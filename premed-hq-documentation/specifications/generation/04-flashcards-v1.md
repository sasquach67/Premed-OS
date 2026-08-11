# 04 · Flashcard Generator — `flashcards-v1`

**Deliverable 5.** Layer 2 for the flashcard artifact.

**Authoring standard supplied by Andy, Aug 2026.** This document supersedes the first draft, which
was written from general retrieval-practice principles. Where the two disagreed, Andy's standard
wins — §2.4 and §5.2 record the two places the first draft was actually *wrong*, so they are not
re-introduced.

---

## 1. Objective

**Cards optimized for retrieval practice, not note compression.**

The bar, stated plainly:

> **A premedOS deck should read as though an experienced Anki user authored it carefully — not as
> though an AI converted notes into questions.**

premedOS takes inspiration from the learning-design principles associated with high-quality decks
(AnKing, MileDown, Pankow) while developing **an independent premedOS standard.** It does not imitate
any deck verbatim, and no generator prompt may name a deck as a style to copy.

**Card count is driven by learning value, not source length.** A 40-slide lecture may yield 15 good
cards. That is a correct outcome, not under-generation, and the UI must not present it as a shortfall.

---

## 2. Card writing philosophy

### 2.1 The retrieval objective (invariant)

**Before writing any card, six questions are answered. A card with no defensible answer to Q1 is not
written.**

1. What exact piece of knowledge should the student retrieve?
2. Why is that information worth remembering?
3. What is the minimum context required to make the retrieval unambiguous?
4. Is this best tested through cloze, Q&A, conceptual reasoning, comparison, process recall, or
   application?
5. Should supplemental information appear in the tested answer or in Extra?
6. Is another card already testing essentially the same knowledge?

**Do not create a card unless there is a meaningful retrieval target.** This is the rule that
prevents the deck from becoming a sentence-by-sentence transcription, and it is upstream of every
other rule here.

### 2.2 Concept map first (invariant) — *process change*

**The generator builds a concept map of the source material before writing any cards**, then decides
which concepts deserve retrieval practice.

```
source chunks → concept map → retrieval-worthiness decision → cards
```

Not:

```
source chunks → cards
```

Consequences:

- Important concepts may receive **several complementary cards**.
- Low-value details may receive **none**.
- `card_density` describes **learning coverage**, not cards per page (§6.1).
- Redundancy is detectable at the concept level rather than the string level (§5).

This makes concept-map construction part of Pass 1 (`01` §5.1) — the pass already reads all the
source, and the map is a natural intermediate artifact. It is not a separate model call.

### 2.3 Minimum information principle

**Prefer the smallest useful retrieval unit.**

```
✗  What are the structure, location, function, enzymes, and clinical
   significance of the lysosome?

✓  Lysosomes maintain an acidic lumen of approximately {{c1::pH 5}}.
✓  The acidic environment of lysosomes is maintained primarily by
   {{c1::V-type H+ ATPases}}.
✓  The primary function of lysosomes is {{c1::intracellular degradation
   and recycling}}.
```

**But do not apply atomicity mechanically.** Two pieces of information stay together when *the
relationship between them* is the thing to be learned. The discrimination card in §4.5 is the clearest
case: splitting "competitive inhibition raises Km but not Vmax" into two cards destroys the contrast
that is the entire point.

**The test:** would splitting this card separate two facts that are only useful together? If yes, it
is one card.

### 2.4 ⚠️ Correction to the first draft — multiple cloze indices

The first draft of this spec said *"one meaningful deletion per card"* and treated any second cloze
index as a defect. **That was wrong**, and Andy's standard corrects it:

> Use multiple cloze indices **deliberately** when concepts should be retrieved independently.

Multiple indices are a feature. `{{c1}}` and `{{c2}}` on **related targets the student should be able
to produce separately** generates two review events from one authored sentence, which is exactly
right. The defect is multiple deletions on **unrelated** targets in one sentence — the
mitochondria/powerhouse/cell case in §4.2.

The deterministic check in `08` §2.1 is corrected accordingly: it fires on *unrelated* multi-deletion,
not on multi-deletion as such.

---

## 3. Core rules

| id | Rule | Kind |
|---|---|---|
| `FC-1` | Prefer the smallest useful retrieval unit (§2.3) | invariant |
| `FC-2` | No cards combining several **unrelated** facts | invariant |
| `FC-3` | No questions answerable from superficial cues — length, grammar, phrasing | invariant |
| `FC-4` | No overly broad prompts | invariant |
| `FC-5` | Tested answers stay concise; elaboration goes in Extra | tunable |
| `FC-6` | Card must be unambiguous **reviewed alone, shuffled, months later** | invariant |
| `FC-7` | Prefer active recall over recognition | invariant |
| `FC-8` | Break complex processes into multiple cards where appropriate | tunable |
| `FC-9` | Remove `REDUNDANT` cards; permit `USEFUL_REINFORCEMENT` (§5) | invariant |
| `FC-10` | **Do not turn every sentence into a card** | invariant |
| `FC-11` | Preserve important qualifiers (`G-TERM-3`) | invariant |
| `FC-12` | Never remove context when removal changes meaning | invariant |
| `FC-13` | No cards testing trivial wording instead of concepts | invariant |
| `FC-14` | Prefer discriminative prompts for easily confused concepts | tunable |
| `FC-15` | Separate tested material (`back`) from optional explanation (`extra`) | invariant |
| `FC-16` | **Difficulty comes from the knowledge, never from the wording** (§7) | invariant |
| `FC-17` | **Natural language; no AI stock phrasing** (§8) | invariant |

---

## 4. Card types

### 4.1 `BASIC_QA`

**Prefer when:** a discrete fact, relationship, or value has one clear answer.

Prompts must be **specific**. The tested answer stays short; understanding goes in Extra.

```
✗  Q: What should you know about competitive inhibition?

✓  Q:     How does a competitive inhibitor affect the apparent Km of an enzyme?
   A:     Increases Km.
   Extra: Competitive inhibitors compete with substrate for the active site.
          Increasing substrate concentration can overcome inhibition, so Vmax
          remains unchanged.
```

Note the shape: **the answer is two words.** Everything that makes it make sense is in Extra, where
it is read *after* the retrieval attempt rather than graded as part of it.

### 4.2 `CLOZE`

**Prefer when:** the fact lives inside a sentence whose surrounding structure *is* the context, and
extracting it into Q&A would lose that structure.

```
✗  The {{c1::mitochondria}} produces ATP.
      too obvious; tests almost nothing

✓  Most ATP generated during aerobic respiration is produced through
   {{c1::oxidative phosphorylation}} at the {{c2::inner mitochondrial membrane}}.
      two related targets, independently retrievable — deliberate use of c1/c2
```

**Avoid:**

| Defect | Why |
|---|---|
| Deleting arbitrary vocabulary | Tests wording, not knowledge (`FC-13`) |
| Grammatical giveaways | "an ___" narrows the answer; deleting a stopword tests nothing |
| Enormous cloze regions | Becomes paragraph reconstruction, not retrieval |
| Excessive clozes in one sentence | Unrelated targets crammed together (§2.4) |
| Ambiguous clozes | Several equally valid answers fit the blank |
| Whole-paragraph reconstruction | All-or-nothing grading on a not-all-or-nothing skill |

**The triviality test — *added, from Andy's mitochondria example*:** if a student who has merely
*heard of* the topic could fill the blank from the surrounding sentence, the deletion target is
wrong. Delete the term that carries the *specific* knowledge, not the one that names the subject.

### 4.2b Enumerated list cards — *added Aug 2026, Andy*

The standard Anki list pattern: one sentence, sequential deletions, one generated card per item.

```
The four stages of cellular respiration are {{c1::glycolysis}},
{{c2::pyruvate oxidation}}, {{c3::the citric acid cycle}}, and
{{c4::oxidative phosphorylation}}.
```

**Why this is a distinct pattern, not just multi-deletion:** each generated card blanks one item
while **showing the others**. That is *scaffolded* retrieval — materially easier than recalling the
whole list cold, and appropriate when the items are hard to produce individually but the set is
worth knowing. It is a deliberate pedagogical choice, not a shortcut, and it is the correct
mechanism for the "individual steps" branch of `PROCESS` (§4.4).

**The unscaffolded alternative** is one card — *"Name the four stages of cellular respiration."* —
graded all-or-nothing. Both are legitimate; the generator must choose deliberately.

| Choose | When |
|---|---|
| Enumerated list card | Items are individually hard to retrieve; seeing peers is a fair cue; ≤ 6 items |
| Single "name all N" card | Items are individually easy; producing the complete set is the skill |
| Separate independent cards | Items are only related by belonging to the list, and each deserves its own context |

### Rules

| id | Rule | Kind |
|---|---|---|
| `FC-L1` | **Cap at 6 items.** Beyond that, split by category or restructure. A 10-deletion card generates 10 near-identical reviews and buries the deck | invariant |
| `FC-L2` | **The front states the cardinality** — "the four stages," "the three types." Without it the student cannot tell when they are done, and a missing item is invisible | invariant |
| `FC-L3` | **Ordered lists: indices follow the real order.** `c1` is genuinely first. Arbitrary numbering on a real sequence teaches a false order | invariant |
| `FC-L4` | **Unordered sets: say so on the card** — "in any order." Otherwise students memorise the position, which is not knowledge | invariant |
| `FC-L5` | **One list per card.** Never interleave two lists in one sentence | invariant |
| `FC-L6` | **Items must be peers** — same level of abstraction, same category. A list mixing an enzyme, a location, and a rate is not a list | invariant |
| `FC-L7` | Each item is a **complete retrieval unit**, not a fragment that only parses in place | invariant |

```
✗  The {{c1::four}} stages are {{c2::glycolysis}}, {{c3::pyruvate oxidation}}…
      c1 deletes the count — FC-L2 requires the count be GIVEN, not tested

✗  Glycolysis produces {{c1::2 ATP}}, {{c2::2 NADH}}, occurs in the
   {{c3::cytoplasm}}, and is catalyzed by {{c4::hexokinase}} first
      not a list — four unrelated facts wearing list syntax (FC-L6)

✓  Glycolysis nets {{c1::2 ATP}}, {{c2::2 NADH}}, and {{c3::2 pyruvate}}
   per glucose.
      three peers, one dimension (yield per glucose)
```

**Schema:** list cards carry `clozePattern: 'enumerated-list'` plus `listOrdered: boolean`
(`07` §4). This is what lets the deterministic checks apply list rules rather than the
unrelated-multi-deletion rule, and what lets an exporter reproduce the pattern correctly.

### 4.3 `CONCEPTUAL`

**Do not restrict flashcards to factual recall.** Where understanding matters, generate cards asking:

**Why? · How? · What happens if…? · What relationship exists between…? · How would changing X affect
Y? · What distinguishes A from B?**

```
✓  Q:     Why does increasing substrate concentration overcome competitive
          inhibition?
   A:     Because substrate and inhibitor compete for the same active site.
   Extra: At sufficiently high substrate concentrations, substrate increasingly
          outcompetes the inhibitor. Therefore Vmax can still be reached.
```

These are the cards that separate a premedOS deck from a term list. Presets favouring density must
not crowd them out — see the conceptual floor in §6.2.

### 4.4 `PROCESS`

**Prefer when:** the material is a sequence and order is load-bearing.

**The decision this type requires: whole-sequence retrieval, or individual steps?**

| Choose | When |
|---|---|
| Whole sequence | ≤ 5 steps, and the sequence itself is the thing tested |
| Individual steps | > 5 steps, or individual transitions carry testable mechanism |

**Never require an unnecessarily long sequence from one prompt.** A card asking for all ten steps of
glycolysis grades all-or-nothing on a skill that is not all-or-nothing; the student fails it
repeatedly and learns little.

Step cards anchor position on the front: *"In glycolysis, what immediately follows
fructose-1,6-bisphosphate?"*

### 4.5 `COMPARISON` / discrimination

**When students commonly confuse related concepts, test the distinguishing feature directly.**

**Prefer meaningful discrimination over two disconnected definition cards.**

```
✓  Competitive inhibition changes {{c1::Km}} but does not change {{c2::Vmax}}.
   Extra: Competitive inhibitors bind the active site and are outcompeted at
          high substrate concentration — so maximum velocity is preserved
          while the substrate concentration needed to reach half-maximal
          velocity rises.
```

**Note the cross-cutting shape:** this is a *discrimination* card implemented as a *cloze*. Card type
describes the retrieval objective, not the mechanism — a discrimination objective may be realised as
`CLOZE` or `BASIC_QA`, whichever tests the contrast more cleanly. **The schema records the objective
(`COMPARISON`); the presence of `clozeText` records the mechanism.**

### 4.6 `APPLICATION`

**Prefer when:** the concept is only demonstrably understood by using it.

- Requires a **small transfer** — one concept, one new situation.
- **Must not become a full exam question.** No answer choices, no multi-step vignettes, no compound
  reasoning chains, unless the student explicitly requests practice-exam generation, which is a
  different artifact.

**Boundary test:** *does this test one concept, or does it test test-taking?* Only the first is an
application card.

> ### Decision D-4 · Application cards in MCAT scope
>
> `generationPolicy.ts` restricts MCAT generation to `missed-to-mastery` and `flashcards`, and
> forbids generated `qbank-questions`. An application card is scenario-shaped, which is adjacent.
>
> **Specced as:** permitted in MCAT scope **only** with no answer choices, one concept, and
> ≤ 2 sentences of scenario. Anything larger is a qbank question wearing a flashcard's schema and is
> refused by the gate. The conservative alternative — no application cards in MCAT scope — is
> defensible. Your call.

---

## 5. Redundancy

### 5.1 Three-way classification (invariant)

**Before adding a card, compare its retrieval objective against every card already generated** and
classify the overlap:

| Class | Meaning | Action |
|---|---|---|
| `COMPLEMENTARY` | Different knowledge, related concept | **Keep** |
| `USEFUL_REINFORCEMENT` | Same concept, **meaningfully different direction** | **Keep** |
| `REDUNDANT` | Same retrieval target, no new direction | **Remove** |

`USEFUL_REINFORCEMENT` example — same concept, two directions, both worth having:

```
Q: How does a competitive inhibitor affect Km?          → Increases Km.
Q: Which inhibitor type raises Km without changing Vmax? → Competitive.
```

Recognition in one direction does not imply production in the other. That is the definition of a
meaningfully different direction, and it is the test.

### 5.2 ⚠️ Correction to the first draft — duplicate detection

The first draft treated duplicates as a **binary** deterministic check: *same `conceptId` + same
normalized tested target → blocking*. **That is too blunt** — it would delete legitimate
`USEFUL_REINFORCEMENT` pairs, which share both a concept and a target.

**Corrected:** the deterministic check detects **candidates** (same `conceptId`, high answer overlap)
and the classification is a **model judgment** in the quality pass. Only `REDUNDANT` is removed.
Near-identical strings — > 90% overlap on *both* front and back — remain deterministically blocking,
because that is a duplicate rather than a reinforcement.

---

## 6. Deck-level rules

### 6.1 Coverage

**Do not equate comprehensive coverage with maximum card count.**

`card_density` describes **learning coverage** — how finely the concept map is sampled — not cards
per page of source. `high-density` samples the map more finely; it does not lower the quality bar,
and if the material yields 20 good cards it produces 20, not 45 padded ones.

### 6.2 Mix

| Rule | Detail |
|---|---|
| **Concept breadth before depth** | Cover each retrieval-worthy concept once before a second card for any concept |
| **Type cap** | No single type > 60% of a deck, unless the preset lifts it (Concise Cloze) |
| **Conceptual floor** | ≥ 15% `CONCEPTUAL` or `APPLICATION` in every preset except Concise Cloze; 50% in Conceptual Q&A |
| **Ordering** | Emitted in concept-map order, not source order. Review shuffles anyway; concept order makes the deck editable |

---

## 7. Difficulty

**Difficulty must come from the knowledge being retrieved, never from poor wording.**

Artificial difficulty — all defects, all checkable:

- insufficient context
- enormous answer lists
- vague questions
- obscure wording
- multiple unrelated retrieval targets
- unnecessary precision

**A difficult concept should still produce a clear card.** `difficulty_estimate` describes the
knowledge, so a card scoring 5 because its prompt is confusing is mis-scored, not hard.

---

## 8. Card language (invariant)

**Natural, concise phrasing.** Prefer:

```
What causes X?          How does X affect Y?      Where does X occur?
Which enzyme catalyzes X?                          Why does X happen?
```

**Banned stock phrasings** when a shorter, more natural cue exists — these are the tell that a model
wrote the deck:

```
✗  "What is the primary function of…"
✗  "What is the significance of…"
✗  "Explain the role of…"
✗  "Describe the process by which…"
✗  "What are the key characteristics of…"
```

**Deterministically checkable** (`08` §2.1). The rule is not that these phrases are always wrong — it
is that they are almost always reachable by something shorter, and a deck full of them reads as
generated.

---

## 9. The Extra field

**Extra is a core component of the premedOS card system**, not an afterthought. The retrieval surface
stays clean; understanding lives here.

**Extra may contain:** concise explanation · mechanism · why the answer is correct · mnemonic ·
related concept · common confusion · equation · clinical connection · source excerpt or reference ·
diagram · image · table.

**Two rules on what does *not* belong there:**

| Rule | Detail |
|---|---|
| `FC-EX-1` | **Do not move information into Extra merely because it is difficult.** Difficulty is a reason to test something, not to hide it |
| `FC-EX-2` | **Extra must not contain another hidden card's worth of essential information.** If Extra holds a fact that should be independently retrievable, that fact is a missing card |

`FC-EX-2` is a model-judged quality check: *does Extra contain a retrieval target that is not tested
anywhere in this deck?* If yes, generate the card.

---

## 10. Visual flashcards

Cards support visual learning where a visual **materially improves retrieval**. Not decoration.

| Asset | v1 status |
|---|---|
| Equations / formula blocks | ✅ Available — text-encoded |
| Comparison tables | ✅ Available — reuses `comparison_table` (`07` §3) |
| Pathway diagrams | ✅ Available — reuses the structural diagram model (`07` §3), rendered natively |
| Labeled diagrams | ✅ Available — structural, schematic |
| **Source images / anatomical figures** | ❌ **Blocked** — ingestion is text-only (`00` §3) |
| **Image occlusion** | ❌ **Not generated in v1** — see below |

**`G-FID-3` still binds:** never reference a source figure the system cannot verify exists.

### 10.1 Image occlusion — decided (**D-9 resolved**)

**premedOS does not generate image-occlusion cards in v1.** It requires a source image to occlude,
and ingestion stores text only. Figure extraction stays in Phase 6.

**Andy's decision, Aug 2026:** he will author occlusion cards manually. **Other users must be told
this is a known limitation rather than left to discover it**, so the generator's absence of occlusion
cards is a *disclosed* gap, not a silent one.

#### Required disclosure

| id | Rule |
|---|---|
| `FC-IO-1` | Where a topic's material is visual enough that occlusion would be the right card type, the deck carries a **non-blocking notice**: *"Image occlusion cards aren't generated yet — support is planned. You can add them manually."* |
| `FC-IO-2` | The notice is **informational, never an error**, and never blocks or delays generation. |
| `FC-IO-3` | It appears **at most once per deck**, not per card. |
| `FC-IO-4` | It must not claim a delivery date. "Planned" / "coming soon" only — a dated promise in product copy is a commitment the roadmap has not made. |
| `FC-IO-5` | Students may add image-occlusion cards after export in Anki. Premed OS does not import, inspect, rewrite, or schedule them. |

`FC-IO-5` keeps the ownership boundary explicit: hand-made occlusion cards live in Anki, outside
Premed OS's one-way export pipeline.

#### When occlusion arrives

The addition is: figure extraction in ingestion → a `source_figure` asset id → an `IMAGE_OCCLUSION`
card type carrying that id plus occlusion regions. **Nothing in v1 needs redesign to accommodate
it**; the resulting card still leaves Premed OS through the one-way export boundary.

---

## 11. Card fields

```
card_type            BASIC_QA | CLOZE | CONCEPTUAL | PROCESS | COMPARISON | APPLICATION
                       ← the retrieval OBJECTIVE, not the mechanism (§4.5)
front                string        — the prompt (empty for CLOZE)
back                 string        — the tested answer (empty for CLOZE)
cloze_text           string?       — {{c1::…}} syntax; present for cloze-mechanism cards
extra                string?       — explanation; NEVER tested
tags                 string[]
concept_id           string        — stable, client-derived (07 §5)
difficulty_estimate  1–5           — of the KNOWLEDGE (§7)
source_reference     SourceRef     — required, always
  ├ source_document    ← resolved from fileId
  ├ page_or_slide      ← resolved from SourceChunk.sourcePosition
  └ source_span        ← character offsets, provider-attested
```

**The UI must let the student inspect where a card came from.** The data is present on every card;
`SourceRef.display` is resolved client-side so a slide number cannot be fabricated (`01` §4.1).

---

## 12. The quality gate

**Every card is evaluated on ten criteria before acceptance.** Cards that fail are **rejected or
rewritten**, never shipped with a warning.

| # | Criterion | Question | Checked by |
|---|---|---|---|
| 1 | **Retrieval value** | Is something meaningful being retrieved? | model |
| 2 | **Atomicity** | Is the retrieval target appropriately scoped? | model + deterministic |
| 3 | **Clarity** | Is there one defensible interpretation of the prompt? | model |
| 4 | **Context** | Would this make sense shuffled? | deterministic + model |
| 5 | **Answer length** | Is the tested answer reasonably concise? | deterministic |
| 6 | **Cueing** | Does the wording accidentally reveal the answer? | model |
| 7 | **Redundancy** | Is another card testing the same thing? (§5) | deterministic candidates + model class |
| 8 | **Source support** | Supported by the source, or by permitted external knowledge? | server-side, absolute |
| 9 | **Explanation** | Would an Extra field materially improve understanding? | model |
| 10 | **Visual value** | Would a diagram, equation, or table improve learning? | model |

Split rationale in `08` §2.3: machines check mechanics, models check meaning.

---

## 13. Relationship to topics — no in-app card scheduling

Generated cards retain the source course/topic metadata required for grounding, tagging, scoped
regeneration, and export. That relationship does **not** create review state.

**RULED by Andy, Aug 2026:** Premed OS never reviews or schedules cards. There is no card queue,
self-rating, or card-level FSRS. Topic FSRS continues to schedule Academics topic recall only and is
never changed by card generation or regeneration.

---

## 14. Anki export — ✅ **D-6 RESOLVED: `.apkg` is a target**

**Andy's call, Aug 2026: design the schema for one-way `.apkg` export now.** The card schema in
`07` §4 is therefore Anki-compatible by construction rather than retrofitted. Premed OS never
imports or reads an Anki deck back.

### 14.1 Note type mapping

| premedOS | Anki note type | Notes |
|---|---|---|
| `clozePattern` absent | **Basic (and reversed as needed)** | `front` → Front, `back` → Back |
| `clozePattern: 'single'` \| `'independent'` \| `'enumerated-list'` | **Cloze** | `clozeText` → Text. Anki's own `{{c1::}}` syntax, so all three patterns export losslessly |

**`cardType` is premedOS's retrieval objective and has no Anki equivalent** — it exports as a tag
(`premedos::type::CONCEPTUAL`) rather than forcing a note-type distinction Anki does not make.

### 14.2 The fields Anki has no home for

`concept_id` and `source_reference` are retained so the exported note remains inspectable in Anki.
Premed OS does not re-import the package, so neither field is a sync key.

**Resolution: a premedOS note type with reserved fields.**

```
premedOS Basic          premedOS Cloze
────────────────        ────────────────
Front                   Text
Back                    Extra
Extra                   premedos_concept_id     ← hidden on all card templates
premedos_concept_id     premedos_source
premedos_source         premedos_spec
premedos_spec
```

| Field | Contents | Why |
|---|---|---|
| `premedos_concept_id` | The stable `conceptId` | Preserves provenance in the exported package; it is not read back |
| `premedos_source` | `fileId:chunkId:start-end` plus the resolved human label | Source inspection survives the trip; the label is resolved at export, never model-authored |
| `premedos_spec` | `specId` + `specHash` | Tells you which generator version made a card you find months later |

All three are **hidden on the card templates** — they travel with the note, never appear during
review, and never pollute the retrieval surface (`FC-15`).

### 14.3 Rules

| id | Rule |
|---|---|
| `FC-EXP-1` | Export is **lossless for Premed OS-authored cards.** Every authored field is present in the `.apkg` |
| `FC-EXP-2` | Export is one-way. Premed OS never imports, syncs, or reads an Anki package back |
| `FC-EXP-3` | Export **never fabricates** a source label. `premedos_source` is resolved from `SourceChunk.sourcePosition` at export time (`01` §4.1) |
| `FC-EXP-4` | Cards authored later in Anki remain entirely Anki-owned and are outside Premed OS quality checks |
| `FC-EXP-5` | Deck structure mirrors the concept map — `Course::Topic` — so Anki's deck tree matches premedOS's |
| `FC-EXP-6` | **No scheduling state exists in Premed OS.** Anki creates and owns the only card-review schedule |

`FC-EXP-6` is worth being explicit about: the exported card is handed off to Anki. **Premed OS should
say at export that the handoff is one-way** rather than letting a student assume reviews sync or read
back.

### 14.4 Dependency to flag

`.apkg` is a zip containing a SQLite database. Writing one needs either a small hand-rolled writer or
a library. **`CLAUDE.md` requires flagging new dependencies before adding them** — so this is flagged
now, ahead of Phase 4, rather than discovered mid-build.

**Recommendation: hand-rolled writer.** The `.apkg` format is stable and the subset premedOS needs
(two note types, decks, tags, media for occlusion) is small. Pulling in an Anki library for that is a
large surface for a narrow need — and the audit's finding was that this codebase's strength is having
few dependencies it does not control.
