/**
 * The three source modes (`02` §2).
 *
 * They differ in exactly one thing: what may appear beyond the supplied
 * sources, and how visibly.
 *
 * | mode | source facts | clarification | outside background |
 * |---|---|---|---|
 * | `SOURCE_ONLY` | yes | no | no |
 * | `SOURCE_PLUS_CLARIFICATION` | yes | yes, marked | no |
 * | `SOURCE_PLUS_BACKGROUND` | yes | yes, marked | yes, marked |
 *
 * ⚠️ **D-1, resolved Aug 2026:** under `SOURCE_PLUS_BACKGROUND` background is
 * visibly marked, the student may hide the inline markers, and **the header
 * always carries a non-dismissible count** — so the *fact* of background never
 * hides, only the decoration. Contradiction blocks are never hideable.
 */
import type { SourceMode } from '@/lib/generation/types'

export interface SourceModeSpec {
  mode: SourceMode
  admitsClarification: boolean
  admitsBackground: boolean
  /** Appended to the system prompt verbatim. */
  instruction: string
  /** D-1: the count the renderer must always show. Null when nothing outside
   *  the sources may appear at all. */
  headerCountLabel: string | null
}

export const SOURCE_MODES: Record<SourceMode, SourceModeSpec> = {
  SOURCE_ONLY: {
    mode: 'SOURCE_ONLY',
    admitsClarification: false,
    admitsBackground: false,
    instruction:
      'SOURCE_ONLY: introduce no fact that the supplied sources do not support. '
      + 'Where the sources are incomplete, emit an explicit gap rather than filling it. '
      + 'Every claim carries provenance: source.',
    headerCountLabel: null,
  },
  SOURCE_PLUS_CLARIFICATION: {
    mode: 'SOURCE_PLUS_CLARIFICATION',
    admitsClarification: true,
    admitsBackground: false,
    instruction:
      'SOURCE_PLUS_CLARIFICATION: you may restate or clarify what the sources already say, '
      + 'marked with provenance: clarification. You may not introduce outside content. '
      + 'A clarification never becomes the tested answer or the leading claim.',
    headerCountLabel: 'clarifications added',
  },
  SOURCE_PLUS_BACKGROUND: {
    mode: 'SOURCE_PLUS_BACKGROUND',
    admitsClarification: true,
    admitsBackground: true,
    instruction:
      'SOURCE_PLUS_BACKGROUND: you may add clearly marked background beyond the sources, '
      + 'with provenance: background. Background may only be subordinate explanation — '
      + 'it may not create a concept, lead a claim, or become the tested answer.',
    headerCountLabel: 'background additions',
  },
}

export function sourceModeSpec(mode: SourceMode): SourceModeSpec {
  return SOURCE_MODES[mode]
}
