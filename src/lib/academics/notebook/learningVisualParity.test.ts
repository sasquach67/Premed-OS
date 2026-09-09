// @vitest-environment node
import { describe, expect, it } from 'vitest'
import fixture from './visual-fixtures/valid-v4-repertoire.json'
import { parsePortableNotebook, visualAssetReferences } from './visualPackage'
import { notebookEntryAssetIds, projectNotebookEntry } from './visualProjection'
import type { NotebookBlock, NotebookPackage } from './types'

const fresh = () => structuredClone(fixture) as NotebookPackage
function find<T extends NotebookBlock['type']>(pkg: NotebookPackage, type: T): Extract<NotebookBlock, { type: T }> {
  const block = pkg.entries.flatMap(entry => entry.sections.flatMap(section => section.blocks)).find(block => block.type === type)
  if (!block) throw new Error(`Missing fixture block: ${type}`)
  return block as Extract<NotebookBlock, { type: T }>
}
const parse = (pkg: NotebookPackage) => parsePortableNotebook(JSON.stringify(pkg))

describe('v4 frozen-contract parity regressions', () => {
  it.each(['step', 'parent', 'both', 'omitted-parent'] as const)('accepts direct sequence image references without redundant %s assetIds', mode => {
    const pkg = fresh(), strip = find(pkg, 'sequence-strip')
    if (mode !== 'step') strip.assetIds = []
    if (mode !== 'parent') for (const step of strip.steps) if (step.assetId) step.assetIds = []
    if (mode === 'omitted-parent') delete strip.assetIds
    expect(parse(pkg)).toEqual(pkg)
    expect(visualAssetReferences(strip)).toContain('source-image')
    expect([...notebookEntryAssetIds(pkg, pkg.entries[0].id)]).toContain('source-image')
    const projected = projectNotebookEntry(pkg, pkg.entries[0].id)
    expect(projected.version !== 2 && projected.assets.map(asset => asset.id)).toContain('source-image')
  })

  it('still requires the sequence step evidence arrays even when its direct image reference supplies ownership', () => {
    const pkg = fresh(), step = find(pkg, 'sequence-strip').steps.find(step => step.assetId)!
    delete step.assetIds
    expect(() => parse(pkg)).toThrow(/Required field is missing/)
  })

  it.each(['unknown-image', 'missing-step-owner', 'missing-parent-owner'] as const)('still rejects invalid direct sequence evidence: %s', mutation => {
    const pkg = fresh(), strip = find(pkg, 'sequence-strip'), step = strip.steps.find(step => step.assetId)!
    strip.assetIds = []; step.assetIds = []
    if (mutation === 'unknown-image') step.assetId = 'not-a-retained-image'
    if (mutation === 'missing-step-owner') step.sourceIds = step.sourceIds.filter(id => id !== 'image')
    if (mutation === 'missing-parent-owner') strip.sourceIds = strip.sourceIds.filter(id => id !== 'image')
    expect(() => parse(pkg)).toThrow()
  })

  it.each(['annotated-figure', 'timeline', 'continuum', 'sequence-strip', 'worked-example', 'venn'] as const)('rejects a %s item that reuses its parent block ID', type => {
    const pkg = fresh(), block = find(pkg, type)
    switch (block.type) {
      case 'annotated-figure': block.annotations[0].id = block.id; break
      case 'timeline': block.events[0].id = block.id; break
      case 'continuum': block.points[0].id = block.id; break
      case 'sequence-strip': case 'worked-example': block.steps[0].id = block.id; break
      case 'venn': block.regions[0].id = block.id; break
    }
    expect(() => parse(pkg)).toThrow(/parent block ID/)
  })

  it('accepts an enclosing worked-example parent envelope with additional valid evidence', () => {
    const pkg = fresh(), block = find(pkg, 'worked-example')
    block.excerptIds.push('ref-1')
    expect(parse(pkg)).toEqual(pkg)
  })

  it('does not reserve synthetic evidence traversal IDs as authored step IDs', () => {
    const pkg = fresh(), block = find(pkg, 'worked-example')
    block.steps[0].id = `${block.id}:problem-evidence`
    expect(parse(pkg)).toEqual(pkg)
  })

  it('accepts clearing nullable caption, time label, and worked check without empty strings', () => {
    const pkg = fresh()
    find(pkg, 'annotated-figure').caption = null
    find(pkg, 'timeline').events[0].timeLabel = null
    find(pkg, 'worked-example').check = null
    expect(parse(pkg)).toEqual(pkg)
  })
})
