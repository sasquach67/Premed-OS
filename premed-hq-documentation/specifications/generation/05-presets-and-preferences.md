# 05 · Presets · Controls · User preferences

**Deliverables 6 and 9.** Layers 3 and 4.

---

## 1. The independent controls

Presets are **named bundles of these controls**, nothing more. Every control is `tunable`, every
control can be set independently, and no control can reach an `invariant` rule.

| Control | Values | Applies to | Default |
|---|---|---|---|
| `card_density` | `sparse` \| `moderate` \| `dense` | cards | `moderate` |
| `preferred_card_type` | `mixed` \| `basic` \| `cloze` \| `conceptual` | cards | `mixed` |
| `explanation_depth` | `minimal` \| `moderate` \| `deep` | both | `moderate` |
| `source_mode` | `SOURCE_ONLY` \| `…CLARIFICATION` \| `…BACKGROUND` | both | `…CLARIFICATION` |
| `difficulty` | `foundational` \| `standard` \| `challenging` | both | `standard` |
| `coverage_depth` | `essential` \| `standard` \| `thorough` | both | `standard` |
| `use_analogies` | `none` \| `sparing` \| `frequent` | both | `sparing` |
| `use_tables` | `minimal` \| `balanced` \| `favor` | guides | `balanced` |
| `clinical_connections` | `off` \| `when_supported` \| `encouraged` | both | `when_supported` |
| `guide_structure` | `standard` \| `concept_first` \| `mechanism_first` \| `exam_focused` | guides | `standard` |

### 1.1 What the values mean

**`card_density`** — cards per distinct concept, not cards per page.
`sparse` ≈ 1 · `moderate` ≈ 1–2 · `dense` ≈ 2–4, **still subject to `FC-10`** (do not turn every
sentence into a card). Density raises the ceiling; it never lowers the quality bar.

**`explanation_depth`** — length and elaboration of `extra` on cards, and of concept blocks in
guides. Never affects the *tested* answer, which stays concise under all values.

**`difficulty`** — how much inference a prompt demands, not how obscure the content is.
`foundational` = direct recall · `standard` = mixed · `challenging` = more conceptual and
application cards, more discriminative comparisons. **It does not license harder content than the
source contains.**

**`coverage_depth`** — how much of the source is treated. See `03` §7 for guide block targets.

**`guide_structure`** —

| Value | Effect on section order |
|---|---|
| `standard` | The `03` §2 order |
| `concept_first` | CORE CONCEPTS immediately after BIG PICTURE; mechanisms folded into concepts |
| `mechanism_first` | MECHANISMS before CORE CONCEPTS. Suits pathway-heavy topics |
| `exam_focused` | HIGH-YIELD and MUST MEMORIZE hoisted directly after BIG PICTURE |

**No value of `guide_structure` may drop a required section** (`03` §2). It reorders; it does not
delete.

---

## 2. Preset definitions

### 2.1 `premedos-default`

The house methodology. **This is the one to get right** — most students never change a setting, so
this preset is the product's actual pedagogy.

```
card_density        moderate      preferred_card_type   mixed
explanation_depth   moderate      difficulty            standard
coverage_depth      standard      use_analogies         sparing
use_tables          balanced      clinical_connections  when_supported
guide_structure     standard      source_mode           SOURCE_PLUS_CLARIFICATION
```

Mixed card types · moderate density · strong emphasis on understanding **and** recall · concise
tested answers with explanation in `extra` · no unnecessary card proliferation.

### 2.2 `concise-cloze`

```
card_density        moderate      preferred_card_type   cloze
explanation_depth   minimal       difficulty            standard
coverage_depth      standard      use_analogies         none
clinical_connections off
```

Cloze-heavy, short cards, high context retention, minimal explanation unless needed.
**Type cap lifted:** cloze may exceed the 60% ceiling here. **Conceptual floor waived** — this is the
one preset exempt from `04` §5, because the student has explicitly asked for a recall-drill deck.

### 2.3 `conceptual-qa`

