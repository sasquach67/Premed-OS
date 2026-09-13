"""Tests the handoff actually pasted into a fresh directory, plus meaningful rejection cases."""
from pathlib import Path
import copy, importlib.util,json,re,shutil,subprocess,sys,tempfile,unittest
BASE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(BASE))
from build_deck import validate

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
            output=subprocess.run([sys.executable,'build_deck.py','cards.json','result.apkg'],cwd=work,capture_output=True,text=True)
            self.assertEqual(output.returncode,0,output.stderr)
            output=subprocess.run([sys.executable,'verify_deck.py','result.apkg','result.build-report.json','cards.json'],cwd=work,capture_output=True,text=True)
            self.assertEqual(output.returncode,0,output.stdout+output.stderr)
            # Missing figure must prevent output, not silently produce a deck without it.
            (work/'fixture.png').unlink()
            output=subprocess.run([sys.executable,'build_deck.py','cards.json','missing.apkg'],cwd=work,capture_output=True,text=True)
            self.assertNotEqual(output.returncode,0)
            self.assertFalse((work/'missing.apkg').exists())
            self.assertIn('Missing figure',output.stderr)

if __name__=='__main__':unittest.main(verbosity=2)
