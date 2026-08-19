/**
 * `07` §1 shared primitives and §2 study-guide content blocks.
 *
 * ⚠️ Two fields the model never authors, and both for the same reason —
 * **anything that must be stable or verifiable is derived, not generated**:
 *   • `SourceRef.display` — the model emits `chunkId` + offsets; the client
 *     resolves the human label, which is what makes "See Lecture 6, Slide 14"
 *     unfabricatable (`01` §4.1).
 *   • `conceptId` — the model supplies a natural-language label; identity is
 *     the client's job (`07` §5.1).
 */

export type Provenance = 'source' | 'clarification' | 'background'

export interface SourceRef {
  chunkId: string
  fileId: string
  /** Absolute character offset within the chunk. */
  start: number
  end: number
  /** NOT model-authored — resolved client-side from `SourceChunk.sourcePosition`. */
  display?: { fileTitle: string; lectureNumber?: number; slideLabel?: string }
}

export type HighYieldBasis =
  | 'instructor-emphasis' | 'stated-objective' | 'cross-source-repetition'
  | 'structural-load' | 'assessment-form'

export interface EmphasisSpan {
  text: string
  emphasis:
    | 'key_term' | 'molecule' | 'structure' | 'pathway'
    | 'formula' | 'value' | 'distinction' | 'instructor_emphasis'
}

export interface RichText {
  content: string
  /** Spans within `content`; never styling. */
  emphasis?: EmphasisSpan[]
}

export type BlockType =
  | 'prose' | 'bullets' | 'numbered' | 'table' | 'callout' | 'gap' | 'contradiction'
  | 'must_memorize' | 'must_understand' | 'recall'

export interface ContentBlock {
  id: string
  type: BlockType
  text?: RichText
  items?: RichText[]
  provenance: Provenance
  sourceRef?: SourceRef
  highYield?: boolean
  basis?: HighYieldBasis
  /** Natural-language label from the model; `conceptId` is derived from it. */
  conceptLabel?: string
  conceptKind?: string
  /** Nesting depth for list blocks. `SG-6` caps this at 2. */
  depth?: number
}

export interface GuideSection {
  id: string
  title: string
  blocks: ContentBlock[]
}

export interface StudyGuideArtifact {
  specId: string
  specHash: string
  courseId: string
  topicId: string
  sections: GuideSection[]
}

/** Block types that cannot stand without a citation (`01` §4.2). */
export const CITATION_REQUIRED: ReadonlySet<BlockType> = new Set<BlockType>([
  'prose', 'bullets', 'numbered', 'table', 'must_memorize', 'must_understand',
])
