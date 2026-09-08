import type { NotebookBlock, NotebookPackage } from './types'

export type NotebookReadingMode = 'all' | 'study' | 'practice' | 'coverage' | 'sources'
export type ReaderAnnotation = { text: string; kind: 'citation' | 'limit'; displayText?: string }
const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const referenceLabel = /^(?:sources?(?: synthesis)?(?: and clarification)?|student-source explanation(?: and clarification)?|student work(?: and (?:correction|evidence limit))?|student response and evidence tension|instructor (?:emphasis|explanation)|clarification(?: and source paraphrase)?|source illustration|evidence limit)(?:\s*:\s*|\s+(?:of|from|integrating)\s+)/i
const qualifiedLabel = /^\[(?:evidence limit|student work and evidence limit|student response and evidence tension|student work and correction)\s*:/i
const consequential = /\b(?:unavailable|hypothetical|generated|illustrative|uncertain|uncertainty|unsupported|conflict|conflicts|limitation|limitations)\b|not inspection of|not a copied|not empirical|not (?:actual )?observations|not a prediction/i

/** Only recognized reference syntax may be folded. Free prose is not a locator. */
export function legacyRoutineNotebookCitation(span: string, sourceIds: string[]) {
  if (!span.startsWith('[') || !span.endsWith(']') || !sourceIds.length) return false
  let value = span.slice(1, -1).trim()
  let referenced = false
  for (const id of [...sourceIds].sort((a, b) => b.length - a.length)) {
    if (!id) continue
    value = value.replace(new RegExp(`(?<![\\w-])${escapePattern(id)}(?![\\w-])`, 'g'), () => { referenced = true; return ' REF ' })
  }
  value = value.replace(referenceLabel, '')
  if (!referenced) return /^(?:same sources|(?:that|the) setup|those (?:premises|responses)|(?:its |the )?table|sections?\s+\d+(?:\s*[-\u2013\u2014]\s*\d+)?\s+evidence)\.?$/i.test(value)
  // A positive, domain-neutral vocabulary for numbered source locations. Even
  // benign free-form descriptors stay visible rather than being guessed safe.
  value = value.replace(/\bREF\b/g, '')
    // These are bounded locator descriptions found in the supplied notebook,
    // not a general permission to discard prose after a source ID.
    .replace(/\b(?:scientific-process introduction|voting discussion|theme questions|final control discussion|mRNA discussion|theme review|student preference revision|food-inspection exercise|sugar-test example|plastic example|grape example|tumor graph|statistical-analysis prompt|statistical prompt|marked answers|source illustration)\b/gi, '')
    .replace(/\b(?:pages?|pp?|slides?|figures?|figs?|tables?|graphs?|sections?|chapters?|paragraphs?|activities|activity|exercises?|questions?|guided reading questions?|grqs?|appendix|excerpts?|lines?|clarification|sources?|explanations?|background|example|criteria|embedded|data|and|of|from|in|on|its|the)\b/gi, '')
    .replace(/\b\d+[a-z]?\b/gi, '')
    .replace(/[\s.,;:/()\-\u2013\u2014]+/g, '')
  return value.length === 0
}

export function splitNotebookAnnotations(value: string, sourceIds: string[]) {
  let body = value
  const leading: ReaderAnnotation[] = [], trailing: ReaderAnnotation[] = []
  const classify = (span: string): ReaderAnnotation | null => {
    if (legacyRoutineNotebookCitation(span, sourceIds)) {
      if (!qualifiedLabel.test(span)) return { text: span, kind: 'citation' }
      const displayText = /^\[student response/i.test(span) ? 'The student response and source evidence differ.' : /^\[student work and correction/i.test(span) ? 'This explanation corrects the student work.' : /^\[student work/i.test(span) ? 'The student work has an evidence limitation.' : 'The available source evidence is limited for this point.'
      return { text: span, kind: 'limit', displayText }
    }
    const inner = span.slice(1, -1)
    // Separate a qualification only after a fully recognized reference clause.
    // Longest valid prefix wins, so no locator or qualification is lost.
    const boundaries = [...inner.matchAll(/;\s*|\.\s+/g)].reverse()
    for (const boundary of boundaries) {
      const reference = inner.slice(0, boundary.index), qualification = inner.slice(boundary.index! + boundary[0].length).trim()
      if (consequential.test(qualification) && legacyRoutineNotebookCitation(`[${reference}]`, sourceIds)) return { text: span, kind: 'limit', displayText: qualification[0].toUpperCase() + qualification.slice(1) }
    }
    return null
  }
  for (;;) {
    const lead = /^\s*(\[[^[\]]{1,1000}\])\s*/.exec(body), note = lead && classify(lead[1])
    if (!lead || !note) break
    leading.push(note); body = body.slice(lead[0].length)
  }
  for (;;) {
    const tail = /\s*(\[[^[\]]{1,1000}\])\s*$/.exec(body), note = tail && classify(tail[1])
    if (!tail || !note) break
    trailing.unshift(note); body = body.slice(0, -tail[0].length)
  }
  return { body, leading, trailing }
}

/** Reference notes follow the same answer boundary as the actual evidence. */
export function collectReaderAnnotations(blocks: NotebookBlock[], pkg: NotebookPackage, scope: 'section' | 'item') {
  return blocks.filter(block => scope === 'item' || block.type !== 'practice').flatMap(block => {
    const sourceIds = block.sourceIds.filter(id => pkg.sources.some(source => source.id === id))
    const fields = block.type === 'paragraph' ? [block.text] : block.type === 'practice' ? [block.answer, block.rationale] : []
    return fields.flatMap(value => { const parts = splitNotebookAnnotations(value, pkg.sources.map(source => source.id)); return [...parts.leading, ...parts.trailing].map(note => ({ ...note, blockId: block.id, sourceIds, unlinkedSourceIds: pkg.sources.filter(source => !sourceIds.includes(source.id) && new RegExp(`(?<![\\w-])${escapePattern(source.id)}(?![\\w-])`).test(note.text)).map(source => source.id) })) })
  })
}

export function readerBlocks(blocks: NotebookBlock[], mode: NotebookReadingMode, purpose?: NotebookPackage['entries'][number]['sections'][number]['purpose']) {
  // Dedicated question setups belong with their questions, not as orphaned
  // figures/instructions in Study. Mixed teaching sections still filter by type.
  if (mode === 'study' && purpose === 'practice') return []
  return blocks.filter(block => mode === 'all' || (mode === 'study' ? block.type !== 'practice' : mode === 'practice' && block.type === 'practice'))
}

/** The section boundary must never collect a practice answer's evidence. */
export function collectReaderEvidence(blocks: NotebookBlock[], pkg: NotebookPackage, scope: 'section' | 'item') {
  const included = blocks.filter(block => scope === 'item' || block.type !== 'practice')
  return pkg.sources.filter(source => included.some(block => block.sourceIds.includes(source.id))).map(source => ({
    source,
    excerpts: source.excerpts.flatMap(excerpt => {
      const blockIds = included.filter(block => block.sourceIds.includes(source.id) && block.excerptIds.includes(excerpt.id)).map(block => block.id)
      return blockIds.length ? [{ ...excerpt, blockIds }] : []
    }),
  }))
}

export function readerHeadingId(prefix: string, entryId: string, kind: string, id = '') {
  return `${prefix}-${encodeURIComponent(entryId)}-${kind}-${encodeURIComponent(id)}`
}

export function notebookReaderContents(pkg: NotebookPackage, entryId: string | undefined, mode: NotebookReadingMode, prefix: string) {
  const items: { id: string; title: string; targetId: string }[] = []
  const add = (entry: string, kind: string, title: string, id = '') => {
    const targetId = readerHeadingId(prefix, entry, kind, id)
    items.push({ id: targetId, targetId, title })
  }
  for (const entry of pkg.entries.filter(entry => !entryId || entry.id === entryId)) {
    if ((mode === 'practice' || mode === 'all') && entry.objectives.length) add(entry.id, 'objectives', 'Mastery objectives')
    for (const section of entry.sections) if (readerBlocks(section.blocks, mode, section.purpose).length) add(entry.id, 'section', section.title, section.id)
    if ((mode === 'coverage' || mode === 'all' || mode === 'study') && entry.limitations.length) add(entry.id, 'limits', 'Limits of this entry')
    if (mode === 'coverage' || mode === 'all' || mode === 'study') add(entry.id, 'coverage', "What's covered and missing")
  }
  if (mode === 'sources' || mode === 'all') for (const source of pkg.sources) add('sources', 'source', source.title, source.id)
  return items
}

export function isRoutineNotebookCitation(...args:Parameters<typeof legacyRoutineNotebookCitation>):boolean { return !qualifiedLabel.test(args[0]) && legacyRoutineNotebookCitation(...args) }
