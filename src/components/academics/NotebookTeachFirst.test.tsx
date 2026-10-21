import {act} from 'react'
import {createRoot,type Root} from 'react-dom/client'
import {beforeEach,afterEach,expect,it,vi} from 'vitest'
import repertoire from '@/lib/academics/notebook/visual-fixtures/valid-v4-repertoire.json'
import type {NotebookEntry,NotebookPackage} from '@/lib/academics/notebook/types'
import {parseNotebookPackage} from '@/lib/academics/notebook/package'
import {createInitialDataForMode,useStore} from '@/store/store'
import {NotebookPackageView} from './ExternalNotebookView'
import {NotebookMasteryObjectives} from './NotebookMasteryObjectives'
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

/** A beta-33 teach-first section: question, lede, walkthrough (figure inside point 1), so what, key idea, map. */
function fixture(){
 const p=structuredClone(repertoire) as unknown as NotebookPackage,e=p.entries[0]
 const s=e.sections.find(section=>section.id==='fixture-route')!
 const annotation=e.sections.flatMap(x=>x.blocks).find(b=>b.type==='annotated-figure')!
 if(annotation.type!=='annotated-figure')throw new Error('fixture')
 const common={sourceIds:[],excerptIds:[],provenance:'background' as const}
 s.blocks.unshift(
  {...common,id:'tf-question',type:'callout',tone:'question',text:'Why does the route change at the junction?'},
  {...common,id:'tf-lede',type:'paragraph',role:'lede',text:'The route changes because the junction sorts arrivals by type.'},
  {...common,id:'tf-walk',type:'walkthrough',items:[
   {point:'Arrivals are sorted at the junction.',paragraphs:['Each arrival carries a type marker.','The marker decides which branch it takes.'],figureBlockId:'tf-figure'},
   {point:'Each branch leads somewhere different.',paragraphs:['Branches end at different stops.'],cards:[{label:'North branch',text:'Ends at the depot.'},{label:'South branch',text:'Ends at the market.'}],attachedBlockIds:['tf-table'],note:{label:'Your notes',text:'Your notes: The marker is read once, at the junction.'}},
   {point:'The sorting repeats at the next junction.',paragraphs:['The same rule applies again downstream.']},
  ]},
  {...common,id:'tf-sowhat',type:'paragraph',role:'why',text:'This is why later stops can be predicted from the marker.'},
  {...common,id:'tf-key',type:'callout',tone:'one-thing',text:'The marker, read at the junction, sets the route.'},
 )
 s.blocks.push(
  {id:'tf-figure',type:'figure',provenance:annotation.provenance,sourceIds:annotation.sourceIds,excerptIds:annotation.excerptIds,assetIds:annotation.assetIds,assetId:annotation.assetId,caption:annotation.caption,alt:annotation.alt,context:annotation.context,lookFor:['Find the junction.','Follow one branch.']},
  {...common,id:'tf-table',type:'table',columns:['Branch','Stop'],rows:[['North','Depot'],['South','Market']]},
 )
 return p
}
async function show(p:NotebookPackage,mode:'study'|'practice'='study'){await act(async()=>root.render(<NotebookPackageView pkg={p} entryId={p.entries[0].id} mode={mode} reader/>))}

it('validates a walkthrough package and renders it teach-first, with the figure inside its point and nowhere else',async()=>{
 const p=fixture();expect(parseNotebookPackage(JSON.stringify(p))).toEqual(p);await show(p)
 expect(host.querySelector('.nbr-doc')?.classList).toContain('sg')
 const sec=host.querySelector('.lf-sec.sg-x')!
 expect(sec.querySelector('[data-q]')?.textContent).toContain('Why does the route change')
 expect(sec.querySelector('.sg-lede-big')?.textContent).toContain('sorts arrivals by type')
 const points=[...sec.querySelectorAll('.sg-walk>li>h4')].map(h=>h.textContent)
 expect(points).toEqual(['Arrivals are sorted at the junction.','Each branch leads somewhere different.','The sorting repeats at the next junction.'])
 expect(sec.querySelector('.sg-walk>li:first-child .sg-walkfig [data-guide-block="tf-figure"]')).not.toBeNull()
 expect(host.querySelectorAll('[data-guide-block="tf-figure"]')).toHaveLength(1)
 expect(sec.querySelector('.sg-walk>li:nth-child(2) .sg-tbl [data-guide-block="tf-table"]')).not.toBeNull()
 expect(host.querySelectorAll('[data-guide-block="tf-table"]')).toHaveLength(1)
 expect([...sec.querySelectorAll('.sg-cond>div>b')].map(b=>b.textContent)).toEqual(['North branch','South branch'])
 const note=sec.querySelector('.sg-walk .sg-note')!;expect(note.querySelector('.sg-k')?.textContent).toBe('Your notes');expect(note.textContent).not.toContain('Your notes: ')
 expect(sec.querySelector('.sg-take .sg-k')?.textContent).toBe('Key idea')
 expect(sec.querySelector('.lf-why')?.textContent).toContain('later stops can be predicted')
 expect(sec.querySelector('.sg-ref')?.textContent).toBe('Keep it straight')
 expect(sec.querySelector('.wt-map>ul>li>.wt-node')).not.toBeNull()
})

