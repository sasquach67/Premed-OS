import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, Cloud, FileQuestion, FolderOpen, Link2, RefreshCw, Unplug } from 'lucide-react'
import type { Course, WatchedNoteProposal } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { supabase } from '@/lib/supabase'
import { discoverLocalFolderManifest, localFolderCapability } from '@/lib/academics/localFolderDiscovery'
import { acceptWatchedNotesProposal, addWatchedNotesSource, confirmWatchedNotesMapping, intakeWatchedNotesManifest } from '@/lib/academics/watchedNotes'
import { beginGoogleDriveMaterialConnection, disconnectGoogleDriveMaterialConnection, googleDriveMaterialConnectionStatus, listGoogleDriveMaterialManifest, recordAcceptedGoogleDriveMaterial } from '@/lib/academics/googleDriveMaterialSourceClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const PANEL = 'rounded-2xl border border-[#3c352d] bg-[#2b2722]'
const INNER = 'rounded-[13px] border border-[#3c352d] bg-[#322e28]'
const RECOVERY = 'rounded-[13px] border border-dashed border-[#3c352d] bg-[#262320]'
type DriveState = 'checking' | 'available' | 'unavailable' | 'connected' | 'reconnect'

function categoryLabel(value: WatchedNoteProposal['proposedCategory']) { return value ? value.replace(/-/g, ' ') : 'Unfiled' }
function fileIdFor(proposal: WatchedNoteProposal) { return proposal.sourceIdentity?.match(/^gdrive:([^:]+):/)?.[1] }

/** Temporary Materials substate: selected folders create review proposals, never silent materials. */
export function MaterialFolderIntake({ course, onBack }: { course: Course; onBack: () => void }) {
  const update = useStore((state) => state.update)
  const currentData = useStore((state) => state.academics.classCenter)
  const [activeSourceId, setActiveSourceId] = useState<string>()
  const [notice, setNotice] = useState('Choose a notes folder to prepare a review. No file is added yet.')
  const [busy, setBusy] = useState(false)
  const [weekDrafts, setWeekDrafts] = useState<Record<string, string>>({})
  const [driveFolderId, setDriveFolderId] = useState('')
  const [driveLabel, setDriveLabel] = useState('')
  const [driveState, setDriveState] = useState<DriveState>('checking')
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const localCapability = localFolderCapability()
  const activeSource = currentData.watchedNoteSources.find((source) => source.id === activeSourceId)
  const proposals = useMemo(() => currentData.watchedNoteProposals.filter((proposal) => proposal.sourceId === activeSourceId && proposal.status === 'pending'), [activeSourceId, currentData.watchedNoteProposals])
  const acceptedCount = currentData.watchedNoteProposals.filter((proposal) => proposal.sourceId === activeSourceId && proposal.status === 'accepted').length

  async function refreshDriveStatus() {
    if (!supabase) return setDriveState('unavailable')
    try {
      const status = await googleDriveMaterialConnectionStatus(supabase)
      if (!status.ok) {
        setNotice(status.message)
        return setDriveState(status.reason === 'grant-expired' ? 'reconnect' : 'unavailable')
      }
      setDriveState(status.connection?.state === 'connected' ? 'connected' : status.connection?.state === 'needs-reconnect' ? 'reconnect' : 'available')
      if (status.connection?.state === 'connected') setDriveLabel(status.connection.rootLabel)
    } catch {
      setDriveState('unavailable')
      setNotice('Google Drive could not be checked. Local folders and individual files still work.')
    }
  }
  useEffect(() => { void refreshDriveStatus() }, [])

  async function chooseLocalFolder() {
    setBusy(true)
    try {
      const result = await discoverLocalFolderManifest({ fromUserGesture: true })
      if (!result.ok) return setNotice(result.reason)
      let sourceId = ''; let created = 0
      update((draft) => {
        const source = addWatchedNotesSource(draft.academics.classCenter, { provider: 'local-folder', rootLabel: result.rootLabel, courseId: course.id })
        if (!source) return
        sourceId = source.id
        created = intakeWatchedNotesManifest({ center: draft.academics.classCenter, sourceId, entries: result.entries, courses: draft.courses }).created.length
      })
      if (!sourceId) return
      setActiveSourceId(sourceId)
      setNotice(created ? `${created} file${created === 1 ? '' : 's'} are ready for your review.` : 'No new readable files were found in that folder.')
    } catch {
      setNotice('That folder could not be read. Choose it again or add individual files instead.')
    } finally {
      setBusy(false)
    }
  }

  async function startDrive() {
    if (!supabase) return setDriveState('unavailable')
    setBusy(true)
    try {
      const result = await beginGoogleDriveMaterialConnection(supabase, {
        folderId: driveFolderId.trim(), rootLabel: driveLabel.trim(), returnTo: window.location.hash,
      })
      if (!result.ok) { setDriveState(result.reason === 'grant-expired' ? 'reconnect' : 'unavailable'); return setNotice(result.message) }
      window.location.assign(result.authorizeUrl)
    } catch {
      setDriveState('unavailable')
      setNotice('Google Drive could not start the connection. Local folders and individual files still work.')
    } finally {
      setBusy(false)
    }
  }

  async function reviewDriveFolder() {
    if (!supabase) return
    setBusy(true)
    try {
      const result = await listGoogleDriveMaterialManifest(supabase)
      if (!result.ok) { setDriveState(result.reason === 'grant-expired' ? 'reconnect' : 'unavailable'); return setNotice(result.message) }
      let sourceId = ''; let created = 0
      update((draft) => {
        const source = addWatchedNotesSource(draft.academics.classCenter, { id: result.value.connection.id, provider: 'google-drive', rootLabel: result.value.connection.rootLabel, courseId: course.id })
        if (!source) return
        sourceId = source.id
        created = intakeWatchedNotesManifest({ center: draft.academics.classCenter, sourceId, entries: result.value.entries, courses: draft.courses }).created.length
      })
      setActiveSourceId(sourceId)
      setNotice(created ? `${created} Drive file${created === 1 ? '' : 's'} are ready for review. Google-native documents stay unavailable until export is designed.` : 'There are no new supported files to review in this connected folder.')
    } catch {
      setDriveState('unavailable')
      setNotice('Google Drive could not review this folder. Reconnect it or use a local folder instead.')
    } finally {
      setBusy(false)
    }
  }

  function confirmWeek(proposalId: string) {
    const entered = weekDrafts[proposalId]?.trim()
    if (!/^week\s+\d+$/i.test(entered)) return
    update((draft) => {
      const proposal = draft.academics.classCenter.watchedNoteProposals.find((item) => item.id === proposalId)
      if (!proposal) return
      proposal.proposedWeek = entered.replace(/^week\s+/i, 'Week ')
      proposal.mappingConfidence = 'confirmed'; proposal.updatedAt = Date.now()
      const level = proposal.displayPath.split('/').find((item) => /^week\s*\d+$/i.test(item))
      if (level) confirmWatchedNotesMapping({ center: draft.academics.classCenter, sourceId: proposal.sourceId, mapping: { logicalLevel: level, courseId: course.id, week: proposal.proposedWeek, category: proposal.proposedCategory } })
    })
  }

  async function acceptProposal(proposal: WatchedNoteProposal) {
    if (!proposal.proposedWeek) return setNotice('Confirm a week or keep this file unfiled. Nothing was added.')
    if (activeSource?.provider === 'google-drive' && supabase) {
      const fileId = fileIdFor(proposal)
      if (!fileId || !proposal.sourceIdentity) return setNotice('This Drive file cannot be verified for acceptance. It remains in review.')
      const recorded = await recordAcceptedGoogleDriveMaterial(supabase, { fileId, contentIdentity: proposal.sourceIdentity })
      if (!recorded.ok) return setNotice(recorded.message)
    }
    update((draft) => { acceptWatchedNotesProposal({ center: draft.academics.classCenter, proposalId: proposal.id, courseId: course.id }) })
    setNotice(`${proposal.displayName} was added as a metadata-only material. Its source file was not copied or changed.`)
  }

  async function disconnectDrive() {
    if (!supabase) return
    const result = await disconnectGoogleDriveMaterialConnection(supabase)
    if (!result.ok) setNotice(result.message)
    else { setDriveState('available'); setNotice('Google Drive disconnected. Accepted materials and review history remain here.') }
    setDisconnectOpen(false)
  }

  return <section className="space-y-4" aria-label="Connect a notes folder">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><Button variant="ghost" size="sm" className="-ml-2" onClick={onBack}><ArrowLeft className="size-4" /> Materials</Button><h2 className="mt-2 font-display text-2xl font-extrabold">Connect a notes folder</h2><p className="mt-1 max-w-2xl text-sm font-semibold text-muted-foreground">Preview placement first. Premed OS never edits, moves, or silently imports a source file.</p></div><Badge variant="outline">{course.code}</Badge></div>
    <div className="grid gap-3 xl:grid-cols-[14rem_minmax(0,1fr)_16rem]">
      <aside className={cn(PANEL, 'h-fit p-3.5')}><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">Sources</p><div className="mt-3 space-y-2"><Button className="w-full justify-start" variant="outline" disabled={busy || !localCapability.available} onClick={() => void chooseLocalFolder()}><FolderOpen className="size-4" /> Choose local folder</Button>{!localCapability.available && <div className={cn(RECOVERY, 'p-3 text-xs font-semibold text-muted-foreground')}><FileQuestion className="mb-2 size-4 text-primary" />{localCapability.reason}<Button variant="link" size="sm" className="mt-2 h-auto p-0" onClick={onBack}>Add individual files instead</Button></div>}<div className={cn(INNER, 'p-3')}><div className="flex items-center gap-2"><Cloud className="size-4 text-primary" /><p className="font-display text-sm font-extrabold">Google Drive</p></div>{driveState === 'connected' ? <div className="mt-2 space-y-2"><p className="text-xs font-semibold text-muted-foreground">{driveLabel || 'Connected folder'}</p><Button size="sm" className="w-full" variant="outline" disabled={busy} onClick={() => void reviewDriveFolder()}><RefreshCw className="size-3.5" /> Review folder</Button><Button size="sm" className="w-full" variant="ghost" onClick={() => setDisconnectOpen(true)}><Unplug className="size-3.5" /> Disconnect</Button></div> : driveState === 'unavailable' ? <p className="mt-2 text-xs font-semibold text-muted-foreground">Drive is not configured here yet. Local folders and individual files still work.</p> : <div className="mt-2 space-y-2"><Input aria-label="Google Drive folder ID" value={driveFolderId} onChange={(event) => setDriveFolderId(event.target.value)} placeholder="Folder ID" /><Input aria-label="Google Drive folder label" value={driveLabel} onChange={(event) => setDriveLabel(event.target.value)} placeholder="Folder label" /><Button size="sm" className="w-full" variant="outline" disabled={busy || !driveFolderId.trim() || !driveLabel.trim() || driveState === 'checking'} onClick={() => void startDrive()}><Link2 className="size-3.5" /> Connect Drive folder</Button>{driveState === 'reconnect' && <p className="text-xs font-semibold text-muted-foreground">Reconnect Google Drive to review this folder again.</p>}</div>}</div></div></aside>
      <article className={cn(PANEL, 'min-w-0 p-4')}><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">Placement review</p><h3 className="mt-1 font-display text-lg font-extrabold">{activeSource ? activeSource.rootLabel : 'Choose a source to begin'}</h3><p className="mt-1 text-sm font-semibold text-muted-foreground">{notice}</p>{!activeSource && <div className={cn(RECOVERY, 'mt-4 p-5 text-sm font-semibold text-muted-foreground')}>A folder creates a review preview only. You decide the exact course, week, and category before anything appears in Materials.</div>}{!!activeSource && <div className="mt-4 space-y-2">{proposals.map((proposal) => <div key={proposal.id} className={cn(INNER, 'grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_12rem_auto] lg:items-center')}><div className="min-w-0"><p className="truncate font-display text-sm font-extrabold">{proposal.displayName}</p><p className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">{proposal.displayPath}</p></div><div><p className="text-xs font-bold text-muted-foreground">{categoryLabel(proposal.proposedCategory)} · {proposal.proposedWeek || 'week needs confirmation'}</p>{!proposal.proposedWeek && <div className="mt-2 flex gap-1"><Input aria-label={`Week for ${proposal.displayName}`} value={weekDrafts[proposal.id] ?? ''} onChange={(event) => setWeekDrafts((current) => ({ ...current, [proposal.id]: event.target.value }))} placeholder="Week 3" /><Button size="sm" variant="outline" disabled={!/^week\s+\d+$/i.test(weekDrafts[proposal.id] ?? '')} onClick={() => confirmWeek(proposal.id)}>Confirm week</Button></div>}</div><Button size="sm" disabled={!proposal.proposedWeek} onClick={() => void acceptProposal(proposal)}><Check className="size-3.5" /> Accept</Button></div>)}{!proposals.length && <div className={cn(RECOVERY, 'p-4 text-sm font-semibold text-muted-foreground')}>No pending files need a decision. Unchanged and accepted items stay out of the review list.</div>}</div>}</article>
      <aside className={cn(PANEL, 'h-fit p-3.5')}><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">Review rail</p><p className="mt-1 font-display text-sm font-extrabold">You stay in control</p><ul className="mt-3 space-y-2 text-xs font-semibold text-muted-foreground"><li>• File before acceptance: no material is created.</li><li>• Confirm a specific week; no broad folder rule is guessed.</li><li>• Keep unfiled or return later without deleting history.</li></ul>{acceptedCount > 0 && <p className="mt-4 border-t border-[#3c352d] pt-3 text-xs font-semibold text-muted-foreground">{acceptedCount} accepted item{acceptedCount === 1 ? '' : 's'} remain visible in history.</p>}</aside>
    </div>
    <Dialog open={disconnectOpen} onOpenChange={setDisconnectOpen}><DialogContent className="!bg-[#2b2722] !text-[#ece3d4]"><DialogHeader><DialogTitle>Disconnect Google Drive?</DialogTitle><DialogDescription>Your accepted Materials, placement decisions, and review history stay in Premed OS. Only the cloud connection is removed.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDisconnectOpen(false)}>Keep connected</Button><Button variant="destructive" onClick={() => void disconnectDrive()}>Disconnect Drive</Button></DialogFooter></DialogContent></Dialog>
  </section>
}
