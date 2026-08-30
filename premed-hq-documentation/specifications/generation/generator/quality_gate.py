"""Deterministic quality checks — 08 §2.1 plus the additions in 04 §12.1 (2nd revision)."""
import re, sys, difflib
from collections import Counter, defaultdict
from deck_cards import CARDS

BANNED = ["what is the primary function of", "what is the significance of",
          "explain the role of", "describe the process by which",
          "what are the key characteristics of"]
VAGUE = [r"^what do you know about", r"^describe\s+\w+\??$", r"what is its", r"^explain\s+\w+\??$"]
# 04 §2.7 — context self-sufficiency
UNANCHORED_CHANGE = [r"how (has|have|did) .* chang", r"what replaced", r"what is the modern view",
                     r"how did .* evolve", r"what changed about"]
UNANCHORED_COMPARE = [r"how does .* differ", r"what makes .* different", r"how do they differ"]
ORPHAN_ARTICLE = [r"\bthe (debate|takeaway|example|point|distinction|contrast)\b"]
LECTURE_DEIXIS = [r"what did she say", r"what was her point", r"according to this course",
                  r"what did the (lecture|professor) say"]
STOPWORDS = set("a an the of to in is are was were and or but it its this these that for on at by with as".split())
DEICTIC = re.compile(r"\b(it|its|this|these|next)\b", re.I)

findings = []
def add(sev, cid, check, msg): findings.append((sev, cid, check, msg))
def words(s): return re.findall(r"[\w'’-]+", s)
def spans(cz): return re.findall(r"\{\{c(\d+)::(.*?)\}\}", cz)

RELATIONAL = {'COMPARISON', 'EXEMPLAR'}

