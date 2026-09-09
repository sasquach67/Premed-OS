import type { Evidence } from './types'

export type LearningEvidence = Evidence & { assetIds: string[] }
export type LearningItem = Evidence & { id: string }
type LearningIdentity = LearningItem & { title: string; provenance: 'source' | 'clarification' | 'background' | 'generated-practice' | 'student-work' }
export type LearningAxis = { mode: 'ordinal' | 'numeric'; unit: string | null; minimum: number | null; maximum: number | null }
export type LearningAnnotation = LearningItem & { label: string; x: number; y: number; positionBasis: string }
export type AnnotatedFigureBlock = LearningIdentity & {
  type: 'annotated-figure'; assetId: string; caption: string | null; alt: string; context: string; annotations: LearningAnnotation[]
}
export type LearningAxisPoint = LearningItem & { label: string; detail: string; value: number | null }
export type TimelineBlock = LearningIdentity & {
  type: 'timeline'; orderingBasis: string; axis: LearningAxis; events: (LearningAxisPoint & { timeLabel: string | null })[]
}
export type ContinuumBlock = LearningIdentity & { type: 'continuum'; orderingBasis: string; axis: LearningAxis; points: LearningAxisPoint[] }
export type VennBlock = LearningIdentity & {
  type: 'venn'; sets: (LearningItem & { label: string })[]
  regions: { id: string; setIds: string[]; items: (LearningItem & { text: string })[] }[]
}
export type SequenceStripBlock = LearningIdentity & {
  type: 'sequence-strip'; orderingBasis: string
  steps: (LearningItem & { label: string; detail: string; assetId: string | null; alt: string | null })[]
}
export type WorkedExampleBlock = LearningIdentity & {
  type: 'worked-example'; problem: string; problemEvidence: LearningEvidence; solutionEvidence: LearningEvidence; stimulusBlockIds: string[]
  steps: (LearningItem & { label: string; explanation: string })[]; answer: string; check: string | null
}
export type LearningVisualBlock = AnnotatedFigureBlock | TimelineBlock | ContinuumBlock | VennBlock | SequenceStripBlock | WorkedExampleBlock
export function isLearningVisualBlock(block: { type: string }): block is LearningVisualBlock {
  return ['annotated-figure', 'timeline', 'continuum', 'venn', 'sequence-strip', 'worked-example'].includes(block.type)
}
