# -*- coding: utf-8 -*-
# premedOS flashcards-v1 (5th revision) - PSYC101 Chapter 2
# The Research Enterprise in Psychology
# preset: premedos-default | sourceMode: SOURCE_PLUS_CLARIFICATION
#
# SCOPE: lectured material only (Andy's ruling). She stopped after the control
# group and finishes Thursday. Case studies, statistics and ethics are in the
# textbook but not yet lectured, so they are out.
#
# CONCEPT MAP (Pass 1) ------------------------------------------------------
# Spine: how do you get from a belief to a conclusion you can trust, and what
# can go wrong at each step? Everything after the four steps is either a threat
# to that trust or a tool for reducing it.
#
# set 1  the scientific method        axis: sequence
# set 2  measurement quality          axis: consistency (reliability) vs accuracy (validity)
#          reliability splits on WHAT VARIES: observers (inter-rater) or occasions (test-retest)
#          validity splits on WHERE THE DOUBT IS: inside the study (internal) or outside it (external)
# set 3  methods of gathering data    axis: what you ASK vs what you WATCH
# set 4  research designs             axis: can you infer cause?
#
# Textbook is supplemental only (Andy's ruling): its studies supply EXAMPLES in
# Extra and scenarios for exemplar cards; tested targets come from the lecture.

N = None
CARDS = []
def card(**k): CARDS.append(k)

T = 'lecture-02 transcript'
H = 'Chapter_2 handwritten notes'
B = 'Weiten, Psychology 11e, Ch 2'

# ══════════════════════════════════════════════════════════════════════════
# 1 - THE SCIENTIFIC METHOD
# ══════════════════════════════════════════════════════════════════════════

card(ct='FREE_RECALL', cid='the scientific method', kind='framework',
     sal='load-bearing', d=3, n=4,
     f='BLURT: the four steps of the scientific method as she taught them. 4 things to hit.',
     items=[
       'Choose a research question, meaning the phenomenon you want to understand.',
       'Formulate a hypothesis, which is an educated guess about what the answer will be.',
       'Test the hypothesis by gathering evidence that could support or undercut it.',
       'Draw a conclusion from what the evidence actually showed.'],
     ex='Her worked example ran all four: does watching a lot of violent TV lead to aggressive behavior in children? She predicted yes, proposed comparing a heavy-viewing group against a light-viewing group and measuring aggression a year later, then concluded from the difference between them.',
     src=f'{T} 07:12-11:11 | {H} p.1')

card(ct='CLOZE', cp='definition', cid='hypothesis', sal='load-bearing', d=3,
     cz='A hypothesis is {{c1::a tentative statement about the relationship between two or more variables}}.',
     ex='She put it more plainly as an educated guess about what the question\'s answer will be. Her example: children exposed to a lot of violent TV are more likely to display aggressive behavior.',
     src=f'{T} 08:47-09:16 | {H} p.1 | {B} p.34')

card(ct='CLOZE', cp='definition', cid='variables', sal='load-bearing', d=3,
     cz='Variables are {{c1::any measurable conditions, events, characteristics, or behaviors that are controlled or observed in a study}}.',
     ex='In a study of whether time pressure lowers the accuracy of time perception, the variables are time pressure and accuracy of time perception.',
     src=f'{B} p.34')

card(ct='EXEMPLAR', dir='concept-to-instance', cid='the scientific method', sal='attaching', d=2,
     f='She walked the class through one worked example of all four steps. What was the research question?',
     b='Whether children who watch a lot of violent TV go on to show more aggressive behavior.',
     ex='The class then generated its own: do children who were bullied when young become less social as adults?',
     src=f'{T} 08:06-08:47, 11:39-12:05')

card(ct='EXEMPLAR', dir='instance-to-concept', cid='the scientific method', sal='load-bearing', d=3,
     f='A researcher writes down that children exposed to a lot of violent TV will be more likely to behave aggressively. Which step is this, and what is the statement called?',
     b='This is step two. The statement is the hypothesis, an educated guess about what the answer will be.',
     ex='Notice that it is written before any data are collected. A prediction made after seeing the results is not a hypothesis.',
     src=f'{T} 08:47-09:16')

card(ct='APPLICATION', cid='the scientific method', sal='load-bearing', d=3,
     f='A student wants to know whether children who were bullied become less social later. Classmates suggest watching kids in a school without interfering, and following the same kids for years. Name both approaches.',
     b='Watching without interfering is naturalistic observation. Following the same people over time is a longitudinal study.',
     ex='This was the class-generated example. She accepted several proposals at once, including asking teachers and mentors, since a single question can be tested many ways.',
     src=f'{T} 11:39-14:47')

card(ct='CONCEPTUAL', rel=True, cid='scientific method step count', sal='attaching', d=3,
     f='She taught four steps in the scientific method and the textbook lists five. Where do the two accounts differ?',
     b='She combines designing the study and collecting the data into one testing step, and stops at drawing a conclusion. The textbook splits testing into two steps and adds reporting the findings as a fifth.',
     ex='Answer hers unless a question names the textbook. The textbook\'s five: formulate a testable hypothesis, select the method and design the study, collect the data, analyze the data and draw conclusions, report the findings. Its worked example is Elliot and Niesta (2008), who photographed the same woman in a red versus blue blouse and found men rated her as more sexually desirable in red.',
     src=f'{T} 08:06-11:11 | {B} pp.34-37')

