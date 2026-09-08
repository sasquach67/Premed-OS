import type { NotebookPackage } from './types'

/** Invented classroom task for implementation tests, not course evidence. */
export function revisionFixture(): NotebookPackage {
  const sources: NotebookPackage['sources'] = ['mapping', 'timing'].map(id => ({ id: `source-${id}`, title: `Invented ${id} evidence`, role: 'other', access: 'read', inspected: 'The complete invented test passage, not a real class source.', limitations: [], used: true, excerpts: [{ id: `excerpt-${id}`, location: 'Invented passage', text: id === 'mapping' ? 'In this invented task, a triangle means choose left.' : 'In this invented task, the shape lasts 100 milliseconds.' }] }))
  const evidence = (id: string) => ({ sourceIds: [`source-${id}`], excerptIds: [`excerpt-${id}`] })
  return { format: 'premed-os-notebook-package', version: 2, instructionsVersion: 'notebook-workflows-draft-2', course: { code: 'DEMO 101', title: 'Invented update demonstration', term: 'Fall 2026' }, sources, entries: [{ id: 'topic-demo', revision: 1, baseRevision: null, title: 'Invented classroom task', goal: 'review', scope: 'Mapping and timing in the invented test passages only.', request: { helpStage: null, classPreferences: '', assessmentFormat: null }, limitations: ['Invented implementation fixture; no learning-quality claim.'], sections: ['mapping', 'timing'].flatMap(id => [{ id: `teaching-${id}`, title: `${id} explanation`, purpose: 'study-guide' as const, blocks: [{ id: `explain-${id}`, type: 'paragraph' as const, provenance: 'source' as const, ...evidence(id), text: sources.find(s => s.id === `source-${id}`)!.excerpts[0].text }] }, { id: `practice-${id}`, title: `${id} practice`, purpose: 'practice' as const, blocks: [{ id: `question-${id}`, type: 'practice' as const, provenance: 'generated-practice' as const, ...evidence(id), prompt: id === 'mapping' ? 'Hypothetical task: which response follows a triangle?' : 'Hypothetical task: how long is the shape shown?', answer: id === 'mapping' ? 'Choose left.' : '100 milliseconds.', rationale: 'The answer follows the cited invented passage.' }] }]), requirements: ['mapping', 'timing'].map(id => ({ id: `requirement-${id}`, kind: 'objective', text: `Study objective: Explain ${id}.`, authority: 'selected-material', ...evidence(id), status: 'supported', basis: 'The invented passage and linked explanation support this test objective.', sectionIds: [`teaching-${id}`], nextStep: null })), objectives: ['mapping', 'timing'].map(id => ({ id: `objective-${id}`, requirementId: `requirement-${id}`, title: `Study objective: Explain ${id}.`, origin: 'derived', ...evidence(id), freeRecallCues: [`Recall ${id} without notes.`], understand: [`Understand the supplied ${id} rule.`], beAbleToDo: [], watchFor: [], practiceBlockIds: [`question-${id}`], evidenceLimit: 'This is a deliberately small invented implementation example, not complete coursework.' })) }] }
}
export function correctedFixture(): NotebookPackage {
  const p = revisionFixture(), e = p.entries[0]
  e.revision = 2; e.baseRevision = 1
  const block = e.sections.find(s => s.id === 'teaching-timing')!.blocks[0]
  if (block.type === 'paragraph') block.text = 'The later invented passage explicitly corrects the duration to 200 milliseconds.'
  p.sources[1].excerpts.push({ id: 'excerpt-correction', location: 'Invented later passage', text: 'The earlier 100-millisecond value was a mistake; this invented task uses 200 milliseconds.' })
  block.excerptIds = ['excerpt-correction']
  const question = e.sections.find(s => s.id === 'practice-timing')!.blocks[0]
  if (question.type === 'practice') question.answer = '200 milliseconds.'
  question.excerptIds = ['excerpt-correction']
  e.objectives[1].excerptIds = ['excerpt-timing', 'excerpt-correction']
  return p
}
export function withNewTopic(p: NotebookPackage): NotebookPackage {
  const next = structuredClone(p)
  next.entries.push({ id: 'new-topic', revision: 1, baseRevision: null, title: 'New separate topic', goal: 'review', scope: 'A new topic with no supplied teaching yet.', request: { helpStage: null, classPreferences: '', assessmentFormat: null }, sections: [{ id: 'new-section', title: 'Material needed', purpose: 'next-steps', blocks: [{ id: 'new-gap', type: 'gap', provenance: 'clarification', sourceIds: [], excerptIds: [], text: 'The new topic has no supplied teaching.', nextStep: 'Supply its actual material.' }] }], objectives: [], requirements: [{ id: 'new-requirement', kind: 'student-request', text: 'Prepare the new topic when evidence is supplied.', authority: 'student-request', sourceIds: [], excerptIds: [], status: 'missing', basis: 'No teaching evidence was supplied for this explicitly separate topic.', sectionIds: ['new-section'], nextStep: 'Supply the new topic material.' }], limitations: ['Gap-only placeholder, not a completed learning result.'] })
  return next
}
