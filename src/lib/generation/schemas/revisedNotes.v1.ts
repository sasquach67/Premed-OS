import type {
  GeneratedRevisedNotesDifference, GeneratedRevisedNotesPassage,
  GeneratedRevisedNotesRef, GeneratedRevisedNotesSection,
} from '@/lib/types'

/** Transport shape before class ownership, timestamps, and coverage are added. */
export interface RevisedNotesArtifact {
  title: string
  sections: GeneratedRevisedNotesSection[]
  unresolvedDifferences: GeneratedRevisedNotesDifference[]
}

function isRef(value: unknown): value is GeneratedRevisedNotesRef {
  if (!value || typeof value !== 'object') return false
  const ref = value as Partial<GeneratedRevisedNotesRef>
  return typeof ref.fileId === 'string' && typeof ref.chunkId === 'string'
    && Number.isInteger(ref.start) && Number.isInteger(ref.end)
    && Number(ref.start) >= 0 && Number(ref.end) > Number(ref.start)
}

function hasClosedRef(ref: GeneratedRevisedNotesRef, closed: ReadonlyMap<string, string>) {
  return closed.get(`${ref.chunkId}:${ref.start}:${ref.end}`) === ref.fileId
}

function isPassage(value: unknown, closed: ReadonlyMap<string, string>): value is GeneratedRevisedNotesPassage {
  if (!value || typeof value !== 'object') return false
  const passage = value as Partial<GeneratedRevisedNotesPassage>
  return typeof passage.id === 'string' && typeof passage.content === 'string' && Boolean(passage.content.trim())
    && passage.provenance === 'source'
    && Array.isArray(passage.sourceRefs) && passage.sourceRefs.length > 0
    && passage.sourceRefs.every((ref) => isRef(ref) && hasClosedRef(ref, closed))
}

function isSection(value: unknown, closed: ReadonlyMap<string, string>): value is GeneratedRevisedNotesSection {
  if (!value || typeof value !== 'object') return false
  const section = value as Partial<GeneratedRevisedNotesSection>
  return typeof section.id === 'string' && typeof section.title === 'string' && Boolean(section.title.trim())
    && Array.isArray(section.passages) && section.passages.length > 0
    && section.passages.every((passage) => isPassage(passage, closed))
}

function isDifference(value: unknown, closed: ReadonlyMap<string, string>): value is GeneratedRevisedNotesDifference {
  if (!value || typeof value !== 'object') return false
  const difference = value as Partial<GeneratedRevisedNotesDifference>
  return typeof difference.id === 'string'
    && difference.label === 'Unresolved source difference'
    && typeof difference.detail === 'string' && Boolean(difference.detail.trim())
    && Array.isArray(difference.sourceRefs) && difference.sourceRefs.length >= 2
    && difference.sourceRefs.every((ref) => isRef(ref) && hasClosedRef(ref, closed))
}

/** Reject an entire artifact when even one assertion lacks a carried citation. */
export function validateRevisedNotes(value: unknown, closedCitations: ReadonlyMap<string, string>): RevisedNotesArtifact | null {
  if (!value || typeof value !== 'object') return null
  const artifact = value as Partial<RevisedNotesArtifact>
  if (typeof artifact.title !== 'string' || !artifact.title.trim()) return null
  if (!Array.isArray(artifact.sections) || !artifact.sections.length || !artifact.sections.every((section) => isSection(section, closedCitations))) return null
  if (!Array.isArray(artifact.unresolvedDifferences) || !artifact.unresolvedDifferences.every((difference) => isDifference(difference, closedCitations))) return null
  return artifact as RevisedNotesArtifact
}