# ══════════════════════════════════════════════════════════════════════════
# 2 - RELIABILITY
# ══════════════════════════════════════════════════════════════════════════

card(ct='FREE_RECALL', cid='reliability', kind='framework', sal='load-bearing', d=4, n=3,
     f='BLURT: reliability. 3 things to hit.',
     items=[
       'Reliability is the extent to which independent measures of a behavior are consistent.',
       'Inter-rater reliability asks whether two or more people watching the same behavior agree on what they saw.',
       'Test-retest reliability asks whether one person performs similarly when measured on two or more separate occasions.'],
     ex='She reduced the whole idea to one word: consistency. Her two examples were the Play-Doh coding disagreement for inter-rater, and giving the same intelligence test on two different Tuesdays for test-retest.',
     src=f'{T} 16:16-24:22 | {H} p.1')

card(ct='CLOZE', cp='definition', cid='reliability', sal='load-bearing', d=3,
     cz='Reliability is {{c1::the extent to which independent measures of a behavior are consistent}}.',
     ex='If you want one word for it, she said, reliability is consistency.',
     src=f'{T} 16:33-16:52 | {H} p.1')

card(ct='CLOZE', cp='definition', cid='inter-rater reliability', sal='load-bearing', d=4,
     cz='Inter-rater reliability is {{c1::the degree to which two or more people who observe the same behavior agree on what they saw}}.',
     ex='Her example: research assistants coding a video of a parent tapping a child on the head during a Play-Doh task. Some scored it as harsh, others as playful. That disagreement is inter-rater reliability failing.',
     src=f'{T} 17:05-22:15 | {H} p.1')

card(ct='CLOZE', cp='definition', cid='test-retest reliability', sal='load-bearing', d=4,
     cz='Test-retest reliability is {{c1::the similarity of one person\'s performance or behavior measured on two or more separate occasions}}.',
     ex='Her example: give the same intelligence test on one Tuesday and again on a later Tuesday. The two scores should come out very similar.',
     src=f'{T} 22:40-24:22 | {H} p.1')

card(ct='COMPARISON', cp='independent', ax='what varies between the two measurements',
     cid='inter-rater vs test-retest', sal='load-bearing', d=5,
     cz='Inter-rater reliability varies {{c1::who is doing the observing, holding the behavior fixed}}; test-retest reliability varies {{c2::when the measurement is taken, holding the person fixed}}.',
     ex='This is the pair your handwritten notes cross. Yours attaches "degree to which on 1+ occasion" to inter-rater, which is the test-retest idea. Inter-rater is about people disagreeing; test-retest is about time passing.',
     src=f'{T} 17:05-24:22 | {H} p.1')

card(ct='EXEMPLAR', dir='instance-to-concept', cid='inter-rater reliability', sal='load-bearing', d=4,
     f='Families are recorded doing a Play-Doh task. When a parent taps the child on the head, one research assistant codes it as harsh and another codes it as playful. Which kind of reliability just failed?',
     b='Inter-rater reliability failed. Two observers watched the same behavior and disagreed about what it was, so the coding cannot be trusted.',
     ex='This happened in her graduate school professor\'s study of parental warmth and intrusiveness. She polled the class and got the same split, which was the point.',
     src=f'{T} 18:15-22:15')

card(ct='EXEMPLAR', dir='concept-to-instance', cid='test-retest reliability', sal='attaching', d=2,
     f='Test-retest reliability asks whether one person scores similarly on two occasions. What example did she use in class?',
     b='Giving the same intelligence test on one Tuesday and again on a later Tuesday, and expecting the two scores to be very similar.',
     ex='She noted the limit: some traits genuinely change fast, and for those a low retest correlation is not evidence of a bad measure.',
     src=f'{T} 22:40-24:22')

card(ct='CONCEPTUAL', cid='test-retest reliability', sal='load-bearing', d=4,
     f='Test-retest reliability assumes something about the thing being measured. What is that assumption?',
     b='That the trait is not expected to change much over the interval between measurements. Where a trait genuinely shifts fast, a low retest score does not condemn the measure.',
     ex='Intelligence is her example of something stable enough for this to work. Mood across a month would not be.',
     src=f'{T} 24:08-24:22')

card(ct='CONCEPTUAL', rel=True, cid='inter-rater reliability', sal='load-bearing', d=4,
     f='Before two observers can agree on whether a behavior occurred, what must the researcher supply first?',
     b='A clear operational definition of the behavior, so that both observers are counting the same thing rather than applying private standards.',
     ex='She hit this later in the lecture: after telling the class to count "acts of aggression" in a video she realized she had never said what counted as one. Your notes put it as "relies on our definition."',
     src=f'{T} 01:01:13-01:02:31 | {H} p.1')

# ══════════════════════════════════════════════════════════════════════════
# 3 - VALIDITY
# ══════════════════════════════════════════════════════════════════════════

card(ct='FREE_RECALL', cid='validity', kind='framework', sal='load-bearing', d=4, n=3,
     f='BLURT: validity. 3 things to hit.',
     items=[
       'Validity asks whether a measure actually tests what it is supposed to measure.',
       'Internal validity means the result can be attributed to the variable the researcher intentionally manipulated, and not to some other variable.',
       'External validity means the result can be generalized beyond the single research investigation.'],
     ex='Her two stories: the Kumon neighbor for internal validity, and publishing findings from one 8am PSYC 101 class as though they held for all US college students for external validity.',
     src=f'{T} 24:30-37:07 | {H} p.1')

