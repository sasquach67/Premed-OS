// @vitest-environment node
import { describe, expect, it } from 'vitest'
import fixture from './visual-fixtures/valid-v4-repertoire.json'
import { parsePortableNotebook } from './visualPackage'
import type { NotebookBlock, NotebookPackage } from './types'

const fresh = () => structuredClone(fixture) as NotebookPackage
function find<T extends NotebookBlock['type']>(pkg: NotebookPackage, type: T): Extract<NotebookBlock, { type: T }> {
  const block = pkg.entries.flatMap(entry => entry.sections.flatMap(section => section.blocks)).find(block => block.type === type)
  if (!block) throw new Error(`Missing fixture block: ${type}`)
  return block as Extract<NotebookBlock, { type: T }>
}
const parse = (pkg: NotebookPackage) => parsePortableNotebook(JSON.stringify(pkg))

describe('v4 frozen-contract parity regressions', () => {
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
