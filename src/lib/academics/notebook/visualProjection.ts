import { canonical } from './package'
import { parsePortableNotebook, visualAssetReferences } from './visualPackage'
import type { NotebookAssetBinding, PortableNotebookPackage, VisualNotebookBlock } from './visualTypes'

export function notebookEntryAssetIds(pkg: PortableNotebookPackage, entryId: string): Set<string> {
  const ids = new Set<string>(), entry = pkg.entries.find(e => e.id === entryId)
  if (!entry) throw new Error('The selected notebook entry does not exist.')
  const sections = entry.sections as { blocks: VisualNotebookBlock[] }[]
  for (const item of [...sections.flatMap(s => s.blocks), ...entry.requirements, ...entry.objectives] as (VisualNotebookBlock | { assetIds?: string[] })[]) {
    for (const id of visualAssetReferences(item)) ids.add(id)
    if ('type' in item && item.type === 'study-diagram') for (const node of [...item.nodes, ...item.edges]) for (const id of visualAssetReferences(node)) ids.add(id)
  }
  if (pkg.version === 3) {
    const assets = new Map(pkg.assets.map(a => [a.id, a])), pending = [...ids]
    while (pending.length) { const parent = assets.get(pending.pop()!)?.originalAssetId; if (parent && !ids.has(parent)) { ids.add(parent); pending.push(parent) } }
  }
  return ids
}
/** App-owned export projection; the original package/raw bytes are never rewritten. */
export function projectNotebookEntry(pkg: PortableNotebookPackage, entryId: string): PortableNotebookPackage {
  const projected = JSON.parse(JSON.stringify(pkg)) as PortableNotebookPackage
  projected.entries = projected.entries.filter(e => e.id === entryId)
  if (projected.entries.length !== 1) throw new Error('Select an existing notebook entry for export.')
  if (projected.version === 3) {
    const retained = notebookEntryAssetIds(projected, entryId)
    projected.assets = projected.assets.filter(a => retained.has(a.id))
    projected.visualReview.candidates = projected.visualReview.candidates.map(c => c.decision === 'selected' && c.assetId && !retained.has(c.assetId) ? {
      ...c, decision: 'skipped', assetId: null,
      reason: `Excluded from this single-entry export; original package selected asset ${c.assetId} for another entry. Original reason: ${c.reason}`,
    } : c)
    const used = new Set(projected.entries.flatMap(e => [...e.sections.flatMap(s => s.blocks), ...e.requirements, ...e.objectives].flatMap(item => item.sourceIds)))
    projected.sources = projected.sources.map(s => ({ ...s, used: used.has(s.id) }))
  }
  return parsePortableNotebook(JSON.stringify(projected))
}
/** Visual additions to the existing teaching/evidence dependency policy. */
export function notebookVisualPracticeKey(pkg: PortableNotebookPackage, entryId: string, practiceId: string, bindings: readonly NotebookAssetBinding[] = []): string {
  const sections = pkg.entries.find(e => e.id === entryId)?.sections as { blocks: VisualNotebookBlock[] }[] | undefined
  const blocks = sections?.flatMap(s => s.blocks)
  const question = blocks?.find(b => b.id === practiceId)
  if (!question || question.type !== 'practice') return canonical({ missingPractice: practiceId })
  const stimuli = (question.stimulusBlockIds ?? []).map(id => blocks?.find(b => b.id === id) ?? { missingStimulus: id })
  const ids = new Set(visualAssetReferences(question))
  for (const stimulus of stimuli) if ('type' in stimulus) {
    for (const id of visualAssetReferences(stimulus)) ids.add(id)
    if (stimulus.type === 'study-diagram') for (const item of [...stimulus.nodes, ...stimulus.edges]) for (const id of visualAssetReferences(item)) ids.add(id)
  }
  const assets = pkg.version === 3 ? pkg.assets : [], pending = [...ids]
  while (pending.length) { const id = pending.pop()!, parent = assets.find(a => a.id === id)?.originalAssetId; if (parent && !ids.has(parent)) { ids.add(parent); pending.push(parent) } }
  return canonical({ stimulusBlockIds: question.stimulusBlockIds ?? [], stimuli, assets: [...ids].sort().map(id => ({ id, asset: assets.find(a => a.id === id) ?? null, binding: bindings.find(b => b.assetId === id) ?? null })) })
}
export function missingPracticeImages(pkg: PortableNotebookPackage, entryId: string, practiceId: string, availableAssetIds: ReadonlySet<string>): string[] {
  const key = JSON.parse(notebookVisualPracticeKey(pkg, entryId, practiceId)) as { assets?: { id: string }[] }
  return (key.assets ?? []).map(a => a.id).filter(id => !availableAssetIds.has(id))
}
