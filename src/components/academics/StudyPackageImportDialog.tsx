import { useRef, useState } from 'react'
import { FileUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useStore } from '@/store/store'
import { importStudyPackage, parseStudyPackage, STUDY_PACKAGE_MAX_BYTES, studyPackageFingerprint, type StudyPackage } from '@/lib/academics/studyPackageImport'

export function StudyPackageImportDialog({ courseId, onImported }: { courseId: string; onImported: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<{ package: StudyPackage; fingerprint: string } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const attempt = useRef(0)
  const base = import.meta.env.BASE_URL
  return <Dialog open={open} onOpenChange={value => { setOpen(value); attempt.current++; setPreview(null); setError(''); setLoading(false) }}>
    <DialogTrigger asChild><Button variant="outline"><FileUp className="size-4" />Import a guide</Button></DialogTrigger>
    <DialogContent className="max-h-[85dvh] overflow-y-auto">
      <DialogHeader><DialogTitle>Import a guide</DialogTitle><DialogDescription>Save a study package created with your assistant. Importing does not make an AI request.</DialogDescription></DialogHeader>
      <p className="text-sm leading-6">Give your assistant the <a className="text-primary underline" href={`${base}templates/premed-os-study-package-instructions.md`} download>package instructions</a> and <a className="text-primary underline" href={`${base}templates/premed-os-study-package.json`} download>example file</a>, then bring its completed JSON file here.</p>
      <label className="text-sm font-semibold">Study-package file<input type="file" accept=".json,application/json" className="mt-2 block w-full min-w-0 rounded-lg border p-3 text-sm" onChange={async event => {
        const file = event.target.files?.[0]; const current = ++attempt.current
        setPreview(null); setError('')
        if (!file) { setLoading(false); return }
        setLoading(true)
        try {
          if (file.size > STUDY_PACKAGE_MAX_BYTES) throw new Error('Choose a study package smaller than 8 MB.')
          const parsed = parseStudyPackage(await file.text())
          const fingerprint = await studyPackageFingerprint(parsed)
          if (current === attempt.current) setPreview({ package: parsed, fingerprint })
        } catch (e) { if (current === attempt.current) setError(e instanceof Error ? e.message : 'The package could not be read.') }
        finally { if (current === attempt.current) setLoading(false) }
      }} /></label>
      {loading && <p role="status" className="text-sm">Checking package…</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {preview && <section aria-label="Import preview" className="space-y-3 rounded-xl border bg-muted p-4">
        <h3 className="break-words font-semibold">{preview.package.title}</h3>
        <p className="text-sm">{preview.package.sections.length} sections · {preview.package.objectives.length} objectives · {preview.package.sources.length} source excerpts</p>
        <ol className="list-decimal space-y-1 pl-5 text-sm">{preview.package.sections.map((s, i) => <li key={i}>{s.title}</li>)}</ol>
        <p className="text-xs leading-5 text-muted-foreground">Externally created. Independent review has not run. Source links point to supplied excerpts; their presence does not verify the claims.</p>
        {preview.package.sections.some(s => s.blocks.some(b => !b.sourceId)) && <p className="text-xs text-muted-foreground">Some guide blocks have no linked source excerpt.</p>}
        <Button onClick={() => {
          let id = ''
          useStore.getState().update(state => { id = importStudyPackage(state.academics.classCenter, courseId, preview.package, preview.fingerprint) })
          setOpen(false); setPreview(null); onImported(id)
        }}>Save imported guide</Button>
      </section>}
    </DialogContent>
  </Dialog>
}
