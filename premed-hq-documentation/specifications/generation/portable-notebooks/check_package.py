"""Check reproducibility, composition, schema, and cross-reference failure cases."""
from pathlib import Path
import argparse, copy, hashlib, importlib.metadata, json, re, tempfile
from jsonschema import Draft202012Validator
from build_prompts import build, compose, TOKENS
from build_fixtures import build as fixtures
from validate_package import validate

def assessment_fixture_scope_errors(data):
    """Focused audit of the invented workshop's flat scope sentences, not arbitrary sources."""
    errors=[]
    entry=data['entries'][0]
    scope=next(s for s in data['sources'] if s['id']=='scope')
    excerpt=scope['excerpts'][0]
    # In these two hand-authored fixtures each sentence is one complete requirement.
    statements=[sentence.strip()+'.' for sentence in excerpt['text'].split('.') if sentence.strip()]
    for statement in statements:
        matches=[r for r in entry['requirements'] if r['text']==statement]
        if len(matches)!=1:
            errors.append('fixture-scope-coverage: '+statement)
            continue
        record=matches[0]
        if record['kind']!='assessment' or record['authority']!='official' or scope['id'] not in record['sourceIds'] or excerpt['id'] not in record['excerptIds'] or not record['sectionIds']:
            errors.append('fixture-scope-evidence: '+statement)
    fmt=next((r for r in entry['requirements'] if r['id']=='req-format'),None)
    if fmt is None or fmt['text']!='Short explanations and original applications are the stated format.':
        errors.append('fixture-format-ledger: missing exact format requirement')
    else:
        sections={s['id']:s for s in entry['sections']}
        purposes={sections[id]['purpose'] for id in fmt['sectionIds'] if id in sections}
        if not {'preparation','practice'}<=purposes:
            errors.append('fixture-format-sections: link explanation and application content')
    return errors

