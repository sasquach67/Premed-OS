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
EXTRA = '{{#Extra}}<div class="extra">{{Extra}}</div>{{/Extra}}'
BASIC_Q = '<div class="pm {{Mindset}}">' + TYPE + '{{Front}}</div>'
BASIC_A = '<div class="pm {{Mindset}}">' + TYPE + '{{Front}}<hr id="answer"><div class="answer">{{Back}}</div>' + EXTRA + '</div>'
CLOZE_Q = '<div class="pm {{Mindset}}">' + TYPE + '{{cloze:Text}}</div>'
CLOZE_A = '<div class="pm {{Mindset}}">' + TYPE + '{{cloze:Text}}' + EXTRA + '</div>'
LABELS = {'basic': 'recall', 'cloze': 'recall', 'process': 'list', 'conceptual': 'why', 'comparison': 'compare', 'exemplar': 'example', 'application': 'application', 'free-recall': 'list'}
MINDSETS = {'basic': ('say', 'say it'), 'cloze': ('say', 'say it'), 'process': ('say', 'say it'), 'conceptual': ('explain', 'explain it'), 'comparison': ('connect', 'connect it'), 'exemplar': ('connect', 'connect it'), 'application': ('use', 'use it'), 'free-recall': ('blurt', 'blurt it')}

def escape(value):
    # **word** marks a bold cue word; everything else stays plain text.
    escaped = html.escape(value, quote=True).replace('\n', '<br>')
    return re.sub(r'\*\*([^*<>]+?)\*\*', r'<b>\1</b>', escaped)

def stable_id(value):
    return 1_000_000_000 + int(hashlib.sha256(value.encode()).hexdigest()[:10], 16)

def indices(card):
    return sorted({int(x) for x in re.findall(r'\{\{c(\d+)::', card['cloze'])}) if card['clozePattern'] else [1]

def require(condition, message):
    if not condition:
        raise ValueError(message)

def word_count(value):
    return len(value.split())

def extra_text(card):
    # Preserve authored content without mandatory prose or decorative labels.
    return ' '.join(part for part in [card['explanation'].strip(), card['example']['text'].strip() if card['example'] else ''] if part)

def topic_key(target):
    return ' '.join(target['topic'].casefold().split())

def coverage_text(text):
    # Compare declared literal meaning witnesses, not semantic equivalence.
    text = re.sub(r'\{\{c\d+::([^{}]+)\}\}', lambda m: m[1].split('::')[0], text)
    return ' '.join(re.sub(r'[^\w]+', ' ', text.casefold()).split())

def term_spec(target):
    if not target['statement'].strip().casefold().startswith('term:'):
        return None
    term = target['statement'].split(':', 1)[1].strip()
    require(target['kind'] == 'understand' and term, f'{target["id"]}: named-term coverage must be an Understand target with a term.')
    require(target['reason'].strip().casefold().startswith('meaning:'), f'{target["id"]}: record Meaning: with the required meaning phrase.')
    meaning = target['reason'].split(':', 1)[1].strip()
    require(meaning, f'{target["id"]}: the term needs its meaning, not just its name.')
    return term, meaning

def card_language_warnings(card):
    warnings = []
    back = card['back'] or card['cloze']
    if card['type'] in ['application', 'exemplar'] and re.search(r'\b(?:nothing (?:can be|is) concluded|(?:it is |origin[ :]+)?unresolved|not established|cannot be concluded|does not (?:establish|identify)|neither .{0,100} established)\b', back, re.IGNORECASE):
        warnings.append(f'{card["id"]}: scenario answer is a non-conclusion; test a concrete term, named choice or short cause.')
    if direct_card_candidate(card) and re.search(r'\b(?:without establishing|which cannot be|without necessarily|while competing material|so .{0,80}(?:cannot establish|inaccurate memory))\b', back, re.IGNORECASE):
        warnings.append(f'{card["id"]}: definition has a hedge tail; keep the meaning and remove the untested caution.')
    if re.search(r'\b(?:This refers to|It is the process by which|verbal or semantic and visual representations|within limits of capacity, processing efficiency)\b', back, re.IGNORECASE):
        warnings.append(f'{card["id"]}: review Back with the plain-words friend test; avoid stock filler or compressed abstractions (exact course terms may be needed under an emphasis).')
    return warnings