card(ct='CLOZE', cp='definition', cid='validity', sal='load-bearing', d=3,
     cz='Validity asks {{c1::whether a measure actually tests what it is supposed to measure}}.',
     ex='Her framing: if you say you are measuring aggression, you need to be sure the thing you captured is aggression and not something adjacent. Intelligence and memory overlap, so a test meant for one can accidentally measure the other.',
     src=f'{T} 24:30-25:15 | {H} p.1')

card(ct='CLOZE', cp='definition', cid='internal validity', sal='load-bearing', d=4,
     cz='Internal validity is {{c1::the extent to which results can be attributed to the variable the researcher intentionally manipulated rather than to some other variable}}.',
     ex='Her Kumon story is the failure case. Her neighbor\'s child improved after Kumon and hers did not, but the two children differ in teachers, tutoring center, home practice, and temperament, so nothing can be pinned on Kumon.',
     src=f'{T} 25:15-34:04 | {H} p.1')

card(ct='CLOZE', cp='definition', cid='external validity', sal='load-bearing', d=4,
     cz='External validity is {{c1::the extent to which results can be generalized beyond the single research investigation}}.',
     ex='Her failure case: running a study on her own 8am PSYC 101 section and publishing it as relevant to all college students in the United States.',
     src=f'{T} 34:04-37:07 | {H} p.1')

card(ct='COMPARISON', cp='independent', ax='where the doubt sits, inside the study or outside it',
     cid='internal vs external validity', sal='load-bearing', d=4,
     cz='Internal validity asks whether the result came from {{c1::the variable you actually manipulated rather than from something else}}; external validity asks whether the result {{c2::holds for people beyond the ones you studied}}.',
     ex='Internal is a question about your own study. External is a question about everyone who was not in it.',
     src=f'{T} 25:15-37:07')

card(ct='COMPARISON', rel=True, ax='consistency versus accuracy',
     cid='reliability vs validity', sal='load-bearing', d=5,
     f='A measure can be reliable without being valid. Explain how, using what each term means.',
     b='Reliability only asks whether the measure gives consistent results. A measure can be perfectly consistent and still be measuring the wrong thing, which is what validity asks about.',
     ex='As an analogy: a bathroom scale that reads 150 pounds every time you step on it is perfectly reliable, and if you actually weigh 165 it is not valid at all. Her own version was measuring memory when you claim to be measuring intelligence.',
     src=f'{T} 16:16-25:15 | {H} p.1')

card(ct='EXEMPLAR', dir='instance-to-concept', cid='internal validity', sal='load-bearing', d=4,
     f='Her neighbor sent a child to Kumon and his grades rose sharply. She sent her own child and saw no improvement. Why can she not conclude that Kumon does not work?',
     b='Too many other variables differ between the two children, so no outcome can be attributed to Kumon alone. That is a failure of internal validity.',
     ex='The class listed candidates: different teachers, a different Kumon center, whether the parent enforces practice at home, and the children\'s own traits and environments. The textbook calls this a confounding of variables.',
     src=f'{T} 25:15-34:04')

card(ct='CLOZE', cp='definition', cid='confounding of variables', sal='load-bearing', d=4,
     cz='A confounding of variables occurs when {{c1::two variables are linked in a way that makes it difficult to sort out their specific effects}}.',
     ex='Your notes have it as "minimizing confounding variables." The textbook\'s example: in Schachter\'s affiliation study, if one group happened to be more sociable than the other, sociability and anxiety would be confounded and neither could be credited with the result.',
     src=f'{H} p.1 | {B} p.41')

card(ct='EXEMPLAR', dir='instance-to-concept', cid='external validity', sal='load-bearing', d=4,
     f='She runs a study on her 8am PSYC 101 section and publishes findings she says apply to all college students in the United States. What is wrong with the claim?',
     b='One section at one university cannot represent college students nationally, so the study has no external validity for that population.',
     ex='Her aside was that the class is unusually distinctive, which is exactly the problem. Studies that need to generalize recruit a sample chosen to represent the target population.',
     src=f'{T} 34:04-37:07')

card(ct='CONCEPTUAL', cid='external validity', sal='load-bearing', d=3,
     f='Why do researchers care whether their results generalize beyond the people they studied?',
     b='Because the goal is usually to say something about a larger population, and a finding that holds only for the sample cannot support that claim.',
     ex='She noted this is not universal. Some studies deliberately target one group, and there external validity matters much less.',
     src=f'{T} 34:19-34:49')

# ══════════════════════════════════════════════════════════════════════════
# 4 - METHODS OF GATHERING DATA (taxonomy)
# ══════════════════════════════════════════════════════════════════════════

card(ct='FREE_RECALL', cid='methods of gathering data', kind='framework',
     sal='load-bearing', d=3, n=3,
     f='BLURT: the methods of gathering data she listed. 3 things to hit.',
     items=[
       'Interviews, which split into structured interviews and clinical interviews.',
       'Surveys, which in written form are called questionnaires.',
       'Observations, which split into naturalistic observation and structured observation.'],
     ex='She said outright that this structure is important to remember. Everything under it answers how you collect data, not how you design the study.',
     src=f'{T} 37:12-37:45 | {H} p.1')

