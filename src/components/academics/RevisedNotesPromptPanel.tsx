import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { SelectField } from '@/components/ui/select-field'
import { Textarea } from '@/components/ui/textarea'
import { useStore } from '@/store/store'
import { buildRevisedNotesPrompt, validateRevisedNotesAddition } from '@/lib/academics/revisedNotes/prompt'
import { canonical } from '@/lib/academics/notebook/package'
import { createNotebookUpdateSession, notebookContentKey, notebookStateKey, notebookUpdateBaselineFilename } from '@/lib/academics/notebook/revision'
import { assertNotebookBackupFits } from '@/lib/academics/notebook/notebookBundle'
import type { NotebookUpdateSession } from '@/lib/academics/notebook/types'
import { downloadNotebookText, notebookTransaction } from './ExternalNotebookView'
import { NotebookUpdateImageFiles } from './NotebookPortableExports'
import { NotebookImportPanel } from './NotebookImportPanel'

export function RevisedNotesPromptPanel({ courseId, courseLabel, lectureId }: { courseId: string; courseLabel: string; lectureId?: string }) {
  const navigate = useNavigate()
  const lectures = useStore(state => state.academics.classCenter.lectures)
  const eligible = lectures.filter(item => item.courseId === courseId && item.importedNotebook?.current.entries.some(entry => entry.id === item.importedNotebook?.entryId))
  const [chosenId, setChosenId] = useState('')
  const [revision, setRevision] = useState<NotebookUpdateSession | null>(null)
  const [notesDescription, setNotesDescription] = useState('')
  const [additionalInstructions, setAdditionalInstructions] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [manualCopy, setManualCopy] = useState(false)
  const selectedId = lectureId ?? chosenId
  const lecture = eligible.find(item => item.id === selectedId)
  const notebook = lecture?.importedNotebook
  const activeRevision = revision?.localId === selectedId ? revision : null
  const fresh = Boolean(activeRevision && notebook && notebook.updateSession?.id === activeRevision.id && notebookContentKey(notebook) === canonical(activeRevision.baseline))
  const prompt = activeRevision ? buildRevisedNotesPrompt({ courseLabel, revision: activeRevision, notesDescription, additionalInstructions }) : ''

  async function prepare(restart = false) {
    if (!lecture || !notebook || busy) return
    setBusy(true); setMessage('')
    try {
      if (!restart && notebook.updateSession) {
        setRevision(notebook.updateSession)
      } else {
        await notebookTransaction(state => {
          const target = state.academics.classCenter.lectures.find(item => item.id === lecture.id && item.courseId === courseId)
          if (!target?.importedNotebook || notebookStateKey(target.importedNotebook) !== notebookStateKey(notebook)) throw new Error('This notebook changed. Reopen its latest saved content before preparing the prompt.')
          target.importedNotebook.updateSession = createNotebookUpdateSession(target.importedNotebook, target.id)
          if (target.importedNotebook.current.version !== 2 || target.importedNotebook.assetBindings?.length) assertNotebookBackupFits(target.importedNotebook, target.courseId)
        })
        setRevision(useStore.getState().academics.classCenter.lectures.find(item => item.id === lecture.id)?.importedNotebook?.updateSession ?? null)
      }
      setShowImport(false); setManualCopy(false)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'The prompt could not be prepared.') }
    finally { setBusy(false) }
  }

  async function copy() {
    if (!fresh || busy) return
    setBusy(true)
    try { await navigator.clipboard.writeText(prompt); setMessage('Complete prompt copied. Paste it into your AI chat with the baseline and your notes.') }
    catch { setManualCopy(true); setMessage('Clipboard unavailable. Copy the complete prompt below or download it.') }
    finally { setBusy(false) }
  }

  return <section className="space-y-5" aria-label="Revised notes prompt">
    <ol className="en-actions" aria-label="Revised notes steps"><li>1. Choose notebook</li><li>2. Copy prompt</li><li>3. Use your AI</li><li>4. Import revised notes</li></ol>
    <p>Improve the notes you wrote while keeping their organization and emphasis. Your AI adds the revised notes to the selected lecture; the existing study guide, Mastery Map, practice and personal notes stay intact.</p>
    {lectureId ? <div className="en-stage-panel"><h2>Selected Class Journal</h2><p>{lecture?.title ?? 'Journal unavailable in this class'}</p></div> : <label className="block space-y-2"><span>Class Journal</span><SelectField aria-label="Class Journal" value={selectedId} disabled={busy} onValueChange={id => { setChosenId(id); setRevision(null); setShowImport(false); setMessage('') }} options={[{ value: '', label: 'Choose a saved notebook' }, ...eligible.map(item => ({ value: item.id, label: item.title }))]} /></label>}
    {!lecture ? <div className="en-notice"><p>{lectureId ? 'This selected notebook is unavailable. Return to class and choose the intended notebook.' : 'Choose a saved notebook for this lecture before preparing your revised-notes prompt.'}</p><Button variant="outline" onClick={() => navigate(`/academics/classes/${encodeURIComponent(courseId)}/journal/new`)}>Create or import Class Journal</Button></div> : <>
      <label className="block space-y-2"><span>Which file contains your own notes? (optional)</span><Textarea value={notesDescription} onChange={event => { setNotesDescription(event.target.value); setMessage('') }} placeholder="e.g. My handwritten Lesson 3 notes.pdf" /><p className="en-muted">This identifies what you will attach in your AI chat. If unclear, the AI will ask which notes to revise. Your private notes and practice responses are not copied automatically.</p></label>
      <label className="block space-y-2"><span>Additional instructions (optional)</span><Textarea value={additionalInstructions} onChange={event => { setAdditionalInstructions(event.target.value); setMessage('') }} placeholder="e.g. Explain difficult ideas simply and keep my headings." /></label>
      {!activeRevision && <Button disabled={busy} onClick={() => void prepare()}>Prepare complete prompt</Button>}
      {activeRevision && <>
        {!fresh && <div className="en-notice" role="alert"><p>This notebook or its update session changed. Keep any unfinished work, then prepare a fresh baseline before continuing.</p><Button disabled={busy} onClick={() => void prepare(true)}>Restart from latest saved notebook</Button></div>}
        <section className="en-stage-panel space-y-3"><h2>Copy the prompt and bring your materials</h2><ol className="list-decimal space-y-3 pl-5"><li>Try to find the AI chat where you uploaded this lecture’s original materials. If you cannot find it or its files are unavailable, re-upload the same materials in a new chat.</li><li>Paste the complete prompt and attach your own notes plus the saved notebook baseline below. Include existing notebook images when offered. The AI must be able to create downloadable files.</li><li>Once the files are available, your AI revises the notes and returns the complete notebook package. Bring its finished ZIP or folder back here to review and save.</li></ol>
          <div className="en-actions"><Button disabled={!fresh || busy} onClick={() => void copy()}>Copy complete prompt</Button><Button variant="outline" disabled={!fresh} onClick={() => downloadNotebookText('revised-notes-prompt.md', prompt, 'text/markdown;charset=utf-8')}>Download prompt</Button><Button variant="outline" disabled={!fresh} onClick={() => downloadNotebookText(notebookUpdateBaselineFilename(activeRevision), JSON.stringify(activeRevision.baseline, null, 2))}>Download saved notebook JSON</Button></div>
          <details open={manualCopy || undefined}><summary>View complete prompt / copy manually</summary><Textarea aria-label="Complete revised notes prompt" readOnly value={prompt} className="h-64 font-mono text-xs" /></details>
        </section>
        <NotebookUpdateImageFiles lecture={lecture} revision={activeRevision} disabled={!fresh} />
        <p className="en-muted">Premed OS supplies the instructions; your external AI creates the revision. Importing requires a review before saving and retains previous notebook versions. The review explains whether related practice progress will restart; earlier responses remain in history.</p>
        <Button variant="outline" disabled={!fresh} onClick={() => setShowImport(true)}>Import revised notes</Button>
        {showImport && <NotebookImportPanel key={activeRevision.id} courseId={courseId} revision={activeRevision} revisionValidation={validateRevisedNotesAddition} onImported={id => navigate(`/academics/classes/${encodeURIComponent(courseId)}/journal/${encodeURIComponent(id)}`)} />}
      </>}
    </>}
    {message && <p role="status">{message}</p>}
  </section>
}
