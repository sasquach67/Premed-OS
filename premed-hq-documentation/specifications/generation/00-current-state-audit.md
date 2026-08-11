# 00 · Current-state generator architecture audit

**Deliverable 1.** What exists today, read from the code — not from the docs, which overstate it.

---

## 1. The headline

**There is one generation feature in premedOS, and it is not a generator.** It is `gap-check`: a
comparison engine. Nothing in the product creates study guides, flashcards, summaries, or practice
questions from source material.

| Thing | Status |
|---|---|
| Study guide generation | **Does not exist** |
| Flashcard generation | **Does not exist** |
| Summary / explanation generation | **Does not exist** |
| Practice exam generation | **Placeholder** — string templates, no model call |
| Gap-check (recall vs sources) | **Real and working** |

---

## 2. What the model call actually looks like today

`supabase/functions/study-tools/index.ts`. One action, `gap-check`.

**The entire instruction set:**

```
Compare recall only against the supplied topic sources. Never invent a source or offset.
Reply with a single JSON object and nothing else — no prose, no markdown fences.
It must match this JSON Schema: {…}
```

Two sentences of behavior, one of formatting. **No pedagogy, no rubric, no versioning, no
preferences, no presets, no source modes.** This is exactly the "make something good" pattern the
new engine exists to replace — and it is the only prompt in the product.

**Structural facts that matter to the new design:**

| Fact | Location | Implication |
|---|---|---|
| Provider fork: `AI_PROVIDER` → anthropic \| openai | `index.ts:71` | Two different capability and citation guarantees behind one UI |
| Model defaults: `claude-opus-5` / `gpt-4.1-mini` | `:173`, `:254` | Unset env var silently selects the expensive path |
| **Structured output and citations are mutually exclusive** | `:178` comment | The central architectural constraint. Anthropic 400s if you send `output_config.format` with document citations |
| Schema therefore lives in the prompt; `validateResult` is the real gate | `:183`, `:304` | Good pattern. Keep it |
| Citations verified against real chunk offsets | `:312–331` | Strong. The new engine must not weaken this |
| **OpenAI path skips citation verification entirely** | `:261` returns `trustedCitations: undefined` | Asymmetric grounding. Audit finding A6 |
| `MAX_REQUEST_BYTES = 64 * 1024` | `:3` | **Will not fit a lecture's worth of chunks.** See `09` §2 |
| `MAX_CHUNKS = 24`, retrieval `p_limit: 12` | `:4`, `:142` | Silent truncation ceiling |
| Rate limit 20/hour, 100/day, atomic in Postgres | `:57`, `claim_ai_request` | Well built. Constrains the multi-pass design |
| Retrieval degrades silently to `created_at` order without an embedding key | `:127–159` | Audit finding A12 |

---

## 3. Schemas that already exist

**In the edge function** — `citationSchema`, `itemSchema`, `resultSchema` (hand-written JSON Schema
constants, gap-check only). Pattern is sound and should be reused; scope is narrow.

**In `src/lib/types.ts`** — the grounding primitives already exist and are better than expected:

```ts
SourceChunk {
  id, fileId, courseId, topicId?, content,
  characterStart?, characterEnd?,        // exact citation range
  sourcePosition?: { index, label?, lectureNumber? },   // ← slide/page traceability
  assignmentMethod, assignmentConfirmed, coveredByKeyPoint, order
}

KeyPoint { id, topicId, text, sourceChunkIds[], timesSurfaced, … }

AcademicFile { …, sourceType, owner, processingStatus?, blobRef?, mimeType? }

Topic { id, courseId, title, unit?, status, fsrs, sourceNoteIds[], linkedFileIds[], … }
```

**Three consequences for the new design:**

1. **Slide/page traceability is available today.** `SourceChunk.sourcePosition.lectureNumber` and
   `.label` mean "See Lecture 6, Slide 14" is buildable in v1 without new ingestion work. This is
   better than I expected before reading the code.
2. **`KeyPoint.sourceChunkIds` is an existing grounded-claim primitive.** Study-guide concepts and
   flashcards should reuse this relationship shape rather than inventing a parallel one.
