import type { NotebookAsset, NotebookAssetBinding, NotebookFigureBlock, NotebookStudyDiagramBlock, NotebookVisualReview } from './visualTypes'
import type { LearningVisualBlock } from './learningVisualTypes'
export type NotebookGoal = 'review' | 'assessment' | 'assignment'
export type Evidence = ({ sourceIds: string[]; excerptIds: string[] }) & { assetIds?: string[] }
export type NotebookBlock = (Evidence & { id: string; provenance: 'source' | 'clarification' | 'background' | 'generated-practice' | 'student-work' } & (
  { type: 'paragraph'; text: string } | { type: 'bullets' | 'steps'; items: string[] } |
  { type: 'table'; columns: string[]; rows: string[][] } | { type: 'practice'; prompt: string; answer: string; rationale: string ; stimulusBlockIds?: string[] } |
  { type: 'gap'; text: string; nextStep: string }
)) | NotebookFigureBlock | NotebookStudyDiagramBlock | LearningVisualBlock
export type NotebookSource = { id: string; title: string; role: string; access: 'read' | 'partial' | 'unreadable' | 'not-accessed'; inspected: string; limitations: string[]; used: boolean; excerpts: { id: string; location: string | null; text: string }[] }
export type NotebookRequirement = Evidence & { id: string; kind: 'objective' | 'assessment' | 'assignment' | 'student-request'; text: string; authority: 'official' | 'student-request' | 'selected-material'; status: 'supported' | 'partial' | 'missing' | 'out-of-scope'; basis: string; sectionIds: string[]; nextStep: string | null }
export type NotebookObjective = Evidence & { id: string; requirementId: string; title: string; origin: 'official' | 'derived'; freeRecallCues: string[]; understand: string[]; beAbleToDo: string[]; watchFor: string[]; practiceBlockIds: string[]; evidenceLimit: string | null }
export type NotebookEntry = { id: string; revision: number; baseRevision: number | null; title: string; goal: NotebookGoal; scope: string; request: { helpStage: string | null; classPreferences: string; assessmentFormat: string | null }; sections: { id: string; title: string; purpose: 'study-guide' | 'preparation' | 'practice' | 'workspace' | 'check' | 'next-steps'; blocks: NotebookBlock[] }[]; objectives: NotebookObjective[]; requirements: NotebookRequirement[]; limitations: string[] }
export type NotebookPackageV2 = { format: 'premed-os-notebook-package'; version: 2; instructionsVersion: 'notebook-workflows-draft-2'; course: { code: string; title: string; term: string | null }; sources: NotebookSource[]; entries: NotebookEntry[] }
export type NotebookProgress = Record<string, { response: string; complete: boolean }>
export type NotebookUpdateSession = { id: string; localId: string; createdAt: number; baseline: NotebookPackage }
export type NotebookHistoryVersion = { id: string; savedAt: number; reason: 'edit' | 'update' | 'restore'; current: NotebookPackage; notes: string; progress: NotebookProgress; acceptedRaw?: string }
export type ImportedNotebook = ({ original: NotebookPackage; current: NotebookPackage; originalRaw: string; entryId: string; fingerprint: string; importedAt: number; editedAt?: number; progress: NotebookProgress; notes: string; revisedFromLectureId?: string; history?: NotebookHistoryVersion[]; updateSession?: NotebookUpdateSession; acceptedRaw?: string }) & { assetLineageId?: string; assetBindings?: NotebookAssetBinding[] }

export type NotebookPackage = NotebookPackageV2 | (Omit<NotebookPackageV2, 'version' | 'instructionsVersion'> & ({ version: 3; instructionsVersion: 'notebook-workflows-draft-3' } | { version: 4; instructionsVersion: 'notebook-workflows-draft-4' }) & { assets: NotebookAsset[]; visualReview: NotebookVisualReview })
