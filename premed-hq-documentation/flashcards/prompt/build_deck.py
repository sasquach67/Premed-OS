"""Portable prompt v1: validate JSON, apply fixed templates, build a new or updating Anki package.
Run: python build_deck.py cards.json output.apkg [--previous current.apkg]
No Anki profile is opened. Output must not already exist.
"""
from pathlib import Path
import argparse, hashlib, html, json, re, tempfile, time, zipfile
from collections import Counter, defaultdict
import genanki
from jsonschema import Draft202012Validator
from image_occlusion import native_model, native_occlusion
from pair_rules import declared_pair, validate_pair_rules, valid_headline_pair_allowance, valid_headline_pair_core, validate_pair_group

HERE = Path(__file__).resolve().parent
SCHEMA = json.loads((HERE / 'cards.schema.json').read_text())
CSS = (HERE / 'card-styles.css').read_text()
STYLE_ID = hashlib.sha256(CSS.encode()).hexdigest()[:12]
SPEC = 'journal-flashcards-v1:' + STYLE_ID
LEGACY_BASIC_FIELDS = ['Front', 'Back', 'Extra', 'Type', 'Mindset', 'premedos_concept_id', 'premedos_source', 'premedos_spec']
LEGACY_CLOZE_FIELDS = ['Text', 'Extra', 'Type', 'Mindset', 'premedos_concept_id', 'premedos_source', 'premedos_spec']
NOTE_TYPE_IDS = {'Basic':646888316168, 'Cloze':623388404634}
BASIC_FIELDS = LEGACY_BASIC_FIELDS + ['Topic', 'Source', 'My notes']
CLOZE_FIELDS = LEGACY_CLOZE_FIELDS + ['Topic', 'Source', 'My notes']
TOPIC = '{{#Topic}}<span class="topic-chip">{{Topic}}</span>{{/Topic}}'
TYPE = '<div class="type card-meta">{{Type}}' + TOPIC + '</div>'
FOOTER = '{{#My notes}}<div class="my-notes">{{My notes}}</div>{{/My notes}}'
EXTRA = '{{#Extra}}<div class="extra">{{Extra}}</div>{{/Extra}}'
BASIC_Q = '<div class="pm pm-question {{Mindset}}">' + TYPE + '{{Front}}</div>'
BASIC_A = '<div class="pm {{Mindset}}">' + TYPE + '{{Front}}<hr id="answer"><div class="answer">{{Back}}</div>' + EXTRA + FOOTER + '</div>'
CLOZE_Q = '<div id="pm-list-question" class="pm pm-question {{Mindset}}">' + TYPE + '{{cloze:Text}}</div><script>' + (HERE / 'list-reveal.js').read_text() + '</script>'
CLOZE_A = '<div class="pm {{Mindset}}">' + TYPE + '{{cloze:Text}}' + EXTRA + FOOTER + '</div>'
LABELS = {'basic': 'recall', 'cloze': 'recall', 'process': 'list', 'conceptual': 'why', 'comparison': 'compare', 'exemplar': 'example', 'application': 'application', 'free-recall': 'list', 'image-occlusion':'recall', 'rebuild':'rebuild', 'predict':'predict'}
MINDSETS = {'basic': ('say', 'say it'), 'cloze': ('say', 'say it'), 'process': ('say', 'say it'), 'conceptual': ('explain', 'explain it'), 'comparison': ('connect', 'connect it'), 'exemplar': ('connect', 'connect it'), 'application': ('use', 'use it'), 'free-recall': ('blurt', 'blurt it'), 'image-occlusion':('say','say it'), 'rebuild':('rebuild','rebuild it'), 'predict':('explain','explain it')}

def escape(value):
    # **word** marks a bold cue word; everything else stays plain text.
    escaped = html.escape(value, quote=True).replace('\n', '<br>')
    return re.sub(r'\*\*([^*<>]+?)\*\*', r'<b>\1</b>', escaped)

def breadcrumb_label(card, targets):
    """Resolve a compact label; never silently clip or copy a long objective."""
    raw = card.get('breadcrumb') or next(t['topic'] for t in targets.values() if t['id'] in card['targetIds'])
    require(len(raw) <= 40, f'{card["id"]}: breadcrumb exceeds 40 characters; choose a short notebook topic label.')
    parts = [part.strip() for part in raw.split('›')]
    require(1 <= len(parts) <= 2 and all(parts), f'{card["id"]}: breadcrumb needs one or two nonempty segments.')
    words = re.findall(r"[^\W_]+(?:[-’'][^\W_]+)*", raw, re.UNICODE)
    require(1 <= len(words) <= 4, f'{card["id"]}: breadcrumb needs 1 to 4 words, not an objective sentence.')
    return raw.strip()

