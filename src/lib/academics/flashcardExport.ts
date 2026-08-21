import type { GeneratedFlashcardDeck } from '@/lib/types'

function cell(value: string | undefined) { return `"${(value ?? '').replaceAll('"', '""')}"` }

/** One-way, local TSV export. It deliberately never contacts Anki. */
export function flashcardTsv(deck: GeneratedFlashcardDeck): string {
  const header = ['front', 'back_or_cloze', 'extra', 'tags', 'card_type', 'concept_id', 'source_reference', 'spec_id', 'spec_hash']
  const rows = deck.cards.map((card) => [card.front, card.back ?? card.cloze, card.extra, card.tags.join(' '), card.type, card.conceptId, card.sourceChunkId, deck.specId, deck.specHash].map(cell).join('\t'))
  return [header.join('\t'), ...rows].join('\n')
}

export function downloadFlashcardTsv(deck: GeneratedFlashcardDeck) {
  const url = URL.createObjectURL(new Blob([flashcardTsv(deck)], { type: 'text/tab-separated-values;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${deck.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'flashcards'}.tsv`
  link.click()
  URL.revokeObjectURL(url)
}
