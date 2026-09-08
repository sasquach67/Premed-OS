"""Render authored expected-conversation data for manual beta; never call an AI."""
from pathlib import Path
import argparse, copy, hashlib, json

def build(out, source_root=None):
    source_root=source_root or Path(__file__).parent
    data=json.loads((source_root/'conversation-examples.json').read_text())
    out.mkdir(parents=True,exist_ok=True)
    case_dir=out/'conversation-case-files';case_dir.mkdir(exist_ok=True)
    original=json.loads((out/'feasibility-case/expected-partial-notebook.json').read_text())
    bad=copy.deepcopy(original);bad['entries'][0]['sections'][0]['blocks'][0]['sourceIds']=['week2']
    raw=json.dumps(original,indent=2)+'\n'
    (case_dir/'complete-reference-original.json').write_text(raw)
    (case_dir/'rejected-reference.json').write_text(json.dumps(bad,indent=2)+'\n')
    cutoff=raw.index('"text": "Renaming changes')+len('"text": "Renaming')
    (case_dir/'truncated-input.txt').write_text(raw[:cutoff])
    # Readable counterpart of the complete existing invented partial package, without changing it.
    entry=original['entries'][0]
    readable=['# '+entry['title'], 'Authored readable draft example, not an executed AI trial or finalization approval.', '**Scope:** '+entry['scope'], '**Preferences:** '+entry['request']['classPreferences'], '**Format:** '+entry['request']['assessmentFormat']]
    for section in entry['sections']:
        readable+=['## '+section['title']]
        for block in section['blocks']:
            if block['type']=='practice':
                readable+=['### Practice',block['prompt'],'### Answer',block['answer'],'### Reasoning',block['rationale']]
            else:
                assert block['type'] in ('paragraph','gap')
                readable+=[block['text']]
                if block.get('nextStep'):readable+=['Next step: '+block['nextStep']]
            readable+=['Evidence: '+', '.join(block['sourceIds'])+'; excerpts '+', '.join(block['excerptIds'])+'.']
    readable+=['## Complete requirement coverage']
    for requirement in entry['requirements']:
        readable+=['### '+requirement['id']+' — '+requirement['status'],requirement['text'],requirement['basis']]
        if requirement.get('nextStep'):readable+=['Next step: '+requirement['nextStep']]
    readable+=['## Actual source inventory and excerpts']
    for source in original['sources']:
        readable+=['### '+source['title']+' ('+source['id']+')', 'Access: '+source['access']+'. Inspected: '+source['inspected']]
        readable+=source['limitations']
        for excerpt in source['excerpts']:readable+=[excerpt['id']+' — '+str(excerpt['location']),'> '+excerpt['text']]
    readable+=['## Limits']+entry['limitations']+['Would you like changes or more material processed, or should I make notebook JSON from this partial draft? Waiting for explicit confirmation; no final JSON is emitted in this scripted review step.']
    (case_dir/'readable-partial-draft.md').write_text('\n\n'.join(readable)+'\n')
    parts=['# Expected external-AI conversations — manual beta',data['notice'],f"Prompt build: {data['promptBuild']}. Exactly three maintained goal prompts remain; the examples below show expected replies and decisions, not alternative prompts.", 'Use the corresponding complete goal prompt and the stated invented inputs in your chosen AI only if you want to run a manual test. Record actual replies separately. No ratings, import success or model compliance are prefilled.']
    for c in data['scenarios']:
        parts += ['## '+c['title'],'Goal: '+c['goal']+'. Scenario ID: '+c['id']+'.','**Given**\n\n'+'\n'.join('- '+item for item in c['given']),'**Expected first reply (illustrative wording)**\n\n> '+c['expectedFirstReply'],'**Expected next action**\n\n'+'\n'.join('- '+item for item in c['expectedNext'])]
        if c['id']=='failed-import-repair':parts+=['Manual case files: [complete original](conversation-case-files/complete-reference-original.json), [rejected reference](conversation-case-files/rejected-reference.json), [truncated input](conversation-case-files/truncated-input.txt). These are invented inspection/repair inputs, not successful imported notebooks.']
        for receipt in c.get('batchReceipts',[]):parts+=['**Authored batch '+str(receipt['batch'])+' receipt**: '+str(receipt['expectedReceivedUnique'])+' unique received, '+str(receipt['expectedInspectedUnique'])+' inspected (including any unreadable attempted item), '+str(receipt['expectedPending'])+' pending. These are scripted expectations, not actual inspection logs.']
        if c.get('readableDraft'):parts+=['**Actual prepared draft in this authored script**\n\n'+c['readableDraft']]
        if c.get('readableDraftFile'):parts+=['**Actual prepared draft**: [read the complete example draft]('+c['readableDraftFile']+').']
        for turn in c.get('confirmationTurns',[]):parts+=['**Scripted confirmation exchange**\n\nStudent: '+turn['student']+'\n\nExpected: '+turn['expected']+'\n\nFinal JSON emitted at this step: '+('yes, after confirmation' if turn['emitsFinalJson'] else 'no')+'.']
        if c['studentFollowUp']:parts+=['**Student follow-up in this script**\n\n'+c['studentFollowUp']]
        parts+=['**Expected continuation**\n\n'+c['expectedAfterReply'],'**Necessary pause**\n\n'+(c['necessaryPause'] or 'None in this scenario. Continue with the authorized, supported work.'),'**Must preserve**\n\n'+'\n'.join('- '+item for item in c['mustPreserve'])]
        for variant in c.get('variants',[]):parts+=['**Conditional variant**\n\nStudent: '+variant['student']+'\n\nExpected: '+variant['expected']]
        parts+=['Canonical rule references: '+', '.join(c['ruleIds'])+'.']
    parts+=['## Manual observations to record','Was the first reply brief and truthful about access? Did it prepare supported content when input was sufficient, including in a normal chat without a project? Did the student see the actual readable draft, scope, preferences and source gaps before final JSON? Did the AI wait for explicit post-review confirmation and seek it again after substantive changes? Did serialization preserve the approved content? Were necessary questions specific and bundled? Did it preserve scope, evidence, IDs and the help stage? Were real checkpoint/file creation and unexecuted checks described accurately? Did repair preserve known content and refuse to invent truncated parts? Record actual factual/source failures and use the ordinary beta feedback form; do not turn these scripted expectations into ratings.']
    (out/'EXPECTED-CONVERSATIONS.md').write_text('\n\n'.join(parts)+'\n')
    for name in ('conversation-examples.json','conversation-expectations.json','revision-context.json'):(out/name).write_bytes((source_root/name).read_bytes())
    names=['EXPECTED-CONVERSATIONS.md','conversation-examples.json','conversation-expectations.json','revision-context.json']+[str(p.relative_to(out)) for p in sorted(case_dir.iterdir()) if p.is_file()]
    receipt={'promptBuild':data['promptBuild'],'executed':False,'ratings':None,'purpose':'Authored expected examples, not model test results or importable notebook JSON.','files':{name:{'sha256':hashlib.sha256((out/name).read_bytes()).hexdigest(),'bytes':(out/name).stat().st_size} for name in names}}
    (out/'conversation-examples-manifest.json').write_text(json.dumps(receipt,indent=2)+'\n')
    return data

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);a=p.parse_args();data=build(a.output);print('Rendered '+str(len(data['scenarios']))+' scripted expected conversations; no AI trial executed.')