def topic_reveals_answer(topic, card):
    """Keep exact titles on the answer without using them as an answer cue.

    Only literal answer phrases are detected. The required cold-read pass still
    handles synonyms or an indirect clue. A per-note marker needs no new fields.
    """
    title = coverage_text(topic)
    answers = ([m[2].split('::')[0] for m in re.finditer(r'\{\{c([1-9][0-9]*)::([^{}]+)\}\}', card['cloze'])]
               if card['clozePattern'] else [card['back']])
    return any(len(coverage_text(answer)) >= 3 and
               f' {coverage_text(answer)} ' in f' {title} ' for answer in answers)

def stable_id(value):
    return 1_000_000_000 + int(hashlib.sha256(value.encode()).hexdigest()[:10], 16)

def indices(card):
    return sorted({int(x) for x in re.findall(r'\{\{c(\d+)::', card['cloze'])}) if card['clozePattern'] else [1]

def require(condition, message):
    if not condition:
        raise ValueError(message)

def word_count(value):
    return len(value.split())

number_words = {2:'two',3:'three',4:'four',5:'five',6:'six',7:'seven',8:'eight',9:'nine',10:'ten'}

WHOLE_QA = ('rebuild', 'predict')
DIRECTION_WORDS = {'increase', 'increases', 'increased', 'decrease', 'decreases', 'decreased', 'raises', 'lowers', 'up', 'down', 'no change', 'unchanged', 'inhibited', 'activated', 'stimulated', 'blocked'}

OUTLINE_STEP = re.compile(r'^(?:definitions?|sources?|examples?|features?|causes?|effects?|types?|overview|summary|critical periods?|dose-response(?: relation)?)$', re.IGNORECASE)
EXAMPLE_STOP = set('that this with from they their them have when what which there about into than then were your will would could should does doing being other another person people someone something child children student students woman women young after before while because'.split())

def example_words(text):
    return {w for w in re.findall(r'[a-z]{4,}', (text or '').casefold()) if w not in EXAMPLE_STOP}

def is_argument_rebuild(card):
    return card['back'].lstrip().casefold().startswith('claim:')

def rebuild_steps(card):
    return ([step.strip() for step in card['back'].split('→')] if '→' in card['back']
            else [line.strip() for line in card['back'].splitlines() if line.strip()])

def is_comparison_rebuild(card):
    return card['front'].lstrip().casefold().startswith('compare ') and '→' not in card['back']

def comparison_axes(row):
    _, sep, values = row.partition(':')
    return [value.strip() for value in values.split(';') if value.strip()] if sep else []

def extra_text(card):
    # Preserve authored content without mandatory prose or decorative labels.
    return '\n'.join(part for part in [card['example']['text'].strip() if card['example'] else '', card['explanation'].strip()] if part)

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

def parallel_meaning_terms(card, targets, term_ids):
    """Count distinct defined terms whose meanings are recalled on this note.

    Inspect every defined target, not only author-linked targets. Lists of names
    and contrast names remain allowed because their meanings are visible, not answers.
    Independent cloze indices and Q&A formatting cannot bypass standalone recall.
    """
    pattern = r'\{\{c([1-9][0-9]*)::([^{}]+)\}\}'
    full = coverage_text(card['front'] + ' ' + (card['cloze'] or card['back']))
    answers = ([coverage_text(m[2].split('::')[0]) for m in re.finditer(pattern, card['cloze'])]
               if card['clozePattern'] else [coverage_text(card['back'])])
    names = set()
    for tid in term_ids:
        name, meaning = map(coverage_text, term_spec(targets[tid]))
        if f' {name} ' in f' {full} ' and any(f' {meaning} ' in f' {answer} ' for answer in answers):
            names.add(name)
    return names

META_WORDING = re.compile(r"\b(?:in (?:the|this) (?:simplified|illustrated|depicted)\b|in this (?:model|network|pathway|lecture|lesson|figure|diagram|example)\b|in the [\w\- ]{1,30}? (?:model|comparison|framework)\b|the (?:lecture|instructor|reading|slide)'s\b|according to the (?:lecture|reading|slides?|instructor|model)\b|as (?:shown|described|presented) (?:in|on) the\b|the class (?:described|said|discussed|used|called|named|gave)\b|\bin class\b|the (?:instructor|lecturer|professor) (?:said|described|gave|used|called)\b|the (?:alternative|other|second|first|opposing|competing) (?:view|theory|approach|idea|perspective|account|model)\b)", re.IGNORECASE)