def direct_card_candidate(card):
    # No direct-card flag or canonical term exists in v1; this is advisory only.
    if card['clozePattern'] == 'independent' and card['type'] == 'cloze' and len(indices(card)) == 2:
        return True  # two-blank term or theory note: c1 term, c2 meaning
    front = card['front'].strip()
    return (card['type'] == 'basic' and not card['clozePattern'] and bool(front)
            and not re.search(r'[?!;:\n]', front)
            and (not front.endswith('.') or bool(re.search(r'\b(?:[A-Za-z]\.){2,}$', front)))
            and not re.match(r'^(?:what|why|how|which|when|where|who|whose|is|are|does|do|can|could|should|would|define|describe|explain|compare|give|name|list|recall)\b', front, re.IGNORECASE))

def names_instructor_emphasis(reason):
    # Detect a named emphasis cue, not whether the course evidence is true.
    return bool(re.search(r'\b(?:objective|review[- ]sheet|guide)\b\s*\S', reason, re.IGNORECASE)
                or re.search(r'\b(?:instructor|professor|teacher|lecturer)\b.{0,120}\b(?:stress\w*|emphasi\w*|repeat\w*|test\w*|exam\w*)\b', reason, re.IGNORECASE)
                or re.search(r'\bsaid\b.{0,120}\b(?:will|would)\s+be\s+tested\b', reason, re.IGNORECASE)
                or re.search(r'\breturned\s+to\b.{1,120}\brepeatedly\b', reason, re.IGNORECASE)
                or re.search(r"\b(?:instructor|professor|teacher|lecturer)(?:['’]s)?\s+(?:own\s+)?example\b|\bexample\s+from\s+the\s+lecture\b", reason, re.IGNORECASE))

