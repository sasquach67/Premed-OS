import { strToU8, zipSync } from 'fflate'
import initSqlJs from 'sql.js'
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import type { GeneratedFlashcard, GeneratedFlashcardDeck } from '@/lib/types'

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

const ANKI_COLLECTION_SCHEMA = `
CREATE TABLE col (
  id integer primary key, crt integer not null, mod integer not null, scm integer not null,
  ver integer not null, dty integer not null, usn integer not null, ls integer not null,
  conf text not null, models text not null, decks text not null, dconf text not null, tags text not null
);
CREATE TABLE notes (
  id integer primary key, guid text not null, mid integer not null, mod integer not null,
  usn integer not null, tags text not null, flds text not null, sfld integer not null,
  csum integer not null, flags integer not null, data text not null
);
CREATE TABLE cards (
  id integer primary key, nid integer not null, did integer not null, ord integer not null,
  mod integer not null, usn integer not null, type integer not null, queue integer not null,
  due integer not null, ivl integer not null, factor integer not null, reps integer not null,
  lapses integer not null, left integer not null, odue integer not null, odid integer not null,
  flags integer not null, data text not null
);
CREATE TABLE revlog (id integer primary key, cid integer not null, usn integer not null, ease integer not null, ivl integer not null, lastIvl integer not null, factor integer not null, time integer not null, type integer not null);
CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null);
CREATE INDEX ix_notes_usn on notes (usn);
CREATE INDEX ix_cards_usn on cards (usn);
CREATE INDEX ix_cards_nid on cards (nid);
CREATE INDEX ix_cards_sched on cards (did, queue, due);
CREATE INDEX ix_revlog_cid on revlog (cid);
CREATE INDEX ix_graves_usn on graves (usn);
`

const BASIC_MODEL_ID = 1_700_000_000_001
const CLOZE_MODEL_ID = 1_700_000_000_002
const DEFAULT_DECK_ID = 1
const FIELD_SEPARATOR = '\u001f'

