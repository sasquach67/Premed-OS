import type { ReactNode } from 'react'

export function NotebookPracticeCard({ number, origin, prompt, stimulus, hasStimulus, answer, rationale, original, sources, earlierWork, missing, solutionTestId }: {
  number: number; origin: string; prompt: ReactNode; stimulus: ReactNode; hasStimulus: boolean;
  answer: ReactNode; rationale: ReactNode; original: string; sources: ReactNode; earlierWork?: ReactNode; missing: string[]; solutionTestId?: string;
}) {
  return <div className="np-card" data-has-stimulus={hasStimulus || undefined}>
    <span className="np-number" aria-label={`Question ${number}`}>{String(number).padStart(2, '0')}</span>
    <div className="np-content">
      <p className="np-origin">{origin}</p>
      <div className="np-question-layout">
        {hasStimulus && <div className="np-stimulus">{stimulus}</div>}
        <div className="np-question">{prompt}</div>
      </div>
      {missing.length ? <p role="status" className="en-notice">Required images are loading or unavailable: {missing.join(', ')}. Reveal stays closed until they are available. Your saved practice records have not changed.</p> : <details data-testid={solutionTestId} className="en-answer nbr-reveal np-reveal">
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
