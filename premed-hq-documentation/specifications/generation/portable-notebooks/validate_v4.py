"""Deterministic v4 shape relationships; not evidence truth or visual neutrality."""
import math
from collections import Counter,defaultdict
from validate_visual import asset_refs

NEUTRAL_TYPES={'paragraph','table','figure','study-diagram','annotated-figure'}
NEW_TYPES={'annotated-figure','timeline','venn','sequence-strip','worked-example','continuum'}

def v4_errors(data,evidence):
    errors=[];assets={x['id']:x for x in data['assets']}
    def fail(code,msg):errors.append(code+': '+msg)
    def finite(v):
        if not isinstance(v,(int,float)) or isinstance(v,bool):return False
        try:return math.isfinite(v)
        except OverflowError:return False
    def refs(x):return (set(x['sourceIds']),set(x['excerptIds']),asset_refs(x))
    def inside(x,parent):return all(a<=b for a,b in zip(refs(x),refs(parent)))
    def nested(x,parent,label=None):
        item={**x,'id':x.get('id',label)};evidence(item,True)
        if any(isinstance(item.get(k),str) and not item[k].strip() for k in ('label','text','detail','explanation')):fail('v4-empty-text',str(item['id']))
        if not inside(item,parent):fail('v4-evidence-envelope',str(item['id']))
    def identities(items,b):
        ids=[x['id'] for x in items]
        if len(ids)!=len(set(ids)) or b['id'] in ids:fail('v4-item-identity',b['id'])
    def axis(b,items):
        a=b['axis'];values=[x['value'] for x in items]
        if a['mode']=='ordinal':
            if any(x is not None for x in [a['unit'],a['minimum'],a['maximum']]+values):fail('v4-ordinal-axis',b['id'])
        else:
            if not isinstance(a['unit'],str) or not a['unit'].strip() or not finite(a['minimum']) or not finite(a['maximum']) or a['minimum']>=a['maximum'] or not math.isfinite(a['maximum']-a['minimum']):
                fail('v4-numeric-axis',b['id']);return
            if not all(finite(v) and a['minimum']<=v<=a['maximum'] for v in values):fail('v4-numeric-value',b['id'])
            elif values!=sorted(values):fail('v4-numeric-order',b['id'])
    def stimulus(b,blocks):
        ids=b['stimulusBlockIds']
        if len(ids)!=len(set(ids)):fail('stimulus-duplicate',b['id'])
        for id in ids:
            if id not in blocks or blocks[id]['type'] not in NEUTRAL_TYPES:fail('stimulus-reference',b['id']+' -> '+id)
    for entry in data['entries']:
        blocks={b['id']:b for s in entry['sections'] for b in s['blocks']}
        for b in blocks.values():
            kind=b['type']
            if kind in NEW_TYPES:
                if not b['title'].strip():fail('v4-empty-title',b['id'])
                if kind=='worked-example' and (not b['problem'].strip() or not b['answer'].strip()):fail('v4-empty-text',b['id'])
                if 'orderingBasis' in b and not b['orderingBasis'].strip():fail('v4-ordering-basis',b['id'])
            if kind=='annotated-figure':
                identities(b['annotations'],b)
                for a in b['annotations']:
                    nested(a,b)
                    if b['assetId'] not in a['assetIds']:fail('v4-annotation-asset',a['id'])
                    if not finite(a['x']) or not finite(a['y']) or not(0<=a['x']<=1 and 0<=a['y']<=1):fail('v4-annotation-coordinate',a['id'])
                    if not a['label'].strip() or not a['positionBasis'].strip():fail('v4-annotation-label-basis',a['id'])
            elif kind in ('timeline','continuum'):
                items=b['events' if kind=='timeline' else 'points'];identities(items,b);axis(b,items)
                for x in items:nested(x,b)
            elif kind=='venn':
                identities(b['sets']+b['regions']+[x for r in b['regions'] for x in r['items']],b)
                ids=[s['id'] for s in b['sets']];expected={frozenset([ids[0]]),frozenset([ids[1]]),frozenset(ids)};seen=[]
                for s in b['sets']:nested(s,b)
                for r in b['regions']:
                    sig=frozenset(r['setIds']);seen.append(sig)
                    if len(r['setIds'])!=len(sig) or not sig<=set(ids):fail('v4-venn-membership',r['id'])
                    if sig==frozenset(ids) and not r['items']:fail('v4-venn-empty-overlap',r['id'])
                    for x in r['items']:nested(x,b)
                if set(seen)!=expected or len(seen)!=len(set(seen)):fail('v4-venn-regions',b['id'])
            elif kind=='sequence-strip':
                identities(b['steps'],b)
                for x in b['steps']:
                    nested(x,b)
                    if x['assetId'] is None:
                        if x['alt'] is not None:fail('v4-sequence-alt',x['id'])
                    elif not x['alt'] or not x['alt'].strip():fail('v4-sequence-alt',x['id'])
            elif kind=='worked-example':
                identities(b['steps'],b);stimulus(b,blocks)
                nested(b['problemEvidence'],b,b['id']+'/problemEvidence');nested(b['solutionEvidence'],b,b['id']+'/solutionEvidence')
                for x in b['steps']:nested(x,b['solutionEvidence'])
            elif kind=='study-diagram' and b['kind'] in ('decision-tree','hierarchy','causal-chain'):
                nodes={n['id'] for n in b['nodes']};incoming=Counter();outgoing=defaultdict(list)
                for edge in b['edges']:incoming[edge['to']]+=1;outgoing[edge['from']].append(edge)
                roots=nodes-set(incoming);valid=len(roots)==1 and all(incoming[n]<=1 for n in nodes)
                visited=set();active=set()
                def walk(n):
                    nonlocal valid
                    if n in active:valid=False;return
                    if n in visited:return
                    active.add(n);visited.add(n)
                    for edge in outgoing[n]:walk(edge['to'])
                    active.remove(n)
                if roots:walk(next(iter(roots)))
                valid=valid and visited==nodes and len(b['edges'])==len(nodes)-1
                if not valid:fail('v4-diagram-tree',b['id'])
                k=b['kind'];allowed={'decision-tree':{'other','sequence'},'hierarchy':{'contains'},'causal-chain':{'causes','inhibits'}}[k]
                if any(e['relation'] not in allowed for e in b['edges']):fail('v4-diagram-relation',b['id'])
                max_children={'decision-tree':2,'hierarchy':4,'causal-chain':1}[k]
                if any(len(v)>max_children for v in outgoing.values()):fail('v4-diagram-branching',b['id'])
                if k=='decision-tree':
                    for edges in outgoing.values():
                        labels=[x['label'].strip().casefold() for x in edges]
                        if any(not x for x in labels) or len(labels)!=len(set(labels)):fail('v4-decision-condition',b['id'])
    return errors
