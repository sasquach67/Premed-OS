import type { ReactNode } from 'react'
import type { NotebookEntry, NotebookObjective } from '@/lib/academics/notebook/types'
import { NotebookInlineText } from './NotebookStudyGuide'
import './notebookMasteryObjectives.css'

type TextRenderer = (value: string, path: (string | number)[], label: string) => ReactNode
export function NotebookMasteryObjectives({ entry, entryIndex = 0, headingId, renderEvidence, renderText }: {
  entry: NotebookEntry
  entryIndex?: number
  headingId?: string
  renderEvidence: (objective: NotebookObjective) => ReactNode
  renderText?: TextRenderer
}) {
  const text: TextRenderer = renderText ?? (value => <p className="en-text"><NotebookInlineText text={value} /></p>)
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
