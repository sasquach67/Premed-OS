# T1 · Academics — Shareable syllabus structure decision

**Stage:** B · DRAWN, NOT DECIDED

**Scope:** Select the visual hierarchy for the already-drawn shareable parsed
syllabus flow. This is a decision pass only: it does **not** alter `src/`,
Supabase, the existing private syllabus parser/re-import flow, or the build
manifest.

**Blocked on Andy for:** one A/B/C treatment ruling in §3.

---

## 1. Step-1 audit

### a) Spec → paper

**Pass.** The required #56 capability is now drawn as a temporary state inside
Syllabus Import / Re-import, rather than a new social destination:

- owner opt-in after a private parse;
- recipient review-before-apply;
- normal no-result/private-import fallback.

The drawing and its paired record visibly hold the locked boundary: anonymous,
per-syllabus opt-in, term-and-section scoped, extracted structure only.
The allow-list is units/topics, dates, grade-category weights, permitted policy
structure, and section/term identity. The original source document and text,
student identity, grades, progress, notes, files, and personal edits are out of
the payload.

### b) Mockup → app

**Not applicable at this stage.** There is deliberately no student-facing
shareable-parse screen in `src/`; this briefing chooses a visual treatment
before such a surface can be implemented. The existing public privacy copy is
not a functional sharing route and must not be mistaken for one.

### c) Already built — preserve, do not rebuild

| Existing private capability | Evidence | Must remain true |
| --- | --- | --- |
| Parse and apply a syllabus | `e638095`, `ac23637` | a student can stay private and manual entry remains usable |
| Scoped and cold-start import ownership | `7d2c5e4`, `9c1fa65` | a scoped import updates its existing class; it does not duplicate it |
| Identity-based re-import diff | `93bfeb8` | changed/removed rows default to Keep and nothing writes before Apply |
| Private Class Hub/Syllabus Import fidelity | `dc3be56` | no sharing control replaces or obscures the ordinary private route |

### d) Manifest gate

**Not cleared for implementation.** `BUILD-MANIFEST.md` has no explicit row
for cross-user shareable parsed structure. The generic private syllabus-import
authorization cannot silently authorize a new remote data model, RLS policy,
or sharing feature. This Stage-B document needs no manifest permission; a
future build brief does.

### e) Decision record

**Blocked only on the visual treatment.**
`mockup-lab/01-academics/academics-syllabus-structure-share.html` and its
paired `.md` specify both behavior and appearance, but intentionally retain
three choices. Selecting one turns that comparative drawing into an approved
appearance contract.

### f) Integrations and services

| Dependency | Current state | Student-facing truth |
| --- | --- | --- |
| private local syllabus parsing/re-import | built | parsing remains private unless a student expressly opts in |
| shareable extracted structure | code missing | no classmate/shared-parse result exists today |
| remote table, authenticated access, RLS and conflict provenance | code missing | no data may leave the private parse until the later build proves structural isolation |

No cloud-console action is requested from Andy in this decision pass.

## 2. Why this lands at Stage B

The product behavior is settled enough to draw, but the page hierarchy is not.
This is a consequential consent experience: whether the student first decides
what may leave their parse, first evaluates the candidate evidence, or first
compares differences changes the trust model they experience. That cannot be
guessed from a generic import button or resolved with CSS after backend work
starts.

## 3. Decision required — choose one treatment

Open `academics-syllabus-structure-share` in the mockup lab and select **A, B,
or C**:

| Choice | Treatment | Hierarchy | Best when |
| --- | --- | --- | --- |
| **A** | **Consent-led** | Private-by-default decision first; clear allowed / never-shared disclosure; narrow factual decision rail | privacy and deliberate opt-in should set the tone |
| **B** | **Evidence-led** | Candidate structure and corroboration lead; the sharing boundary remains visible at the point of action | recipients most need to inspect available evidence before deciding |
| **C** | **Diff-led** | Current private structure and candidate receive equal visual weight; matching facts collapse and conflicts remain editorial rows | comparison/review is the dominant job |

**Recommendation: A.** It makes the irreversible-looking moment—opting a
private parse into a shared pool—legible before any network benefit is offered.
It does not hide the candidate/review state; it only establishes the correct
trust order.

## 4. Do not break

- Do not create a social feed, contact system, score, popularity signal, or
  anonymous-avatar treatment.
- Do not send or store original source files/text, grades, progress, notes,
  personal edits, account identity, or files in any future shared payload.
- Do not change parsing, re-import identity matching, default Keep/Accept,
  manual entry, existing course ownership, or private material generation.
- Do not alter `src/`, Supabase, Edge Functions, migrations, API keys, or
  `.env` values in this pass.

## 5. Done when

- [ ] Andy selects A, B, or C in the lab.
- [ ] The selection is recorded in
      `academics-syllabus-structure-share.md` with the chosen hierarchy and
      why it is the approved treatment.
- [ ] The lab registry marks the selected treatment approved without implying
      the feature is already built.
- [ ] A subsequent narrow implementation brief can specify the remote schema,
      RLS isolation, opt-in/revocation, corroboration, diff/apply behavior,
      and integration tests without making a new product-design decision.

## 6. Commit after the decision

`docs(academics): choose shareable syllabus structure treatment`

Commit only the decision record and lab-status update made after Andy chooses.
Keep current flashcard output/spec work and all other worktree changes out of
that commit.

## 7. Next stage

After the choice, write a **Stage C/D implementation brief** for this one
feature. It must add the manifest authorization before code begins, then build
frontend and backend as one privacy proof: remote data isolation, anonymous
recipient presentation, per-syllabus opt-in/revocation, term/section scoping,
review-before-apply, corroboration/conflict handling, and an end-to-end test.
