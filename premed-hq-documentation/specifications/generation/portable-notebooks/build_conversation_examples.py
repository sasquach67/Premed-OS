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
    parts=['# Expected external-AI conversations — manual beta',data['notice'],f"Prompt build: {data['promptBuild']}. Exactly three maintained goal prompts remain; the examples below show expected replies and decisions, not alternative prompts.", 'Use the corresponding complete goal prompt and the stated invented inputs in your chosen AI only if you want to run a manual test. Record actual replies separately. No ratings, import success or model compliance are prefilled.']
    for c in data['scenarios']:
        parts += ['## '+c['title'],'Goal: '+c['goal']+'. Scenario ID: '+c['id']+'.','**Given**\n\n'+'\n'.join('- '+item for item in c['given']),'**Expected first reply (illustrative wording)**\n\n> '+c['expectedFirstReply'],'**Expected next action**\n\n'+'\n'.join('- '+item for item in c['expectedNext'])]
        if c['id']=='failed-import-repair':parts+=['Manual case files: [complete original](conversation-case-files/complete-reference-original.json), [rejected reference](conversation-case-files/rejected-reference.json), [truncated input](conversation-case-files/truncated-input.txt). These are invented inspection/repair inputs, not successful imported notebooks.']
        if c['studentFollowUp']:parts+=['**Student follow-up in this script**\n\n'+c['studentFollowUp']]
        parts+=['**Expected continuation**\n\n'+c['expectedAfterReply'],'**Necessary pause**\n\n'+(c['necessaryPause'] or 'None in this scenario. Continue with the authorized, supported work.'),'**Must preserve**\n\n'+'\n'.join('- '+item for item in c['mustPreserve'])]
        for variant in c.get('variants',[]):parts+=['**Conditional variant**\n\nStudent: '+variant['student']+'\n\nExpected: '+variant['expected']]
        parts+=['Canonical rule references: '+', '.join(c['ruleIds'])+'.']
    parts+=['## Manual observations to record','Was the first reply brief and truthful about access? Did it proceed when input was sufficient? Were necessary questions specific and bundled? Did it preserve scope, evidence, IDs and the help stage? Were real checkpoint/file creation and unexecuted checks described accurately? Did repair preserve known content and refuse to invent truncated parts? Record actual factual/source failures and use the ordinary beta feedback form; do not turn these scripted expectations into ratings.']
    (out/'EXPECTED-CONVERSATIONS.md').write_text('\n\n'.join(parts)+'\n')
    for name in ('conversation-examples.json','conversation-expectations.json'):(out/name).write_bytes((source_root/name).read_bytes())
    names=['EXPECTED-CONVERSATIONS.md','conversation-examples.json','conversation-expectations.json']+[str(p.relative_to(out)) for p in sorted(case_dir.iterdir()) if p.is_file()]
    receipt={'promptBuild':data['promptBuild'],'executed':False,'ratings':None,'purpose':'Authored expected examples, not model test results or importable notebook JSON.','files':{name:{'sha256':hashlib.sha256((out/name).read_bytes()).hexdigest(),'bytes':(out/name).stat().st_size} for name in names}}
    (out/'conversation-examples-manifest.json').write_text(json.dumps(receipt,indent=2)+'\n')
    return data

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);a=p.parse_args();build(a.output);print('Rendered five scripted expected conversations; no AI trial executed.')
