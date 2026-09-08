"""Authored topic-revision cases and focused audits; no model calls or student trials."""
from pathlib import Path
import argparse, copy, hashlib, json

NOTICE='Authored PSYC topic-revision example with invented passages, not actual course content, AI execution or student ratings.'
REMINDER='My reminder: identify the shape first, then choose the response.'
TUESDAY=[('t1','Passage T1','In our classroom task, a triangle means choose left and a circle means choose right.'),('t2','Passage T2','The shape is shown for 100 milliseconds.'),('t3','Passage T3','Later, compare plain and noisy backgrounds, including whether performance differs.')]
THURSDAY=[('h1','Passage H1','The mapping is still triangle-left and circle-right.'),('h2','Passage H2','Now compare a plain background with a noisy background while keeping the shape-to-response mapping the same. We have not supplied the performance results.'),('h3','Passage H3','I said 100 milliseconds on Tuesday; that was a mistake. The shape duration for that example was 200 milliseconds.'),('h4','Passage H4','Chapter 4 starts a separate topic: a signal is the instruction presented; a response is the action selected. The rest of this chapter comes later.')]

def evidence(*ids):
    sources=list(dict.fromkeys('psych-tue' if id.startswith('t') else 'psych-thu' for id in ids))
    return {'sourceIds':sources,'excerptIds':list(ids)}
def block(id,text,ids):return dict(id=id,type='paragraph',provenance='clarification',text=text,**evidence(*ids))
def practice(id,prompt,answer,rationale,ids):return dict(id=id,type='practice',provenance='generated-practice',prompt=prompt,answer=answer,rationale=rationale,**evidence(*ids))
def section(id,title,blocks,purpose='study-guide'):return dict(id=id,title=title,purpose=purpose,blocks=blocks)
def requirement(id,text,sectionIds,ids,status='supported',basis='The retained task passage supports the linked explanation and practice.',nextStep=None):return dict(id=id,text=text,kind='objective',authority='selected-material',sectionIds=sectionIds,status=status,basis=basis,nextStep=nextStep,**evidence(*ids))
def source(id,title,passages):return dict(id=id,title=title,role='transcript',access='read',inspected='Complete invented passages below, not a real lecture file.',limitations=[NOTICE],used=True,excerpts=[dict(id=id,location=location,text=text) for id,location,text in passages])
def package(entries,sources):return dict(format='premed-os-notebook-package',version=2,instructionsVersion='notebook-workflows-draft-2',course=dict(code='PSYC 101',title='Authored PSYC notebook example',term=None),sources=sources,entries=entries)
def base_entry(id,title,scope,sections,requirements,objectives):return dict(id=id,revision=1,baseRevision=None,title=title,goal='review',scope=scope,request=dict(helpStage=None,classPreferences='Keep my reminders; define the task before comparing conditions.',assessmentFormat=None),sections=sections,requirements=requirements,objectives=objectives,limitations=[NOTICE])

