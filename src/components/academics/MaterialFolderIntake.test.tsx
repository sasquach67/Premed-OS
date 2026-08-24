import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSeedData } from '@/data/seed'
import { useStore } from '@/store/store'
import { MaterialFolderIntake } from './MaterialFolderIntake'

vi.mock('@/lib/supabase', () => ({ supabase: null }))
vi.mock('@/lib/academics/localFolderDiscovery', () => ({
  localFolderCapability: () => ({ available: true }),
  discoverLocalFolderManifest: vi.fn(async () => ({
    ok: true as const,
    rootLabel: 'PSYC notes',
    entries: [{ displayPath: 'Week 3/Notes/conditioning.pdf', displayName: 'conditioning.pdf', mimeType: 'application/pdf', modifiedAt: 1, sizeBytes: 20 }],
  })),
}))

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('MaterialFolderIntake', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(async () => {
    useStore.getState().replaceAll(structuredClone(createSeedData()))
    const state = useStore.getState()
    const course = state.courses[0]
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root.render(<MaterialFolderIntake course={course} onBack={vi.fn()} />)
    })
  })

  afterEach(async () => { await act(async () => root.unmount()); container.remove() })

  it('keeps a chosen local folder as a review proposal until the student accepts it', async () => {
    const initialFiles = useStore.getState().academics.classCenter.files.length
    const choose = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Choose local folder'))!
    await act(async () => choose.click())
    expect(useStore.getState().academics.classCenter.files).toHaveLength(initialFiles)
    expect(container.textContent).toContain('conditioning.pdf')
    expect(container.textContent).toContain('Week 3')

    const accept = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Accept'))!
    await act(async () => accept.click())
    const accepted = useStore.getState().academics.classCenter.files.at(-1)!
    expect(accepted).toMatchObject({ title: 'conditioning', sourceType: 'folder-intake', folderIntake: { placementState: 'confirmed', week: 'Week 3' } })
    expect(useStore.getState().academics.classCenter.watchedNoteProposals.at(-1)).toMatchObject({ status: 'accepted', acceptedFileId: accepted.id })
  })
})
