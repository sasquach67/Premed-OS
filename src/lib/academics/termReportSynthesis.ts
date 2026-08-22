import type { TermReportBlock } from '@/lib/types'

export interface TermReportAiItem {
  title: string
  text: string
  evidenceIds: string[]
}

export interface TermReportAiArtifact {
  takeaways: TermReportAiItem[]
  experiments: TermReportAiItem[]
  limit: string
}

const CAUSAL_LANGUAGE = /\b(caus(?:e|ed|es|ing)|improv(?:e|ed|es|ing)|because you|therefore|led to|resulted in|determined|predict(?:s|ed|ing)?|visual learner|auditory learner|learning style|spent too little time)\b/i

export function validateTermReportArtifact(value: unknown, allowedEvidenceIds: Set<string>): value is TermReportAiArtifact {
  if (!value || typeof value !== 'object') return false
  const artifact = value as Partial<TermReportAiArtifact>
  if (!Array.isArray(artifact.takeaways) || artifact.takeaways.length < 2 || artifact.takeaways.length > 4) return false
  if (!Array.isArray(artifact.experiments) || artifact.experiments.length < 1 || artifact.experiments.length > 2) return false
  if (typeof artifact.limit !== 'string' || !artifact.limit.trim()) return false
  return [...artifact.takeaways, ...artifact.experiments].every((item) => isSafeItem(item, allowedEvidenceIds))
}

function isSafeItem(value: unknown, allowedEvidenceIds: Set<string>): value is TermReportAiItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<TermReportAiItem>
  return typeof item.title === 'string' && Boolean(item.title.trim())
    && typeof item.text === 'string' && Boolean(item.text.trim())
    && !CAUSAL_LANGUAGE.test(`${item.title} ${item.text}`)
    && Array.isArray(item.evidenceIds) && item.evidenceIds.length > 0
    && item.evidenceIds.every((id) => typeof id === 'string' && allowedEvidenceIds.has(id))
}

export function aiBlocks(artifact: TermReportAiArtifact): TermReportBlock[] {
  return [
    ...artifact.takeaways.map((item, index) => ({ id: `ai-takeaway-${index}`, kind: 'takeaway' as const, title: item.title, text: item.text, evidenceIds: item.evidenceIds, source: 'ai' as const })),
    ...artifact.experiments.map((item, index) => ({ id: `ai-experiment-${index}`, kind: 'experiment' as const, title: item.title, text: item.text, evidenceIds: item.evidenceIds, source: 'ai' as const })),
    { id: 'ai-limit', kind: 'limit' as const, title: 'What this can say', text: artifact.limit, evidenceIds: [], source: 'ai' as const },
  ]
}