def examples():
    mapping=block('ch3-mapping','A triangle maps to a left response; a circle maps to a right response. '+REMINDER,('t1',))
    timing=block('ch3-timing','Tuesday describes a 100-millisecond shape presentation in this classroom example.',('t2',))
    pmap=practice('ch3-practice-mapping','In the supplied classroom task, which response follows a triangle?','Choose left.','The retained mapping assigns a triangle to the left response.',('t1',))
    ptime=practice('ch3-practice-timing','What shape-presentation duration is specified for this classroom example?','100 milliseconds.','Tuesday Passage T2 states 100 milliseconds for this example.',('t2',))
    requirements=[requirement('ch3-req-task','Study objective: Explain the task mapping and presentation duration.',['ch3-teaching','ch3-practice'],('t1','t2'),basis='Tuesday supports the mapping and the stated 100-millisecond duration.'),requirement('ch3-req-comparison','Study objective: Compare plain and noisy backgrounds, including whether performance differs.',['ch3-gaps'],('t3',),status='missing',basis='Tuesday identifies this future comparison but provides neither the setup details nor performance evidence.',nextStep='Inspect the later comparison material and performance results when supplied.')]
    obj=dict(id='ch3-obj-task',requirementId='ch3-req-task',title=requirements[0]['text'],origin='derived',freeRecallCues=['Recall the shape-to-response mapping and the stated presentation duration.'],understand=['The classroom task presents a shape.','A triangle instructs a left response.','A circle instructs a right response.','The shape determines the response instruction.','Tuesday states a 100-millisecond presentation for this example.'],beAbleToDo=['Choose the response assigned to a triangle.','Recall the duration stated for the classroom example.'],watchFor=['Keep the instruction mapping separate from how long the shape is displayed.'],practiceBlockIds=['ch3-practice-mapping','ch3-practice-timing'],evidenceLimit=None,**evidence('t1','t2'))
    gap=dict(id='ch3-comparison-gap',type='gap',provenance='clarification',text='The plain/noisy comparison has been named but its teaching and results are not supplied.',nextStep='Obtain the later comparison passages and actual performance evidence.',**evidence('t3'))
    sections=[section('ch3-orientation','At a glance',[block('ch3-overview','This topic distinguishes the task instruction, response choice and presentation condition.',('t1','t2'))]),section('ch3-teaching','Task mapping and duration',[mapping,timing]),section('ch3-practice','Recall the supplied task',[pmap,ptime],'practice'),section('ch3-synthesis','Keep the jobs distinct',[block('ch3-summary','Identify the shape, apply its response mapping, then check the stated presentation condition.',('t1','t2'))]),section('ch3-gaps','Coverage limits',[gap],'next-steps')]
    baseline=package([base_entry('psych-ch3','Chapter 3 — classroom task, Tuesday','Selected Chapter 3 task and named comparison from Tuesday; no whole-chapter coverage claim.',sections,requirements,[obj])],[source('psych-tue','PSYC example — Tuesday 2026-09-08',TUESDAY)])
    revised=copy.deepcopy(baseline);e=revised['entries'][0];e.update(revision=2,baseRevision=1,title='Chapter 3 — classroom task, Tuesday and Thursday',scope='Selected Chapter 3 task and comparison through Tuesday and Thursday; performance results remain missing.')
    old=revised['sources'][0];old.update(access='partial',inspected='Reused exact T1–T3 excerpts supplied in the saved current-content export; the original Tuesday lecture file was not reread.',limitations=[NOTICE,'Only retained baseline excerpts are available in this update; no claim of fresh full-file access.'])
    revised['sources'].append(source('psych-thu','PSYC example — Thursday 2026-09-10',THURSDAY))
    mapping=e['sections'][1]['blocks'][0];mapping.update(**evidence('t1','h1'))
    e['sections'][1]['blocks'][1].update(text='The shape duration for this classroom example is 200 milliseconds. Thursday H3 explicitly corrects Tuesday T2, which originally said 100 milliseconds; keep that earlier wording as historical evidence.',**evidence('t2','h3'))
    comparison=block('ch3-comparison','The plain and noisy background conditions vary the background while keeping the shape-to-response mapping fixed. No performance results were supplied, so this setup does not establish a difference in accuracy or speed.',('h1','h2'))
    e['sections'].insert(2,section('ch3-comparison-section','Compare the presentation conditions',[comparison]))
    ptime=next(b for s in e['sections'] for b in s['blocks'] if b['id']=='ch3-practice-timing');ptime.update(answer='200 milliseconds.',rationale='Thursday H3 explicitly corrects the earlier 100-millisecond statement in Tuesday T2 for this same example.',**evidence('t2','h3'))
    e['sections'].insert(4,section('ch3-comparison-practice','Apply the comparison',[practice('ch3-practice-comparison','Compare the plain/noisy conditions: what changes, what stays fixed, and can you conclude that accuracy differs?','The background changes; the shape-to-response mapping stays fixed. Accuracy differences are unknown from the supplied material.','Thursday H2 gives the changed and fixed elements but explicitly withholds performance results.',('h2',))],'practice'))
    gap=next(b for s in e['sections'] for b in s['blocks'] if b['id']=='ch3-comparison-gap');gap.update(text='The comparison setup is now supplied, but its performance results remain missing.',nextStep='Supply the actual performance results before concluding how accuracy or speed differs.',**evidence('t3','h2'))
    e['requirements'][0].update(basis='Tuesday establishes the task mapping; Thursday H3 corrects the presentation duration to 200 milliseconds. The teaching and timing recall reflect that correction.',**evidence('t1','t2','h3'))
    e['requirements'][1].update(status='partial',sectionIds=['ch3-comparison-section','ch3-comparison-practice','ch3-gaps'],basis='Thursday supports the changed/fixed conditions; the performance-result part of the original requirement remains unsupported.',nextStep='Obtain the actual performance results to address the remaining comparison subpart.',**evidence('t3','h1','h2'))
    obj=e['objectives'][0];obj['understand'][-1]='Thursday explicitly corrects the example duration to 200 milliseconds; Tuesday originally stated 100.';obj.update(**evidence('t1','t2','h3'))
    e['objectives'].append(dict(id='ch3-obj-comparison',requirementId='ch3-req-comparison',title=e['requirements'][1]['text'],origin='derived',freeRecallCues=['Distinguish the changed condition from the fixed mapping and identify the missing result.'],understand=['The background varies between plain and noisy.','The shape-to-response mapping remains fixed.','Performance results are absent, so no accuracy or speed effect can be inferred.'],beAbleToDo=['Identify what changes and what is fixed in this comparison.'],watchFor=['Do not turn a specified comparison setup into an invented performance result.'],practiceBlockIds=['ch3-practice-comparison'],evidenceLimit='The supplied Thursday setup contains no performance results; the requirement to compare actual performance remains unsupported.',**evidence('t3','h1','h2')))
    r=requirement('ch4-req-distinction','Study objective: Distinguish the presented signal from the selected response.',['ch4-teaching','ch4-practice'],('h4',))
    o=dict(id='ch4-obj-distinction',requirementId=r['id'],title=r['text'],origin='derived',freeRecallCues=['State the difference between a presented instruction and the selected action.'],understand=['The signal is the presented instruction.','The response is the selected action.'],beAbleToDo=['Classify a presented instruction as signal and a selected action as response.'],watchFor=['Do not claim the rest of Chapter 4 was supplied.'],practiceBlockIds=['ch4-practice-distinction'],evidenceLimit='Only the introductory distinction is supplied; later Chapter 4 mechanisms and examples are unavailable.',**evidence('h4'))
    ch4=base_entry('psych-ch4','Chapter 4 — introductory distinction','Only the introductory signal/response distinction from Thursday; later Chapter 4 material is unavailable.',[section('ch4-teaching','Signal and response',[block('ch4-explain','The signal is the instruction presented, whereas the response is the action selected. This is the supplied introduction only.',('h4',))]),section('ch4-practice','Apply the distinction',[practice('ch4-practice-distinction','In the supplied definitions, is the action selected the signal or the response?','The response.','Thursday H4 defines the response as the selected action.',('h4',))],'practice')],[r],[o])
    revised['entries'].append(ch4)
    # Isolate mapping and timing dependencies so unchanged mapping work is demonstrably independent.
    for pkg in (baseline,revised):
        e=pkg['entries'][0];blocks=block_map(e)
        blocks['ch3-mapping'].update(**evidence('t1'))
        replaced=[]
        for sec in e['sections']:
            if sec['id']=='ch3-teaching':
                replaced += [section('ch3-mapping-teaching','Shape-to-response mapping',[blocks['ch3-mapping']]),section('ch3-timing-teaching','Presentation duration',[blocks['ch3-timing']])]
            elif sec['id']=='ch3-practice':
                replaced += [section('ch3-mapping-practice','Recall the mapping',[blocks['ch3-practice-mapping']],'practice'),section('ch3-timing-practice','Recall the duration',[blocks['ch3-practice-timing']],'practice')]
            else:replaced.append(sec)
        e['sections']=replaced
        revised_state=e['revision']==2
        req=e['requirements'][0];req['basis']='Thursday H3 explicitly corrects the example duration to 200 milliseconds; the teaching and timing recall retain that correction.' if revised_state else 'Tuesday supplies the stated 100-millisecond duration for this classroom example.';req.update(text='Study objective: Recall the stated presentation duration.',sectionIds=['ch3-timing-teaching','ch3-timing-practice'],**evidence(*(('t2','h3') if revised_state else ('t2',))))
        o=e['objectives'][0];o.update(title=req['text'],freeRecallCues=['Recall the stated presentation duration and any explicit correction.'],understand=['The duration refers to shape presentation in this classroom example.', 'Thursday explicitly corrects the example to 200 milliseconds; Tuesday originally stated 100.' if revised_state else 'Tuesday states a 100-millisecond presentation for this example.'],beAbleToDo=['Recall the supported duration for this example.'],watchFor=['Do not generalize a task-specific duration to every classroom task.'],practiceBlockIds=['ch3-practice-timing'],evidenceLimit='Only a task-specific duration is supplied; there is no evidence for a broader timing mechanism or general duration rule.',**evidence(*(('t2','h3') if revised_state else ('t2',))))
        mapping_req=requirement('ch3-req-mapping','Study objective: Use the shape-to-response mapping.',['ch3-mapping-teaching','ch3-mapping-practice'],('t1',))
        mapping_obj=dict(id='ch3-obj-mapping',requirementId=mapping_req['id'],title=mapping_req['text'],origin='derived',freeRecallCues=['Recall the response assigned to each shape.'],understand=['A shape supplies the task instruction.','A triangle maps to a left response.','A circle maps to a right response.','The two shapes have different assigned responses.','Identify the shape before applying its assigned mapping.'],beAbleToDo=['Choose left for a triangle.','Choose right for a circle.'],watchFor=['Keep the shape instruction distinct from any performance claim.'],practiceBlockIds=['ch3-practice-mapping'],evidenceLimit=None,**evidence('t1'))
        e['requirements'].insert(0,mapping_req);e['objectives'].insert(0,mapping_obj)
        old=pkg['sources'][0];old.update(access='partial',inspected='Retained exact T1–T3 excerpts from the supplied saved content; the original Tuesday lecture file was not reread.',limitations=[NOTICE,'Only retained excerpts are available; no claim of fresh full-file access.'])
    return baseline,revised

