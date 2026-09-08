import type { NotebookGoal } from './types'

export type NotebookWorkflowStep = 'goal' | 'details' | 'prompt' | 'handoff' | 'import'
export type PromptAcknowledgment = 'clipboard' | 'manual' | 'download'
export interface NotebookWorkflowDraft {
  version: 1
  courseId: string
  step: NotebookWorkflowStep
  goal: NotebookGoal | null
  goalAccepted: boolean
  preferences: string
  scope: string
  scopeSource: string
  materials: string
  selected: string[]
  stage: string
  format: string
  depth: string
  request: string
  term: string
  confirmedPrompt: string | null
  acknowledgedBy: PromptAcknowledgment | null
  jsonReady: boolean
  rawJson: string
}

const PREFIX = 'premed-os:notebook-workflow:v1:'
const fields = ['preferences', 'scope', 'scopeSource', 'materials', 'stage', 'format', 'depth', 'request', 'term', 'rawJson'] as const
const steps: NotebookWorkflowStep[] = ['goal', 'details', 'prompt', 'handoff', 'import']
export function notebookWorkflowDraftKey(courseId: string) { return `${PREFIX}${encodeURIComponent(courseId)}` }

export function loadNotebookWorkflowDraft(courseId: string, defaults: { preferences: string; term: string }): { draft: NotebookWorkflowDraft; restored: boolean; warning: string } {
  const draft: NotebookWorkflowDraft = {
    version: 1, courseId, step: 'goal', goal: null, goalAccepted: false,
    preferences: defaults.preferences, term: defaults.term, scope: '', scopeSource: '', materials: '', selected: [],
    stage: 'Understand and connect', format: '', depth: 'Full explanation with connections, examples, and practice', request: '',
    confirmedPrompt: null, acknowledgedBy: null, jsonReady: false, rawJson: '',
  }
  try {
    const saved = sessionStorage.getItem(notebookWorkflowDraftKey(courseId))
    if (!saved) return { draft, restored: false, warning: '' }
    const value = JSON.parse(saved)
    if (!value || value.version !== 1 || value.courseId !== courseId) throw new Error('Draft identity differs')
    for (const field of fields) if (typeof value[field] === 'string') draft[field] = value[field]
    draft.goal = ['review', 'assessment', 'assignment'].includes(value.goal) ? value.goal : null
    draft.step = steps.includes(value.step) ? value.step : 'goal'
    draft.selected = Array.isArray(value.selected) ? value.selected.filter((id: unknown): id is string => typeof id === 'string') : []
    draft.goalAccepted = value.goalAccepted === true && draft.goal !== null
    draft.confirmedPrompt = typeof value.confirmedPrompt === 'string' ? value.confirmedPrompt : null
    draft.acknowledgedBy = ['clipboard', 'manual', 'download'].includes(value.acknowledgedBy) ? value.acknowledgedBy : null
    draft.jsonReady = value.jsonReady === true
    return { draft, restored: Boolean(draft.goal || draft.request || draft.rawJson), warning: '' }
  } catch {
    return { draft, restored: false, warning: 'The previous draft could not be restored. Keep your prompt and JSON downloads.' }
  }
}

export function hasCurrentPromptAcknowledgment(draft: NotebookWorkflowDraft, prompt: string) {
  return Boolean(draft.goalAccepted && prompt && draft.confirmedPrompt === prompt && draft.acknowledgedBy)
}

export function notebookWorkflowStep(draft: NotebookWorkflowDraft, prompt: string): NotebookWorkflowStep {
  if (!draft.goal) return 'goal'
  if (draft.step === 'goal' || draft.step === 'details') return draft.step
  if (!draft.goalAccepted) return 'goal'
  if (!hasCurrentPromptAcknowledgment(draft, prompt)) return 'prompt'
  if (draft.step === 'import' && !draft.jsonReady) return 'handoff'
  return draft.step
}

export function persistNotebookWorkflowDraft(draft: NotebookWorkflowDraft): string {
  try {
    sessionStorage.setItem(notebookWorkflowDraftKey(draft.courseId), JSON.stringify(draft))
    return ''
  } catch {
    // Do not restore an older acknowledgment if the current draft could not be kept.
    try { sessionStorage.removeItem(notebookWorkflowDraftKey(draft.courseId)) } catch { /* Storage may be unavailable. */ }
    return 'This draft could not be kept for your return. Keep the prompt and JSON file before leaving this page.'
  }
}

export function clearNotebookWorkflowDraft(courseId: string) {
  try { sessionStorage.removeItem(notebookWorkflowDraftKey(courseId)) } catch { /* The saved notebook remains protected by its own transaction. */ }
}
