"""Authored v3 semantic regression cases; not provider or pedagogical trials."""
from pathlib import Path
import argparse,copy,hashlib,json,shutil
from jsonschema import Draft202012Validator
from build_visual_schema import build as schema_build
from build_revision_cases import examples
from validate_package import validate

def build_cases(out):
    out.mkdir(parents=True,exist_ok=True)
    before,_=examples();text=copy.deepcopy(before);text.update(version=3,instructionsVersion='notebook-workflows-draft-3',assets=[],visualReview={'sources':[{'sourceId':s['id'],'discovery':'complete','imageState':'none-found','inspectedPortions':['Authored text-only fixture input; no images supplied.'],'unprocessedPortions':[],'limitations':[]} for s in before['sources']],'candidates':[]})
    visual=copy.deepcopy(text);visual['assets']=[{'id':'figure-task','sourceId':'psych-tue','location':'Authored question PNG supplied with this fixture','fileName':'question.png','mimeType':'image/png','originalAssetId':None,'alteration':None}]
    visual['visualReview']['sources'][0].update(imageState='images-found',inspectedPortions=['Authored question PNG and text fixture; these are test assets, not a provider inspection log.'])
    visual['visualReview']['candidates']=[{'id':'candidate-task','sourceId':'psych-tue','location':'Authored question PNG','discovered':True,'inspection':'inspected','decision':'selected','assetId':'figure-task','reason':'Actual fixed classroom question image for validating asset/stimulus references.','nextStep':None,'duplicateOf':None,'changedFrom':None}]
    ev={'sourceIds':['psych-tue'],'excerptIds':['t1'],'assetIds':[]}
    figure={'id':'stimulus-figure','type':'figure','provenance':'source','sourceIds':['psych-tue'],'excerptIds':[],'assetId':'figure-task','caption':'Authored classroom task question','alt':'Triangle with the classroom mapping and four response options.','context':'Synthetic test material, not an actual course or a provider-produced notebook.'}
    diagram={'id':'diagram-task','type':'study-diagram','provenance':'clarification',**ev,'kind':'concept-map','title':'Authored response mapping','nodes':[{'id':'shape','label':'Triangle',**ev},{'id':'response','label':'Left response',**ev}],'edges':[{'id':'maps','from':'shape','to':'response','relation':'association','label':'is assigned to',**ev}]}
    visual['entries'][0]['sections'][0]['blocks'] += [figure,diagram]
    next(b for s in visual['entries'][0]['sections'] for b in s['blocks'] if b['id']=='ch3-practice-mapping')['stimulusBlockIds']=['stimulus-figure']
    for name,pkg in [('valid-v3-no-images.json',text),('valid-v3-figure-diagram.json',visual)]: (out/name).write_text(json.dumps(pkg,indent=2)+'\n')
    shutil.copyfile(Path(__file__).parent/'cross-provider-assets/question.png',out/'question.png')
    (out/'README.md').write_text('# Authored v3 contract cases\n\nThese fixed synthetic packages and actual PNG test structural/evidence/stimulus references. They are not external AI outputs, academic trials, model inspection logs or approval records. Binary decode/storage/atomicity/backup checks belong to the app. No image neutrality or scientific correctness follows from schema validation.\n')
    return text,visual