def block_map(entry):return {b['id']:b for s in entry['sections'] for b in s['blocks']}
def revision_errors(baseline,proposal):
    """Source-specific audit of this authored example, not a generic AI-output evaluator."""
    errors=[];before=baseline['entries'][0];e=proposal['entries'][0];a=block_map(before);b=block_map(e)
    def require(ok,code):
        if not ok:errors.append(code)
    require(proposal['course']==baseline['course'],'course-preservation')
    require(e['id']==before['id'] and e['baseRevision']==before['revision'] and e['revision']==before['revision']+1,'revision-lineage')
    require(set(a)<=set(b),'surviving-block-identities')
    for id in ('ch3-overview','ch3-practice-mapping','ch3-summary'):require(b.get(id)==a[id],'unchanged-block:'+id)
    require(b.get('ch3-mapping',{}).get('text')==a['ch3-mapping']['text'] and REMINDER in b.get('ch3-mapping',{}).get('text',''),'saved-student-edit')
    require(sum(REMINDER in x.get('text','') for x in b.values())==1,'no-repeat-duplication')
    src={s['id']:s for s in proposal['sources']}
    require(src.get('psych-tue',{}).get('excerpts')==baseline['sources'][0]['excerpts'],'original-quotes-preserved')
    require(src.get('psych-tue',{}).get('access')=='partial' and 'not reread' in src.get('psych-tue',{}).get('inspected',''),'retained-access-honesty')
    require('2026-09-08' in src.get('psych-tue',{}).get('title','') and '2026-09-10' in src.get('psych-thu',{}).get('title',''),'dated-lecture-provenance')
    require('200 milliseconds' in b.get('ch3-timing',{}).get('text','') and {'t2','h3'}<=set(b.get('ch3-timing',{}).get('excerptIds',[])),'correction-context')
    require(b.get('ch3-practice-timing',{}).get('answer')=='200 milliseconds.' and 'corrects' in b.get('ch3-practice-timing',{}).get('rationale',''),'dependent-answer')
    obj=next((o for o in e['objectives'] if o['id']=='ch3-obj-task'),{})
    require(any('corrects' in x and '200' in x for x in obj.get('understand',[])),'dependent-objective')
    req={r['id']:r for r in e['requirements']}
    require(set(req)=={r['id'] for r in before['requirements']},'original-requirements')
    require('200 milliseconds' in req.get('ch3-req-task',{}).get('basis',''),'dependent-coverage')
    require(req.get('ch3-req-comparison',{}).get('status')=='partial' and req.get('ch3-req-comparison',{}).get('nextStep'),'missing-result-visible')
    require('No performance results were supplied' in b.get('ch3-comparison',{}).get('text','') and 'unknown' in b.get('ch3-practice-comparison',{}).get('answer',''),'no-invented-result')
    require(len(proposal['entries'])==2 and proposal['entries'][1]['id']=='psych-ch4' and proposal['entries'][1]['revision']==1 and proposal['entries'][1]['baseRevision'] is None,'new-topic-separate')
    return errors

