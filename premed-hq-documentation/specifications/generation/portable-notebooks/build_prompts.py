"""Reproduce portable prompts from canonical Markdown, never a parallel rule rewrite."""
from pathlib import Path
import argparse, hashlib, json, re, subprocess

GEN = 'premed-hq-documentation/specifications/generation/'
BRIEFS = 'premed-hq-documentation/implementation/briefs/'
TOKENS = ['COURSE_CODE','COURSE_TITLE','TERM','SCOPE','MATERIALS','DEPTH','CLASS_PREFERENCES','HELP_STAGE','ASSESSMENT_FORMAT','USER_REQUEST','REVISION_INPUT']
KEYS = ['courseCode','courseTitle','term','scope','materials','depth','classPreferences','helpStage','assessmentFormat','userRequest','revisionInput']
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

def compose(template, values):
    """One pass: strings are JSON-encoded; replacement values are never rescanned."""
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
    shared=take(GEN+'19-study-source-and-format-contract.md','full')
    portable=take(GEN+'20-external-notebook-workflow.md','full')
    sg=take(GEN+'03-study-guide-v1.md','Runtime briefing mirror',lambda t:section(t,'Runtime briefing mirror').split('\n---',1)[0].rstrip()+'\n')
    sg+= '\n'+take(GEN+'03-study-guide-v1.md','Portable review notebook',lambda t:section(t,'Portable review notebook'))
    umo=take(GEN+'11-unit-mastery-outline-v1.md','Introduction and Rules excluding runtime plumbing',lambda t:t.split('\nThe runtime artifact spec',1)[0].rstrip()+'\n')
    umo+='\n'+take(GEN+'11-unit-mastery-outline-v1.md','Portable objective coverage',lambda t:section(t,'Portable objective coverage'))
    goal_rules={'review':sg+'\n'+umo}
    for goal,prefix,heading in [('assessment','NA-','Portable multi-lesson assessment preparation'),('assignment','NW-','Portable assignment support')]:
        path=BRIEFS+'notebook-'+goal+'-v1.md'
        goal_rules[goal]=take(path,'All substantive '+prefix+' rules',lambda t:rules(t,prefix))+'\n'+take(path,heading,lambda t:section(t,heading))
    schema_path=GEN+'portable-notebooks/notebook-package.schema.json'
    schema_raw=(root/schema_path).read_bytes(); schema=json.loads(schema_raw)
    schema_text=json.dumps(schema,ensure_ascii=False,separators=(',',':'))
    (out/'notebook-package.schema.json').write_bytes(schema_raw)
    products={}
    for goal in goal_rules:
        prompt=request.replace('{{GOAL_LABEL}}',goal)+f'''\n## Applicable canonical learning rules

The following text is copied reproducibly from the canonical Markdown. Its learning methodology remains in force. The portable contract below explicitly replaces legacy transport field names; use only the exact portable schema for output. Local paths in the copied text are provenance, not files you need to open.

{shared}
{goal_rules[goal]}
{portable}
## Exact JSON Schema

Return format=premed-os-notebook-package, version=2, instructionsVersion=notebook-workflows-draft-2. All entries in this requested output use goal={goal}. Preserve complete substantive content in the schema; do not output this prompt or a generator plan as the notebook. Review the readable teaching, evidence and coverage before declaring the JSON checks complete.

```json
{schema_text}
```
'''
        name='copy-prompt-'+goal+'.md'; (out/name).write_text(prompt)
        products[name]={'sha256':sha(prompt.encode()),'bytes':len(prompt.encode())}
    contract={'instructionsVersion':'notebook-workflows-draft-2','formatVersion':2,'delivery':'Exactly three prewritten static goal templates, derived from canonical Markdown during development. Goal selection retrieves the chosen template; placeholder insertion and student notes are local plain-text operations. No AI API generates or rewrites prompts. The student uses the resulting prompt in their preferred AI to generate notebook content.','templates':{g:'copy-prompt-'+g+'.md' for g in goal_rules},'placeholders':dict(zip(TOKENS,KEYS)),'replacement':'Single-pass literal token replacement using JSON.stringify(value); never rescan replacement values. All values string or null; classPreferences defaults to empty string.','identity':'Preview text, clipboard text and UTF-8 .md download bytes come from the same composed string. Do not prepend, append, regenerate or normalize one surface separately.','defaults':{**{t:None for t in TOKENS},'CLASS_PREFERENCES':''},'courseProfiles':'No inferred class presets. Use the actual class identity, explicit student preferences, and supplied source evidence. These class values are the complete class-specific input; the five manual course projects are not inspected by this builder.'}
    (out/'prompt-composition.json').write_text(json.dumps(contract,indent=2)+'\n')
    revision=subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip()
    manifest={'instructionsVersion':'notebook-workflows-draft-2','canonicalHeadAtBuild':revision,'canonicalRootAtBuild':str(root),'sources':selections,'schema':{'path':schema_path,'sha256':sha(schema_raw)},'tooling':{str(p.relative_to(root)):sha(p.read_bytes()) for p in sorted((root/GEN/'portable-notebooks').glob('*.py'))},'outputs':products,'deliberateEdits':['Adds external transport, coverage ledger, source access and revision rules in canonical 20.','Adds portable extensions to 03/11 and assessment/assignment briefs.','Strengthens multi-lesson assessment scope and teaching in the canonical assessment brief.','Selects full shared rules, all runtime study-guide rules, all mastery Rules and all substantive goal rule bullets; excludes renderer/persistence/repair implementation paragraphs.','Legacy names retained verbatim as methodological provenance, explicitly mapped by canonical 20.','JSON Schema copied byte-for-byte from coordinator v2; no schema changes.','Class preferences supplied per request; no invented course rules.','Coordinator request template 21 reconciled into canonical JSON request envelope; final 11-token contract supersedes the earlier draft tokens.'],'qualityStatus':'Draft; structural checks and invented fixtures cannot establish learning quality or count as manual course trials.'}
    (out/'canonical-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    return manifest

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--canonical-root',type=Path,required=True); parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args(); build(args.canonical_root.resolve(),args.output.resolve())
    print('Built three prompts, composition contract, schema and source manifest.')
