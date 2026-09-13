"""Portable prompt v1: validate JSON, apply fixed templates, build a NEW Anki package.
Run: python build_deck.py cards.json output.apkg
No Anki profile is opened. Output must not already exist.
"""
from pathlib import Path
import argparse, hashlib, html, json, re, tempfile, zipfile
from collections import Counter, defaultdict
import genanki
from jsonschema import Draft202012Validator

HERE = Path(__file__).resolve().parent
SCHEMA = json.loads((HERE / 'cards.schema.json').read_text())
CSS = (HERE / 'card-styles.css').read_text()
STYLE_ID = hashlib.sha256(CSS.encode()).hexdigest()[:12]
SPEC = 'journal-flashcards-v1:' + STYLE_ID
BASIC_FIELDS = ['Front', 'Back', 'Extra', 'Type', 'Mindset', 'premedos_concept_id', 'premedos_source', 'premedos_spec']
CLOZE_FIELDS = ['Text', 'Extra', 'Type', 'Mindset', 'premedos_concept_id', 'premedos_source', 'premedos_spec']
TYPE = '<div class="type">{{Type}}</div>'
EXTRA = '{{#Extra}}<div class="extra"><span class="extra-label">Extra</span>{{Extra}}</div>{{/Extra}}'
BASIC_Q = '<div class="pm {{Mindset}}">' + TYPE + '{{Front}}</div>'
BASIC_A = '<div class="pm {{Mindset}}">' + TYPE + '{{Front}}<hr id="answer"><div class="answer">{{Back}}</div>' + EXTRA + '</div>'
CLOZE_Q = '<div class="pm {{Mindset}}">' + TYPE + '{{cloze:Text}}</div>'
CLOZE_A = '<div class="pm {{Mindset}}">' + TYPE + '{{cloze:Text}}' + EXTRA + '</div>'
MINDSETS = {'basic': ('say', 'say it'), 'cloze': ('say', 'say it'), 'process': ('say', 'say it'), 'conceptual': ('explain', 'explain it'), 'comparison': ('connect', 'connect it'), 'exemplar': ('connect', 'connect it'), 'application': ('use', 'use it'), 'free-recall': ('blurt', 'blurt it')}

def escape(value):
    return html.escape(value, quote=True).replace('\n', '<br>')

def stable_id(value):
    return 1_000_000_000 + int(hashlib.sha256(value.encode()).hexdigest()[:10], 16)

def indices(card):
    return sorted({int(x) for x in re.findall(r'\{\{c(\d+)::', card['cloze'])}) if card['clozePattern'] else [1]

def require(condition, message):
    if not condition:
        raise ValueError(message)

def word_count(value):
    return len(value.split())

