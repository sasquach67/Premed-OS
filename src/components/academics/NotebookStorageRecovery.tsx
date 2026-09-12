import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { captureWorkspaceIdentity, useStore } from '@/store/store'
import { WorkspaceChangedError } from '@/store/storageHealth'
import { commitWorkspaceOptimization, prepareWorkspaceOptimization, workspaceRecoveryExport, type WorkspaceOptimizationPlan } from '@/store/workspaceOptimization'
import { downloadNotebookText } from './ExternalNotebookView'

/** Available again under Other import options after reload, not only on failure. */
export function WorkspaceRecoveryDownload({ disabled = false }: { disabled?: boolean }) {
  const [message, setMessage] = useState(''), [working, setWorking] = useState(false)
  async function download() {
    setWorking(true); setMessage('')
    try { const backup = await workspaceRecoveryExport(); downloadNotebookText(backup.filename, backup.text); setMessage('Recovery JSON download requested. Keep your original notebook folders or ZIPs for the image files.') }
    catch (error) { setMessage((error as Error).message) }
    finally { setWorking(false) }
  }
  return <div><Button variant="outline" disabled={disabled || working} onClick={() => void download()}>{working ? 'Reading recovery copy…' : 'Download workspace recovery JSON'}</Button><p className="en-muted">Includes saved text, source details, edits, progress and history from before optimization. Image files stay on this device; keep their original folders or ZIPs. Restore this JSON through Settings → Import JSON.</p>{message && <p role="status">{message}</p>}</div>
}

const megabytes = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)} MiB`
type RecoveryProps = { onStart: () => () => void; onOptimized: () => void }
export function NotebookStorageRecovery(props: RecoveryProps) {
  useStore(state => state.academics)
  const owner = captureWorkspaceIdentity()
  return <RecoverySession key={`${owner.key}:${owner.epoch}`} {...props} />
}
function RecoverySession({ onStart, onOptimized }: RecoveryProps) {
  const attempt = useRef(0)
  const [plan, setPlan] = useState<WorkspaceOptimizationPlan | null>(null), [acknowledged, setAcknowledged] = useState(false)
  const [working, setWorking] = useState(false), [message, setMessage] = useState('')
  useEffect(() => () => { attempt.current++ }, [])
  function open() {
    setMessage(''); setAcknowledged(false)
    try { setPlan(prepareWorkspaceOptimization()) }
    catch (error) { setPlan(null); setMessage((error as Error).message) }
  }
  async function optimize() {
    if (!plan || !acknowledged || working) return
    const id = ++attempt.current, identity = captureWorkspaceIdentity()
    setWorking(true); const releaseBusy = onStart(); setMessage('Creating and checking the recovery copy…')
    try {
      await commitWorkspaceOptimization(plan, { otherTabsClosed: acknowledged })
      const current = captureWorkspaceIdentity()
      if (id === attempt.current && identity.key === current.key && identity.epoch === current.epoch) onOptimized()
    } catch (error) {
      if (id === attempt.current) {
        setMessage((error as Error).message)
        if (error instanceof WorkspaceChangedError) { setPlan(null); setAcknowledged(false) }
      }
    }
    finally { if (id === attempt.current) setWorking(false); releaseBusy() }
  }
  return <section className="en-storage-recovery" aria-label="Make room for this notebook">
    {!plan && <Button variant="outline" disabled={working} onClick={open}>Make room for this notebook</Button>}
    {plan && <>
      <h3>Make room for this notebook</h3>
      <p>Store repeated content more efficiently while keeping your sources, notes, progress and history. This may not free enough space for every notebook.</p>
      <p>Saved workspace: <strong>{megabytes(plan.bytesBefore)} → {megabytes(plan.bytesAfter)}</strong>. Other site data also uses browser storage.</p>
      <ol><li>Save unfinished work in every other Premed OS tab, then close those tabs. Keep this tab open. An older tab can overwrite newer saved work.</li><li>We will keep and verify a local recovery copy before changing storage. Your image files stay where they are; keep your original notebook folders or ZIPs.</li><li>Retry Save below when optimization finishes.</li></ol>
      <label className="en-check"><input type="checkbox" checked={acknowledged} disabled={working} onChange={event => setAcknowledged(event.target.checked)} />I saved my unfinished work and closed every other Premed OS tab.</label>
      <Button disabled={!acknowledged || working} onClick={() => void optimize()}>{working ? 'Making room…' : 'Create recovery copy and make room'}</Button>
    </>}
    {message && <p role="status">{message}</p>}
  </section>
}