it('shows only the point sentences in Condensed',async()=>{
 localStorage.setItem(notebookReadingDetailKey()!,'condensed');await show(fixture())
 const sec=host.querySelector('.lf-sec.sg-x')!
 expect(sec.querySelectorAll('.sg-walk>li>h4')).toHaveLength(3)
 expect(sec.querySelectorAll('.sg-walk p')).toHaveLength(0)
 expect(sec.querySelector('.sg-walkfig')).toBeNull()
 expect(sec.querySelector('[data-q]')).not.toBeNull();expect(sec.querySelector('.sg-take')).not.toBeNull();expect(sec.querySelector('.wt-map')).not.toBeNull()
})

it.each([
 ['a missing figure',(w:{items:{figureBlockId?:string}[]})=>{w.items[0].figureBlockId='nowhere'}],
 ['a figure id that names a table',(w:{items:{figureBlockId?:string}[]})=>{w.items[0].figureBlockId='tf-table'}],
 ['a block attached twice',(w:{items:{attachedBlockIds?:string[]}[]})=>{w.items[2].attachedBlockIds=['tf-table']}],
])('rejects a walkthrough with %s',(_,mutate)=>{
 const p=fixture(),w=p.entries[0].sections.flatMap(s=>s.blocks).find(b=>b.id==='tf-walk')!
 mutate(w as never);expect(()=>parseNotebookPackage(JSON.stringify(p))).toThrow(/walkthrough/i)
})

it('renders structured class questions in Practice',async()=>{
 const p=fixture(),practice=p.entries[0].sections.flatMap(s=>s.blocks).find(b=>b.type==='practice')!
 if(practice.type!=='practice')throw new Error('fixture')
 Object.assign(practice,{src:'Slide 10',matching:{left:['Can become any cell type','Can become most cell types'],right:['Pluripotent','Totipotent']},table:{columns:['Trait','Cancer cell','Stem cell'],rows:[['Telomerase'],['Can differentiate']]},parts:['Why move the nucleus?','Did the nuclei differ?']})
 expect(parseNotebookPackage(JSON.stringify(p))).toEqual(p);await show(p,'practice')
 expect(host.querySelector('.np-structure .mq-src')?.textContent).toBe('Slide 10')
 expect(host.querySelectorAll('.mq-match>div:first-child>p')).toHaveLength(2)
 expect(host.querySelectorAll('.mq-tbl tbody tr')).toHaveLength(2)
 expect(host.querySelectorAll('.mq-tbl tbody tr:first-child td')).toHaveLength(3)
 expect(host.querySelectorAll('.mq-parts>p')).toHaveLength(2)
})

it('shows How it may be tested as an exam forecast with its basis and a Practice these hand-off',async()=>{
 const onPractice=vi.fn()
 const entry={id:'e',revision:1,baseRevision:null,title:'Lesson 14',goal:'review',scope:'x',request:{helpStage:null,classPreferences:'',assessmentFormat:null},sections:[],requirements:[],limitations:[],objectives:[{id:'o1',requirementId:'r',title:'Study objective: Compare cell types',origin:'derived',sourceIds:[],excerptIds:[],freeRecallCues:[],watchFor:[],practiceBlockIds:['p1'],evidenceLimit:null,understand:['Cancer cells express telomerase.'],beAbleToDo:[],applicationSkills:[{text:'Given data, classify the cell.',questionIds:['q1']}],howTested:{setup:'Most of these questions hand you data.',questions:[{id:'q1',text:'Compare the phenotype of a cancer cell and a stem cell.',sourceIds:[],excerptIds:[]}],forecast:[{format:'Data set',text:'Which cell is more likely a cancer cell?'},{format:'Trap',text:'Does a skin cell have the telomerase gene?'},{format:'Category grid',text:'In which cell(s) is telomerase high?'}],basis:'Based on your past Exam 2 papers.'}}]} as unknown as NotebookEntry
 await act(async()=>root.render(<NotebookMasteryObjectives entry={entry} renderEvidence={()=>null} onPractice={onPractice}/>))
 const card=host.querySelector('.sg .mq-card')!
 expect(card.querySelector('.mq-title')?.textContent).toBe('Compare cell types')
 expect([...card.querySelectorAll('.mq-fcl .mq-fmt')].map(x=>x.textContent)).toEqual(['Data set','Trap','Category grid'])
 expect(card.querySelector('.mq-basis')?.textContent).toBe('Based on your past Exam 2 papers.')
 expect(card.textContent).not.toContain('Compare the phenotype of a cancer cell')
 await act(async()=>card.querySelector<HTMLButtonElement>('.mq-go')!.click())
 expect(onPractice).toHaveBeenCalledWith(['p1'])
})
