# 04 · Flashcard Generator — `flashcards-v1`

**Deliverable 5.** Layer 2 for the flashcard artifact.

**Authoring standard supplied by Andy, Aug 2026.** This document supersedes the first draft, which
was written from general retrieval-practice principles. Where the two disagreed, Andy's standard
wins — §2.4 and §5.2 record the two places the first draft was actually *wrong*, so they are not
re-introduced.

**Second revision, Andy, Aug 2026 — the thematic ruling.** A deck generated under the first revision
passed every rule in this document and was still a bad deck: it was a well-formed pile of facts. The
failure was not rule-breaking, it was that the rules never said *which knowledge is worth a card*
beyond "is something being retrieved." §2.5–§2.7, §4.2c, §4.7, §4.8, `FC-18`–`FC-24` and gate
criterion 11 are the correction. **They are the highest-priority section of this document** — where a
card satisfies §2.3 but fails §2.5, §2.5 wins.

---

## 1. Objective

**Cards optimized for retrieval practice, not note compression.**

The bar, stated plainly:

> **A premedOS deck should read as though an experienced Anki user authored it carefully — not as
> though an AI converted notes into questions.**

premedOS takes inspiration from the learning-design principles associated with high-quality decks
(AnKing, MileDown, Pankow) while developing **an independent premedOS standard.** It does not imitate
any deck verbatim, and no generator prompt may name a deck as a style to copy. Premed OS never ships,
bundles, or imports a pre-authored deck; every generated card begins with material the student supplied.

### 1.1 What the reference decks actually do — *added Aug 2026, third revision*

**The paragraph above named three decks and then forbade consulting them, so the reference did no
work.** A generator reading this spec learned that AnKing, MileDown and Pankow exist and nothing about
why. This section records the principles, so the name-drop is backed by something an author can apply.

**Sourcing note, and its limits.** What follows is drawn from public descriptions and reviews of these
decks, not from the decks themselves. Premed OS does not import, inspect, or reproduce their card
content, and nothing here is a card, a phrasing, or a template lifted from them — these are design
principles observable from the outside. Where a claim below could not be corroborated it is marked.

| Deck | Documented design property | What premedOS takes from it |
|---|---|---|
| **Pankow** (Psych/Soc, ~2,250 cards, organized by the Khan Academy P/S blocks) | Reviewers consistently single out that cards carry **real examples rather than definitions alone**, and that the deck teaches applied context rather than definition-only quizzing | **`FC-20` and the `EXEMPLAR` type (§4.7).** This is the single most-cited property of the deck most recommended for exactly the subject matter this lecture covers, and it is the principle the first revision of this spec was missing |
| **AnKing** | Cloze-dominant; heavy hierarchical tagging by resource, topic and section; an explanation/resource layer that travels with the note but is separate from the tested surface | **`FC-15` (tested vs. Extra separation)**, the `premedos::` tag scheme (§14.1), and the Extra field as a first-class component (§9) rather than an afterthought |
| **MileDown** | Cloze-only, an image on every card, a linked video on every card, hierarchical sub-decks | Confirms that a **consistent card grammar** across a deck is worth more than per-card cleverness (`06` §8) |

### 1.2 The two documented failure modes — *added Aug 2026, third revision*

**More useful than what these decks do well is what reviewers say goes wrong**, because both failures
are reachable from rules already in this document.

| Failure | Where it is observed | The rule that prevents it |
|---|---|---|
| **Stem bloat → pattern recognition.** Reviewers criticise MileDown for putting "far too much information in the question stem," which lets cards "devolve into pattern recognition without truly promoting comprehension" — the student recognises the *card*, not the *knowledge* | Cloze cards whose surrounding sentence is doing the retrieval work | `FC-3`, and the §4.2 triviality test. **`FC-25` below makes it explicit** |
| **Back bloat → passive reading.** Reviewers criticise JackSparrow2048 for pairing short prompts with "paragraphs of information" on the back, so students end up "simply reading the answers, rather than pursuing a true active learning style" | Any card whose back is long enough to read instead of recall | `FC-5` (tested answers stay concise) and `FC-15`. **`FC-26` below makes it checkable** |