card(ct='COMPARISON', rel=True, ax='structuring the study versus collecting the data',
     cid='design vs method', sal='load-bearing', d=4,
     f='She warned the class against confusing two things in this chapter. What are they, and what does each one answer?',
     b='Research designs and methods of gathering data. A design answers how you structure the study; a method answers how you collect the data. Any collection method can be used inside any design.',
     ex='She said it twice, which makes it about as clear an exam signal as the lecture gives. Correlational and experimental are designs. Interviews, surveys, and observations are methods.',
     src=f'{T} 01:03:48-01:04:27 | {H} p.2')

# ══════════════════════════════════════════════════════════════════════════
# 5 - INTERVIEWS
# ══════════════════════════════════════════════════════════════════════════

card(ct='CLOZE', cp='definition', cid='structured interview', sal='load-bearing', d=3,
     cz='In a structured interview, {{c1::every participant is asked and answers the same set of questions}}.',
     ex='She described walking in and asking every single person the identical question in the identical order.',
     src=f'{T} 37:54-38:33 | {H} p.1')

card(ct='CLOZE', cp='definition', cid='clinical interview', sal='load-bearing', d=3,
     cz='In a clinical interview, {{c1::the questions are adjusted based on the answers the person being interviewed gives}}.',
     ex='Her version: you start with something planned, and it can change significantly depending on what your participant says.',
     src=f'{T} 38:33-39:11 | {H} p.1')

card(ct='COMPARISON', cp='independent', ax='whether the question set is fixed or adapts',
     cid='structured vs clinical interview', sal='load-bearing', d=4,
     cz='A structured interview keeps {{c1::the same question set for every participant}}; a clinical interview {{c2::adapts its questions to each person\'s answers}}.',
     ex='The tradeoff runs straight off this axis: fixed questions compare cleanly, adaptive questions go deeper.',
     src=f'{T} 37:54-39:11')

card(ct='CONCEPTUAL', rel=True, cid='structured interview', sal='load-bearing', d=3,
     f='What does a structured interview buy you that a clinical interview does not?',
     b='Direct comparison across participants. Because everyone answered the same questions, the responses line up and the data analysis is far easier.',
     ex='A student gave exactly this answer in class and she took it as the main strength.',
     src=f'{T} 39:36-40:02')

card(ct='CONCEPTUAL', rel=True, cid='clinical interview', sal='load-bearing', d=3,
     f='What does a clinical interview buy you that a structured interview does not?',
     b='Depth on the individual. You can follow up on what the person actually said instead of being locked into a fixed list.',
     ex='The class named two costs against it: the data are hard to combine when different people answered different questions, and a finding can be so specific to one person that it does not generalize.',
     src=f'{T} 40:04-42:04')

card(ct='CLOZE', cp='definition', cid='self-report', sal='load-bearing', d=3,
     cz='A self-report interview is one in which {{c1::the person being interviewed supplies the information about themselves}}.',
     ex='She contrasted it with collecting reports from other people about the same person, such as family members or employers.',
     src=f'{T} 42:04-43:31')

card(ct='FREE_RECALL', cid='self-report problems', kind='framework', sal='load-bearing', d=4, n=4,
     f='BLURT: what goes wrong with self-report, and the workaround. 4 things to hit.',
     items=[
       'Social desirability means people avoid reporting things that make them look bad.',
       'Memory for past events and feelings is often inaccurate, so reports about the past can be wrong.',
       'People predict their own future behavior poorly, so hypothetical questions give unreliable answers.',
       'The workaround is to collect reports from other people, such as family members or employers.'],
     ex='On the third point she said we think we know how we would behave, but we are not actually good at it.',
     src=f'{T} 42:31-45:02 | {H} p.1')

card(ct='CLOZE', cp='definition', cid='social desirability', sal='load-bearing', d=3,
     cz='Social desirability is {{c1::the tendency to answer in a way that makes you look good rather than in a way that is accurate}}.',
     ex='Her survey example: high schoolers asked about risky behavior who realize that admitting something leads to follow-up questions, and answer no instead.',
     src=f'{T} 44:11-44:28, 50:10-50:45')

# ══════════════════════════════════════════════════════════════════════════
# 6 - SURVEYS
# ══════════════════════════════════════════════════════════════════════════

card(ct='CLOZE', cp='definition', cid='questionnaire', sal='load-bearing', d=3,
     cz='A questionnaire is {{c1::a survey in written form, in which people respond to a fixed set of items, often on a scale}}.',
     ex='Her example scale: how many hours a week do you watch TV, answered as zero to five, six to ten, or more than ten. Surveys can also run by phone, by mail, at your door, or by someone stopping you at the mall.',
     src=f'{T} 45:02-47:33 | {H} p.1')

card(ct='FREE_RECALL', cid='survey tradeoffs', kind='framework', sal='load-bearing', d=4, n=6,
     f='BLURT: surveys, three advantages and three disadvantages. 6 things to hit.',
     items=[
       'Advantage: the researcher controls the environment in which the survey is taken.',
       'Advantage: surveys are completed faster than most other data collection methods.',
       'Advantage: response rates tend to be high compared with other methods.',
       'Disadvantage: respondents can stop partway through and the researcher cannot stop them.',
       'Disadvantage: respondents can read the whole questionnaire before answering anything.',
       'Disadvantage: respondents cannot ask for clarification when a question is unclear.'],
     ex='Her control example: walking a questionnaire into a classroom of adolescents who are all seated and answering the same items at the same time.',
     src=f'{T} 47:33-51:25 | {H} p.1')

