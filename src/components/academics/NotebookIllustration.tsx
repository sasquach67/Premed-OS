import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { IllustrationBlock } from '@/lib/academics/notebook/learningVisualTypes'

type Change = (path: (string | number)[], value: string | null) => void

/** Shows a worked representation first, then one line; the explanation waits behind Show more. */
export function NotebookIllustration({ block, path, change }: { block: IllustrationBlock; path: (string | number)[]; change?: Change }) {
  const [open, setOpen] = useState(false)
  const moreId = useId()
  if (change) return <section className="nbr-learning-visual nbr-illustration" aria-label={block.title} data-visual-type="illustration">
    <label className="en-field">Illustration title<textarea value={block.title} onChange={event => change([...path, 'title'], event.target.value)} /></label>
    {block.lines.map((line, index) => <label className="en-field" key={index}>{`Illustration line ${index + 1}`}<textarea className="nbr-illustration-edit" value={line} onChange={event => change([...path, 'lines', index], event.target.value)} /></label>)}
    <label className="en-field">One-line summary<textarea value={block.summary} onChange={event => change([...path, 'summary'], event.target.value)} /></label>
    <label className="en-field">Show-more explanation (leave empty for none)<textarea value={block.more ?? ''} onChange={event => change([...path, 'more'], event.target.value === '' ? null : event.target.value)} /></label>
  </section>
  return <section className="nbr-learning-visual nbr-illustration" aria-label={block.title} data-visual-type="illustration">
    <h4>{block.title}</h4>
    <pre className="nbr-illustration-lines" role="region" aria-label={`${block.title}, worked example`} tabIndex={0}>{block.lines.join('\n')}</pre>
    <p className="en-text nbr-illustration-summary">{block.summary}</p>
    {block.more !== null && <>
      <Button className="nbr-illustration-toggle h-auto px-0" variant="link" aria-expanded={open} aria-controls={moreId} onClick={() => setOpen(previous => !previous)}>{open ? 'Show less' : 'Show more'}</Button>
      <p id={moreId} className="en-text nbr-illustration-more" hidden={!open}>{block.more}</p>
    </>}
  </section>
}
