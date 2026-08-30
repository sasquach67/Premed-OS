"""Append the revised Lesson 2 cards to the original reference deck without changing its notes."""
from pathlib import Path
import json
import shutil
import sqlite3
import tempfile
import zipfile

ORIGINAL = Path('/Users/andyquach/Downloads/BIOL103-Lesson2-Transcription-Translation-Protein-Targeting-reference.apkg')
ADDITIONS = Path('/Users/andyquach/Downloads/BIOL103-Lesson2-Transcription-Translation-Protein-Targeting-revised.apkg')
OUT = Path('/Users/andyquach/Downloads/BIOL103-Lesson2-Transcription-Translation-Protein-Targeting-reference-expanded.apkg')

with tempfile.TemporaryDirectory() as tmp:
    work = Path(tmp)
    original_dir, additions_dir = work / 'original', work / 'additions'
    original_dir.mkdir()
    additions_dir.mkdir()
    with zipfile.ZipFile(ORIGINAL) as package: package.extractall(original_dir)
    with zipfile.ZipFile(ADDITIONS) as package: package.extractall(additions_dir)

    output_db = work / 'collection.anki2'
    shutil.copy2(original_dir / 'collection.anki2', output_db)
    target = sqlite3.connect(output_db)
    source = sqlite3.connect(additions_dir / 'collection.anki2')
    try:
        target.row_factory = sqlite3.Row
        target.execute('BEGIN')
        max_note = target.execute('select coalesce(max(id), 0) from notes').fetchone()[0]
        max_card = target.execute('select coalesce(max(id), 0) from cards').fetchone()[0]
        max_due = target.execute('select coalesce(max(due), 0) from cards').fetchone()[0]
        note_map = {}
        for offset, note in enumerate(source.execute('select * from notes order by id'), 1):
            new_id = max_note + offset
            note_map[note[0]] = new_id
            target.execute('insert into notes values (?,?,?,?,?,?,?,?,?,?,?)', (new_id, *note[1:]))
        for offset, card in enumerate(source.execute('select * from cards order by id'), 1):
            new_id = max_card + offset
            values = list(card)
            values[0] = new_id
            values[1] = note_map[card[1]]
            values[8] = max_due + offset
            target.execute('insert into cards values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', values)

        col = target.execute('select conf, tags, decks from col where id = 1').fetchone()
        conf, tags, decks = json.loads(col['conf']), json.loads(col['tags']), json.loads(col['decks'])
        # The previous one-off BIOL export accidentally retained an empty PSYC
        # parent deck. It has no notes or cards, so excluding it does not alter
        # the original study material and keeps the import tree truthful.
        decks = {key: deck for key, deck in decks.items() if deck.get('name') != 'UNC::Fall 2026::PSYC101'}
        added_tags = json.loads(source.execute('select tags from col where id = 1').fetchone()[0])
        tags.update(added_tags)
        conf['nextPos'] = max_due + 32
        target.execute('update col set conf = ?, tags = ?, decks = ?', (json.dumps(conf), json.dumps(tags), json.dumps(decks)))
        target.commit()
    finally:
        source.close()
        target.close()

    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as package:
        package.write(output_db, 'collection.anki2')
        package.writestr('media', '{}')

print(f'wrote {OUT}')
