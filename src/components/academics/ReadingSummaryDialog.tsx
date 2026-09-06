import { useState } from 'react'
import type { AcademicFile, ClassCenterData } from '@/lib/types'
import type { StudyGuideArtifact } from '@/lib/generation/schemas/studyGuide.v1'
import { useStore } from '@/store/store'
import { uid } from '@/lib/id'
import { generateReadingSummary, READING_KINDS, type ReadingKind } from '@/lib/academics/generateReadingSummary'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

export function ReadingSummaryContent({ artifact }: { artifact: StudyGuideArtifact }) {
  const chunks = useStore(state => state.academics.classCenter.sourceChunks)
  const files = useStore(state => state.academics.classCenter.files)
  return <article className="space-y-8 py-3">{artifact.sections.map(section => <section key={section.id} className="border-b border-border pb-6 last:border-0">
    <h3 className="mb-4 font-display text-xl font-extrabold">{section.title}</h3>
    <div className="space-y-4">{section.blocks.map(block => <div key={block.id} className={['gap', 'contradiction', 'callout', 'recall'].includes(block.type) ? 'border-l-2 border-primary bg-muted/40 px-4 py-3' : ''}>
      {block.text?.content && <p className="whitespace-pre-wrap text-sm leading-7">{block.text.content}</p>}
      {!!block.items?.length && (block.type === 'numbered' ? <ol className="list-decimal space-y-2 pl-5 text-sm leading-7">{block.items.map((item, i) => <li key={i}>{item.content}</li>)}</ol> : <ul className="list-disc space-y-2 pl-5 text-sm leading-7">{block.items.map((item, i) => <li key={i}>{item.content}</li>)}</ul>)}
    </div>)}</div>
    <details className="mt-4 text-xs text-muted-foreground"><summary className="w-fit cursor-pointer py-2 focus-visible:ring-2 focus-visible:ring-ring">Sources</summary>{[...new Set(section.blocks.flatMap(block => block.sourceRef ? [block.sourceRef.chunkId] : []))].map(id => { const chunk = chunks.find(item => item.id === id); const file = files.find(item => item.id === chunk?.fileId); return <blockquote key={id} className="mt-3 border-l border-border pl-3 leading-6"><b>{file?.title ?? 'Source no longer available'}{chunk?.sourcePosition?.label ? ` · ${chunk.sourcePosition.label}` : ' · saved passage'}</b><p>{chunk?.content}</p></blockquote> })}</details>
  </section>)}</article>
}

export function ReadingSummaryDialog({ reading, courseLabel, data, open, onOpenChange }: { reading: AcademicFile; courseLabel: string; data: ClassCenterData; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [kind, setKind] = useState<ReadingKind | ''>('')
  const [focus, setFocus] = useState('')
  const [contextIds, setContextIds] = useState<string[]>([])
  const [phase, setPhase] = useState<'idle' | 'generating' | 'saving'>('idle')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<StudyGuideArtifact>()
  const readable = (id: string) => data.sourceChunks.some(chunk => chunk.courseId === reading.courseId && chunk.fileId === id && chunk.content.trim())
  const context = data.files.filter(file => file.courseId === reading.courseId && file.id !== reading.id)
  const busy = phase !== 'idle'
  async function build() {
    const courseId = reading.courseId
    if (!kind || busy || !courseId) return
    setError(''); setPhase('generating')
    try {
      const result = await generateReadingSummary({ courseId, courseLabel, reading, kind, focus, contextFileIds: contextIds, files: data.files, chunks: data.sourceChunks })
      if (!result.ok) { setError(result.message ?? 'The reading summary could not be generated. Your materials are unchanged.'); return }
      setPhase('saving')
      const now = Date.now()
      useStore.getState().update(draft => {
        const center = draft.academics.classCenter
        center.notes.push({ id: uid(), courseId, title: result.title, type: 'study-guide', kind: 'on-material', date: new Date(now).toISOString().slice(0, 10), topicIds: [], unit: '', content: result.content, readingSummary: { artifact: result.artifact, readingKind: kind, focus, primaryFileId: reading.id, auditStatus: result.auditStatus }, syncStatus: 'local-only', linkedFileIds: result.fileIds, courseWeek: reading.courseWeek, materialPlacement: reading.materialPlacement, createdAt: now, updatedAt: now, order: center.notes.length })
      })
      setSaved(result.artifact)
    } catch { setError('Generation stopped unexpectedly. Your reading and selections are still here; you can retry.') }
    finally { setPhase('idle') }
  }
  return <Dialog open={open} onOpenChange={value => { if (!busy) onOpenChange(value) }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>{saved ? 'Reading summary' : 'Understand this reading'}</DialogTitle><DialogDescription>{reading.title} · {courseLabel}</DialogDescription></DialogHeader>
    {saved ? <><p role="status" className="text-sm text-primary">Saved in Materials. You can reopen it there.</p><ReadingSummaryContent artifact={saved} /><Button onClick={() => onOpenChange(false)}>Done</Button></> : <>
      <p className="text-sm leading-6 text-muted-foreground">Follow the ideas, evidence, and argument—not just the key points. Add class context to connect the reading to what you’re studying.</p>
      <fieldset disabled={busy} className="space-y-2"><legend className="mb-2 text-sm font-bold">What kind of reading is this?</legend>{Object.entries(READING_KINDS).map(([value, label]) => <label key={value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-sm"><input type="radio" name={`reading-kind-${reading.id}`} value={value} checked={kind === value} onChange={() => setKind(value as ReadingKind)} />{label}</label>)}</fieldset>
      <label className="space-y-2 text-sm font-bold">What are you studying? <span className="font-normal text-muted-foreground">Optional</span><Textarea className="mt-2" value={focus} disabled={busy} maxLength={2000} onChange={event => setFocus(event.target.value)} placeholder="For example: How does this author challenge the way we define illness?" /></label>
      <details><summary className="cursor-pointer py-2 text-sm font-bold focus-visible:ring-2 focus-visible:ring-ring">Connect class materials <span className="font-normal text-muted-foreground">Optional · {contextIds.length} selected</span></summary><p className="mb-3 text-xs leading-5 text-muted-foreground">Choose relevant lecture notes, slides, reading questions, or other assigned texts. Nothing else from your class is included automatically.</p><fieldset disabled={busy} className="max-h-48 space-y-2 overflow-y-auto">{context.map(file => <label key={file.id} className="flex items-start gap-3 py-2 text-sm"><input className="mt-1" type="checkbox" checked={contextIds.includes(file.id)} disabled={!readable(file.id)} onChange={event => setContextIds(ids => event.target.checked ? [...ids, file.id] : ids.filter(id => id !== file.id))} /><span>{file.title}{!readable(file.id) && <span className="block text-xs text-muted-foreground">No readable text yet</span>}</span></label>)}{!context.length && <p className="text-sm text-muted-foreground">No other materials saved for this class.</p>}</fieldset></details>
      <p className="text-xs leading-5 text-muted-foreground">Uses the readable text from this reading and your selected context. Figures are not inspected. Creating a summary sends that text and your focus through the app’s AI connection.</p>
      {!readable(reading.id) && <p role="alert" className="text-sm text-destructive">This reading has no readable text. Import a clearer copy before generating.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {busy && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin motion-reduce:animate-none" />{phase === 'saving' ? 'Saving your summary…' : 'Reading the selected material and checking the summary…'}</p>}
      <Button disabled={!kind || !readable(reading.id) || busy} onClick={() => void build()}>{busy ? 'Creating summary…' : 'Summarize for class'}</Button>
    </>}
  </DialogContent></Dialog>
}
