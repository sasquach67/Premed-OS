import { useEffect, useRef, useState } from 'react'
import { prepareAccountConflictResolution } from '@/store/accountMutationSafety'
import { type AccountConflict } from '@/store/accountSyncSafety'
import type { AppData } from '@/lib/types'
import { compareAccountCopies } from '@/store/accountCopyComparison'

const counts = (data: AppData) => ({
  Classes: data.courses.length,
  Tasks: data.tasks.length,
  Assignments: (data.academics?.classCenter?.assignments?.length ?? 0),
  'Lectures / notebooks': (data.academics?.classCenter?.lectures?.length ?? 0),
  Materials: (data.academics?.classCenter?.files?.length ?? 0),
})
type Review = Awaited<ReturnType<typeof prepareAccountConflictResolution>>

export function AccountConflictReview({ userId, conflict }: { userId: string; conflict: AccountConflict }) {
  const [prepared, setPrepared] = useState<{ review: Review; conflict: AccountConflict }>()
  const review = prepared?.conflict === conflict ? prepared.review : undefined
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [choice, setChoice] = useState<'device' | 'cloud'>()
  const [confirmed, setConfirmed] = useState(false)
  const held = useRef<Review | undefined>(undefined)
  const generation = useRef(0)
  useEffect(() => () => { generation.current++; held.current?.dispose(); held.current = undefined }, [userId, conflict])
  async function open() {
    const current = ++generation.current
    setBusy(true); setError(''); setChoice(undefined); setConfirmed(false)
    held.current?.dispose(); held.current = undefined; setPrepared(undefined)
    try {
      const next = await prepareAccountConflictResolution(userId, conflict)
      if (current !== generation.current) { next.dispose(); return }
      held.current = next; setPrepared({ review: next, conflict })
    } catch (cause) { if (current === generation.current) setError(cause instanceof Error ? cause.message : 'Could not compare account copies.') }
    finally { if (current === generation.current) setBusy(false) }
  }
  async function apply() {
    if (!review || !choice || !confirmed || busy) return
    setBusy(true); setError('')
    try { await review.apply(choice) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The choice could not be saved.'); setConfirmed(false); held.current = undefined; setPrepared(undefined) }
    finally { setBusy(false) }
  }
  const differences = review ? compareAccountCopies(review.device, review.cloud) : []
  return <div className="mt-4 space-y-3 border-t border-border pt-3">
    <button type="button" className="rounded-md border border-border px-3 py-2 font-semibold" disabled={busy} onClick={() => void open()}>{busy ? 'Checking saved copies…' : review ? 'Refresh comparison' : 'Compare copies and resume sync'}</button>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {review && <section aria-label="Compare account copies" className="space-y-3">
      <p>Cloud saved {new Date(review.updatedAt).toLocaleString()}. Choose the complete workspace you want to use. This does not merge the copies. Both previous versions have verified recovery copies; keep the downloads too.</p>
      <table className="w-full max-w-xl text-left text-sm"><thead><tr><th className="py-1">Saved records</th><th>This device</th><th>Cloud</th></tr></thead><tbody>{Object.entries(counts(review.device)).map(([label, count]) => <tr key={label}><th className="py-1 font-normal">{label}</th><td>{count}</td><td>{counts(review.cloud)[label as keyof ReturnType<typeof counts>]}</td></tr>)}</tbody></table>
      <p>{differences.length ? `${differences.length === 60 ? 'First 60' : differences.length} differences shown below. Long values are shortened; downloads contain the full content.` : 'The shared account content matches.'}</p>
      <div className="max-h-80 overflow-auto rounded-md border border-border" tabIndex={0} aria-label="Account differences">
        <table className="w-full table-fixed text-left text-xs"><thead><tr><th className="p-2">Changed field</th><th className="p-2">This device</th><th className="p-2">Cloud</th></tr></thead><tbody>{differences.map(diff => <tr key={diff.path} className="border-t border-border align-top"><th className="break-words p-2 font-medium">{diff.path}</th><td className="break-words p-2">{diff.device}</td><td className="break-words p-2">{diff.cloud}</td></tr>)}</tbody></table>
      </div>
      <fieldset disabled={busy} className="space-y-2"><legend className="mb-2 font-semibold">Which copy should be used?</legend>
        <label className="flex items-start gap-2"><input type="radio" name="account-copy-choice" checked={choice === 'device'} onChange={() => { setChoice('device'); setConfirmed(false) }} /><span>Use this device — replace the cloud workspace with this device’s saved copy.</span></label>
        <label className="flex items-start gap-2"><input type="radio" name="account-copy-choice" checked={choice === 'cloud'} onChange={() => { setChoice('cloud'); setConfirmed(false) }} /><span>Use cloud — replace this device’s workspace with the cloud copy. Private local-only stories stay on this device.</span></label>
        <label className="flex items-start gap-2"><input type="checkbox" checked={confirmed} disabled={!choice} onChange={event => setConfirmed(event.target.checked)} /><span>I reviewed the differences and want to use the selected copy.</span></label>
      </fieldset>
      <button type="button" className="rounded-md bg-primary px-3 py-2 font-semibold text-primary-foreground disabled:opacity-50" disabled={busy || !choice || !confirmed} onClick={() => void apply()}>Use selected copy and resume sync</button>
    </section>}
  </div>
}
