import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ExternalNotebookWorkflow } from './ExternalNotebookWorkflow'
import { createInitialDataForMode, useStore } from '@/store/store'
import { visualFixture } from '@/lib/academics/notebook/visual.test-fixtures'
import * as bundles from '@/lib/academics/notebook/notebookBundle'
import * as assets from '@/lib/academics/notebook/notebookAssetStore'
import type { NotebookUpdateSession } from '@/lib/academics/notebook/types'
let root:Root, container:HTMLDivElement
const baseline=visualFixture(), courseId='ai-flow-class'
const revision:NotebookUpdateSession={id:'update',localId:'saved',createdAt:1,baseline}
const button=(label:string)=>[...container.querySelectorAll<HTMLButtonElement>('button')].find(node=>node.textContent?.trim()===label)!
beforeEach(()=>{
 vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);sessionStorage.clear()
 const state=createInitialDataForMode(false);state.courses=[{id:courseId,code:baseline.course.code,title:baseline.course.title,term:baseline.course.term??'',credits:3,grade:'',bcpm:false,status:'in-progress',inResidence:true,satisfies:[],order:0}];useStore.getState().replaceAll(state)
 Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:vi.fn().mockResolvedValue(undefined)}})
 vi.spyOn(assets,'notebookAssetRepository').mockReturnValue({} as ReturnType<typeof assets.notebookAssetRepository>)
 vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:baseline');vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{})
 vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{})
 container=document.createElement('div');document.body.append(container);root=createRoot(container)
})
afterEach(async()=>{await act(async()=>root.unmount());container.remove();vi.restoreAllMocks();vi.unstubAllGlobals()})
async function render(fresh=true){await act(async()=>root.render(<ExternalNotebookWorkflow courseId={courseId} revision={revision} baselineFresh={fresh} onImported={()=>{}} />))}
it('exports the matching baseline and its image closure before enabling the update prompt',async()=>{
 const exported=vi.spyOn(bundles,'exportNotebookPackageBundle').mockResolvedValue(new Blob(['real bundle adapter'],{type:'application/zip'}))
 await render();expect(button('Copy prompt').disabled).toBe(true)
 await act(async()=>container.querySelector<HTMLButtonElement>('.nai-file button')!.click())
 expect(exported).toHaveBeenCalledWith(JSON.stringify(baseline,null,2),[],expect.anything())
 expect(button('Copy prompt').disabled).toBe(false)
 await act(async()=>button('Copy prompt').click())
 expect(navigator.clipboard.writeText).toHaveBeenCalledWith(container.querySelector<HTMLTextAreaElement>('[aria-label="Full customized prompt"]')!.value)
 expect(button('Choose the folder your AI made').disabled).toBe(false)
})
it('keeps prompt acknowledgement blocked when original image export fails',async()=>{
 vi.spyOn(bundles,'exportNotebookPackageBundle').mockRejectedValue(new Error('Missing original image'))
 await render();await act(async()=>container.querySelector<HTMLButtonElement>('.nai-file button')!.click())
 expect(container.textContent).toContain('Missing original image');expect(button('Copy prompt').disabled).toBe(true)
 expect(button('I copied it manually').disabled).toBe(true)
})
it('disables baseline export and prompt copying as soon as saved content becomes stale',async()=>{
 vi.spyOn(bundles,'exportNotebookPackageBundle').mockResolvedValue(new Blob(['bundle']))
 await render();await act(async()=>button('I already have the current notebook and images').click());await act(async()=>button('Copy prompt').click())
 await render(false)
 expect(button('Copy prompt').disabled).toBe(true);expect(container.querySelector<HTMLButtonElement>('.nai-file button')!.disabled).toBe(true)
 expect(button('Choose the folder your AI made').disabled).toBe(true)
 expect(container.querySelector<HTMLTextAreaElement>('[aria-label="Full customized prompt"]')!.value).toBe('')
 expect(container.querySelector<HTMLTextAreaElement>('[aria-label="Saved baseline JSON"]')!.value).toBe('')
})
