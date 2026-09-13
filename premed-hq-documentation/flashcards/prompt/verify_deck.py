"""Verify the actual package in a temporary real-Anki collection, never a user profile."""
from pathlib import Path
import argparse, base64, hashlib, html, json, re, tempfile
from anki.collection import Collection, ImportAnkiPackageRequest, ImportAnkiPackageOptions
from build_deck import validate, CSS, create_models

def verify(apkg, report_path, input_path):
    data = json.loads(input_path.read_text()); validate(data)
    report = json.loads(report_path.read_text())
    if hashlib.sha256(apkg.read_bytes()).hexdigest() != report['apkgSha256']: raise ValueError('Package hash differs from its build report.')
    expected = {r['guid']:r for r in report['records']}
    failures = []; renders = []
    with tempfile.TemporaryDirectory() as temp:
        col = Collection(str(Path(temp) / 'verify.anki2'))
        try:
            col.import_anki_package(ImportAnkiPackageRequest(package_path=str(apkg.resolve()), options=ImportAnkiPackageOptions()))
            nids, cids = col.find_notes(''), col.find_cards('')
            if len(nids) != report['notes']: failures.append('Note count differs.')
            if len(cids) != report['reviewCards']: failures.append('Review-card count differs, including cloze indices.')
            names = {d.name for d in col.decks.all_names_and_ids()}
            if report['deckName'] not in names: failures.append('Destination deck is missing.')
            if names - {'Default', report['deckName']}: failures.append('Unexpected extra or parent decks.')
            model_ids = set()
            for nid in nids:
                note = col.get_note(nid); model_ids.add(note.mid)
                row = expected.get(note.guid)
                if not row: failures.append('Unexpected note identity.'); continue
                fields = dict(note.items())
                if fields != row['fields']: failures.append(row['id'] + ': field content changed during import.')
                # Exercise hidden fields with sentinel content; user-facing text stays intact.
                for name in ['premedos_concept_id', 'premedos_source', 'premedos_spec']:
                    note[name] = 'HIDDEN_AUDIT_SENTINEL_' + name
                col.update_note(note)
            expected_models = {m.name:m for m in create_models()}
            for mid in model_ids:
                model = col.models.get(mid)
                spec = expected_models.get(model['name'])
                if not spec or model['css'] != CSS: failures.append('Model style differs.')
                if spec and [f['name'] for f in model['flds']] != [f['name'] for f in spec.fields]: failures.append('Field order differs.')
                if spec and any(model['tmpls'][0][side] != spec.templates[0][side] for side in ['qfmt','afmt']): failures.append('Templates differ.')
            for cid in cids:
                card = col.get_card(cid); q, a = card.question(), card.answer()
                if not re.sub(r'<[^>]*>|\s', '', q): failures.append('Empty question.')
                if not re.sub(r'<[^>]*>|\s', '', a): failures.append('Empty answer.')
                if q == a: failures.append('Question and answer are identical.')
                if 'HIDDEN_AUDIT_SENTINEL_' in q + a: failures.append('Hidden metadata renders.')
                if card.type != 0 or card.reps: failures.append('Review history unexpectedly present.')
                if card.note_type()['type'] == 1 and '[...]' not in q: failures.append('Cloze does not show its active blank.')
                renders.append({'question':q,'answer':a})
            missing = list(col.media.check().missing)
            if missing: failures.append('Missing media: ' + ', '.join(missing))
            for name in report['media']:
                media_path = Path(col.media.dir()) / name
                if not media_path.is_file(): failures.append('Packaged figure not imported: ' + name)
                else:
                    mime = 'image/png' if name.endswith('.png') else 'image/jpeg'
                    uri = 'data:' + mime + ';base64,' + base64.b64encode(media_path.read_bytes()).decode()
                    for render in renders:
                        for side in ['question', 'answer']: render[side] = render[side].replace('src="' + name + '"', 'src="' + uri + '"')
            integrity, ok = col.fix_integrity()
            if not ok: failures.append('Anki database check: ' + integrity)
        finally:
            col.close()
    result = {'passed':not failures, 'failures':failures, 'notes':report['notes'], 'reviewCards':report['reviewCards'], 'integrity':integrity, 'scope':'Temporary real-Anki import, exact fields/templates/CSS, counts, cloze blanking, hidden fields, media presence, unseen scheduling, database integrity. Not a source-accuracy or learning-quality verdict.'}
    apkg.with_suffix('.verification.json').write_text(json.dumps(result,indent=2)+'\n')
    # Engine-produced HTML with media inlined, available for visual inspection in both themes.
    body = ''.join('<section><h2>Card '+str(i+1)+'</h2><div class="sample"><div class="card">'+r['question']+'</div><div class="card">'+r['answer']+'</div></div></section>' for i,r in enumerate(renders))
    apkg.with_suffix('.preview.html').write_text('<!doctype html><meta charset="utf-8"><title>Draft deck verification preview</title><style>'+CSS+'body{margin:24px;background:#faf7f0}.sample{display:grid;grid-template-columns:1fr 1fr;border:1px solid #ccc}section{margin-bottom:24px}h1,h2{font:18px system-ui}.nightMode{background:#211e1a;padding:24px;color:white}@media(max-width:700px){.sample{grid-template-columns:1fr}}</style><h1>Real Anki question and answer renderings</h1>'+body+'<main class="nightMode"><h1>Dark presentation</h1>'+body+'</main>')
    print(json.dumps(result,indent=2))
    if failures: raise SystemExit(1)
    return result

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('apkg', type=Path); parser.add_argument('report', type=Path); parser.add_argument('input',type=Path)
    args = parser.parse_args(); verify(args.apkg,args.report,args.input)