**The second failure is the one premedOS is most exposed to**, because this spec deliberately
encourages a rich Extra field (§9) and a multi-item `FREE_RECALL` back (§4.8). The distinction that
keeps those from becoming the JackSparrow failure is **when the text is read**: Extra is read *after*
a retrieval attempt has already been graded, and a blurt checklist is *graded item by item against
what the student produced first*. Long prose that is read *instead of* recalling is the defect. Long
text that is read *against* something the student already produced is the mechanism working.

| id | Rule | Kind |
|---|---|---|
| `FC-25` | **The stem may not carry the retrieval.** If deleting the surrounding context would make the answer unguessable, the context was doing the work — cut it or move it to Extra | invariant |
| `FC-26` | **A tested answer longer than ~40 words must be structured for item-by-item self-grading** — a checklist, a list, or a `FREE_RECALL` card — never a paragraph. Prose backs above that length are read, not recalled | invariant |

**Source boundary (ruled by Andy, Aug 2026):** the tested target on every card must be supported by
the student's own slides, notes, course material, or their own missed question. In
`SOURCE_PLUS_BACKGROUND`, clearly marked background may appear only as subordinate explanation in
`extra`; it may not create a concept, lead the card, or become the tested answer (`02` §2.6).

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

*Amended Aug 2026 (second revision).* The map now carries two more things, both produced in Pass 1:

```
source chunks → concept map
                  ├─ salience grade per concept        (§2.5 — load-bearing / attaching / incidental)
                  └─ axis of contrast per sibling set  (§2.6 — the dimension they vary on)
              → retrieval-worthiness decision → cards
```

**Neither is optional.** A map without salience grades produces a deck that treats a school's central
claim and the year its founder was born as equally card-worthy — which is the failure §2.5 exists to
prevent. A map without axes produces a deck of disconnected definitions.

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

### 2.5 Themes over facts (invariant) — *added Aug 2026, second revision*

**The retrieval objective in §2.1 asks whether something is being retrieved. It does not ask whether
that something is worth a place in the student's memory for the next thirty years. This section
asks that.**

Every source contains three grades of material, and only the first two earn cards:

| Grade | Definition | Treatment |
|---|---|---|
| **Load-bearing** | The idea the topic exists to teach — a school's central claim, a mechanism, a distinction the rest of the material rests on | Cards, several if warranted |
| **Attaching** | Detail that makes a load-bearing idea concrete, attributable, or usable — the figure who holds a position, the method that implements it, the example that demonstrates it | Cards, usually one |
| **Incidental** | True, in the source, and load-bearing for nothing — ordinal firsts, institution names, founding years, journal titles, honorifics | **Extra, or cut** |

> **The trivia test.** Ask: *if the student recalls this fact perfectly and nothing else about the
> concept, have they learned anything?* If no, it is incidental. A student who knows Mary Whiton
> Calkins was the first woman APA president, and cannot say what the paired-associate technique is,
> has learned nothing about psychology. Reverse it and they have learned something real.

**Incidental material is not deleted from the deck — it is demoted.** It rides in `extra` on the card
that carries the load-bearing idea, where the student meets it after the retrieval attempt. This is
the one place where `FC-EX-2` does not apply: an incidental fact in Extra is *deliberately* untested,
and its presence there is not evidence of a missing card.

**Instructor emphasis outranks this rule in one direction only.** Where the source shows an emphasis
signal (`02` §1.7) on material this section would call incidental, it is promoted to attaching and
gets a card. Emphasis can rescue a fact; it cannot rescue a fact the instructor explicitly excluded.

### 2.6 Concepts are taught against each other (invariant) — *added Aug 2026, second revision*

**A concept card in isolation teaches a definition. A concept card that places the concept against
its neighbour teaches the concept.** `G-STRUCT-1` already requires this of study guides; it was never
carried into flashcards, and the omission produced decks where every school of thought was learned
as an unconnected paragraph.

| id | Rule |
|---|---|
| `FC-19a` | **Every school, framework, theory, or named position in the source gets at least one card placing it against a neighbour** — its predecessor, its rival, or the position it was a reaction to. |
| `FC-19b` | **Where the source presents a set of positions, the generator identifies the axis they vary on and builds cards on that axis**, not only cards on each position. |
| `FC-19c` | A comparison card names **the dimension of contrast**, not merely the two items. "Structuralism vs functionalism" is a topic; "what consciousness is *made of* vs what it is *for*" is a card. |

