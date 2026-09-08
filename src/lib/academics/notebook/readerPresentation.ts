import type { NotebookBlock, NotebookPackage } from './types'

export type NotebookReadingMode = 'all' | 'study' | 'practice' | 'coverage' | 'sources'
export type ReaderAnnotation = { text: string; kind: 'citation' | 'limit' }
const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Only recognized reference syntax may be folded. Free prose is not a locator. */
export function isRoutineNotebookCitation(span: string, sourceIds: string[]) {
  let value = span.slice(1, -1).trim()
  let referenced = false
  for (const id of [...sourceIds].sort((a, b) => b.length - a.length)) {
    if (!id) continue
    value = value.replace(new RegExp(`(?<![\\w-])${escapePattern(id)}(?![\\w-])`, 'g'), () => { referenced = true; return ' REF ' })
  }
  value = value.replace(/^(?:sources?(?: synthesis)?(?: and clarification)?|clarification(?: and source paraphrase)?)(?:\s*:\s*|\s+(?:of|from|integrating)\s+)/i, '')
  if (!referenced) return /^(?:same sources|(?:that|the) setup|those premises|(?:its |the )?table)\.?$/i.test(value)
  // A positive, domain-neutral vocabulary for numbered source locations. Even
  // benign free-form descriptors stay visible rather than being guessed safe.
  value = value.replace(/\bREF\b/g, '')
    .replace(/\b(?:pages?|pp?|slides?|figures?|figs?|tables?|sections?|chapters?|paragraphs?|activities|activity|exercises?|questions?|guided reading questions?|grqs?|appendix|excerpts?|lines?|clarification|sources?|and|of|from|in|on|its|the)\b/gi, '')
    .replace(/\b\d+[a-z]?\b/gi, '')
    .replace(/[\s.,;:/()\-\u2013\u2014]+/g, '')
  return value.length === 0
}

export function splitNotebookAnnotations(value: string, sourceIds: string[]) {
  let body = value
  const leading: ReaderAnnotation[] = [], trailing: ReaderAnnotation[] = []
  const classify = (span: string): ReaderAnnotation['kind'] | null => {
    if (/evidence limit|evidence tension|\blimit:|unavailable|not inspection of|not a copied|hypothetical|is generated|correction|not a prediction|\btension\b/i.test(span)) return 'limit'
    return isRoutineNotebookCitation(span, sourceIds) ? 'citation' : null
  }
  const lead = /^\s*(\[[^\[\]]{1,400}\])\s*/.exec(body)
  if (lead) {
    const kind = classify(lead[1])
    if (kind) { leading.push({ text: lead[1], kind }); body = body.slice(lead[0].length) }
  }
  const tail = /\s*(\[[^\[\]]{1,400}\])\s*$/.exec(body)
  if (tail) {
    const kind = classify(tail[1])
    if (kind) { trailing.push({ text: tail[1], kind }); body = body.slice(0, -tail[0].length) }
  }
  return { body, leading, trailing }
}

export function readerBlocks(blocks: NotebookBlock[], mode: NotebookReadingMode) {
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
    if (mode === 'coverage' || mode === 'all') add(entry.id, 'coverage', 'Requirement coverage')
    for (const section of entry.sections) if (readerBlocks(section.blocks, mode).length) add(entry.id, 'section', section.title, section.id)
    if ((mode === 'coverage' || mode === 'all') && entry.limitations.length) add(entry.id, 'limits', 'Limits of this entry')
  }
  if (mode === 'sources' || mode === 'all') for (const source of pkg.sources) add('sources', 'source', source.title, source.id)
  return items
}
