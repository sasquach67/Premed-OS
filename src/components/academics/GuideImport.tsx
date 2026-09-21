import { useState } from 'react'
import type { ClassCenterData } from '@/lib/types'
import { useStore } from '@/store/store'
import { addGuideImport, reviewGuideImport, type ImportedGuideEntry } from '@/lib/academics/guideImport'
import { guideScopeLabel } from '@/lib/academics/studentGuide'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function GuideImport({ courseId, data }: { courseId: string; data: ClassCenterData }) {
  const [raw, setRaw] = useState(''), [entries, setEntries] = useState<ImportedGuideEntry[]>([]), [message, setMessage] = useState('')
  function review() {
    try { setEntries(reviewGuideImport(raw, courseId, data)); setMessage('') }
    catch (error) { setEntries([]); setMessage(error instanceof Error ? error.message : 'Could not read this Guide.') }
  }
  async function save() {
    try {
      let count = 0
      await useStore.getState().update(state => {
        const center = state.academics.classCenter
        const current = reviewGuideImport(raw, courseId, center)
        // Require another review if a lesson/assessment changed while the preview was open.
        if (JSON.stringify(current) !== JSON.stringify(entries)) throw new Error('The class changed. Review this Guide again before adding it.')
        count = addGuideImport(center, courseId, current)
      })
      setEntries([]); setRaw(''); setMessage(count ? `Added ${count} entries to your Guide.` : 'These entries are already in your Guide.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save this Guide. Your earlier notes are unchanged.') }
  }
  return <details className="mb-5 rounded-xl border border-border p-4">
    <summary className="cursor-pointer text-sm font-semibold">Import a compiled Guide</summary>
    <p className="my-3 text-sm text-muted-foreground">Open or paste a compiled Guide to review its study guidance and reference notes together. Your existing notes stay saved.</p>
    <label className="mb-3 block text-sm font-semibold">Open Guide file<input type="file" accept=".json,application/json" className="mt-2 block max-w-full text-sm" onChange={event => {
      const file = event.target.files?.[0]
      if (!file) return
      setEntries([]); setRaw(''); setMessage('')
      if (file.size > 500_000) { setMessage('This Guide is too large. Import a smaller collection.'); return }
      void file.text().then(text => { setRaw(text); setMessage('Guide file opened. Review it before adding entries.') }).catch(() => setMessage('Could not open this Guide file.'))
    }} /></label>
    <Textarea aria-label="Compiled Guide" value={raw} onChange={event => { setRaw(event.target.value); setEntries([]); setMessage('') }} />
    <Button className="mt-3" variant="outline" disabled={!raw.trim()} onClick={review}>Review Guide import</Button>
    {!!entries.length && <section aria-label="Guide import preview" className="mt-4 space-y-3">
      <ul className="space-y-2">{entries.map(entry => <li key={entry.id}><p className="font-semibold">{entry.title}</p><p className="text-xs text-muted-foreground">{entry.scope ? guideScopeLabel(entry.scope, data) : 'Reference note'}{data.notes.some(note => note.id === entry.id) ? ' · Already saved' : ''}</p><details className="text-sm"><summary>Supporting notes and source</summary><p className="whitespace-pre-wrap">{entry.content}</p></details></li>)}</ul>
      <Button onClick={() => { void save() }}>Add reviewed entries to Guide</Button>
    </section>}
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}
  </details>
}