**Finding the axis is a Pass 1 concept-map task, not a card-writing task.** When the map contains
three or more sibling concepts, the generator states the dimension they differ on before writing any
of their cards. In a schools-of-thought topic that axis is usually *what is the proper subject matter
of this field, and how much of it is the person aware of.* In a mechanism topic it is usually *what
changes and what stays the same.* If no axis can be stated, the concepts are not siblings and the map
is wrong.

### 2.7 Context self-sufficiency — `FC-6` with teeth (invariant) — *added Aug 2026, second revision*

`FC-6` says a card must be unambiguous reviewed alone, shuffled, months later. It had no test, so
prompts that were perfectly clear *to someone who had just watched the lecture* passed.

**The test: strip the source. Does the prompt still name its own answer space?**

```
✗  How has the nature–nurture question changed?
      "changed" from what? The card assumes the student remembers the lecture's
      before-state. Reviewed in November this prompt has no answer space at all.

✓  Psychologists once argued over whether heredity or environment mattered MORE
   for behavior. What question replaced that one?
      the before-state is on the card; the answer space is bounded
```

**Four prompt patterns that fail this test**, all deterministically detectable:

| Pattern | Example | Fix |
|---|---|---|
| **Unanchored change** | "How has X changed?", "What replaced X?", "What is the modern view of X?" | State the prior view on the front |
| **Unanchored comparison** | "How does X differ?", "What makes X different?" | Name both terms of the comparison |
| **Orphan definite article** | "What was *the* debate / *the* takeaway / *the* example?" | Name it, or cut the card |
| **Lecture deixis** | "What did she say about X?", "What was her point?", "According to this course…" as the sole anchor | Ask about the content, not the telling |

**Where a topic is genuinely too broad to anchor in one prompt, the answer is a `FREE_RECALL` card
(§4.8), not a vague `BASIC_QA`.** That is the whole reason that type exists.

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

**Added Aug 2026, second revision.** These outrank the rules above where they conflict.

| id | Rule | Kind |
|---|---|---|
| `FC-18` | **Load-bearing and attaching material earns cards; incidental material is demoted to Extra** (§2.5) | invariant |
| `FC-19` | **Every school, framework, or named position carries at least one card placing it against a neighbour, on a named axis of contrast** (§2.6) | invariant |
| `FC-20` | **Abstractions are taught through their examples.** Where the source supplies a concrete instance of an abstract concept, generate an `EXEMPLAR` card — and generate it in **both** directions (§4.7) | invariant |
| `FC-21` | **Cloze the definition, not the term** (§4.2c). Term-deletion cloze is permitted only where the term itself is the hard-won knowledge | invariant |
| `FC-22` | **A prompt must name its own answer space with the source stripped away** (§2.7) | invariant |
| `FC-23` | **A topic too broad for one prompt gets a `FREE_RECALL` card, never a vague `BASIC_QA`** (§4.8) | invariant |
| `FC-24` | **Full names on the tested answer** — *Mary Whiton Calkins*, not *Calkins*. Surnames alone are permitted only inside Extra, and only after the full name has appeared | tunable |

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

### 4.2c Definition cloze — the default cloze direction — *added Aug 2026, second revision*

**The first revision produced term-deletion clozes by default, and that is backwards.**

```
✗  {{c1::Introspection}} is the careful, systematic self-observation of one's own
   conscious experience.
      The definition is on screen. The student reads it, recognises which term it
      belongs to, and produces a word they were already most of the way to.
      This is recognition wearing cloze syntax — FC-7.

✓  Introspection is {{c1::the careful, systematic self-observation of one's own
   conscious experience}}.
      The term is the cue. The student must produce the content cold.
```

`clozePattern: 'definition'` — **the term stays visible in the stem and the definition is deleted.**
This is the direction that matches how the knowledge is actually used: you meet the term on an exam
and must supply the meaning, not the reverse.

| id | Rule |
|---|---|
| `FC-D1` | **The deletion cap rises to ~25 words for `definition` clozes.** The §4.2 twelve-word cap exists to prevent paragraph reconstruction; a definition is a single retrieval unit, not a paragraph, and truncating it to fit a cap teaches a truncated definition |
| `FC-D2` | **Exactly one deletion.** A definition split across `c1`/`c2` is being graded in halves, which a definition does not have |
| `FC-D3` | **The stem must state the term and nothing else load-bearing.** Everything after "X is" is deletion; qualifying clauses the student should also produce go inside the deletion, not outside it |
| `FC-D4` | **Term-deletion cloze requires a justification**, recorded on the card: the term is itself the hard-won knowledge (a coined term, a name-to-concept attachment, a confusable pair). Absent that, `FC-21` makes it a defect |