def run(root,out):
    schema=json.loads((out/'notebook-package.schema.json').read_text());Draft202012Validator.check_schema(schema)
    examples={p.stem:json.loads(p.read_text()) for p in sorted(out.glob('fixture-*.json'))+sorted(out.glob('edge-*.json')) if p.name!='fixture-manifest.json'}
    results=[]
    for name,data in examples.items():
        errors=validate(data,schema);assert not errors,(name,errors);results.append({'case':name,'expected':'valid','passed':True})
    for name in ('fixture-assessment','edge-multi-lesson-assessment'):
        data=examples[name];errors=assessment_fixture_scope_errors(data);assert not errors,(name,errors)
        results.append({'case':name+'-complete-source-scope-ledger','expected':'every supplied scope sentence including format has evidence and content links','passed':True})
        omitted=copy.deepcopy(data);omitted['entries'][0]['requirements']=[r for r in omitted['entries'][0]['requirements'] if r['id']!='req-format']
        assert omitted['entries'][0]['request']['assessmentFormat']
        assert not validate(omitted,schema), 'The focused audit must detect a content omission not guaranteed by structural validity.'
        errors=assessment_fixture_scope_errors(omitted)
        assert any(error.startswith('fixture-scope-coverage:') for error in errors)
        results.append({'case':name+'-reject-format-only-in-request','expected':'fixture scope guard rejects omitted ledger requirement despite schema-valid metadata','passed':True})
    base=examples['fixture-review'];r=lambda p:p['entries'][0]['requirements'][0];o=lambda p:p['entries'][0]['objectives'][0];b=lambda p:p['entries'][0]['sections'][0]['blocks'][0]
    cases=[]
    def case(name,code,change,seed=base):cases.append((name,code,change,seed))
    case('reject-v1','schema',lambda p:p.update(version=1))
    case('reject-extra-fields','schema',lambda p:p.update(mastered=True))
    case('reject-empty-requirements','schema',lambda p:p['entries'][0].update(requirements=[]))
    case('reject-missing-request','schema',lambda p:p['entries'][0].pop('request'))
    case('reject-missing-purpose','schema',lambda p:p['entries'][0]['sections'][0].pop('purpose'))
    case('reject-assessment-mastery','schema',lambda p:p['entries'][0].update(goal='assessment'))
    case('reject-unresolved-source','source-reference',lambda p:b(p).update(sourceIds=['absent']))
    case('reject-unresolved-excerpt','excerpt-reference',lambda p:b(p).update(excerptIds=['absent']))
    case('reject-wrong-excerpt-owner','excerpt-ownership',lambda p:p['entries'][0]['sections'][0]['blocks'][0].update(sourceIds=['scope'],excerptIds=['ex-lesson-1']),examples['fixture-assessment'])
    case('reject-duplicate-entry-global-ids','duplicate-id',lambda p:p['entries'].append(copy.deepcopy(p['entries'][0])))
    case('reject-duplicate-source','duplicate-id',lambda p:p['sources'].append(copy.deepcopy(p['sources'][0])))
    case('reject-duplicate-excerpt','duplicate-id',lambda p:p['sources'][0]['excerpts'].append(copy.deepcopy(p['sources'][0]['excerpts'][0])))
    case('reject-duplicate-reference','duplicate-reference',lambda p:b(p)['sourceIds'].append('lesson-1'))
    case('reject-unreadable-evidence','inaccessible-evidence',lambda p:p['sources'][0].update(access='unreadable'))
    case('reject-not-accessed-evidence','inaccessible-evidence',lambda p:p['sources'][0].update(access='not-accessed'))
    case('reject-uninspected-used','uninspected-used',lambda p:p['sources'][0].update(inspected=''))
    case('reject-used-false','unused-reference',lambda p:p['sources'][0].update(used=False))
    case('reject-supported-without-content','supported-without-content',lambda p:r(p).update(sectionIds=[]))
    case('reject-unknown-section','section-reference',lambda p:r(p).update(sectionIds=['absent']))
    case('reject-unknown-requirement','requirement-reference',lambda p:o(p).update(requirementId='absent'))
    case('reject-missing-requirement-mastery','objective-support',lambda p:r(p).update(status='missing',nextStep='Obtain evidence.'))
    case('reject-nonpractice-link','practice-reference',lambda p:o(p).update(practiceBlockIds=['orientation-text']))
    case('reject-partial-without-limit','partial-without-limit',lambda p:r(p).update(status='partial',nextStep='Obtain evidence.'))
    case('reject-shallow-unlimited','ordinary-objective-depth',lambda p:o(p).update(understand=['One unsupported shortcut.']))
    case('reject-vague-limit','vague-evidence-limit',lambda p:o(p).update(evidenceLimit='Too short.'))
    case('reject-fake-official-wording','official-wording',lambda p:(o(p).update(origin='official'),r(p).update(authority='official',text='Exact wording that must survive.')))
    case('reject-unlabeled-derived','derived-label',lambda p:o(p).update(title='Unlabeled objective'))
    case('reject-table-width','table-width',lambda p:p['entries'][0]['sections'][1]['blocks'][1]['rows'][0].append('extra'))
    case('reject-revision-gap','revision-sequence',lambda p:p['entries'][0].update(baseRevision=1,revision=3))
    case('reject-missing-next-step','missing-next-step',lambda p:r(p).update(status='partial',nextStep=None))
    case('reject-wrong-practice-provenance','practice-provenance',lambda p:p['entries'][0]['sections'][2]['blocks'][0].update(provenance='source'))
    for name,code,change,seed in cases:
        data=copy.deepcopy(seed);change(data);errors=validate(data,schema)
        assert any(e.startswith(code+':') for e in errors),(name,errors)
        results.append({'case':name,'expected':'rejected: '+code,'passed':True})
    prior=examples['fixture-review'];revised=examples['fixture-review-revision']
    expected=copy.deepcopy(prior);expected['entries'][0].update(revision=2,baseRevision=1)
    expected['entries'][0]['sections'][0]['blocks'][0]['text']+=' Suggested check: identify which of the three jobs a change affects before predicting the result.'
    assert revised==expected
    assert revised['course']==prior['course'] and revised['sources']==prior['sources']
    assert revised['entries'][0]['baseRevision']==prior['entries'][0]['revision']
    for key in ('requirements','objectives','request'):assert revised['entries'][0][key]==prior['entries'][0][key]
    assert [s['id'] for s in revised['entries'][0]['sections']]==[s['id'] for s in prior['entries'][0]['sections']]
    assert [b['id'] for s in revised['entries'][0]['sections'] for b in s['blocks']]==[b['id'] for s in prior['entries'][0]['sections'] for b in s['blocks']]
    results.append({'case':'revision-preserves-identities-and-unrelated-content','expected':'same course/source/content IDs, base 1 to revision 2, localized change','passed':True})
    # Prove same-entry closure: the referenced object exists, but belongs to another entry.
    for target,code in [('section','section-reference'),('practice','practice-reference'),('requirement','requirement-reference')]:
        data=copy.deepcopy(base);other=copy.deepcopy(base['entries'][0]);other['id']='entry-other'
        # Rename every local identity/reference in second entry without touching evidence.
        ids={x['id'] for x in other['sections']+other['requirements']+other['objectives']}
        ids|={x['id'] for s in other['sections'] for x in s['blocks']}
        def rename(v):
            if isinstance(v,list):return [rename(x) for x in v]
            if isinstance(v,dict):
                return {k:([s+'-other' for s in x] if isinstance(x,list) else x+'-other') if k in ('id','sectionIds','practiceBlockIds','requirementId') and (isinstance(x,list) or x in ids) else rename(x) for k,x in v.items()}
            return v
        data['entries'].append(rename(other))
        if target=='section':r(data)['sectionIds']=['teaching-other']
        elif target=='practice':o(data)['practiceBlockIds']=['practice-1-other']
        else:o(data)['requirementId']='req-route-other'
        errors=validate(data,schema);assert any(e.startswith(code+':') for e in errors),(target,errors)
        results.append({'case':'reject-cross-entry-'+target,'expected':'rejected: '+code,'passed':True})
    with tempfile.TemporaryDirectory() as tmp:
        fresh=Path(tmp);build(root,fresh);fixtures(fresh)
        for path in out.glob('copy-prompt-*.md'):
            assert path.read_bytes()==(fresh/path.name).read_bytes(),path.name
            template=path.read_text()
            assert all(template.count('{{'+token+'}}')==1 for token in TOKENS)
            values={token:'Sample '+token for token in TOKENS};values['CLASS_PREFERENCES']='Keep "quotes", newlines\n, unicode →, and {{SCOPE}} literal.'
            composed=compose(template,values)
            envelope=json.loads(composed.split('```json\n',1)[1].split('\n```',1)[0])
            assert envelope['classPreferences']==values['CLASS_PREFERENCES']
            embedded=json.loads(composed.rsplit('```json\n',1)[1].split('\n```',1)[0]);assert embedded==schema
            # All shipped rule fragments are reproduced verbatim; schema copied byte-for-byte.
        for path in out.glob('*.json'):
            if path.name in ('validation-report.json',):continue
            if (fresh/path.name).exists():assert path.read_bytes()==(fresh/path.name).read_bytes(),path.name
    results += [{'case':'reproducible-prompts-fixtures-manifest','expected':'identical bytes','passed':True},{'case':'single-pass-json-string-composition','expected':'quotes/newlines/unicode/token-looking input preserved','passed':True},{'case':'embedded-schema-equality','expected':'all three templates use unchanged schema','passed':True}]
    report={'validator':'jsonschema '+importlib.metadata.version('jsonschema')+' Draft 2020-12 plus validate_package.py','schemaSha256':hashlib.sha256((out/'notebook-package.schema.json').read_bytes()).hexdigest(),'passed':len(results),'failed':0,'results':results,'limits':['No course trial was run and no Andy ratings were assigned.','Cross-reference validation cannot prove source authenticity, exact excerpt accuracy, evidence entailment, complete source coverage, originality, absence of answer leakage, or learning quality.','Fixture content received an author review against its invented passages; that is not an independent pedagogical audit.','App prompt/copy/download byte identity is an integration requirement, not a claim that the app UI was tested here.']}
    (out/'validation-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'passed':len(results),'failed':0,'schemaSha256':report['schemaSha256']}))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--canonical-root',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();run(a.canonical_root.resolve(),a.output.resolve())