def practice_dependency_snapshot(pkg, id):
    """Inspect this fixture's linked dependency content; not an app progress-transfer guarantee."""
    entry=pkg['entries'][0];blocks=block_map(entry);question=blocks[id]
    objectives=[o for o in entry['objectives'] if id in o['practiceBlockIds']]
    if not objectives:return None
    requirement_ids={o['requirementId'] for o in objectives}
    requirements=[r for r in entry['requirements'] if r['id'] in requirement_ids]
    if len(requirements)!=len(requirement_ids):return None
    section_ids={sid for r in requirements for sid in r['sectionIds']}
    sections=[s for s in entry['sections'] if s['id'] in section_ids]
    if len(sections)!=len(section_ids):return None
    excerpt_ids=set(question['excerptIds'])
    for item in objectives+requirements+[b for s in sections for b in s['blocks']]:excerpt_ids.update(item['excerptIds'])
    excerpts=[(source['id'],ex) for source in pkg['sources'] for ex in source['excerpts'] if ex['id'] in excerpt_ids]
    if len(excerpts)!=len(excerpt_ids):return None
    return {'question':question,'objectives':objectives,'requirements':requirements,'sections':sections,'excerpts':excerpts}

def ambiguous_pair(before,after):
    left=copy.deepcopy(before);right=copy.deepcopy(after)
    for pkg in (left,right):next(r for r in pkg['entries'][0]['requirements'] if r['id']=='ch3-req-mapping')['sectionIds'].append('ch3-timing-teaching')
    return left,right