card(ct='CONCEPTUAL', cid='survey tradeoffs', sal='load-bearing', d=4,
     f='Why is it a problem if a respondent reads an entire questionnaire before answering any of it?',
     b='They can see what the researcher is looking for and shape their answers to fit, instead of answering each item on its own.',
     ex='A student in class put it as being able to predict what is coming and adjust accordingly.',
     src=f'{T} 49:17-50:45')

card(ct='EXEMPLAR', dir='instance-to-concept', cid='survey tradeoffs', sal='load-bearing', d=4,
     f='High schoolers are surveyed about risky behavior. One sees that answering yes to the first item leads to several follow-up questions, so he answers no instead. Which survey disadvantage is this?',
     b='Respondents reading the whole questionnaire before answering, which lets them shape responses to dodge follow-ups or to look better.',
     ex='Social desirability is doing work here too. He is avoiding both the extra questions and the impression the honest answer would make. She noted anonymity is one reason surveys can help with this.',
     src=f'{T} 50:10-50:59')

card(ct='EXEMPLAR', dir='concept-to-instance', cid='survey tradeoffs', sal='attaching', d=3,
     f='Respondents not being able to ask for clarification is one survey disadvantage. What example did she use for why researchers refuse to clarify?',
     b='A child asks a research assistant what a question means, and the assistant only says to answer as best they can.',
     ex='Explaining the item would shape the response, so the explanation itself would become an uncontrolled influence on the data.',
     src=f'{T} 46:31-47:11')

# ══════════════════════════════════════════════════════════════════════════
# 7 - OBSERVATIONS
# ══════════════════════════════════════════════════════════════════════════

card(ct='CLOZE', cp='definition', cid='naturalistic observation', sal='load-bearing', d=4,
     cz='In naturalistic observation, {{c1::a researcher carefully observes behavior in its natural setting without intervening with the subjects}}.',
     ex='Her example: watching how college students behave in an early morning class, in that class rather than in a lab. The textbook adds Jane Goodall\'s years observing chimpanzee social life, and a study where 33 mothers wore audio recorders in the evening, which found children misbehaved again within ten minutes 73 percent of the time they were spanked.',
     src=f'{T} 51:53-52:26 | {H} p.2 | {B} pp.46-47')

card(ct='CLOZE', cp='definition', cid='structured observation', sal='load-bearing', d=4,
     cz='In structured observation, {{c1::people are presented with an identical situation and their behavior is recorded}}.',
     ex='Her example is the Play-Doh task: families came into the lab, one parent and one child made Play-Doh together with only instructions, and graduate students coded the video for warmth, intrusiveness and control.',
     src=f'{T} 01:02:31-01:03:00 | {H} p.2')

card(ct='COMPARISON', cp='independent', ax='who controls the situation being observed',
     cid='naturalistic vs structured observation', sal='load-bearing', d=4,
     cz='Naturalistic observation takes the situation {{c1::as it naturally occurs, with no interference from the researcher}}; structured observation {{c2::creates one identical situation and records what everyone does in it}}.',
     ex='The tradeoff: natural settings cost you control, controlled settings cost you naturalness, since people know they are being watched.',
     src=f'{T} 51:53-01:03:47')

card(ct='EXEMPLAR', dir='instance-to-concept', cid='structured observation', sal='load-bearing', d=3,
     f='Families are invited into a lab, handed Play-Doh with instructions, and recorded on video while researchers score parental warmth and intrusiveness. Which type of observation is this?',
     b='Structured observation. Every family faces the same task, and their behavior is recorded and coded.',
     ex='The same study supplied her inter-rater reliability example, when coders split over a parent tapping a child on the head.',
     src=f'{T} 18:15-19:16, 01:02:31-01:03:00')

card(ct='EXEMPLAR', dir='concept-to-instance', cid='naturalistic observation', sal='attaching', d=3,
     f='Naturalistic observation means watching people where they already are. What example did she give for it?',
     b='Watching how college students actually behave in an early morning class, observed in that class rather than brought into a lab.',
     ex='The textbook adds a study that gave participants a portable recorder that sampled ambient audio through the day, which found Mexican participants rated themselves as less sociable than White Americans but actually behaved more sociably.',
     src=f'{T} 51:53-52:26 | {B} p.46')

card(ct='CLOZE', cp='definition', cid='reactivity', sal='load-bearing', d=4,
     cz='Reactivity occurs when {{c1::a subject\'s behavior is altered by the presence of an observer}}.',
     ex='She described it without the term: in structured observation they know that you are watching, so they behave differently. Your notes call it the Hawthorne effect; the textbook\'s word is reactivity. Both point at the same problem, and even animals show it when the observation is obvious.',
     src=f'{T} 01:03:00-01:03:47 | {H} p.2 | {B} p.47')

card(ct='CLOZE', cp='definition', cid='operational definition', sal='load-bearing', d=4,
     cz='An operational definition {{c1::describes the actions or operations that will be used to measure or control a variable}}.',
     ex='Her example of needing one: she asked the class to count acts of aggression in a video and then realized she had never said what counted as an act of aggression.',
     src=f'{T} 01:01:13-01:02:31 | {H} p.1 | {B} p.35')

