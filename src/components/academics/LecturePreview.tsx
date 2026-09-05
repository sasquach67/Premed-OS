import type { LectureRecord } from '@/lib/types'

/** A reading sample, not a second copy of the full lecture workspace. */
export function LecturePreview({ lecture, sourceCount }: {
  lecture: Pick<LectureRecord, 'studyGuide' | 'lectureBrief' | 'workspaceState'>
  sourceCount: number
}) {
  const sections = lecture.studyGuide?.sections.filter((section) => section.id.toLowerCase() !== 'title') ?? []
  const opening = sections.find((section) => /at[ _-]a[ _-]glance|overview/i.test(`${section.id} ${section.title}`)) ?? sections[0]
  const paragraphs = opening?.blocks.flatMap((block) => [block.text?.content, ...(block.items?.map((item) => item.content) ?? [])]).filter((text): text is string => Boolean(text?.trim()))
    ?? (lecture.workspaceState === 'complete' ? lecture.lectureBrief?.summary.map((item) => item.text) : []) ?? []
  const concepts = [...new Set(sections.filter((section) => section !== opening)
    .flatMap((section) => section.blocks.map((block) => block.conceptLabel).filter((label): label is string => Boolean(label?.trim()))))]
  const topics = (concepts.length ? concepts : lecture.workspaceState === 'complete' ? lecture.lectureBrief?.vocabulary.map((item) => item.term) ?? [] : []).slice(0, 4)
  return <section className="lecture-compact-preview" aria-label="Lecture preview">
    {paragraphs.length ? <>
      <p className="lecture-ledger-kicker">At a glance</p>
      <div className="lecture-preview-summary">{paragraphs.slice(0, 2).map((text, index) => <p key={index}>{text}</p>)}</div>
      {topics.length > 0 && <div className="lecture-preview-topics" aria-label="Main concepts">{topics.map((topic) => <span key={topic}>{topic}</span>)}</div>}
    </> : <div className="lecture-saved-empty"><b>{sourceCount ? 'Sources captured' : 'No sources yet'}</b><span>{lecture.workspaceState === 'complete' ? 'Open this lecture to view its saved study resources.' : 'No Study Guide has been generated yet. Open this lecture to review its sources and build study resources.'}</span></div>}
    <p className="lecture-preview-footer">{sourceCount} selected {sourceCount === 1 ? 'source' : 'sources'} · Open lecture for the full Study Guide and Mastery Map. Transcript and supporting files stay under Sources.</p>
  </section>
}
