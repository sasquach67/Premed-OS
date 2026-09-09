"""Independent Draft 2020-12 validation and deterministic semantic references.
Does not prove excerpt authenticity, entailment, pedagogy, originality or coverage.
"""
import argparse, json
from collections import defaultdict
from pathlib import Path
from jsonschema import Draft202012Validator
from validate_visual import asset_refs, visual_errors

MAX_PACKAGE_BYTES=8*1024*1024

def load_package_json(raw):
    if len(raw.encode('utf-8'))>MAX_PACKAGE_BYTES:raise ValueError('package-size: input exceeds 8 MiB')
    def unique_keys(pairs):
        result={}
        for key,value in pairs:
            if key in result:raise ValueError('duplicate-key: '+key)
            result[key]=value
        return result
    return json.loads(raw,object_pairs_hook=unique_keys)

def validate(data,schema):
    errors=['schema: '+e.json_path+': '+e.message for e in Draft202012Validator(schema).iter_errors(data)]
    if errors:return errors
    seen=defaultdict(set)
    def fail(code,msg):errors.append(code+': '+msg)
    def identify(kind,item):
        id=item['id']
        if id in seen[kind]:fail('duplicate-id',kind+' '+id)
        seen[kind].add(id)
    visual=data.get('version') in (3,4)
    assets={a['id']:a for a in data.get('assets',[])}
    sources={};excerpts={};used=set()
    for src in data['sources']:
        identify('source',src);sources[src['id']]=src
        if src['access'] in ('unreadable','not-accessed') and (src['used'] or src['excerpts']):fail('inaccessible-evidence',src['id'])
        if src['used'] and (not src['inspected'].strip() or not (src['excerpts'] or (visual and any(a['sourceId']==src['id'] for a in assets.values())))):fail('uninspected-used',src['id'])
        if src['access'] in ('read','partial') and not src['inspected'].strip():fail('missing-inspected',src['id'])
        if src['access']!='read' and not src['limitations']:fail('missing-access-limit',src['id'])
        for ex in src['excerpts']:
            identify('excerpt',ex);excerpts[ex['id']]=src['id']
    def evidence(item,mandatory=False):
        sid=item['sourceIds'];eid=item['excerptIds'];label=item['id'];aid=asset_refs(item) if visual else set()
        if len(item.get('assetIds',[]))!=len(set(item.get('assetIds',[]))):fail('duplicate-reference',label)
        for id in aid:
            if id not in assets:fail('asset-reference',label+' -> '+id)
        if len(sid)!=len(set(sid)) or len(eid)!=len(set(eid)):fail('duplicate-reference',label)
        if mandatory and (not sid or not (eid or aid)):fail('missing-evidence',label)
        for id in sid:
            if id not in sources:fail('source-reference',label+' -> '+id)
            elif not sources[id]['used']:fail('unused-reference',label+' -> '+id)
            used.add(id)
        for id in eid:
            if id not in excerpts:fail('excerpt-reference',label+' -> '+id)
        owners={excerpts[id] for id in eid if id in excerpts}|{assets[id]['sourceId'] for id in aid if id in assets}
        if owners!=set(sid):fail('excerpt-ownership',label)
    for entry in data['entries']:
        identify('entry',entry)
        base=entry['baseRevision']
        if (base is None and entry['revision']!=1) or (base is not None and entry['revision']!=base+1):fail('revision-sequence',entry['id'])
        sections={s['id']:s for s in entry['sections']};blocks={b['id']:b for s in entry['sections'] for b in s['blocks']};requirements={r['id']:r for r in entry['requirements']}
        for sec in entry['sections']:
            identify('section',sec)
            for b in sec['blocks']:
                identify('block',b);evidence(b,b['type']!='gap' and b['provenance'] in ('source','clarification','generated-practice','student-work'))
                if b['type']=='practice' and b['provenance'] not in (('source','generated-practice') if visual else ('generated-practice',)):fail('practice-provenance',b['id'])
                if b['type']=='table' and any(len(row)!=len(b['columns']) for row in b['rows']):fail('table-width',b['id'])
        for r in entry['requirements']:
            identify('requirement',r);evidence(r,r['authority'] in ('official','selected-material'))
            if len(r['sectionIds'])!=len(set(r['sectionIds'])):fail('duplicate-reference',r['id'])
            if any(id not in sections for id in r['sectionIds']):fail('section-reference',r['id'])
            if r['status']=='supported' and not r['sectionIds']:fail('supported-without-content',r['id'])
            if r['status'] in ('supported','partial') and (not (r['excerptIds'] or (visual and r.get('assetIds'))) or not r['sectionIds']):fail('coverage-evidence',r['id'])
            if r['status']!='supported' and not (r['nextStep'] and r['nextStep'].strip()):fail('missing-next-step',r['id'])
        for o in entry['objectives']:
            identify('objective',o);evidence(o,True);r=requirements.get(o['requirementId'])
            if r is None:fail('requirement-reference',o['id'])
            else:
                if r['kind']!='objective' or r['status'] not in ('supported','partial'):fail('objective-support',o['id'])
                if o['origin']=='official' and (r['authority']!='official' or o['title']!=r['text']):fail('official-wording',o['id'])
                if r['status']=='partial' and not o['evidenceLimit']:fail('partial-without-limit',o['id'])
            if o['origin']=='derived' and not o['title'].startswith('Study objective:'):fail('derived-label',o['id'])
            if not (visual and entry['goal']=='review') and len(o['freeRecallCues'])>3:fail('recall-count',o['id'])
            if o['evidenceLimit']:
                if len(o['evidenceLimit'].split())<8:fail('vague-evidence-limit',o['id'])
            elif visual and entry['goal']=='review':
                if not o['beAbleToDo']:fail('mastery-action',o['id'])
            elif len(o['understand'])<5 or len(o['beAbleToDo'])<2 or len(o['watchFor'])<1 or not 1<=len(o['practiceBlockIds'])<=2:fail('ordinary-objective-depth',o['id'])
            if len(o['practiceBlockIds'])!=len(set(o['practiceBlockIds'])):fail('duplicate-reference',o['id'])
            for id in o['practiceBlockIds']:
                b=blocks.get(id)
                if b is None or b['type']!='practice':fail('practice-reference',o['id']+' -> '+id)
                elif not set(b['sourceIds'])<=set(o['sourceIds']) or not set(b['excerptIds'])<=set(o['excerptIds']) or (visual and not asset_refs(b)<=asset_refs(o)):fail('practice-objective-evidence',o['id'])
    if visual:errors.extend(visual_errors(data,evidence))
    if data.get('version')==4:
        from validate_v4 import v4_errors
        errors.extend(v4_errors(data,evidence))
    for id,src in sources.items():
        if src['used'] and id not in used:fail('unreferenced-used',id)
    return errors
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--schema',type=Path,required=True);p.add_argument('packages',type=Path,nargs='+');a=p.parse_args();schema=json.loads(a.schema.read_text());Draft202012Validator.check_schema(schema);failures=0
    for path in a.packages:
        try:errors=validate(load_package_json(path.read_text()),schema)
        except ValueError as error:errors=[str(error)]
        failures+=bool(errors);print(path.name+': '+('PASS' if not errors else '\n'+'\n'.join(errors)))
    raise SystemExit(bool(failures))
