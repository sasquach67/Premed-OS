import { useRef, useState } from 'react'
import { FileText, Upload } from 'lucide-react'
import type { Course, LetterGrade } from '@/lib/types'
import { uid } from '@/lib/id'
import { useStore } from '@/store/store'
import {
  extractTranscriptFile, isDuplicateOf, parseTranscriptText,
  UnsupportedDocumentError, type TranscriptCandidate, type TranscriptProposal,
} from '@/lib/academics/transcriptParser'

type Stage = 'intake' | 'review'

/** A named failure the student can act on — never a silent empty parse. */
type IntakeNotice =
  | { kind: 'unsupported'; detail: string }
  | { kind: 'scan'; detail: string }
  | { kind: 'unrecognized'; detail: string }
  | { kind: 'failed'; detail: string }

const ACCEPT = '.pdf,.docx,.png,.jpg,.jpeg,.txt,.csv,application/pdf,image/*,text/plain'

export function TranscriptIntake({ courses, onManual, onCancel, onSaved }: {
  courses: Course[]
  onManual: () => void
  onCancel: () => void
  onSaved?: (count: number) => void
}) {
  const existing = useStore((state) => state.academics.classCenter.transcriptRecords)
  const update = useStore((state) => state.update)
  const fileInput = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('intake')
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pasted, setPasted] = useState('')
  const [notice, setNotice] = useState<IntakeNotice | undefined>()
  const [proposal, setProposal] = useState<TranscriptProposal | undefined>()
  const [rows, setRows] = useState<TranscriptCandidate[]>([])
  const [dropped, setDropped] = useState<Record<string, boolean>>({})

  function acceptProposal(next: TranscriptProposal) {
    if (next.scanDetected) {
      setNotice({ kind: 'scan', detail: `${next.sourceName} has no readable text layer. Paste the text, or enter the line manually.` })
      return
    }
    if (next.unrecognized) {
      setNotice({ kind: 'unrecognized', detail: `No transcript course line was found in ${next.sourceName}. Check it is the right document, or enter the line manually.` })
      return
    }
    setNotice(undefined)
    setProposal(next)
    setRows(next.candidates)
    // A repeated attempt is a real fact, so it is excluded by default and
    // surfaced for a decision rather than merged away.
    setDropped(Object.fromEntries(next.candidates
      .filter((row) => isDuplicateOf(row, existing))
      .map((row) => [row.id, true])))
    setStage('review')
  }

  async function readFile(file: File) {
    setBusy(true)
    try {
      acceptProposal(await extractTranscriptFile(file))
    } catch (error) {
      if (error instanceof UnsupportedDocumentError) {
        setNotice({ kind: 'unsupported', detail: `${file.name} is not a file this device can read. Supported: PDF, DOCX, PNG, JPG, or plain text.` })
      } else {
        setNotice({ kind: 'failed', detail: `${file.name} could not be read${error instanceof Error && error.message ? ` — ${error.message}` : ''}. Paste its text or enter the line manually.` })
      }
    } finally {
      setBusy(false)
    }
  }

  function readPasted() {
    const text = pasted.trim()
    if (!text) return
    acceptProposal(parseTranscriptText(text, 'Pasted transcript', 'text'))
  }

  function editRow(id: string, field: keyof TranscriptCandidate, value: string) {
    setRows((current) => current.map((row) => row.id === id
      ? { ...row, [field]: value, missing: row.missing.filter((name) => name !== field || !value.trim()) }
      : row))
  }

  const kept = rows.filter((row) => !dropped[row.id])

  function save() {
    const now = Date.now()
    update((draft) => {
      const center = draft.academics.classCenter
      for (const row of kept) {
        // A transcript line is a course the student took. Link it to a matching
        // planned course, or record the course it evidences — otherwise prior
        // credit could never be entered at all.
        let course = draft.courses.find((item) =>
          item.code.trim().toLowerCase().replace(/\s+/g, ' ') === row.courseNumberExact.trim().toLowerCase())
        if (!course) {
          const created: Course = {
            id: uid(),
            term: [row.term, row.year].filter(Boolean).join(' ') || 'Prior credit',
            code: row.courseNumberExact,
            title: row.titleExact,
            credits: Number(row.creditsExact) || 0,
            grade: asLetterGrade(row.gradeExact),
            bcpm: false,
            status: 'completed',
            inResidence: false,
            satisfies: [],
            order: draft.courses.length,
          }
          draft.courses.push(created)
          course = draft.courses[draft.courses.length - 1]
        }
        center.transcriptRecords.push({
          id: uid(),
          courseId: course.id,
          institution: row.institution.trim(),
          courseNumberExact: row.courseNumberExact.trim(),
          titleExact: row.titleExact.trim(),
          creditsExact: row.creditsExact.trim(),
          gradeExact: row.gradeExact.trim(),
          term: row.term.trim(),
          year: row.year.trim(),
          courseType: row.courseType.trim(),
          // Classification is never inferred from a parsed line.
          createdAt: now,
          updatedAt: now,
          order: center.transcriptRecords.length,
        })
      }
    })
    onSaved?.(kept.length)
  }

  if (stage === 'review' && proposal) {
    const needing = rows.filter((row) => row.missing.length && !dropped[row.id]).length
    return <div className="grades-transcript-form">
      <div className="grades-transcript-kicker">Review before saving</div>
      <h3 className="grades-transcript-title">
        {rows.length} line{rows.length === 1 ? '' : 's'} read
        {needing > 0 ? ` · ${needing} need${needing === 1 ? 's' : ''} a decision` : ''}
      </h3>
      <p className="grades-transcript-copy">
        Every field stays editable. Correct anything the file got wrong, then save only the lines you keep.
      </p>
      {rows.map((row) => {
        const duplicate = isDuplicateOf(row, existing)
        const isDropped = Boolean(dropped[row.id])
        return <div key={row.id} className="grades-review-row" data-flagged={(duplicate || row.missing.length > 0) || undefined} data-dropped={isDropped || undefined}>
          <div className="grades-review-top">
            <b>{row.courseNumberExact || 'Course number not read'}{row.titleExact ? ` · ${row.titleExact}` : ''}</b>
            <span className="flex items-center gap-2">
              {duplicate && <span className="grades-intake-chip">Already recorded</span>}
              {!duplicate && row.missing.length > 0 && <span className="grades-intake-chip">Needs you</span>}
              <button type="button" className="grades-transcript-button" onClick={() => setDropped((current) => ({ ...current, [row.id]: !current[row.id] }))}>
                {isDropped ? 'Keep' : 'Drop'}
              </button>
            </span>
          </div>
          <div className="grades-review-grid">
            {([
              ['institution', 'Institution'], ['creditsExact', 'Credit'],
              ['gradeExact', 'Grade'], ['term', 'Term'], ['year', 'Year'],
              ['titleExact', 'Title'], ['courseNumberExact', 'Course number'], ['courseType', 'Course type'],
            ] as const).map(([field, label]) => <label key={field} className="grades-review-cell">
              <small>{label}</small>
              <input
                value={row[field]}
                aria-label={`${label} for ${row.courseNumberExact || 'unread line'}`}
                placeholder="Not read"
                onChange={(event) => editRow(row.id, field, event.target.value)}
              />
            </label>)}
          </div>
          <p className="grades-review-quote">
            {duplicate
              ? 'Duplicate of an existing record. Skipped unless you choose to keep both attempts.'
              : `“${row.evidenceQuote}”`}
          </p>
        </div>
      })}
      <div className="grades-transcript-actions">
        <button type="button" className="grades-transcript-button" onClick={() => { setStage('intake'); setNotice(undefined) }}>Back</button>
        <button type="button" className="grades-transcript-button" onClick={onCancel}>Cancel</button>
        <button type="button" className="grades-transcript-button" data-primary="true" disabled={!kept.length} onClick={save}>
          Save {kept.length} record{kept.length === 1 ? '' : 's'}
        </button>
      </div>
    </div>
  }

  return <div className="grades-transcript-form">
    <div className="grades-transcript-kicker">Add coursework</div>
    <h3 className="grades-transcript-title">Bring the transcript in, then check it.</h3>
    <p className="grades-transcript-copy">
      Nothing is saved from a file until you have reviewed every line. Exact strings are preserved; anything unreadable stays blank rather than guessed.
    </p>
    <button
      type="button"
      className="grades-intake-drop"
      data-dragging={dragging || undefined}
      onClick={() => fileInput.current?.click()}
      onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault(); setDragging(false)
        const file = event.dataTransfer.files?.[0]
        if (file) void readFile(file)
      }}
    >
      <b><Upload className="mr-1 inline size-4" aria-hidden="true" />{busy ? 'Reading…' : 'Drop a transcript PDF or image'}</b>
      <span>or choose a file · PDF, DOCX, PNG, JPG</span>
    </button>
    <input
      ref={fileInput} type="file" accept={ACCEPT} className="sr-only" aria-label="Choose a transcript file"
      onChange={(event) => { const file = event.target.files?.[0]; if (file) void readFile(file); event.target.value = '' }}
    />
    <div className="grades-intake-or">or paste</div>
    <textarea
      className="grades-intake-paste"
      value={pasted}
      aria-label="Paste transcript text"
      placeholder="Paste transcript text, or paste a screenshot of the transcript lines."
      onChange={(event) => setPasted(event.target.value)}
      onPaste={(event) => {
        const image = [...(event.clipboardData?.files ?? [])].find((file) => file.type.startsWith('image/'))
        if (image) { event.preventDefault(); void readFile(image) }
      }}
    />
    {notice && <div className="grades-intake-note" role="status">
      <b>{noticeTitle(notice.kind)}</b><br />{notice.detail}
    </div>}
    <div className="grades-transcript-actions">
      <button type="button" className="grades-transcript-button" onClick={onManual}>Enter one line manually</button>
      <button type="button" className="grades-transcript-button" onClick={onCancel}>Cancel</button>
      <button type="button" className="grades-transcript-button" data-primary="true" disabled={!pasted.trim() || busy} onClick={readPasted}>Review lines</button>
    </div>
    <div className="grades-intake-note" data-unconfigured="true">
      <b>Email a transcript</b><span className="grades-intake-chip">Not configured</span><br />
      No mail processor is connected, so this route is unavailable rather than pretending to accept a message.
    </div>
    <p className="grades-transcript-copy mt-3 flex items-center gap-1">
      <FileText className="size-3.5" aria-hidden="true" />
      The file is read on this device. Nothing is uploaded, and this is not a registrar document or a degree audit.
    </p>
    {!courses.length && <p className="grades-transcript-copy mt-2">
      No planned course matches a transcript line yet — saving will record the course each line evidences.
    </p>}
  </div>
}

const LETTER_GRADES: readonly LetterGrade[] = [
  'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'P', 'NP', 'IP', '',
]

/**
 * The linked Course carries a constrained grade union, but a transcript prints
 * strings it does not cover (W, S, U, CR…). Those stay exactly as printed on the
 * transcript record; the course simply holds no letter grade rather than being
 * given a wrong one.
 */
function asLetterGrade(value: string): LetterGrade {
  const upper = value.trim().toUpperCase()
  return (LETTER_GRADES as readonly string[]).includes(upper) ? upper as LetterGrade : ''
}

function noticeTitle(kind: IntakeNotice['kind']) {
  return kind === 'unsupported' ? 'Unsupported file'
    : kind === 'scan' ? 'No readable text'
      : kind === 'unrecognized' ? 'No transcript line found'
        : 'Could not read that file'
}
