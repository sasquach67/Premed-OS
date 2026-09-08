"""Check reproducibility, composition, schema, and cross-reference failure cases."""
from pathlib import Path
import argparse, copy, hashlib, importlib.metadata, json, re, tempfile
from jsonschema import Draft202012Validator
from build_prompts import build, compose, TOKENS
from build_fixtures import build as fixtures
from build_feasibility_case import build as feasibility_case
from build_conversation_examples import build as conversation_examples
from validate_package import validate, load_package_json, MAX_PACKAGE_BYTES

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

def prompt_methodology_errors(root,goal,prompt):
    """Check actual assembled text against independently selected canonical rule units."""
    gen=root/'premed-hq-documentation/specifications/generation'
    errors=[]
    global_text=(gen/'02-global-rules-and-source-modes.md').read_text()
    required=[line for line in global_text.split('## 1.1 Purpose',1)[1].split('## 1.9 Scope',1)[0].splitlines() if line.startswith('| `G-')]
    required += [(gen/'19-study-source-and-format-contract.md').read_text().strip(),(gen/'20-external-notebook-workflow.md').read_text().strip()]
    if goal=='review':
        guide=(gen/'03-study-guide-v1.md').read_text()
        required += [line for line in guide.split('## Runtime briefing mirror',1)[1].split('\n---',1)[0].splitlines() if line.startswith('| `SG-')]
        required.append('## 2. Required structure\n'+guide.split('## 2. Required structure\n',1)[1].split('\n## 3. Study-guide rules',1)[0])
        mastery=(gen/'11-unit-mastery-outline-v1.md').read_text()
        required += [line for line in mastery.split('## Rules',1)[1].split('\nThe runtime artifact spec',1)[0].splitlines() if line.startswith('| `UMO-')]
        visual=(gen/'06-visual-system.md').read_text()
        required += [line for line in visual.splitlines() if line.startswith('| `VIS-')]
    else:
        path=root/'premed-hq-documentation/implementation/briefs'/('notebook-'+goal+'-v1.md')
        prefix='NA-' if goal=='assessment' else 'NW-'
        required += [line for line in path.read_text().splitlines() if line.startswith('- `'+prefix)]
        if goal=='assessment':required.append('## Portable multi-lesson assessment preparation\n'+path.read_text().split('## Portable multi-lesson assessment preparation\n',1)[1])
    for fragment in required:
        if fragment.strip() not in prompt:errors.append('missing-canonical-methodology: '+fragment[:100])
    return errors