3. **Source chunks are text-only.** `content text not null`. There is no figure, image, or table
   extraction anywhere in the ingestion path — the only image handling in the codebase is a data-URL
   attachment on notes. **Source-figure recognition is not buildable on the current pipeline.**
   Confirmed deferred; see `06` §6.

---

## 4. The placeholder generator

`src/services/aiPracticeService.ts`, surfaced by `PracticeExamGenerator` in `ClassCenter.tsx:1811`.

Makes **no network call**. Emits template strings — `"Which option best explains ${topicLabel} in a
test-style scenario?"`, choices `"A correct application of X"` / `"A tempting but incomplete
statement about X"`, `correctAnswer: choices[0]` (always A, unshuffled), explanation prefixed
`"Placeholder rationale:"`. Persists as real `PracticeExam` + `PracticeQuestion` records.

**Its one genuinely valuable part is the shape**, which the new engine should keep:

```
request → assertGenerationAllowed(gate) → generate → typed response → onGenerated(persist)
```

Everything between the gate and the persist gets replaced.

---

## 5. `generationPolicy.ts` — keep this, it is the best thing here

Correctly separates two rules that had previously been conflated:

- **Academics — permissive.** Ten artifacts allowed: `practice-exam`, `practice-problems`,
  `problem-set`, `quiz`, `worksheet`, `study-guide`, `summary`, `explanation`, `flashcards`,
  `recall-prompts`.
- **MCAT — restricted.** `missed-to-mastery` and `flashcards` only. `qbank-questions` and
  `cars-passages` explicitly forbidden because MCAT practice must mirror a real standardized exam.

Three guardrails, all enforced: grounded in the class's own materials · stamped `owner: 'generated'`
· title never claims to be the genuine article.

**Assessment: architecturally correct, and it is an allow-list, not a feature list.** Nine of the ten
Academics artifacts have no implementation. The new engine registers concrete generators *behind*
this gate; the gate itself does not change.

---

## 6. User settings that exist today

`Settings` in `types.ts` has **nothing** generation-related. No `sourceMode`, no `cardDensity`, no
`explanationDepth`, no preset, no preference of any kind. The preference model in `05` §3 is
entirely new surface — no migration of existing preferences is required, which makes it cheap.

---

## 7. Is generation behavior duplicated across files?

**No.** This is the good news, and it is why this is a clean build rather than a rescue.

- One model-calling file: `supabase/functions/study-tools/index.ts`
- One client boundary: `src/lib/intelligence/studyTools.ts`
- One consumer: `src/pages/AcademicRecallSession.tsx`
- One placeholder: `src/services/aiPracticeService.ts` → `ClassCenter.tsx`

There is no scattered prompt logic to consolidate and no second call path to reconcile.

---

## 8. What depends on current output structures

| Consumer | Depends on | Breaks if |
|---|---|---|
| `AcademicRecallSession.tsx:523` | `GapCheckResult.suggestedGrade` | The gap-check schema changes |
| `AcademicRecallSession.tsx:203` (`openGapCitation`) | `StudyCitation` shape → `sourceItem.provenance` | Citation shape changes |
| `studyTools.ts` `isGapCheckResult` | Full result shape | Any field is renamed |
| `ClassCenter.tsx` `onGenerated` | `PracticeExam` + `PracticeQuestion` | The practice types change |
| `lib/academics/fsrs.ts` | `ReviewGrade` from the session | Grade vocabulary changes |

**The dependency graph is shallow and the blast radius is small.** Gap-check and the new generators
can coexist without either being rewritten — gap-check becomes the first *consumer* of the shared
global rules layer (`02` §1) rather than being replaced by it.

---

## 9. Conclusion

There is nothing to migrate away from. There is one working feature with a three-sentence prompt, one
placeholder to delete, one policy gate worth keeping, and a set of source primitives that are better
suited to this than expected.

**This is a greenfield build with one good gate, one good validator, and one good citation model
already in place.** The migration plan in `09` is therefore mostly about sequencing new work, not
about unpicking old work.
