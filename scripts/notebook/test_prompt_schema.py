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
# Approved October 17 grouped-term authoring scope. Frozen full-template hashes
# detect unreviewed rule/schema changes; generated assets separately require parity.
APPROVED_PROMPT_HASHES = {'review': 'a01f40a00d2f9d4eded5a2e5219f746892d5d65758c59b57027f0d1d84a15829', 'assessment': 'c276150272f0843b9c02f2666b69d2576cedd6a77081f14f363af37938dd4a4b', 'assignment': '34b153c74c89ba7717f2d8ffd402a086cb7679541421527459b4332eb55bcc27'}
PIN = 'notebook-prompt-v4.schema.json'
PIN_HASH = 'dc8e10c2cd73626f3049da70cf6239e8de414497116f9eed9c01aae2c1d5f32c'
READER_HASH = 'dc8e10c2cd73626f3049da70cf6239e8de414497116f9eed9c01aae2c1d5f32c'
PREFIX = 'The prefix belongs only on mastery-objective labels. Section titles and every other heading are plain, concrete titles with no numbers, objective numbers, Review or Practice prefixes or other labels.'
GAP = 'A gap or source-limit section gets a plain student-facing title such as "Figures not supplied" or "Not covered yet", never "unfinished tasks"; administrative narration stays in the companion message.'
DETAIL = '- `EC-READING-DETAIL`: For guide teaching in new and update notebooks, author two coherent reading layers using the existing `more` field on `paragraph`, `bullets` and `illustration` blocks. The field is optional on paragraphs and bullets and required on illustrations. Full detail is the default: the visible block plus its `more` text must retain the real explanation in compact wording, including relevant definitions, mechanisms, reasoning steps, distinctions and useful examples. Do not remove substantive teaching to meet a word count or percentage. Condensed hides `more`: the visible block must still name the concept, state its central relationship and define terms needed to understand that statement. Put additional explanation in `more` next to the idea it develops, without repeating the visible text. Both layers remove fluff and repetition; source narration belongs in neither layer. Use plain prose for `more`, at most 1200 characters per field, never an empty or whitespace-only string. When no useful explanation is needed, omit `more` or use null on paragraphs and bullets; illustrations must include `more: null`. Distribute longer explanations among relevant supported blocks without truncating the teaching or padding the guide to force a switch. Steps, tables and other block types do not accept `more`; keep their content intact and use an adjacent paragraph or bullets block for a needed explanation. Do not put practice answers or worked solutions in `more`; retain their existing reveal behavior and the requested assignment help stage. The app supplies the guide-wide switch; do not write duplicate Full detail/Condensed sections or interface instructions into the notebook.'
DETAIL_CHECK = '- `EC-DETAIL-CHECK`: Before delivery, read the guide once with `more` hidden and once with it visible. Condensed must make sense by itself; Full detail must contain the complete relevant explanation without duplicated sentences, source narration or unsupported additions. Apply EC-PERTINENT-ONLY to both layers, including phrases such as "the lecture reports" and "the outline says". Keep genuine evidence limits in the existing limitations/gap records, and keep scientific uncertainty when it changes the claim. Check the declared schema and every `more` field; successful JSON validation alone does not establish teaching completeness.'
OLD_VISUAL = 'Use a visual in the main guide only when it clarifies a difficult relationship or materially replaces text; otherwise use the clearer shorter explanation. Place necessary neutral source-question stimuli in Practice. A figure used there need not receive a second walkthrough in the guide.'
GUIDE_VISUAL = 'Show source visuals where they are taught. When a guide section teaches something that a supplied slide, figure, graph, diagram or image depicts, place that figure in that section beside its explanation, using the supplied pixels and a faithful caption; use the answer-neutral version when the original would reveal a practice answer. Practice may reuse the same asset: a figure used in Practice still appears in the guide section that teaches it. Decorative, title, administrative and duplicate slides stay out.'
VISUAL_GAPS = "- `EC-VISUAL-GAPS`: For every guide section, check whether the idea is visual: a structure, process, pathway, comparison, map, data reading or before-and-after. If it is and no supplied image depicts it, build a native visual from supported facts with the existing block types (study-diagram, sequence-strip, timeline, venn, continuum, table, illustration, worked-example). If the materials refer to a figure that was not supplied or could not be extracted, name it in the plain-titled gap section with exactly what to supply, and still teach the idea with a native visual where the facts support one. Never generate a synthetic image file for a missing visual; extracting or faithfully cropping supplied source pixels under EC-FIGURES stays allowed. Never present a native visual as the instructor's figure, and never reconstruct an unavailable question stimulus."
VISUAL_REVIEW = 'A candidate that depicts content taught in the guide may not be skipped as overlapping or unnecessary; record the guide section it was placed in.'
COMPANION_VISUAL = 'List each guide section with the figure or native visual it uses, or the reason none is needed.'
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
        self.assertEqual(prompt.count(DETAIL), 1)
        self.assertEqual(prompt.count(DETAIL_CHECK), 1)
        self.assertEqual(prompt.count(GUIDE_VISUAL), 1)
        self.assertEqual(prompt.count(VISUAL_GAPS), 1)
        self.assertEqual(prompt.count(VISUAL_REVIEW), 1)
        self.assertEqual(prompt.count(COMPANION_VISUAL), 1)
        self.assertNotIn(OLD_VISUAL, prompt)
        self.assertIn('notebook-instructions-beta-29', prompt)
        self.assertIn('- `EC-GROUPED-GUIDE`:', prompt)
        if goal == 'review':
            self.assertIn('Practice belongs exclusively in Practice.', prompt)
        self.assertIn('definedTerms:[{term,definition}]', prompt)
        self.assertIn('learningObjectiveIds', prompt)
        self.assertEqual(sha(prompt.encode()), APPROVED_PROMPT_HASHES[goal],
                         'Template differs from the approved grouped-term beta29 scope')

    def test_default_pin_and_bounded_prose_schema_scope(self):
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

    def test_reader_and_prompt_contracts_match_with_additive_grouped_fields(self):
        reader = (ROOT/SCHEMAS/'notebook-package-v4.schema.json').read_bytes()
        self.assertEqual(sha(reader), READER_HASH)
        self.assertEqual(reader, (self.out/PIN).read_bytes())
        self.assertIn('Prompt and installed v4 reader schemas match', self.manifest['promptSchema']['relationship'])

    def test_explicit_pin_matches_default(self):
        before = {goal: (self.out/f'copy-prompt-{goal}.md').read_bytes() for goal in GOALS}
        self.build(ROOT/SCHEMAS/PIN)
        for goal in GOALS:
            self.assertEqual(before[goal], (self.out/f'copy-prompt-{goal}.md').read_bytes())

    def test_missing_explicit_schema_does_not_fall_back(self):
        with self.assertRaises(subprocess.CalledProcessError):
            self.build(self.root/'missing.schema.json')

    def test_explicit_reader_schema_cannot_bypass_pin_at_sync(self):
        altered = self.root/'altered.schema.json'
        altered.write_bytes((ROOT/SCHEMAS/PIN).read_bytes()+b'\n')
        self.build(altered)
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
