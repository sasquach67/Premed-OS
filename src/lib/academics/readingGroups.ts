import type { AssignedReading } from '@/lib/types'

/**
 * Reading notebooks (Andy, Oct 19 2026; drawn for ANTH 147): classes built
 * around readings get a notebook per reading next to the notebooks per
 * lecture. A book assigned in parts across weeks is one notebook, updated
 * part by part.
 *
 * Syllabus readings arrive as full citations. Only a book's first part
 * usually names the book ("Steinberg, Sizwe’s Test, “Preface”… (pp. 1-75)");
 * later parts give chapter titles. So a book is readings by the same first
 * author, in back-to-back weeks, each with a page range.
 */
export interface ReadingItem {
  /** Stable key a notebook links to. */
  key: string
  /** Short display title: "Hahn & Kleinman, “Belief as Pathogen, Belief as Medicine”". */
  title: string
  /** The syllabus readings it is made of, oldest first. One for an article. */
  parts: AssignedReading[]
  /** Page ranges of a book's parts ("pp. 1-75"); empty for a single reading. */
  partLabels: string[]
  /** ISO date of the first and last part's class discussion, when known. */
  firstDue?: string
  due?: string
}

const YEAR = /\b(?:19|20)\d{2}\b/
// Double quotes only: a curly apostrophe (’) is part of the title, not its end.
const QUOTED = /“([^”]{3,})”|"([^"]{3,})"/
const PAGES = /\bpp?\.\s*\d+\s*[-–]\s*\d+/i

function dueOf(r: AssignedReading) {
  return r.dueForDiscussion && /^\d{4}-\d{2}-\d{2}/.test(r.dueForDiscussion) ? r.dueForDiscussion.slice(0, 10) : undefined
}

/** Where the author list ends: a year, a quote, a page range, or the end. */
function authorSpan(label: string): string {
  const cut = [label.search(YEAR), label.search(/[“"]/), label.search(PAGES)].filter((i) => i > 0)
  return (cut.length ? label.slice(0, Math.min(...cut)) : label).trim()
}

/** Surnames from "Hahn, R.A. & Kleinman, A" or "Moore, R., McElfsh, P.A., and Riklon, S.". */
export function readingAuthors(label: string): string[] {
  const span = authorSpan(label).replace(/^(?:listen to|watch|read)\b[^,]*,?\s*/i, '')
  const names: string[] = []
  for (const piece of span.split(/\s*(?:&|\band\b)\s*/i)) {
    piece.split(',').map((s) => s.trim()).forEach((seg, i) => {
      // "Surname, Given" pairs: surnames sit at even positions; skip initials.
      if (i % 2 === 0 && seg && !/^[A-Z](?:\.[A-Z]?)*\.?$/.test(seg) && /^[A-Z][\p{L}'’-]+/u.test(seg)) names.push(seg.split(/\s+/)[0])
    })
  }
  return names
}

/** The title: the first quoted title, else the words after the year or author. */
function readingTitleText(label: string): string | undefined {
  const m = label.match(QUOTED)
  const quoted = (m?.[1] ?? m?.[2])?.replace(/[,.:;\s]+$/, '')
  if (quoted) return quoted
  const year = label.match(YEAR)
  const rest = year ? label.slice(year.index! + year[0].length) : label.split(',').slice(1).join(',')
  return rest.replace(/^[\s.,]+/, '').split(/[,:(]|\bpp?\./i)[0].trim() || undefined
}

export function shortReadingTitle(label: string): string {
  if (/^listen to podcast/i.test(label)) return `Podcast, “${readingTitleText(label) ?? 'episode'}”`
  const authors = readingAuthors(label)
  const who = authors.length > 2 ? `${authors[0]} et al.` : authors.join(' & ')
  const title = readingTitleText(label)
  const quoted = Boolean(label.match(QUOTED))
  const what = title ? (quoted ? `“${title}”` : title) : ''
  return [who, what].filter(Boolean).join(', ') || label.trim()
}

function pageRange(label: string): string | undefined {
  return label.match(PAGES)?.[0].replace(/\s+/g, ' ').replace(/^(pp?)\.\s*/i, '$1. ')
}

/** Group a class's syllabus readings into items: parts of one book together. */
export function buildReadingItems(readings: AssignedReading[]): ReadingItem[] {
  const sorted = [...readings].sort((a, b) => (dueOf(a) ?? '9').localeCompare(dueOf(b) ?? '9') || a.order - b.order)
  const groups: AssignedReading[][] = []
  for (const r of sorted) {
    const last = groups[groups.length - 1]
    const prev = last?.[last.length - 1]
    const sameAuthor = prev && readingAuthors(prev.title)[0] && readingAuthors(prev.title)[0] === readingAuthors(r.title)[0]
    const bothPaged = prev && pageRange(prev.title) && pageRange(r.title)
    const gap = prev && dueOf(prev) && dueOf(r) ? (Date.parse(dueOf(r)!) - Date.parse(dueOf(prev)!)) / 86_400_000 : Infinity
    if (sameAuthor && bothPaged && gap > 0 && gap <= 8) last.push(r)
    else groups.push([r])
  }
  return groups.map((parts) => {
    const dues = parts.map(dueOf).filter((d): d is string => Boolean(d))
    const book = parts.length > 1
    // A book's title is the words between author and chapter titles in the
    // part that names it: "Steinberg, Sizwe’s Test, “Preface”…" → "Sizwe’s Test".
    const bookTitle = book ? parts.map((p) => authorSpan(p.title).split(',')[1]?.trim()).find((t) => t && t.split(/\s+/).length > 1) : undefined
    const authors = readingAuthors(parts[0].title)
    const who = authors.length > 2 ? `${authors[0]} et al.` : authors.join(' & ')
    const title = book ? [who, bookTitle ?? readingTitleText(parts[0].title)].filter(Boolean).join(', ') : shortReadingTitle(parts[0].title)
    return {
      key: title.toLowerCase().replace(/[“”"'’‘]/g, '').replace(/\s+/g, ' ').trim(),
      title,
      parts,
      partLabels: book ? parts.map((p) => pageRange(p.title) ?? p.week) : [],
      firstDue: dues[0],
      due: dues[dues.length - 1],
    }
  })
}

/** The exam a reading item belongs to: the first exam dated after its last part. A reading
 * dated on an exam day has no class discussion that day, so it counts toward the next exam. */
export function readingExamKey(item: ReadingItem, exams: { key: string; date?: string }[]): string | undefined {
  const sorted = [...exams].sort((a, b) => (a.date ?? '9').localeCompare(b.date ?? '9'))
  if (!sorted.length) return undefined
  return (item.due ? sorted.find((e) => e.date !== undefined && e.date > item.due!) : undefined)?.key ?? sorted[sorted.length - 1].key
}

/** Readings discussed on any of these class dates, for a lesson card's "Discusses" line. */
export function readingsDiscussedOn(items: ReadingItem[], dates: string[]): string[] {
  return items.flatMap((item) => item.parts
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => { const d = dueOf(p); return d !== undefined && dates.includes(d) })
    .map(({ i }) => item.partLabels.length ? `${item.title}, ${item.partLabels[i]}` : item.title))
}
