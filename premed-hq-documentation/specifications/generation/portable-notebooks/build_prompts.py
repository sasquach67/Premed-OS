"""Reproduce portable prompts from canonical Markdown, never a parallel rule rewrite."""
from pathlib import Path
import argparse, hashlib, json, re, subprocess

GEN = 'premed-hq-documentation/specifications/generation/'
BRIEFS = 'premed-hq-documentation/implementation/briefs/'
TOKENS = ['COURSE_CODE','COURSE_TITLE','TERM','SCOPE','MATERIALS','DEPTH','CLASS_PREFERENCES','HELP_STAGE','ASSESSMENT_FORMAT','USER_REQUEST','REVISION_INPUT']
PROMPT_BUILD = 'notebook-instructions-beta-8'
KEYS = ['courseCode','courseTitle','term','scope','materials','depth','classPreferences','helpStage','assessmentFormat','userRequest','revisionInput']
MODE_CONFIG = json.loads((Path(__file__).parent/'prompt-modes.json').read_text())
PATTERN = re.compile(r'\{\{('+'|'.join(TOKENS)+r')\}\}')

def sha(data): return hashlib.sha256(data).hexdigest()
def section(text, heading):
    marker = '## '+heading+'\n'
    if text.count(marker) != 1: raise ValueError('Expected one heading: '+heading)
    return marker+text.split(marker,1)[1].split('\n## ',1)[0].rstrip()+'\n'

def rules(text, prefix):
    lines = [line for line in text.splitlines() if line.startswith('- `'+prefix)]
    if not lines: raise ValueError('No substantive goal rules')
    return '\n\n'.join(lines)+'\n'

def compose(template, values, mode='new'):
    """Apply trusted leading mode header, then insert inputs once without rescanning."""
    if mode not in ('new','update'):raise ValueError('Unknown composition mode: '+str(mode))
    for goal in ('review','assessment','assignment'):
        prefix=MODE_CONFIG['new']['heading'].format(goal=goal)+'\n\n'
        if template.startswith(prefix):break
    else:raise ValueError('Expected exact leading canonical goal heading')
    if mode=='update':
        template=MODE_CONFIG['update']['heading'].format(goal=goal)+'\n\n'+MODE_CONFIG['update']['intro']+'\n\n'+template[len(prefix):]
    unknown=set(values)-set(TOKENS)
    if unknown: raise ValueError('Unknown inputs: '+str(sorted(unknown)))
    clean={token:values.get(token) for token in TOKENS}
    for token, value in clean.items():
        if value is not None and not isinstance(value,str): raise TypeError(token+' must be string or null')
    clean['CLASS_PREFERENCES']=clean['CLASS_PREFERENCES'] or ''
    return PATTERN.sub(lambda m:json.dumps(clean[m[1]],ensure_ascii=False),template)

