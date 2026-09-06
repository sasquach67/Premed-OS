# Notebook output quality evaluation

Purpose: distinguish a working generator from an output that meets the student's task. Prompt-contract tests establish which instructions were sent, not whether the model followed them. A successful response, citation validity, or section count alone does not establish comprehensive teaching.

Use synthetic, clearly labeled fixtures before testing a full student corpus. Keep the goal selection independent from additional instructions. Score each requirement as met, partial, missing, or contradicted. Any fabricated source claim, unmarked missing requirement, or fabricated data is a failed case. A short output can pass a narrow task; a long output cannot compensate for omitted requirements.

## Representative cases

| Case | Material packet and request | Required observations |
| --- | --- | --- |
| Humanities assessment | Review sheet asks to compare two authors and explain a third unavailable case; two readings disagree; instructor note emphasizes comparison | Covers every review requirement, preserves author attribution and disagreement, connects evidence to an argued comparison, marks the unavailable case, offers a reasoned comparison practice answer; no guessed exam weighting |
| Quantitative assessment | Review requests linear equations and unit conversion; lecture contains a worked example and a common sign error | Explains method selection and intermediate reasoning, creates a self-contained variation with checked answer, identifies the sign error, distinguishes arithmetic recall from application |
| Assessment without scope | Only reading excerpts; no review sheet or stated exam format | Organizes useful preparation while marking actual coverage and format unknown; does not fabricate likely questions or instructor emphasis |
| Math assignment | Prompt asks solve and verify; student makes an identifiable first algebra error | Locates first error, explains correction, solves with intermediate steps, substitutes to check, checks both requested requirements |
| English revision | Rubric requests argument, source evidence, and counterargument; draft summarizes without a claim | Diagnoses the actual draft, preserves the student's defensible position and voice, proposes an evidence-supported argument and revision priorities, checks each rubric criterion, invents no quotation/page |
| Lab analysis | Prompt asks interpret supplied measurements and uncertainty, but one measurement is missing | Uses only actual data, distinguishes observation from interpretation, handles uncertainty and missing input explicitly, does not fabricate results or claim the report is complete |
| Nonconventional project | A presentation or design brief gives audience, deliverable constraints, and evaluation criteria | Adapts support to the actual deliverable rather than forcing an essay or problem-set template; relates recommendations to constraints and checks their satisfaction |

## Evaluation procedure

1. Identify explicit requirements and source support independently of the output.
2. Generate via the real Notebook flow using that selected goal and packet.
3. Compare the result against every requirement above. Check source attributions and at least one complete reasoning chain. Confirm refinements affected presentation without replacing the goal.
4. Reload the entry and verify the same content, selected sources, and request remain available.
5. Record actual outcomes and limitations; do not generalize two successful samples to every subject or a large corpus. Full-corpus processing remains subject to the current source-size guard.

The initial small live checks proved generation and persistence for the older briefs, not compliance with these strengthened requirements. New runs must be recorded separately.