**Deck-level:** among cloze-mechanism cards, `definition` should be the plurality. A deck whose clozes
are mostly term-deletions has inverted `FC-7` at scale.

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

### 4.7 `EXEMPLAR` — *added Aug 2026, second revision*

**Prefer when:** the source contains an abstract concept *and* a concrete instance of it.

An exemplar card tests the **membership relation** — that this instance belongs to that concept, and
what about the instance makes it an instance. It is not an application card: application asks the
student to transfer a concept to a *new* situation, exemplar asks them to hold the concept and its
canonical instance together.

```
✓  Q:     A patient means to say "I love my mother" and says "I hate my mother."
          What is this called, and what did Freud take it as evidence of?
   A:     A Freudian slip — evidence that the unconscious influences behaviour
          from below the level of awareness.
   Extra: Dreams were his other observational route to the same conclusion.

✓  Q:     Freud argued the unconscious shapes behaviour without the person
          knowing it. What two everyday phenomena did he offer as evidence?
   A:     Freudian slips and dreams.
```

**`FC-20` requires both directions**, and the pair above is what "both directions" means:
*instance → concept* and *concept → instance*. They are `USEFUL_REINFORCEMENT` under §5.1, not
redundant — producing an example from a concept and classifying an example under a concept are
different skills, and students routinely have one without the other.

| id | Rule |
|---|---|
| `FC-EX-A` | The example must come from the source. A generated example is `provenance: 'background'` and is subject to `02` §2.6 — it may sit in Extra, never in the tested answer |
| `FC-EX-B` | The *instance → concept* direction asks **what it is an example of**, not merely what it is called. Naming without classifying is a vocabulary card |
| `FC-EX-C` | Where the source gives an instructor's own example, prefer it over any other. It is the version most likely to reappear on the assessment, and it carries `instructor-emphasis` |
| `FC-EX-D` | One exemplar pair per concept unless the source supplies genuinely different *kinds* of instance |

**Deck-level: `EXEMPLAR` ≥ 15% of any deck whose source contains worked examples.** This is a floor
in the same sense as the conceptual floor (§6.2), and for the same reason — it is the card type that
density presets crowd out first.

### 4.8 `FREE_RECALL` — the blurt card — *added Aug 2026, second revision*

**Prefer when:** a concept is genuinely too large for one retrieval target, and splitting it into
atoms would lose the fact that the atoms belong together.

This is the type that resolves the standing tension between `FC-4` (no overly broad prompts) and
`G-STRUCT-1` (teach relationships). A broad `BASIC_QA` prompt is a defect. A broad prompt that
**declares its own scope and supplies its own grading key** is a different instrument.

```
✓  Front: BLURT — Behaviorism. 5 things to hit.

   Back:  1. Core claim — psychology should abandon consciousness and study only
             observable behaviour
          2. Why — the scientific method rests on verifiability; you cannot see
             or touch a thought
          3. John B. Watson — father of behaviorism; hard nurture, behaviour is
             fully governed by the environment
          4. B.F. Skinner — mental states exist but cannot be studied
             scientifically
          5. Skinner's principle — organisms repeat responses with positive
             outcomes, drop those with negative outcomes → reinforcement and
             punishment; free will is an illusion
```

| id | Rule |
|---|---|
| `FC-FR-1` | **The front states the hit-count.** Without it the student cannot tell when they are done and a missed item is invisible — the same reasoning as `FC-L2` |
| `FC-FR-2` | **3–7 items.** Below 3 it is a `BASIC_QA` in disguise; above 7 the concept needs splitting into two blurt cards |
| `FC-FR-3` | **Every item is independently gradeable** — a self-contained claim the student can mark hit or missed, not a fragment of prose |
| `FC-FR-4` | **Items are ordered by the concept's own logic** — claim before evidence, figure before position — so the checklist doubles as the structure of the idea |
| `FC-FR-5` | **The blurt spine:** every school, framework, or major named position in the source carries **exactly one** `FREE_RECALL` card. Not two, and not zero |
| `FC-FR-6` | **A blurt card never replaces the atomic cards for its own content.** It sits on top of them. The atoms build the knowledge; the blurt card assembles it |
| `FC-FR-7` | **No hit-count inflation.** Padding a checklist to reach 5 items produces a card the student fails on trivia. If the concept has 3 real items, the front says 3 |

