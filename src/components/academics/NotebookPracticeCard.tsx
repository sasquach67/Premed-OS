import { useState, type ReactNode } from 'react'
import { NotebookInlineText } from './NotebookStudyGuide'
import type { NotebookBlock } from '@/lib/academics/notebook/types'
import './notebookTeachFirst.css'

type Practice = Extract<NotebookBlock, { type: 'practice' }>
/** Structured class questions (brief §2.9): sub-questions, matching columns and a blank comparison table. */
export function NotebookPracticeStructure({ block }: { block: Practice }) {
  if (!block.parts?.length && !block.matching && !block.table && !block.src) return null
  const letter = (index: number) => String.fromCharCode(65 + index)
  return <div className="sg np-structure">
    {block.src && <span className="mq-src">{block.src}</span>}
    {block.parts?.length ? <div className="mq-opts mq-parts">{block.parts.map((part, index) => <p key={index}><span className="mq-l">{String.fromCharCode(97 + index)}</span><NotebookInlineText text={part} /></p>)}</div> : null}
    {block.matching && <div className="mq-match"><div>{block.matching.left.map((item, index) => <p key={index}><span className="mq-l">{index + 1}</span><NotebookInlineText text={item} /></p>)}</div><div>{block.matching.right.map((item, index) => <p key={index}><span className="mq-l">{letter(index)}</span><NotebookInlineText text={item} /></p>)}</div></div>}
    {block.table && <div className="mq-tbl"><table><thead><tr>{block.table.columns.map((column, index) => <th key={index}>{column}</th>)}</tr></thead><tbody>{block.table.rows.map((row, ri) => <tr key={ri}>{block.table!.columns.map((_, ci) => <td key={ci}>{row[ci] ?? ''}</td>)}</tr>)}</tbody></table></div>}
  </div>
}

export function NotebookPracticeCard({ number, origin, prompt, stimulus, hasStimulus, answer, rationale, original, sources, earlierWork, missing, solutionTestId, options, correctIndex, structure }: { options?: string[]; correctIndex?: number; structure?: ReactNode;
  number: number; origin: string; prompt: ReactNode; stimulus: ReactNode; hasStimulus: boolean;
  answer: ReactNode; rationale: ReactNode; original: string; sources: ReactNode; earlierWork?: ReactNode; missing: string[]; solutionTestId?: string;
}) {
  return <div className={`np-card${options ? ' wt-fr lf-multiple-choice' : ''}`} data-has-stimulus={hasStimulus || undefined}>
    <span className="np-number" aria-label={`Question ${number}`}>{String(number).padStart(2, '0')}</span>
    <div className="np-content">
      <p className="np-origin">{origin}</p>
      <div className="np-question-layout">
        {hasStimulus && <div className="np-stimulus">{stimulus}</div>}
        <div className="np-question">{prompt}{structure}</div>
      </div>
      {missing.length ? <p role="status" className="en-notice">Required images are loading or unavailable: {missing.join(', ')}. Reveal stays closed until they are available. Your saved practice records have not changed.</p> : options && correctIndex !== undefined ? <NotebookChoiceQuestion key={JSON.stringify([original, options, correctIndex])} options={options} correctIndex={correctIndex} rationale={rationale} sources={sources} earlierWork={earlierWork} /> : <details data-testid={solutionTestId} className="en-answer nbr-reveal np-reveal">
        <summary><span className="np-closed-label">Reveal answer</span><span className="np-open-label">Hide answer</span></summary>
        <div className="np-solution">
          <div className="np-answer"><h4>Answer</h4><div>{answer}</div></div>
          <div className="np-why"><h4>Why</h4><div>{rationale}</div></div>
          <div className="np-secondary">
            <details className="np-original"><summary>Original wording, exactly as saved</summary><p className="en-text">{original}</p></details>
            {sources}
            {earlierWork}
          </div>
        </div>
      </details>}
    </div>
  </div>
}

function NotebookChoiceQuestion({ options, correctIndex, rationale, sources, earlierWork }: { options: string[]; correctIndex: number; rationale: ReactNode; sources: ReactNode; earlierWork?: ReactNode }) {
  const [picked, setPicked] = useState<number | null>(null)
  return <><div className="lf-options" role="group" aria-label="Answer options">{options.map((option, index) => <button type="button" key={index} disabled={picked !== null} aria-pressed={picked === index} className={`wt-opt${picked !== null && index === correctIndex ? ' right' : picked === index ? ' wrong' : ''}`} onClick={() => setPicked(index)}><i aria-hidden="true">{String.fromCharCode(65 + index)}</i><NotebookInlineText text={option} /></button>)}</div>{picked !== null && <div className={`wt-fb ${picked === correctIndex ? 'ok' : 'no'}`} role="status"><strong>{picked === correctIndex ? 'Correct.' : 'Not quite.'}</strong>{rationale}<details><summary>Source evidence and earlier work</summary>{sources}{earlierWork}</details></div>}</>
}
