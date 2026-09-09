"""Agreed v4 visual repertoire; derives from the immutable exact v3 schema."""
from pathlib import Path
import copy,json
ROOT=Path(__file__).parent

def build():
    schema=json.loads((ROOT/'notebook-package-v3.schema.json').read_text())
    def obj(props):return {'type':'object','additionalProperties':False,'properties':props,'required':list(props)}
    def arr(item,maximum=256,minimum=0):return {'type':'array','items':item,'minItems':minimum,'maxItems':maximum}
    def enum(*values):return {'enum':list(values)}
    ident={'type':'string','minLength':1,'maxLength':200}
    short={'type':'string','minLength':1,'maxLength':240}
    detail={'type':'string','minLength':1,'maxLength':2000}
    text={'type':'string','minLength':1,'maxLength':200000}
    note={'type':'string','minLength':1,'maxLength':1000}
    def nullable(s):return {**s,'type':['string','null']}
    num={'type':['number','null']}
    ev={'sourceIds':arr(ident),'excerptIds':arr(ident),'assetIds':arr(ident,64)}
    variants=schema['$defs']['block']['oneOf']
    common=copy.deepcopy(variants[0]['properties']);common.pop('type');common.pop('text')
    def block(kind,props):
        item=obj({**copy.deepcopy(common),'type':{'const':kind},'title':copy.deepcopy(short),**props})
        item['required'].remove('assetIds')
        return item
    schema['properties']['version']={'const':4}
    schema['properties']['instructionsVersion']={'const':'notebook-workflows-draft-4'}
    diag=next(x for x in variants if x['properties']['type'].get('const')=='study-diagram')
    diag['properties']['kind']['enum']+=['decision-tree','hierarchy','causal-chain']
    diag['allOf']=[{'if':{'properties':{'kind':enum('decision-tree','hierarchy','causal-chain')}},'then':{'properties':{'nodes':{'minItems':2,'maxItems':12},'edges':{'minItems':1,'maxItems':11}}}}]
    oldfigure=next(x for x in variants if x['properties']['type'].get('const')=='figure')['properties']
    annotation=obj({'id':ident,'label':short,'x':{'type':'number','minimum':0,'maximum':1},'y':{'type':'number','minimum':0,'maximum':1},'positionBasis':{'type':'string','minLength':1,'maxLength':400},**ev})
    variants.append(block('annotated-figure',{**{k:copy.deepcopy(oldfigure[k]) for k in ['assetId','caption','alt','context']},'annotations':arr(annotation,12,1)}))
    axis=obj({'mode':enum('ordinal','numeric'),'unit':nullable(short),'minimum':num,'maximum':num})
    event=obj({'id':ident,'label':short,'detail':detail,'timeLabel':nullable(short),'value':num,**ev})
    variants.append(block('timeline',{'orderingBasis':note,'axis':axis,'events':arr(event,12,2)}))
    setitem=obj({'id':ident,'label':short,**ev})
    member=obj({'id':ident,'text':short,**ev})
    region=obj({'id':ident,'setIds':arr(ident,2,1),'items':arr(member,8)})
    variants.append(block('venn',{'sets':arr(setitem,2,2),'regions':arr(region,3,3)}))
    seqstep=obj({'id':ident,'label':short,'detail':detail,'assetId':nullable(ident),'alt':nullable(note),**ev})
    variants.append(block('sequence-strip',{'orderingBasis':note,'steps':arr(seqstep,8,2)}))
    solutionstep=obj({'id':ident,'label':short,'explanation':text,**ev})
    variants.append(block('worked-example',{'problem':text,'problemEvidence':obj(ev),'solutionEvidence':obj(ev),'stimulusBlockIds':arr(ident,64),'steps':arr(solutionstep,8,1),'answer':text,'check':nullable(text)}))
    point=obj({'id':ident,'label':short,'detail':detail,'value':num,**ev})
    variants.append(block('continuum',{'orderingBasis':note,'axis':copy.deepcopy(axis),'points':arr(point,12,2)}))
    return schema

if __name__=='__main__':
    path=ROOT/'notebook-package-v4.schema.json';path.write_text(json.dumps(build(),indent=2)+'\n');print(path)