def card_language_warnings(card):
    warnings = []
    surface = ' '.join(card.get(field) or '' for field in ('front', 'back', 'cloze', 'explanation'))
    if card.get('example'):
        surface += ' ' + card['example'].get('text', '')
    if META_WORDING.search(surface):
        warnings.append(f'{card["id"]}: meta wording describes how the course framed the idea; state the idea itself.')
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
    if card['type'] in ['cloze', 'comparison'] and card['clozePattern'] == 'independent' and len(indices(card)) == 2:
        return True  # two-blank definition or parallel contrast
    if card['type'] == 'cloze' and card['clozePattern'] == 'single' and len(indices(card)) == 1:
        return True  # passing-term or meaning-only note; coverage still checks name and meaning
    front = card['front'].strip()
    return (card['type'] == 'basic' and not card['clozePattern'] and bool(front)
            and not re.search(r'[?!;:\n]', front)
            and (not front.endswith('.') or bool(re.search(r'\b(?:[A-Za-z]\.){2,}$', front)))
            and not re.match(r'^(?:what|why|how|which|when|where|who|whose|is|are|does|do|can|could|should|would|define|describe|explain|compare|give|name|list|recall)\b', front, re.IGNORECASE))

def clarity_warnings(card, targets, notebook_titles=None):
    warnings = []
    linked = [targets[tid] for tid in card['targetIds']]
    if card['clozePattern']:
        pattern = r'\{\{c([1-9][0-9]*)::([^{}]+)\}\}'
        thin = []
        for index in indices(card):
            visible = re.sub(pattern, lambda m: ' ' if int(m[1]) == index else m[2].split('::')[0], card['cloze'])
            words = coverage_text(visible).split()
            if len(words) < 4:
                thin.append(str(index))
        # This is only a cue for human cold-reading, not a semantic concept detector.
        visible_all = coverage_text(re.sub(pattern, ' ', card['cloze']))
        names = [coverage_text(t['statement'].split(':', 1)[1]) for t in linked if t['statement'].casefold().startswith('term:')]
        vague = bool(re.match(r'^(?:it|this|that|these|those|the estimate|with strategies controlled)\b', visible_all))
        if vague and any(f' {name} ' in f' {visible_all} ' for name in names): vague = False
        if thin or vague:
            detail = 'fewer than about 4 visible words for c' + ', c'.join(thin) if thin else 'no explicit concept cue detected'
            warnings.append(f'{card["id"]}: context-poor cloze ({detail}); cold-read the question in isolation.')
    definition = direct_card_candidate(card) or any(t['statement'].casefold().startswith('term:') for t in linked)
    excerpt = ' '.join([ref['excerpt'] for ref in card['sourceRefs']] + [t['statement'] + ' ' + t['reason'] for t in linked])
    if definition and not extra_text(card) and not card['extraImages'] and re.search(r'\bexample\b|\be\.g\.|\bfor instance\b', excerpt, re.IGNORECASE):
        warnings.append(f'{card["id"]}: definition is missing an available example; inspect the linked source/target and add its relevant example to Extra.')
    breadcrumb = breadcrumb_label(card, targets)
    titles = [coverage_text(t['topic']).split() for t in targets.values()]
    titles += [coverage_text(title).split() for title in (notebook_titles or [])]
    if any(not any(set(coverage_text(part).split()) <= set(title) for title in titles) for part in breadcrumb.split('›')):
        warnings.append(f'{card["id"]}: breadcrumb words are not in a notebook title; use a short section/topic name or noun phrase from an actual title.')
    if re.match(r'^(?:study\s+objective|objective\b|(?:recognize|draw|explain|define|describe|list|identify|compare|distinguish|understand|analyze|predict|interpret|demonstrate|outline|evaluate)\b)', breadcrumb, re.IGNORECASE):
        warnings.append(f'{card["id"]}: breadcrumb reads like an objective verb phrase; choose a short topic noun label.')
    return warnings

def names_instructor_emphasis(reason):
    # Detect a named emphasis cue, not whether the course evidence is true.
    return bool(re.search(r'\b(?:objective|review[- ]sheet|guide)\b\s*\S', reason, re.IGNORECASE)
                or re.search(r'\b(?:instructor|professor|teacher|lecturer)\b.{0,120}\b(?:stress\w*|emphasi\w*|repeat\w*|test\w*|exam\w*)\b', reason, re.IGNORECASE)
                or re.search(r'\bsaid\b.{0,120}\b(?:will|would)\s+be\s+tested\b', reason, re.IGNORECASE)
                or re.search(r'\breturned\s+to\b.{1,120}\brepeatedly\b', reason, re.IGNORECASE)
                or re.search(r"\b(?:instructor|professor|teacher|lecturer)(?:['’]s)?\s+(?:own\s+)?example\b|\bexample\s+from\s+the\s+lecture\b", reason, re.IGNORECASE))