def run(out):
    schema=schema_build();Draft202012Validator.check_schema(schema);plain,pkg=build_cases(out);results=[]
    for name,data in [('no-images',plain),('figure-diagram',pkg)]:
        errors=validate(data,schema);assert not errors,errors;results.append({'case':name,'passed':True})
    def block(p,id):return next(b for e in p['entries'] for s in e['sections'] for b in s['blocks'] if b['id']==id)
    mutations=[
        ('missing-review','schema',lambda p:p.pop('visualReview')),
        ('missing-source-review','visual-source-inventory',lambda p:p['visualReview'].update(sources=[])),
        ('duplicate-asset','asset-duplicate',lambda p:p['assets'].append(copy.deepcopy(p['assets'][0]))),
        ('missing-asset','asset-reference',lambda p:p.update(assets=[])),
        ('wrong-asset-source','asset-source',lambda p:p['assets'][0].update(sourceId='absent')),
        ('asset-path','schema',lambda p:p['assets'][0].update(fileName='../question.png')),
        ('asset-url','schema',lambda p:p['assets'][0].update(url='https://example.invalid/image.png')),
        ('svg-mime','schema',lambda p:p['assets'][0].update(mimeType='image/svg+xml')),
        ('invented-model-hash','schema',lambda p:p['assets'][0].update(sha256='fake')),
        ('crop-no-alteration','asset-derivative',lambda p:p['assets'][0].update(originalAssetId='parent')),
        ('crop-missing-original','asset-original',lambda p:p['assets'][0].update(originalAssetId='parent',alteration='Crop removes marginal notes.')),
        ('crop-self-cycle','asset-cycle',lambda p:p['assets'][0].update(originalAssetId='figure-task',alteration='Self crop.')),
        ('selected-uninspected','visual-selected-asset',lambda p:p['visualReview']['candidates'][0].update(inspection='not-inspected')),
        ('inspection-not-discovered','visual-false-inspection',lambda p:p['visualReview']['candidates'][0].update(discovered=False)),
        ('false-sweep-complete','visual-false-complete',lambda p:p['visualReview']['sources'][0].update(unprocessedPortions=['remaining pages'])),
        ('false-no-images','visual-none-with-candidates',lambda p:p['visualReview']['sources'][0].update(imageState='none-found')),
        ('unresolved-no-next-step','visual-next-step',lambda p:p['visualReview']['candidates'][0].update(decision='pending',assetId=None,nextStep=None)),
        ('missing-candidate-relation','visual-relation-reference',lambda p:p['visualReview']['candidates'][0].update(duplicateOf='absent')),
        ('candidate-self-cycle','visual-relation-cycle',lambda p:p['visualReview']['candidates'][0].update(changedFrom='candidate-task')),
        ('stimulus-missing','stimulus-reference',lambda p:block(p,'ch3-practice-mapping').update(stimulusBlockIds=['absent'])),
        ('stimulus-answer-practice','stimulus-reference',lambda p:block(p,'ch3-practice-mapping').update(stimulusBlockIds=['ch3-practice-timing'])),
        ('stimulus-whole-section','stimulus-reference',lambda p:block(p,'ch3-practice-mapping').update(stimulusBlockIds=['ch3-teaching'])),
        ('figure-wrong-owner','excerpt-ownership',lambda p:block(p,'stimulus-figure').update(sourceIds=[])),
        ('diagram-unclosed-node','diagram-endpoint',lambda p:block(p,'diagram-task')['edges'][0].update(to='absent')),
        ('diagram-missing-evidence','missing-evidence',lambda p:block(p,'diagram-task')['edges'][0].update(sourceIds=[],excerptIds=[])),
        ('diagram-code-field','schema',lambda p:block(p,'diagram-task').update(svg='<svg/>')),
        ('diagram-coordinate','schema',lambda p:block(p,'diagram-task')['nodes'][0].update(x=5)),
    ]
    for name,code,change in mutations:
        wrong=copy.deepcopy(pkg);change(wrong);errors=validate(wrong,schema);assert any(e.startswith(code+':') for e in errors),(name,errors);results.append({'case':'reject-'+name,'passed':True})
    receipt={'passed':len(results),'failed':0,'schemaSha256':hashlib.sha256((Path(__file__).parent/'notebook-package-v3.schema.json').read_bytes()).hexdigest(),'cases':results,'limits':['Authored fixtures, no provider execution or student rating.','No binary decoding, atomic storage, byte binding or app rendering tested here.','Schema/reference closure does not prove actual inspection, neutral stimulus, factual support or visual learning quality.']}
    (out/'validation-report.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({k:receipt[k] for k in ('passed','failed','schemaSha256')}))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);a=p.parse_args();run(a.output)
