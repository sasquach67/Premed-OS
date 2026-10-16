"""Structural checks for author-declared term pairs; no inferred opposite lexicon."""
import re
import warnings

CLOZE = re.compile(r'\{\{c([1-9][0-9]*)::([^{}]+)\}\}')
PAIR = re.compile(r'^(opposite|non-opposite)\s*:\s*(.*?)\s*\|\s*(.*?)\s*$', re.I)


def normalized(text):
    return ' '.join(re.findall(r'\w+', str(text).casefold()))


def contains(text, phrase):
    return bool(phrase) and (' ' + phrase + ' ') in (' ' + text + ' ')


def declared_pair(card):
    """Return (relationship, (canonical A, canonical B)), or None for ordinary axes."""
    axis = card.get('axis', '').strip()
    if not re.match(r'^(?:non-opposite|opposite)\s*:', axis, re.I):
        return None
    match = PAIR.fullmatch(axis)
    if not match or not all(match.group(i).strip() for i in (2, 3)):
        raise ValueError('pair axis must declare two canonical terms separated by |')
    names = tuple(match.group(i).strip() for i in (2, 3))
    if '|' in ''.join(names) or normalized(names[0]) == normalized(names[1]):
        raise ValueError('pair axis must declare two distinct canonical terms')
    return match.group(1).lower(), names


def target_definitions(targets):
    values = targets.values() if isinstance(targets, dict) else targets
    result = {}
    for target in values:
        statement, reason = target.get('statement', ''), target.get('reason', '')
        if statement.startswith('Term: ') and reason.startswith('Meaning: '):
            result[normalized(statement[6:])] = normalized(reason[9:])
    return result


def expanded(text, hidden=None):
    return normalized(CLOZE.sub(lambda m: '' if int(m.group(1)) == hidden
                              else m.group(2).split('::', 1)[0], text))


def pair_role(card, targets):
    """Classify a single-index review as meaning:<0/1> or shared names contrast."""
    declaration = declared_pair(card)
    if declaration is None:
        return None
    relation, raw_names = declaration
    names = tuple(map(normalized, raw_names))
    definitions = target_definitions(targets)
    if any(name not in definitions for name in names):
        raise ValueError('pair axis requires named-term targets with recorded meanings')
    meanings = tuple(definitions[name] for name in names)
    text = card.get('cloze', '')
    spans = list(CLOZE.finditer(text))
    active = {int(m.group(1)) for m in spans}
    if len(active) != 1:
        raise ValueError('declared pair must use one shared cloze index per note')
    index = next(iter(active))
    full, visible = expanded(text), expanded(text, index)
    answers = [normalized(m.group(2).split('::', 1)[0]) for m in spans]
    name_visible = [contains(visible, n) for n in names]
    meaning_hidden = [any(contains(a, meaning) for a in answers) for meaning in meanings]
    if all(name_visible) and all(meaning_hidden):
        raise ValueError('parallel term meanings must be separate cards; recall each term meaning alone')
    for i in range(2):
        other = 1 - i
        if (name_visible[i] and meaning_hidden[i]
                and not contains(full, names[other]) and not contains(full, meanings[other])):
            return 'meaning:' + str(i)
    if (all(contains(full, n) for n in names) and not any(name_visible)
            and all(contains(visible, m) for m in meanings)):
        return 'names'
    raise ValueError('pair needs one standalone meaning card per term or a contrast hiding both names under one shared cloze index')


def slash_option_hint_warnings(card):
    """Identify word-choice hints containing the answer, without guessing semantics."""
    notices = []
    for match in CLOZE.finditer(card.get('cloze', '')):
        parts = match.group(2).split('::', 1)
        if len(parts) != 2:
            continue
        answer, hint = parts
        if (re.fullmatch(r"\s*[\w’'-]+(?:\s*/\s*[\w’'-]+)+\s*", hint)
                and normalized(answer) in [normalized(option) for option in hint.split('/')]):
            notices.append(f'{card.get("id", "card")}: cloze hint lists slash-separated answer options including the answer; replace it with a category hint, not a coin flip.')
    return notices


def validate_pair_rules(card, targets):
    """Warn on answer-choice leakage, then reject invalid hints or pair shapes."""
    for notice in slash_option_hint_warnings(card):
        warnings.warn(notice, UserWarning, stacklevel=2)
    for match in CLOZE.finditer(card.get('cloze', '')):
        parts = match.group(2).split('::', 1)
        if len(parts) == 2 and re.search(r'[/|,;]|\b(?:or|either|versus|vs)\b', parts[1], re.I):
            raise ValueError('cloze hint must name a category, not list answer options')
    declaration = declared_pair(card)
    if declaration:
        pair_role(card, targets)
    return None


def valid_headline_pair_core(group, targets):
    """Two standalone meaning cards plus one shared names contrast form the headline core."""
    if len(group) != 3 or len({c.get('conceptId') for c in group}) != 1 or not group[0].get('conceptId'):
        return False
    try:
        declarations = []
        for card in group:
            validate_pair_rules(card, targets)
            declaration = declared_pair(card)
            if not declaration: return False
            declarations.append(declaration)
        return (len({(d[0], tuple(map(normalized, d[1]))) for d in declarations}) == 1
                and sorted(pair_role(c, targets) for c in group) == ['meaning:0', 'meaning:1', 'names'])
    except (ValueError, TypeError):
        return False


def valid_headline_pair_allowance(group, targets):
    """Only the three-note headline pair plus one actual instructor example earns four."""
    if len(group) != 4 or len({c.get('conceptId') for c in group}) != 1 or not group[0].get('conceptId'):
        return False
    pair_cards, examples = [], []
    try:
        for card in group:
            validate_pair_rules(card, targets)
            declaration = declared_pair(card)
            if declaration:
                pair_cards.append((card, declaration))
            else:
                examples.append(card)
        if len(pair_cards) != 3 or len(examples) != 1:
            return False
        if not valid_headline_pair_core([c for c, _ in pair_cards], targets):
            return False
        example = examples[0]
        reason = example.get('reinforcementReason', '').casefold()
        is_example = example.get('type') in ('application', 'exemplar', 'cloze')
        example_indices = {int(m.group(1)) for m in CLOZE.finditer(example.get('cloze', ''))}
        one_review = (len(example_indices) == 1 if example.get('clozePattern')
                      else not example_indices)
        evidence = re.search(r"instructor(?:'s|’s)?\s+(?:own\s+)?example|example from the lecture", reason)
        return bool(is_example and evidence and example.get('sourceRefs')
                    and one_review)
    except (ValueError, TypeError):
        return False


def validate_pair_group(group, targets):
    """Reserved pair declarations keep both own meanings in the same idea group."""
    pair_cards = [c for c in group if declared_pair(c)]
    if not pair_cards:
        return
    declarations = [declared_pair(c) for c in pair_cards]
    if len({(d[0], tuple(map(normalized, d[1]))) for d in declarations}) != 1:
        raise ValueError('pair group must use one consistent pair declaration')
    roles = sorted(pair_role(c, targets) for c in pair_cards)
    simple = roles == ['meaning:0', 'meaning:1'] and len(group) == 2
    headline = (valid_headline_pair_core(group, targets)
                or valid_headline_pair_allowance(group, targets))
    if not (simple or headline):
        raise ValueError('pair group requires two own meaning cards, plus a shared names contrast for a headline pair and at most one sourced instructor example; keep them in one conceptId')