function ankiText(value: string | undefined) {
  return (value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('\n', '<br>')
}

function stableNumber(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function cardGuid(card: GeneratedFlashcard, index: number) {
  return stableNumber(`${card.id}:${card.sourceChunkId}:${index}`).toString(36).padStart(10, '0').slice(-10)
}

const ANKI_CARD_CSS = `.card {
  font-family: "Charter", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
  font-size: 22px; line-height: 1.52; text-align: left; color: #26211b; padding: 30px 22px;
}
.pm { max-width: 620px; margin: 0 auto; --ac: #2563b0; }
.m-say { --ac: #2563b0; } .m-explain { --ac: #157a6e; } .m-connect { --ac: #7952b3; }
.m-use { --ac: #3e7d4f; } .m-blurt { --ac: #b3641f; }
.type { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: 12px; letter-spacing: .08em; margin-bottom: 18px; color: var(--ac); font-weight: 700; }
.type::before { content: "■ "; font-size: 9px; vertical-align: 2px; }
hr#answer { border: none; border-top: 1px solid #e3d9c6; margin: 22px 0; }
.answer { font-weight: 700; }
.extra { margin-top: 24px; padding-left: 15px; border-left: 3px solid #e3d9c6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #6f675a; }
.extra-label { display: block; font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: #a89d89; margin-bottom: 6px; }
.nightMode .card, .night_mode .card { color: #eae4d8; }
.nightMode .m-say, .night_mode .m-say { --ac: #6aa9ff; } .nightMode .m-explain, .night_mode .m-explain { --ac: #3fc1ae; }
.nightMode .m-connect, .night_mode .m-connect { --ac: #b79df5; } .nightMode .m-use, .night_mode .m-use { --ac: #6fbf85; }
.nightMode .m-blurt, .night_mode .m-blurt { --ac: #e8a15c; }
.nightMode hr#answer, .night_mode hr#answer { border-top-color: #3a342b; }
.nightMode .extra, .night_mode .extra { border-left-color: #3a342b; color: #a39a89; }
.nightMode .extra-label, .night_mode .extra-label { color: #7d7362; }`

function ankiModel(id: number, name: string, type: 0 | 1, fields: string[], templates: Array<{ name: string; qfmt: string; afmt: string }>, nowSeconds: number) {
  return {
    id,
    name,
    type,
    mod: nowSeconds,
    usn: -1,
    sortf: 0,
    did: DEFAULT_DECK_ID,
    tmpls: templates.map((template, ord) => ({ ...template, ord, bqfmt: '', bafmt: '', did: null })),
    flds: fields.map((name, ord) => ({ name, ord, sticky: false, rtl: false, font: 'Arial', size: 20, media: [], description: '' })),
    css: ANKI_CARD_CSS,
    latexPre: '',
    latexPost: '',
    latexsvg: false,
    req: [[0, 'any', [0]]],
    tags: [],
    vers: [],
  }
}

function typeLabel(type: GeneratedFlashcard['type']) {
  return type.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function mindsetFor(type: GeneratedFlashcard['type']) {
  if (type === 'comparison') return 'connect'
  if (type === 'application') return 'use'
  if (type === 'free-recall') return 'blurt'
  if (type === 'conceptual' || type === 'exemplar') return 'explain'
  return 'say'
}

/**
 * Creates a standalone Anki 2 collection package entirely in the browser.
 * The package intentionally contains cards only: Anki owns all review and
 * scheduling after this one-way export.
 */
export async function flashcardApkg(deck: GeneratedFlashcardDeck): Promise<Uint8Array> {
  const SQL = await initSqlJs({ locateFile: () => sqlWasmUrl })
  const db = new SQL.Database()
  const nowMs = Math.max(Date.now(), deck.createdAt)
  const nowSeconds = Math.floor(nowMs / 1000)
  const commonFields = ['Type', 'Mindset', 'premedos_concept_id', 'premedos_source', 'premedos_spec']
  const basic = ankiModel(BASIC_MODEL_ID, 'premedOS Basic', 0, ['Front', 'Back', 'Extra', ...commonFields], [{ name: 'Card 1', qfmt: '<div class="pm m-{{Mindset}}"><div class="type">{{Type}}</div>{{Front}}</div>', afmt: '<div class="pm m-{{Mindset}}"><div class="type">{{Type}}</div>{{Front}}<hr id="answer"><div class="answer">{{Back}}</div>{{#Extra}}<div class="extra"><span class="extra-label">Extra</span>{{Extra}}</div>{{/Extra}}</div>' }], nowSeconds)
  const cloze = ankiModel(CLOZE_MODEL_ID, 'premedOS Cloze', 1, ['Text', 'Extra', ...commonFields], [{ name: 'Cloze', qfmt: '<div class="pm m-{{Mindset}}"><div class="type">{{Type}}</div>{{cloze:Text}}</div>', afmt: '<div class="pm m-{{Mindset}}"><div class="type">{{Type}}</div>{{cloze:Text}}{{#Extra}}<div class="extra"><span class="extra-label">Extra</span>{{Extra}}</div>{{/Extra}}</div>' }], nowSeconds)
  const deckRecord = { id: DEFAULT_DECK_ID, name: deck.title, mod: nowSeconds, usn: -1, desc: 'Exported from Premed OS. Anki owns review and scheduling.', dyn: 0, collapsed: false, browserCollapsed: false, newToday: [0, 0], revToday: [0, 0], lrnToday: [0, 0], timeToday: [0, 0], conf: 1, extendNew: 0, extendRev: 0 }
  const deckConfig = { id: 1, name: 'Default', mod: nowSeconds, usn: 0, maxTaken: 60, autoplay: true, timer: 0, replayq: true, new: { delays: [1, 10], ints: [1, 4], initialFactor: 2500, perDay: 20 }, lapse: { delays: [10], leechFails: 8, leechAction: 0, minInt: 1, mult: 0 }, rev: { perDay: 200, ease4: 1.3, fuzz: 0.05, ivlFct: 1, maxIvl: 36500, hardFactor: 1.2 }, dyn: false, newToday: [0, 0], revToday: [0, 0], lrnToday: [0, 0], timeToday: [0, 0] }

  db.run(ANKI_COLLECTION_SCHEMA)
  db.run(
    'INSERT INTO col VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [1, nowSeconds, nowSeconds, nowMs, 11, 0, -1, 0, JSON.stringify({ nextPos: deck.cards.length + 1, estTimes: true, activeDecks: [DEFAULT_DECK_ID], curDeck: DEFAULT_DECK_ID, curModel: BASIC_MODEL_ID, newSpread: 0, collapseTime: 1200 }), JSON.stringify({ [BASIC_MODEL_ID]: basic, [CLOZE_MODEL_ID]: cloze }), JSON.stringify({ [DEFAULT_DECK_ID]: deckRecord }), JSON.stringify({ 1: deckConfig }), '{}'],
  )

  deck.cards.forEach((card, index) => {
    const noteId = nowMs + index * 2
    const cardId = noteId + 1
    const isCloze = Boolean(card.cloze)
    const details = [ankiText(typeLabel(card.type)), mindsetFor(card.type), ankiText(card.conceptId), ankiText(`Material chunk ${card.sourceChunkId}`), ankiText(`${deck.specId}@${deck.specHash}`)]
    const fields = isCloze
      ? [ankiText(card.cloze), ankiText(card.extra), ...details].join(FIELD_SEPARATOR)
      : [ankiText(card.front), ankiText(card.back), ankiText(card.extra), ...details].join(FIELD_SEPARATOR)
    const sortField = isCloze ? ankiText(card.cloze) : ankiText(card.front)
    const tags = [...new Set(['premed-os', ...card.tags])].map((tag) => tag.replaceAll(' ', '_')).join(' ')
    db.run(
      'INSERT INTO notes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [noteId, cardGuid(card, index), isCloze ? CLOZE_MODEL_ID : BASIC_MODEL_ID, nowSeconds, -1, ` ${tags} `, fields, sortField, stableNumber(sortField), 0, ''],
    )
    db.run(
      'INSERT INTO cards VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [cardId, noteId, DEFAULT_DECK_ID, 0, nowSeconds, -1, 0, 0, index + 1, 0, 0, 0, 0, 0, 0, 0, 0, ''],
    )
  })

  const collection = db.export()
  db.close()
  return zipSync({ 'collection.anki2': collection, media: strToU8('{}') }, { level: 6 })
}

export async function downloadFlashcardApkg(deck: GeneratedFlashcardDeck) {
  const contents = await flashcardApkg(deck)
  const url = URL.createObjectURL(new Blob([contents.buffer as ArrayBuffer], { type: 'application/apkg' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${deck.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'flashcards'}.apkg`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
