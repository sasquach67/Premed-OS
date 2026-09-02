import { FileSearch, FileText, ScanText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { SyllabusExtractionProgress } from '@/lib/academics/syllabusParser'

function fileKind(file: File) {
  if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') return 'PDF'
  if (/\.docx$/i.test(file.name) || /wordprocessingml/i.test(file.type)) return 'DOCX'
  return 'Text'
}

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function SyllabusSelectedFiles({ files, disabled, onRemove }: { files: File[]; disabled?: boolean; onRemove: (index: number) => void }) {
  if (!files.length) return null
  return (
    <ul className="space-y-1.5" aria-label="Selected syllabus files">
      {files.map((file, index) => (
        <li key={`${file.name}-${file.size}-${file.lastModified}-${index}`} className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-muted/35 px-3 py-2">
          <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold text-foreground">{file.name}</span>
            <span className="block text-[11px] font-semibold text-muted-foreground">{fileKind(file)} · {fileSize(file.size)} · Ready to read</span>
          </span>
          <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" disabled={disabled} onClick={() => onRemove(index)} aria-label={`Remove ${file.name}`}>
            <Trash2 className="size-3.5" />
          </Button>
        </li>
      ))}
    </ul>
  )
}

export function SyllabusReadingProgress({ progress }: { progress: SyllabusExtractionProgress }) {
  const percent = Math.round(progress.overallProgress * 100)
  const usingOcr = progress.phase === 'ocr'

  return (
    <section className="rounded-xl border border-primary/25 bg-primary/[0.06] p-3.5" role="status" aria-live="polite" aria-busy="true">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary" aria-hidden="true">
          {usingOcr ? <ScanText className="size-4" /> : <FileSearch className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-display text-sm font-extrabold">Reading files on this device</p>
            <span className="shrink-0 text-xs font-extrabold tabular-nums text-primary">{percent}%</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold text-muted-foreground">
            <span>File {progress.fileIndex} of {progress.fileCount}</span>
            <span aria-hidden="true">·</span>
            <span className="min-w-0 truncate text-foreground">{progress.fileName}</span>
          </div>
          <Progress className="mt-2 h-2" value={percent} aria-label={`Syllabus extraction ${percent}% complete`} />
          <p className="mt-2 text-xs font-semibold text-muted-foreground">{progress.message.replace(/^File \d+ of \d+ · /, '')}</p>
        </div>
      </div>
    </section>
  )
}