for i, c in enumerate(CARDS):
    tag = f"#{i+1} {c['cid']}"
    cp, cz = c.get('cp'), c.get('cz')
    f, b, ct = c.get('f', ''), c.get('b', ''), c['ct']

    # ── salience (§2.5) ─────────────────────────────────────────────────
    if c.get('sal') not in ('load-bearing', 'attaching'):
        add('BLOCK', tag, '§2.5 salience', f'invalid or missing salience {c.get("sal")!r}')

    # ── field discipline ────────────────────────────────────────────────
    if ct == 'FREE_RECALL':
        items = c.get('items') or []
        if not f: add('BLOCK', tag, 'field-discipline', 'FREE_RECALL missing front')
        if b: add('BLOCK', tag, 'field-discipline', 'FREE_RECALL must build back from items')
        n = c.get('n')
        if n is None: add('BLOCK', tag, 'FC-FR-1', 'no hit-count declared')
        elif not re.search(rf"\b{n}\b", f):
            add('BLOCK', tag, 'FC-FR-1', f'front does not state the count {n}')
        if n is not None and n != len(items):
            add('BLOCK', tag, 'FC-FR-7', f'stated {n}, back has {len(items)}')
        if not (3 <= len(items) <= 7):
            add('BLOCK', tag, 'FC-FR-2', f'{len(items)} items, must be 3–7')
        for it in items:
            if len(words(it)) < 3:
                add('BLOCK', tag, 'FC-FR-3', f'item not independently gradeable: {it!r}')
    elif cp:
        if f or b: add('BLOCK', tag, 'field-discipline', 'cloze card has non-empty front/back')
        if not cz: add('BLOCK', tag, 'field-discipline', 'clozePattern without clozeText')
    else:
        if not (f and b): add('BLOCK', tag, 'field-discipline', 'missing front or back')
        if cz: add('BLOCK', tag, 'field-discipline', 'non-cloze card carries clozeText')

    if not c.get('src'): add('BLOCK', tag, 'source-attribution', 'missing sourceReference')
    if ct == 'COMPARISON' and not c.get('ax'):
        add('BLOCK', tag, 'FC-19c', 'COMPARISON with no named axis of contrast')
    if ct == 'EXEMPLAR' and c.get('dir') not in ('instance-to-concept', 'concept-to-instance'):
        add('BLOCK', tag, 'FC-20', 'EXEMPLAR with no declared direction')

    # ── cloze mechanics ─────────────────────────────────────────────────
    if cp:
        sp = spans(cz)
        idxs = sorted({int(n) for n, _ in sp})
        if cp == 'definition':
            if len(idxs) != 1: add('BLOCK', tag, 'FC-D2', f'definition cloze split into {len(idxs)}')
            for _, txt in sp:
                if len(words(txt)) > 25:
                    add('ADVIS', tag, 'FC-D1', f'definition deletion {len(words(txt))} words')
            # FC-D3: the stem must NAME the term. "Introspection is ___" is a
            # legitimate two-word stem, so test for a content word, not a length.
            stem = re.sub(r"\{\{c\d+::.*?\}\}", "", cz)
            if not [w for w in words(stem) if w.lower() not in STOPWORDS]:
                add('BLOCK', tag, 'FC-D3', 'stem contains no term to cue from')
        if cp == 'single' and len(idxs) != 1:
            add('BLOCK', tag, 'cloze-single', f'{len(idxs)} indices')
        if cp == 'independent' and len(idxs) < 2:
            add('BLOCK', tag, 'cloze-independent', 'fewer than 2 indices')
        if cp == 'enumerated-list':
            if not (2 <= len(idxs) <= 6): add('BLOCK', tag, 'FC-L1', f'{len(idxs)} items')
            if idxs != list(range(1, len(idxs) + 1)): add('BLOCK', tag, 'list-indices', str(idxs))
            if 'lo' not in c: add('BLOCK', tag, 'FC-L3/L4', 'listOrdered undeclared')
            if c.get('lo') is False and 'any order' not in cz.lower():
                add('BLOCK', tag, 'FC-L4', 'unordered set not marked "in any order"')
            nums = "one two three four five six 2 3 4 5 6".split()
            stem = re.sub(r"\{\{c\d+::.*?\}\}", "", cz).lower()
            if not any(re.search(rf"\b{n}\b", stem) for n in nums):
                add('BLOCK', tag, 'FC-L2', 'cardinality not stated')
            for _, txt in sp:
                if txt.strip().lower() in nums:
                    add('BLOCK', tag, 'FC-L2', 'cardinality is a deletion target')
        if cp != 'definition':
            for n, txt in sp:
                w = words(txt)
                if len(w) > 12: add('BLOCK', tag, 'cloze-region-size', f'{len(w)} words')
                if len(w) == 1 and w[0].lower() in STOPWORDS:
                    add('BLOCK', tag, 'cloze-stopword', w[0])
                if re.search(r"\b(a|an)\s+\{\{c" + n + "::", cz):
                    add('BLOCK', tag, 'cloze-giveaway', 'preceded by a/an')
        # FC-21 — term-deletion cloze needs justification
        if cp in ('single', 'independent') and not c.get('tj'):
            for _, txt in sp:
                if len(words(txt)) <= 3 and txt[:1].isupper() is False and cp == 'single':
                    add('MODEL', tag, 'FC-21', f'possible term-deletion, no justification: {txt!r}')
        # FC-25 — stem bloat is the MileDown failure mode (§1.2): a long stem
        # around a tiny deletion means the sentence is doing the retrieval.
        if cp != 'definition':
            stem_len = len(words(re.sub(r"\{\{c\d+::.*?\}\}", "", cz)))
            for _, txt in spans(cz):
                if len(words(txt)) <= 2 and stem_len > 25:
                    add('MODEL', tag, 'FC-25 stem-bloat',
                        f'{stem_len}-word stem around a {len(words(txt))}-word deletion')
        # the 6-word context floor does not apply to definition clozes: a short
        # stem is the pattern, not a defect (FC-D3 governs instead)
        if cp != 'definition':
            rem = words(re.sub(r"\{\{c\d+::.*?\}\}", "", cz))
            if len(rem) < 6: add('ADVIS', tag, 'cloze-context', f'{len(rem)} words of context')
    else:
        lf = f.lower()
        for p in BANNED:
            if p in lf: add('ADVIS', tag, 'FC-17', f'"{p}"')
        for p in VAGUE:
            if re.search(p, lf) and ct != 'FREE_RECALL': add('BLOCK', tag, 'vague-prompt', p)
        for p in UNANCHORED_CHANGE:
            if re.search(p, lf): add('BLOCK', tag, 'FC-22 unanchored-change', p)
        for p in UNANCHORED_COMPARE:
            if re.search(p, lf): add('BLOCK', tag, 'FC-22 unanchored-comparison', p)
        for p in ORPHAN_ARTICLE:
            m = re.search(p, lf)
            if m and ct != 'FREE_RECALL':
                add('MODEL', tag, 'FC-22 orphan-article', m.group(0))
        for p in LECTURE_DEIXIS:
            if re.search(p, lf): add('BLOCK', tag, 'FC-22 lecture-deixis', p)
        if ct != 'FREE_RECALL':
            for m in DEICTIC.finditer(f):
                if not re.search(r"[A-Z][a-z]", f[:m.start()]):
                    add('BLOCK', tag, 'missing-context', f'unbound "{m.group(0)}"')
            # FC-26 — back bloat is the JackSparrow failure mode (§1.2)
            if len(words(b)) > 40:
                add('BLOCK', tag, 'FC-26 back-bloat',
                    f'{len(words(b))}-word prose answer; restructure or make it FREE_RECALL')
            if difflib.SequenceMatcher(None, lf, b.lower()).ratio() > 0.8:
                add('ADVIS', tag, 'trivial-card', 'back restates front')

