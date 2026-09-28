import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { prepareAccountConflictResolution } from '@/store/accountMutationSafety'
import { type AccountConflict } from '@/store/accountSyncSafety'
import type { AppData } from '@/lib/types'
import { compareAccountCopies } from '@/store/accountCopyComparison'
import { accountCopySavedTime, accountCopyUniqueSummary, newestAccountCopy } from '@/store/accountCopyPresentation'
import { Button } from '@/components/ui/button'

const counts = (data: AppData) => ({
  Classes: data.courses.length,
  Tasks: data.tasks.length,
  Assignments: (data.academics?.classCenter?.assignments?.length ?? 0),
  'Lectures / notebooks': (data.academics?.classCenter?.lectures?.length ?? 0),
  Materials: (data.academics?.classCenter?.files?.length ?? 0),
})
type Review = Awaited<ReturnType<typeof prepareAccountConflictResolution>>

export function AccountConflictReview({ userId, conflict, downloads }: { userId: string; conflict: AccountConflict; downloads?: ReactNode }) {
  const [prepared, setPrepared] = useState<{ review: Review; conflict: AccountConflict }>()
  const review = prepared?.conflict === conflict ? prepared.review : undefined
  const [busyFor, setBusyFor] = useState<AccountConflict>()
  const busy = busyFor === conflict
  const [failure, setFailure] = useState<{ conflict: AccountConflict; message: string }>()
  const error = failure?.conflict === conflict ? failure.message : ''
  const [choice, setChoice] = useState<'device' | 'cloud'>()
  const [confirmed, setConfirmed] = useState(false)
  const [saveProgress, setSaveProgress] = useState<{ conflict: AccountConflict; message: string }>()
  const held = useRef<Review | undefined>(undefined)
  const generation = useRef(0)
  const readable = conflict.saved && !conflict.schemaBlocked && !conflict.open && !!conflict.localRaw && !!conflict.remote
  const open = useCallback(async () => {
    if (!readable) return
    const current = ++generation.current
    setBusyFor(conflict); setFailure(undefined); setChoice(undefined); setConfirmed(false); setSaveProgress(undefined)
    held.current?.dispose(); held.current = undefined; setPrepared(undefined)
    try {
      const next = await prepareAccountConflictResolution(userId, conflict)
      if (current !== generation.current) { next.dispose(); return }
      held.current = next; setPrepared({ review: next, conflict })
    } catch (cause) { if (current === generation.current) setFailure({ conflict, message: cause instanceof Error ? cause.message : 'Could not compare account copies.' }) }
    finally { if (current === generation.current) setBusyFor(undefined) }
  }, [userId, conflict, readable])
  const close = useCallback(() => { generation.current++; held.current?.dispose(); held.current = undefined }, [])
  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => { if (!cancelled) void open() })
    return () => { cancelled = true; close() }
  }, [open, close])
  async function apply(selected: 'device' | 'cloud') {
    if (!review || busy) return
    const current = ++generation.current
    let acceptingProgress = true
    setBusyFor(conflict); setFailure(undefined); setChoice(selected)
    setSaveProgress({ conflict, message: 'Preparing your choice…' })
    try { await review.apply(selected, message => {
      if (acceptingProgress && current === generation.current) setSaveProgress({ conflict, message })
    }) }
    catch (cause) { if (current === generation.current) { setFailure({ conflict, message: cause instanceof Error ? cause.message : 'The choice could not be saved.' }); setConfirmed(false); held.current = undefined; setPrepared(undefined) } }
    finally { acceptingProgress = false; if (current === generation.current) { setBusyFor(undefined); setSaveProgress(undefined) } }
  }
  const differences = review ? compareAccountCopies(review.device, review.cloud) : []
  const newest = review ? newestAccountCopy(review.deviceSavedAt, review.updatedAt) : null
  if (!readable) return null
  return <div className="mt-3 min-w-0 space-y-3">
    {busy && review && choice && <p className="font-semibold">Keeping: {choice === 'device' ? 'This device' : 'Cloud'}</p>}
    {busy && <p role="status" aria-live="polite">{review ? (saveProgress?.conflict === conflict ? saveProgress.message : 'Preparing your choice…') : 'Checking saved copies…'}</p>}
    {error && <p role="alert" className="break-words text-destructive">{error}</p>}
    {!review && !busy && <Button type="button" variant="outline" onClick={() => void open()}>Retry checking copies</Button>}
    {!review && downloads && <details className="min-w-0"><summary className="cursor-pointer font-semibold">Download saved copies</summary><div className="mt-3">{downloads}</div></details>}
    {review && <section aria-label="Choose an account copy" className="min-w-0 space-y-3">
      <dl className="space-y-3">
        <div><dt className="font-semibold">This device</dt><dd className="text-muted-foreground">{accountCopySavedTime(review.deviceSavedAt)}</dd><dd className="break-words">{accountCopyUniqueSummary(review.device, review.cloud, 'device')}</dd></div>
        <div><dt className="font-semibold">Cloud</dt><dd className="text-muted-foreground">{accountCopySavedTime(review.updatedAt)}</dd><dd className="break-words">{accountCopyUniqueSummary(review.cloud, review.device, 'cloud')}</dd></div>
      </dl>
      <p className="text-muted-foreground">Both copies are saved under Settings → Local data. Keeping one resumes sync. Unrecognized sections and private device-only stories are retained.</p>
      {newest ? <>
        <p className="text-muted-foreground">{newest === 'device' ? 'This device' : 'The cloud'} was saved more recently.</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy} aria-label={`Keep newest — ${newest === 'device' ? 'this device' : 'cloud'}`} onClick={() => void apply(newest)}>Keep newest</Button>
          <Button type="button" variant="outline" disabled={busy} aria-label={`Keep the other copy — ${newest === 'device' ? 'cloud' : 'this device'}`} onClick={() => void apply(newest === 'device' ? 'cloud' : 'device')}>Keep the other copy</Button>
        </div>
      </> : <>
        <p className="text-muted-foreground">The saved times do not identify a newer copy. Choose which one to keep.</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={() => void apply('device')}>Keep this device</Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => void apply('cloud')}>Keep cloud</Button>
        </div>
      </>}
      <details className="min-w-0 border-t border-border pt-3">
        <summary className="cursor-pointer rounded-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">See differences</summary>
        <div className="mt-3 min-w-0 space-y-3">
          {downloads}
          <p>Choose the copy to use for known sections. Unknown sections are carried through, including any missing from your choice; this review cannot delete them. Both previous versions have verified recovery copies; keep the downloads too.</p>
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Saved record counts"><table className="w-full max-w-xl text-left text-sm"><thead><tr><th className="py-1">Saved records</th><th>This device</th><th>Cloud</th></tr></thead><tbody>{Object.entries(counts(review.device)).map(([label, count]) => <tr key={label}><th className="py-1 font-normal">{label}</th><td>{count}</td><td>{counts(review.cloud)[label as keyof ReturnType<typeof counts>]}</td></tr>)}</tbody></table></div>
          <p>{differences.length ? `${differences.length === 60 ? 'First 60' : differences.length} differences shown below. Long values are shortened; downloads contain the full content.` : 'The known shared account sections match.'}</p>
          <div className="max-h-80 overflow-auto rounded-md border border-border" tabIndex={0} role="region" aria-label="Account differences">
            <table className="w-full table-fixed text-left text-xs"><thead><tr><th className="p-2">Changed field</th><th className="p-2">This device</th><th className="p-2">Cloud</th></tr></thead><tbody>{differences.map(diff => <tr key={diff.path} className="border-t border-border align-top"><th className="break-words p-2 font-medium">{diff.path}</th><td className="break-words p-2">{diff.device}</td><td className="break-words p-2">{diff.cloud}</td></tr>)}</tbody></table>
          </div>
          <fieldset disabled={busy} className="space-y-2"><legend className="mb-2 font-semibold">Which copy should be used?</legend>
            <label className="flex items-start gap-2"><input type="radio" name="account-copy-choice" checked={choice === 'device'} onChange={() => { setChoice('device'); setConfirmed(false) }} /><span>Use this device — replace known cloud sections with this device’s saved copy. Unknown sections are retained.</span></label>
            <label className="flex items-start gap-2"><input type="radio" name="account-copy-choice" checked={choice === 'cloud'} onChange={() => { setChoice('cloud'); setConfirmed(false) }} /><span>Use cloud — replace known device sections with the cloud copy. Unknown sections and private local-only stories stay on this device.</span></label>
            <label className="flex items-start gap-2"><input type="checkbox" checked={confirmed} disabled={!choice} onChange={event => setConfirmed(event.target.checked)} /><span>I reviewed the differences and want to use the selected copy.</span></label>
          </fieldset>
          <Button type="button" className="h-auto min-h-9 whitespace-normal" disabled={busy || !choice || !confirmed} onClick={() => choice && void apply(choice)}>Use selected copy and resume sync</Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => void open()}>Refresh comparison</Button>
        </div>
      </details>
    </section>}
  </div>
}