def render(pkg):
    parts=['# Readable authored topic-revision draft',NOTICE]
    for e in pkg['entries']:
        parts+=['## '+e['title'],'Scope: '+e['scope'],'Preferences: '+e['request']['classPreferences']]
        for s in e['sections']:
            parts+=['### '+s['title']]
            for b in s['blocks']:
                if b['type']=='practice':parts+=['Question: '+b['prompt'],'Answer: '+b['answer'],'Reasoning: '+b['rationale']]
                else:parts+=[b['text']]
                if b.get('nextStep'):parts+=['Next step: '+b['nextStep']]
                parts+=['Evidence: '+', '.join(b['excerptIds'])]
        parts+=['### Coverage']
        for r in e['requirements']:parts+=[r['id']+' / '+r['status']+': '+r['text'],r['basis']]+(['Next step: '+r['nextStep']] if r['nextStep'] else [])
        parts+=['### Mastery objectives — content, not student mastery']
        for o in e['objectives']:
            parts+=[o['title']]
            for key in ('freeRecallCues','understand','beAbleToDo','watchFor'):parts += [key+':']+o[key]
            if o['evidenceLimit']:parts+=[o['evidenceLimit']]
        parts+=e['limitations']
    parts+=['## Evidence supplied in this example']
    for s in pkg['sources']:
        parts+=[s['title']+' / '+s['access'],s['inspected']]+s['limitations']
        for ex in s['excerpts']:parts+=[ex['id']+' / '+str(ex['location']),'> '+ex['text']]
    parts+=['Would you like changes, or should I make notebook JSON from this reviewed content? This authored draft represents the wait for explicit confirmation; the example JSON files are inspectable test assets, not files emitted by an AI before approval.']
    return '\n\n'.join(parts)+'\n'