def validate(data):
    errors = sorted(Draft202012Validator(SCHEMA).iter_errors(data), key=lambda e: str(list(e.path)))
    require(not errors, '\n'.join(f'{list(e.path)}: {e.message}' for e in errors[:10]))
    warnings = []
    for key in ['sources', 'targets', 'cards']:
        ids = [r['id'] for r in data[key]]
        require(len(ids) == len(set(ids)), f'Duplicate {key} IDs.')
    require(all(part.strip() for part in data['deckName'].split('::')), 'Deck hierarchy has an empty segment.')
    sources = {s['id']: s for s in data['sources']}
    targets = {t['id']: t for t in data['targets']}
    cards = {c['id']: c for c in data['cards']}
    pairs = defaultdict(list)
    prompts = Counter()
    def evidence(ref):
        require(ref['sourceId'] in sources, f'Unknown source {ref["sourceId"]}.')
        require(sources[ref['sourceId']]['access'] != 'unreadable', 'Tested content or examples cite an unreadable source.')
    for source in data['sources']:
        require(source['access'] == 'readable' or source['limitations'].strip(), f'Describe unreadable/partial material: {source["title"]}.')
    for c in data['cards']:
        cid = c['id']
        require(all(t in targets for t in c['targetIds']), f'{cid}: unknown learning target.')
        require(len(c['targetIds']) == len(set(c['targetIds'])), f'{cid}: repeated target reference.')
        for ref in c['sourceRefs']:
            evidence(ref)
        cp = c['clozePattern']
        if cp:
            require(c['type'] != 'free-recall' and c['cloze'] and not c['front'] and not c['back'] and not c['recallItems'], f'{cid}: mixed cloze and answer fields.')
            spans = list(re.finditer(r'\{\{c([1-9][0-9]*)::([^{}]+)\}\}', c['cloze']))
            remaining = re.sub(r'\{\{c([1-9][0-9]*)::([^{}]+)\}\}', '', c['cloze'])
            require(spans and '{{' not in remaining and '}}' not in remaining, f'{cid}: malformed cloze.')
            require(all('::' not in m[2] and m[2].strip() for m in spans), f'{cid}: use nonempty deletions without hints.')
            nums = indices(c)
            require(nums == list(range(1, len(nums) + 1)), f'{cid}: use consecutive c1..cn indices.')
            if cp == 'single': require(len(nums) == 1, f'{cid}: single needs one index.')
            if cp == 'definition': require(len(spans) == 1, f'{cid}: definition needs one deletion.')
            if cp in ['independent', 'enumerated-list']: require(len(nums) >= 2, f'{cid}: this mechanism needs multiple indices.')
            if cp == 'enumerated-list':
                require(type(c['listOrdered']) is bool, f'{cid}: declare list order.')
                require(str(len(nums)) in remaining or any(w in remaining.lower() for w in ['two','three','four','five','six']), f'{cid}: state list count outside deletions.')
                if not c['listOrdered']: require('any order' in remaining.lower(), f'{cid}: mark unordered list as in any order.')
                if len(nums) > 6: warnings.append(f'{cid}: list exceeds inherited six-item guidance; review its scope.')
            for span in spans:
                if word_count(span[2]) > (25 if cp == 'definition' else 12): warnings.append(f'{cid}: long cloze deletion; inspect recall burden.')
        else:
            require(c['type'] != 'cloze' and c['front'].strip() and not c['cloze'], f'{cid}: missing question or stray cloze text.')
            if c['type'] == 'free-recall':
                require(c['recallItems'] and not c['back'], f'{cid}: blurt answer must come from recallItems.')
                require(re.search(r'\b' + str(len(c['recallItems'])) + r'\b', c['front']), f'{cid}: front must state the checklist count as a numeral.')
                normalized = [re.sub(r'\W+', ' ', i.casefold()).strip() for i in c['recallItems']]
                require(len(set(normalized)) == len(normalized), f'{cid}: duplicate blurt checklist item.')
                if not 3 <= len(normalized) <= 7: warnings.append(f'{cid}: outside inherited 3–7-item blurt guidance; review without padding.')
            else:
                require(c['back'].strip() and not c['recallItems'], f'{cid}: missing answer or stray blurt items.')
            require('{{c' not in c['front'] + c['back'], f'{cid}: cloze syntax without cloze mechanism.')
        if cp != 'enumerated-list': require(c['listOrdered'] is None, f'{cid}: listOrdered is for enumerated lists only.')
        if c['type'] == 'comparison': require(c['axis'].strip(), f'{cid}: name the comparison axis.')
        else: require(not c['axis'], f'{cid}: axis belongs on comparison cards.')
        if c['type'] == 'exemplar':
            require(c['exampleDirection'] and c['examplePairId'], f'{cid}: name example pair and direction.')
            pairs[c['examplePairId']].append(c)
        else:
            require(c['exampleDirection'] is None and not c['examplePairId'], f'{cid}: example direction metadata belongs on exemplar cards.')
        ex = c['example']
        if ex:
            if ex['kind'] == 'source':
                require(ex['source'] is not None, f'{cid}: source example needs evidence.')
                evidence(ex['source'])
            else: require(ex['source'] is None, f'{cid}: illustrative scenario must not claim a source citation.')
        if not c['explanation'].strip() or ex is None:
            require(c['extraOmissionReason'].strip(), f'{cid}: explain any omitted plain-language explanation or concrete example.')
        if c['explanation'].strip() and ex is not None:
            require(not c['extraOmissionReason'], f'{cid}: no omission to explain.')
        if word_count(c['back']) > 45 or any(word_count(i) > 35 for i in c['recallItems']): warnings.append(f'{cid}: long required answer; inspect grading burden.')
        for img in c['frontImages'] + c['extraImages']: evidence(img['source'])
        prompt = c['cloze'] if cp else c['front']
        prompts[re.sub(r'\W+', ' ', prompt.casefold()).strip()] += 1
    require(all(n == 1 for n in prompts.values()), 'Exact repeated question text; inspect whether these are duplicate notes.')
    for pair, values in pairs.items():
        require(len(values) == 2 and {v['exampleDirection'] for v in values} == {'instance-to-concept', 'concept-to-instance'}, f'{pair}: keep one card in each example direction.')
    for t in data['targets']:
        require(len(t['cardIds']) == len(set(t['cardIds'])) and all(i in cards for i in t['cardIds']), f'{t["id"]}: invalid coverage references.')
        own = {c['id'] for c in data['cards'] if t['id'] in c['targetIds']}
        if t['coverage'] == 'tested': require(own and own == set(t['cardIds']), f'{t["id"]}: tested coverage must match its cards.')
        else:
            require(not own and t['reason'].strip(), f'{t["id"]}: explain the coverage gap; do not label tested content untested.')
            if t['coverage'] == 'extra-only': require(t['cardIds'], f'{t["id"]}: name where the supporting explanation is retained.')
            else: require(not t['cardIds'], f'{t["id"]}: missing target cannot claim card coverage.')
        if t['core'] and t['coverage'] != 'tested': warnings.append(f'{t["id"]}: core target is {t["coverage"]}. {t["reason"]}')
    groups = defaultdict(list)
    for c in data['cards']: groups[c['conceptId']].append(c)
    for group in groups.values():
        for c in group[1:]: require(c['reinforcementReason'].strip(), f'{c["id"]}: explain the additional retrieval purpose; useful pairs/blurt overlap are allowed.')
    return warnings