def build(root, out):
    out.mkdir(parents=True,exist_ok=True)
    selections={}
    def take(path, label, fn=lambda text:text):
        raw=(root/path).read_bytes(); result=fn(raw.decode())
        selections.setdefault(path,{'sha256':sha(raw),'sections':{}})['sections'][label]=sha(result.encode())
        return result
    request=take(GEN+'21-external-notebook-request-template.md','full')
    global_path=GEN+'02-global-rules-and-source-modes.md'
    global_rules=take(global_path,'Global rules 1.1 through 1.8',lambda t:t[t.index('## 1.1 Purpose'):t.index('## 1.9 Scope')].rstrip()+'\n')
    for heading in ['2.2 `SOURCE_PLUS_CLARIFICATION`','2.3 `SOURCE_PLUS_BACKGROUND`','2.6 Source primacy (invariant) — *added Aug 2026, Andy’s question*'.replace('Andy’s',"Andy's"),'3.2 State C is not an error — the rule that matters most']:
        global_rules+='\n'+take(global_path,heading,lambda t,h=heading:section(t,h).split('\n### ✅ Decision D-1',1)[0].rstrip()+'\n')
    global_rules+='\n'+take(global_path,'Cross-source behavior table',lambda t:'| Behavior | Rule |'+t.split('| Behavior | Rule |',1)[1].split('\n\n**Out of scope',1)[0]+'\n')
    shared=global_rules+'\n'+take(GEN+'19-study-source-and-format-contract.md','full')
    portable=take(GEN+'20-external-notebook-workflow.md','full')
    sg=take(GEN+'03-study-guide-v1.md','Runtime briefing mirror',lambda t:section(t,'Runtime briefing mirror').split('\n---',1)[0].rstrip()+'\n')
    sg+='\n'+take(GEN+'03-study-guide-v1.md','2. Required structure',lambda t:section(t,'2. Required structure'))
    sg+= '\n'+take(GEN+'03-study-guide-v1.md','Portable review notebook',lambda t:section(t,'Portable review notebook'))
    umo=take(GEN+'11-unit-mastery-outline-v1.md','Introduction and Rules excluding runtime plumbing',lambda t:t.split('\nThe runtime artifact spec',1)[0].rstrip()+'\n')
    umo+='\n'+take(GEN+'11-unit-mastery-outline-v1.md','Portable objective coverage',lambda t:section(t,'Portable objective coverage'))
    visual_path=GEN+'06-visual-system.md'
    visual=''
    for heading in ['1. The division of responsibility','2. The representation decision','7. Density and whitespace','8. The consistency rule (invariant)']:
        visual+='\n'+take(visual_path,heading,lambda t,h=heading:section(t,h))
    visual+='\n'+take(visual_path,'3.1 Tables',lambda t:'### 3.1 Tables\n'+t.split('### 3.1 Tables\n',1)[1].split('\n### 3.2 Processes',1)[0].rstrip()+'\n')
    visual+='\n'+take(visual_path,'9. The scan test without renderer-specific proxies',lambda t:section(t,'9. The scan test').split('\n### 9.1',1)[0].rstrip()+'\n')
    goal_rules={'review':sg+'\n'+umo+'\n'+visual}
    for goal,prefix,heading in [('assessment','NA-','Portable multi-lesson assessment preparation'),('assignment','NW-','Portable assignment support')]:
        path=BRIEFS+'notebook-'+goal+'-v1.md'
        goal_rules[goal]=take(path,'All substantive '+prefix+' rules',lambda t:rules(t,prefix))+'\n'+take(path,heading,lambda t:section(t,heading))
    schema_path=GEN+'portable-notebooks/notebook-package.schema.json'
    schema_raw=(root/schema_path).read_bytes(); schema=json.loads(schema_raw)
    schema_text=json.dumps(schema,ensure_ascii=False,separators=(',',':'))
    (out/'notebook-package.schema.json').write_bytes(schema_raw)
    products={}
    for goal in goal_rules:
        prompt=request.replace('{{GOAL_LABEL}}',goal).replace('{{PROMPT_BUILD}}',PROMPT_BUILD)+f'''\n## Applicable canonical learning rules

The following text is copied reproducibly from the canonical Markdown. Its learning methodology remains in force. The portable contract below explicitly replaces legacy transport field names; use only the exact portable schema for output. Local paths in the copied text are provenance, not files you need to open.

{shared}
{goal_rules[goal]}
{portable}
## Exact JSON Schema

Only after the student explicitly confirms the current actual readable draft as required by EC-REVIEW and EC-CONFIRM, return format=premed-os-notebook-package, version=2, instructionsVersion=notebook-workflows-draft-2. All entries in this requested output use goal={goal}. Preserve complete substantive content in the schema; do not output this prompt or a generator plan as the notebook. Review the readable teaching, evidence and coverage before declaring the JSON checks complete.

```json
{schema_text}
```

END NOTEBOOK INSTRUCTIONS — {PROMPT_BUILD} — {goal}
'''
        name='copy-prompt-'+goal+'.md'; (out/name).write_text(prompt)
        parts={'request':request.replace('{{GOAL_LABEL}}',goal).replace('{{PROMPT_BUILD}}',PROMPT_BUILD),'commonLearningRules':shared,'goalLearningRules':goal_rules[goal],'externalWorkflow':portable,'schema':schema_text}
        sizes={key:len(value.encode()) for key,value in parts.items()};sizes['assembly']=len(prompt.encode())-sum(sizes.values())
        products[name]={'sha256':sha(prompt.encode()),'bytes':len(prompt.encode()),'words':len(prompt.split()),'componentBytes':sizes}
    contract={'instructionsVersion':'notebook-workflows-draft-2','formatVersion':2,'promptBuild':PROMPT_BUILD,'delivery':'Exactly three prewritten static goal templates, derived from canonical Markdown during development. Goal selection retrieves the chosen template; placeholder insertion and student notes are local plain-text operations. No AI API generates or rewrites prompts. The student uses the resulting prompt in their preferred AI to generate notebook content.','templates':{g:'copy-prompt-'+g+'.md' for g in goal_rules},'modes':MODE_CONFIG,'placeholders':dict(zip(TOKENS,KEYS)),'replacement':'Single-pass literal token replacement using JSON.stringify(value); never rescan replacement values. All values string or null; classPreferences defaults to empty string.','identity':'Preview text, clipboard text and UTF-8 .md download bytes come from the same composed string. Do not prepend, append, regenerate or normalize one surface separately.','defaults':{**{t:None for t in TOKENS},'CLASS_PREFERENCES':''},'courseProfiles':'No inferred class presets. Use the actual class identity, explicit student preferences, and supplied source evidence. These class values are the complete class-specific input; the five manual course projects are not inspected by this builder.'}
    (out/'prompt-modes.json').write_bytes((root/GEN/'portable-notebooks/prompt-modes.json').read_bytes())
    (out/'prompt-composition.json').write_text(json.dumps(contract,indent=2)+'\n')
    revision=subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip()
    manifest={'instructionsVersion':'notebook-workflows-draft-2','promptBuild':PROMPT_BUILD,'canonicalHeadAtBuild':revision,'canonicalRootAtBuild':str(root),'sources':selections,'schema':{'path':schema_path,'sha256':sha(schema_raw)},'supportingData':{str(p.relative_to(root)):sha(p.read_bytes()) for p in sorted((root/GEN/'portable-notebooks').glob('*.json')) if p.name in ('goal-guidance.json','conversation-examples.json','conversation-expectations.json','revision-context.json','prompt-modes.json')},'supportingDocuments':{str(p.relative_to(root)):sha(p.read_bytes()) for p in sorted((root/GEN/'portable-notebooks').glob('*.md'))},'testAssets':{str(p.relative_to(root)):sha(p.read_bytes()) for p in sorted((root/GEN/'portable-notebooks/cross-provider-assets').glob('*.png'))},'tooling':{str(p.relative_to(root)):sha(p.read_bytes()) for p in sorted((root/GEN/'portable-notebooks').glob('*.py'))},'outputs':products,'deliberateEdits':['Adds external transport, coverage ledger, source access and revision rules in canonical 20.','Adds portable extensions to 03/11 and assessment/assignment briefs.','Strengthens multi-lesson assessment scope and teaching in the canonical assessment brief.','Includes applicable baseline global learning/source-mode rules verbatim, full shared 19, all runtime study-guide rules plus full required structure, all mastery Rules, selected visual learning sections and all substantive assessment/assignment rule bullets. Excludes renderer/persistence/repair implementation paragraphs.','Legacy names retained verbatim as methodological provenance, explicitly mapped by canonical 20.','JSON Schema copied byte-for-byte from coordinator v2; no schema changes.','Class preferences supplied per request; no invented course rules.','Coordinator request template 21 reconciled into canonical JSON request envelope; final 11-token contract supersedes the earlier draft tokens.','Beta 2 makes assessment evidence batches, external saved checkpoints, explicit unprocessed/missing scope and final cross-lesson synthesis actionable; no app checkpoint import or automatic semantic merge.','Beta 3 adds a shared first-reply and conditional follow-up contract across the same three goals, including necessary input questions, automatic supported continuation, scope/pause/revision and complete-file repair behavior. Expected examples are not executed AI trials or extra prompts.','Beta 4 explicitly supports normal chats without projects, personalizes from known needs, and supersedes automatic final export with accessible actual-content review and explicit confirmation. Substantive changes require renewed review; finalization preserves approved content and evidence.','Beta 5 implements topic updates across dated lectures from the exact saved current-content baseline, targeted overlap/correction/dependency handling, preserved student edits and unchanged content, readable change review and app-controlled explicit acceptance. Revision mode uses the same three prompts and existing REVISION_INPUT string; schema/tokens unchanged.','Beta 5 also distinguishes ordinary-chat digital text versus direct visual inspection and announced multi-message collection: explicit done closes intake, not the later readable-draft confirmation gate. No fixed provider caps or OCR/folder completeness claims.','Beta 6 standardizes ten shared safeguards and a content-specific companion summary with full accessible draft, optional grounded discussion and unambiguous current-version approval. Consolidates repeated workflow wording; retains complete methodology/schema, exactly three prompts and eleven tokens. Adds standalone component/dependency audit and one authored manual cross-provider packet; no provider runs or ratings.','Beta 7 adds only the EC-BASELINE missing-file request, app re-export and no-surviving-baseline new-recovery boundary. Exactly three full goal prompts and unchanged schema/tokens; beta 6 archived. No provider trials or ratings.','Beta 8 adds one canonical update-mode heading/intro and explicit reference composer mode before input insertion. Same three full goal templates, unchanged shared rules/schema/eleven tokens; no six-template duplication or user-text rewriting.'],'qualityStatus':'Draft; structural checks and invented fixtures cannot establish learning quality or count as manual course trials.'}
    (out/'canonical-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    return manifest

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--canonical-root',type=Path,required=True); parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args(); build(args.canonical_root.resolve(),args.output.resolve())
    print('Built three prompts, composition contract, schema and source manifest.')
