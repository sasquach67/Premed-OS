"""Read an attached .apkg in a disposable Anki collection, never a live profile.

The returned snapshot contains note identities and the original rendered fields,
not an attempted conversion back into authoring input. Optional media copies let
the builder preserve retired notes after this temporary collection is closed.
"""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import tempfile
import zipfile

from anki.collection import Collection, ImportAnkiPackageRequest, ImportAnkiPackageOptions

METADATA_FILE = 'premedos-update.json'


def read_previous(apkg, media_dir=None):
    """Return a JSON-safe snapshot; copy media only into an explicit empty folder.

    Collection contents, including modern compressed packages, are read by the
    real Anki importer. Only our small optional identity manifest is read from
    the ZIP directly. No collection or temporary path escapes this function.
    """
    apkg = Path(apkg).expanduser().resolve(strict=True)
    if not apkg.is_file() or apkg.suffix.lower() != '.apkg':
        raise ValueError('Attach an .apkg package, not a collection or profile.')
    metadata = {}
    with zipfile.ZipFile(apkg) as archive:
        if METADATA_FILE in archive.namelist():
            entry = archive.getinfo(METADATA_FILE)
            if entry.file_size > 1024 * 1024:
                raise ValueError('Package identity metadata is too large.')
            metadata = json.loads(archive.read(entry))
            if (not isinstance(metadata, dict) or metadata.get('version') != 1
                    or any(not isinstance(metadata.get(key), str) or not metadata[key].strip()
                           for key in ('deckName', 'deckKey'))):
                raise ValueError('Invalid package identity metadata.')
    destination = None
    if media_dir is not None:
        destination = Path(media_dir).expanduser()
        if destination.is_symlink():
            raise ValueError('Media destination must not be a symbolic link.')
        destination.mkdir(parents=True, exist_ok=True)
        if any(destination.iterdir()):
            raise ValueError('Choose an empty media destination; existing files are never overwritten.')
        destination = destination.resolve()
    warnings = []
    with tempfile.TemporaryDirectory(prefix='premedos-read-previous-') as temp:
        col = Collection(str(Path(temp) / 'previous.anki2'))
        try:
            col.import_anki_package(ImportAnkiPackageRequest(
                package_path=str(apkg), options=ImportAnkiPackageOptions()))
            notes = []
            used_models, used_decks, guids = set(), set(), set()
            for nid in sorted(col.find_notes('')):
                note = col.get_note(nid)
                if note.guid in guids:
                    raise ValueError('The attached package contains duplicate note GUIDs.')
                guids.add(note.guid)
                cards = [col.get_card(cid) for cid in col.find_cards('nid:' + str(nid))]
                deck_ids = sorted({card.did for card in cards})
                used_models.add(note.mid)
                used_decks.update(deck_ids)
                notes.append({'guid': note.guid, 'modelId': note.mid, 'mod': note.mod,
                              'fields': list(note.fields), 'fieldNames': list(note.keys()),
                              'tags': list(note.tags), 'ords': sorted(card.ord for card in cards),
                              'deckIds': deck_ids})
            if not notes:
                raise ValueError('The attached package contains no notes.')
            decks = [deck for deck in col.decks.all() if deck['id'] in used_decks]
            if len(decks) != 1:
                raise ValueError('Attach one standalone lecture deck, not a package containing multiple decks.')
            deck_name = decks[0]['name']
            if metadata and metadata['deckName'] != deck_name:
                raise ValueError('Package identity metadata does not match the imported deck name.')
            if not metadata:
                # Standard Anki exports omit custom ZIP entries; hidden note fields survive.
                identities = []
                for row in notes:
                    if 'premedos_spec' not in row['fieldNames']: continue
                    value = row['fields'][row['fieldNames'].index('premedos_spec')]
                    try: identity = json.loads(value)
                    except (ValueError, TypeError): continue
                    if isinstance(identity, dict) and isinstance(identity.get('deckKey'), str) and identity['deckKey'].strip():
                        identities.append(identity['deckKey'])
                if len(identities) == len(notes) and len(set(identities)) == 1:
                    metadata = {'version':1, 'deckKey':identities[0], 'deckName':deck_name}
            if not metadata:
                warnings.append('This older package has no stored deckKey; it requires the documented one-time migration before updates.')
            media = []
            for path in sorted(Path(col.media.dir()).iterdir()):
                if path.name == '.DS_Store':
                    continue
                if not path.is_file() or path.is_symlink():
                    raise ValueError('Imported media must contain regular files only.')
                item = {'name': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
                if destination is not None:
                    target = destination / path.name
                    with path.open('rb') as source, target.open('xb') as output:
                        shutil.copyfileobj(source, output)
                    item['path'] = str(target)
                media.append(item)
            result = {'version': 1, 'deckName': deck_name,
                      'deckKey': metadata.get('deckKey'), 'metadata': metadata,
                      'notes': notes,
                      'models': [col.models.get(mid) for mid in sorted(used_models)],
                      'decks': decks, 'media': media, 'warnings': warnings,
                      'reviewCards': sum(len(note['ords']) for note in notes)}
        finally:
            col.close()
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('apkg', type=Path)
    parser.add_argument('--media-dir', type=Path, help='Copy package media into this empty directory.')
    parser.add_argument('--output', type=Path, help='Write JSON to a new file instead of standard output.')
    args = parser.parse_args()
    snapshot = read_previous(args.apkg, args.media_dir)
    text = json.dumps(snapshot, indent=2, ensure_ascii=False) + '\n'
    if args.output:
        with args.output.open('x') as output:
            output.write(text)
    else:
        print(text, end='')