card(ct='EXEMPLAR', dir='concept-to-instance', cid='operational definition', sal='load-bearing', d=3,
     f='She told the class to count acts of aggression in a video and then said the instruction was flawed. What was wrong with it?',
     b='She never specified what counted as an act of aggression, so each observer would apply a different standard. The variable needed an operational definition.',
     ex='This is why operational definitions and inter-rater reliability travel together. Without the definition, coders cannot agree; with it, they can.',
     src=f'{T} 01:01:13-01:02:31')

card(ct='EXEMPLAR', dir='instance-to-concept', cid='operational definition', sal='load-bearing', d=4,
     f='Researchers photographed one woman in a red blouse and a blue blouse, matched the two images for brightness and saturation, and measured attraction with 1-to-9 ratings of attractiveness and dating interest. What have they just done?',
     b='They gave operational definitions for both variables, specifying exactly how blouse color would be manipulated and how attraction would be measured.',
     ex='From Elliot and Niesta (2008) in the textbook. Matching brightness and saturation matters because otherwise the manipulation would be brightness rather than color.',
     src=f'{B} p.35')

# ══════════════════════════════════════════════════════════════════════════
# 8 - CORRELATIONAL DESIGN
# ══════════════════════════════════════════════════════════════════════════

card(ct='FREE_RECALL', cid='correlational design', kind='framework', sal='load-bearing', d=5, n=5,
     f='BLURT: correlational design. 5 things to hit.',
     items=[
       'A correlational design examines how strongly two variables are related to each other.',
       'The researcher manipulates nothing and only measures what is already there.',
       'The strength and direction of the relationship are given by the correlation coefficient, written as little r.',
       'The coefficient runs from negative 1 to positive 1, where zero means no relationship and values nearer either end mean a stronger one.',
       'Correlation does not equal causation, because of the direction-of-causation problem and the third-variable problem.'],
     ex='Her running example: researchers followed about 250 low-income families whose children were two or four at the start and five or seven at the end, logged what the children watched, and found frequent Sesame Street viewers scored better on vocabulary and body-part tests.',
     src=f'{T} 01:04:27-01:09:45 | {H} p.2')

card(ct='CLOZE', cp='definition', cid='correlation', sal='load-bearing', d=3,
     cz='A correlation exists when {{c1::two variables are related to each other, so that changes in one accompany changes in the other}}.',
     ex='Your notes have it as an association between two variables, which is the same idea in fewer words.',
     src=f'{T} 01:04:27-01:04:42 | {H} p.2 | {B} p.43')

card(ct='CLOZE', cp='definition', cid='correlation coefficient', sal='load-bearing', d=4,
     cz='The correlation coefficient is {{c1::a numerical index of the degree of relationship between two variables}}.',
     ex='Written as little r. She stressed that it carries both pieces of information at once, the direction and the strength.',
     src=f'{T} 01:07:29-01:07:52 | {H} p.2 | {B} p.44')

card(ct='BASIC_QA', cid='correlation coefficient', sal='load-bearing', d=3,
     f='What range can a correlation coefficient take, and what does a value of zero mean?',
     b='It runs from negative 1 to positive 1. Zero means there is no relationship between the two variables.',
     ex='Values close to either end mean a strong relationship. A perfect 1.00 or negative 1.00 would be a one-to-one correspondence, which almost never happens.',
     src=f'{T} 01:07:52-01:08:25 | {B} p.44')

card(ct='CONCEPTUAL', cid='correlation coefficient', sal='load-bearing', d=4,
     f='In a correlation coefficient, what does the sign tell you and what does the size tell you?',
     b='The sign gives the direction of the relationship, positive or negative. The size gives the strength, with values closer to 1 meaning a stronger relationship.',
     ex='So negative .60 is a stronger relationship than positive .30, even though .30 is the positive one. The sign says nothing about strength.',
     src=f'{T} 01:07:29-01:08:25 | {B} p.44')

card(ct='COMPARISON', cp='independent', ax='which way the two variables move together',
     cid='positive vs negative correlation', sal='load-bearing', d=4,
     cz='In a positive correlation the two variables move {{c1::in the same direction, with high scores accompanying high scores}}; in a negative correlation they move {{c2::in opposite directions, with high scores accompanying low ones}}.',
     ex='Textbook examples: high school GPA and college GPA correlate positively, since students who do well in one tend to do well in the other. Absences from class and exam scores correlate negatively, since more absences go with lower scores.',
     src=f'{B} pp.43-44')

card(ct='EXEMPLAR', dir='instance-to-concept', cid='correlation is not causation', sal='load-bearing', d=4,
     f='Researchers followed 250 low-income families and found that children who watched Sesame Street frequently scored better on vocabulary tests. Can they conclude that Sesame Street caused the gains?',
     b='No. Nothing was manipulated, so this is a correlational study. It shows the two are related, not that one produced the other.',
     ex='She asked the class this directly and they got it. The parents kept detailed logs of what the children watched and for how long, which makes the measurement good but does not make it an experiment.',
     src=f'{T} 01:04:42-01:06:32')

