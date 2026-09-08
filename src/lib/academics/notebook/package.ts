import { parsePortableNotebook } from './visualPackage'
import schema from './notebook-package.schema.json'
import { NotebookValidationError, validateSchema, type Schema } from './schemaValidator'
import type { Evidence, NotebookPackage, NotebookSource } from './types'
export const NOTEBOOK_MAX_BYTES = 8 * 1024 * 1024
export { NotebookValidationError }
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value !== null && typeof value === 'object') return `{${Object.keys(value).filter(key => (value as Record<string, unknown>)[key] !== undefined).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(',')}}`
  return JSON.stringify(value)
}
/** Reject duplicate object keys before JSON.parse can silently drop their first values. */
export function rejectDuplicateKeys(raw: string) {
  const tokens = raw.match(/"(?:\\.|[^"\\])*"|[{}[\],:]|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g) ?? []
  let index = 0
  function visit(path: string, depth: number) {
    if (depth > 60) throw new NotebookValidationError(path, 'The package is nested too deeply.')
    const token = tokens[index++]
    if (token === '{') {
      const keys = new Set<string>()
      while (tokens[index] !== '}') {
        const key = JSON.parse(tokens[index++]) as string; index++
        if (keys.has(key)) throw new NotebookValidationError(`${path}.${key}`, 'Duplicate field; combine its content explicitly before importing.')
        keys.add(key); visit(`${path}.${key}`, depth + 1)
        if (tokens[index] !== ',') break
        index++
      }
      index++
    } else if (token === '[') {
      let child = 0
      while (tokens[index] !== ']') { visit(`${path}[${child++}]`, depth + 1); if (tokens[index] !== ',') break; index++ }
      index++
    }
  }
  visit('$', 0)
}
export function parseLegacyNotebookPackage(raw: string): NotebookPackage {
  if (new TextEncoder().encode(raw).length > NOTEBOOK_MAX_BYTES) throw new NotebookValidationError('$', 'Choose a package under 8 MB. Nothing was truncated or saved.')
  const trimmed = raw.trim()
  const json = /^```(?:json)?\s*\n([\s\S]*?)\n```$/i.exec(trimmed)?.[1] ?? raw
  let value: unknown
  try { value = JSON.parse(json) } catch (error) { throw new NotebookValidationError('$', `Invalid JSON. Return the complete JSON object without surrounding commentary. ${error instanceof Error ? error.message : ''}`) }
  rejectDuplicateKeys(json)
  validateSchema(value, schema as unknown as Schema)
  const p = value as NotebookPackage
  validateNotebookSemantics(p)
  return p // Preserve every character in every supplied content string.
}
export function validateNotebookSemantics(p: NotebookPackage) {
  const fail = (path: string, message: string): never => { throw new NotebookValidationError(path, message) }
  function unique(items: { id: string }[], path: string, globalIds?: Set<string>) { const ids = new Set<string>(); items.forEach((item, i) => { if (ids.has(item.id) || globalIds?.has(item.id)) fail(`${path}[${i}].id`, 'IDs must be unique within this kind across the package.'); ids.add(item.id); globalIds?.add(item.id) }); return ids }
  const sourceIds = unique(p.sources, '$.sources')
  const sources = new Map(p.sources.map(s => [s.id, s]))
  const excerpts = new Map<string, NotebookSource>()
  p.sources.forEach((source, i) => {
    const path = `$.sources[${i}]`
    if (['unreadable', 'not-accessed'].includes(source.access) && (source.used || source.excerpts.length)) fail(path, 'An unreadable or unaccessed source cannot be used or contain claimed excerpts.')
    if (source.access !== 'read' && !source.limitations.length) fail(`${path}.limitations`, 'Describe the source-access limitation.')
    if (source.used && !source.excerpts.length) fail(`${path}.excerpts`, 'A used source needs an inspected excerpt.')
    if (['read', 'partial'].includes(source.access) && !source.inspected.trim()) fail(`${path}.inspected`, 'Describe what was actually inspected.')
    source.excerpts.forEach((excerpt, j) => { if (excerpts.has(excerpt.id)) fail(`${path}.excerpts[${j}].id`, 'Excerpt IDs must be unique across all sources.'); excerpts.set(excerpt.id, source) })
  })
  function evidence(item: Evidence, path: string, requireUsed = false) {
    for (const key of ['sourceIds', 'excerptIds'] as const) if (new Set(item[key]).size !== item[key].length) fail(`${path}.${key}`, 'References must be unique.')
    item.sourceIds.forEach((id, i) => { if (!sourceIds.has(id)) fail(`${path}.sourceIds[${i}]`, 'Source reference does not exist.'); if (!sources.get(id)!.used) fail(`${path}.sourceIds[${i}]`, 'Content evidence must reference a source marked used.') })
    item.excerptIds.forEach((id, i) => { const source = excerpts.get(id); if (!source) fail(`${path}.excerptIds[${i}]`, 'Excerpt reference does not exist.'); if (!item.sourceIds.includes(source!.id)) fail(`${path}.excerptIds[${i}]`, 'Excerpt must belong to a listed source.') })
    item.sourceIds.forEach((id, i) => { if (!item.excerptIds.some(excerpt => excerpts.get(excerpt)?.id === id)) fail(`${path}.sourceIds[${i}]`, 'Link a precise excerpt for this evidence source.') })
    if (requireUsed && !item.excerptIds.length) fail(`${path}.excerptIds`, 'Source-based content needs precise inspected evidence, or an explicit gap in place of unsupported content.')
  }
  unique(p.entries, '$.entries')
  const globalSections = new Set<string>(), globalBlocks = new Set<string>(), globalRequirements = new Set<string>(), globalObjectives = new Set<string>()
  p.entries.forEach((entry, ei) => {
    const path = `$.entries[${ei}]`
    if ((entry.revision === 1 && entry.baseRevision !== null) || (entry.revision > 1 && entry.baseRevision !== entry.revision - 1)) fail(`${path}.baseRevision`, 'First revision needs null; later revisions must name the immediately preceding base revision.')
    const sections = unique(entry.sections, `${path}.sections`, globalSections)
    const blocks = new Map<string, string>()
    entry.sections.forEach((section, si) => section.blocks.forEach((block, bi) => {
      const bp = `${path}.sections[${si}].blocks[${bi}]`
      if (blocks.has(block.id) || globalBlocks.has(block.id)) fail(`${bp}.id`, 'Block IDs must be unique across the package.')
      globalBlocks.add(block.id)
      blocks.set(block.id, block.type)
      evidence(block, bp, block.type !== 'gap' && (block.provenance === 'source' || block.provenance === 'clarification' || block.provenance === 'generated-practice'))
      if (block.type !== 'gap' && ['source', 'clarification', 'generated-practice'].includes(block.provenance) && !block.excerptIds.length) fail(`${bp}.excerptIds`, 'Source-based content needs a precise inspected excerpt. Supply the missing evidence or replace the unsupported claim with an explicit gap.')
      if (block.type === 'practice' && (block.provenance !== 'generated-practice' || !block.sourceIds.length || !block.excerptIds.length)) fail(bp, 'Practice needs generated-practice provenance and precise source evidence.')
      if (block.type === 'table') block.rows.forEach((row, ri) => { if (row.length !== block.columns.length) fail(`${bp}.rows[${ri}]`, 'Each table row must match the column count.') })
    }))
    unique(entry.requirements, `${path}.requirements`, globalRequirements)
    entry.requirements.forEach((requirement, ri) => {
      const rp = `${path}.requirements[${ri}]`; evidence(requirement, rp)
      if (new Set(requirement.sectionIds).size !== requirement.sectionIds.length) fail(`${rp}.sectionIds`, 'References must be unique.')
      requirement.sectionIds.forEach((id, i) => { if (!sections.has(id)) fail(`${rp}.sectionIds[${i}]`, 'Section must belong to this entry.') })
      if (['supported', 'partial'].includes(requirement.status) && (!requirement.excerptIds.length || !requirement.sectionIds.length)) fail(rp, 'Supported or partial coverage needs precise evidence and a section in this entry.')
      if (requirement.status !== 'supported' && !requirement.nextStep?.trim()) fail(`${rp}.nextStep`, 'Explain the next step or why this requirement is out of scope.')
    })
    unique(entry.objectives, `${path}.objectives`, globalObjectives)
    entry.objectives.forEach((objective, oi) => {
      const op = `${path}.objectives[${oi}]`; evidence(objective, op, true)
      if (new Set(objective.practiceBlockIds).size !== objective.practiceBlockIds.length) fail(`${op}.practiceBlockIds`, 'References must be unique.')
      const requirement = entry.requirements.find(r => r.id === objective.requirementId)
      if (!requirement || requirement.kind !== 'objective' || !['supported', 'partial'].includes(requirement.status)) fail(`${op}.requirementId`, 'A mastery objective must link to a supported or partial objective requirement in this entry.')
      if (requirement?.status === 'partial' && !objective.evidenceLimit?.trim()) fail(`${op}.evidenceLimit`, 'Describe the evidence limit for this partially supported objective.')
      if (!objective.excerptIds.length) fail(`${op}.excerptIds`, 'A mastery objective needs precise source evidence.')
      objective.practiceBlockIds.forEach((id, i) => { if (blocks.get(id) !== 'practice') fail(`${op}.practiceBlockIds[${i}]`, 'Reference a practice block in this entry.') })
      objective.practiceBlockIds.forEach((id, i) => { const practice = entry.sections.flatMap(s => s.blocks).find(b => b.id === id)!; if (practice.sourceIds.some(id => !objective.sourceIds.includes(id)) || practice.excerptIds.some(id => !objective.excerptIds.includes(id))) fail(`${op}.practiceBlockIds[${i}]`, 'Practice evidence must be included in its objective evidence.') })
    })
  })
}
export type PreparedNotebook = { package: NotebookPackage; raw: string; fingerprints: string[] }
export async function prepareNotebook(raw: string): Promise<PreparedNotebook> {
  const p = parseNotebookPackage(raw)
  const fingerprints: string[] = []
  for (const entry of p.entries) {
    const bytes = new TextEncoder().encode(canonical({ ...p, entries: [entry] }))
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    fingerprints.push([...new Uint8Array(digest)].map(v => v.toString(16).padStart(2, '0')).join(''))
  }
  return { package: p, raw, fingerprints }
}

export function parseNotebookPackage(raw: string): NotebookPackage { return parsePortableNotebook(raw) }
