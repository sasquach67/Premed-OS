"""Closed v3 relationships, not binary resolution or scientific/visual truth."""

def asset_refs(item):
    return set(item.get('assetIds',[]))|({item['assetId']} if item.get('type')=='figure' else set())

def visual_errors(data,evidence):
    errors=[]
    def fail(code,msg):errors.append(code+': '+msg)
    sources={s['id']:s for s in data['sources']};assets={a['id']:a for a in data['assets']}
    if len(assets)!=len(data['assets']):fail('asset-duplicate','asset IDs')
    def no_cycles(mapping,code):
        for origin in mapping:
            seen=set();current=origin
            while current in mapping and mapping[current] is not None:
                if current in seen:fail(code,origin);break
                seen.add(current);current=mapping[current]
    for a in data['assets']:
        if a['sourceId'] not in sources:fail('asset-source',a['id'])
        if bool(a['originalAssetId'])!=bool(a['alteration']):fail('asset-derivative',a['id'])
        if a['originalAssetId']:
            original=assets.get(a['originalAssetId'])
            if original is None or original['sourceId']!=a['sourceId']:fail('asset-original',a['id'])
        if a['mimeType']=='image/png' and not a['fileName'].endswith('.png'):fail('asset-extension',a['id'])
        if a['mimeType']=='image/jpeg' and not a['fileName'].endswith(('.jpg','.jpeg')):fail('asset-extension',a['id'])
    no_cycles({a['id']:a['originalAssetId'] for a in data['assets']},'asset-cycle')
    review=data['visualReview'];records={r['sourceId']:r for r in review['sources']}
    if len(records)!=len(review['sources']) or set(records)!=set(sources):fail('visual-source-inventory','one review per supplied source')
    for r in review['sources']:
        if r['discovery']=='complete' and r['unprocessedPortions']:fail('visual-false-complete',r['sourceId'])
        if r['discovery']!='complete' and not r['unprocessedPortions'] and not r['limitations']:fail('visual-missing-limit',r['sourceId'])
        if r['imageState']=='none-found' and r['discovery']!='complete':fail('visual-unknown-images',r['sourceId'])
    candidates={c['id']:c for c in review['candidates']};selected=set()
    if len(candidates)!=len(review['candidates']):fail('visual-candidate-duplicate','candidate IDs')
    for c in review['candidates']:
        if c['sourceId'] not in sources:fail('visual-candidate-source',c['id'])
        if c['inspection'] in ('inspected','unclear') and not c['discovered']:fail('visual-false-inspection',c['id'])
        if c['inspection']=='missing' and c['discovered']:fail('visual-missing-discovered',c['id'])
        if not c['reason'].strip():fail('visual-decision-reason',c['id'])
        if c['decision']=='selected':
            a=assets.get(c['assetId'])
            if not c['discovered'] or c['inspection']!='inspected' or not a or a['sourceId']!=c['sourceId']:fail('visual-selected-asset',c['id'])
            else:selected.add(a['id'])
        elif c['assetId'] is not None:fail('visual-unselected-asset',c['id'])
        if (c['decision'] in ('pending','unavailable') or c['inspection']!='inspected') and not (c['nextStep'] and c['nextStep'].strip()):fail('visual-next-step',c['id'])
        if c['duplicateOf'] and c['changedFrom']:fail('visual-conflicting-relation',c['id'])
        for key in ('duplicateOf','changedFrom'):
            if c[key] and c[key] not in candidates:fail('visual-relation-reference',c['id'])
    for key in ('duplicateOf','changedFrom'):no_cycles({c['id']:c[key] for c in review['candidates']},'visual-relation-cycle')
    # A mixed duplicate/changed chain is still a relation cycle.
    no_cycles({c['id']:c['duplicateOf'] or c['changedFrom'] for c in review['candidates']},'visual-relation-cycle')
    for a in assets:
        if a not in selected:fail('visual-asset-unreviewed',a)
    for r in review['sources']:
        if r['imageState']=='none-found' and any(c['sourceId']==r['sourceId'] and c['discovered'] for c in review['candidates']):fail('visual-none-with-candidates',r['sourceId'])
    referenced=set()
    for entry in data['entries']:
        blocks={b['id']:b for s in entry['sections'] for b in s['blocks']}
        for b in blocks.values():
            referenced.update(asset_refs(b))
            if b['type']=='practice':
                refs=b.get('stimulusBlockIds',[])
                if len(refs)!=len(set(refs)):fail('stimulus-duplicate',b['id'])
                for id in refs:
                    target=blocks.get(id)
                    if not target or target['type'] not in ('paragraph','table','figure','study-diagram'):fail('stimulus-reference',b['id']+' -> '+id)
            if b['type']=='study-diagram':
                nodes={n['id']:n for n in b['nodes']};edges={e['id']:e for e in b['edges']}
                if len(nodes)!=len(b['nodes']) or len(edges)!=len(b['edges']):fail('diagram-duplicate',b['id'])
                for item in b['nodes']+b['edges']:
                    evidence(item,True);referenced.update(asset_refs(item))
                    if not set(item['sourceIds'])<=set(b['sourceIds']) or not set(item['excerptIds'])<=set(b['excerptIds']) or not asset_refs(item)<=asset_refs(b):fail('diagram-evidence-envelope',b['id']+'/'+item['id'])
                    if not item['label'].strip():fail('diagram-label',b['id'])
                for edge in b['edges']:
                    if edge['from'] not in nodes or edge['to'] not in nodes:fail('diagram-endpoint',b['id']+'/'+edge['id'])
        for item in entry['requirements']+entry['objectives']:referenced.update(asset_refs(item))
    # Derivative originals are legitimate closure dependencies even when not displayed.
    pending=list(referenced)
    while pending:
        a=assets.get(pending.pop());original=a['originalAssetId'] if a else None
        if original and original not in referenced:referenced.add(original);pending.append(original)
    if set(assets)-referenced:fail('asset-unreferenced',','.join(sorted(set(assets)-referenced)))
    return errors
