"""V4 structural/semantic regressions and bounded fixture-source checks; no provider run."""
from pathlib import Path
import argparse,copy,hashlib,json,math
from jsonschema import Draft202012Validator
from build_v4_schema import build as schema_build
from build_v4_fixtures import build as fixtures
from validate_package import validate
ROOT=Path(__file__).parent

def run(out):
    out.mkdir(parents=True,exist_ok=True);pkg=fixtures(out/'fixtures');schema=schema_build();Draft202012Validator.check_schema(schema);results=[]
    def rec(name):results.append({'case':name,'passed':True})
    def block(p,id):return next(b for e in p['entries'] for s in e['sections'] for b in s['blocks'] if b['id']==id)
    def mutate(name,code,fn):
        p=copy.deepcopy(pkg);fn(p);errors=validate(p,schema);assert any(x.startswith(code+':') for x in errors),(name,errors);rec('reject-'+name)
    err=validate(pkg,schema);assert not err,err;rec('all-families-valid')
    assert json.loads((ROOT/'notebook-package-v4.schema.json').read_text())==schema;rec('exact-schema-builder-equality')
    raw=(out/'fixtures/materials/FICTIONAL-REFERENCE.md').read_text()
    assert all(x['text'] in raw and x['location'].removeprefix('Section: ') in raw for x in pkg['sources'][0]['excerpts']);rec('every-fixture-text-excerpt-exact')
    inspected=json.loads((out/'fixtures/materials/IMAGE-INSPECTION.json').read_text());image=out/'fixtures/authored-classroom-task.png'
    assert hashlib.sha256(image.read_bytes()).hexdigest()==inspected['sha256'];rec('actual-fixture-image-bytes-match-inspection')
    ann=block(pkg,'label-source-image')['annotations'][0];assert all(ann[k]==inspected['observedTipNormalized'][k] for k in ['x','y']);rec('annotation-uses-actually-inspected-image-point')
    w=block(pkg,'elapsed-worked');byex={x['id']:x['text'] for x in pkg['sources'][0]['excerpts']}
    assert all('15 minutes' not in byex[x] for x in w['problemEvidence']['excerptIds']) and any('15 minutes' in byex[x] for x in w['solutionEvidence']['excerptIds']);rec('authored-worked-setup-excludes-answer-bearing-excerpt')
    neutral=next(x['id'] for x in pkg['sources'][0]['excerpts'] if x['location']=='Section: Image annotation reference')
    guidance=next(x['id'] for x in pkg['sources'][0]['excerpts'] if x['location']=='Section: Image answer authoring guidance')
    def neutral_image_evidence(p):
        visible=[block(p,'source-question'),block(p,'label-source-image'),*block(p,'label-source-image')['annotations']]
        texts={x['id']:x['text'] for x in p['sources'][0]['excerpts']}
        return all(v['excerptIds']==[neutral] and all(term not in texts[neutral].lower() for term in ['left','right','correct response']) for v in visible)
    assert neutral_image_evidence(pkg) and 'correct response is A. Left' in byex[guidance];rec('authored-initial-question-and-annotation-use-only-neutral-exact-excerpt')
    for target in ['source-question','label-source-image','annotation']:
        leaked=copy.deepcopy(pkg);v=block(leaked,'label-source-image')['annotations'][0] if target=='annotation' else block(leaked,target);v['excerptIds'].append(guidance)
        assert not neutral_image_evidence(leaked);rec('fixture-review-reject-answer-guidance-on-'+target)
    leaked=copy.deepcopy(pkg);next(x for x in leaked['sources'][0]['excerpts'] if x['id']==neutral)['text']+=' A label saying the correct response is LEFT is solution content.'
    assert not neutral_image_evidence(leaked);rec('fixture-review-reject-original-answer-bearing-warning')
    for mode,id in [('ordinal','schedule-ordinal'),('numeric','schedule-numeric'),('ordinal','readiness-scale'),('numeric','test-score-scale')]:assert block(pkg,id)['axis']['mode']==mode
    rec('ordinal-and-numeric-positive-fixtures')
    ties=copy.deepcopy(pkg);block(ties,'schedule-numeric')['events'][2]['value']=10;block(ties,'test-score-scale')['points'][2]['value']=5
    assert not validate(ties,schema);rec('numeric-ties-structurally-allowed-without-fabricated-display-offset')
    # This is a shape stress case only, not a new source-backed chronology claim.
    (out/'numeric-ties-structural-case.json').write_text(json.dumps({'notice':'Authored semantic-validator stress mutation only; changed values are not claimed to match the primary reference and this file is not an importable package.','package':ties},indent=2)+'\n')
    mutate('blank-event-label','v4-empty-text',lambda p:block(p,'schedule-ordinal')['events'][0].update(label=' '))
    mutate('blank-worked-answer','v4-empty-text',lambda p:block(p,'elapsed-worked').update(answer=' '))
    mutate('version-tag-mismatch','schema',lambda p:p.update(version=3))
    mutate('draft-tag-mismatch','schema',lambda p:p.update(instructionsVersion='notebook-workflows-draft-3'))
    mutate('invented-annotation-html','schema',lambda p:block(p,'label-source-image')['annotations'][0].update(html='<div/>'))
    mutate('annotation-outside-image','schema',lambda p:block(p,'label-source-image')['annotations'][0].update(x=1.01))
    mutate('annotation-nan','v4-annotation-coordinate',lambda p:block(p,'label-source-image')['annotations'][0].update(x=float('nan')))
    mutate('annotation-infinite','schema',lambda p:block(p,'label-source-image')['annotations'][0].update(y=float('inf')))
    mutate('annotation-no-bound-asset-evidence','v4-annotation-asset',lambda p:block(p,'label-source-image')['annotations'][0].update(assetIds=[]))
    mutate('annotation-no-position-basis','v4-annotation-label-basis',lambda p:block(p,'label-source-image')['annotations'][0].update(positionBasis=' '))
    mutate('annotation-empty-evidence','missing-evidence',lambda p:block(p,'label-source-image')['annotations'][0].update(sourceIds=[],excerptIds=[],assetIds=[]))
    mutate('annotation-missing-actual-asset','asset-reference',lambda p:p.update(assets=[]))
    for id,key in [('schedule-ordinal','events'),('readiness-scale','points')]:
        mutate(id+'-numeric-axis-data','v4-ordinal-axis',lambda p,id=id:block(p,id)['axis'].update(unit='minutes',minimum=0,maximum=10))
        mutate(id+'-numeric-item-value','v4-ordinal-axis',lambda p,id=id,key=key:block(p,id)[key][0].update(value=0))
    for id,key in [('schedule-numeric','events'),('test-score-scale','points')]:
        mutate(id+'-null-domain','v4-numeric-axis',lambda p,id=id:block(p,id)['axis'].update(minimum=None))
        mutate(id+'-zero-span','v4-numeric-axis',lambda p,id=id:block(p,id)['axis'].update(minimum=10,maximum=10))
        mutate(id+'-infinite-span','v4-numeric-axis',lambda p,id=id:block(p,id)['axis'].update(minimum=-1e308,maximum=1e308))
        mutate(id+'-oversized-integer-span','v4-numeric-axis',lambda p,id=id:block(p,id)['axis'].update(minimum=-(10**308),maximum=10**308))
        mutate(id+'-oversized-json-integer-domain','v4-numeric-axis',lambda p,id=id:block(p,id)['axis'].update(maximum=json.loads('1'+'0'*400)))
        mutate(id+'-oversized-json-integer-value','v4-numeric-value',lambda p,id=id,key=key:block(p,id)[key][-1].update(value=json.loads('1'+'0'*400)))
        mutate(id+'-no-unit','v4-numeric-axis',lambda p,id=id:block(p,id)['axis'].update(unit=None))
        mutate(id+'-null-value','v4-numeric-value',lambda p,id=id,key=key:block(p,id)[key][0].update(value=None))
        mutate(id+'-out-of-domain','v4-numeric-value',lambda p,id=id,key=key:block(p,id)[key][0].update(value=-1))
        mutate(id+'-decreasing-values','v4-numeric-order',lambda p,id=id,key=key:block(p,id)[key][0].update(value=block(p,id)[key][-1]['value']))
        mutate(id+'-empty-item-evidence','missing-evidence',lambda p,id=id,key=key:block(p,id)[key][0].update(sourceIds=[],excerptIds=[],assetIds=[]))
    mutate('venn-third-set','schema',lambda p:block(p,'card-membership')['sets'].append(copy.deepcopy(block(p,'card-membership')['sets'][0])))
    mutate('venn-duplicate-region-combination','v4-venn-regions',lambda p:block(p,'card-membership')['regions'][2].update(setIds=['set-text']))
    mutate('venn-unknown-membership','v4-venn-membership',lambda p:block(p,'card-membership')['regions'][0].update(setIds=['absent-set']))
    mutate('venn-empty-meaningful-overlap','v4-venn-empty-overlap',lambda p:block(p,'card-membership')['regions'][1].update(items=[]))
    mutate('venn-duplicate-item-id','v4-item-identity',lambda p:block(p,'card-membership')['regions'][2]['items'][0].update(id='member-only-text'))
    mutate('sequence-image-without-alt','v4-sequence-alt',lambda p:block(p,'task-strip')['steps'][1].update(alt=None))
    mutate('sequence-alt-without-image','v4-sequence-alt',lambda p:block(p,'task-strip')['steps'][0].update(alt='Invented picture.'))
    mutate('sequence-missing-image','asset-reference',lambda p:block(p,'task-strip')['steps'][1].update(assetId='absent-image'))
    mutate('sequence-outside-evidence-envelope','v4-evidence-envelope',lambda p:block(p,'task-strip').update(sourceIds=['ref'],assetIds=[]))
    mutate('worked-missing-problem-partition','schema',lambda p:block(p,'elapsed-worked').pop('problemEvidence'))
    mutate('worked-missing-solution-partition','schema',lambda p:block(p,'elapsed-worked').pop('solutionEvidence'))
    for part in ['problemEvidence','solutionEvidence']:mutate('worked-empty-'+part,'missing-evidence',lambda p,part=part:block(p,'elapsed-worked')[part].update(sourceIds=[],excerptIds=[],assetIds=[]))
    mutate('worked-step-outside-solution','v4-evidence-envelope',lambda p:block(p,'elapsed-worked')['solutionEvidence'].update(excerptIds=block(p,'elapsed-worked')['problemEvidence']['excerptIds']))
    mutate('worked-as-initial-practice-stimulus','stimulus-reference',lambda p:block(p,'source-question').update(stimulusBlockIds=['elapsed-worked']))
    mutate('worked-as-worked-stimulus','stimulus-reference',lambda p:block(p,'elapsed-worked').update(stimulusBlockIds=['elapsed-worked']))
    mutate('timeline-as-initial-stimulus','stimulus-reference',lambda p:block(p,'source-question').update(stimulusBlockIds=['schedule-numeric']))
    mutate('decision-unlabelled-condition','v4-decision-condition',lambda p:block(p,'route-card')['edges'][0].update(label=' '))
    mutate('decision-duplicate-conditions','v4-decision-condition',lambda p:block(p,'route-card')['edges'][1].update(label=block(p,'route-card')['edges'][0]['label']))
    mutate('decision-causal-edge','v4-diagram-relation',lambda p:block(p,'route-card')['edges'][0].update(relation='causes'))
    mutate('hierarchy-association-edge','v4-diagram-relation',lambda p:block(p,'collection-tree')['edges'][0].update(relation='association'))
    mutate('chain-sequence-edge','v4-diagram-relation',lambda p:block(p,'access-chain')['edges'][0].update(relation='sequence'))
    mutate('tree-disconnected-node','v4-diagram-tree',lambda p:block(p,'route-card')['nodes'].append({**copy.deepcopy(block(p,'route-card')['nodes'][0]),'id':'disconnected'}))
    def cycle(p):
        b=block(p,'route-card');b['edges'].append({**copy.deepcopy(b['edges'][0]),'id':'back','from':b['nodes'][1]['id'],'to':b['nodes'][0]['id']})
    mutate('tree-cycle','v4-diagram-tree',cycle)
    def branch(p,id,count):
        b=block(p,id)
        for i in range(count):
            n={**copy.deepcopy(b['nodes'][0]),'id':id+'-extra'+str(i)};b['nodes'].append(n);b['edges'].append({**copy.deepcopy(b['edges'][0]),'id':id+'-edgeextra'+str(i),'from':b['nodes'][0]['id'],'to':n['id'],'label':'Additional branch '+str(i)})
    mutate('decision-third-child','v4-diagram-branching',lambda p:branch(p,'route-card',1))
    mutate('hierarchy-fifth-child','v4-diagram-branching',lambda p:branch(p,'collection-tree',3))
    mutate('causal-chain-branch','v4-diagram-branching',lambda p:branch(p,'access-chain',1))
    # Guard portability: exact older contracts stay separate and reject new-only blocks.
    for version,n,h in [(2,'notebook-package.schema.json','41d6f3e5adaebb55ee80cb567354fb7698e252dafca1c0009ea15f81910c7b43'),(3,'notebook-package-v3.schema.json','20e46dd155928f0c004c5515d8d80980849303a14a2194d7ce45e194b1ad7233')]:
        assert hashlib.sha256((ROOT/n).read_bytes()).hexdigest()==h;rec('exact-v'+str(version)+'-schema-unchanged')
        legacy=copy.deepcopy(pkg);legacy.update(version=version,instructionsVersion='notebook-workflows-draft-'+str(version));assert validate(legacy,json.loads((ROOT/n).read_text()));rec('v'+str(version)+'-does-not-silently-accept-v4-blocks')
    receipt={'passed':len(results),'failed':0,'schemaSha256':hashlib.sha256((ROOT/'notebook-package-v4.schema.json').read_bytes()).hexdigest(),'fixtureSha256':hashlib.sha256((out/'fixtures/visual-repertoire-v4.json').read_bytes()).hexdigest(),'cases':results,'limits':['No provider run, app renderer/save/history proof or learning-quality claim.','Primary fixture excerpts and image point are checked against actual authored sources. Stress mutations test structure, not semantic entailment.','General source truth, image-point meaning and neutral versus solution-bearing prose still require source/content review.']};(out/'VALIDATION.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({k:receipt[k] for k in ['passed','failed','schemaSha256','fixtureSha256']}));return receipt

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);a=p.parse_args();run(a.output)
