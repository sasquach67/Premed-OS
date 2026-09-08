"""Check reproducibility, composition, schema, and cross-reference failure cases."""
from pathlib import Path
import argparse, copy, hashlib, importlib.metadata, json, re, tempfile
from jsonschema import Draft202012Validator
from build_prompts import build, compose, TOKENS, PROMPT_BUILD, MODE_CONFIG
from build_fixtures import build as fixtures
from build_feasibility_case import build as feasibility_case
from build_conversation_examples import build as conversation_examples
from build_revision_cases import build as revision_cases, revision_errors, block_map, practice_dependency_snapshot, REMINDER
from build_standardization import build_packet, prompt_audit, dependency_errors, parity_errors, SAFEGUARDS
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
    required.append((gen/'21-external-notebook-request-template.md').read_text().replace('{{GOAL_LABEL}}',goal).replace('{{PROMPT_BUILD}}',PROMPT_BUILD).strip())
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
    output_schema=json.loads((out/'notebook-package-v3.schema.json').read_text());schema=json.loads((out/'notebook-package.schema.json').read_text());Draft202012Validator.check_schema(schema)
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
    assert {c['id'] for c in conversations['scenarios']}=={'prompt-alone','complete-lesson','missing-exam-lesson-resume','one-hint-assignment','failed-import-repair','complete-inputs-review-gate','student-tweaks-then-confirms','partial-multiweek-approval','normal-chat-no-project','topic-tuesday-thursday-update','topic-unresolved-correction-context','topic-newer-saved-baseline','ordinary-plus-mixed-materials','announced-fifty-image-intake'}
    results.append({'case':'fourteen-expected-conversations-are-not-trial-results','expected':'fourteen authored scenarios across exactly three goals, no execution or ratings','passed':True})
    canonical_conversation=(root/'premed-hq-documentation/specifications/generation/20-external-notebook-workflow.md').read_text()
    rule_ids=set(re.findall(r'`(EC-[A-Z]+)`',canonical_conversation))
    for c in conversations['scenarios']:
        assert set(c['ruleIds'])<=rule_ids and c['expectedFirstReply'] and c['expectedNext'] and c['mustPreserve']
        assert 1<=c['expectedFirstReply'].count('.')<=3
        assert c['necessaryPause'] and {'EC-REVIEW','EC-CONFIRM'}<=set(c['ruleIds'])
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
    for goal,rule in [('review','EC-FIRST'),('assessment','EC-CONTINUE'),('assignment','EC-REPAIR')]+[(goal,rule) for goal in ('review','assessment','assignment') for rule in ('EC-INPUT','EC-PERSONALIZE','EC-REVIEW','EC-CONFIRM','EC-EXPORT','EC-BASELINE','EC-TOPIC','EC-OVERLAP','EC-DEPENDENCIES','EC-CHANGEREVIEW','EC-REVISIONFILE','EC-ACCEPTANCE','EC-MATERIALS','EC-INTAKE','EC-TARGET','EC-INCOMPLETE','EC-AUTHORITY','EC-LEDGER','EC-CHECKS','EC-PACKAGING','EC-VISUALREVIEW','EC-FIGURES','EC-DIAGRAMS','EC-STIMULUS')]:
        prompt=(out/('copy-prompt-'+goal+'.md')).read_text()
        row=next(line for line in canonical_conversation.splitlines() if line.startswith('- `'+rule+'`:'))
        assert row in prompt and prompt_methodology_errors(root,goal,prompt.replace(row,''))
        results.append({'case':'reject-conversation-rule-omission-'+goal+'-'+rule,'expected':'actual prompt assembly guard detects missing shared conversation behavior','passed':True})
    recovery=json.loads((root/'premed-hq-documentation/specifications/generation/portable-notebooks/conversation-examples.json').read_text())
    recovery_case=next(c for c in recovery['scenarios'] if c['id']=='topic-newer-saved-baseline')
    present,lost=recovery_case['baselineRecoveryCases']
    assert not present['priorChatAvailable'] and not present['baselineAttached'] and present['savedAppContentAvailable']
    assert present['nextAction']=='request-previous-notebook-json-and-current-app-reexport' and not present['mayInventBaseline'] and not present['mayEmitUpdateWithoutBaseline']
    results.append({'case':'authored-missing-baseline-requests-app-reexport','expected':'lost chat/download with surviving app content requests exact previous/current JSON before updating; no inferred baseline','passed':True})
    assert not any(lost[k] for k in ('priorChatAvailable','baselineAttached','savedAppContentAvailable','usableBackupAvailable','mayInventBaseline','mayClaimPreservedPriorEdits','mayReuseUnknownIdentityOrLineage','mayInheritApprovalOrProgress'))
    assert lost['originalMaterialsAvailable'] and lost['nextAction']=='offer-new-recovery-work-and-establish-new-entry-boundary'
    results.append({'case':'authored-no-surviving-baseline-is-new-recovery','expected':'originals support explicitly new work, not invented prior edits/identity/lineage/approval/progress','passed':True})
    recovery_fragments=[('request-reexport','If the baseline is missing, ask specifically for the previous notebook JSON, preferably a new current-content export from the app if it is still saved there.'),('new-recovery','If no saved app content or usable backup survives, explain that the prior notebook cannot be recovered; offer a rebuild from original materials as explicitly new recovery work. Do not invent prior wording, edits, IDs, revision lineage, approval or progress; establish the new-entry boundary before rebuilding.')]
    for goal in ('review','assessment','assignment'):
        prompt=(out/('copy-prompt-'+goal+'.md')).read_text()
        for name,fragment in recovery_fragments:
            assert fragment in prompt and prompt_methodology_errors(root,goal,prompt.replace(fragment,''))
            results.append({'case':'reject-baseline-recovery-omission-'+goal+'-'+name,'expected':'actual full-prompt guard rejects loss of explicit baseline recovery branch while schema stays intact','passed':True})
    for goal in ('review','assessment','assignment'):
        prompt=(out/('copy-prompt-'+goal+'.md')).read_text()
        opening=next(line for line in prompt.splitlines() if line.startswith('Prepare actual, readable learning content'))
        wrong=prompt.replace(opening,'Generate the complete final notebook JSON immediately from the supplied material.')
        assert prompt_methodology_errors(root,goal,wrong)
        results.append({'case':'reject-automatic-export-opening-'+goal,'expected':'canonical request guard rejects restored automatic export even when the shared confirmation rules remain below','passed':True})
    generic=(out/'student-copies/copy-prompt-review-general.md').read_text()
    template=(out/'copy-prompt-review.md').read_text()
    assert generic==compose(template,{})
    assert not re.search(r'\{\{(?:'+'|'.join(TOKENS)+r')\}\}',generic)
    context=json.loads(generic.split('```json',1)[1].split('```',1)[0])
    assert len(context)==11 and context['courseCode'] is None and context['courseTitle'] is None and context['scope'] is None and context['revisionInput'] is None
    assert context['classPreferences']==''
    assert generic[generic.index('## Applicable canonical learning rules'):]==template[template.index('## Applicable canonical learning rules'):]
    results.append({'case':'generic-review-delivery-composed-with-no-prefilled-course-or-scope','expected':'same complete canonical body; no raw slots or fourth independent goal','passed':True})
    for goal in ('review','assessment','assignment'):
        actual=(out/('copy-prompt-'+goal+'.md')).read_text()
        identity=next(line for line in actual.splitlines() if line.startswith('- `EC-IDENTIFY`:'))
        assert prompt_methodology_errors(root,goal,actual.replace(identity,''))
        results.append({'case':'reject-missing-context-identification-'+goal,'expected':'shared intake retains explicit-context priority, actual material inspection and no prior-test inheritance','passed':True})
    for version in ('beta-2','beta-3','beta-4','beta-5','beta-6','beta-7','beta-8','beta-9','beta-10','beta-11','beta-12'):
        snapshot=out/('versions/notebook-instructions-'+version)
        if snapshot.exists():
            receipt=json.loads((snapshot/'SNAPSHOT.json').read_text())
            assert receipt['promptBuild']=='notebook-instructions-'+version
            for name,sha in receipt['sha256'].items():assert hashlib.sha256((snapshot/name).read_bytes()).hexdigest()==sha
            results.append({'case':'published-'+version+'-snapshot-preserved','expected':'all archived published version file hashes unchanged','passed':True})
    for c in conversations['scenarios']:
        if 'gateExpectations' not in c:continue
        gate=c['gateExpectations']
        assert gate['requiresProject'] is False and gate['preparedBeforeReview'] is True
        assert gate['emitsJsonBeforeConfirmation'] is False and gate['requiresExplicitConfirmation'] is True
        assert 'EC-INPUT' in c['ruleIds'] and 'EC-PERSONALIZE' in c['ruleIds']
        results.append({'case':c['id']+'-authored-gate-expectations','expected':'script documents normal-chat preparation and post-draft confirmation; not evidence of actual AI behavior','passed':True})
    script=next(c for c in conversations['scenarios'] if c['id']=='student-tweaks-then-confirms')
    assert script['gateExpectations']['substantiveChangeNeedsNewReview'] is True
    assert [t['emitsFinalJson'] for t in script['confirmationTurns']]==[False,True]
    assert 'Draft B' in script['readableDraft']
    results.append({'case':'authored-revised-draft-confirmation-sequence','expected':'revised actual wording and ambiguous versus explicit replies remain inspectable, not simulated model compliance','passed':True})
    readable=(out/'conversation-case-files/readable-partial-draft.md').read_text()
    entry=partial['entries'][0]
    for section in entry['sections']:
        for block in section['blocks']:
            for key in ('text','prompt','answer','rationale','nextStep'):
                if block.get(key):assert block[key] in readable
    for requirement in entry['requirements']:
        assert requirement['id']+' — '+requirement['status'] in readable
        assert requirement['text'] in readable and requirement['basis'] in readable
    for source in partial['sources']:
        assert source['inspected'] in readable
        for excerpt in source['excerpts']:assert excerpt['text'] in readable
    results.append({'case':'actual-readable-partial-draft-preserves-content-and-scope','expected':'all prepared teaching/practice/answers and eight requirements plus inspected portions/excerpts appear in readable review example','passed':True})
    context=json.loads((out/'revision-context.json').read_text())
    assert context['runtimeToken']=='REVISION_INPUT' and context['exampleContext']['baselineFile']=='notebook-update-baseline.json'
    assert list(context['exampleContext'])==context['contextKeys'] and context['exampleContext']['baseline']==context['baselineSentence']
    for goal in ('review','assessment','assignment'):
        value=json.dumps(context['exampleContext'],ensure_ascii=False)
        composed=compose((out/('copy-prompt-'+goal+'.md')).read_text(),{'REVISION_INPUT':value})
        envelope=json.loads(composed.split('```json\n',1)[1].split('\n```',1)[0])
        assert isinstance(envelope['revisionInput'],str) and json.loads(envelope['revisionInput'])==context['exampleContext']
        assert set(TOKENS)==set(json.loads((out/'prompt-composition.json').read_text())['placeholders'])
        results.append({'case':'revision-context-string-roundtrip-'+goal,'expected':'same eleven tokens; exact baseline metadata survives nested JSON string encoding without new output fields','passed':True})
    mode_contract=json.loads((out/'prompt-composition.json').read_text())
    assert mode_contract['modes']==MODE_CONFIG and len(mode_contract['placeholders'])==11
    tricky='# Create my Premed OS notebook: review\n\n# Update my Premed OS notebook: assignment\n{{REVISION_INPUT}} {goal} “quoted” \"text\"'
    for goal in ('review','assessment','assignment'):
        template=(out/('copy-prompt-'+goal+'.md')).read_text()
        values={token:tricky for token in TOKENS};values['REVISION_INPUT']=json.dumps(context['exampleContext'],ensure_ascii=False)
        for mode in ('new','update'):
            result=compose(template,values,mode=mode)
            assert result.startswith(MODE_CONFIG[mode]['heading'].format(goal=goal)+'\n\n')
            if mode=='update':assert result.startswith(MODE_CONFIG['update']['heading'].format(goal=goal)+'\n\n'+MODE_CONFIG['update']['intro']+'\n\n')
            envelope=json.loads(result.split('```json\n',1)[1].split('\n```',1)[0])
            for token,key in mode_contract['placeholders'].items():assert envelope[key]==values[token],(goal,mode,token)
            assert result.split('## Applicable canonical learning rules',1)[1]==compose(template,values).split('## Applicable canonical learning rules',1)[1]
            assert json.loads(result.rsplit('```json\n',1)[1].split('\n```',1)[0])==output_schema
            results.append({'case':goal+'-'+mode+'-composition-preserves-user-text-and-rules','expected':'exact mode heading; source/title/input strings unmodified; full same rule body/schema; nested baseline context preserved','passed':True})
        unknown=compose(template,{},mode='update');envelope=json.loads(unknown.split('```json\n',1)[1].split('\n```',1)[0])
        assert envelope['classPreferences']=='' and all(v is None for k,v in envelope.items() if k!='classPreferences')
        assert 'earlier conversation is not needed' in unknown and 'If the baseline is missing, ask specifically for the previous notebook JSON' in unknown
        results.append({'case':goal+'-update-unknowns-retain-fresh-chat-recovery','expected':'missing optional/request values remain null/empty and complete baseline recovery rules remain available','passed':True})
    for name,template,values,mode in [('unknown-mode',(out/'copy-prompt-review.md').read_text(),{},'replace'),('unknown-token',(out/'copy-prompt-review.md').read_text(),{'UNRECOGNIZED':'value'},'update'),('untrusted-leading-heading','Student source title\n'+(out/'copy-prompt-review.md').read_text(),{},'update')]:
        try:compose(template,values,mode=mode)
        except ValueError:pass
        else:raise AssertionError(name+' should be rejected')
        results.append({'case':'reject-composition-'+name,'expected':'reject ambiguous contract/template input rather than rewrite arbitrary user/source text','passed':True})
    revision_dir=out/'revision-case';before=json.loads((revision_dir/'baseline-current.json').read_text());after=json.loads((revision_dir/'expected-revised-with-new-topic.json').read_text())
    assert not validate(before,schema) and not validate(after,schema) and not revision_errors(before,after)
    results.append({'case':'authored-topic-baseline-and-complete-revision','expected':'both schema-valid, same target lineage plus distinct new topic, preserved teaching and meaningful correction dependencies','passed':True})
    mutations=[
        ('student-edit','saved-student-edit',lambda p:block_map(p['entries'][0])['ch3-mapping'].update(text='A triangle maps left; a circle maps right.')),
        ('unrelated-rewrite','unchanged-block:ch3-summary',lambda p:block_map(p['entries'][0])['ch3-summary'].update(text='Rewritten summary without authorization.')),
        ('old-quote-rewritten','original-quotes-preserved',lambda p:p['sources'][0]['excerpts'][1].update(text='The shape is shown for 200 milliseconds.')),
        ('false-reread','retained-access-honesty',lambda p:p['sources'][0].update(access='read',inspected='I reread the complete original Tuesday file.')),
        ('missing-date','dated-lecture-provenance',lambda p:p['sources'][0].update(title='Old lecture')),
        ('timing-answer-stale','dependent-answer',lambda p:block_map(p['entries'][0])['ch3-practice-timing'].update(answer='100 milliseconds.')),
        ('objective-stale','dependent-objective',lambda p:next(o for o in p['entries'][0]['objectives'] if o['id']=='ch3-obj-task').update(understand=['The task uses a 100-millisecond presentation.'])),
        ('coverage-stale','dependent-coverage',lambda p:next(r for r in p['entries'][0]['requirements'] if r['id']=='ch3-req-task').update(basis='The duration is 100 milliseconds.')),
        ('false-result-covered','missing-result-visible',lambda p:next(r for r in p['entries'][0]['requirements'] if r['id']=='ch3-req-comparison').update(status='supported',nextStep=None)),
        ('invented-result','no-invented-result',lambda p:block_map(p['entries'][0])['ch3-comparison'].update(text='The noisy background lowers accuracy.')),
        ('duplicate-repetition','no-repeat-duplication',lambda p:p['entries'][0]['sections'][1]['blocks'].append(dict(block_map(p['entries'][0])['ch3-mapping'],id='repeated-mapping'))),
        ('new-topic-wrong-lineage','new-topic-separate',lambda p:p['entries'][1].update(revision=2,baseRevision=1)),
    ]
    for name,code,change in mutations:
        wrong=copy.deepcopy(after);change(wrong)
        assert not validate(wrong,schema),(name,validate(wrong,schema))
        assert code in revision_errors(before,wrong),(name,revision_errors(before,wrong))
        results.append({'case':'reject-topic-'+name,'expected':'source-specific preservation/correction audit detects '+code+' despite schema validity; not external AI compliance proof','passed':True})
    mapping_before=practice_dependency_snapshot(before,'ch3-practice-mapping');mapping_after=practice_dependency_snapshot(after,'ch3-practice-mapping')
    assert mapping_before is not None and mapping_before==mapping_after
    assert practice_dependency_snapshot(before,'ch3-practice-timing')!=practice_dependency_snapshot(after,'ch3-practice-timing')
    results.append({'case':'isolated-mapping-versus-corrected-timing-dependencies','expected':'mapping question and linked teaching/objective/requirement/excerpts stay exact; timing answer and dependencies change, without asserting app transfer or mastery','passed':True})
    ambiguous_before=json.loads((revision_dir/'ambiguous-linked-baseline.json').read_text());ambiguous_after=json.loads((revision_dir/'ambiguous-linked-proposal.json').read_text())
    assert not validate(ambiguous_before,schema) and not validate(ambiguous_after,schema)
    assert block_map(ambiguous_before['entries'][0])['ch3-practice-mapping']==block_map(ambiguous_after['entries'][0])['ch3-practice-mapping']
    assert practice_dependency_snapshot(ambiguous_before,'ch3-practice-mapping')!=practice_dependency_snapshot(ambiguous_after,'ch3-practice-mapping')
    missing_link=copy.deepcopy(before);missing_link['entries'][0]['objectives']=[o for o in missing_link['entries'][0]['objectives'] if o['id']!='ch3-obj-mapping']
    assert practice_dependency_snapshot(missing_link,'ch3-practice-mapping') is None
    results.append({'case':'shared-or-missing-dependency-is-not-unaffected-proof','expected':'same question text does not establish unchanged learning dependencies; broader app handling must be explicit and recoverable','passed':True})
    topic_draft=(revision_dir/'readable-revised-draft.md').read_text()
    for entry in after['entries']:
        for block in block_map(entry).values():
            for key in ('text','prompt','answer','rationale','nextStep'):
                if block.get(key):assert block[key] in topic_draft
        for req in entry['requirements']:assert req['text'] in topic_draft and req['basis'] in topic_draft
    assert REMINDER in topic_draft
    results.append({'case':'actual-readable-topic-draft-preserves-all-prepared-content','expected':'complete revised teaching, answers, rationale, scope and student reminder are accessible before scripted confirmation','passed':True})
    intake=next(c for c in conversations['scenarios'] if c['id']=='announced-fifty-image-intake')
    received=set();inspected=set();unreadable=set()
    for receipt in intake['batchReceipts']:
        received.update(receipt['received']);inspected.update(receipt['inspectedReadable']);inspected.update(receipt['inspectedUnreadable']);unreadable.update(receipt['inspectedUnreadable'])
        assert inspected<=received
        assert (len(received),len(inspected),len(received-inspected))==(receipt['expectedReceivedUnique'],receipt['expectedInspectedUnique'],receipt['expectedPending'])
    assert len(received)==49 and unreadable=={'image-28'} and {'image-'+str(i).zfill(2) for i in range(1,51)}-received=={'image-37'}
    assert intake['intakeExpectations']['doneUploadingApprovesJson'] is False and intake['intakeExpectations']['initialAllSuppliedNeedsExtraIntakeGate'] is False
    assert intake['intakeExpectations']['newMaterialInvalidatesMateriallyStaleApproval'] is True
    results.append({'case':'authored-multibatch-intake-reconciles-counts-and-distinct-gates','expected':'actual authored unique receipts total 49 not 50; received/inspected/unreadable/pending remain distinct and done is not approval; no provider capacity or model trial proof','passed':True})
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
    packet=out/'cross-provider-packet';receipt=json.loads((packet/'packet-manifest.json').read_text())
    assert receipt['providerRuns']==[] and receipt['ratings'] is None
    for name,item in receipt['files'].items():
        path=packet/name;assert hashlib.sha256(path.read_bytes()).hexdigest()==item['sha256'] and path.stat().st_size==item['bytes']
    assert receipt['totalFileBytes']==sum(v['bytes'] for v in receipt['files'].values())
    results.append({'case':'cross-provider-packet-manifest-and-no-execution','expected':'all authored inputs/checklist hashes verified; no provider results or ratings','passed':True})
    regression=json.loads((packet/'regressions.json').read_text());assert len(regression['cases'])==9 and not regression['executed'] and regression['ratings'] is None
    assert all(set(c['goals'])=={'review','assessment','assignment'} and c['ruleId'] in rule_ids for c in regression['cases'])
    assert len(SAFEGUARDS)==10
    audit=json.loads((out/'STANDARDIZATION-AUDIT.json').read_text());assert audit['release']=='paused'
    for row in audit['goals']:
        assert row['errors']==[] and sum(row['componentBytes'].values())==row['bytes']
        goal=row['goal'];prompt=(out/('copy-prompt-'+goal+'.md')).read_text()
        assert not dependency_errors(root,goal,prompt,output_schema)
        for name,wrong,expected in [('ending',prompt.rsplit('END NOTEBOOK INSTRUCTIONS',1)[0],'missing-complete-ending'),('external-file',prompt+'\nRead hidden-rules.md first.','unresolved-instruction-reference'),('schema-cutoff',prompt[:prompt.rfind('```json')+20],'incomplete-embedded-schema')]:
            assert any(e.startswith(expected) for e in dependency_errors(root,goal,wrong,output_schema))
            results.append({'case':'reject-standalone-'+goal+'-'+name,'expected':'actual assembled-text guard rejects visible omission or external dependency','passed':True})
    materials=packet/'materials'
    baseline=json.loads((materials/'notebook-update-baseline.json').read_text());mismatch=json.loads((materials/'wrong-course-baseline.json').read_text());request=json.loads((packet/'request-values.json').read_text())
    assert not validate(mismatch,schema) and baseline['course']==request['course'] and mismatch['course']!=request['course']
    assert mismatch['entries']==baseline['entries'] and mismatch['sources']==baseline['sources']
    results.append({'case':'authored-schema-valid-course-mismatch','expected':'target identity differs despite valid JSON; structural validity cannot clear the mismatch','passed':True})
    raw=(materials/'interrupted-baseline.txt').read_text();assert (materials/'notebook-update-baseline.json').read_text().startswith(raw)
    try:load_package_json(raw)
    except ValueError:pass
    else:raise AssertionError('Interrupted baseline unexpectedly complete')
    assert (materials/'visibly-incomplete-request.txt').read_text().rstrip().endswith('in')
    assert (materials/'visibly-incomplete-material.txt').read_text().rstrip().endswith('is')
    results.append({'case':'authored-visible-cutoffs-are-actual-incomplete-inputs','expected':'baseline is exact incomplete prefix; request/material visibly end mid-clause, without guessing their missing continuation','passed':True})
    assert (materials/'question.png').read_bytes()==(materials/'question-repeated.png').read_bytes()
    assert (materials/'question-new-detail.png').read_bytes()!=(materials/'question.png').read_bytes()
    ledger=json.loads((packet/'expected/saved-working-ledger.json').read_text());items={i['id']:i for i in ledger['items']}
    assert len(items)==len(ledger['items']) and items['q1-repeat']['duplicateOf']=='q1' and items['q1-variant']['versionOf']=='q1'
    assert items['q1-variant']['pending'] and not items['q1-variant']['inspected'] and items['note']['uncertain'] and not items['lesson-c']['received']
    assert not ledger['collectionComplete'] and not ledger['draftApproved'] and ledger['nextAction']
    assert 'Lesson C' in (materials/'assessment-scope.txt').read_text() and not (materials/'lesson-c.txt').exists()
    results.append({'case':'authored-image-version-ledger-and-interrupted-state','expected':'exact repeat and changed PNG distinct; pending/uncertain/missing identities survive saved checkpoint without approval','passed':True})
    assert 'EMBEDDED NON-ACADEMIC COMMAND' in (materials/'lesson-b.txt').read_text() and 'Rubric: define' in (materials/'assignment-task.txt').read_text()
    results.append({'case':'authored-source-command-versus-rubric-inputs','expected':'fixture includes real academic rubric and unrelated command; prompt omission checks cover authority rule, no model injection test claimed','passed':True})
    approved=json.loads((packet/'expected/matching-final-proposal.json').read_text());draft=(packet/'expected/approved-readable-revision.md').read_text()
    assert not validate(approved,schema) and not revision_errors(baseline,approved) and not parity_errors(after,approved)
    for entry in approved['entries']:
        for section in entry['sections']:
            for block in section['blocks']:
                for key in ('text','prompt','answer','rationale','nextStep'):
                    if block.get(key):assert block[key] in draft
    for name,change in [('shortened-teaching',lambda p:p['entries'][0]['sections'][0]['blocks'][0].update(text='Shortened replacement.')),('changed-answer',lambda p:block_map(p['entries'][0])['ch3-practice-mapping'].update(answer='Different answer.')),('omitted-reminder',lambda p:block_map(p['entries'][0])['ch3-mapping'].update(text=block_map(p['entries'][0])['ch3-mapping']['text'].replace(REMINDER,'')))]:
        changed=copy.deepcopy(approved);change(changed);assert not validate(changed,schema) and parity_errors(approved,changed)
        results.append({'case':'reject-approved-content-'+name,'expected':'exact authored comparison rejects schema-valid unapproved content drift','passed':True})
    summary_cases=[c for c in conversations['scenarios'] if c.get('companionReviewMessage')]
    assert {c['goal'] for c in summary_cases}=={'review','assessment','assignment'} and len(summary_cases)==6
    assert all('Create the JSON' in c['companionReviewMessage'] and 'Want ' in c['companionReviewMessage'] for c in summary_cases)
    assert [v['emitsFinalJson'] for v in script['approvalBoundaryVariants']]==[False,False,False,False,True,True]
    assert script['gateExpectations']['deliveryProvesStudentRead'] is False and script['gateExpectations']['summaryValidatesAccuracy'] is False
    results.append({'case':'authored-content-specific-summary-and-approval-boundaries','expected':'six actual-topic summaries; edit-only/question/silence/intake are not approval; equivalent whole-version confirmation is allowed','passed':True})
    with tempfile.TemporaryDirectory() as tmp:
        fresh=Path(tmp);build(root,fresh);fixtures(fresh);feasibility_case(fresh/'feasibility-case');conversation_examples(fresh,root/'premed-hq-documentation/specifications/generation/portable-notebooks');revision_cases(fresh/'revision-case');build_packet(fresh/'cross-provider-packet');prompt_audit(root,fresh)
        for path in packet.rglob('*'):
            if path.is_file():assert path.read_bytes()==(fresh/'cross-provider-packet'/path.relative_to(packet)).read_bytes(),str(path)
        assert (out/'STANDARDIZATION-AUDIT.md').read_bytes()==(fresh/'STANDARDIZATION-AUDIT.md').read_bytes()
        for path in (out/'revision-case').iterdir():
            if path.is_file():assert path.read_bytes()==(fresh/'revision-case'/path.name).read_bytes()
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
            assert 'Prompt build: notebook-instructions-beta-13.' in template
            values={token:'Sample '+token for token in TOKENS};values['CLASS_PREFERENCES']='Keep "quotes", newlines\n, unicode →, and {{SCOPE}} literal.'
            composed=compose(template,values)
            envelope=json.loads(composed.split('```json\n',1)[1].split('\n```',1)[0])
            assert envelope['classPreferences']==values['CLASS_PREFERENCES']
            embedded=json.loads(composed.rsplit('```json\n',1)[1].split('\n```',1)[0]);assert embedded==output_schema
            # All shipped rule fragments are reproduced verbatim; schema copied byte-for-byte.
        for path in out.glob('*.json'):
            if path.name in ('validation-report.json',):continue
            if (fresh/path.name).exists():assert path.read_bytes()==(fresh/path.name).read_bytes(),path.name
    results += [{'case':'reproducible-prompts-fixtures-manifest','expected':'identical bytes','passed':True},{'case':'single-pass-json-string-composition','expected':'quotes/newlines/unicode/token-looking input preserved','passed':True},{'case':'embedded-schema-equality','expected':'all three templates embed exact v3 output schema; v2 fixtures validate against preserved legacy schema','passed':True}]
    report={'outputSchemaSha256':hashlib.sha256((out/'notebook-package-v3.schema.json').read_bytes()).hexdigest(),'validator':'jsonschema '+importlib.metadata.version('jsonschema')+' Draft 2020-12 plus validate_package.py','schemaSha256':hashlib.sha256((out/'notebook-package.schema.json').read_bytes()).hexdigest(),'passed':len(results),'failed':0,'results':results,'limits':['No course trial was run and no Andy ratings were assigned.','Cross-reference validation cannot prove source authenticity, exact excerpt accuracy, evidence entailment, complete source coverage, originality, absence of answer leakage, or learning quality.','Fixture content received an author review against its invented passages; that is not an independent pedagogical audit.','App prompt/copy/download byte identity is an integration requirement, not a claim that the app UI was tested here.','Staged feasibility outputs and checkpoints are invented expectations. No external AI was run; the forced batch boundary is not a provider capacity benchmark.','Conversation examples and their checks validate authored expectations and preserved inputs, not compliance by an external AI or actual student outcomes.']}
    (out/'validation-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'passed':len(results),'failed':0,'schemaSha256':report['schemaSha256']}))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--canonical-root',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();run(a.canonical_root.resolve(),a.output.resolve())