card(ct='EXEMPLAR', dir='concept-to-instance', cid='third-variable problem', sal='load-bearing', d=4,
     f='The third-variable problem says a correlation between A and B may come from some C influencing both. What did the class propose as the C in the Sesame Street study?',
     b='The parents. Parents who put educational television on are likely providing other educational input as well.',
     ex='A student got there immediately, which she liked. The textbook\'s version is social activity and happiness, where extraversion may produce both.',
     src=f'{T} 01:06:32-01:07:29 | {B} p.45')

card(ct='CLOZE', cp='definition', cid='third-variable problem', sal='load-bearing', d=4,
     cz='The third-variable problem occurs when {{c1::a correlation between two variables arises because both of them are influenced by some third variable}}.',
     ex='Written as C causing both A and B. Sesame Street viewing and vocabulary scores both trace back to the parents.',
     src=f'{T} 01:08:55-01:09:29 | {H} p.2')

card(ct='CLOZE', cp='definition', cid='direction-of-causation problem', sal='load-bearing', d=4,
     cz='The direction-of-causation problem is that {{c1::a correlation cannot tell you whether A caused B or B caused A}}.',
     ex='Your notes write it as "did A to B or did B to A." With social activity and happiness, nobody can say whether socializing makes people happy or happy people socialize.',
     src=f'{H} p.2 | {B} p.45')

card(ct='COMPARISON', rel=True, ax='which way the causal doubt runs',
     cid='two threats to causal reading', sal='load-bearing', d=5,
     f='A correlation fails to establish causation for two distinct reasons. Name both and say how they differ.',
     b='The direction-of-causation problem, where you cannot tell whether A caused B or B caused A, and the third-variable problem, where some C produced both.',
     ex='They are different failures. The first leaves the causal arrow pointing an unknown way between your two variables; the second says the arrow may not run between them at all.',
     src=f'{T} 01:06:32-01:09:29 | {H} p.2')

card(ct='APPLICATION', cid='third-variable problem', sal='load-bearing', d=4,
     f='Survey studies find socially active people are happier. A theorist argues that extraversion produces both the socializing and the happiness. Which objection to a causal reading is that?',
     b='The third-variable problem. Extraversion is the C that could be producing both A and B.',
     ex='From the textbook. It notes theorists genuinely cannot tell whether social activity fosters happiness or happiness promotes social activity, which is the direction problem sitting on top of the third-variable one.',
     src=f'{B} p.45')

card(ct='APPLICATION', cid='correlation and prediction', sal='load-bearing', d=4,
     f='SAT and ACT scores correlate with college GPA at roughly .40 to .50. What does that let admissions committees do, and what does it not let them do?',
     b='It lets them predict college performance with modest accuracy. It does not let them claim the test score causes the performance.',
     ex='The textbook works the counterfactuals: at .90 the tests would predict superbly, and at .20 using them at all would be unreasonable. Prediction improves as a correlation moves toward either end.',
     src=f'{B} p.45')

# ══════════════════════════════════════════════════════════════════════════
# 9 - EXPERIMENTAL DESIGN
# ══════════════════════════════════════════════════════════════════════════

card(ct='FREE_RECALL', cid='experimental design', kind='framework', sal='load-bearing', d=4, n=4,
     f='BLURT: experimental design as far as she took it. 4 things to hit.',
     items=[
       'An experiment lets you infer causation, which a correlational design cannot do.',
       'Random assignment sorts participants into groups by chance, so no prior difference between the groups can explain the result.',
       'The experimental group is exposed to the treatment.',
       'The control group is not exposed to the treatment.'],
     ex='She stopped here and finishes Thursday. Independent and dependent variables are next, and the textbook has them: the independent variable is the one the experimenter varies, and the dependent variable is the one thought to be affected by it.',
     src=f'{T} 01:09:45-01:11:52 | {H} p.2 | {B} pp.39-40')

card(ct='CLOZE', cp='definition', cid='random assignment', sal='load-bearing', d=4,
     cz='Random assignment occurs when {{c1::every participant has an equal chance of being placed into any group or condition in the study}}.',
     ex='Her point about why: you do not want all one type of person in one group and all another type in the other, because then that difference and not the treatment could explain the result.',
     src=f'{T} 01:10:27-01:11:19 | {H} p.2 | {B} p.41')

card(ct='CLOZE', cp='definition', cid='experimental group', sal='load-bearing', d=3,
     cz='The experimental group consists of {{c1::the participants who receive the special treatment being studied}}.',
     ex='In Schachter\'s affiliation study the experimental group was told the electric shocks would be very painful, which was the treatment designed to raise anxiety.',
     src=f'{T} 01:11:19-01:11:52 | {H} p.2 | {B} p.40')

card(ct='CLOZE', cp='definition', cid='control group', sal='load-bearing', d=3,
     cz='The control group consists of {{c1::similar participants who do not receive the special treatment given to the experimental group}}.',
     ex='Her phrasing was that they do not get anything. In Schachter\'s study they were told the shocks would be mild and painless.',
     src=f'{T} 01:11:19-01:11:52 | {H} p.2 | {B} p.40')

card(ct='CONCEPTUAL', cid='random assignment', sal='load-bearing', d=4,
     f='What problem does random assignment solve?',
     b='It prevents systematic differences between the groups. If one group were assembled differently from the other, that difference rather than the treatment could explain the result.',
     ex='This is the internal validity idea again, applied at the design stage. The Kumon story is what happens when you have no random assignment at all.',
     src=f'{T} 01:10:27-01:11:19')

