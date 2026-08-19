import { useState } from 'react'
import { ExternalLink, Link2, FileText, FolderOpen, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AspectRatio } from '@/components/ui/aspect-ratio'

/** Turn a Google share URL into an embeddable preview src. */
function toEmbedSrc(url: string): string | null {
  if (!url) return null
  const doc = url.match(/document\/d\/([A-Za-z0-9_-]+)/)
  if (doc) return `https://docs.google.com/document/d/${doc[1]}/preview`
  const sheet = url.match(/spreadsheets\/d\/([A-Za-z0-9_-]+)/)
  if (sheet) return `https://docs.google.com/spreadsheets/d/${sheet[1]}/preview`
  const slide = url.match(/presentation\/d\/([A-Za-z0-9_-]+)/)
  if (slide) return `https://docs.google.com/presentation/d/${slide[1]}/preview`
  const folder = url.match(/drive\/folders\/([A-Za-z0-9_-]+)/)
  if (folder) return `https://drive.google.com/embeddedfolderview?id=${folder[1]}#grid`
  const file = url.match(/file\/d\/([A-Za-z0-9_-]+)/)
  if (file) return `https://drive.google.com/file/d/${file[1]}/preview`
  return url // last resort — some sites allow framing
}

/** Embed an editable Google Doc / Drive folder inline. The preview is
 *  read-only (Google blocks editing in iframes), so we pair it with an
 *  "Open to edit" button — the practical, honest version of inline editing. */
export function DocEmbed({
  value, onChange, kind = 'doc', title,
}: {
  value: string
  onChange: (url: string) => void
  kind?: 'doc' | 'folder'
  height?: number
  title?: string
}) {
  const [editing, setEditing] = useState(!value)
  const [draft, setDraft] = useState(value)
  const src = toEmbedSrc(value)
  const Icon = kind === 'folder' ? FolderOpen : FileText

  if (editing || !value) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted p-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Icon className="size-4 text-primary" /> {title ?? (kind === 'folder' ? 'Embed a Google Drive folder' : 'Embed a Google Doc')}
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Paste a {kind === 'folder' ? 'Drive folder' : 'Google Doc'} share link. Set it to “Anyone with the link” so it can preview here.
        </p>
        <div className="flex gap-2">
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="https://docs.google.com/…" />
          <Button onClick={() => { onChange(draft.trim()); setEditing(false) }} disabled={!draft.trim()}>
            <Link2 className="size-4" /> Embed
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card card-soft">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted px-3 py-1.5">
        <span className="flex items-center gap-1.5 truncate text-xs font-semibold text-muted-foreground">
          <Icon className="size-3.5" /> {title ?? 'Embedded'}
        </span>
        <div className="flex items-center gap-1">
          <Button asChild size="sm" variant="ghost" className="h-7">
            <a href={value} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-3.5" /> Open to edit</a>
          </Button>
          <Button size="sm" variant="ghost" className="h-7" onClick={() => { setDraft(value); setEditing(true) }}>
            <Pencil className="size-3.5" />
          </Button>
        </div>
      </div>
      {src && (
        <AspectRatio ratio={16 / 9}>
          <iframe src={src} title={title ?? 'Embedded document'} className="size-full" loading="lazy" />
        </AspectRatio>
      )}
    </div>
  )
}
