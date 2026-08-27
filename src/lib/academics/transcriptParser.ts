import { extractDocumentText, UnsupportedDocumentError, type DocumentSourceKind } from '@/lib/academics/documentText'

export type { DocumentSourceKind }
export { UnsupportedDocumentError }

/**
 * Reads a student's own transcript into *candidate* lines for review.
 *
 * This is deliberately not an authority. It never contacts a registrar, never
 * infers BCPM classification, and never fills a field it could not read — an
 * unreadable credit stays empty and the row is marked as needing the student.
 * Every candidate carries the exact source line so the review stage can show
 * what a value came from.
 */

export type TranscriptField =
  | 'institution' | 'courseNumberExact' | 'titleExact' | 'creditsExact'
  | 'gradeExact' | 'term' | 'year' | 'courseType'

export interface TranscriptCandidate {
  id: string
  institution: string
  courseNumberExact: string
  titleExact: string
  creditsExact: string
  gradeExact: string
  term: string
  year: string
  courseType: string
  /** The exact source line this row was read from. */
  evidenceQuote: string
  /** Fields the parser could not read. Never filled with a guess. */
  missing: TranscriptField[]
}

export interface TranscriptProposal {
  sourceName: string
  sourceKind: DocumentSourceKind
  text: string
  candidates: TranscriptCandidate[]
  /** Bytes were a picture (or a PDF with no text layer): nothing to parse. */
  scanDetected: boolean
  /** Text was read, but no line looked like a transcript course line. */
  unrecognized: boolean
}

const GRADE = /^(A\+|A-|A|B\+|B-|B|C\+|C-|C|D\+|D-|D|F|P|NP|S|U|W|I|IP|CR|AU|WF|WP)$/i
const CREDIT = /^\d{1,2}(\.\d{1,3})?$/
const COURSE_CODE = /^([A-Z]{2,5})\s?[-]?\s?(\d{2,4}[A-Z]?)$/
const TERM_WORD = /(fall|spring|summer|winter|autumn)/i
const YEAR = /\b(19|20)\d{2}\b/

/** "FA26" / "SP25" style term codes some registrars print inline. */
const TERM_CODE: Record<string, string> = { FA: 'Fall', SP: 'Spring', SU: 'Summer', WI: 'Winter' }


function readTermHeader(line: string): { term: string; year: string } | undefined {
  const word = line.match(TERM_WORD)
  const year = line.match(YEAR)
  if (word && year) {
    return { term: word[1][0].toUpperCase() + word[1].slice(1).toLowerCase(), year: year[0] }
  }
  return undefined
}

function readInlineTermCode(token: string): { term: string; year: string } | undefined {
  const match = token.match(/^(FA|SP|SU|WI)(\d{2})$/i)
  if (!match) return undefined
  const term = TERM_CODE[match[1].toUpperCase()]
  const yearNumber = Number(match[2])
  return { term, year: String(yearNumber >= 70 ? 1900 + yearNumber : 2000 + yearNumber) }
}

/** A line naming an institution, e.g. "University of North Carolina at Chapel Hill". */
function readInstitutionHeader(line: string): string | undefined {
  if (COURSE_CODE.test(line.split(/\s+/)[0] ?? '')) return undefined
  if (/(university|college|institute|academy|school of|community college)/i.test(line)
    && line.length < 90 && !GRADE.test(line.trim())) {
    return line.replace(/\s*[-—:]\s*(transcript|unofficial|official).*$/i, '').trim()
  }
  return undefined
}