def validate(data, updating=False):
    errors = sorted(Draft202012Validator(SCHEMA).iter_errors(data), key=lambda e: str(list(e.path)))
    require(not errors, '\n'.join(f'{list(e.path)}: {e.message}' for e in errors[:10]))
    warnings = []
    reused = [c.get('reuseGuid') for c in data['cards'] if c.get('reuseGuid')]
    require(len(reused) == len(set(reused)), 'Never reuse one GUID for two cards.')
    for key in ['sources', 'targets', 'cards']:
        ids = [r['id'] for r in data[key]]
        require(len(ids) == len(set(ids)), f'Duplicate {key} IDs.')
    # The example pass is required: every instructor example is placed or skipped with a reason.
    inventory = data.get('exampleInventory')
    require(inventory is not None, 'exampleInventory is required: list every instructor example with its location, then its cardIds or a skipReason.')
    require(inventory or (data.get('exampleInventoryNote') or '').strip(), 'An empty exampleInventory needs exampleInventoryNote saying the materials contain no examples.')
    card_ids = {c['id'] for c in data['cards']}
    for n, item in enumerate(inventory, 1):
        require(item['text'].strip() and item['location'].strip(), f'exampleInventory item {n}: text and location are required.')
        require(all(cid in card_ids for cid in item['cardIds']), f'exampleInventory item {n}: unknown cardId.')
        require(item['cardIds'] or item['skipReason'].strip(), f'exampleInventory item {n}: place it on a card or give a skipReason.')
    require(data['deckName'].strip() and (updating or '::' not in data['deckName']), 'Use one standalone deck title without :: nesting.')
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
        breadcrumb_label(c, targets)
        for ref in c['sourceRefs']:
            evidence(ref)
        cp = c['clozePattern']
        if c['type'] == 'rebuild':
            require(not cp, f'{cid}: rebuild uses Basic Q&A, never a cloze mechanism.')
            require(c['conceptId'].endswith('-rebuild'), f'{cid}: rebuild needs its own conceptId ending in -rebuild.')
            require(c['reinforcementReason'].strip(), f'{cid}: rebuild reinforcementReason must name the slide, figure or objective showing the whole structure.')
            steps = rebuild_steps(c)
            if is_comparison_rebuild(c):
                # A table may have two rows when every row still spans two or more axes.
                require(len(steps) >= 2 and all(steps), f'{cid}: comparison rebuild needs at least 2 rows.')
                require(all(len(comparison_axes(step)) >= 2 for step in steps), f'{cid}: each comparison row needs "Item: value; value" with at least 2 axes.')
            else:
                require(len(steps) >= 3 and all(steps), f'{cid}: rebuild needs at least 3 nonempty steps or lines.')
            count = len(steps)
            require(re.search(r'\b' + str(count) + r'\b', c['front']) or re.search(r'\b' + number_words.get(count, str(count)) + r'\b', c['front'], re.IGNORECASE), f'{cid}: rebuild Front count must equal the {count} steps or lines.')
        if c['type'] == 'predict':
            require(not cp, f'{cid}: predict uses Basic Q&A, never a cloze.')
            require(c['conceptId'].endswith('-predict'), f'{cid}: predict needs its own conceptId ending in -predict.')
            require(c['reinforcementReason'].strip(), f'{cid}: predict reinforcementReason must name the slide or Journal block teaching the rule.')
            require(c['front'].count('?') == 1, f'{cid}: predict asks exactly one question.')
            outcome, sep, reason = c['back'].partition(':')
            require(sep and outcome.strip() and reason.strip(), f'{cid}: predict Back is "outcome: reason".')
        if cp:
            require(c['type'] != 'free-recall' and c['cloze'] and not c['front'] and not c['back'] and not c['recallItems'], f'{cid}: mixed cloze and answer fields.')
            spans = list(re.finditer(r'\{\{c([1-9][0-9]*)::([^{}]+)\}\}', c['cloze']))
            if any(span.group(2).split('::')[0].strip().casefold() in DIRECTION_WORDS for span in spans):
                warnings.append(f'{cid}: direction-word blank is answered from the sentence; test the outcome with a predict card instead.')
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
        validate_pair_rules(c, targets)
        pair = declared_pair(c)
        if c['type'] == 'comparison': require(c['axis'].strip(), f'{cid}: name the comparison axis.')
        else: require(not c['axis'] or (pair and cp), f'{cid}: axis belongs on comparison cards or declared cloze pairs.')
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
        if cp == 'enumerated-list' and not ex:
            # A list card's Extra is a key: one short line per item.
            key = [l for l in c['explanation'].split('\n') if l.strip()]
            if len(key) > len(spans) + 1 or any(word_count(l) > 18 for l in key):
                warnings.append(f'{cid}: list key should be one short line per item.')
        else:
            lines = extra.splitlines()
            if len(lines) > 3 or any(word_count(line) > 20 for line in lines):
                warnings.append(f'{cid}: Extra exceeds three short lines (about 20 words each); retain useful example, plain restatement and evidence only.')
        if c['type'] == 'rebuild' and sum(bool(OUTLINE_STEP.match(step)) for step in rebuild_steps(c)) >= 2:
            warnings.append(f'{cid}: rebuild Back is an answer outline; rebuild the content itself.')
        if c['type'] == 'rebuild':
            if is_comparison_rebuild(c) or is_argument_rebuild(c):
                if any(word_count(step) > 12 for step in rebuild_steps(c)):
                    warnings.append(f'{cid}: rebuild step longer than 12 words; inspect names and actions without definitions.')
            elif any(word_count(step) > 4 for step in rebuild_steps(c)):
                warnings.append(f'{cid}: rebuild chain step longer than 4 words; keep steps to names and move actions to Extra.')
        elif c['type'] == 'predict':
            if word_count(c['back'].partition(':')[2]) > 12:
                warnings.append(f'{cid}: predict reason longer than about ten words; keep the card quick.')
        elif word_count(c['back']) > 45 or any(word_count(i) > 35 for i in c['recallItems']): warnings.append(f'{cid}: long required answer; inspect grading burden.')
        warnings.extend(card_language_warnings(c))
        warnings.extend(clarity_warnings(c, targets, data.get('notebookTitles', [])))
        occlusion = c.get('imageOcclusion')
        require(bool(occlusion) == (c['type'] == 'image-occlusion'), f'{cid}: image-occlusion cards require exactly one mask definition.')
        if occlusion:
            require(not cp and not c['frontImages'], f'{cid}: use the occlusion image, without another front image or cloze.')
            x, y, width, height = (occlusion['box'][k] for k in ['x','y','width','height'])
            require(x + width <= 1 and y + height <= 1, f'{cid}: occlusion box falls outside the image.')
            evidence(occlusion['source'])
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
                if card['type'] in WHOLE_QA: continue  # Rebuild and predict never replace a term's meaning card.
                direct = direct_card_candidate(card) or (card['type'] == 'comparison' and not card['clozePattern']) or (card['clozePattern'] == 'enumerated-list' and card['listOrdered'] is True)
                required = coverage_text(card['back'] or card['cloze'])
                visible = coverage_text(card['front'] + ' ' + (card['back'] or card['cloze']))
                if (direct or (not card['clozePattern'] and card['back'].strip())) and f' {name} ' in f' {visible} ' and f' {meaning} ' in f' {required} ':
                    witnesses.append(cid)
            require(witnesses, f'{t["id"]}: named term {term[0]} loses its required meaning; term has no definition-recall card. Extra or a name alone is not direct coverage.')
            recall = []
            for cid in witnesses:
                card = cards[cid]
                answers = [m[2].split('::')[0] for m in re.finditer(r'\{\{c([1-9][0-9]*)::([^{}]+)\}\}', card['cloze'])] if card['clozePattern'] else [card['back']]
                if any(f' {meaning} ' in f' {coverage_text(answer)} ' for answer in answers):
                    recall.append(cid)
            require(recall, f'{t["id"]}: term has no definition-recall card ({term[0]}); put its recorded meaning inside a cloze answer or the Back, not only in visible text, a hint or Extra.')
            for cid in witnesses: term_witnesses[cid].add(t['id'])
    defined_terms = [tid for tid, target in targets.items() if term_spec(target)]
    for cid, card in cards.items():
        if card['type'] in WHOLE_QA: continue
        parallel = parallel_meaning_terms(card, targets, defined_terms)
        require(len(parallel) <= 1,
                f'{cid}: parallel meaning group has {len(parallel)} terms; recall each term meaning alone on separate cards.')
    for topic in {topic_key(t) for t in data['targets']}:
        require(tested_by_topic[topic], f'{topic}: topic needs at least one tested card; do not trim its only card.')
    groups = defaultdict(list)
    for c in data['cards']: groups[c['conceptId']].append(c)
    exceptions = {e['conceptId']: e for e in data['coverageExceptions']}
    require(len(exceptions) == len(data['coverageExceptions']), 'Duplicate coverage exception for an idea.')
    require(all(concept in groups for concept in exceptions), 'Coverage exception names an unknown idea.')
    for concept, group in groups.items():
        if any(c['type'] in WHOLE_QA for c in group):
            require(len(group) == 1, f'{concept}: a rebuild or predict conceptId must contain exactly one card.')
        validate_pair_group(group, targets)
        reviews = sum(len(indices(c)) for c in group)
        exception = exceptions.get(concept)
        pair_allowance = reviews == 4 and valid_headline_pair_allowance(group, targets)
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
            require(reviews <= 3 or pair_allowance, f'{concept}: more than three review cards for one idea; only the exact headline pair set plus instructor example earns four.')
        if not any(c['type'] in WHOLE_QA or direct_card_candidate(c) or len(term_witnesses[c['id']]) >= 2 for c in group):
            warnings.append(f'{concept}: no direct term card detected; inspect this concept.')
        if len(group) >= 2:
            require(group[1]['reinforcementReason'].strip() or exception, f'{group[1]["id"]}: explain the additional retrieval purpose; no automatic mirrors.')
        if reviews == 3 and not valid_headline_pair_core(group, targets) and not any(names_instructor_emphasis(c['reinforcementReason']) for c in group):
            warnings.append(f'{concept}: third review card needs a reinforcementReason naming instructor emphasis.')
        require(sum(c['type'] in ['application', 'exemplar'] for c in group) <= 1, f'{concept}: keep at most one scenario or example card per idea.')
        answers = []
        for c in group:
            # A scenario or example card legitimately answers with the term itself;
            # its retrieval cue (the instructor's situation) is what makes it distinct.
            if c['type'] in ['application', 'exemplar'] and not c['clozePattern']: continue
            if pair_allowance and not declared_pair(c): continue  # The evidenced instructor example has its own cue.
            if c['clozePattern']:
                for index in indices(c):
                    answers.append(' '.join(m[2].split('::')[0] for m in re.finditer(r'\{\{c([1-9][0-9]*)::([^{}]+)\}\}', c['cloze']) if int(m[1]) == index))
            else:
                answers.append(c['back'] or '\n'.join(c['recallItems']))
        normalized_answers = [' '.join(answer.casefold().split()).rstrip('.') for answer in answers]
        require(len(set(normalized_answers)) == len(normalized_answers), f'{concept}: exact repeated required answer; trim redundant review cards.')
    openers = Counter(m[1].casefold() for c in data['cards'] for m in [re.match(r'\s*(In [^,{}]{3,40}),', c['cloze'] or c['front'])] if m)
    for opener, count in openers.items():
        if count >= 5:
            warnings.append(f'{count} cards open with "{opener},"; drop the repeated subject label.')
    scenario_words = {}
    for c in data['cards']:
        if c['type'] in ('application', 'exemplar'):
            scenario_words.setdefault(c['conceptId'], set()).update(example_words(c['front']))
    for c in data['cards']:
        if c['type'] in ('application', 'exemplar') or c['conceptId'] not in scenario_words:
            continue
        own = example_words(c['cloze'] or (c['front'] + ' ' + c['back']))
        extra = example_words(extra_text(c)) - own
        if extra & scenario_words[c['conceptId']]:
            warnings.append(f'{c["id"]}: Extra repeats the example on this idea\'s scenario card; use a different example or none.')
    rebuilds = [c for c in data['cards'] if c['type'] == 'rebuild']
    normalized = [coverage_text(c['back']) for c in rebuilds]
    if len(normalized) != len(set(normalized)):
        warnings.append('Repeated rebuild Backs; review whether these are the same whole structure.')
    if not rebuilds and any(re.search(r'\b(?:pathway|cascade|signaling|sequence|steps|stages|timeline|argument|compare)\b', t['topic'] + ' ' + t['statement'], re.IGNORECASE) for t in data['targets'] if t['kind'] in ['understand', 'be-able-to-do', 'topic']):
        warnings.append('Review cue: an objective names a possible whole recall structure, but this deck has no rebuild cards; inspect whether the lecture presents it whole. Zero rebuild cards is valid.')
    return warnings