# ── 8.1 recall-ready phrasing: FC-27 .. FC-31 ──────────────────────────
FINITE = set("""is are was were be been has have had can cannot could should would will must
may might do does did asked argued arose accepted acts adapts affect affects allowed applies
change changed changes gave gives given heard held hear said says saw see seen took taken
add adds ask asks assign assigns attribute attributed avoid avoids build builds carry carries
choose chooses claim claims code codes collect collects combine combines compare compares
conclude concludes consist consists cost costs count counts create creates decide decides
depend depends deny denies differ differs draw draws enforce enforces establish establishes
examine examines expect expects explain explains fail fails follow follows generalize
generalize generalizes go goes handle handles hold holds land lands leave leaves let lets
list lists log logs manipulate manipulates match matches mean measure measures name names
observe observes occur occurs pin pins predict predicts prefer prefers present presents
produce produced produces provide provides raise raises rate rated rates read reads receive
receives record records reduce reduces report reported reports run runs sample samples score
scored scores show showed shows sit sort sorts specify specified split splits stop stops
supply supplies support supports switch take tell tells test tested tests think tracked
travel travels try understand vary varies wanted want watch watches went work works write
drive drives drove serve serves apply applies arise arises trace traces swing swings
writes yield yields
became begin beginning brings broke built comes contribute contributed control controls counts
count covers defined denied describe describes destroys develops died direct directs drop
emerges emphasizes exist exists explains feed focused founded governs grants guided held holds
influence influences inherits keeps knows leaks led lets located makes means measures needs
operate operates paired placed points produce produces reject rejects removed repeat reported
reports requires rests runs served sets shape shapes shifted shows sit sits speaks stands
states stay stays stop studied studies taught took traced transfer treated turns uses violates
watching went worked""".split())
PARTICIPLE = re.compile(r"^(emphasi[sz]ing|arguing|describing|highlighting|reflecting|showcasing|"
                        r"underscoring|encompassing|fostering|ensuring|marking|representing)\b", re.I)
LEADING_DET = re.compile(r"^(a|an|the)\s+", re.I)

def has_finite(text):
    return any(w.lower() in FINITE for w in words(text))

def check_phrasing(tag, text, kind):
    """FC-27/28/30: an explanatory string must be a clause, not a glossary entry."""
    body = text.split(":", 1)[1].strip() if (":" in text[:40] and len(text.split(":")[0].split()) <= 6) else text
    if len(words(body)) <= 8:
        return                                   # short naming answers are exempt
    if PARTICIPLE.match(body):
        add('BLOCK', tag, 'FC-27 participial-opener', body[:55])
    if LEADING_DET.match(body) and not has_finite(body):
        add('BLOCK', tag, 'FC-27 glossary-noun-phrase', body[:55])
    elif not has_finite(body):
        add('BLOCK', tag, 'FC-27 no-finite-verb', body[:55])

for i, c in enumerate(CARDS):
    tag = f"#{i+1} {c['cid']}"
    if c['ct'] == 'FREE_RECALL':
        for it in c.get('items', []):
            check_phrasing(tag, it, 'item')
    elif c.get('b'):
        check_phrasing(tag, c['b'], 'back')
        if (c.get('sal') == 'load-bearing' and c['ct'] in
                ('CONCEPTUAL', 'COMPARISON', 'EXEMPLAR') and 8 < len(words(c['b'])) < 12):
            add('ADVIS', tag, 'FC-31 under-stated', f"{len(words(c['b']))} words")

# ── FC-FR-5 blurt spine ────────────────────────────────────────────────
frameworks = {c['cid'] for c in CARDS if c.get('kind') == 'framework'}
blurts = Counter(c['cid'] for c in CARDS if c['ct'] == 'FREE_RECALL')
for fw in sorted(frameworks):
    if blurts[fw] == 0: add('BLOCK', fw, 'FC-FR-5', 'framework with no blurt card')
    elif blurts[fw] > 1: add('BLOCK', fw, 'FC-FR-5', f'{blurts[fw]} blurt cards')
