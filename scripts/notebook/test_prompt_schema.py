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
# Approved October 20 beta-33 teach-first walkthrough, exam profile and forecast scope. Frozen full-template hashes
# detect unreviewed rule/schema changes; generated assets separately require parity.
APPROVED_PROMPT_HASHES = {'review': '8add976260f2ff082b0555c034f1bd4db6f68ac25b6db70acbe3713340bf8f87', 'assessment': '2e53655791c97da81e1da4ca32a376d4f7b95c913a901fb148217fabba3f22a4', 'assignment': '7973f31ecebcca1d8232348549b63542a662d4fdf746d22288f3497987a92649'}
PIN = 'notebook-prompt-v4.schema.json'
PIN_HASH = 'b0e586678ad308a2cd922259518c5a2083961de17b86cd4722a06ba14985eb77'
READER_HASH = 'b0e586678ad308a2cd922259518c5a2083961de17b86cd4722a06ba14985eb77'
PREFIX = 'The prefix belongs only on mastery-objective labels. Section titles and every other heading are plain, concrete titles with no numbers, objective numbers, Review or Practice prefixes or other labels.'
GAP = 'A gap or source-limit section gets a plain student-facing title such as "Figures not supplied" or "Not covered yet", never "unfinished tasks"; administrative narration stays in the companion message.'
DETAIL = '- `EC-READING-DETAIL`: For guide teaching in new and update notebooks, mark each block detail="core" or detail="extra". The optional field is accepted on every v4 block type; absent means core. Full detail is the default and shows all blocks. Condensed hides extra blocks and legacy more text. Keep the question, lede, walkthrough, map, terms, content-matched structure, claim blocks, main figure/Look for and key idea core; Condensed shows only the point sentence of each walkthrough item. Put Lecture example, permitted comparison extras and note corrections in extra blocks. Core must make sense by itself; Full detail must retain the complete relevant explanation without duplication. Do not remove substantive teaching to meet a word count or percentage. New authoring does not require more; paragraphs and bullets may omit it, and an illustration retains more:null where required by the schema. Preserve every stored more value on updates; the reader still reads legacy more in Full. Do not put practice answers or worked solutions in explanation blocks or more; retain reveal behavior and the requested assignment help stage. The app supplies the guide-wide switch; do not write duplicate Full detail/Condensed sections or interface instructions into the notebook. Both layers remove fluff and repetition; source narration belongs in neither layer.'
DETAIL_CHECK = '- `EC-DETAIL-CHECK`: Before delivery, read the guide once with extra blocks and legacy more hidden and once with everything visible. Condensed must make sense by itself; Full detail must retain complete relevant explanation without duplicated sentences, source narration or unsupported additions. Check every teaching section for its question, 1–2 sentence lede, 3–6 point walkthrough with 1–2 short paragraphs per point, key idea, justified step reasons, and 2–4 Look for lines for its actual main figure. No prose block exceeds 3 sentences or about 60 words. Check an argument guide\'s linked 4–6 item argumentChain and claim/evidence/soWhat in each argument section. Apply EC-PERTINENT-ONLY to both layers, including phrases such as "the lecture reports" and "the outline says". Keep genuine evidence limits in the existing limitations/gap records, and keep scientific uncertainty when it changes the claim. Check the declared schema and every detail/role field without deleting stored more; successful JSON validation alone does not establish teaching completeness.'
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
        self.assertEqual(prompt.count(PREFIX), 1)
        self.assertEqual(prompt.count(GAP), 1)
        self.assertEqual(prompt.count(DETAIL), 1)
        self.assertEqual(prompt.count(DETAIL_CHECK), 1)
        self.assertEqual(prompt.count(GUIDE_VISUAL), 1)
        self.assertEqual(prompt.count(VISUAL_GAPS), 1)
        self.assertEqual(prompt.count(VISUAL_REVIEW), 1)
        self.assertEqual(prompt.count(COMPANION_VISUAL), 1)
        self.assertNotIn(OLD_VISUAL, prompt)
        self.assertIn('notebook-instructions-beta-33', prompt)
        self.assertIn('- `EC-GROUPED-GUIDE`:', prompt)
        if goal == 'review':
            self.assertIn('Practice belongs exclusively in Practice.', prompt)
        self.assertIn('definedTerms:[{term,definition}]', prompt)
        self.assertIn('learningObjectiveIds', prompt)
        self.assertIn('EC-LINES-FIRST', prompt)
        self.assertIn('Shape follows content', prompt)
        self.assertIn('- `EC-WALKTHROUGH`:', prompt)
        self.assertIn('- `EC-IMPORT-CHECK`:', prompt)
        self.assertNotIn('Why it works), 2–3 sentences in EVERY teaching section', prompt)
        self.assertIn('no prose block or walkthrough paragraph exceeds 3 sentences or about 60 words', prompt)
        self.assertIn('premedOS/Lesson N - Title', prompt)
        self.assertNotIn('This is a draft instruction workflow', prompt)
        self.assertNotIn('Transport instructionsVersion:', prompt)
        self.assertNotIn('Nevirapine', prompt)
        self.assertIn('in the actual class folder', prompt)
        self.assertIn('only if that class folder cannot be reached', prompt)
        self.assertIn('say exactly where it was saved', prompt)
        self.assertIn('How it may be tested is a forecast of what the coming exam could ask', prompt)
        self.assertIn('Keep the actual class questions as evidence in howTested.questions', prompt)
        self.assertIn('applicationSkills:[{text,questionIds}]', prompt)
        self.assertNotIn('Try recalling first', prompt)
        self.assertNotIn('Watch for', prompt)
        if goal == 'review':
            self.assertIn('UMO-HOW-TESTED', prompt)
            self.assertNotIn('one or two original, self-contained exam-style', prompt)
            self.assertNotIn('at least one cue per objective', prompt)
        self.assertEqual(sha(prompt.encode()), APPROVED_PROMPT_HASHES[goal],
                         'Template differs from the approved beta33 teach-first scope')

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
