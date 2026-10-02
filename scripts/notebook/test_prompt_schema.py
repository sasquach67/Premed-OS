"""Test prompt generation and sync only in temporary directories; no model trials."""
from pathlib import Path
import copy
import hashlib
import json
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
SCHEMAS = Path('premed-hq-documentation/specifications/generation/portable-notebooks')
APP = Path('src/lib/academics/notebook')
# Exact beta25 template bytes at f2d3660; hashes keep shallow CI independent of Git history.
BASE_PROMPT_HASHES = {
    'review':'e3078b0c405ad2c25badabf483d4c8959e75c22cae4d7428fe5d122633bab2e1',
    'assessment':'fb28c8bdb7d827ea90c6eb8e4109da70567f82f18b8ac78b88ab20e05da078b5',
    'assignment':'95c9b8ae7c41023eafd7f42c4d1c8138e7246387822f43a4bf06f9113ae1ae03',
}
PIN = 'notebook-prompt-v4.schema.json'
PIN_HASH = 'd571a6e58a2953cc1e939e7236a98925bc582cb7b77418e4604b48ee1bc30097'
READER_HASH = 'aae31d034e109e8ac4d64cbe2fba0bdb41068b76b5f5c2ddbeb9a4595095ca35'
PREFIX = 'The prefix belongs only on mastery-objective labels. Section titles and every other heading are plain, concrete titles with no numbers, objective numbers, Review or Practice prefixes or other labels.'
GAP = 'A gap or source-limit section gets a plain student-facing title such as "Figures not supplied" or "Not covered yet", never "unfinished tasks"; administrative narration stays in the companion message.'
GOALS = ('review', 'assessment', 'assignment')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def embedded(prompt):
    return prompt.split('\n## Exact JSON Schema\n')[1].split('```json\n')[1].split('\n```')[0]


class PromptSchemaTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='notebook-schema-test-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.out = self.root/'generated'
        self.build()
        self.manifest = json.loads((self.out/'canonical-manifest.json').read_text())
        # Sync sees a disposable canonical/installed reader pair and prompt pin.
        for name in (*self.manifest['readerSchemas'], PIN):
            target = self.root/SCHEMAS/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT/SCHEMAS/name, target)
        for name in self.manifest['readerSchemas']:
            target = self.root/APP/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT/APP/name, target)
        for name in ('revision-context.json', 'conversation-expectations.json'):
            shutil.copyfile(ROOT/SCHEMAS/name, self.out/name)

    def build(self, schema=None):
        command = ['python3', str(ROOT/SCHEMAS/'build_prompts.py'), '--canonical-root', str(ROOT), '--output', str(self.out)]
        if schema is not None:
            command += ['--prompt-schema', str(schema)]
        subprocess.run(command, check=True, capture_output=True, text=True)

    def save_manifest(self):
        (self.out/'canonical-manifest.json').write_text(json.dumps(self.manifest))

    def sync(self, error=None):
        before = {str(p.relative_to(self.root/APP)): p.read_bytes() for p in (self.root/APP).rglob('*') if p.is_file()}
        result = subprocess.run(['node', str(ROOT/'scripts/notebook/sync-assets.mjs'), str(self.out)], cwd=self.root, capture_output=True, text=True)
        if error:
            self.assertNotEqual(result.returncode, 0)
            self.assertIn(error, result.stderr)
            after = {str(p.relative_to(self.root/APP)): p.read_bytes() for p in (self.root/APP).rglob('*') if p.is_file()}
            self.assertEqual(before, after, 'Failed integrity checks must perform zero writes')
        else:
            self.assertEqual(result.returncode, 0, result.stderr)
        return result

    def assert_heading_scope(self, goal, prompt):
        self.assertEqual(prompt.count(PREFIX), 2 if goal == 'review' else 1)
        self.assertEqual(prompt.count(GAP), 1)
        normalized = prompt.replace('notebook-instructions-beta-26', 'notebook-instructions-beta-25').replace(' '+PREFIX, '').replace(' '+GAP, '')
        self.assertEqual(sha(normalized.encode()), BASE_PROMPT_HASHES[goal], 'Only build label and approved heading rules may change, including embedded schema')

    def test_default_pin_and_exact_beta25_scope(self):
        self.assertEqual(sha((self.out/PIN).read_bytes()), PIN_HASH)
        self.assertEqual(self.manifest['promptSchema']['sha256'], PIN_HASH)
        self.assertEqual(self.manifest['schema']['sha256'], READER_HASH)
        for goal in GOALS:
            prompt = (self.out/f'copy-prompt-{goal}.md').read_text()
            self.assert_heading_scope(goal, prompt)
            compact = embedded(prompt)
            self.assertEqual(sha(compact.encode()), self.manifest['promptSchema']['embeddedSha256'])
            self.assertNotEqual(sha(compact.encode()), PIN_HASH)
        self.sync()
        for goal in GOALS:
            name = f'copy-prompt-{goal}.md'
            self.assertEqual((self.out/name).read_bytes(), (self.root/APP/'prompts'/name).read_bytes())

    def test_reader_prompt_divergence_is_only_existing_more_fields(self):
        reader = json.loads((ROOT/SCHEMAS/'notebook-package-v4.schema.json').read_text())
        self.assertEqual(sha((ROOT/SCHEMAS/'notebook-package-v4.schema.json').read_bytes()), READER_HASH)
        for variant in reader['$defs']['block']['oneOf'][:2]:
            self.assertIn('more', variant['properties'])
            del variant['properties']['more']
        self.assertEqual(reader, json.loads((self.out/PIN).read_text()))

    def test_explicit_pin_matches_default(self):
        before = {goal: (self.out/f'copy-prompt-{goal}.md').read_bytes() for goal in GOALS}
        self.build(ROOT/SCHEMAS/PIN)
        for goal in GOALS:
            self.assertEqual(before[goal], (self.out/f'copy-prompt-{goal}.md').read_bytes())

    def test_missing_explicit_schema_does_not_fall_back(self):
        with self.assertRaises(subprocess.CalledProcessError):
            self.build(self.root/'missing.schema.json')

    def test_explicit_reader_schema_cannot_bypass_pin_at_sync(self):
        self.build(ROOT/SCHEMAS/'notebook-package-v4.schema.json')
        manifest = json.loads((self.out/'canonical-manifest.json').read_text())
        self.assertIn('Explicit override differs from the committed prompt pin', manifest['promptSchema']['relationship'])
        self.sync('Prompt schema differs from the committed pin')

    def test_scope_check_rejects_other_prose_or_schema_changes(self):
        prompt = (self.out/'copy-prompt-review.md').read_text()
        for mutated in (prompt+'\nUnapproved rule.', prompt.replace('"$schema":', '"unapproved":true,"$schema":', 1), prompt+' '+PREFIX):
            with self.assertRaises(AssertionError):
                self.assert_heading_scope('review', mutated)

    def test_sync_rejects_embedded_schema_tampering_even_with_updated_output_receipt(self):
        path = self.out/'copy-prompt-review.md'
        path.write_text(path.read_text().replace('"$schema":', '"unapproved":true,"$schema":', 1))
        self.manifest['outputs'][path.name]['sha256'] = sha(path.read_bytes())
        self.save_manifest()
        self.sync('embeds a schema different from the committed prompt pin')

    def test_sync_rejects_reader_or_pin_drift_without_writes(self):
        targets = [
            (self.root/APP/'notebook-package-v4.schema.json', 'installed parser schema'),
            (self.root/SCHEMAS/'notebook-package-v4.schema.json', 'canonical reader schema'),
            (self.root/SCHEMAS/PIN, 'committed pin'),
            (self.out/PIN, 'committed pin'),
        ]
        for path, message in targets:
            with self.subTest(path=str(path)):
                original = path.read_bytes()
                path.write_bytes(original+b'\n')
                self.sync(message)
                path.write_bytes(original)

    def test_sync_retains_receipt_checks_and_rejects_missing_dual_contract(self):
        cases = [
            (('outputs', 'copy-prompt-review.md', 'sha256'), 'canonical generation receipt'),
            (('schema', 'sha256'), 'canonical receipt'),
            (('readerSchemas', 'notebook-package-v4.schema.json', 'sha256'), 'canonical reader schema'),
            (('promptSchema', 'sha256'), 'committed pin'),
            (('promptSchema', 'embeddedSha256'), 'serialization'),
            (('promptSchema', 'outputFile'), 'committed pin'),
            (('promptBuild',), 'composition and generation receipt disagree'),
            (('instructionsVersion',), 'composition and generation receipt disagree'),
            (('supportingData', str(SCHEMAS/'revision-context.json')), 'differs from its canonical receipt'),
        ]
        original = copy.deepcopy(self.manifest)
        for keys, message in cases:
            with self.subTest(keys=keys):
                self.manifest = copy.deepcopy(original)
                target = self.manifest
                for key in keys[:-1]:
                    target = target[key]
                target[keys[-1]] = 'tampered'
                self.save_manifest()
                self.sync(message)
        self.manifest = copy.deepcopy(original)
        del self.manifest['promptSchema']
        self.save_manifest()
        self.sync('committed pin')


if __name__ == '__main__':
    unittest.main(verbosity=2)
