import type { NotebookAsset, NotebookAssetBinding, NotebookFigureBlock, NotebookStudyDiagramBlock, NotebookVisualReview } from './visualTypes'
import type { LearningVisualBlock } from './learningVisualTypes'
export type NotebookGoal = 'review' | 'assessment' | 'assignment'
export type Evidence = ({ sourceIds: string[]; excerptIds: string[] }) & { assetIds?: string[] }
export type NotebookStudyMetadata = { definedTerms?: { term: string; definition: string }[]; stressed?: boolean; detail?: 'core' | 'extra' }
export type NotebookStep = string | { text: string; reason?: string }
export type NotebookWalkthroughItem = { point: string; paragraphs: string[]; cards?: { label: string; text: string }[]; figureBlockId?: string; attachedBlockIds?: string[]; note?: { label: 'Your notes' | 'Easy to mix up'; text: string } }
export type NotebookArgumentLink = { label: string; line: string; sectionId: string }
export type NotebookCalloutTone = 'question' | 'lecture-example' | 'analogy' | 'mix-up' | 'builds-on' | 'one-thing'
export type NotebookBlock = NotebookStudyMetadata & ((Evidence & { id: string; provenance: 'source' | 'clarification' | 'background' | 'generated-practice' | 'student-work' } & (
  { type: 'paragraph'; role?: 'connects' | 'why' | 'deeper' | 'lede'; text: string; more?: string | null } | { type: 'bullets'; items: string[]; nestedItems?: { parentIndex: number; items: string[] }[]; more?: string | null } | { type: 'steps'; items: NotebookStep[] } |
  { type: 'table'; columns: string[]; rows: string[][] } | { type: 'practice'; prompt: string; answer: string; rationale: string; options?: string[]; correctIndex?: number; stimulusBlockIds?: string[]; parts?: string[]; matching?: { left: string[]; right: string[] }; table?: { columns: string[]; rows: string[][] }; src?: string } |
  { type: 'gap'; text: string; nextStep: string } | { type: 'callout'; tone: NotebookCalloutTone; text: string } | { type: 'claim'; claim: string; evidence: string[]; soWhat: string } | { type: 'walkthrough'; items: NotebookWalkthroughItem[] }
)) | NotebookFigureBlock | NotebookStudyDiagramBlock | LearningVisualBlock)
export type NotebookSource = { id: string; title: string; role: string; access: 'read' | 'partial' | 'unreadable' | 'not-accessed'; inspected: string; limitations: string[]; used: boolean; excerpts: { id: string; location: string | null; text: string }[] }
export type NotebookRequirement = Evidence & { id: string; kind: 'objective' | 'assessment' | 'assignment' | 'student-request'; text: string; authority: 'official' | 'student-request' | 'selected-material'; status: 'supported' | 'partial' | 'missing' | 'out-of-scope'; basis: string; sectionIds: string[]; nextStep: string | null }
export type NotebookSourceQuestion = Evidence & { id: string; text: string }
export type NotebookForecastRow = { format: string; text: string }
export type NotebookHowTested = { setup: string; questions: NotebookSourceQuestion[]; noQuestionsReason?: string; forecast?: NotebookForecastRow[]; basis?: string }
export type NotebookApplicationSkill = { text: string; questionIds: string[] }
export type NotebookObjective = Evidence & { id: string; requirementId: string; title: string; origin: 'official' | 'derived'; howTested?: NotebookHowTested; applicationSkills?: NotebookApplicationSkill[]; freeRecallCues: string[]; understand: string[]; beAbleToDo: string[]; watchFor: string[]; practiceBlockIds: string[]; evidenceLimit: string | null }
export type NotebookEntry = { id: string; revision: number; baseRevision: number | null; title: string; goal: NotebookGoal; scope: string; argumentChain?: NotebookArgumentLink[]; request: { helpStage: string | null; classPreferences: string; assessmentFormat: string | null }; sections: { id: string; title: string; learningObjectiveIds?: string[]; purpose: 'study-guide' | 'preparation' | 'practice' | 'workspace' | 'check' | 'next-steps'; blocks: NotebookBlock[] }[]; objectives: NotebookObjective[]; requirements: NotebookRequirement[]; limitations: string[] }
export type NotebookPackageV2 = { format: 'premed-os-notebook-package'; version: 2; instructionsVersion: 'notebook-workflows-draft-2'; course: { code: string; title: string; term: string | null }; sources: NotebookSource[]; entries: NotebookEntry[] }
export type NotebookProgress = Record<string, { response: string; complete: boolean }>
export type NotebookUpdateSession = { id: string; localId: string; createdAt: number; baseline: NotebookPackage }
export type NotebookHistoryVersion = { id: string; savedAt: number; reason: 'edit' | 'update' | 'restore'; current: NotebookPackage; notes: string; progress: NotebookProgress; acceptedRaw?: string }
export type ImportedNotebook = ({ original: NotebookPackage; current: NotebookPackage; originalRaw: string; entryId: string; fingerprint: string; importedAt: number; editedAt?: number; progress: NotebookProgress; notes: string; revisedFromLectureId?: string; history?: NotebookHistoryVersion[]; updateSession?: NotebookUpdateSession; acceptedRaw?: string }) & { assetLineageId?: string; assetBindings?: NotebookAssetBinding[] }

export type NotebookPackage = NotebookPackageV2 | (Omit<NotebookPackageV2, 'version' | 'instructionsVersion'> & ({ version: 3; instructionsVersion: 'notebook-workflows-draft-3' } | { version: 4; instructionsVersion: 'notebook-workflows-draft-4' }) & { assets: NotebookAsset[]; visualReview: NotebookVisualReview })