for cid, k in blurts.items():
    if cid not in frameworks: add('ADVIS', cid, 'FC-FR-5', 'blurt on a non-framework concept')

# ── FC-20 exemplar direction pairing ───────────────────────────────────
ex_dir = defaultdict(set)
for c in CARDS:
    if c['ct'] == 'EXEMPLAR': ex_dir[c['cid']].add(c['dir'])
for cid, ds in ex_dir.items():
    if len(ds) == 1:
        add('ADVIS', cid, 'FC-20 direction-gap', f'only {list(ds)[0]}')

# ── near-identical / redundancy ────────────────────────────────────────
for i in range(len(CARDS)):
    for j in range(i + 1, len(CARDS)):
        a, z = CARDS[i], CARDS[j]
        fa = a.get('f') or a.get('cz', ''); fb = z.get('f') or z.get('cz', '')
        ba = a.get('b') or a.get('cz', ''); bb = z.get('b') or z.get('cz', '')
        rf = difflib.SequenceMatcher(None, fa.lower(), fb.lower()).ratio()
        rb = difflib.SequenceMatcher(None, ba.lower(), bb.lower()).ratio()
        if rf > .9 and rb > .9: add('BLOCK', f'#{i+1}/#{j+1}', 'near-identical', f'{rf:.2f}/{rb:.2f}')
        elif a['cid'] == z['cid'] and rb > .85 and a['ct'] != 'FREE_RECALL':
            add('MODEL', f'#{i+1}/#{j+1}', 'redundancy-candidate', f'{a["cid"]} {rb:.2f}')

# ── deck level ─────────────────────────────────────────────────────────
n = len(CARDS)
types = Counter(c['ct'] for c in CARDS)
print(f"cards: {n}   concepts: {len({c['cid'] for c in CARDS})}   frameworks: {len(frameworks)}")
for t, k in types.most_common():
    p = 100 * k / n
    print(f"  {t:<12} {k:>3}  {p:5.1f}%" + ("   <-- OVER 60% CAP" if p > 60 else ""))
    if p > 60: add('ADVIS', 'deck', 'type-cap', f'{t} {p:.1f}%')

concept_pct = 100 * (types['CONCEPTUAL'] + types['APPLICATION']) / n
rel_n = sum(1 for c in CARDS if c['ct'] in RELATIONAL or c.get('rel'))
rel_pct = 100 * rel_n / n
ex_pct = 100 * types['EXEMPLAR'] / n
print(f"\n  conceptual floor  {concept_pct:5.1f}%  (>=15)")
print(f"  relational floor  {rel_pct:5.1f}%  (>=25)   [{rel_n} cards]")
print(f"  exemplar floor    {ex_pct:5.1f}%  (>=15)")
if concept_pct < 15: add('ADVIS', 'deck', 'conceptual-floor', f'{concept_pct:.1f}%')
if rel_pct < 25: add('ADVIS', 'deck', 'relational-floor', f'{rel_pct:.1f}%')
if ex_pct < 15: add('ADVIS', 'deck', 'exemplar-floor', f'{ex_pct:.1f}%')

mech = Counter(c.get('cp') for c in CARDS if c.get('cp'))
tot_cloze = sum(mech.values())
print(f"  cloze mechanisms  {dict(mech)}  (definition must be plurality)")
if tot_cloze and mech['definition'] < max(mech.values()):
    add('ADVIS', 'deck', 'FC-21 definition-plurality', str(dict(mech)))

# trivia ceiling — tested answer is a bare proper noun / year / institution
def bare_proper(c):
    if c['ct'] == 'FREE_RECALL' or c.get('cp'): return False
    b = c['b'].rstrip('.')
    return bool(re.fullmatch(r"[A-Z][\w.’'-]*(\s+[A-Z][\w.’'-]*)*", b)) and len(words(b)) <= 4
trivia = [c for c in CARDS if bare_proper(c)]
tp = 100 * len(trivia) / n
print(f"  trivia ceiling    {tp:5.1f}%  (<=10)   [{len(trivia)} cards]")
if tp > 10: add('MODEL', 'deck', 'trivia-ceiling', f'{tp:.1f}% — classify each under §2.5')

print("\n--- findings ---")
if not findings: print("none")
for sev, cid, chk, msg in sorted(findings, key=lambda x: {'BLOCK': 0, 'MODEL': 1, 'ADVIS': 2}[x[0]]):
    print(f"[{sev}] {str(cid):<40} {chk:<28} {msg}")
blocking = [x for x in findings if x[0] == 'BLOCK']
print(f"\nblocking: {len(blocking)}")
sys.exit(1 if blocking else 0)