def feasibility_scope_errors(data,case_dir):
    errors=[];entry=data['entries'][0];ledger={r['id']:r for r in entry['requirements']}
    statements=[line.strip() for line in (case_dir/'materials/assessment-scope.md').read_text().splitlines() if line.strip() and not line.startswith('#')]
    if sorted(statements)!=sorted(r['text'] for r in ledger.values()):errors.append('feasibility-scope: preserve every original requirement')
    expected={'req-week-1':'missing','req-week-2':'partial','req-week-3':'supported','req-week-4':'missing','req-week-5':'missing','req-week-6':'missing','req-cross':'supported','req-format':'supported'}
    if {id:r['status'] for id,r in ledger.items()}!=expected:errors.append('feasibility-status: missing lessons and unprocessed cases remain explicit')
    sources={s['id']:s for s in data['sources']}
    if sources.get('week-2',{}).get('access')!='partial' or 'Sections 2–80 remain unprocessed' not in sources.get('week-2',{}).get('inspected',''):errors.append('feasibility-access: Section 1 is not a whole-file read')
    if 'partial' not in entry['title'].lower() or 'Partial preparation' not in entry['scope']:errors.append('feasibility-claim: no complete Weeks 1–6 claim')
    if set(sources)!={'scope','week-2','week-3'}:errors.append('feasibility-inventory: do not invent unsupplied lesson files')
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
    for goal in ('review','assessment','assignment'):
        prompt=(out/('copy-prompt-'+goal+'.md')).read_text()
        errors=prompt_methodology_errors(root,goal,prompt);assert not errors,(goal,errors)
        results.append({'case':goal+'-canonical-methodology-preserved','expected':'actual prompt includes full applicable rule rows and teaching sections verbatim','passed':True})
    review_prompt=(out/'copy-prompt-review.md').read_text()
    recall_paragraph="**ACTIVE RECALL** — questions test the concepts the guide itself marked important. A recall question\nabout something the guide did not treat as significant is a defect. Target 5–12 depending on\n`coverage_depth`. Every question's answer must exist in the guide."
    for name,fragment in [('active-recall-answer-coverage',recall_paragraph),('instructor-synonym-preservation',next(line for line in (root/'premed-hq-documentation/specifications/generation/02-global-rules-and-source-modes.md').read_text().splitlines() if line.startswith('| `G-TERM-2`')))]:
        assert fragment in review_prompt
        omitted=review_prompt.replace(fragment,'')
        assert prompt_methodology_errors(root,'review',omitted)
        results.append({'case':'reject-prompt-omission-'+name,'expected':'methodology check catches omitted substantive rule even when schema stays intact','passed':True})
    case_dir=out/'feasibility-case';partial=json.loads((case_dir/'expected-partial-notebook.json').read_text())
    assert not validate(partial,schema);assert not feasibility_scope_errors(partial,case_dir)
    results.append({'case':'staged-assessment-final-partial-package','expected':'schema-valid complete file with honest incomplete Weeks 1–6 coverage','passed':True})
    file_map={'scope':'assessment-scope.md','week-2':'week-2-packet.md','week-3':'week-3.md'}
    for src in partial['sources']:
        raw=(case_dir/'materials'/file_map[src['id']]).read_text()
        for excerpt in src['excerpts']:
            assert excerpt['text'] in raw
            assert '## '+excerpt['location'] in raw
    results.append({'case':'staged-assessment-excerpts-match-invented-material','expected':'all exact quotations appear in the actual case input files','passed':True})
    for n in (1,2):
        checkpoint=(case_dir/f'expected-checkpoint-{n}.md').read_text()
        for r in partial['entries'][0]['requirements']:assert r['id'] in checkpoint and r['text'] in checkpoint
        assert '| req-format | partial |' in checkpoint
        assert 'NOT notebook JSON' in checkpoint and 'not a notebook revision number' in checkpoint
        assert 'not-accessed; deliberately unprocessed' in checkpoint if n==1 else 'partial; Section 1 only' in checkpoint
    results.append({'case':'staged-checkpoint-identities-and-pending-scope','expected':'both work records retain source/requirement identities and unresolved portions without claiming app import or persistence','passed':True})
    mutations=[('drop-week-6',lambda p:p['entries'][0].update(requirements=[r for r in p['entries'][0]['requirements'] if r['id']!='req-week-6'])),('claim-whole-week-2-read',lambda p:next(s for s in p['sources'] if s['id']=='week-2').update(access='read')),('claim-complete-six-week-prep',lambda p:p['entries'][0].update(title='Complete Weeks 1–6 preparation')),('hide-missing-lesson-as-out-of-scope',lambda p:next(r for r in p['entries'][0]['requirements'] if r['id']=='req-week-6').update(status='out-of-scope'))]
    for name,change in mutations:
        wrong=copy.deepcopy(partial);change(wrong);assert not validate(wrong,schema);assert feasibility_scope_errors(wrong,case_dir)
        results.append({'case':'reject-staged-'+name,'expected':'focused case audit rejects a false coverage/access claim despite structural validity','passed':True})
    assessment_prompt=(out/'copy-prompt-assessment.md').read_text()
    checkpoint_rule=next(line for line in assessment_prompt.splitlines() if line.startswith('4. At each batch boundary'))
    assert prompt_methodology_errors(root,'assessment',assessment_prompt.replace(checkpoint_rule,''))
    results.append({'case':'reject-prompt-omission-saved-checkpoint-protocol','expected':'canonical assembly guard catches loss of the staged working-file requirement','passed':True})
    conversations=json.loads((out/'conversation-examples.json').read_text())
    assert conversations['executed'] is False and conversations['ratings'] is None
    assert {c['goal'] for c in conversations['scenarios']}=={'review','assessment','assignment'}
    assert {c['id'] for c in conversations['scenarios']}=={'prompt-alone','complete-lesson','missing-exam-lesson-resume','one-hint-assignment','failed-import-repair'}
    results.append({'case':'five-expected-conversations-are-not-trial-results','expected':'five authored scenarios across exactly three goals, no execution or ratings','passed':True})
    canonical_conversation=(root/'premed-hq-documentation/specifications/generation/20-external-notebook-workflow.md').read_text()
    rule_ids=set(re.findall(r'`(EC-[A-Z]+)`',canonical_conversation))
    for c in conversations['scenarios']:
        assert set(c['ruleIds'])<=rule_ids and c['expectedFirstReply'] and c['expectedNext'] and c['mustPreserve']
        assert 1<=c['expectedFirstReply'].count('.')<=3
        if c['id'] in ('complete-lesson','one-hint-assignment'):assert c['necessaryPause'] is None
        results.append({'case':c['id']+'-expected-conversation-contract','expected':'brief opening, next action and preservation boundaries linked to actual canonical rules','passed':True})
    bad=json.loads((out/'conversation-case-files/rejected-reference.json').read_text());original=json.loads((out/'conversation-case-files/complete-reference-original.json').read_text())
    assert any(e.startswith('source-reference:') for e in validate(bad,schema))
    repaired=copy.deepcopy(bad);repaired['entries'][0]['sections'][0]['blocks'][0]['sourceIds']=['week-2']
    assert repaired==original and not validate(repaired,schema)
    assert repaired['entries'][0]['revision']==1 and repaired['entries'][0]['baseRevision'] is None
    results.append({'case':'scripted-reference-repair-preserves-complete-proposal','expected':'one unambiguous reference correction matches complete original, with IDs/text/revision unchanged','passed':True})
    truncated=(out/'conversation-case-files/truncated-input.txt').read_text()
    try:load_package_json(truncated)
    except ValueError:pass
    else:raise AssertionError('The example prefix must actually be truncated, not a complete notebook.')
    results.append({'case':'scripted-truncated-input-is-incomplete','expected':'invalid prefix supplied only as a manual no-fabrication repair example','passed':True})
    for goal,rule in [('review','EC-FIRST'),('assessment','EC-CONTINUE'),('assignment','EC-REPAIR')]:
        prompt=(out/('copy-prompt-'+goal+'.md')).read_text()
        row=next(line for line in canonical_conversation.splitlines() if line.startswith('- `'+rule+'`:'))
        assert row in prompt and prompt_methodology_errors(root,goal,prompt.replace(row,''))
        results.append({'case':'reject-conversation-rule-omission-'+rule,'expected':'actual prompt assembly guard detects missing shared conversation behavior','passed':True})
    snapshot=out/'versions/notebook-instructions-beta-2'
    if snapshot.exists():
        receipt=json.loads((snapshot/'SNAPSHOT.json').read_text())
        assert receipt['promptBuild']=='notebook-instructions-beta-2'
        for name,sha in receipt['sha256'].items():assert hashlib.sha256((snapshot/name).read_bytes()).hexdigest()==sha
        results.append({'case':'published-beta-2-snapshot-preserved','expected':'all archived published beta-2 file hashes unchanged','passed':True})
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
    case('reject-clarification-without-evidence','missing-evidence',lambda p:b(p).update(sourceIds=[],excerptIds=[]))
    case('reject-student-request-support-without-evidence','coverage-evidence',lambda p:r(p).update(authority='student-request',sourceIds=[],excerptIds=[]))
    case('reject-partial-without-section','coverage-evidence',lambda p:r(p).update(status='partial',sectionIds=[],nextStep='Provide missing content.'))
    case('reject-missing-access-limitation','missing-access-limit',lambda p:p['sources'][0].update(access='partial',limitations=[]))
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
    for name,raw,code in [('duplicate-json-key','{"version":2,"version":2}','duplicate-key'),('oversize-json-input',' '*(MAX_PACKAGE_BYTES+1),'package-size')]:
        try:load_package_json(raw)
        except ValueError as error:assert str(error).startswith(code+':')
        else:raise AssertionError(name+' should fail before schema checks')
        results.append({'case':'reject-'+name,'expected':code,'passed':True})
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
        fresh=Path(tmp);build(root,fresh);fixtures(fresh);feasibility_case(fresh/'feasibility-case');conversation_examples(fresh,root/'premed-hq-documentation/specifications/generation/portable-notebooks')
        for path in (out/'conversation-case-files').iterdir():
            if path.is_file():assert path.read_bytes()==(fresh/'conversation-case-files'/path.name).read_bytes()
        assert (out/'EXPECTED-CONVERSATIONS.md').read_bytes()==(fresh/'EXPECTED-CONVERSATIONS.md').read_bytes()
        for path in case_dir.rglob('*'):
            if path.is_file():assert path.read_bytes()==(fresh/'feasibility-case'/path.relative_to(case_dir)).read_bytes()
        for path in out.glob('copy-prompt-*.md'):
            assert path.read_bytes()==(fresh/path.name).read_bytes(),path.name
            template=path.read_text()
            assert all(template.count('{{'+token+'}}')==1 for token in TOKENS)
            assert set(re.findall(r'\{\{([A-Z_]+)\}\}',template))==set(TOKENS)
            assert 'Prompt build: notebook-instructions-beta-3.' in template
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
    report={'validator':'jsonschema '+importlib.metadata.version('jsonschema')+' Draft 2020-12 plus validate_package.py','schemaSha256':hashlib.sha256((out/'notebook-package.schema.json').read_bytes()).hexdigest(),'passed':len(results),'failed':0,'results':results,'limits':['No course trial was run and no Andy ratings were assigned.','Cross-reference validation cannot prove source authenticity, exact excerpt accuracy, evidence entailment, complete source coverage, originality, absence of answer leakage, or learning quality.','Fixture content received an author review against its invented passages; that is not an independent pedagogical audit.','App prompt/copy/download byte identity is an integration requirement, not a claim that the app UI was tested here.','Staged feasibility outputs and checkpoints are invented expectations. No external AI was run; the forced batch boundary is not a provider capacity benchmark.','Conversation examples and their checks validate authored expectations and preserved inputs, not compliance by an external AI or actual student outcomes.']}
    (out/'validation-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'passed':len(results),'failed':0,'schemaSha256':report['schemaSha256']}))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--canonical-root',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();run(a.canonical_root.resolve(),a.output.resolve())