def validate(data):
    errors = sorted(Draft202012Validator(SCHEMA).iter_errors(data), key=lambda e: str(list(e.path)))
    require(not errors, '\n'.join(f'{list(e.path)}: {e.message}' for e in errors[:10]))
    warnings = []
    for key in ['sources', 'targets', 'cards']:
        ids = [r['id'] for r in data[key]]
        require(len(ids) == len(set(ids)), f'Duplicate {key} IDs.')
    require(data['deckName'].strip() and '::' not in data['deckName'], 'Use one standalone deck title without :: nesting.')
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
            require(all(len(m[2].split('::')) <= 2 and all(part.strip() for part in m[2].split('::')) for m in spans), f'{cid}: use a nonempty answer and at most one nonempty hint.')
            nums = indices(c)
            require(nums == list(range(1, len(nums) + 1)), f'{cid}: use consecutive c1..cn indices.')
            if cp == 'single': require(len(nums) == 1, f'{cid}: single needs one index.')
            if cp == 'definition': require(len(spans) == 1, f'{cid}: definition needs one deletion.')
            if cp == 'independent': require(len(nums) >= 2, f'{cid}: this mechanism needs multiple indices.')
            if cp == 'enumerated-list':
                require(nums == [1], f'{cid}: blank list items together with c1.')
                require(type(c['listOrdered']) is bool, f'{cid}: declare list order.')
                number_words = {2:'two',3:'three',4:'four',5:'five',6:'six',7:'seven',8:'eight',9:'nine',10:'ten'}
                if len(spans) > 1:
                    count = len(spans)
                    require(re.search(r'\b' + str(count) + r'\b', remaining) or re.search(r'\b' + number_words.get(count, str(count)) + r'\b', remaining, re.IGNORECASE), f'{cid}: state list count outside deletions.')
                else:
                    require(re.search(r'\b(?:[2-9]|[1-9][0-9]+)\b', remaining) or any(re.search(r'\b' + word + r'\b', remaining, re.IGNORECASE) for word in number_words.values()), f'{cid}: state list count outside deletions.')
                if not c['listOrdered']: require('any order' in remaining.lower(), f'{cid}: mark unordered list as in any order.')
            if any('**' in m[2] for m in spans): warnings.append(f'{cid}: bold belongs on cue words outside the blank, never inside it.')
            for span in spans:
                if word_count(span[2].split('::')[0]) > (25 if cp == 'definition' else 12): warnings.append(f'{cid}: long cloze deletion; inspect recall burden.')
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
            require(c['exampleDirection'], f'{cid}: declare example direction; a partner is optional.')
            if c['examplePairId']: pairs[c['examplePairId']].append(c)
        else:
            require(c['exampleDirection'] is None and not c['examplePairId'], f'{cid}: example direction metadata belongs on exemplar cards.')
        ex = c['example']
        if ex:
            if ex['kind'] == 'source':
                require(ex['source'] is not None, f'{cid}: source example needs evidence.')
                evidence(ex['source'])
            else: require(ex['source'] is None, f'{cid}: illustrative scenario must not claim a source citation.')
        extra = extra_text(c)
        if word_count(extra) > 20 or '\n' in c['explanation'] or (ex is not None and '\n' in ex['text']) or (c['explanation'].strip() and ex is not None):
            warnings.append(f'{cid}: Extra exceeds one short line (about 20 words); choose the single most useful detail.')
        if word_count(c['back']) > 45 or any(word_count(i) > 35 for i in c['recallItems']): warnings.append(f'{cid}: long required answer; inspect grading burden.')
        warnings.extend(card_language_warnings(c))
        for img in c['frontImages'] + c['extraImages']: evidence(img['source'])
        prompt = c['cloze'] if cp else c['front']
        prompts[re.sub(r'\W+', ' ', prompt.casefold()).strip()] += 1
    require(all(n == 1 for n in prompts.values()), 'Exact repeated question text; inspect whether these are duplicate notes.')
    for pair, values in pairs.items():
        require(len(values) <= 2 and len({v['exampleDirection'] for v in values}) == len(values), f'{pair}: paired examples must use distinct directions; a partner is optional.')
    tested_by_target = {}
    tested_by_topic = defaultdict(set)
    term_witnesses = defaultdict(set)
    for t in data['targets']:
        require(topic_key(t), f'{t["id"]}: name a topic.')
        require(len(t['cardIds']) == len(set(t['cardIds'])) and all(i in cards for i in t['cardIds']), f'{t["id"]}: invalid coverage references.')
        own = {c['id'] for c in data['cards'] if t['id'] in c['targetIds']}
        term = term_spec(t)
        if t['coverage'] == 'tested':
            require(own and own == set(t['cardIds']), f'{t["id"]}: tested coverage must match its cards.')
            tested_by_target[t['id']] = own
            tested_by_topic[topic_key(t)].update(own)
        else:
            require(not own and t['reason'].strip(), f'{t["id"]}: explain the coverage gap; do not label tested content untested.')
            if t['coverage'] == 'extra-only':
                require(t['cardIds'], f'{t["id"]}: name where the supporting explanation is retained.')
                require(all(extra_text(cards[i]) for i in t['cardIds']), f'{t["id"]}: extra-only caution coverage needs a nonempty Extra line on its linked cards.')
            else: require(not t['cardIds'], f'{t["id"]}: missing target cannot claim card coverage.')
        if t['kind'] in ['understand', 'topic']:
            require(t['coverage'] == 'tested', f'{t["id"]}: {t["kind"]} target needs a tested card; coverage wins over the card limit.')
        elif t['kind'] == 'be-able-to-do' and t['coverage'] != 'tested':
            require(re.search(r'\b(?:hedge-only|limit-only|untested caution)\b', t['reason'], re.IGNORECASE), f'{t["id"]}: only an explicitly recorded hedge-only skill may be omitted; retain genuine tested skills.')
        elif t['core'] and t['coverage'] == 'missing': warnings.append(f'{t["id"]}: core target is missing. {t["reason"]}')
        if term:
            name, meaning = map(coverage_text, term)
            require(name and meaning, f'{t["id"]}: record nonempty term and meaning words.')
            witnesses = []
            for cid in own:
                card = cards[cid]
                direct = direct_card_candidate(card) or (card['type'] == 'comparison' and not card['clozePattern']) or (card['clozePattern'] == 'enumerated-list' and card['listOrdered'] is True)
                required = coverage_text(card['back'] or card['cloze'])
                visible = coverage_text(card['front'] + ' ' + (card['back'] or card['cloze']))
                if direct and f' {name} ' in f' {visible} ' and f' {meaning} ' in f' {required} ':
                    witnesses.append(cid)
            require(witnesses, f'{t["id"]}: named term {term[0]} loses its required meaning; Extra or a name alone is not direct coverage.')
            for cid in witnesses: term_witnesses[cid].add(t['id'])
    for cid, terms in term_witnesses.items():
        if len(terms) > 4:
            warnings.append(f'{cid}: combined group has {len(terms)} terms; keep related groups to 2 to 4 without losing meanings.')
    for topic in {topic_key(t) for t in data['targets']}:
        require(tested_by_topic[topic], f'{topic}: topic needs at least one tested card; do not trim its only card.')
    groups = defaultdict(list)
    for c in data['cards']: groups[c['conceptId']].append(c)
    exceptions = {e['conceptId']: e for e in data['coverageExceptions']}
    require(len(exceptions) == len(data['coverageExceptions']), 'Duplicate coverage exception for an idea.')
    require(all(concept in groups for concept in exceptions), 'Coverage exception names an unknown idea.')
    for concept, group in groups.items():
        reviews = sum(len(indices(c)) for c in group)
        exception = exceptions.get(concept)
        if exception:
            require(reviews > 3, f'{concept}: no over-limit coverage exception is needed.')
            require(exception['reason'].strip(), f'{concept}: explain the coverage exception.')
            witnesses = exception['targetIds']
            require(len(witnesses) == len(group) and all(t in targets for t in witnesses), f'{concept}: name one sole-coverage target witness per indispensable note.')
            witnessed_cards = set()
            for tid in witnesses:
                t = targets[tid]
                require(t['coverage'] == 'tested', f'{concept}: exception witness must be a tested target.')
                own = tested_by_target[tid]
                require(len(own) == 1, f'{concept}: exception witness is not sole coverage.')
                require(t['kind'] in ['understand', 'topic'] or tested_by_topic[topic_key(t)] == own, f'{concept}: exception witness must retain required coverage or a topic\'s only tested card.')
                witnessed_cards.update(own)
            require(witnessed_cards == {c['id'] for c in group} and all(len(indices(c)) == 1 for c in group), f'{concept}: coverage exception only permits indispensable single-review notes, not surplus cloze indices.')
            warnings.append(f'{concept}: coverage exception keeps {reviews} review cards. {exception["reason"]}')
        else:
            require(reviews <= 3, f'{concept}: more than three review cards for one idea.')
        if not any(direct_card_candidate(c) or len(term_witnesses[c['id']]) >= 2 for c in group):
            warnings.append(f'{concept}: no direct term card detected; inspect this concept.')
        if len(group) >= 2:
            require(group[1]['reinforcementReason'].strip() or exception, f'{group[1]["id"]}: explain the additional retrieval purpose; no automatic mirrors.')
        if reviews == 3 and not any(names_instructor_emphasis(c['reinforcementReason']) for c in group):
            warnings.append(f'{concept}: third review card needs a reinforcementReason naming instructor emphasis.')
        require(sum(c['type'] in ['application', 'exemplar'] for c in group) <= 1, f'{concept}: keep at most one scenario or example card per idea.')
        answers = []
        for c in group:
            # A scenario or example card legitimately answers with the term itself;
            # its retrieval cue (the instructor's situation) is what makes it distinct.
            if c['type'] in ['application', 'exemplar'] and not c['clozePattern']: continue
            if c['clozePattern']:
                for index in indices(c):
                    answers.append(' '.join(m[2].split('::')[0] for m in re.finditer(r'\{\{c([1-9][0-9]*)::([^{}]+)\}\}', c['cloze']) if int(m[1]) == index))
            else:
                answers.append(c['back'] or '\n'.join(c['recallItems']))
        normalized_answers = [' '.join(answer.casefold().split()).rstrip('.') for answer in answers]
        require(len(set(normalized_answers)) == len(normalized_answers), f'{concept}: exact repeated required answer; trim redundant review cards.')
    return warnings

