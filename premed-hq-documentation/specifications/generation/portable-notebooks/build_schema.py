"""Build the proposed portable contract. Learning rules live in canonical Markdown."""
from pathlib import Path
import json

OUT = Path(__file__).parent
def obj(props, required=None):
    return {'type':'object','additionalProperties':False,'properties':props,'required':list(props) if required is None else required}
def arr(item, minimum=0): return {'type':'array','items':item,'minItems':minimum,'maxItems':5000}
def enum(*values): return {'enum':list(values)}
def ref(name): return {'$ref':'#/$defs/'+name}
s={'type':'string','minLength':1,'maxLength':200000}
ids=arr(s)
nullable={'type':['string','null'],'maxLength':200000}
status=enum('supported','partial','missing','out-of-scope')
evidence={'sourceIds':ids,'excerptIds':ids}
common={'id':s,'provenance':enum('source','clarification','background','generated-practice','student-work'),**evidence}
def block(kind,props): return obj({**common,'type':{'const':kind},**props})
blocks=[block('paragraph',{'text':s}),block('bullets',{'items':arr(s,1)}),block('steps',{'items':arr(s,1)}),block('table',{'columns':arr(s,1),'rows':arr(arr(s,1),1)}),block('practice',{'prompt':s,'answer':s,'rationale':s}),block('gap',{'text':s,'nextStep':s})]
source=obj({'id':s,'title':s,'role':enum('transcript','personal-notes','slides','reading','objectives','assessment-scope','assignment-prompt','rubric','reference-questions','answer-key','student-attempt','other'),'access':enum('read','partial','unreadable','not-accessed'),'inspected':{'type':'string','maxLength':200000},'limitations':ids,'used':{'type':'boolean'},'excerpts':arr(obj({'id':s,'location':nullable,'text':s}))})
section=obj({'id':s,'title':s,'purpose':enum('study-guide','preparation','practice','workspace','check','next-steps'),'blocks':arr(ref('block'),1)})
requirement=obj({'id':s,'kind':enum('objective','assessment','assignment','student-request'),'text':s,'authority':enum('official','student-request','selected-material'),**evidence,'status':status,'basis':s,'sectionIds':ids,'nextStep':nullable})
objective=obj({'id':s,'requirementId':s,'title':s,'origin':enum('official','derived'),**evidence,'freeRecallCues':arr(s,1),'understand':arr(s,1),'beAbleToDo':ids,'watchFor':ids,'practiceBlockIds':ids,'evidenceLimit':nullable})
entry=obj({'id':s,'revision':{'type':'integer','minimum':1},'baseRevision':{'type':['integer','null'],'minimum':1},'title':s,'goal':enum('review','assessment','assignment'),'scope':s,'request':obj({'helpStage':nullable,'classPreferences':{'type':'string','maxLength':200000},'assessmentFormat':nullable}),'sections':arr(ref('section'),1),'objectives':arr(ref('objective')),'requirements':arr(ref('requirement'),1),'limitations':ids})
entry['allOf']=[{'if':{'properties':{'goal':{'enum':['assessment','assignment']}}},'then':{'properties':{'objectives':{'maxItems':0}}}}]
schema=obj({'format':{'const':'premed-os-notebook-package'},'version':{'const':2},'instructionsVersion':{'const':'notebook-workflows-draft-2'},'course':obj({'code':s,'title':s,'term':nullable}),'sources':arr(ref('source'),1),'entries':arr(ref('entry'),1)})
schema.update({'$schema':'https://json-schema.org/draft/2020-12/schema','$defs':{'block':{'oneOf':blocks},'source':source,'section':section,'objective':objective,'requirement':requirement,'entry':entry}})
(OUT/'notebook-package.schema.json').write_text(json.dumps(schema,indent=2)+'\n')
print('Wrote notebook-package.schema.json, format version 2.')
