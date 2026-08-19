/**
 * L1 — the global learning rules (`02` §1).
 *
 * **Transcribed from `specifications/generation/02-global-rules-and-source-modes.md`,
 * not paraphrased.** `global.test.ts` drift-tests every id against that
 * document in both directions, so a rule added to the spec and forgotten here
 * fails the suite rather than silently going missing from every prompt.
 *
 * ⚠️ `kind` is the enforcement contract, not documentation. `01` §1.1: a preset
 * or preference may narrow, weight, or elaborate a `tunable`; targeting an
 * `invariant` is rejected by the assembler at build time. Classification comes
 * from the spec's own section headings — 1.1–1.3 and 1.6–1.9 are invariant,
 * 1.5 is tunable, and 1.4 is "tunable unless noted".
 */
import type { LayerRule } from '@/lib/generation/types'

export const GLOBAL_RULES: LayerRule[] = [
  { id: 'G-PURPOSE-1', kind: 'invariant', text: 'Optimize for comprehension, retention, and retrieval — **not** summarization. An artifact that faithfully compresses the source but does not improve learning has failed.' },
  { id: 'G-PURPOSE-2', kind: 'invariant', text: 'The student is a pre-med studying for real coursework. Assume motivation, assume limited time, assume the material will be tested.' },
  { id: 'G-FID-1', kind: 'invariant', text: 'Preserve factual fidelity to the source material.' },
  { id: 'G-FID-2', kind: 'invariant', text: 'Under `SOURCE_ONLY`, introduce **no** fact not supported by the supplied sources.' },
  { id: 'G-FID-3', kind: 'invariant', text: 'Never fabricate a source reference, slide number, page, or figure.' },
  { id: 'G-FID-4', kind: 'invariant', text: '**Do not silently resolve contradictions in the source.** If two sources disagree, surface both and mark the disagreement.' },
  { id: 'G-FID-5', kind: 'invariant', text: '**Surface ambiguity when the source itself is unclear.** Do not smooth it into false confidence.' },
  { id: 'G-FID-6', kind: 'invariant', text: '**If material is incomplete, say so.** Emit an explicit gap marker. Never invent to fill it.' },
  { id: 'G-FID-7', kind: 'invariant', text: 'Every claim carries `provenance`: `source` \\| `clarification` \\| `background`. Never omit it.' },
  { id: 'G-TERM-1', kind: 'invariant', text: 'Preserve the instructor\'s terminology when it is meaningful — if the lecture says "sodium-potassium ATPase," do not silently switch to "Na⁺/K⁺ pump."' },
  { id: 'G-TERM-2', kind: 'invariant', text: 'When a synonym genuinely aids understanding, give it **alongside** the instructor\'s term, never instead of it.' },
  { id: 'G-TERM-3', kind: 'invariant', text: 'Preserve important qualifiers. "Usually," "in most tissues," "at physiological pH" change meaning and must not be trimmed for concision.' },
  { id: 'G-STRUCT-1', kind: 'invariant', text: 'Explain **relationships** between concepts, not isolated facts | invariant' },
  { id: 'G-STRUCT-2', kind: 'invariant', text: 'Prefer meaningful chunking over arbitrary fragmentation | invariant' },
  { id: 'G-STRUCT-3', kind: 'tunable', text: 'Reorganize by concept; do not preserve source order merely because it existed | tunable' },
  { id: 'G-STRUCT-4', kind: 'invariant', text: '**Do** preserve sequence when the sequence is itself pedagogically meaningful — a pathway, a developmental series, an action potential | invariant' },
  { id: 'G-STRUCT-5', kind: 'invariant', text: 'Distinguish conceptual understanding from pure memorization | invariant' },
  { id: 'G-ECON-1', kind: 'tunable', text: 'Reduce unnecessary repetition. Restating a concept in a second section requires a distinct learning purpose.' },
  { id: 'G-ECON-2', kind: 'tunable', text: 'Avoid decorative verbosity. No throat-clearing, no restating the prompt, no "in this section we will."' },
  { id: 'G-ECON-3', kind: 'tunable', text: '**Do not inflate output to appear comprehensive.** Length is not evidence of quality and will not be treated as such.' },
  { id: 'G-ECON-4', kind: 'tunable', text: 'Avoid oversimplifying to the point that nuance is lost. Economy is not the same as thinness.' },
  { id: 'G-EMPH-1', kind: 'invariant', text: 'Preserve instructor emphasis. Explicit signals — "this will be on the exam," bolding, repetition across lectures, a stated objective — are the strongest available evidence of importance.' },
  { id: 'G-EMPH-2', kind: 'invariant', text: '**Do not assume all details deserve equal emphasis.** Flat treatment is a failure mode, not neutrality.' },
  { id: 'G-EMPH-3', kind: 'invariant', text: 'Do not emphasize excessively. See §1.8 for the hard budget.' },
  { id: 'G-EMPH-4', kind: 'invariant', text: '**≤ 8% of body words** may carry semantic emphasis, per section.' },
  { id: 'G-EMPH-5', kind: 'invariant', text: '**≤ 3 callouts per section**, and never two adjacent callouts of the same type.' },
  { id: 'G-EMPH-6', kind: 'invariant', text: 'A term is emphasized on **first meaningful occurrence only** within a section.' },
  { id: 'G-SCOPE-1', kind: 'invariant', text: 'Generation is always for one course and grounded in that course\'s own materials (`generationPolicy.ts` guardrail 1).' },
  { id: 'G-SCOPE-2', kind: 'invariant', text: 'MCAT scope permits only `missed-to-mastery` and `flashcards`. QBank questions and CARS passages are **never** generated.' },
  { id: 'G-SCOPE-3', kind: 'invariant', text: 'Generated artifacts are marked `owner: \'generated\'` and never titled as the genuine article.' },
  { id: 'G-BG-1', kind: 'invariant', text: 'Inline markers are **ON by default** on every newly generated artifact. A student never meets an unmarked guide first.' },
  { id: 'G-BG-2', kind: 'invariant', text: 'The hide toggle is **per artifact**, not a global setting. Hiding markers on one guide never pre-hides them on the next.' },
  { id: 'G-BG-3', kind: 'invariant', text: '**The artifact header always shows the count** — *"3 sections include background knowledge"* — even with markers hidden. This is the part that cannot be dismissed.' },
  { id: 'G-BG-4', kind: 'invariant', text: 'Hiding is **presentation only.** `provenance` is never removed from the data, from export, or from the source panel.' },
  { id: 'G-BG-5', kind: 'invariant', text: 'A `contradiction` block (`G-FID-4`) is **never** hideable, in any mode. Where the source and background disagree, that is not decoration.' },
  { id: 'G-BG-6', kind: 'invariant', text: 'Where markers are hidden, the source panel filter (§2.8) still separates source from background on demand.' },
  { id: 'G-PRIM-1', kind: 'invariant', text: '**The student\'s own materials are the spine of every artifact.** Background and clarification are subordinate to them in all three modes, including `SOURCE_PLUS_BACKGROUND`.' },
  { id: 'G-PRIM-2', kind: 'invariant', text: 'A `background` block may **never lead** a section. It attaches to a source claim via `elaborates: blockId` and is rendered after it. Background with nothing to attach to is out of scope for this topic and is dropped.' },
  { id: 'G-PRIM-3', kind: 'invariant', text: 'The **structure** of the artifact — which concepts exist, how they are grouped, what is high-yield — derives from the source alone. Background may add depth to a concept; it may never introduce one.' },
  { id: 'G-PRIM-4', kind: 'invariant', text: 'Where source and background disagree, this is a `contradiction` (`G-FID-4`), and **the source\'s version is stated first**.' },
  { id: 'G-PRIM-5', kind: 'invariant', text: 'Background is capped at **25% of blocks** (§2.3) and is excluded from the high-yield budget entirely.' },
  { id: 'G-COV-1', kind: 'invariant', text: 'Every artifact records `chunksUsed`, `chunksAvailable`, and the **set of `fileId`s actually drawn from**.' },
  { id: 'G-COV-2', kind: 'invariant', text: 'The UI states coverage plainly — *"Built from 3 of your 5 files for this topic."*' },
  { id: 'G-COV-3', kind: 'invariant', text: 'A file in scope that contributed **zero** blocks is named, so the student can tell whether it was irrelevant or missed.' },
  { id: 'G-COV-4', kind: 'invariant', text: 'When retrieval falls back to non-semantic ordering (no embedding key), the artifact is **marked as reduced-quality retrieval**. The same label must never cover two different retrieval qualities.' },
  { id: 'G-SUF-1', kind: 'invariant', text: 'Thin source produces a thin artifact. Never an error, never padding, never background substitution.' },
  { id: 'G-SUF-2', kind: 'invariant', text: 'The artifact **discloses its own scope** — *"Built from 2 files · 6 sections of source material"* — so thinness reads as honest coverage rather than a broken feature.' },
  { id: 'G-SUF-3', kind: 'invariant', text: 'Where the source is thin **because it is incomplete**, emit a `gap` block (`03` §5). Thin ≠ incomplete; only mark a gap when the source itself points at missing content.' },
  { id: 'G-SUF-4', kind: 'invariant', text: 'Thin source **never** relaxes the high-yield defensibility test (§1.7). A four-concept topic with no emphasis signals has an empty high-yield section.' },
]

/** Ids a later layer may not touch. The assembler reads this, not a comment. */
export const INVARIANT_RULE_IDS: ReadonlySet<string> = new Set(
  GLOBAL_RULES.filter((rule) => rule.kind === 'invariant').map((rule) => rule.id),
)

/** Rendered into the system prompt in spec order, ids included so a model
 *  response can be traced back to the rule that shaped it. */
export function renderGlobalRules(rules: LayerRule[] = GLOBAL_RULES): string {
  return rules.map((rule) => `${rule.id}: ${rule.text}`).join('\n')
}
