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

## Live evaluation — September 5, 2026

Release `83d8649` was deployed successfully before these generations. Tests used the existing app connection and clearly synthetic material in the demo BIOL 103 class. No transcript was required. All 1,229 automated tests passed; production build passed; lint reported zero errors and 52 existing warnings.

### Humanities assessment — content requirements met

Three selected materials, three readable passages: a review sheet and contrasting synthetic readings A and B. The review requested an author comparison plus application of an unavailable Interview Case C. The student's refinement requested clear explanations and one explained practice comparison.

- The page preserved both review requirements and the instructor's emphasis on reasoning.
- It explained reciprocal obligations in A and immediate need in B, preserving B's qualification that later obligations can develop.
- It marked Case C as missing, explained the required input, and labeled prospective comparison criteria as criteria rather than invented findings.
- One original comparison prompt and its explained answer connected both readings and diagnosed a tempting misinterpretation.
- Rendered source disclosures contained the relevant supplied readings and review sheet. The request and generated page remained present after reload; no Mastery Map was produced.
- Entry: `c54e5390-9169-42d7-96a4-62ef81b82169`.

### Math assignment — content requirements met on retry

One selected material, one readable passage: solve `3(x - 2) = 12`, show intermediate steps, use distribution and equal operations, and verify by substitution. The supplied attempt incorrectly began `3x - 2 = 12`. The refinement asked for the first mistake, corrected solution, and verification.

- The first request returned “AI study tools are unavailable.” One unchanged retry succeeded; the cause of the initial service failure was not established.
- The page correctly identified failure to multiply `-2` by `3` as the first mistake, and recognized that later operations were consistent with the incorrect line.
- It showed `3x - 6 = 12`, `3x = 18`, and `x = 6`, then substituted to obtain `12 = 12`. It also showed that the student's `14/3` gives `8`, not `12`.
- A visible check addressed the requested explanation, allowed method/intermediate steps, and substitution. Source disclosures and the separate student refinement persisted after reload; no Mastery Map was produced.
- Entry: `759b2f1d-a89d-46fe-a640-9280f70f8f60`.

### Limits and remaining polish

These two narrow synthetic cases support the specific observations above, not universal quality or reliability across subjects and large corpora. English revision, quantitative assessment, lab analysis, and nonconventional project cases remain unrun under the strengthened briefings. Presentation still has minor deviations: the assessment displays repeated hyphenated concept labels and a long generic-prefixed title; the assignment's topical title has seven words despite its two-to-six-word instruction. These did not affect the checked reasoning, but exact presentation compliance is not established.
