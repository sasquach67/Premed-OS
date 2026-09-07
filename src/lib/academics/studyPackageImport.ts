import type { ClassCenterData, LectureRecord, SourceChunk } from '@/lib/types'
import type { ContentBlock } from '@/lib/generation/schemas/studyGuide.v1'
import { uid } from '@/lib/id'

export const STUDY_PACKAGE_MAX_BYTES = 8 * 1024 * 1024
export type StudyPackage = {
  format: 'premed-os-study-package'; version: 1; title: string
  sources: { id: string; title: string; text: string; location: string }[]
  sections: { title: string; blocks: { type: ContentBlock['type']; text?: string; items?: string[]; sourceId?: string }[] }[]
  objectives: { title: string; freeRecallCues: string[]; understand: string[]; beAbleToDo: string[]; watchFor: string[]; sourceIds: string[] }[]
}
const record = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('Expected a study-package object.')
  return v as Record<string, unknown>
}
function text(v: unknown, name: string, max = 100_000): string {
  if (typeof v !== 'string' || !v.trim() || v.length > max) throw new Error(`${name} must contain text (up to ${max.toLocaleString()} characters).`)
  return v.trim()
}
function array(v: unknown, name: string, max: number): unknown[] {
  if (!Array.isArray(v) || v.length > max) throw new Error(`${name} must be a list of at most ${max} items.`)
  return v
}
const strings = (v: unknown, name: string) => array(v ?? [], name, 200).map(item => text(item, name, 10_000))
const types = new Set(['prose', 'bullets', 'numbered', 'table', 'callout', 'gap', 'contradiction', 'must_memorize', 'must_understand', 'recall'])
/** Rebuild every object from allowed fields. Never trust imported IDs, course ownership, or audit claims. */
export function parseStudyPackage(raw: string): StudyPackage {
  if (new TextEncoder().encode(raw).length > STUDY_PACKAGE_MAX_BYTES) throw new Error('Choose a study package smaller than 8 MB.')
  let value: unknown
  try { value = JSON.parse(raw) } catch { throw new Error('This is not valid JSON. Use a Premed OS study-package file.') }
  const p = record(value)
  if (p.format !== 'premed-os-study-package' || p.version !== 1) throw new Error('Use a Premed OS study package with version 1.')
  const sources = array(p.sources ?? [], 'Sources', 500).map(v => {
    const r = record(v)
    return { id: text(r.id, 'Source ID', 200), title: text(r.title, 'Source title', 300), text: text(r.text, 'Source excerpt', 200_000), location: r.location === undefined ? 'Imported excerpt' : text(r.location, 'Source location', 300) }
  })
  const ids = new Set(sources.map(s => s.id))
  if (ids.size !== sources.length) throw new Error('Source IDs must be unique.')
  function sourceId(v: unknown) { const id = text(v, 'Source reference', 200); if (!ids.has(id)) throw new Error(`Source reference “${id}” is missing from the package.`); return id }
  const sections = array(p.sections, 'Sections', 100).map(v => {
    const r = record(v)
    const blocks = array(r.blocks, 'Section blocks', 200).map(v => {
      const b = record(v)
      if (typeof b.type !== 'string' || !types.has(b.type)) throw new Error('A guide block has an unsupported type.')
      const content = b.text === undefined ? undefined : text(b.text, 'Block text')
      const items = b.items === undefined ? undefined : strings(b.items, 'Block items')
      if (!content && !items?.length) throw new Error('Each guide block needs text or list items.')
      return { type: b.type as ContentBlock['type'], text: content, items, sourceId: b.sourceId === undefined ? undefined : sourceId(b.sourceId) }
    })
    if (!blocks.length) throw new Error('Each section needs at least one block.')
    return { title: text(r.title, 'Section title', 300), blocks }
  })
  if (!sections.length) throw new Error('The package needs at least one guide section.')
  const objectives = array(p.objectives ?? [], 'Objectives', 200).map(v => {
    const r = record(v); const understand = strings(r.understand, 'Understand')
    if (!understand.length) throw new Error('Each objective needs at least one understanding point.')
    return { title: text(r.title, 'Objective title', 300), understand, freeRecallCues: strings(r.freeRecallCues, 'Recall cues'), beAbleToDo: strings(r.beAbleToDo, 'Be able to do'), watchFor: strings(r.watchFor, 'Watch for'), sourceIds: array(r.sourceIds ?? [], 'Objective sources', 500).map(sourceId) }
  })
  return { format: 'premed-os-study-package', version: 1, title: text(p.title, 'Guide title', 300), sources, sections, objectives }
}
export async function studyPackageFingerprint(p: StudyPackage) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(p)))
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}
/** One store transaction; re-import opens the existing entry in this course. */
export function importStudyPackage(center: ClassCenterData, courseId: string, p: StudyPackage, fingerprint: string, now = Date.now()): string {
  const duplicate = center.lectures.find(l => l.courseId === courseId && l.importedStudyPackage?.fingerprint === fingerprint)
  if (duplicate) return duplicate.id
  const lectureId = uid()
  const sourceMap = new Map<string, SourceChunk>()
  for (const source of p.sources) {
    const fileId = uid(); const chunkId = uid()
    center.files.push({ id: fileId, courseId, lectureId, title: source.title, type: 'other', sourceType: 'paste', owner: 'mine', linkedTopicIds: [], processingStatus: 'ready', createdAt: now, updatedAt: now, order: center.files.length })
    const chunk: SourceChunk = { id: chunkId, fileId, courseId, content: source.text, sourcePosition: { index: 0, label: source.location }, coveredByKeyPoint: false, createdAt: now, updatedAt: now, order: center.sourceChunks.length }
    center.sourceChunks.push(chunk); sourceMap.set(source.id, chunk)
  }
  const lecture: LectureRecord = {
    id: lectureId, courseId, title: p.title, inputPath: 'materials', processingState: 'ready', workspaceState: 'complete',
    notebookGoal: 'review', notebookRequest: '', notebookGeneratedGoal: 'review', notebookGeneratedRequest: '', notebookOutput: 'study-package',
    generationAuditStatus: 'skipped', importedStudyPackage: { fingerprint, importedAt: now, version: 1 },
    selectedSourceFileIds: [...sourceMap.values()].map(c => c.fileId),
    studyGuide: { specId: 'study-guide-v1', specHash: 'external-import-v1', courseId, topicId: '__class_material__', sections: p.sections.map(section => ({ id: uid(), title: section.title, blocks: section.blocks.map(b => {
      const source = b.sourceId ? sourceMap.get(b.sourceId)! : undefined
      return { id: uid(), type: b.type, ...(b.text ? { text: { content: b.text } } : {}), ...(b.items ? { items: b.items.map(content => ({ content })) } : {}), provenance: source ? 'source' : 'clarification', ...(source ? { sourceRef: { fileId: source.fileId, chunkId: source.id, start: 0, end: source.content.length } } : {}) }
    }) })) }, createdAt: now, updatedAt: now, order: center.lectures.length,
  }
  if (p.objectives.length) {
    const id = uid(); lecture.masteryMapId = id
    center.generatedMasteryOutlines.push({ id, courseId, lectureId, scope: 'lecture', scopeId: lectureId, title: p.title, unit: p.title, specId: 'unit-mastery-outline-v1', specHash: 'external-import-v1', generationAuditStatus: 'skipped', standards: p.objectives.map(o => ({ ...o, id: uid(), sourceChunkIds: o.sourceIds.map(id => sourceMap.get(id)!.id), masteryState: 'not-started' })), sourceChunkIds: [...sourceMap.values()].map(c => c.id), createdAt: now, updatedAt: now, order: center.generatedMasteryOutlines.length })
  }
  center.lectures.push(lecture)
  return lectureId
}
