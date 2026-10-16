"""Tests the handoff actually pasted into a fresh directory, plus meaningful rejection cases."""
from pathlib import Path
import copy, importlib.util,json,re,shutil,subprocess,sys,tempfile,unittest
BASE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(BASE))
from build_deck import validate
from verify_deck import source_chatter_warnings
from test_updates import UpdateChecks
from test_card_features import CardFeatureChecks
from test_occlusion_pdf import PdfOcclusionChecks
from test_clarity import ClarityChecks
from test_grouping import GroupingChecks
from test_topic_chips import TopicChipChecks
from test_pair_rules import PairRuleChecks

class PromptChecks(unittest.TestCase):
    def setUp(self):self.data=json.loads((BASE/'checks/cards.json').read_text())
    def test_accepts_all_supported_types_and_both_example_directions(self):
        warnings = validate(self.data)
        self.assertTrue(warnings)
        self.assertTrue(all("no direct term card detected" in warning for warning in warnings))
    def test_rejects_preset_deck_hierarchy(self):
        self.data['deckName']='University::Semester::Class::Lecture'
        with self.assertRaisesRegex(ValueError,'standalone deck'):validate(self.data)
    def test_rejects_duplicate_direction_when_a_pair_is_declared(self):
        self.data['cards'][5]['examplePairId']='explicit-pair'
        self.data['cards'][6]['examplePairId']='explicit-pair'
        self.data['cards'][6]['exampleDirection']='instance-to-concept'
        with self.assertRaisesRegex(ValueError,'distinct directions'):validate(self.data)
    def test_rejects_duplicate_blurt_item(self):
        self.data['cards'][7]['recallItems'][1]=self.data['cards'][7]['recallItems'][0]
        with self.assertRaisesRegex(ValueError,'duplicate blurt'):validate(self.data)
    def test_empty_extra_builds_and_verifies(self):
        data=self.concept_fixture();data['cards'][0].update(explanation='',example=None)
        self.assertEqual(validate(data),[])
        built,verified=self.pipeline_fixture(data)
        self.assertEqual(built['records'][0]['fields']['Extra'],'')
        self.assertTrue(verified['passed'])
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
        self.assertTrue(all("no direct term card detected" in warning for warning in validate(self.data)))
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
    def concept_fixture(self, count=1):
        data=copy.deepcopy(self.data)
        data['cards']=[]
        for i in range(count):
            card=copy.deepcopy(self.data['cards'][0])
            card.update(id=f'idea-{i}',conceptId='sample-shape',targetIds=['sample-shape'],
                        front='Sample shape' if i == 0 else f'Why does sample variation {i} matter?',
                        back='A shape describes the outline of an object.' if i == 0 else f'Variation {i} changes a distinct property.',
                        type='basic' if i == 0 else 'conceptual',
                        reinforcementReason='' if i == 0 else 'Explains a distinct condition.')
            if i == 2:card['reinforcementReason']='Instructor stressed this condition repeatedly in the review sheet.'
            data['cards'].append(card)
        data['targets']=[{'id':'sample-shape','topic':'Synthetic','statement':'Define and explain sample shape.',
                          'kind':'understand','core':True,'coverage':'tested','cardIds':[c['id'] for c in data['cards']],'reason':''}]
        return data

    def pipeline_fixture(self, data):
        # Build and verify the actual embedded handoff, with no user profile.
        prompt=(BASE.parents[2]/'src/lib/academics/flashcards/instructions.md').read_text()
        blocks=dict(re.findall(r'### File: ([^\n]+)\n\n```[^\n]+\n(.*?)\n```',prompt,re.S))
        with tempfile.TemporaryDirectory() as temp:
            work=Path(temp)
            for name,content in blocks.items():(work/name).write_text(content+'\n')
            (work/'cards.json').write_text(json.dumps(data))
            built=subprocess.run([sys.executable,'build_deck.py','cards.json','result.apkg'],cwd=work,capture_output=True,text=True)
            self.assertEqual(built.returncode,0,built.stdout+built.stderr)
            verified=subprocess.run([sys.executable,'verify_deck.py','result.apkg','result.build-report.json','cards.json'],cwd=work,capture_output=True,text=True)
            self.assertEqual(verified.returncode,0,verified.stdout+verified.stderr)
            return json.loads((work/'result.build-report.json').read_text()),json.loads((work/'result.verification.json').read_text())

    def test_term_only_front_builds_and_verifies_without_warnings(self):
        data=self.concept_fixture()
        self.assertEqual(validate(data),[])
        built,verified=self.pipeline_fixture(data)
        self.assertEqual(built['warnings'],[])
        self.assertEqual(verified['warnings'],[])
        self.assertEqual(built['reviewCards'],1)

    def test_qualified_and_abbreviated_terms_are_direct_candidates(self):
        for front in ['DNA polymerase (replication)', 'Massey’s power geometry', 'U.S. dollar', 'U.S.']:
            with self.subTest(front=front):
                data=self.concept_fixture();data['cards'][0]['front']=front
                self.assertEqual(validate(data),[])

    def test_two_blank_definition_note_is_a_direct_card(self):
        data=self.concept_fixture()
        data['cards'][0].update(type='cloze',front='',back='',clozePattern='independent',
            cloze='{{c1::Sample shape::geometry term}} is {{c2::the outline of an object}}.')
        warnings=validate(data)
        self.assertTrue(all('context-poor cloze' in warning for warning in warnings))

    def test_instructor_example_earns_third_review_card(self):
        data=self.concept_fixture()
        data['cards'][0].update(type='cloze',front='',back='',clozePattern='independent',
            cloze='{{c1::Sample shape::geometry term}} is {{c2::the outline of an object}}.')
        example=copy.deepcopy(self.data['cards'][0])
        example.update(id='idea-example',conceptId='sample-shape',targetIds=['sample-shape'],type='application',
            front='A coin is traced on paper. Which property does the tracing show?',back='Sample shape',
            clozePattern=None,cloze='',reinforcementReason="Instructor's own example from the lecture.")
        data['cards'].append(example)
        data['targets'][0]['cardIds']=[c['id'] for c in data['cards']]
        self.assertFalse(any('third review card' in w for w in validate(data)))

    def test_bold_cue_words_render_and_labels_are_one_word(self):
        from build_deck import escape, LABELS
        self.assertEqual(escape('when **new** learning'),'when <b>new</b> learning')
        self.assertEqual(escape('a*b and **'),'a*b and **')
        self.assertEqual(set(LABELS.values()),{'recall','list','why','compare','example','application'})

    def test_bold_inside_a_blank_warns(self):
        data=self.concept_fixture()
        data['cards'][0].update(type='cloze',front='',back='',clozePattern='independent',
            cloze='{{c1::**Sample** shape::geometry term}} is {{c2::the outline of an object}}.')
        self.assertTrue(any('outside the blank' in w for w in validate(data)))

    def test_bare_slide_locator_is_not_source_chatter(self):
        self.assertEqual(source_chatter_warnings('loc',{'Extra':'Slide 14'}),[])
        self.assertTrue(source_chatter_warnings('chat',{'Extra':'The slides say this.'}))

    def test_list_card_key_is_allowed_one_line_per_item(self):
        data=self.concept_fixture()
        data['cards'][0].update(type='process',front='',back='',clozePattern='enumerated-list',listOrdered=False,
            cloze='The 3 sample shapes, in any order, are {{c1::circle}}, {{c1::square}}, and {{c1::triangle}}.',
            explanation='Circle: round, no corners, like a coin\nSquare: four equal sides, like a tile\nTriangle: three sides, like a yield sign')
        self.assertFalse(any('Extra exceeds' in w or 'list key' in w for w in validate(data)))
        data['cards'][0]['explanation']='Circle: '+'very '*20+'round'
        self.assertTrue(any('list key' in w for w in validate(data)))

    def test_unpaired_exemplar_builds_and_verifies_without_warnings(self):
        for direction in ['instance-to-concept','concept-to-instance']:
            with self.subTest(direction=direction):
                data=self.concept_fixture(2);card=data['cards'][1]
                card.update(type='exemplar',exampleDirection=direction,examplePairId='')
                self.assertEqual(validate(data),[])
                built,verified=self.pipeline_fixture(data)
                self.assertEqual(built['warnings'],[])
                self.assertEqual(verified['warnings'],[])

    def test_three_cards_with_named_emphasis_build_cleanly(self):
        data=self.concept_fixture(3)
        self.assertEqual(validate(data),[])
        built,verified=self.pipeline_fixture(data)
        self.assertEqual(built['warnings'],[])
        self.assertEqual(verified['warnings'],[])
        self.assertEqual(built['reviewCards'],3)

    def test_third_card_accepts_the_briefs_emphasis_cues(self):
        for reason in ['Lecturer stressed sample shape in the exam review.',
                       'Said sample shape will be tested.',
                       'Returned to sample shape repeatedly.',
                       'Objective 2: explain sample shape.',
                       'Review sheet item 4: sample shape.',
                       'Student Guide: retain the shape distinction.']:
            with self.subTest(reason=reason):
                data=self.concept_fixture(3);data['cards'][2]['reinforcementReason']=reason
                self.assertEqual(validate(data),[])

    def test_singleton_with_pair_id_needs_no_partner(self):
        data=self.concept_fixture(2)
        data['cards'][1].update(type='exemplar',exampleDirection='instance-to-concept',examplePairId='optional-pair')
        self.assertEqual(validate(data),[])

    def test_third_card_without_named_emphasis_warns_and_verifier_retains_it(self):
        for reason in ['', 'Tests a different angle.']:
            with self.subTest(reason=reason):
                data=self.concept_fixture(3);data['cards'][2]['reinforcementReason']=reason
                warnings=validate(data)
                self.assertEqual(len(warnings),1)
                self.assertIn('sample-shape: third review card',warnings[0])
        built,verified=self.pipeline_fixture(data)
        self.assertEqual(verified['warnings'],built['warnings'])

    def test_four_cards_sharing_concept_fail_before_package_creation(self):
        data=self.concept_fixture(4)
        with self.assertRaisesRegex(ValueError,'sample-shape: more than three'):validate(data)
        with tempfile.TemporaryDirectory() as temp:
            work=Path(temp);(work/'cards.json').write_text(json.dumps(data))
            result=subprocess.run([sys.executable,str(BASE/'build_deck.py'),'cards.json','result.apkg'],cwd=work,capture_output=True,text=True)
            self.assertNotEqual(result.returncode,0)
            self.assertIn('sample-shape: more than three',result.stderr)
            self.assertFalse((work/'result.apkg').exists())

    def test_missing_direct_warns_with_concept_and_reaches_verifier(self):
        data=self.concept_fixture();data['cards'][0].update(type='conceptual',front='Why does the shape matter?')
        warnings=validate(data)
        self.assertEqual(warnings,['sample-shape: no direct term card detected; inspect this concept.'])
        built,verified=self.pipeline_fixture(data)
        self.assertEqual(built['warnings'],warnings)
        self.assertEqual(verified['warnings'],warnings)

    def test_second_card_still_needs_a_distinct_retrieval_reason(self):
        data=self.concept_fixture(2);data['cards'][1]['reinforcementReason']=''
        with self.assertRaisesRegex(ValueError,'idea-1: explain the additional retrieval purpose'):validate(data)

    def test_family_blurt_counts_once_under_its_family_concept(self):
        data=self.concept_fixture(3)
        family=copy.deepcopy(self.data['cards'][7])
        family.update(id='family-overview',conceptId='shape-family',targetIds=['sample-shape','family-target'])
        data['cards'].append(family)
        data['targets'][0]['cardIds'].append(family['id'])
        data['targets'].append({'id':'family-target','topic':'Synthetic','statement':'Recall the family.',
                                'kind':'understand','core':True,'coverage':'tested','cardIds':[family['id']],'reason':''})
        warnings=validate(data)
        self.assertEqual(warnings,['shape-family: no direct term card detected; inspect this concept.'])
        built,verified=self.pipeline_fixture(data)
        self.assertEqual(built['notes'],4)
        self.assertEqual(built['reviewCards'],4)
        self.assertEqual(verified['warnings'],warnings)

    def test_final_hinted_cloze_is_accepted(self):
        data=self.concept_fixture(2);card=data['cards'][1]
        card.update(type='cloze',front='',back='',clozePattern='single',cloze='The sample marker is {{c1::red::color}}.')
        validate(data)

    def test_final_empty_extra_is_accepted(self):
        data=self.concept_fixture();data['cards'][0].update(explanation='',example=None)
        validate(data)

    def test_final_four_review_cards_fail(self):
        data=self.concept_fixture();card=data['cards'][0]
        card.update(type='cloze',front='',back='',clozePattern='independent',cloze='The markers are {{c1::red}}, {{c2::blue}}, {{c3::green}} and {{c4::yellow}}.')
        with self.assertRaisesRegex(ValueError,'more than three'):validate(data)

    def test_final_topic_without_tested_card_fails(self):
        data=self.concept_fixture()
        data['targets'].append({'id':'uncovered','topic':'Untested topic','statement':'Untested content','kind':'watch-for','core':False,'coverage':'extra-only','cardIds':[data['cards'][0]['id']],'reason':'Retained in Extra.'})
        with self.assertRaisesRegex(ValueError,'topic.*tested card'):validate(data)

    def test_review_card_cap_includes_cloze_indices(self):
        data=self.concept_fixture(2);card=data['cards'][1]
        card.update(type='cloze',front='',back='',clozePattern='independent',
                    cloze='The markers are {{c1::red}}, {{c2::blue}}, {{c3::green}} and {{c4::yellow}}.')
        with self.assertRaisesRegex(ValueError,'more than three review cards'):validate(data)

    def test_hinted_cloze_builds_and_creates_two_review_cards(self):
        data=self.concept_fixture(2);card=data['cards'][1]
        card.update(type='cloze',front='',back='',clozePattern='single',cloze='The sample marker is {{c1::red::color}}.')
        built,verified=self.pipeline_fixture(data)
        self.assertEqual(built['reviewCards'],2)
        self.assertEqual(verified['reviewCards'],2)
        self.assertTrue(verified['passed'])

    def test_hint_and_grouped_list_uses_one_review_card(self):
        data=self.concept_fixture(2);card=data['cards'][1]
        card.update(type='process',front='',back='',clozePattern='enumerated-list',listOrdered=True,
                    cloze='The 3 steps are {{c1::open::first step}}, {{c1::read}}, then {{c1::close}}.')
        built,verified=self.pipeline_fixture(data)
        self.assertEqual(built['reviewCards'],2)
        self.assertEqual(verified['reviewCards'],2)

    def test_rejects_empty_extra_hint_and_nested_cloze(self):
        for text in ['The marker is {{c1::red::}}.', 'The marker is {{c1::red::color::extra}}.',
                     'The marker is {{c1::::color}}.', 'The marker is {{c1::{{c2::red}}}}.']:
            with self.subTest(text=text):
                data=self.concept_fixture(2);card=data['cards'][1]
                card.update(type='cloze',front='',back='',clozePattern='single',cloze=text)
                with self.assertRaises(ValueError):validate(data)

    def test_extra_is_one_unlabelled_line_or_warning_not_gate(self):
        data=self.concept_fixture();card=data['cards'][0]
        card['explanation']='Corners meet at the edges.'
        built,verified=self.pipeline_fixture(data)
        self.assertEqual(built['records'][0]['fields']['Extra'],'Corners meet at the edges.')
        self.assertTrue(verified['passed'])
        card['explanation']='A useful caution.'*1+'\n'+' '.join(['word']*21)
        warnings=validate(data)
        self.assertTrue(any('Extra exceeds three short lines' in w for w in warnings))

    def test_watch_for_extra_only_passes_and_requires_actual_extra(self):
        data=self.concept_fixture()
        data['targets'].append({'id':'caution','topic':'Synthetic','statement':'Keep the shape distinction.',
                                'kind':'watch-for','core':True,'coverage':'extra-only','cardIds':['idea-0'],'reason':'Caution retained in Extra.'})
        self.assertEqual(validate(data),[])
        built,verified=self.pipeline_fixture(data)
        self.assertTrue(verified['passed'])
        data['cards'][0].update(explanation='',example=None)
        with self.assertRaisesRegex(ValueError,'nonempty Extra line'):validate(data)

    def test_extra_only_caution_cannot_credit_an_unrelated_picture(self):
        data=self.concept_fixture();data['cards'][0].update(explanation='',example=None,extraImages=self.data['cards'][-1]['frontImages'])
        data['targets'].append({'id':'caution','topic':'Synthetic','statement':'Keep the distinction.',
                                'kind':'watch-for','core':True,'coverage':'extra-only','cardIds':['idea-0'],'reason':'Claims caution in picture.'})
        with self.assertRaisesRegex(ValueError,'nonempty Extra line'):validate(data)

    def test_understand_and_skill_cannot_be_extra_only_or_missing(self):
        for kind in ['understand']:
            for coverage in ['extra-only','missing']:
                with self.subTest(kind=kind,coverage=coverage):
                    data=self.concept_fixture()
                    data['targets'].append({'id':'required','topic':'Synthetic','statement':'Required target.',
                                            'kind':kind,'core':False,'coverage':coverage,
                                            'cardIds':['idea-0'] if coverage == 'extra-only' else [],'reason':'Not tested.'})
                    with self.assertRaisesRegex(ValueError,'needs a tested card'):validate(data)

    def test_coverage_exception_only_keeps_indispensable_single_review_notes(self):
        data=self.concept_fixture(4)
        data['targets']=[]
        for i,card in enumerate(data['cards']):
            tid=f'unique-{i}';card['targetIds']=[tid]
            data['targets'].append({'id':tid,'topic':'Synthetic','statement':f'Distinct required skill {i}.',
                                    'kind':'understand','core':True,'coverage':'tested','cardIds':[card['id']],'reason':''})
        data['coverageExceptions']=[{'conceptId':'sample-shape','targetIds':[t['id'] for t in data['targets']],
                                     'reason':'Each single-review note retains the only tested card for its required skill.'}]
        warnings=validate(data)
        self.assertTrue(any('coverage exception keeps 4 review cards' in w for w in warnings))
        data['targets'][-1].update(kind='watch-for',topic='Essential tested caution')
        self.assertTrue(any('coverage exception keeps 4 review cards' in w for w in validate(data)))
        built,verified=self.pipeline_fixture(data)
        self.assertEqual(built['reviewCards'],4)
        self.assertEqual(built['coverageExceptions'],data['coverageExceptions'])
        self.assertTrue(verified['passed'])
        data['cards'][1]['targetIds'].append('unique-0');data['targets'][0]['cardIds'].append('idea-1')
        with self.assertRaisesRegex(ValueError,'not sole coverage'):validate(data)

    def test_multi_index_cloze_cannot_claim_a_coverage_exception(self):
        data=self.concept_fixture();card=data['cards'][0]
        card.update(type='cloze',front='',back='',clozePattern='independent',
                    cloze='The markers are {{c1::red}}, {{c2::blue}}, {{c3::green}} and {{c4::yellow}}.')
        data['coverageExceptions']=[{'conceptId':'sample-shape','targetIds':['sample-shape'],'reason':'Claims four cards are needed.'}]
        with self.assertRaisesRegex(ValueError,'single-review notes'):validate(data)

    def test_repeated_required_answer_same_idea_is_rejected(self):
        data=self.concept_fixture(2);data['cards'][1]['back']=data['cards'][0]['back']
        with self.assertRaisesRegex(ValueError,'exact repeated required answer'):validate(data)

    def test_at_most_one_scenario_or_example_per_idea(self):
        data=self.concept_fixture(3)
        data['cards'][1]['type']='application'
        data['cards'][2].update(type='exemplar',exampleDirection='concept-to-instance')
        with self.assertRaisesRegex(ValueError,'at most one scenario'):validate(data)

    def combined_fixture(self, count=2):
        data=self.concept_fixture();card=data['cards'][0]
        names=['Alpha','Beta','Gamma','Delta','Epsilon'][:count]
        meanings=['learn the input','keep the input','use the input','check the input','share the input'][:count]
        card.update(type='comparison',front=' vs. '.join(names),back='\n'.join(f'{n}: {m}.' for n,m in zip(names,meanings)),axis='role')
        for i,(name,meaning) in enumerate(zip(names,meanings)):
            tid=f'term-{i}';card['targetIds'].append(tid)
            data['targets'].append({'id':tid,'topic':'Synthetic','statement':f'Term: {name}',
                                    'kind':'understand','core':True,'coverage':'tested','cardIds':[card['id']],
                                    'reason':f'Meaning: {meaning}'})
        return data

    def test_scenario_nonconclusion_is_flagged_and_reaches_verifier(self):
        data=self.concept_fixture(2);data['cards'][1].update(type='application',back='Nothing can be concluded.')
        warnings=validate(data)
        self.assertTrue(any('scenario answer is a non-conclusion' in w for w in warnings))
        built,verified=self.pipeline_fixture(data)
        self.assertEqual(verified['warnings'],built['warnings'])

    def test_definition_hedge_tail_and_dense_back_are_flagged(self):
        data=self.concept_fixture();data['cards'][0]['back']='A fading trace, which cannot be established from a delay alone.'
        self.assertTrue(any('definition has a hedge tail' in w for w in validate(data)))
        data['cards'][0]['back']='Directing attention within limits of capacity, processing efficiency, and relevant knowledge.'
        self.assertTrue(any('plain-words friend test' in w for w in validate(data)))
        data['cards'][0]['back']='A factor that may contribute to learning.'
        self.assertEqual(validate(data),[])

    def test_combined_meanings_build_and_missing_meaning_fails(self):
        data=self.combined_fixture()
        self.assertEqual(validate(data),[])
        built,verified=self.pipeline_fixture(data)
        self.assertEqual(built['reviewCards'],1)
        self.assertEqual(verified['warnings'],[])
        data['cards'][0]['back']='Alpha: learn the input. Beta.'
        data['cards'][0]['explanation']='Beta: keep the input.'
        with self.assertRaisesRegex(ValueError,'term-1: named term Beta loses its required meaning'):validate(data)

    def test_single_meaning_blank_builds_but_name_only_does_not_cover_a_definition(self):
        data=self.combined_fixture(1)
        data['cards'][0].update(type='cloze',front='',back='',axis='',clozePattern='single',
            cloze='For this synthetic concept, Alpha means {{c1::learn the input}}.')
        self.assertEqual(validate(data),[])
        built,verified=self.pipeline_fixture(data)
        self.assertEqual(built['reviewCards'],1)
        self.assertEqual(verified['warnings'],[])
        data['cards'][0]['cloze']='{{c1::Alpha::term}} means learn the input.'
        with self.assertRaisesRegex(ValueError,'term has no definition-recall card'):validate(data)

    def add_member_meaning_notes(self, data):
        for target in [t for t in data['targets'] if t['statement'].startswith('Term: ')]:
            name=target['statement'].split(': ',1)[1];meaning=target['reason'].split(': ',1)[1]
            card=copy.deepcopy(data['cards'][0]);cid='meaning-'+target['id']
            card.update(id=cid,conceptId=cid,targetIds=[target['id']],type='cloze',front='',back='',axis='',
                clozePattern='single',listOrdered=None,cloze=f'For this synthetic concept, {name} means {{{{c1::{meaning}}}}}.')
            data['cards'].append(card);target['cardIds'].append(cid)

    def test_simple_opposite_meanings_share_one_card_and_keep_both_term_witnesses(self):
        data=self.combined_fixture(2)
        data['cards'][0].update(type='cloze',front='',back='',axis='',clozePattern='single',
            cloze='Positive regulators {{c1::promote cell-cycle progression}}; negative regulators {{c1::restrain cell-cycle progression}}.')
        for target,name,meaning in zip([t for t in data['targets'] if t['statement'].startswith('Term: ')],
                ['Positive regulators','negative regulators'],
                ['promote cell-cycle progression','restrain cell-cycle progression']):
            target.update(statement='Term: '+name,reason='Meaning: '+meaning)
        self.assertEqual(validate(data),[])
        built,verified=self.pipeline_fixture(data)
        self.assertEqual(built['notes'],1)
        self.assertEqual(built['reviewCards'],1)
        self.assertEqual(verified['warnings'],[])
        data['cards'][0]['cloze']='Positive regulators {{c1::promote cell-cycle progression}}; negative regulators.'
        with self.assertRaisesRegex(ValueError,'loses its required meaning'):validate(data)

    def test_headline_non_opposite_pair_uses_meanings_then_separate_names(self):
        data=self.combined_fixture(2)
        first=data['cards'][0]
        first.update(type='cloze',front='',back='',axis='non-opposite: Alpha | Beta',
                     clozePattern='single',cloze='For these two memory tasks, Alpha means {{c1::learn the input}}; Beta means {{c1::keep the input}}.')
        for index,(name,meaning) in enumerate([('Alpha','learn the input'),('Beta','keep the input')]):
            card=copy.deepcopy(first);cid='name-'+name.lower()
            card.update(id=cid,targetIds=[data['targets'][index]['id']],
                        cloze='For this memory task, {{c1::'+name+'}} means '+meaning+'.',
                        reinforcementReason='Retrieves the name from its meaning, distinct from producing the meaning.')
            data['cards'].append(card);data['targets'][index]['cardIds'].append(cid)
        self.assertEqual(validate(data),[])
        built,verified=self.pipeline_fixture(data)
        self.assertEqual(built['reviewCards'],3)
        self.assertEqual(verified['warnings'],[])
        # The approved sourced example is the only route to a fourth review here.
        example=copy.deepcopy(first)
        example.update(id='source-example',type='application',axis='',clozePattern=None,cloze='',
                       front='A source task introduces a new input. Which memory task is demonstrated?',back='Alpha',
                       targetIds=[data['targets'][0]['id']],reinforcementReason="Instructor's own example from the lecture.")
        data['cards'].append(example);data['targets'][0]['cardIds'].append(example['id'])
        validate(data)
        built,verified=self.pipeline_fixture(data)
        self.assertEqual(built['reviewCards'],4)
        # A one-blank instructor example may recall the same term from its distinct situation.
        example.update(type='cloze',front='',back='',clozePattern='single',
                       cloze='The source task introducing a new input illustrates {{c1::Alpha}}.')
        validate(data)
        example['reinforcementReason']='An invented scenario for practice.'
        with self.assertRaisesRegex(ValueError,'more than three'):validate(data)

    def test_new_direct_shapes_still_require_the_recorded_meaning(self):
        data=self.combined_fixture(1)
        data['cards'][0].update(type='cloze',front='',back='',axis='',clozePattern='single',cloze='{{c1::Alpha::term}}.')
        with self.assertRaisesRegex(ValueError,'loses its required meaning'):validate(data)

    def test_combined_group_larger_than_four_warns(self):
        data=self.combined_fixture(5)
        self.assertTrue(any('combined group has 5 terms' in w for w in validate(data)))

    def test_ordered_list_needs_member_definition_recall_notes(self):
        data=self.combined_fixture(3);card=data['cards'][0]
        card.update(type='process',front='',back='',axis='',clozePattern='enumerated-list',listOrdered=True,
                    cloze='The 3 steps are {{c1::Alpha}} (learn the input), {{c1::Beta}} (keep the input), {{c1::Gamma}} (use the input).')
        with self.assertRaisesRegex(ValueError,'term has no definition-recall card'):validate(data)
        self.add_member_meaning_notes(data)
        self.assertEqual(validate(data),[])
        built,verified=self.pipeline_fixture(data)
        self.assertEqual(built['reviewCards'],4)
        self.assertEqual(verified['warnings'],[])

    def test_hedge_only_skill_can_be_omitted_without_losing_understand_or_topic(self):
        data=self.concept_fixture()
        data['targets'].append({'id':'hedge','topic':'Synthetic','statement':'Do not conclude a cause from one failed recall.',
                                'kind':'be-able-to-do','core':False,'coverage':'missing','cardIds':[],
                                'reason':'hedge-only: untested caution intentionally omitted; related concept remains tested.'})
        self.assertEqual(validate(data),[])
        data['targets'][-1]['reason']='We removed a genuine skill to lower the count.'
        with self.assertRaisesRegex(ValueError,'only an explicitly recorded hedge-only skill'):validate(data)

    def test_all_concrete_prompt_hints_are_categories_without_answer_options(self):
        from pair_rules import validate_pair_rules
        prompt=(BASE.parents[2]/'src/lib/academics/flashcards/instructions.md').read_text()
        hints=0
        for match in re.finditer(r'\{\{c[1-9][0-9]*::([^{}]+)\}\}',prompt):
            if '::' not in match[1]:continue
            hints+=1
            validate_pair_rules({'cloze':match[0],'axis':''},{})
        self.assertGreater(hints,0)
        self.assertIn('{{c2::inactivates::effect on Rb}}',prompt)

    def test_embedded_files_and_actual_package_roundtrip(self):
        prompt=(BASE.parents[2]/'src/lib/academics/flashcards/instructions.md').read_text()
        blocks=dict(re.findall(r'### File: ([^\n]+)\n\n```[^\n]+\n(.*?)\n```',prompt,re.S))
        names=['cards.schema.json','card-styles.css','requirements.txt','list-reveal.js','image_occlusion.py','prepare_occlusion.py','read_previous.py','pair_rules.py','build_deck.py','verify_deck.py']
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