def create_models():
    # Versioned identities avoid overwriting legacy models for this version.
    return [genanki.Model(stable_id('premedos-prompt-v1:' + name + ':' + STYLE_ID), 'premedOS ' + name + ' (prompt v1)', fields=[{'name': f} for f in fields], templates=[{'name': name, 'qfmt': q, 'afmt': a}], css=CSS, model_type=kind) for name, fields, q, a, kind in [('Basic', BASIC_FIELDS, BASIC_Q, BASIC_A, genanki.Model.FRONT_BACK), ('Cloze', CLOZE_FIELDS, CLOZE_Q, CLOZE_A, genanki.Model.CLOZE)]]

def build(data, out, input_dir):
    warnings = validate(data)
    require(out.suffix == '.apkg' and not out.exists(), 'Choose a new .apkg output filename; existing files are never overwritten.')
    require(not out.with_suffix('.build-report.json').exists(), 'Build report already exists; choose a fresh output name.')
    basic, cloze = create_models()
    decks = [genanki.Deck(stable_id('deck:' + data['deckName']), data['deckName'])]
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
            mindset, _ = MINDSETS[card['type']]
            label = LABELS[card['type']]
            if card['clozePattern'] == 'enumerated-list': label = 'list'
            typ = '<span class="verb">' + label + '</span>'
            extra = escape(extra_text(card))
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
    concept_reviews = Counter()
    for card in data['cards']: concept_reviews[card['conceptId']] += len(indices(card))
    report = {'spec':SPEC, 'deckName':data['deckName'], 'journalTitle':data['journalTitle'], 'notes':len(manifest), 'reviewCards':sum(n['reviewCards'] for n in manifest), 'conceptReviewCards':dict(concept_reviews), 'media':sorted(all_media), 'targets':data['targets'], 'coverageExceptions':data['coverageExceptions'], 'limitations':data['limitations'], 'warnings':warnings, 'records':manifest, 'apkgSha256':hashlib.sha256(out.read_bytes()).hexdigest()}
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
