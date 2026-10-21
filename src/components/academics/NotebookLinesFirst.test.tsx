import {act} from 'react'
import {createRoot,type Root} from 'react-dom/client'
import {MemoryRouter} from 'react-router-dom'
import {beforeEach,afterEach,expect,it,vi} from 'vitest'
import repertoire from '@/lib/academics/notebook/visual-fixtures/valid-v4-repertoire.json'
import type {NotebookPackage} from '@/lib/academics/notebook/types'
import type {LectureRecord} from '@/lib/types'
import {parseNotebookPackage} from '@/lib/academics/notebook/package'
import {revisionFixture} from '@/lib/academics/notebook/revision.test-fixtures'
import {createInitialDataForMode,useStore} from '@/store/store'
import {NotebookPackageView,ExternalNotebookView} from './ExternalNotebookView'
import {notebookReadingDetailKey} from './useNotebookReadingDetail'
let host:HTMLDivElement,root:Root
beforeEach(()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
 vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}})
 Object.defineProperty(HTMLElement.prototype,'scrollIntoView',{configurable:true,value:vi.fn()})
 useStore.getState().replaceAll(createInitialDataForMode(false));localStorage.setItem(notebookReadingDetailKey()!,'full')
 host=document.createElement('div');document.body.append(host);root=createRoot(host)
})
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();vi.restoreAllMocks()})
function fixture(){
 const p=structuredClone(repertoire) as unknown as NotebookPackage,e=p.entries[0],s=e.sections[0]
 const common={sourceIds:[],excerptIds:[],provenance:'background' as const}
 s.blocks.push(
  {...common,id:'connection',type:'paragraph',role:'connects',detail:'core',text:'The first relationship supplies the next step.'},
  {...common,id:'reasoned-steps',type:'steps',items:['Legacy string step.',{text:'The component binds.',reason:'Its binding site matches the target.'}]},
  {...common,id:'why',type:'paragraph',role:'why',detail:'core',text:'The parts fit because their structures permit binding.',more:'Legacy deeper text.'},
  {...common,id:'deeper',type:'paragraph',role:'deeper',text:'Further reasoning remains available in Full.'},
  {...common,id:'extra',type:'callout',tone:'lecture-example',detail:'extra',text:'An extra illustrative example.'},
  {...common,id:'claim',type:'claim',claim:'The observation supports the claim.',evidence:['A recorded observation.'],soWhat:'This explains the result.'},
 )
 e.argumentChain=e.sections.slice(0,4).map((section,i)=>({label:`Link ${i+1}`,line:'One relationship supports another.',sectionId:section.id}))
 const annotation=e.sections.flatMap(s=>s.blocks).find(b=>b.type==='annotated-figure')!
 if(annotation.type==='annotated-figure'){annotation.lookFor=['Locate the first marker.','Compare the adjacent region.'];s.blocks.push({id:'plain-figure',type:'figure',provenance:annotation.provenance,sourceIds:annotation.sourceIds,excerptIds:annotation.excerptIds,assetIds:annotation.assetIds,assetId:annotation.assetId,caption:annotation.caption,alt:annotation.alt,context:annotation.context,lookFor:['Read the source caption.','Compare its two regions.']})}
 const practice=e.sections.flatMap(s=>s.blocks).find(b=>b.type==='practice')!
 if(practice.type==='practice'){
  practice.stimulusBlockIds=[];practice.assetIds=[];practice.sourceIds=['ref'];practice.options=['Correct structure','Another structure'];practice.correctIndex=0;practice.rationale='A sequence explains ordered changes.'
  const section=e.sections.find(s=>s.blocks.includes(practice))!
  section.blocks.push({...practice,id:'wrong-pick',prompt:'Pick the matching relationship.',options:['Incorrect structure','Matching relationship'],correctIndex:1,rationale:'The evidence supports the matching relationship.'},{...practice,id:'legacy-free',prompt:'State the relationship.',options:undefined,correctIndex:undefined,answer:'The legacy free response.',rationale:'Its original reason.'})
 }
 return p
}
async function show(p:NotebookPackage,mode:'study'|'practice'='study'){await act(async()=>root.render(<NotebookPackageView pkg={p} entryId={p.entries[0].id} mode={mode} reader/>))}
it('renders all explanation surfaces and functional argument-chain links without mutating the package',async()=>{
 const p=fixture(),before=JSON.stringify(p);expect(parseNotebookPackage(before)).toEqual(p);await show(p)
 expect(host.querySelector('.lf-link')?.textContent).toContain('The first relationship supplies the next step.')
 expect(host.querySelector('.lf-sw')?.textContent).toContain('Its binding site matches the target.')
 expect(host.querySelector('.lf-why')?.textContent).toContain('The parts fit because')
 expect(host.querySelector('.lf-cer')?.textContent).toContain('The observation supports the claim.')
 expect(host.querySelector('.lf-cer')?.textContent).toContain('A recorded observation.')
 expect(host.querySelector('.lf-cer')?.textContent).toContain('This explains the result.')
 expect(host.querySelector('.lf-tl')?.textContent).toContain('09:00')
 expect(host.querySelectorAll('.lf-look')).toHaveLength(2)
 expect(host.querySelector('[data-guide-block="plain-figure"] .lf-look')?.textContent).toContain('Read the source caption.')
 expect(host.querySelector('[data-visual-type="annotated-figure"] .lf-look')?.textContent).toContain('Locate the first marker.')
 const links=host.querySelectorAll<HTMLAnchorElement>('.lf-chain a');expect(links).toHaveLength(4)
 await act(async()=>links[1].click())
 const target=document.getElementById(decodeURIComponent(links[1].hash.slice(1)))!
 expect(document.activeElement).toBe(target);expect(target.scrollIntoView).toHaveBeenCalled()
 expect(host.querySelector('[data-guide-block="reasoned-steps"] ol li')?.textContent).toBe('Legacy string step.')
 expect(JSON.stringify(p)).toBe(before)
})
it('Condensed hides extra and deeper blocks and legacy more, retaining core explanations and reasons',async()=>{
 const p=fixture();await show(p)
 const choose=[...host.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent==='Condensed')!
 await act(async()=>choose.click())
 expect(host.querySelector('[data-guide-block="extra"]')).toBeNull()
 expect(host.querySelector('[data-guide-block="deeper"]')).toBeNull()
 expect(host.querySelector('[data-guide-block="why"]')?.textContent).toContain('The parts fit because')
 expect(host.querySelector('.lf-sw')?.textContent).toContain('binding site')
 expect(host.querySelector('[data-guide-block="why"] .nbr-additional-detail')?.hasAttribute('hidden')).toBe(true)
 await act(async()=>[...host.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent?.startsWith('Full'))!.click())
 expect(host.querySelector('[data-guide-block="extra"]')).not.toBeNull()
 expect(host.querySelector('[data-guide-block="deeper"]')).not.toBeNull()
})
it('MC picks mark right and wrong, reveal reasons, lock choices and preserve free-response Reveal',async()=>{
 const p=fixture(),before=JSON.stringify(p);await show(p,'practice')
 const cards=host.querySelectorAll<HTMLElement>('.lf-multiple-choice');expect(cards).toHaveLength(2)
 expect(host.querySelector('.wt-fb')).toBeNull()
 await act(async()=>cards[0].querySelector<HTMLButtonElement>('.wt-opt')!.click())
 expect(cards[0].querySelector('.wt-fb.ok')?.textContent).toContain('Correct.')
 expect(cards[0].querySelector('.wt-fb.ok')?.textContent).toContain('A sequence explains ordered changes.')
 await act(async()=>cards[1].querySelector<HTMLButtonElement>('.wt-opt')!.click())
 expect(cards[1].querySelector('.wt-fb.no')?.textContent).toContain('Not quite.')
 expect(cards[1].querySelector('.wt-fb.no')?.textContent).toContain('The evidence supports the matching relationship.')
 expect(cards[1].querySelectorAll('.wt-opt.wrong,.wt-opt.right')).toHaveLength(2)
 expect([...cards[1].querySelectorAll<HTMLButtonElement>('.wt-opt')].every(b=>b.disabled)).toBe(true)
 const free=host.querySelector<HTMLDetailsElement>('[data-guide-block="legacy-free"] .np-reveal')!
 expect(free.open).toBe(false);await act(async()=>free.querySelector('summary')!.click());expect(free.open).toBe(true)
 expect(free.textContent).toContain('The legacy free response.')
 expect(JSON.stringify(p)).toBe(before)
})
it.each(['flashcards','practice'] as const)('next-step Start opens the existing %s flow without generating or saving',async kind=>{
 const p=revisionFixture(),entry=p.entries[0]
 for(const section of entry.sections)section.blocks=section.blocks.filter(b=>b.type!=='practice')
 entry.sections=entry.sections.filter(section=>section.blocks.length>0)
 for(const objective of entry.objectives)objective.practiceBlockIds=[]
 const raw=JSON.stringify(p),lecture={id:'next-step-fixture',courseId:'next-step-course',title:entry.title,inputPath:'materials',processingState:'ready',workspaceState:'complete',createdAt:1,updatedAt:1,order:0,importedNotebook:{entryId:entry.id,original:structuredClone(p),current:p,originalRaw:raw,notes:'Keep notes.',progress:{},importedAt:1,fingerprint:'test'}} as LectureRecord
 const data=createInitialDataForMode(false);data.courses=[{id:lecture.courseId,...p.course,term:p.course.term??'',credits:3,grade:'',bcpm:false,status:'in-progress',inResidence:true,satisfies:[],order:0}];data.academics.classCenter.lectures=[lecture];useStore.getState().replaceAll(data)
 await act(async()=>root.render(<MemoryRouter><ExternalNotebookView lecture={lecture} courseCode={p.course.code}/></MemoryRouter>))
 expect(host.textContent).toContain('Make flashcards')
 expect(host.querySelector('.nbr-head-actions')?.textContent??'').not.toContain('Flashcards')
 expect(host.querySelectorAll('.lf-next-steps button')).toHaveLength(2)
 await act(async()=>host.querySelector<HTMLButtonElement>(`[aria-label="Start making ${kind==='flashcards'?'flashcards':'a practice set'}"]`)!.click())
 expect(host.textContent).toContain(kind==='flashcards'?'Create flashcards':'Prepare for an exam')
 expect(JSON.stringify(useStore.getState().academics.classCenter.lectures[0].importedNotebook!.current)).toBe(raw)
 expect(useStore.getState().academics.classCenter.lectures[0].importedNotebook!.notes).toBe('Keep notes.')
})
it('keeps extra-tagged practice visible when the saved guide preference is Condensed',async()=>{
 const p=fixture(),questions=p.entries[0].sections.flatMap(s=>s.blocks).filter(b=>b.type==='practice')
 for(const question of questions)question.detail='extra'
 localStorage.setItem(notebookReadingDetailKey()!,'condensed')
 await show(p,'practice')
 expect(host.querySelectorAll('.en-block-practice')).toHaveLength(questions.length)
 expect(host.querySelectorAll('.lf-multiple-choice')).toHaveLength(2)
 expect(host.querySelector('[data-guide-block="legacy-free"] .np-reveal')).not.toBeNull()
 expect(host.querySelector('.lf-practice-head')?.textContent).toContain('1 free response · 2 multiple choice')
})
it('retains a meaningful relationship when a map group has no member content',async()=>{
 const p=fixture(),section=p.entries[0].sections[0]
 const evidence={sourceIds:['ref'],excerptIds:['ref-1'],assetIds:[]}
 section.blocks.push({...evidence,id:'memberless-map',type:'study-diagram',provenance:'background',detail:'core',kind:'hierarchy',title:'Memberless relationship',nodes:[{...evidence,id:'relationship-root',label:'Cell-cycle control',tone:'neutral'},{...evidence,id:'relationship-group',label:'Checkpoint',tone:'checkpoint'}],edges:[{...evidence,id:'relationship-edge',from:'relationship-root',to:'relationship-group',relation:'association',label:'restricts progression'}]})
 await show(p)
 const map=host.querySelector('[aria-label="Memberless relationship"]')!
 expect(map.textContent).toContain('Checkpoint')
 expect(map.textContent).toContain('restricts progression')
 expect(map.querySelector('small.sr-only')).toBeNull()
})