**`FC-FR-6` is the one most likely to be misread as licence to cut cards.** A blurt card is scaffolding
over existing knowledge, not a compression of it — a student who has only the blurt card has a list
they can recite and cannot use.

**Export:** `FREE_RECALL` is a Basic note whose Back is an ordered list. It carries the tag
`premedos::type::FREE_RECALL` like any other objective (§14.1).

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

**Added Aug 2026, second revision.**

| Rule | Detail |
|---|---|
| **Blurt spine** | Every school, framework, or major named position in the source carries exactly one `FREE_RECALL` card (`FC-FR-5`) |
| **Exemplar floor** | ≥ 15% `EXEMPLAR` where the source contains worked examples (`FC-20`) |
| **Relational floor** | ≥ 25% of cards are *relational* — `COMPARISON`, `EXEMPLAR`, or a `CONCEPTUAL` card whose prompt names two concepts. A deck below this is a glossary |
| **Definition-cloze plurality** | Among cloze-mechanism cards, `definition` is the largest group (`FC-21`, §4.2c) |
| **Trivia ceiling** | ≤ 10% of cards may test attaching detail whose tested answer is a proper noun, year, or institution. Over ceiling, demote to Extra by §2.5 |

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

### 8.1 Memory-first wording — added Aug 2026

**Write the answer a student should be able to say from memory, not a polished
textbook paraphrase.** Lead with the core claim in plain language. Preserve a
technical term only when the course needs that exact term; put mechanisms,
qualifiers, examples, and historical context in `Extra` unless they are the
thing being tested.

For an ordinary definition or fact, aim for **3–15 words**. Use a full sentence
only when the relationship itself would be lost by shortening it. A short
answer is not a fragment by default: it should still sound natural when said
aloud.

```
✗ Humanism emphasizes humans' conscious agency and free will, arguing that
  people are capable of shaping who they are and pursuing personal growth
  rather than being controlled solely by environmental or unconscious forces.

✓ Humanism: people have free will and can grow.
  Extra: It emphasizes conscious choice over purely environmental or
  unconscious control.

✗ Freud was controversial because he argued that unconscious sexual drives,
  beginning in childhood and sometimes involving family relationships, could
  contribute to psychological conflict and later behavior.

✓ Why controversial: he linked disturbance to sexual urges, including toward
  family members, when this was not discussed publicly.
```

**The test:** could the student use the answer as a quick cue during a blurt?
If it feels like something to reread, it belongs in `Extra`.

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

### 8.1 Register and punctuation — *added Aug 2026, Andy's ruling*

Card prose keeps a scholarly register: precise terms, full sentences on the back, the instructor's
vocabulary preserved under `G-TERM-1`. Academic does not mean ornate. The banned list above still
applies, and two further rules join it.

| id | Rule | Kind |
|---|---|---|
| `FC-27` | **Em and en dashes are avoided in card prose.** A label-to-description pair takes a colon ("Core claim: ..."); an aside takes commas or parentheses; anything longer becomes its own sentence. Numeric ranges in source references are exempt | invariant |
| `FC-28` | **No model-register filler.** Beyond the §8 stock phrasings, card prose avoids the vocabulary and constructions that mark generated text: significance inflation, "-ing" trailers that fake depth, negative parallelisms, rule-of-three padding, and the overused word set (delve, pivotal, crucial, showcase, tapestry, testament, landscape, and their kin). The full catalogue lives in the humanizer reference; the deterministic check covers the word set and the parallelism patterns | invariant |

The test for both: read the card aloud. It should sound like a careful scholar wrote it by hand, not
like a model padded it out.

---

## 9. The Extra field

**Extra is a core component of the premedOS card system**, not an afterthought. The retrieval surface
stays clean; understanding lives here.

**Extra may contain:** concise explanation · mechanism · why the answer is correct · mnemonic ·
related concept · common confusion · equation · clinical connection · source excerpt or reference ·
diagram · image · table.

### 9.1 Relate; do not re-explain — *added Aug 2026, Andy*

