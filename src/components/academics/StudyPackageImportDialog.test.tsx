import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { StudyPackageImportDialog } from './StudyPackageImportDialog'
import { createInitialDataForMode, useStore } from '@/store/store'
import * as imports from '@/lib/academics/studyPackageImport'
;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
it('previews and saves a guide locally without any generation request', async () => {
  const container = document.createElement('div'); document.body.append(container)
  const root = createRoot(container); const onImported = vi.fn(); const fetcher = vi.fn()
  vi.stubGlobal('fetch', fetcher)
  const hash = vi.spyOn(imports, 'studyPackageFingerprint').mockResolvedValue('test-package')
  useStore.getState().replaceAll(createInitialDataForMode(false))
  try {
    await act(async () => root.render(<StudyPackageImportDialog courseId="course" onImported={onImported} />))
    await act(async () => container.querySelector('button')!.click())
    const file = new File([''], 'guide.json', { type: 'application/json' })
    Object.defineProperty(file, 'text', { value: async () => JSON.stringify({format:'premed-os-study-package',version:1,title:'Imported psychology',sections:[{title:'Overview',blocks:[{type:'prose',text:'A connected explanation.'}]}]}) })
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!
    Object.defineProperty(input, 'files', { value: [file] })
    await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })))
    expect(document.body.textContent).toContain('Imported psychology')
    expect(useStore.getState().academics.classCenter.lectures).toHaveLength(0)
    const save = [...document.querySelectorAll('button')].find(b => b.textContent === 'Save imported guide')!
    await act(async () => save.click())
    expect(onImported).toHaveBeenCalledOnce()
    expect(useStore.getState().academics.classCenter.lectures[0].studyGuide!.sections[0].blocks[0].text?.content).toBe('A connected explanation.')
    expect(fetcher).not.toHaveBeenCalled()
  } finally { await act(async () => root.unmount()); container.remove(); hash.mockRestore(); vi.unstubAllGlobals(); useStore.getState().replaceAll(createInitialDataForMode(false)) }
})
