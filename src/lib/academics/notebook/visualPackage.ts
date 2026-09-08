import schema from './notebook-package-v3.schema.json'
import { NOTEBOOK_MAX_BYTES, parseLegacyNotebookPackage, rejectDuplicateKeys } from './package'
import { NotebookValidationError, validateSchema, type Schema } from './schemaValidator'
import type { PortableNotebookPackage, VisualEvidence, VisualNotebookBlock, VisualNotebookPackage } from './visualTypes'

export function visualAssetReferences(item: { assetIds?: string[]; type?: string; assetId?: string }): string[] {
  return [...new Set([...(item.assetIds ?? []), ...(item.type === 'figure' && item.assetId ? [item.assetId] : [])])]
}
export function parsePortableNotebook(raw: string): PortableNotebookPackage {
  if (new TextEncoder().encode(raw).length > NOTEBOOK_MAX_BYTES) throw new NotebookValidationError('$', 'JSON exceeds 8 MiB. Split the notebook deliberately; nothing was truncated or saved.')
  const json = /^```(?:json)?\s*\n([\s\S]*?)\n```$/i.exec(raw.trim())?.[1] ?? raw
  let value: unknown
  try { value = JSON.parse(json) } catch { throw new NotebookValidationError('$', 'Invalid JSON. Supply the complete notebook object.') }
  if (!value || typeof value !== 'object' || (value as { version?: unknown }).version !== 3) return parseLegacyNotebookPackage(raw)
  rejectDuplicateKeys(json)
  validateSchema(value, schema as unknown as Schema)
  const pkg = value as VisualNotebookPackage
  validateVisualNotebook(pkg)
  return pkg
}

