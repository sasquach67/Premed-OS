/**
 * Material catalog — the Materials shelf (§4.1 materials extensions).
 *
 * Drawing:   mockup-lab/01-academics/academics-materials-extensions.html
 * Decisions: academics-materials-extensions.md — hierarchy is
 *            unit → material → provenance.
 *
 * ⚠️ Provenance is READ, never inferred. `AcademicFile.owner` is a structural
 * field the student set; a file without one is `unknown` and stays private.
 * Guessing "it's a PDF so it's course material" is exactly the confusion this
 * shelf exists to prevent.
 */
import type { AcademicFile, Topic } from '@/lib/types'

export type Provenance = 'course' | 'mine' | 'generated' | 'unknown'

export const PROVENANCE_LABEL: Record<Provenance, string> = {
  course: 'Instructor-provided',
  mine: 'Mine',
  generated: 'Generated',
  unknown: 'Unknown origin · private',
}

/** A file with no recorded owner is unknown — never quietly promoted to course material. */
export function provenanceOf(file: AcademicFile): Provenance {
  if (file.owner === 'course' || file.owner === 'mine' || file.owner === 'generated') return file.owner
  return 'unknown'
}

export const UNFILED = 'Unfiled'

/** The unit a file belongs to, via its linked topics. Files link to topics; topics carry the unit. */
export function unitOf(file: AcademicFile, topics: Topic[]): string {
  const ids = [file.topicId, ...(file.linkedTopicIds ?? [])].filter(Boolean) as string[]
  for (const id of ids) {
    const unit = topics.find((topic) => topic.id === id)?.unit
    if (unit) return unit
  }
  return UNFILED
}

export interface CatalogUnit {
  unit: string
  count: number
}

/**
 * The unit spine, in the class's own topic order rather than alphabetically.
 * `Unfiled` appears last and **only when something is actually unfiled** — an
 * empty bucket would invent a chore.
 */
export function catalogUnits(files: AcademicFile[], topics: Topic[]): CatalogUnit[] {
  const order: string[] = []
  for (const topic of topics) {
    if (topic.unit && !order.includes(topic.unit)) order.push(topic.unit)
  }
  const counts = new Map<string, number>()
  for (const file of files) {
    const unit = unitOf(file, topics)
    counts.set(unit, (counts.get(unit) ?? 0) + 1)
  }
  const rows = order
    .filter((unit) => counts.has(unit))
    .map((unit) => ({ unit, count: counts.get(unit) ?? 0 }))
  if (counts.has(UNFILED)) rows.push({ unit: UNFILED, count: counts.get(UNFILED) ?? 0 })
  return rows
}

export interface CatalogEntry {
  file: AcademicFile
  provenance: Provenance
  unit: string
}

export function catalogEntries(files: AcademicFile[], topics: Topic[], unit?: string): CatalogEntry[] {
  return files
    .map((file) => ({ file, provenance: provenanceOf(file), unit: unitOf(file, topics) }))
    .filter((entry) => unit == null || entry.unit === unit)
    .sort((a, b) => a.file.order - b.file.order)
}

/** The study shelf excludes supporting images; the source collection stays intact.
 * Generated diagrams remain study artifacts. Metadata takes precedence over
 * legacy screenshot titles so a PDF named after a screenshot remains a document.
 */
export function isPrimaryMaterial(file: AcademicFile): boolean {
  if (file.owner === 'generated') return true
  if (file.mimeType?.toLowerCase().startsWith('image/')) return false
  const name = file.fileName ?? file.url ?? file.title
  if (/\.(png|jpe?g|webp|gif|heic|heif|avif|bmp|tiff?|svg)(?:$|[?#])/i.test(name)) return false
  if (/\.(pdf|docx?|pptx?|xlsx?|txt|md|rtf)(?:$|[?#])/i.test(name)) return true
  if (file.mimeType && file.mimeType !== 'application/octet-stream') return true
  return !/^(screenshot|screen[ _-]?shot|screen capture|codex-clipboard)[ _-]/i.test(file.title)
}
