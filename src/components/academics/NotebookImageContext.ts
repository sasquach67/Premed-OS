import { createContext } from 'react'
import type { PortableNotebookPackage } from '@/lib/academics/notebook/visualTypes'

export type NotebookImageState = { status: 'loading' | 'ready' | 'missing'; url?: string; width?: number; height?: number; error?: string }
export type NotebookVisualContext = { pkg?: PortableNotebookPackage; images: Map<string, NotebookImageState>; fail: (id: string) => void }
export const NotebookImages = createContext<NotebookVisualContext>({ images: new Map(), fail: () => undefined })
