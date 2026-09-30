"""Tests the handoff actually pasted into a fresh directory, plus meaningful rejection cases."""
from pathlib import Path
import copy, importlib.util,json,re,shutil,subprocess,sys,tempfile,unittest
BASE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(BASE))
from build_deck import validate
from verify_deck import source_chatter_warnings

class PromptChecks(unittest.TestCase):
    def setUp(self):self.data=json.loads((BASE/'checks/cards.json').read_text())
    def test_accepts_all_supported_types_and_both_example_directions(self):
        self.assertEqual(validate(self.data),[])
    def test_rejects_preset_deck_hierarchy(self):
        self.data['deckName']='University::Semester::Class::Lecture'
        with self.assertRaisesRegex(ValueError,'standalone deck'):validate(self.data)
    def test_rejects_lost_reverse_direction(self):
        self.data['cards'][6]['exampleDirection']='instance-to-concept'
        with self.assertRaisesRegex(ValueError,'each example direction'):validate(self.data)
    def test_rejects_duplicate_blurt_item(self):
        self.data['cards'][7]['recallItems'][1]=self.data['cards'][7]['recallItems'][0]
        with self.assertRaisesRegex(ValueError,'duplicate blurt'):validate(self.data)
    def test_rejects_missing_plain_language_help_without_reason(self):
        self.data['cards'][1]['explanation']=''
        with self.assertRaisesRegex(ValueError,'omitted plain-language'):validate(self.data)
    def test_rejects_fictional_source_reference(self):
        self.data['cards'][0]['sourceRefs'][0]['sourceId']='not-attached'
        with self.assertRaisesRegex(ValueError,'Unknown source'):validate(self.data)
    def test_rejects_false_target_coverage(self):
        self.data['targets'][0]['cardIds']=['why']
        with self.assertRaisesRegex(ValueError,'coverage must match'):validate(self.data)
    def test_plain_valid_grammar_is_not_a_gate_failure(self):
        self.data['cards'][0]['front']='How does hot water differ from cold water in temperature?'
        self.data['cards'][0]['back']='His research centred on child development and evolutionary theory.'
        # Deliberately mismatched semantics: grammar heuristics do not pretend to verify correctness.
        self.assertEqual(validate(self.data),[])
    def test_source_chatter_in_all_visible_fields_warns(self):
        fields = {
            'Front': 'What does the lecture link?',
            'Back': 'The reading describes management.',
            'Text': "This is the reading’s historical illustration: {{c1::management}}.",
            'Extra': "This is not Cook's label.",
            'Type': 'Author explanation',
            'Mindset': 'Slides',
        }
        warnings = source_chatter_warnings('theory', fields)
        self.assertEqual(len(warnings), len(fields))
        for name in fields:
            self.assertTrue(any(f'theory: {name}:' in warning for warning in warnings))
    def test_audited_attribution_and_supplemental_chatter_warns(self):
        phrases = ['External clarification corrects the transcript',
                   'Supplemental historical explanation', 'Supplementary USDA evidence',
                   'according to Massey', 'The instructor explains this relationship']
        for phrase in phrases:
            with self.subTest(phrase=phrase):
                self.assertTrue(source_chatter_warnings('theory', {'Extra': phrase}))
        self.assertEqual(source_chatter_warnings('theory', {
            'Back': 'Reading a book can be a source of enjoyment.'}), [])
    def test_source_metadata_is_excluded_from_chatter_warnings(self):
        fields = {
            'Back': 'Management sets the method workers follow.',
            'Extra': 'Reading a book helps you relax.',
            'premedos_source': 'The lecture links this to Cook. Slides 3–4; the reading’s example.',
            'premedos_concept_id': 'lecture-1',
            'premedos_spec': 'author details',
        }
        self.assertEqual(source_chatter_warnings('theory', fields), [])
    def test_source_chatter_checks_html_text_and_alt_but_not_file_names(self):
        self.assertEqual(source_chatter_warnings('figure', {'Front': '<img src="lecture-slides.png" alt="Packing boxes">'}), [])
        self.assertTrue(source_chatter_warnings('figure', {'Front': '<img src="packing.png" alt="Lecture slide">'}))
        self.assertTrue(source_chatter_warnings('theory', {'Extra': 'not <b>Cook&#39;s</b> label'}))
    def test_embedded_files_and_actual_package_roundtrip(self):
        prompt=(BASE.parents[2]/'src/lib/academics/flashcards/instructions.md').read_text()
        blocks=dict(re.findall(r'### File: ([^\n]+)\n\n```[^\n]+\n(.*?)\n```',prompt,re.S))
        names=['cards.schema.json','card-styles.css','requirements.txt','build_deck.py','verify_deck.py']
        self.assertEqual(set(blocks),set(names))
        with tempfile.TemporaryDirectory() as temp:
            work=Path(temp)
            for name in names:
                text=blocks[name]+'\n'
                self.assertEqual(text,(BASE/name).read_text())
                (work/name).write_text(text)
            for name in ['cards.json','fixture.png']:shutil.copy2(BASE/'checks'/name,work/name)
            # Language findings must be reported without failing a structurally sound package.
            fixture=json.loads((work/'cards.json').read_text())
            fixture['cards'][0]['explanation']='The lecture links temperature to heat.'
            (work/'cards.json').write_text(json.dumps(fixture))
            output=subprocess.run([sys.executable,'build_deck.py','cards.json','result.apkg'],cwd=work,capture_output=True,text=True)
            self.assertEqual(output.returncode,0,output.stderr)
            output=subprocess.run([sys.executable,'verify_deck.py','result.apkg','result.build-report.json','cards.json'],cwd=work,capture_output=True,text=True)
            self.assertEqual(output.returncode,0,output.stdout+output.stderr)
            result=json.loads((work/'result.verification.json').read_text())
            self.assertTrue(result['passed'])
            self.assertTrue(any('Extra: possible source chatter: lecture' in warning for warning in result['warnings']))
            # Missing figure must prevent output, not silently produce a deck without it.
            (work/'fixture.png').unlink()
            output=subprocess.run([sys.executable,'build_deck.py','cards.json','missing.apkg'],cwd=work,capture_output=True,text=True)
            self.assertNotEqual(output.returncode,0)
            self.assertFalse((work/'missing.apkg').exists())
            self.assertIn('Missing figure',output.stderr)

if __name__=='__main__':unittest.main(verbosity=2)
