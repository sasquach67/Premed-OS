import type { Evidence, ImportedNotebook, NotebookBlock, NotebookEntry, NotebookHistoryVersion, NotebookPackage, NotebookUpdateSession } from './types'

export type VisualEvidence = Evidence & { assetIds?: string[] }
export type NotebookAsset = {
  id: string
  sourceId: string
  location: string
  fileName: string
  mimeType: 'image/png' | 'image/jpeg'
  originalAssetId: string | null
  alteration: string | null
}
export type NotebookVisualReview = {
  sources: {
    sourceId: string
    discovery: 'complete' | 'partial' | 'not-accessed'
    imageState: 'images-found' | 'none-found' | 'unknown'
    inspectedPortions: string[]
    unprocessedPortions: string[]
    limitations: string[]
  }[]
  candidates: {
    id: string
    sourceId: string
    location: string
    discovered: boolean
    inspection: 'inspected' | 'unclear' | 'not-inspected' | 'inaccessible' | 'missing'
    decision: 'selected' | 'skipped' | 'pending' | 'unavailable'
    assetId: string | null
    reason: string
    nextStep: string | null
    duplicateOf: string | null
    changedFrom: string | null
  }[]
}
export type NotebookDiagramNode = VisualEvidence & { id: string; label: string; assetIds: string[] }
export type NotebookDiagramEdge = NotebookDiagramNode & {
  from: string
  to: string
  relation: 'sequence' | 'association' | 'contains' | 'causes' | 'inhibits' | 'other'
}
export type NotebookFigureBlock = VisualEvidence & Pick<NotebookBlock, 'id' | 'provenance'> & {
  type: 'figure'; assetId: string; caption: string | null; alt: string; context: string
}
export type NotebookStudyDiagramBlock = VisualEvidence & Pick<NotebookBlock, 'id' | 'provenance'> & {
  type: 'study-diagram'; kind: 'concept-map' | 'flowchart'; title: string
  nodes: NotebookDiagramNode[]; edges: NotebookDiagramEdge[]
}
export type VisualNotebookBlock = (NotebookBlock & { assetIds?: string[]; stimulusBlockIds?: string[] }) | NotebookFigureBlock | NotebookStudyDiagramBlock
export type VisualNotebookEntry = Omit<NotebookEntry, 'sections' | 'requirements' | 'objectives'> & {
  sections: (Omit<NotebookEntry['sections'][number], 'blocks'> & { blocks: VisualNotebookBlock[] })[]
  requirements: (NotebookEntry['requirements'][number] & VisualEvidence)[]
  objectives: (NotebookEntry['objectives'][number] & VisualEvidence)[]
}
export type VisualNotebookPackage = Omit<NotebookPackage, 'version' | 'instructionsVersion' | 'entries'> & {
  version: 3
  instructionsVersion: 'notebook-workflows-draft-3'
  entries: VisualNotebookEntry[]
  assets: NotebookAsset[]
  visualReview: NotebookVisualReview
}
/** The v2 entrypoint stays unchanged until image-aware UI integration is complete. */
export type PortableNotebookPackage = NotebookPackage | VisualNotebookPackage
export type NotebookAssetBinding = {
  assetId: string
  sha256: string
  mimeType: NotebookAsset['mimeType']
  byteLength: number
  width: number
  height: number
}
export type PortableNotebookHistory = Omit<NotebookHistoryVersion, 'current'> & { current: PortableNotebookPackage }
export type PortableNotebookUpdate = Omit<NotebookUpdateSession, 'baseline'> & { baseline: PortableNotebookPackage }
export type PortableImportedNotebook = Omit<ImportedNotebook, 'original' | 'current' | 'history' | 'updateSession'> & {
  original: PortableNotebookPackage
  current: PortableNotebookPackage
  history?: PortableNotebookHistory[]
  updateSession?: PortableNotebookUpdate
  assetLineageId?: string
  assetBindings?: NotebookAssetBinding[]
}
