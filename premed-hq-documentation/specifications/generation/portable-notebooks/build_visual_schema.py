"""Build agreed v3 by extending, never overwriting, the exact v2 contract."""
from pathlib import Path
import copy,json
ROOT=Path(__file__).parent

def build():
    schema=json.loads((ROOT/'notebook-package.schema.json').read_text())
    def obj(props,required=None):return {'type':'object','additionalProperties':False,'properties':props,'required':list(props) if required is None else required}
    def arr(item,max=256,min=0):return {'type':'array','items':item,'minItems':min,'maxItems':max}
    def enum(*values):return {'enum':list(values)}
    def ref(name):return {'$ref':'#/$defs/'+name}
    text={'type':'string','minLength':1,'maxLength':1000};id={'type':'string','minLength':1,'maxLength':200}
    nullable={'type':['string','null'],'minLength':1,'maxLength':1000};nullable_id={'type':['string','null'],'minLength':1,'maxLength':200}
    ids=arr(id);ev={'sourceIds':ids,'excerptIds':ids,'assetIds':arr(id,64)}
    schema['properties']['version']={'const':3};schema['properties']['instructionsVersion']={'const':'notebook-workflows-draft-3'}
    defs=schema['$defs'];common=copy.deepcopy(defs['block']['oneOf'][0]['properties']);common.pop('type');common.pop('text');common['assetIds']=arr(id,64)
    for item in defs['block']['oneOf']:
        item['properties']['assetIds']=arr(id,64)
        if item['properties']['type'].get('const')=='practice':item['properties']['stimulusBlockIds']=arr(id,64)
    for name in ('requirement','objective'):defs[name]['properties']['assetIds']=arr(id,64)
    figure=obj({**common,'type':{'const':'figure'},'assetId':id,'caption':nullable,'alt':text,'context':text})
    figure['required'].remove('assetIds')
    node=obj({'id':id,'label':text,**ev})
    edge=obj({'id':id,'from':id,'to':id,'relation':enum('sequence','association','contains','causes','inhibits','other'),'label':text,**ev})
    diagram=obj({**common,'type':{'const':'study-diagram'},'kind':enum('concept-map','flowchart'),'title':text,'nodes':arr(node,40,1),'edges':arr(edge,80)})
    diagram['required'].remove('assetIds');defs['block']['oneOf'] += [figure,diagram]
    defs['asset']=obj({'id':id,'sourceId':id,'location':text,'fileName':{'type':'string','minLength':1,'maxLength':255,'pattern':r'^[^/\\:\x00-\x1f]+\.(png|jpg|jpeg)$'},'mimeType':enum('image/png','image/jpeg'),'originalAssetId':nullable_id,'alteration':nullable})
    defs['visualSource']=obj({'sourceId':id,'discovery':enum('complete','partial','not-accessed'),'imageState':enum('images-found','none-found','unknown'),'inspectedPortions':arr(text,128),'unprocessedPortions':arr(text,128),'limitations':arr(text,128)})
    defs['visualCandidate']=obj({'id':id,'sourceId':id,'location':text,'discovered':{'type':'boolean'},'inspection':enum('inspected','unclear','not-inspected','inaccessible','missing'),'decision':enum('selected','skipped','pending','unavailable'),'assetId':nullable_id,'reason':text,'nextStep':nullable,'duplicateOf':nullable_id,'changedFrom':nullable_id})
    schema['properties']['assets']=arr(ref('asset'),64)
    schema['properties']['visualReview']=obj({'sources':arr(ref('visualSource'),5000),'candidates':arr(ref('visualCandidate'),256)})
    schema['required']+=['assets','visualReview']
    return schema

if __name__=='__main__':
    path=ROOT/'notebook-package-v3.schema.json';path.write_text(json.dumps(build(),indent=2)+'\n');print(path)
