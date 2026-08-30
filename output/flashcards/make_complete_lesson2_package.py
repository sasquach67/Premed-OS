"""Make a fresh, complete Lesson 2 package that Anki will not deduplicate against an earlier import."""
from pathlib import Path
import hashlib
import json
import shutil
import sqlite3
import tempfile
import zipfile

SOURCE = Path('/Users/andyquach/Downloads/BIOL103-Lesson2-Transcription-Translation-Protein-Targeting-reference-expanded.apkg')
OUT = Path('/Users/andyquach/Downloads/BIOL103-Lesson2-Transcription-Translation-Protein-Targeting-complete.apkg')
OLD_NAME = 'UNC::Fall 2026::BIOL103::Lesson 2'
NEW_NAME = 'UNC::Fall 2026::BIOL103::Lesson 2 Complete'

with tempfile.TemporaryDirectory() as tmp:
    work = Path(tmp)
    with zipfile.ZipFile(SOURCE) as package: package.extractall(work)
    collection = work / 'collection.anki2'
    database = sqlite3.connect(collection)
    try:
        database.row_factory = sqlite3.Row
        database.execute('BEGIN')
        # Fresh GUIDs make the package a full deck import rather than a 31-note
        # delta when the old reference package already exists in Anki.
        for note in database.execute('select id, guid from notes'):
            guid = hashlib.sha1(f"lesson2-complete-20260825:{note['id']}:{note['guid']}".encode()).hexdigest()[:20]
            database.execute('update notes set guid = ? where id = ?', (guid, note['id']))

        row = database.execute('select decks, conf from col where id = 1').fetchone()
        decks, conf = json.loads(row['decks']), json.loads(row['conf'])
        child_id = next(key for key, deck in decks.items() if deck.get('name') == OLD_NAME)
        decks[child_id]['name'] = NEW_NAME
        decks[child_id]['desc'] = 'Complete BIOL 103 Lesson 2 deck: original reference cards plus appended lecture-source cards. One-way export; Anki owns review and scheduling.'
        conf['curDeck'] = int(child_id)
        conf['activeDecks'] = [int(child_id)]
        database.execute('update col set decks = ?, conf = ?', (json.dumps(decks), json.dumps(conf)))
        database.commit()
    finally:
        database.close()

    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as package:
        package.write(collection, 'collection.anki2')
        package.writestr('media', '{}')

print(f'wrote {OUT}')