**A lecture term is usually familiar by the time it becomes a card. What is missing is not more
vocabulary; it is a bridge from the term to something the student can picture or recognise.** When a
tested answer names an abstraction, metaphor, framework, or contrast that a student could recite
without being able to *relate* to, Extra must add one compact concrete bridge rather than a longer
definition. Format it exactly as `Ex: …` on its own line.

**This is additive, never a simplification mandate.** Keep the card's academic precision, depth, and
exam-relevant distinctions intact. The `Ex:` line does not make the language chatty, colloquial, or
less exact; it gives the already-established concept one disciplined point of contact with familiar
experience. A good bridge is concise and specific enough to be useful, while the tested answer still
carries the formal claim.

The question is not “how can I explain structuralism in more words?” It is “what ordinary experience
makes structuralism feel obvious?” A human tutor reaches for the coffee in front of them; a model
repeats the definition with fancier synonyms. The card must do the former.

```
Extra: James thought consciousness is continuous, not a set of static pieces.
Ex: Biology homework → tomorrow → hungry → dinner — each thought runs into the next.

Extra: Structuralists broke experience into basic mental elements.
Ex: Drinking coffee = warmth + bitterness + smell + cup pressure.
```

The example is a relation, not a second lecture and not a watered-down rewrite of the answer:

| id | Rule |
|---|---|
| `FC-EX-3` | **Bridge term → lived picture.** Use one familiar, concrete instance, compact chain, comparison, or miniature moment that lets the learner recognise what the term is like. Prefer an instructor or student-supplied example. |
| `FC-EX-3a` | **Relation over paraphrase.** The `Ex:` line must add a different kind of understanding from the answer. It may not merely restate the definition in simpler synonyms or add more abstract prose. |
| `FC-EX-3b` | **Human test.** Could a careful student say this naturally to a classmate, point to it in ordinary life, or picture it immediately? If it reads like a glossary, textbook aside, or model-generated mini-lecture, rewrite it. |
| `FC-EX-3c` | **Academic register.** "Human" does not mean slangy or casual. Keep the same precise, course-appropriate register as the answer; an example clarifies a relationship without lowering the level of thought. |
| `FC-EX-4` | **`Ex:` is subordinate Extra, never a hidden second tested target.** If the example itself needs independent retrieval, make the paired `EXEMPLAR` card required by `FC-20` instead. |
| `FC-EX-5` | **Do not invent an unmarked source example.** In `SOURCE_ONLY`, omit the line when the supplied material has no appropriate example. In `SOURCE_PLUS_BACKGROUND`, a generated illustration is allowed only when labelled `Ex (background): …`; it remains subordinate and never becomes the tested answer. |
| `FC-EX-6` | **Do not add `Ex:` mechanically to factual cards.** It is required when the compact answer would otherwise leave the concept unpictured or unrelated, not when a direct fact is already clear. |

This is distinct from an `EXEMPLAR` card. `EXEMPLAR` makes the example itself a deliberate,
source-supported retrieval relationship in both directions. `Ex:` helps a learner understand the
answer they have just retrieved without turning the back into a paragraph.

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
                     | EXEMPLAR | FREE_RECALL            ← added Aug 2026 (§4.7, §4.8)
                       ← the retrieval OBJECTIVE, not the mechanism (§4.5)
front                string        — the prompt (empty for CLOZE)
back                 string        — the tested answer (empty for CLOZE)
cloze_text           string?       — {{c1::…}} syntax; present for cloze-mechanism cards
cloze_pattern        'single' | 'independent' | 'enumerated-list' | 'definition'
                       ← 'definition' added Aug 2026 (§4.2c); the DEFAULT cloze direction
