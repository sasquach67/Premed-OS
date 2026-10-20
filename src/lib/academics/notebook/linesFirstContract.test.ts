// @vitest-environment node
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import repertoire from './visual-fixtures/valid-v4-repertoire.json'
import { parseNotebookPackage, prepareNotebook } from './package'
import type { NotebookBlock, NotebookPackage } from './types'
import { validateSchema, type Schema } from './schemaValidator'

function fixture() {
 const pkg = structuredClone(repertoire) as unknown as NotebookPackage
 const entry = pkg.entries[0], section = entry.sections[0]
 const common = { id: 'explanation', provenance: 'background' as const, sourceIds: [], excerptIds: [] }
 section.blocks.push(
  { ...common, type:'paragraph', role:'connects', detail:'core', text:'The previous result supplies the next mechanism.' },
  { ...common, id:'why', type:'paragraph', role:'why', text:'The components interact because their structures permit binding.' },
  { ...common, id:'deeper', type:'paragraph', role:'deeper', detail:'extra', text:'A further example explains the relationship.' },
  { ...common, id:'mechanism', type:'steps', items:['A legacy step.', {text:'A component binds its target.',reason:'The binding sites have complementary structures.'}, {text:'The target changes activity.'}] },
  { ...common, id:'argument', type:'claim', claim:'The evidence supports the claim.', evidence:['One observed pattern.','A second observed pattern.'], soWhat:'The patterns explain the outcome.' },
 )
 const annotated = entry.sections.flatMap(s=>s.blocks).find(b=>b.type==='annotated-figure')!
 if(annotated.type==='annotated-figure') { annotated.lookFor=['Find the labeled region.','Follow the directional arrow.']; section.blocks.push({id:'source-figure',type:'figure',provenance:annotated.provenance,sourceIds:annotated.sourceIds,excerptIds:annotated.excerptIds,assetIds:annotated.assetIds,assetId:annotated.assetId,caption:annotated.caption,alt:annotated.alt,context:annotated.context,lookFor:[...annotated.lookFor]}) }
 entry.argumentChain=entry.sections.slice(0,4).map((s,i)=>({label:`Link ${i+1}`,line:'One part supports the next.',sectionId:s.id}))
 for(const block of entry.sections.flatMap(s=>s.blocks)) block.detail='core'
 const practice=entry.sections.flatMap(s=>s.blocks).find(b=>b.type==='practice')!
 if(practice.type==='practice'){practice.options=['Left','Right'];practice.correctIndex=0}
 return pkg
}
const practice=(p:NotebookPackage)=>p.entries[0].sections.flatMap(s=>s.blocks).find(b=>b.type==='practice') as Extract<NotebookBlock,{type:'practice'}>
it('prepares every additive explanation field, all block detail flags and mixed legacy/new steps through the real importer',async()=>{
 const pkg=fixture(), raw=JSON.stringify(pkg)
 expect((await prepareNotebook(raw)).package).toEqual(pkg)
})
it('continues to parse the original v4 repertoire without adding or removing fields',()=>{expect(parseNotebookPackage(JSON.stringify(repertoire))).toEqual(repertoire)})
it.each([
 ['runtime','./notebook-package-v4.schema.json'],
 ['portable','../../../../premed-hq-documentation/specifications/generation/portable-notebooks/notebook-package-v4.schema.json'],
 ['prompt','../../../../premed-hq-documentation/specifications/generation/portable-notebooks/notebook-prompt-v4.schema.json'],
])('accepts the same full new package in the %s v4 schema',(_,file)=>{
 const schema=JSON.parse(readFileSync(new URL(file,import.meta.url),'utf8')) as Schema
 expect(()=>validateSchema(fixture(),schema)).not.toThrow()
})
it.each([
 ['options without answer index',(p:NotebookPackage)=>{delete practice(p).correctIndex}],
 ['answer index without options',(p:NotebookPackage)=>{delete practice(p).options}],
 ['out of range answer index',(p:NotebookPackage)=>{practice(p).correctIndex=2}],
 ['negative answer index',(p:NotebookPackage)=>{practice(p).correctIndex=-1}],
 ['fractional answer index',(p:NotebookPackage)=>{practice(p).correctIndex=.5}],
 ['too few choices',(p:NotebookPackage)=>{practice(p).options=['Only']}],
 ['too many choices',(p:NotebookPackage)=>{practice(p).options=Array.from({length:7},(_,i)=>String(i))}],
 ['foreign argument section',(p:NotebookPackage)=>{p.entries[0].argumentChain![0].sectionId='missing'}],
 ['empty step reason',(p:NotebookPackage)=>{const b=p.entries[0].sections[0].blocks.find(b=>b.id==='mechanism');if(b?.type==='steps')b.items=[{text:'A step.',reason:''}]}],
 ['unknown paragraph role',(p:NotebookPackage)=>{Object.assign(p.entries[0].sections[0].blocks.find(b=>b.id==='why')!,{role:'unsupported'})}],
 ['empty claim support',(p:NotebookPackage)=>{const b=p.entries[0].sections[0].blocks.find(b=>b.type==='claim');if(b?.type==='claim')b.evidence=[]}],
] as const)('rejects invalid %s',(_,mutate)=>{const p=fixture();mutate(p);expect(()=>parseNotebookPackage(JSON.stringify(p))).toThrow()})
it('accepts the last valid answer index for six choices',()=>{
 const p=fixture();practice(p).options=['A','B','C','D','E','F'];practice(p).correctIndex=5
 expect(parseNotebookPackage(JSON.stringify(p))).toEqual(p)
})
