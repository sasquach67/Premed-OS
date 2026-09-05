import { useEffect, useId, useState } from 'react'
import { BookOpen, Check, Circle, CircleDot } from 'lucide-react'
import './ReadingContents.css'

type ContentsItem = { id: string; title: string; targetId: string; status?: string }

/** One navigation language for reading sections and practicing objectives. */
export function ReadingContents({ items, label, title = 'Contents', onNavigate, standalone = false }: {
  items: ContentsItem[]; label: string; title?: string; onNavigate: (id: string) => void; standalone?: boolean
}) {
  const pickerId = useId()
  const [selected, setSelected] = useState('')
  const active = items.some(item => item.id === selected) ? selected : items[0]?.id ?? ''
  const targets = items.map(item => `${item.id}\t${item.targetId}`).join('\n')
  useEffect(() => {
    let frame = 0
    const update = () => {
      const headings = targets.split('\n').map(row => {
        const [id, targetId] = row.split('\t')
        return { id, node: document.getElementById(targetId) }
      }).filter(item => item.node && item.node.getBoundingClientRect().height > 0)
      if (!headings.length) return
      const first = headings[0].node!
      const article = first.closest<HTMLElement>('[data-guide-scroll-container="true"]')
      const pane = article && /auto|scroll/.test(getComputedStyle(article).overflowY)
        ? article : first.closest<HTMLElement>('[aria-label="Lecture reading area"]')
      const top = Math.max(0, pane?.getBoundingClientRect().top ?? 0) + 96
      const preceding = headings.filter(item => item.node!.getBoundingClientRect().top <= top)
      setSelected((preceding.at(-1) ?? headings[0]).id)
    }
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update) }
    document.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    return () => { cancelAnimationFrame(frame); document.removeEventListener('scroll', schedule, true); window.removeEventListener('resize', schedule) }
  }, [targets])
  function navigate(id: string) { setSelected(id); onNavigate(id) }
  return <nav aria-label={label} className="reading-contents" data-standalone={standalone || undefined}>
    <header className="reading-contents-heading"><BookOpen aria-hidden="true"/><label htmlFor={pickerId}>{title}</label><span>{items.length}</span></header>
    <select id={pickerId} className="reading-contents-picker" value={active} onChange={event => navigate(event.target.value)}>
      <option value="" disabled>Jump to a section</option>
      {items.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
    </select>
    <ol className="reading-contents-list">{items.map((item, index) => <li key={item.id}>
      <button type="button" className="reading-contents-link" aria-current={active === item.id ? 'location' : undefined} onClick={() => navigate(item.id)}>
        <span className="reading-contents-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <span className="reading-contents-title">{item.title}</span>
        {item.status && <span className="reading-contents-status" data-status={item.status} aria-label={item.status === 'can-apply-without-notes' ? 'Can apply without notes' : item.status === 'can-explain' ? 'Can explain' : 'Not started'} title={item.status === 'can-apply-without-notes' ? 'Can apply without notes' : item.status === 'can-explain' ? 'Can explain' : 'Not started'}>{item.status === 'can-apply-without-notes' ? <Check/> : item.status === 'can-explain' ? <CircleDot/> : <Circle/>}</span>}
      </button>
    </li>)}</ol>
  </nav>
}