card(ct='COMPARISON', rel=True, ax='whether the researcher manipulates anything',
     cid='correlational vs experimental design', sal='load-bearing', d=5,
     f='What can an experiment establish that a correlational design cannot, and what makes the difference?',
     b='An experiment can establish causation. The researcher manipulates one variable while holding the rest constant, so the outcome can be attributed to that manipulation.',
     ex='The Sesame Street study could not do this because nobody assigned children to watch or not watch. Schachter could, because he assigned participants to the high-anxiety and low-anxiety conditions himself.',
     src=f'{T} 01:04:27-01:11:52 | {B} p.39')

card(ct='EXEMPLAR', dir='instance-to-concept', cid='experimental group', sal='load-bearing', d=4,
     f='Schachter told half his participants the electric shocks would be very painful and half that they would be mild, then asked whether they preferred to wait alone or with others. Which half is the experimental group?',
     b='The half told the shocks would be painful. They received the special treatment designed to raise anxiety, and the low-anxiety half served as the control group.',
     ex='Nobody was ever actually shocked. About twice as many in the high-anxiety group wanted to wait with others, which supported his hypothesis that anxiety increases the desire to affiliate.',
     src=f'{B} pp.39-40')

card(ct='EXEMPLAR', dir='instance-to-concept', cid='random assignment', sal='load-bearing', d=4,
     f='Men rated the same woman photographed in either a red or a blue blouse, and each man was assigned by chance to see one version. What does that assignment accomplish?',
     b='It makes the two groups equivalent before the manipulation, so any difference in ratings can be attributed to the blouse color rather than to who saw which photo.',
     ex='From Elliot and Niesta (2008). The red blouse produced higher ratings of both sexual desirability and dating interest, and the men appeared unaware they had been influenced by the color.',
     src=f'{B} pp.35-37')

card(ct='EXEMPLAR', dir='concept-to-instance', cid='experimental design', sal='attaching', d=3,
     f='An experiment needs a treatment that the experimental group gets and the control group does not. What was that treatment in Schachter\'s study?',
     b='Being told the electric shocks would be very painful, which was the procedure designed to create high anxiety.',
     ex='The control group heard the shocks would be mild and painless. Everything else about the two groups was held the same.',
     src=f'{B} pp.39-40')

# ---- FC-20 direction counterparts -----------------------------------------

card(ct='EXEMPLAR', dir='instance-to-concept', cid='test-retest reliability', sal='load-bearing', d=3,
     f='A student takes the same intelligence test on two Tuesdays three weeks apart and scores 118 and then 121. Which kind of reliability does that support?',
     b='Test-retest reliability. One person measured on two separate occasions produced very similar results.',
     ex='Her version used exactly this setup. She stressed that we do not expect intelligence to swing drastically over a few weeks, which is what makes the comparison meaningful.',
     src=f'{T} 22:40-24:22')

card(ct='EXEMPLAR', dir='concept-to-instance', cid='internal validity', sal='attaching', d=3,
     f='Internal validity fails when something other than the manipulated variable could explain the result. What example did she use in class?',
     b='Her neighbor\'s child improved after Kumon and her own child did not, with far too many other differences between the two children to credit or blame Kumon.',
     ex='She listed the differences the class found: different teachers, a different center, whether the parent enforces practice at home, and the children\'s own traits.',
     src=f'{T} 25:15-34:04')

card(ct='EXEMPLAR', dir='concept-to-instance', cid='external validity', sal='attaching', d=3,
     f='External validity fails when a result cannot be generalized past the sample. What example did she use in class?',
     b='Publishing findings from her own 8am PSYC 101 section as though they applied to all college students in the United States.',
     ex='She pushed it further, joking that this class in particular is unusual enough that generalizing from it would be indefensible.',
     src=f'{T} 34:04-37:07')

card(ct='EXEMPLAR', dir='concept-to-instance', cid='correlation is not causation', sal='attaching', d=3,
     f='Correlation does not equal causation. Which study did she use to make that point?',
     b='The Sesame Street study, where frequent viewers scored better on vocabulary tests but nobody had manipulated what any child watched.',
     ex='She asked the class directly whether Sesame Street caused the gains, and they said no. The parents were the third variable they proposed.',
     src=f'{T} 01:04:42-01:07:29')

card(ct='EXEMPLAR', dir='concept-to-instance', cid='random assignment', sal='attaching', d=3,
     f='Random assignment gives every participant an equal chance of landing in any group. Which textbook study illustrates it?',
     b='Elliot and Niesta assigned each man by chance to see the woman photographed in either the red or the blue blouse.',
     ex='Schachter does the same thing, sorting participants into the high-anxiety and low-anxiety conditions rather than letting them pick.',
     src=f'{B} p.36')

card(ct='EXEMPLAR', dir='instance-to-concept', cid='naturalistic observation', sal='load-bearing', d=3,
     f='Jane Goodall spent years watching chimpanzee social and family life in the wild without interfering. Which method is that, and what weakness does that method carry?',
     b='Naturalistic observation. Its main weakness is reactivity, since subjects who notice the observer behave differently.',
     ex='The textbook notes even animals show reactivity when the observation is obvious. Its other drawback is that natural behavior is hard to turn into numbers for analysis.',
     src=f'{B} pp.46-47')
