import { useState } from 'react'
import { Plus, Pencil, X } from 'lucide-react'
import type { ClassCenterData, ClassNote, GuideProposal } from '@/lib/types'
import { useStore } from '@/store/store'
import { uid } from '@/lib/id'
import { GUIDE_GROUPS, extractGuideHeadlines, guideScopeValue, parseGuideScope, guideScopeLabel, type GuideGroup } from '@/lib/academics/studentGuide'
import { isGuideSourceValid } from '@/lib/academics/guideContract'
import { GuideImport } from './GuideImport'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function GuideScopeField({ courseId, data, value, onChange, label = 'Applies to' }: { courseId: string; data: ClassCenterData; value: string; onChange: (value: string) => void; label?: string }) {
  return <label className="block text-sm font-semibold">{label}<select className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3" value={value} onChange={event => onChange(event.target.value)}>
    <option value="">Whole class</option>
    <optgroup label="Lessons">{data.lectures.filter(item => item.courseId === courseId).map(item => <option key={item.id} value={`lesson:${item.id}`}>{item.title}</option>)}</optgroup>
    <optgroup label="Exams and assignments">{data.assignments.filter(item => item.courseId === courseId).map(item => <option key={item.id} value={`assessment:${item.id}`}>{item.title}</option>)}</optgroup>
  </select></label>
}

