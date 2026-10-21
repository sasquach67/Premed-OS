import type { ReactNode } from 'react'
import type { NotebookEntry, NotebookObjective } from '@/lib/academics/notebook/types'
import { NotebookInlineText } from './NotebookStudyGuide'
import './notebookMasteryObjectives.css'
import './notebookTeachFirst.css'

type TextRenderer = (value: string, path: (string | number)[], label: string) => ReactNode
export function NotebookMasteryObjectives({ entry, entryIndex = 0, headingId, renderEvidence, renderText, onPractice }: {
  onPractice?: (practiceBlockIds: string[]) => void
  entry: NotebookEntry
  entryIndex?: number
  headingId?: string
  renderEvidence: (objective: NotebookObjective) => ReactNode
  renderText?: TextRenderer
}) {
  const text: TextRenderer = renderText ?? (value => <p className="en-text"><NotebookInlineText text={value} /></p>)
  // Beta-33: How it may be tested is an exam forecast, shown as the exemplar's mq-* cards (brief §2.9).
  if (!renderText && entry.objectives.some(objective => objective.howTested?.forecast?.length)) return <section className="nbr-objectives nmo-objectives sg" aria-label="Mastery objectives">
    <h2 id={headingId} tabIndex={headingId ? -1 : undefined} className="sr-only">Mastery objectives</h2>
    <div className="mq-pane">{entry.objectives.map((objective, index) => {
      const title = objective.origin === 'derived' ? objective.title.replace(/^Study objective:\s*/, '') || objective.title : objective.title
      const tested = objective.howTested
      return <article key={objective.id} className="mq-card" aria-label={title}>
        <p className="mq-kick">Objective {index + 1} · {objective.origin === 'official' ? 'Course objective' : 'Study objective'}</p>
        <h3 className="mq-title">{title}</h3>
        <section className="mq-box" aria-label="How it may be tested"><p className="mq-boxkick">How it may be tested</p>
          {tested && <p className="mq-setup"><NotebookInlineText text={tested.setup} /></p>}
          {tested?.forecast?.length ? <ul className="mq-fcl">{tested.forecast.map((row, ri) => <li key={ri}><span className="mq-fmt">{row.format}</span><span className="mq-fc"><NotebookInlineText text={row.text} /></span></li>)}</ul> : <p className="en-text">This objective has no forecast yet. Its class questions are in Practice.</p>}
          <div className="mq-foot"><span className="mq-basis">{tested?.basis ?? 'Based on the class questions for this objective.'}</span>{onPractice && objective.practiceBlockIds.length > 0 && <button type="button" className="mq-go" onClick={() => onPractice(objective.practiceBlockIds)}>Practice these</button>}</div>
        </section>
        <div className="mq-cols"><section className="mq-col" aria-label="Be able to do"><p className="mq-colkick">Be able to do</p><ul>{(objective.applicationSkills?.map(skill => skill.text) ?? objective.beAbleToDo).map((skill, si) => <li key={si}><NotebookInlineText text={skill} /></li>)}</ul></section>
          <section className="mq-col" aria-label="Understand"><p className="mq-colkick">Understand</p><ul>{objective.understand.map((fact, fi) => <li key={fi}><NotebookInlineText text={fact} /></li>)}</ul></section></div>
        {objective.evidenceLimit && <p className="nmo-limit">{objective.evidenceLimit}</p>}
        {renderEvidence(objective)}
      </article>
    })}</div>
  </section>
  return <section className="nbr-objectives nmo-objectives" aria-label="Mastery objectives">
    <h2 id={headingId} tabIndex={headingId ? -1 : undefined}>Mastery objectives</h2>
    <ol className="nmo-list">{entry.objectives.map((objective, index) => {
      const path = ['entries', entryIndex, 'objectives', index]
      const questions = objective.howTested?.questions ?? []
      const title = !renderText && objective.origin === 'derived' ? objective.title.replace(/^Study objective:\s*/, '') || objective.title : objective.title
      return <li key={objective.id} className="nmo-objective">
        <span className="nmo-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <div className="nmo-body"><h3 className="nbr-objective-title">{title}</h3>
          <p className="nmo-origin">{objective.origin === 'official' ? 'Course objective' : 'Derived study objective'}</p>
          {renderText && text(objective.title, [...path, 'title'], 'Objective title')}
          <section className="nmo-tested" aria-label="How it may be tested"><h4>How it may be tested</h4>
            {objective.howTested ? <>
              {(renderText || /gel|draw|diagram/i.test([objective.howTested.setup, ...questions.map(question => question.text)].join(' '))) && <div className="nmo-setup">{text(objective.howTested.setup, [...path, 'howTested', 'setup'], 'How the objective is tested')}</div>}
              {questions.length ? <ul className="nmo-questions">{questions.map((question, qi) => <li key={question.id}>{text(question.text, [...path, 'howTested', 'questions', qi, 'text'], `Course question ${qi + 1}`)}</li>)}</ul> : text(objective.howTested.noQuestionsReason ?? 'No actual question was identified in the supplied sources for this objective.', [...path, 'howTested', 'noQuestionsReason'], 'Missing course question explanation')}
            </> : <p className="en-text">This saved objective has no quoted course questions. Check the source materials for how it is tested.</p>}
          </section>
          <div className="nmo-columns"><section className="nmo-skills" aria-label="Be able to do"><h4>Be able to do</h4><ul>
            {objective.applicationSkills ? objective.applicationSkills.map((skill, si) => <li key={si}>{text(skill.text, [...path, 'applicationSkills', si, 'text'], 'Application skill')}</li>) : objective.beAbleToDo.map((skill, si) => <li key={si}>{text(skill, [...path, 'beAbleToDo', si], 'Application skill')}</li>)}
          </ul></section><section className="nmo-understand" aria-label="Understand"><h4>Understand</h4><ul>{objective.understand.map((fact, fi) => <li key={fi}>{text(fact, [...path, 'understand', fi], 'Understanding')}</li>)}</ul></section></div>
          {objective.evidenceLimit && <p className="nmo-limit">{objective.evidenceLimit}</p>}
          {renderEvidence(objective)}
        </div>
      </li>
    })}</ol>
  </section>
}