term_justification   string?       — required when a term-deletion cloze is used (FC-D4)
exemplar_direction   'instance-to-concept' | 'concept-to-instance'   — EXEMPLAR only (FC-20)
recall_items         string[]?     — FREE_RECALL only; length must equal the stated hit-count
axis                 string?       — COMPARISON only; the named dimension of contrast (FC-19c)
salience             'load-bearing' | 'attaching' | 'incidental'      ← §2.5
                       'incidental' is INVALID on a card; it is an Extra-only grade, and a
                       card carrying it is rejected rather than downgraded
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
| 8 | **Source support** | Is the tested target supported by student-supplied material, with any permitted background marked and confined to subordinate Extra copy? | server-side, absolute |
| 9 | **Explanation** | Would an Extra field materially improve understanding? | model |
| 10 | **Visual value** | Would a diagram, equation, or table improve learning? | model |
| 11 | **Thematic value** *(added Aug 2026)* | Is the tested target load-bearing or attaching — or is it incidental detail that should be demoted to Extra? (§2.5) | model |
| 12 | **Relational placement** *(added Aug 2026)* | For a school, framework, or named position: is it placed against a neighbour anywhere in this deck? (§2.6) | model + deterministic |
| 13 | **Self-sufficiency** *(added Aug 2026)* | With the source stripped away, does the prompt still name its own answer space? (§2.7) | deterministic + model |
| 14 | **Concrete relation** *(added Aug 2026)* | When the answer is abstract, would one compact `Ex:` make it pictured and relatable rather than merely recited? If yes, is a source-grounded example present in Extra? (§9.1) | model |

Split rationale in `08` §2.3: machines check mechanics, models check meaning.

### 12.1 Deterministic checks this revision adds to `08` §2.1

Recorded here so the `08` table can be updated in the same pass rather than drifting.

| Check | Rule | Severity |
|---|---|---|
| Unanchored change prompt | Front matches *"how has … changed"*, *"what replaced"*, *"what is the modern view"* with no prior state stated | blocking |
| Unanchored comparison | Front asks how something differs without naming both terms | blocking |
| Orphan definite article | Front contains *the debate / the takeaway / the example / the point* with no antecedent | blocking |
| Lecture deixis | Front's only anchor is *she said*, *her point*, *this lecture*, *in class* | blocking |
| Term-deletion cloze without justification | `clozePattern` not `definition`, single deletion is a bare noun phrase naming the sentence's subject, no `termJustification` recorded (`FC-D4`) | advisory → model |
| Definition cloze over-length | `definition` deletion > ~25 words (`FC-D1`) | advisory |
| Definition cloze split | `definition` with more than one index (`FC-D2`) | blocking |
| Blurt missing hit-count | `FREE_RECALL` front does not state a count (`FC-FR-1`) | blocking |
| Blurt count mismatch | Stated count ≠ number of items on the back (`FC-FR-7`) | blocking |
| Blurt size | `FREE_RECALL` outside 3–7 items (`FC-FR-2`) | blocking |
| Blurt spine gap | A concept tagged as a school/framework with no `FREE_RECALL` card (`FC-FR-5`) | blocking |
| Blurt spine duplication | More than one `FREE_RECALL` card for one concept (`FC-FR-5`) | blocking |
| Exemplar floor | `EXEMPLAR` < 15% where the source contains examples | advisory |
| Exemplar direction gap | A concept with an *instance → concept* card and no *concept → instance* card, or vice versa (`FC-20`) | advisory |
| Relational floor | Relational cards < 25% of deck | advisory |
| Trivia ceiling | > 10% of tested answers are a bare proper noun, year, or institution (§2.5) | advisory → model |
| Surname-only answer | Tested answer is a surname with no given name (`FC-24`) | advisory |

---

## 13. Relationship to topics — no in-app card scheduling

Generated cards retain the source course/topic metadata required for grounding, tagging, scoped
regeneration, and export. That relationship does **not** create review state.

**RULED by Andy, Aug 2026:** Premed OS never reviews or schedules cards. There is no card queue,
self-rating, or card-level FSRS. Topic FSRS continues to schedule Academics topic recall only and is
never changed by card generation or regeneration. **Review and scheduling stay in Anki.**

---

## 14. Anki export — ✅ **D-6 RESOLVED: `.apkg` is a target**

**Andy's call, Aug 2026: design the schema for one-way `.apkg` export now.** The card schema in
`07` §4 is therefore Anki-compatible by construction rather than retrofitted. Premed OS never
imports or reads an Anki deck back.

### 14.1 Note type mapping

| premedOS | Anki note type | Notes |
|---|---|---|
| `clozePattern` absent | **Basic (and reversed as needed)** | `front` → Front, `back` → Back |
| `clozePattern: 'single'` \| `'independent'` \| `'enumerated-list'` \| `'definition'` | **Cloze** | `clozeText` → Text. Anki's own `{{c1::}}` syntax, so all four patterns export losslessly |

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
