import { useState } from 'react'
import { useStore } from '@/store/store'
import { guideDirections, matchingGuideNotes, guideScopeLabel, parseGuideScope } from '@/lib/academics/studentGuide'
import { GuideScopeField } from './StudentGuide'

export type GuideChoice = { target: string; excludedIds: string[] }
export function useStudentGuide({ courseId, lessonIds = [], choice, onChange }: { courseId: string; lessonIds?: readonly string[]; choice?: GuideChoice; onChange?: (choice: GuideChoice) => void }) {
  const data = useStore(state => state.academics.classCenter)
  const [localChoice, setLocalChoice] = useState<GuideChoice>({ target: '', excludedIds: [] })
  const value = choice ?? localChoice
  const update = onChange ?? setLocalChoice
  const scope = parseGuideScope(value.target)
  const available = matchingGuideNotes(data.notes, {
    courseId,
    lessonIds: [...lessonIds, ...(scope.kind === 'lesson' ? [scope.id] : [])],
    assessmentId: scope.kind === 'assessment' ? scope.id : undefined,
  })
  const directions = guideDirections(available.filter(note => !value.excludedIds.includes(note.id)))
  const hasGuide = data.notes.some(note => note.courseId === courseId && note.studentGuidance)
  const preview = <section className="my-3 rounded-xl border border-border bg-muted/30 p-3" aria-label="Using your Guide">
    <details><summary className="cursor-pointer text-sm font-bold">Using your Guide · {directions.length} {directions.length === 1 ? 'direction' : 'directions'}</summary>
      <p className="my-2 text-xs text-muted-foreground">Whole-class and matching lesson notes are included automatically. Choose an exam or assignment to include its guidance. Adjust this list for this output only.</p>
      <GuideScopeField courseId={courseId} data={data} value={value.target} label="Additional lesson or assessment (optional)" onChange={target => update({ ...value, target })} />
      {available.map(note => <label key={note.id} className="mt-3 flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" checked={!value.excludedIds.includes(note.id)} onChange={event => update({ ...value, excludedIds: event.target.checked ? value.excludedIds.filter(id => id !== note.id) : [...value.excludedIds, note.id] })} /><span>{note.title}<span className="block text-xs text-muted-foreground">{guideScopeLabel(note.studentGuidance!.scope, data)}</span></span></label>)}
      {!available.length && <p className="mt-3 text-sm text-muted-foreground">{hasGuide ? 'No guidance matches this selection.' : 'Add short directions in this class’s Guide whenever you learn what your professor emphasizes.'}</p>}
      <p className="mt-3 text-xs text-muted-foreground">Your Guide sets the emphasis. Selected materials supply the evidence. Existing study materials stay unchanged.</p>
    </details>
    {!!directions.length && <ul className="mt-2 space-y-1 text-sm">{directions.map(note => <li key={note.id} className="break-words">{note.title}</li>)}</ul>}
  </section>
  return { directions, preview }
}