def all_models():
    return create_models() + [native_model(CSS)]

def create_models():
    # Final fields are frozen. Retain released IDs for the tested append-only migration.
    # Future field changes require deliberate migration; CSS/template edits never change IDs.
    return [genanki.Model(NOTE_TYPE_IDS[name], 'premedOS ' + name + ' (prompt v1)', fields=[{'name': f} for f in fields], templates=[{'name': name, 'qfmt': q, 'afmt': a}], css=CSS, model_type=kind) for name, fields, q, a, kind in [('Basic', BASIC_FIELDS, BASIC_Q, BASIC_A, genanki.Model.FRONT_BACK), ('Cloze', CLOZE_FIELDS, CLOZE_Q, CLOZE_A, genanki.Model.CLOZE)]]

def build(data, out, input_dir, previous=None):
    warnings = validate(data, updating=previous is not None)
    require(out.suffix == '.apkg' and not out.exists(), 'Choose a new .apkg output filename; existing files are never overwritten.')
    require(not out.with_suffix('.build-report.json').exists(), 'Build report already exists; choose a fresh output name.')
    basic, cloze, io_model = all_models()
    decks = [genanki.Deck(stable_id('deck:' + data['deckName']), data['deckName'])]
    all_media = {}
    manifest = []
    with tempfile.TemporaryDirectory() as temp:
        old = None
        schema_upgraded = False
        old_notes = {}
        reused = {c['reuseGuid'] for c in data['cards'] if c.get('reuseGuid')}
        require(previous is not None or not reused, 'reuseGuid requires --previous with the current attached .apkg.')
        if previous is not None:
            from read_previous import read_previous
            old = read_previous(previous, Path(temp) / 'old-media')
            require(old['deckKey'] is not None, 'Older deck: one-time migration required; export a backup, then replace it with a new deck before using update mode.')
            require((old['deckKey'], old['deckName']) == (data['deckKey'], data['deckName']), 'Update mode must keep the previous deckKey and deckName.')
            models = {m.model_id: m for m in (basic, cloze, io_model)}
            for row in old['notes']:
                model = models.get(row['modelId'])
                require(model and (row['fieldNames'] == [f['name'] for f in model.fields] or (model in (basic, cloze) and row['fieldNames'] == [f['name'] for f in model.fields][:-3])), 'Older or incompatible note type: one-time migration required; never reuse its GUID.')
                if len(row['fieldNames']) < len(model.fields):
                    schema_upgraded = True
                    row['fields'] += [''] * 3
                    row['fieldNames'] = [f['name'] for f in model.fields]
                old_notes[row['guid']] = row
            require(reused <= old_notes.keys(), 'reuseGuid was not found in the attached deck.')
            all_media.update({item['name']: Path(item['path']) for item in old['media']})
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
            topic = breadcrumb_label(card, {t['id']: t for t in data['targets']})
            if topic_reveals_answer(topic, card):
                typ += '<span class="topic-answer-cue" hidden></span>'
            extra = escape(extra_text(card))
            extra += render_images(card['extraImages'])
            evidence = card['sourceRefs'] + [im['source'] for im in card['frontImages'] + card['extraImages']]
            if card.get('imageOcclusion'): evidence += [card['imageOcclusion']['source']]
            if card['example'] and card['example']['source']: evidence += [card['example']['source']]
            details = [typ, 'm-' + mindset, escape(card['conceptId']), escape(json.dumps(evidence, ensure_ascii=False)), json.dumps({'spec':SPEC, 'deckKey':data['deckKey'], 'deckName':data['deckName']}, ensure_ascii=False)]
            front_images = render_images(card['frontImages'])
            if card['clozePattern']:
                fields = [escape(card['cloze']) + front_images, extra] + details
                model = cloze
            else:
                back = '<ol class="blurt">' + ''.join('<li>' + escape(i) + '</li>' for i in card['recallItems']) + '</ol>' if card['type'] == 'free-recall' else escape(card['back'])
                fields = [escape(card['front']) + front_images, back, extra] + details
                model = basic
            topic = breadcrumb_label(card, {t['id']: t for t in data['targets']})
            source = ' · '.join(dict.fromkeys(ref['location'] for ref in card['sourceRefs']))
            fields += [escape(topic), escape(source), '']
            if card['type'] == 'image-occlusion':
                occlusion = card['imageOcclusion']
                box = occlusion['box']
                mask = native_occlusion(box['x'], box['y'], box['width'], box['height'])
                fields = [mask, render_images([occlusion]), escape(card['front']), '<div class="answer">' + escape(card['back']) + '</div>' + extra, '', escape(topic), escape(source), '', details[2], details[3], details[4]]
                model = io_model
            tags = ['premedos::type::' + card['type'], 'premedos::mindset::' + mindset, 'premedos::mechanism::' + (card['clozePattern'] or 'basic'), 'premedos::concept::' + card['conceptId']] + card['tags']
            tags = [re.sub(r'\s+', '_', t) for t in tags]
            require('premedos::retired' not in tags, 'Active cards must not carry the reserved retired tag.')
            guid = card.get('reuseGuid') or genanki.guid_for('premedos-prompt-v1', data['deckKey'], card['id'])
            if guid in old_notes:
                require(card.get('reuseGuid'), 'A new card collides with an old GUID; use a new card id or explicitly reuse the same retrieval demand.')
                prior = old_notes[guid]
                fields[[f['name'] for f in model.fields].index('My notes')] = prior['fields'][prior['fieldNames'].index('My notes')]
                tags = list(dict.fromkeys(tags + [t for t in prior['tags'] if t != 'premedos::retired' and not t.startswith(('objective::', 'premedos::type::', 'premedos::mindset::', 'premedos::mechanism::', 'premedos::concept::', 'exam::'))]))
                require(prior['modelId'] == model.model_id and prior['ords'] == [i - 1 for i in indices(card)], 'Reused note must keep its note type and cloze numbers; changed retrieval demands need a new note and retire the old one.')
            require(guid not in {row['guid'] for row in manifest}, 'Duplicate generated or reused note GUID.')
            note = genanki.Note(model=model, fields=fields, tags=tags, guid=guid)
            decks[-1].add_note(note)
            named = dict(zip([f['name'] for f in model.fields], fields))
            unchanged = guid in old_notes and all(named.get(k) == dict(zip(old_notes[guid]['fieldNames'], old_notes[guid]['fields'])).get(k) for k in ('Front', 'Back', 'Extra', 'Text'))
            manifest.append({'id':card['id'], 'guid':guid, 'model':model.name, 'fields':named, 'reviewCards':len(indices(card)), 'status':'updated' if guid in old_notes else 'new', 'unchanged':unchanged})
        for guid, prior in old_notes.items():
            if guid in reused: continue
            model = next(m for m in (basic, cloze, io_model) if m.model_id == prior['modelId'])
            tags = list(dict.fromkeys(prior['tags'] + ['premedos::retired']))
            note = genanki.Note(model=model, fields=prior['fields'], tags=tags, guid=guid)
            require(sorted(c.ord for c in note.cards) == prior['ords'], 'Retired note has unsupported card ordinals; stop rather than alter its review identities.')
            decks[-1].add_note(note)
            manifest.append({'id':'retired:' + guid, 'guid':guid, 'model':model.name, 'fields':dict(zip(prior['fieldNames'], prior['fields'])), 'reviewCards':len(prior['ords']), 'status':'retired'})
        package = genanki.Package(decks)
        package.media_files = [str(path) for path in all_media.values()]
        staged_out = Path(temp) / 'deck.apkg'
        # Schema merging bumps local note mtimes to import time. A source-version
        # timestamp avoids choosing that same clock tick (Always permits older notes).
        # Same-schema updates advance beyond the attached version as before.
        timestamp = (max(r['mod'] for r in old['notes']) + 2 if schema_upgraded else max([time.time()] + ([r['mod'] + 1 for r in old['notes']] + [m['mod'] + 1 for m in old['models']] if old else [])))
        package.write_to_file(str(staged_out), timestamp=timestamp)
        with zipfile.ZipFile(staged_out, 'a') as archive:
            archive.writestr('premedos-update.json', json.dumps({'version':1, 'deckKey':data['deckKey'], 'deckName':data['deckName']}))
        with staged_out.open('rb') as src, out.open('xb') as dst: dst.write(src.read())
    with zipfile.ZipFile(out) as archive:
        require(archive.testzip() is None, 'Package CRC check failed.')
    concept_reviews = Counter()
    for card in data['cards']: concept_reviews[card['conceptId']] += len(indices(card))
    report = {'mode':'update' if previous is not None else 'new', 'activeNotes':len(data['cards']), 'activeReviewCards':sum(len(indices(c)) for c in data['cards']), 'newNotes':sum(n['status'] == 'new' for n in manifest), 'updatedNotes':sum(n['status'] == 'updated' for n in manifest), 'retiredNotes':sum(n['status'] == 'retired' for n in manifest), 'spec':SPEC, 'deckName':data['deckName'], 'journalTitle':data['journalTitle'], 'notes':len(manifest), 'reviewCards':sum(n['reviewCards'] for n in manifest), 'conceptReviewCards':dict(concept_reviews), 'reusedNotes':{'changed':sum(n['status'] == 'updated' and not n.get('unchanged') for n in manifest), 'unchanged':sum(bool(n.get('unchanged')) for n in manifest), 'unchangedIds':[n['id'] for n in manifest if n.get('unchanged')]}, 'exampleInventory':{'total':len(data['exampleInventory']), 'placed':sum(bool(i['cardIds']) for i in data['exampleInventory']), 'skipped':[{'text':i['text'], 'skipReason':i['skipReason']} for i in data['exampleInventory'] if not i['cardIds']]}, 'predictCards':{'count':sum(c['type'] == 'predict' for c in data['cards']), 'questions':[{'id':c['id'], 'question':c['front']} for c in data['cards'] if c['type'] == 'predict']}, 'rebuildCards':{'count':sum(c['type'] == 'rebuild' for c in data['cards']), 'structures':[{'id':c['id'], 'conceptId':c['conceptId'], 'structure':c['front']} for c in data['cards'] if c['type'] == 'rebuild']}, 'media':sorted(all_media), 'targets':data['targets'], 'coverageExceptions':data['coverageExceptions'], 'limitations':data['limitations'], 'warnings':warnings, 'records':manifest, 'apkgSha256':hashlib.sha256(out.read_bytes()).hexdigest()}
    report_path = out.with_suffix('.build-report.json')
    require(not report_path.exists(), 'Build report already exists; choose a fresh output name.')
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({k:report[k] for k in ['notes','reviewCards','media','warnings']}, indent=2))
    return report

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path); parser.add_argument('output', type=Path)
    parser.add_argument('--previous', type=Path, help='Current attached .apkg for GUID-preserving updates.')
    args = parser.parse_args()
    require(args.input.stat().st_size <= 8 * 1024 * 1024, 'Build input exceeds 8 MiB.')
    build(json.loads(args.input.read_text()), args.output, args.input.resolve().parent, args.previous)
