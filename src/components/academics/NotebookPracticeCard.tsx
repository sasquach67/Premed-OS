import { useState, type ReactNode } from 'react'
import { NotebookInlineText } from './NotebookStudyGuide'

export function NotebookPracticeCard({ number, origin, prompt, stimulus, hasStimulus, answer, rationale, original, sources, earlierWork, missing, solutionTestId, options, correctIndex }: { options?: string[]; correctIndex?: number;
  number: number; origin: string; prompt: ReactNode; stimulus: ReactNode; hasStimulus: boolean;
  answer: ReactNode; rationale: ReactNode; original: string; sources: ReactNode; earlierWork?: ReactNode; missing: string[]; solutionTestId?: string;
}) {
  return <div className={`np-card${options ? ' wt-fr lf-multiple-choice' : ''}`} data-has-stimulus={hasStimulus || undefined}>
    <span className="np-number" aria-label={`Question ${number}`}>{String(number).padStart(2, '0')}</span>
    <div className="np-content">
      <p className="np-origin">{origin}</p>
      <div className="np-question-layout">
        {hasStimulus && <div className="np-stimulus">{stimulus}</div>}
        <div className="np-question">{prompt}</div>
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
