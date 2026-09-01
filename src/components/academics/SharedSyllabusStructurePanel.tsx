import { useState } from 'react'
import { EyeOff, LockKeyhole, Search, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/common/useToast'
import { correctSharedSyllabus, lookupSharedSyllabi, publishSharedSyllabus, revokeSharedSyllabus } from '@/lib/academics/sharedSyllabusClient'
import { diffSharedCandidate, sharedScopeIsComplete, stageAcceptedSharedItems, type SharedSyllabusCandidate, type SharedSyllabusScope } from '@/lib/academics/sharedSyllabusStructure'
import type { SyllabusProposal } from '@/lib/academics/syllabusParser'

type Props = { proposal: SyllabusProposal; courseCode: string; term: string; onStageCandidate: (items: SyllabusProposal['items']) => void }

/** #56 · A temporary import-flow branch. The disclosure boundary leads; any
 * network benefit is strictly secondary to the private-default choice. */
export function SharedSyllabusStructurePanel({ proposal, courseCode, term, onStageCandidate }: Props) {
  const [scope, setScope] = useState<SharedSyllabusScope>({ institution: '', courseCode, term, section: '' })
  const [confirmed, setConfirmed] = useState(false)
  const [candidate, setCandidate] = useState<SharedSyllabusCandidate | null>(null)
  const [published, setPublished] = useState<SharedSyllabusCandidate | null>(null)
  const [accepted, setAccepted] = useState<Set<string>>(new Set())
  const [working, setWorking] = useState<'publish' | 'lookup' | 'revoke' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const toast = useToast()
  const update = (key: keyof SharedSyllabusScope, value: string) => setScope((current) => ({ ...current, [key]: value }))
  const ready = sharedScopeIsComplete(scope)

  async function publish() {
    if (!confirmed || !ready) return
    setWorking('publish'); setMessage(null)
    try {
      const next = await publishSharedSyllabus(scope, proposal)
      setPublished(next)
      toast({ title: 'Parsed structure shared', description: 'Only the disclosure list left this device. The source document and text stayed private.' })
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Sharing is unavailable.') } finally { setWorking(null) }
  }
  async function lookup() {
    if (!ready) return
    setWorking('lookup'); setMessage(null)
    try {
      const result = await lookupSharedSyllabi(scope)
      setCandidate(result.candidates[0] ?? null)
      if (!result.candidates.length) setMessage('No shared structure matches this exact institution, course, term, and section. Your private import is ready to review.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Lookup is unavailable. Your private import is unaffected.') } finally { setWorking(null) }
  }
  async function revoke() {
    if (!published) return
    setWorking('revoke'); setMessage(null)
    try {
      await revokeSharedSyllabus(published.id)
      setPublished(null)
      toast({ title: 'Shared structure revoked', description: 'It will not appear in future lookups. Already confirmed private imports are unchanged.' })
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Revocation is unavailable.') } finally { setWorking(null) }
  }
  async function correct() {
    if (!candidate || !ready || !confirmed) return
    setWorking('publish'); setMessage(null)
    try {
      const next = await correctSharedSyllabus(candidate.id, scope, proposal)
      setPublished(next)
      toast({ title: 'Correction shared as a new revision', description: 'The reviewed candidate and every recipient’s private class stay unchanged.' })
    } catch (error) { setMessage(error instanceof Error ? error.message : 'The correction could not be shared.') } finally { setWorking(null) }
  }

  return (
    <section className="rounded-2xl border border-[#3c352d] bg-[#2b2722] p-4 text-[#f3ede3] shadow-[0_10px_26px_-14px_rgba(0,0,0,0.55)]">
      <div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 size-4 text-primary" /><div><h2 className="font-display text-base font-extrabold">Keep this parsed syllabus private by default</h2><p className="mt-1 text-xs font-semibold text-[#c5bbae]">Optional sharing contributes only a structured course outline for this term and section. It never uploads your source document or text.</p></div></div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[13px] border border-[#3c352d] bg-[#322e28] p-3"><p className="font-display text-xs font-extrabold uppercase tracking-wide text-primary">May share</p><p className="mt-1 text-xs font-semibold text-[#d9d0c4]">Unit titles, dates, grade-category names and weights. Public course logistics only when explicitly modeled.</p></div>
        <div className="rounded-[13px] border border-[#3c352d] bg-[#322e28] p-3"><p className="font-display text-xs font-extrabold uppercase tracking-wide text-[#e2a39a]">Never shared</p><p className="mt-1 text-xs font-semibold text-[#d9d0c4]">Your PDF or text, filename, notes, grades, study progress, edits, account identity, or contact information.</p></div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2"><label className="text-xs font-bold text-[#c5bbae]">Institution<Input value={scope.institution} onChange={(event) => update('institution', event.target.value)} className="mt-1 bg-[#211e1a]" placeholder="UNC Chapel Hill" /></label><label className="text-xs font-bold text-[#c5bbae]">Section<Input value={scope.section} onChange={(event) => update('section', event.target.value)} className="mt-1 bg-[#211e1a]" placeholder="001" /></label><label className="text-xs font-bold text-[#c5bbae]">Course<Input value={scope.courseCode} onChange={(event) => update('courseCode', event.target.value)} className="mt-1 bg-[#211e1a]" placeholder="BIOL 252" /></label><label className="text-xs font-bold text-[#c5bbae]">Term<Input value={scope.term} onChange={(event) => update('term', event.target.value)} className="mt-1 bg-[#211e1a]" placeholder="Fall 2026" /></label></div>
      <label className="mt-3 flex gap-2 rounded-[13px] border border-[#3c352d] bg-[#322e28] p-3 text-xs font-semibold text-[#d9d0c4]"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5" />I understand that sharing is optional and that only the listed parsed structure may leave this browser.</label>
      <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={lookup} disabled={!ready || working !== null}><Search className="size-4" /> {working === 'lookup' ? 'Checking…' : 'Look for a shared structure'}</Button><Button size="sm" onClick={publish} disabled={!ready || !confirmed || working !== null || Boolean(published)}><Share2 className="size-4" /> {working === 'publish' ? 'Sharing…' : published ? 'Shared' : 'Share this parsed structure'}</Button>{published && <Button size="sm" variant="ghost" onClick={revoke} disabled={working !== null}><EyeOff className="size-4" /> Stop sharing</Button>}</div>
      {candidate && <div className="mt-3 rounded-[13px] border border-[#3c352d] bg-[#322e28] p-3"><p className="font-display text-sm font-extrabold">A structure was shared by someone in this section</p><p className="mt-1 text-xs font-semibold text-[#c5bbae]">Parsed {new Date(candidate.parsedAt).toLocaleDateString()} · {candidate.independentParseCount} independent parse{candidate.independentParseCount === 1 ? '' : 's'} · {candidate.conflicts.length ? `${candidate.conflicts.length} conflicts need a look` : 'no conflicts reported'}</p><p className="mt-2 text-xs font-semibold text-[#d9d0c4]">Your private parsed syllabus stays in control. Every difference below starts as Keep.</p><div className="mt-2 space-y-2">{diffSharedCandidate(proposal.items, candidate).map((row) => <label key={row.key} className="flex items-center justify-between gap-3 rounded-lg border border-[#3c352d] p-2 text-xs"><span><b>{row.status === 'added' ? 'New' : 'Changed'} · {row.item.label}</b>{row.item.value ? ` · ${row.item.value}` : ''}</span><span className="flex items-center gap-1"><input type="checkbox" checked={accepted.has(row.key)} onChange={(event) => setAccepted((current) => { const next = new Set(current); if (event.target.checked) next.add(row.key); else next.delete(row.key); return next })} />Accept</span></label>)}</div><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" disabled={!accepted.size} onClick={() => onStageCandidate(stageAcceptedSharedItems(proposal.items, diffSharedCandidate(proposal.items, candidate), accepted))}>Stage accepted fields for review</Button><Button size="sm" variant="ghost" disabled={!confirmed || working !== null} onClick={correct}>Share a corrected parse</Button></div></div>}
      {message && <p className="mt-3 text-xs font-semibold text-[#e7c38f]">{message}</p>}
    </section>
  )
}