type Suggestion = { headline: string; originalText: string; selected: boolean; proposal?: GuideProposal }
export function StudentGuide({ courseId, data }: { courseId: string; data: ClassCenterData }) {
  const [headline, setHeadline] = useState('')
  const [details, setDetails] = useState('')
  const [group, setGroup] = useState<GuideGroup>('emphasis')
  const [scope, setScope] = useState('')
  const [raw, setRaw] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [message, setMessage] = useState('')
  const notes = data.notes.filter(note => note.courseId === courseId && note.studentGuidance).sort((a, b) => a.order - b.order)
  const pending = data.guideProposals.filter(proposal => proposal.courseId === courseId && proposal.status === 'pending' && proposal.source.sourceKind === 'lecture' && isGuideSourceValid(data, courseId, proposal.source))
  function save(items: Suggestion[], origin: NonNullable<ClassNote['studentGuidance']>['origin']) {
    const chosen = items.filter(item => item.selected && item.headline.trim() && item.headline.trim().length <= 180)
    if (!chosen.length) return
    let savedCount = 0
    useStore.getState().update(state => {
      const center = state.academics.classCenter, now = Date.now()
      for (const item of chosen) {
        const proposal = item.proposal && center.guideProposals.find(p => p.id === item.proposal!.id && p.status === 'pending')
        if (item.proposal && (!proposal || !isGuideSourceValid(center, courseId, proposal.source))) continue
        const id = uid()
        center.notes.push({ id, courseId, title: item.headline.trim(), content: origin === 'manual' ? details.trim() : '', type: group === 'expectations' ? 'exam-review' : 'other', kind: 'about-class', topicIds: [], linkedFileIds: proposal?.source.sourceFileId ? [proposal.source.sourceFileId] : [], syncStatus: 'local-only', createdAt: now, updatedAt: now, order: center.notes.length,
          studentGuidance: { group, scope: parseGuideScope(scope), origin, ...(origin !== 'manual' ? { originalText: item.originalText } : {}) },
          ...(proposal ? { guideProposalId: proposal.id, guideSourceRefs: [{ ...proposal.source }] } : {}),
        })
        savedCount += 1
        if (proposal) Object.assign(proposal, { status: 'accepted', acceptedNoteId: id, updatedAt: now })
      }
    })
    if (!savedCount) { setMessage('The lecture source changed. Review a current suggestion before saving.'); return }
    setHeadline(''); setDetails(''); setScope(''); setGroup('emphasis'); setSuggestions([]); setRaw(''); setMessage('Saved. Matching future notebooks and flashcards will use your Guide.')
  }
  return <div className="space-y-6" data-testid="student-guide">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-2xl font-extrabold">Guide</h2><p className="mt-1 text-sm text-muted-foreground">Your study direction, expectations, and useful class information in one place. Study guidance shapes future notebooks and flashcards.</p></div></header>
    <GuideImport courseId={courseId} data={data} />
    <form className="rounded-xl border border-border bg-card p-4" onSubmit={event => { event.preventDefault(); save([{ headline, originalText: '', selected: true }], 'manual') }}>
      <label className="block text-sm font-bold" htmlFor="guide-headline">What should guide your studying?</label>
      <div className="mt-2 flex flex-wrap gap-2"><Input id="guide-headline" className="min-w-0 flex-1 basis-56" maxLength={180} value={headline} onChange={event => setHeadline(event.target.value)} placeholder="Explain why a case detail matters" /><Button disabled={!headline.trim()} type="submit"><Plus className="size-4" />Add</Button></div>
      <details className="mt-3 text-sm"><summary className="cursor-pointer py-2 font-semibold">Group, scope, or supporting notes</summary><div className="mt-2 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Group<select className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3" value={group} onChange={e => setGroup(e.target.value as GuideGroup)}>{Object.entries(GUIDE_GROUPS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><GuideScopeField courseId={courseId} data={data} value={scope} onChange={setScope} /><label className="sm:col-span-2">Supporting notes (optional)<Textarea className="mt-1" value={details} onChange={e => setDetails(e.target.value)} /></label></div></details>
    </form>
    <p role="status" className="text-sm text-muted-foreground">{message}</p>
    {Object.entries(GUIDE_GROUPS).map(([key, label]) => <section key={key} aria-label={label}><h3 className="mb-2 font-display text-lg font-bold">{label}</h3><div className="divide-y divide-border rounded-xl border border-border bg-card px-4">{notes.filter(note => note.studentGuidance?.group === key).map(note => <StudentGuideRow key={note.id} note={note} data={data} />)}{!notes.some(note => note.studentGuidance?.group === key) && <p className="py-4 text-sm text-muted-foreground">Add a short note above.</p>}</div></section>)}
    <details className="rounded-xl border border-border p-4"><summary className="cursor-pointer font-semibold">Paste rough notes</summary><p className="my-3 text-sm text-muted-foreground">Extract lines and sentences, then edit them into useful headlines. Nothing is saved until you choose it. Your original text stays attached.</p><Textarea aria-label="Rough Guide notes" value={raw} onChange={e => { setRaw(e.target.value); setSuggestions([]) }} className="min-h-28" /><Button className="mt-3" variant="outline" disabled={!raw.trim()} onClick={() => setSuggestions(extractGuideHeadlines(raw).map(item => ({ ...item, originalText: raw, selected: true })))}>Review headlines</Button></details>
    <details className="rounded-xl border border-border p-4"><summary className="cursor-pointer font-semibold">Suggestions from lectures · {pending.length}</summary><p className="my-3 text-sm text-muted-foreground">Review transcript suggestions before using them. Unaccepted suggestions never guide your materials.</p>{pending.map(proposal => <div key={proposal.id} className="border-t border-border py-3"><p className="font-semibold">{proposal.draftTitle}</p><details className="my-2 text-sm"><summary className="cursor-pointer">View lecture evidence</summary><p className="mt-2 whitespace-pre-wrap">{proposal.source.sourcePassage}</p><p className="text-muted-foreground">{proposal.source.sourceLabel} · {proposal.source.sourceLocation}</p></details><Button variant="outline" onClick={() => { setScope(''); setSuggestions([{ headline: extractGuideHeadlines(proposal.draftText)[0]?.headline ?? proposal.draftTitle.slice(0, 180), originalText: proposal.draftText, selected: true, proposal }]) }}>Review as a headline</Button></div>)}{!pending.length && <p className="text-sm text-muted-foreground">No transcript suggestions yet. You can always add your own note above.</p>}</details>
    {!!suggestions.length && <section aria-label="Review Guide headlines" className="rounded-xl border border-primary p-4"><h3 className="font-display text-lg font-bold">Review headlines</h3><p className="my-2 text-sm text-muted-foreground">Edit each statement, uncheck anything you don’t want, and choose where it applies.</p><GuideScopeField courseId={courseId} data={data} value={scope} onChange={setScope} /><label className="mt-3 block text-sm font-semibold">Group<select className="ml-2 min-h-11 rounded border border-border bg-background p-2" value={group} onChange={e => setGroup(e.target.value as GuideGroup)}>{Object.entries(GUIDE_GROUPS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>{suggestions.map((item, index) => <div key={index} className="my-3 flex items-center gap-3"><input type="checkbox" aria-label={`Include headline ${index + 1}`} checked={item.selected} onChange={e => setSuggestions(current => current.map((x, i) => i === index ? { ...x, selected: e.target.checked } : x))} /><Input aria-label={`Suggested headline ${index + 1}`} maxLength={180} value={item.headline} onChange={e => setSuggestions(current => current.map((x, i) => i === index ? { ...x, headline: e.target.value } : x))} /></div>)}<div className="flex gap-2"><Button onClick={() => save(suggestions, suggestions.some(item => item.proposal) ? 'transcript' : 'paste')} disabled={!suggestions.some(item => item.selected && item.headline.trim())}>Save selected headlines</Button><Button variant="ghost" onClick={() => { setSuggestions([]); setScope(''); setGroup('emphasis') }}>Cancel</Button></div></section>}
  </div>
}

function StudentGuideRow({ note, data }: { note: ClassNote; data: ClassCenterData }) {
  const [editing, setEditing] = useState(false), [headline, setHeadline] = useState(note.title), [details, setDetails] = useState(note.content)
  const [group, setGroup] = useState<GuideGroup>(note.studentGuidance!.group), [scope, setScope] = useState(guideScopeValue(note.studentGuidance!.scope))
  function save() {
    useStore.getState().update(state => { const target = state.academics.classCenter.notes.find(item => item.id === note.id); if (target?.studentGuidance && headline.trim()) { target.title = headline.trim(); target.content = details; target.studentGuidance.group = group; target.studentGuidance.scope = parseGuideScope(scope); target.updatedAt = Date.now() } })
    setEditing(false)
  }
  return <article className="py-3">
    {editing ? <form className="space-y-3" onSubmit={e => { e.preventDefault(); save() }}><Input aria-label="Edit Guide headline" maxLength={180} value={headline} onChange={e => setHeadline(e.target.value)} /><label className="block text-sm">Supporting notes<Textarea value={details} onChange={e => setDetails(e.target.value)} /></label><GuideScopeField courseId={note.courseId} data={data} value={scope} onChange={setScope} /><label className="block text-sm">Group<select value={group} onChange={e => setGroup(e.target.value as GuideGroup)} className="ml-2 min-h-11 rounded border border-border bg-background p-2">{Object.entries(GUIDE_GROUPS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><Button disabled={!headline.trim()}>Save</Button><Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></form> : <><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="break-words font-semibold">{note.title}</p><p className="mt-1 text-xs text-muted-foreground">{guideScopeLabel(note.studentGuidance!.scope, data)}</p></div><Button variant="ghost" size="icon" aria-label={`Edit ${note.title}`} onClick={() => { setHeadline(note.title); setDetails(note.content); setGroup(note.studentGuidance!.group); setScope(guideScopeValue(note.studentGuidance!.scope)); setEditing(true) }}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" title="Keep as reference only" aria-label={`Keep ${note.title} as reference only`} onClick={() => useStore.getState().update(state => { const target = state.academics.classCenter.notes.find(item => item.id === note.id); if (target) { const original = target.studentGuidance?.originalText; if (original) target.content = [target.content, original].filter(Boolean).join('\n\n'); delete target.studentGuidance; target.updatedAt = Date.now() } })}><X className="size-4" /></Button></div>{(note.content || note.studentGuidance?.originalText || note.guideSourceRefs?.length) && <details className="mt-2 text-sm"><summary className="cursor-pointer text-muted-foreground">Supporting notes and source</summary>{note.content && <p className="mt-2 whitespace-pre-wrap">{note.content}</p>}{note.studentGuidance?.originalText && <p className="mt-2 whitespace-pre-wrap">{note.studentGuidance.originalText}</p>}{note.guideSourceRefs?.map((source, index) => <p key={index} className="mt-2 whitespace-pre-wrap">{source.sourceLabel}: {source.sourcePassage}</p>)}</details>}</>}
  </article>
}