/** Exact v3 relationships. A declaration of inspection is not proof of inspection. */
export function validateVisualNotebook(p: VisualNotebookPackage) {
  const fail = (path: string, message: string): never => { throw new NotebookValidationError(path, message) }
  const unique = (ids: string[], path: string) => { if (new Set(ids).size !== ids.length) fail(path, 'References or IDs must be unique.') }
  const identify = <T extends { id: string }>(items: T[], path: string) => { unique(items.map(i => i.id), path); return new Map(items.map(i => [i.id, i])) }
  const sources = identify(p.sources, '$.sources'), assets = identify(p.assets, '$.assets')
  const excerpts = new Map<string, string>(), used = new Set<string>()
  for (const s of p.sources) {
    const path = `$.sources.${s.id}`
    if (['unreadable', 'not-accessed'].includes(s.access) && (s.used || s.excerpts.length)) fail(path, 'An inaccessible source cannot be used or contain claimed excerpts.')
    if (s.access !== 'read' && !s.limitations.length) fail(path, 'Describe the source-access limitation.')
    if ((s.used || ['read', 'partial'].includes(s.access)) && !s.inspected.trim()) fail(path, 'Describe what was actually inspected.')
    if (s.used && !s.excerpts.length && !p.assets.some(a => a.sourceId === s.id)) fail(path, 'A used source needs an inspected text excerpt or selected visual evidence.')
    for (const e of s.excerpts) { if (excerpts.has(e.id)) fail(path, 'Excerpt IDs must be globally unique.'); excerpts.set(e.id, s.id) }
  }
  function evidence(item: VisualEvidence & { id: string; type?: string; assetId?: string }, mandatory = false) {
    const path = `$.evidence.${item.id}`, refs = visualAssetReferences(item)
    unique(item.sourceIds, path); unique(item.excerptIds, path); unique(item.assetIds ?? [], path)
    if (mandatory && (!item.sourceIds.length || (!item.excerptIds.length && !refs.length))) fail(path, 'Source-based content needs precise text or visual evidence; otherwise author an explicit gap.')
    for (const id of item.sourceIds) { if (!sources.get(id)?.used) fail(path, `Evidence source ${id} must exist and be marked used.`); used.add(id) }
    const owners = new Set<string>()
    for (const id of item.excerptIds) { const owner = excerpts.get(id); if (!owner) fail(path, `Excerpt ${id} does not exist.`); owners.add(owner!) }
    for (const id of refs) { const asset = assets.get(id); if (!asset) fail(path, `Asset ${id} does not exist.`); owners.add(asset!.sourceId) }
    if (owners.size !== item.sourceIds.length || [...owners].some(id => !item.sourceIds.includes(id))) fail(path, 'Every evidence source must own a listed excerpt or asset, and all evidence owners must be listed.')
  }
  function noCycles(map: Map<string, string | null>, path: string) {
    for (const start of map.keys()) {
      const seen = new Set<string>(); let id: string | null = start
      while (id !== null && map.has(id)) { if (seen.has(id)) fail(path, `Cycle involving ${start}.`); seen.add(id); id = map.get(id)! }
    }
  }
  for (const a of p.assets) {
    const path = `$.assets.${a.id}`
    if (!sources.has(a.sourceId)) fail(path, 'Asset source does not exist.')
    if (Boolean(a.originalAssetId) !== Boolean(a.alteration?.trim())) fail(path, 'A derivative needs both its retained original asset ID and a description of the alteration.')
    if (a.originalAssetId && assets.get(a.originalAssetId)?.sourceId !== a.sourceId) fail(path, 'Retain the original asset from the same source.')
    if (a.mimeType === 'image/png' ? !a.fileName.endsWith('.png') : !/\.(jpg|jpeg)$/.test(a.fileName)) fail(path, 'File extension must match the declared PNG or JPEG type.')
  }
  noCycles(new Map(p.assets.map(a => [a.id, a.originalAssetId])), '$.assets')
  const review = p.visualReview, reviewSources = new Map(review.sources.map(s => [s.sourceId, s]))
  if (reviewSources.size !== review.sources.length || reviewSources.size !== sources.size || [...sources.keys()].some(id => !reviewSources.has(id))) fail('$.visualReview.sources', 'Include exactly one visual discovery record per supplied source, including sources with no images.')
  for (const r of review.sources) {
    if (r.discovery === 'complete' && r.unprocessedPortions.length) fail('$.visualReview.sources', 'A complete discovery cannot also have unprocessed portions.')
    if (r.discovery !== 'complete' && !r.unprocessedPortions.length && !r.limitations.length) fail('$.visualReview.sources', 'Incomplete discovery needs unprocessed portions or explicit limitations.')
    if (r.imageState === 'none-found' && r.discovery !== 'complete') fail('$.visualReview.sources', 'Do not claim no images were found without complete discovery.')
  }
  const candidates = identify(review.candidates, '$.visualReview.candidates'), selected = new Set<string>()
  for (const c of review.candidates) {
    const path = `$.visualReview.candidates.${c.id}`
    if (!sources.has(c.sourceId)) fail(path, 'Candidate source does not exist.')
    if (['inspected', 'unclear'].includes(c.inspection) && !c.discovered) fail(path, 'An inspected candidate must have been discovered.')
    if (c.inspection === 'missing' && c.discovered) fail(path, 'A missing candidate cannot claim discovery.')
    if (c.decision === 'selected') {
      if (!c.discovered || c.inspection !== 'inspected' || !c.assetId || assets.get(c.assetId)?.sourceId !== c.sourceId) fail(path, 'Selection requires declared visual inspection and a retained asset from this source.')
      selected.add(c.assetId!)
    } else if (c.assetId !== null) fail(path, 'Only selected candidates may link retained assets.')
    if ((['pending', 'unavailable'].includes(c.decision) || c.inspection !== 'inspected') && !c.nextStep?.trim()) fail(path, 'An unresolved candidate needs an actionable next step.')
    if (c.duplicateOf && c.changedFrom) fail(path, 'Choose one candidate relationship, not both.')
    for (const id of [c.duplicateOf, c.changedFrom]) if (id && !candidates.has(id)) fail(path, 'Candidate relationship does not exist.')
  }
  noCycles(new Map(review.candidates.map(c => [c.id, c.duplicateOf || c.changedFrom])), '$.visualReview.candidates')
  for (const a of p.assets) if (!selected.has(a.id)) fail('$.visualReview.candidates', `Asset ${a.id} needs a selected, inspected candidate, including retained derivative originals.`)
  for (const r of review.sources) if (r.imageState === 'none-found' && review.candidates.some(c => c.sourceId === r.sourceId && c.discovered)) fail('$.visualReview.sources', 'A no-images record conflicts with discovered image candidates.')
  identify(p.entries, '$.entries')
  const sectionIds = new Set<string>(), blockIds = new Set<string>(), requirementIds = new Set<string>(), objectiveIds = new Set<string>(), referenced = new Set<string>()
  const global = (id: string, ids: Set<string>, path: string) => { if (ids.has(id)) fail(path, 'IDs must be globally unique within this kind.'); ids.add(id) }
  for (const e of p.entries) {
    const path = `$.entries.${e.id}`
    if ((e.revision === 1 && e.baseRevision !== null) || (e.revision > 1 && e.baseRevision !== e.revision - 1)) fail(path, 'Revision must name its immediately preceding base; first revision has null.')
    const blocks = new Map<string, VisualNotebookBlock>(), sections = new Set(e.sections.map(s => s.id))
    for (const s of e.sections) {
      global(s.id, sectionIds, path)
      for (const b of s.blocks) {
        global(b.id, blockIds, path); blocks.set(b.id, b)
        evidence(b, b.type !== 'gap' && ['source', 'clarification', 'generated-practice'].includes(b.provenance))
        for (const id of visualAssetReferences(b)) referenced.add(id)
        if (b.type === 'practice' && (b.provenance !== 'generated-practice' || !b.sourceIds.length || (!b.excerptIds.length && !visualAssetReferences(b).length))) fail(path, 'Practice requires generated-practice provenance and precise evidence.')
        if (b.type === 'table' && b.rows.some(r => r.length !== b.columns.length)) fail(path, 'Table rows must match the column count.')
        if (b.type === 'study-diagram') {
          const nodes = identify(b.nodes, path); identify(b.edges, path)
          for (const item of [...b.nodes, ...b.edges]) {
            evidence(item, true)
            if (item.sourceIds.some(id => !b.sourceIds.includes(id)) || item.excerptIds.some(id => !b.excerptIds.includes(id)) || visualAssetReferences(item).some(id => !visualAssetReferences(b).includes(id))) fail(path, 'Every diagram node and edge must fit its block evidence envelope.')
            for (const id of visualAssetReferences(item)) referenced.add(id)
          }
          for (const edge of b.edges) if (!nodes.has(edge.from) || !nodes.has(edge.to)) fail(path, 'Diagram edges must connect declared nodes.')
        }
      }
    }
    for (const b of blocks.values()) if (b.type === 'practice') {
      unique(b.stimulusBlockIds ?? [], path)
      for (const id of b.stimulusBlockIds ?? []) if (!['paragraph', 'table', 'figure', 'study-diagram'].includes(blocks.get(id)?.type ?? '')) fail(path, 'Practice stimuli must reference neutral paragraph, table, figure or study-diagram blocks in the same entry, never a practice block or entire section.')
    }
    for (const r of e.requirements) {
      global(r.id, requirementIds, path); evidence(r); unique(r.sectionIds, path)
      if (r.sectionIds.some(id => !sections.has(id))) fail(path, 'Requirement sections must belong to this entry.')
      if (['supported', 'partial'].includes(r.status) && (!r.sectionIds.length || (!r.excerptIds.length && !visualAssetReferences(r).length))) fail(path, 'Supported or partial requirements need evidence and a section.')
      if (r.status !== 'supported' && !r.nextStep?.trim()) fail(path, 'Unresolved requirements need an actionable next step.')
      for (const id of visualAssetReferences(r)) referenced.add(id)
    }
    for (const o of e.objectives) {
      global(o.id, objectiveIds, path); evidence(o, true); unique(o.practiceBlockIds, path)
      const requirement = e.requirements.find(r => r.id === o.requirementId)
      if (!requirement || requirement.kind !== 'objective' || !['supported', 'partial'].includes(requirement.status)) fail(path, 'Mastery objectives must reference supported or partial objective requirements.')
      if (requirement?.status === 'partial' && !o.evidenceLimit?.trim()) fail(path, 'A partially supported objective needs its evidence limitation.')
      for (const id of o.practiceBlockIds) {
        const b = blocks.get(id)
        if (!b || b.type !== 'practice') fail(path, 'Objective practice references must be practice blocks in this entry.')
        if (b!.sourceIds.some(id => !o.sourceIds.includes(id)) || b!.excerptIds.some(id => !o.excerptIds.includes(id)) || visualAssetReferences(b!).some(id => !visualAssetReferences(o).includes(id))) fail(path, 'Objective evidence must contain its practice evidence.')
      }
      for (const id of visualAssetReferences(o)) referenced.add(id)
    }
  }
  const pending = [...referenced]
  while (pending.length) { const original = assets.get(pending.pop()!)?.originalAssetId; if (original && !referenced.has(original)) { referenced.add(original); pending.push(original) } }
  for (const id of assets.keys()) if (!referenced.has(id)) fail('$.assets', `Asset ${id} is not referenced by content or required as a derivative original.`)
  for (const s of p.sources) if (s.used && !used.has(s.id)) fail('$.sources', `Source ${s.id} is marked used without any evidence reference.`)
}