```
card_density        sparse        preferred_card_type   conceptual
explanation_depth   deep          difficulty            challenging
coverage_depth      standard      use_analogies         frequent
```

More why/how questions, fewer cards, deeper explanatory answers, conceptual integration over isolated
facts. **Conceptual floor raised to 50%.**

### 2.4 `high-density`

```
card_density        dense         preferred_card_type   mixed
explanation_depth   minimal       coverage_depth        thorough
difficulty          standard
```

More granular coverage. **Atomicity is still enforced** (`FC-1`), and `FC-10` still holds.

> **The rule that makes this preset safe:** *do not sacrifice quality to increase card count.* If
> the material yields 20 good cards, `high-density` produces 20 — not 45 padded ones. Density is a
> permission to go finer where finer granularity is genuinely warranted; it is not a quota. The
> deterministic checks in `08` §2.1 apply unchanged.

### 2.5 `exam-cram`

```
card_density        moderate      preferred_card_type   mixed
explanation_depth   minimal       coverage_depth        essential
difficulty          standard      clinical_connections  off
guide_structure     exam_focused
```

Prioritizes explicitly emphasized, testable, high-yield information. Lower explanation depth.

> **The invariant this preset must not breach:** *do not fabricate what will be on an exam.*
> `exam-cram` **weights** high-yield material more heavily; it does **not** relax the §1.7
> defensibility test. If the source contains no instructor emphasis signals, `exam-cram` produces a
> guide with an **empty high-yield section**, and the UI must say *"no explicit emphasis found in
> your materials"* rather than letting the model invent priorities. This is the preset most likely
> to be misread as licence to guess, and it is the one where guessing does the most damage.

---

## 3. User preference model

Persistent, per student, stored in `Settings`. **New surface — no existing preferences to migrate**
(`00` §6).

```ts
interface GenerationPreferences {
  defaultPreset: PresetId               // 'premedos-default'
  // per-control overrides layered over the preset
  overrides: Partial<GenerationControls>
  // explicit, separately-stored because they read as identity rather than settings
  prefersClozeOverQA?: boolean
  prefersConciseExplanations?: boolean
  prefersConceptualOverMemorization?: boolean
  sourceOnlyByDefault?: boolean
  rememberPerCourse?: Record<CourseId, Partial<GenerationControls>>
}
```

### 3.1 Resolution order

```
preset defaults
  → user overrides
    → per-course overrides
      → request-level controls   (this generation only, not persisted)
```

Later wins **for tunables only**. The assembler rejects at build time any override targeting an
invariant (`01` §1.1).

### 3.2 The constraint that matters

**Preferences modify the generator. They never override factual or safety constraints.**

Concretely, no preference can:

- introduce a fact under `SOURCE_ONLY`
- mark background knowledge as high-yield
- exceed the emphasis budget (`G-EMPH-4/5/6`)
- lower the atomicity bar
- suppress a gap marker or a contradiction marker
- produce qbank questions or CARS passages in MCAT scope
- remove a required study-guide section
- drop a source reference

These are not "discouraged." The build fails.

### 3.3 Learned preferences — explicitly out of scope for v1

It is tempting to infer preferences from behavior — if a student deletes every cloze card, prefer
Q&A. **v1 does not do this**, for two reasons:

1. It makes generation non-reproducible. Two runs with the same inputs would differ, which breaks
   version comparison (`01` §3) — the thing that makes the whole system improvable.
2. Deletion is ambiguous. A student deleting cloze cards may dislike cloze, or may have found those
   particular cards bad.

If it is added later it belongs as an **explicit suggestion** — *"you've deleted most cloze cards.
Switch your default to Conceptual Q&A?"* — not a silent drift. That keeps the preference declared
and the generation reproducible.

### 3.4 Preference discoverability

A preference nobody finds is a default. The generation dialog should surface **preset + source mode**
inline at generation time, with the rest behind "Advanced." Presets are the discoverable surface;
individual controls are for students who already know what they want.