def build(out):
    out.mkdir(parents=True,exist_ok=True);before,after=examples()
    ambiguous_before,ambiguous_after=ambiguous_pair(before,after)
    records={'ambiguous-linked-baseline.json':ambiguous_before,'ambiguous-linked-proposal.json':ambiguous_after,'baseline-current.json':before,'expected-revised-with-new-topic.json':after,'app-records-not-in-current-export.json':{'notice':NOTICE,'purpose':'Illustrative app records outside notebook JSON; not an importable package or automatic AI input.','notes':'Ask about the noisy condition.','progress':{'ch3-practice-mapping':{'response':'Left.','complete':True},'ch3-practice-timing':{'response':'100 milliseconds.','complete':True}},'expected':'AI cannot see these from current-content export. The app owns notes/history/progress handling; changed timing work cannot inherit mastery.'}}
    for name,data in records.items():(out/name).write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
    for name,items in [('tuesday-material.md',TUESDAY),('thursday-material.md',THURSDAY)]:
        (out/name).write_text('# '+name+'\n\n'+NOTICE+'\n\n'+'\n\n'.join(loc+' ('+id+'): '+text for id,loc,text in items)+'\n')
    (out/'readable-revised-draft.md').write_text(render(after))
    (out/'README.md').write_text('''# Authored Tuesday/Thursday topic update

'''+NOTICE+'''

Given: saved current Chapter 3 JSON (including the student's reminder) plus the Thursday material. Tuesday originals are optional here because the necessary exact retained excerpts are present; do not claim fresh full-file reading. The student explicitly authorizes Chapter 3 revision and a distinct Chapter 4 introduction.

[Baseline current content](baseline-current.json) → [new Thursday passages](thursday-material.md) → [actual readable revised draft](readable-revised-draft.md) → explicit student confirmation → [expected complete revised proposal](expected-revised-with-new-topic.json).

The expected change review identifies repetition consolidated into the same mapping explanation, the unchanged student reminder and mapping practice, new comparison teaching with absent results, the explicit 100-to-200-ms correction and dependent timing answer/objective/coverage changes, and a distinct limited Chapter 4 entry. The complete readable draft remains accessible. No JSON is emitted by a model in this authored case; inspectable expected files do not count as a confirmation trial.

The separate [app records](app-records-not-in-current-export.json) illustrate notes and past practice work that are absent from current JSON. Do not import that file. The coordinated app policy preserves demonstrably unaffected isolated practice and resets changed meaning/dependencies, with prior records recoverable and notes preserved. Missing or ambiguous dependency links may justify a disclosed broader reset. Mapping is intended as an isolated unchanged item; timing has a corrected answer and is affected. This is a proposed record-handling expectation, never a correctness/mastery claim or AI transfer guarantee. App execution still requires its own checks and student action.

[Ambiguous/shared linkage baseline](ambiguous-linked-baseline.json) and [proposal](ambiguous-linked-proposal.json) deliberately link the mapping requirement to the timing section. Their unchanged mapping question alone cannot prove unaffected practice because its declared dependency changes; any broader reset must be disclosed, with prior work retained. These contrast with the isolated mapping path in the main case.

Conditional manual cases: (1) remove Tuesday's needed excerpt context: request that specific original passage, not every old source; (2) add newer saved student wording after export: block stale same-entry acceptance in the app and rebase the external proposal on the actual new current export, preserving the new wording and requesting fresh review; (3) remove the explicit correction language from Thursday and make its task context unclear: retain the conflict and seek specific context instead of silently treating the later number as authoritative.

These fixtures check content preservation, evidence and dependency consistency. They do not demonstrate that an external model followed the instructions, establish full canonical pedagogical quality or assign ratings.
''')
    receipt={'promptBuild':'notebook-instructions-beta-6','executed':False,'ratings':None,'notice':NOTICE,'files':{p.name:{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in sorted(out.iterdir()) if p.is_file() and p.name!='case-manifest.json'}}
    (out/'case-manifest.json').write_text(json.dumps(receipt,indent=2)+'\n');return before,after
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);a=p.parse_args();build(a.output);print('Built authored topic-revision cases; no AI executed.')