def create_models():
    # Versioned identities avoid overwriting legacy models for this version.
    return [genanki.Model(stable_id('premedos-prompt-v1:' + name + ':' + STYLE_ID), 'premedOS ' + name + ' (prompt v1)', fields=[{'name': f} for f in fields], templates=[{'name': name, 'qfmt': q, 'afmt': a}], css=CSS, model_type=kind) for name, fields, q, a, kind in [('Basic', BASIC_FIELDS, BASIC_Q, BASIC_A, genanki.Model.FRONT_BACK), ('Cloze', CLOZE_FIELDS, CLOZE_Q, CLOZE_A, genanki.Model.CLOZE)]]

def build(data, out, input_dir):
    warnings = validate(data)
    require(out.suffix == '.apkg' and not out.exists(), 'Choose a new .apkg output filename; existing files are never overwritten.')
    require(not out.with_suffix('.build-report.json').exists(), 'Build report already exists; choose a fresh output name.')
    basic, cloze = create_models()
    parts = data['deckName'].split('::')
    decks = [genanki.Deck(stable_id('deck:' + '::'.join(parts[:i])), '::'.join(parts[:i])) for i in range(1, len(parts) + 1)]
    all_media = {}
    manifest = []
    with tempfile.TemporaryDirectory() as temp:
        def render_images(images):
            result = ''
            for image in images:
                path = input_dir / image['file']
                require(path.is_file(), f'Missing figure {image["file"]}.')
                require(path.stat().st_size <= 20 * 1024 * 1024, 'Figure exceeds 20 MiB.')
                raw = path.read_bytes()
                is_png = raw.startswith(b'\x89PNG\r\n\x1a\n')
                is_jpg = raw.startswith(b'\xff\xd8\xff')
                require(is_png or is_jpg, 'Only actual PNG/JPEG figures are supported.')
                digest = hashlib.sha256(raw).hexdigest()
                name = 'premedos-' + digest + ('.png' if is_png else '.jpg')
                staged = Path(temp) / name
                staged.write_bytes(raw); all_media[name] = staged
                result += '<div><img src="' + name + '" alt="' + html.escape(image['alt'], quote=True) + '"></div>'
            return result
        for card in data['cards']:
            mindset, verb = MINDSETS[card['type']]
            label = card['type'].replace('-', ' ')
            if card['type'] == 'exemplar': label = 'example → concept' if card['exampleDirection'] == 'instance-to-concept' else 'concept → example'
            if card['type'] == 'cloze': label = card['clozePattern'].replace('-', ' ')
            typ = '<span class="verb">' + verb + '</span><span class="tname">' + label + '</span>'
            extra = ''
            if card['axis']: extra += '<div class="axis"><b>Compare:</b> ' + escape(card['axis']) + '</div>'
            if card['explanation']: extra += '<div><b>In other words:</b> ' + escape(card['explanation']) + '</div>'
            if card['example']:
                title = 'Example' if card['example']['kind'] == 'source' else 'Illustrative example'
                extra += '<div><b>' + title + ':</b> ' + escape(card['example']['text']) + '</div>'
            extra += render_images(card['extraImages'])
            evidence = card['sourceRefs'] + [im['source'] for im in card['frontImages'] + card['extraImages']]
            if card['example'] and card['example']['source']: evidence += [card['example']['source']]
            details = [typ, 'm-' + mindset, escape(card['conceptId']), escape(json.dumps(evidence, ensure_ascii=False)), SPEC]
            front_images = render_images(card['frontImages'])
            if card['clozePattern']:
                fields = [escape(card['cloze']) + front_images, extra] + details
                model = cloze
            else:
                back = '<ol class="blurt">' + ''.join('<li>' + escape(i) + '</li>' for i in card['recallItems']) + '</ol>' if card['type'] == 'free-recall' else escape(card['back'])
                fields = [escape(card['front']) + front_images, back, extra] + details
                model = basic
            tags = ['premedos::type::' + card['type'], 'premedos::mindset::' + mindset, 'premedos::mechanism::' + (card['clozePattern'] or 'basic'), 'premedos::concept::' + card['conceptId']] + card['tags']
            tags = [re.sub(r'\s+', '_', t) for t in tags]
            guid = genanki.guid_for('premedos-prompt-v1', data['deckKey'], card['id'])
            note = genanki.Note(model=model, fields=fields, tags=tags, guid=guid)
            decks[-1].add_note(note)
            manifest.append({'id':card['id'], 'guid':guid, 'model':model.name, 'fields':dict(zip([f['name'] for f in model.fields], fields)), 'reviewCards':len(indices(card))})
        package = genanki.Package(decks)
        package.media_files = [str(path) for path in all_media.values()]
        staged_out = Path(temp) / 'deck.apkg'
        package.write_to_file(str(staged_out))
        with staged_out.open('rb') as src, out.open('xb') as dst: dst.write(src.read())
    with zipfile.ZipFile(out) as archive:
        require(archive.testzip() is None, 'Package CRC check failed.')
    report = {'spec':SPEC, 'deckName':data['deckName'], 'journalTitle':data['journalTitle'], 'notes':len(manifest), 'reviewCards':sum(n['reviewCards'] for n in manifest), 'media':sorted(all_media), 'targets':data['targets'], 'limitations':data['limitations'], 'warnings':warnings, 'records':manifest, 'apkgSha256':hashlib.sha256(out.read_bytes()).hexdigest()}
    report_path = out.with_suffix('.build-report.json')
    require(not report_path.exists(), 'Build report already exists; choose a fresh output name.')
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({k:report[k] for k in ['notes','reviewCards','media','warnings']}, indent=2))
    return report

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path); parser.add_argument('output', type=Path)
    args = parser.parse_args()
    require(args.input.stat().st_size <= 8 * 1024 * 1024, 'Build input exceeds 8 MiB.')
    build(json.loads(args.input.read_text()), args.output, args.input.resolve().parent)