export function parseTranscriptText(
  text: string,
  sourceName = 'Pasted transcript',
  sourceKind: DocumentSourceKind = 'text',
  scanDetected = false,
): TranscriptProposal {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const candidates: TranscriptCandidate[] = []
  let institution = ''
  let term = ''
  let year = ''
  let sequence = 0

  for (const line of lines) {
    const foundInstitution = readInstitutionHeader(line)
    if (foundInstitution) { institution = foundInstitution; continue }

    const header = readTermHeader(line)
    // A term header is only a header when the line is not itself a course line.
    const tokens = line.split(/\s{1,}|\t+/).filter(Boolean)
    const looksLikeCourse = COURSE_CODE.test(`${tokens[0] ?? ''} ${tokens[1] ?? ''}`.trim())
      || COURSE_CODE.test(tokens[0] ?? '')
    if (header && !looksLikeCourse) { term = header.term; year = header.year; continue }

    const parsed = readCourseLine(line, { institution, term, year })
    if (parsed) { sequence += 1; candidates.push({ ...parsed, id: `tr-${sequence}` }) }
  }

  return {
    sourceName,
    sourceKind,
    text,
    candidates,
    scanDetected,
    unrecognized: !scanDetected && candidates.length === 0,
  }
}

function readCourseLine(
  line: string,
  context: { institution: string; term: string; year: string },
): Omit<TranscriptCandidate, 'id'> | undefined {
  const raw = line.replace(/\s+/g, ' ').trim()
  let tokens = raw.split(' ')
  if (tokens.length < 3) return undefined

  // Course code: either one token ("BIOL252") or two ("BIOL 252").
  let code: string
  if (COURSE_CODE.test(`${tokens[0]} ${tokens[1]}`)) { code = `${tokens[0]} ${tokens[1]}`; tokens = tokens.slice(2) }
  else if (COURSE_CODE.test(tokens[0])) {
    const match = tokens[0].match(COURSE_CODE)!
    code = `${match[1]} ${match[2]}`
    tokens = tokens.slice(1)
  } else return undefined

  let term = context.term
  let year = context.year
  let credits = ''
  let grade = ''

  // Scan from the right: grade and credits sit at the end of a transcript line.
  const trailing: string[] = []
  while (tokens.length) {
    const last = tokens[tokens.length - 1]
    const inline = readInlineTermCode(last)
    if (inline && !trailing.length) { term = inline.term; year = inline.year; tokens.pop(); continue }
    if (!grade && GRADE.test(last)) { grade = last.toUpperCase(); tokens.pop(); continue }
    if (grade && !credits && CREDIT.test(last)) { credits = last; tokens.pop(); continue }
    if (!grade && !credits && CREDIT.test(last)) { credits = last; tokens.pop(); continue }
    trailing.push(last)
    break
  }

  // ⚠️ Exact, never prettified. This previously title-cased an all-caps
  // registrar line ("NEUROBIOLOGY" -> "Neurobiology"), which is precisely what
  // `titleExact` exists to prevent: the ledger's promise is that the printed
  // string survives. Only surrounding whitespace/punctuation is trimmed.
  const title = tokens.join(' ').replace(/[.\s]+$/, '').trim()
  // A bare code with no title and no grade is a heading, not a course line.
  if (!title && !grade) return undefined

  const missing: TranscriptField[] = []
  if (!context.institution) missing.push('institution')
  if (!title) missing.push('titleExact')
  if (!credits) missing.push('creditsExact')
  if (!grade) missing.push('gradeExact')
  if (!term) missing.push('term')
  if (!year) missing.push('year')

  return {
    institution: context.institution,
    courseNumberExact: code,
    titleExact: title,
    creditsExact: credits,
    gradeExact: grade,
    term,
    year,
    courseType: '',
    evidenceQuote: raw,
    missing,
  }
}

export async function extractTranscriptFile(file: File): Promise<TranscriptProposal> {
  const name = file.name || 'Transcript'
  const { text, sourceKind, scanDetected } = await extractDocumentText(file)
  return parseTranscriptText(text, name, sourceKind, scanDetected)
}

export interface DuplicateKeyed {
  institution: string
  courseNumberExact: string
  term: string
  year: string
}

const normalise = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')

/**
 * A repeated attempt is a real transcript fact, so a match is surfaced for a
 * decision rather than merged away.
 */
export function isDuplicateOf(candidate: DuplicateKeyed, existing: readonly DuplicateKeyed[]) {
  return existing.some((record) =>
    normalise(record.courseNumberExact) === normalise(candidate.courseNumberExact)
    && normalise(record.institution) === normalise(candidate.institution)
    && normalise(record.term) === normalise(candidate.term)
    && normalise(record.year) === normalise(candidate.year))
}
