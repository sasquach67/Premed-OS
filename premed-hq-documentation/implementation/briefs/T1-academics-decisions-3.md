# T1 · Academics — Revised Notes provider evidence boundary

**Stage:** B · RESOLVED, HANDOFF TO STAGE C
**Status:** Andy selected **A · Verified-provider route** on Aug 21, 2026.
This decision pass changes documentation only. Do not edit `src/`, migrations,
Edge Functions, secrets, deployment settings, or mockup files in this pass.

## 1. Fidelity audit — before this brief

### A. Spec → paper

**Pass for the current Materials vertical.** The latest ruled surfaces are
drawn and have paired behaviour-and-appearance records:

| Ruled behaviour | Paper state | Record |
| --- | --- | --- |
| A bounded, student-pasted excerpt is an eligible source. | `textbook-excerpt` | `academics-materials-extensions.md` |
| Revised Notes starts with a selected student note as its baseline. | `revised-notes-baseline` | same |
| Source material without a note baseline has an honest recovery. | `revised-notes-no-baseline` | same |

No new screen, tab, button family, or mock variant is needed to resolve this
decision. The lab state-selector chips remain review-only controls; the app
keeps its five real Class Hub tabs and contextual Materials flows.

### B. Mockup → app

The current app is still not the approved result:

| Surface | Current evidence | Result |
| --- | --- | --- |
| Excerpt intake | `ClassHub.tsx:708-744` supports file upload only. | Not built. |
| Baseline selection and no-baseline recovery | `RevisedNotesPanel.tsx:46-135` lets any processed source generate a note. | Not built. |
| Source-only Revised Notes prompt/validation | `generateRevisedNotes.ts:28-95`, `revisedNotes.v1.ts:4-44` keep closed citations but do not carry a student-note baseline. | Partial. |
| Provider evidence guarantee | `supabase/functions/study-tools/index.ts` defaults to the Anthropic document-citation route. The OpenAI branch emits no trusted provider citations. | **Unresolved before this decision; Anthropic selected below.** |

#### Measured record-surface ladder — Aug 21, 2026

Measured in the running dark Materials page, not inferred from class names:

| Surface | Mockup | App |
| --- | --- | --- |
| Canvas | `#211e1a` | `rgb(33, 30, 26)` / `#211e1a` |
| Solid panel | `#2b2722`, `#3c352d`, `16px` | `rgb(43, 39, 34)`, `rgb(60, 53, 45)`, `16px` |
| Dense source object | `#322e28`, `#3c352d`, `13px` | `rgb(50, 46, 40)`, `rgb(60, 53, 45)`, `13px` |

The visual ladder is already the one to preserve. This brief makes no
appearance decision and authorizes no visual implementation.

### C. Already built — preserve

- `AcademicFile` / `SourceChunk` ownership, exact ranges, local canonical
  storage, source synchronization, and the server-resolved chunk set.
- The `SOURCE_ONLY` control, generated-artifact schema, closed citation set,
  source trace, and malformed-output fail-closed behavior.
- Study Guide and Flashcards generators, their source boundaries, and the
  one-way Anki export boundary.
- Five Class Hub tabs and the Materials-vs-Notes distinction.

### D. Gate

`BUILD-MANIFEST.md` marks
`01-academics/academics-materials-extensions.html` **YES**. The manifest does
not settle provider evidence quality; it only authorizes a later scoped build.
Do not edit it.

### E. Decision record — the first blocked stage

The visual decision record is complete. The incomplete decision is the
**evidence standard for an API-backed source-only artifact**:

- `T1-academics-build-24.md` directs the build to reuse the existing Supabase
  OpenAI secret.
- `supabase/DEPLOY.md` says `AI_PROVIDER=openai` uses a weaker path with no
  trusted provider citations and must remain unset until verification is added.
- The global source-mode rules require every `SOURCE_ONLY` claim to be
  traceable to supplied material; a UI cannot present a claim as source-linked
  if its provider path did not verify that connection.

Those instructions cannot both be true. This is a product-trust decision, not
a styling or implementation detail. Stage C must not start until Andy chooses
the allowed verification path below.

### F. Integrations and services

| Dependency | Classification | What a student sees today | What changes after the decision |
| --- | --- | --- | --- |
| Local material/source persistence | **CODE BUILT AND CONFIGURED** | Local materials remain usable without AI. | No account action needed. |
| Anthropic document-citation path | **CODE BUILT; configuration unverified** | A signed-in request may still show unavailable until its server secret/function are configured. | If selected, it supplies trusted provider citation locations to the existing closure check. |
| Existing OpenAI secret | **CONFIGURED SECRET; unsafe generation transport** | It is not safely usable for a source-linked artifact merely because it exists. | It can be used only after the server-side OpenAI route proves equivalent citation evidence, or after output is honestly labelled unverified—which source-only Revised Notes does not permit. |

## 2. Decision — resolved by Andy

### A. Verified-provider route

Use the existing Anthropic document-citation generation route for Revised
Notes. The later build keeps `AI_PROVIDER` unset and uses the current closure
mechanism. Andy then configures the required Anthropic server secret and deploys
`study-tools`.

**Selected.** This is the fastest safe route. It does not use the existing
OpenAI secret for this artifact.

### B. Verified OpenAI route — not selected

Use the existing OpenAI secret **only after** the next build adds a server-side
citation-verification protocol whose guarantee is at least as strong as the
current source-only contract: every returned passage/difference must carry an
exact source range and verbatim evidence that the server independently matches
against its closed selected chunks before persistence. Any assertion without
that verified evidence rejects the whole artifact. The app must not render the
result as source-linked until that test exists and passes.

**Tradeoff:** uses the existing OpenAI account, but adds provider transport,
validation, integration tests, and live deployment work before Revised Notes
can claim its source trace is trustworthy.

### Not allowed

- Turning on `AI_PROVIDER=openai` under the current implementation and
  displaying ordinary source-linked results.
- Treating in-bounds model-supplied offsets as proof that a claim is supported.
- Sending a key from the browser, embedding a key in a Vite variable, or
  weakening `SOURCE_ONLY` because the source set is small.

## 3. References

- `premed-hq-documentation/tabs/01-academics.md` — Materials ownership,
  five-tab grammar, and primary-plus-overflow study-tool rule.
- `mockup-lab/01-academics/academics-materials-extensions.{html,md}` —
  Variant A and the three new source/baseline states.
- `premed-hq-documentation/specifications/generation/02-global-rules-and-source-modes.md`
  §1.2, §1.9, §2.1, and §2.5.
- `src/lib/academics/generateRevisedNotes.ts`,
  `src/lib/generation/artifacts/revisedNotes.v1.ts`, and
  `src/lib/generation/schemas/revisedNotes.v1.ts`.
- `supabase/functions/study-tools/index.ts` and `supabase/DEPLOY.md`.
- `T1-academics-build-24.md` — superseded only on its provider-integration
  assumption; its excerpt/baseline scope remains the implementation target.

## 4. Do not break / do not decide silently

- Do not build or deploy while this decision remains open.
- Do not change provider settings, add a secret, or reveal a secret.
- Do not alter the approved Materials hierarchy, mockup, or class-tab count.
- Do not substitute a generic generated note, external knowledge, a whole
  textbook, or a source-unverified artifact for the missing provider proof.
- Do not treat this decision as permission to modify Flashcards V1, Study
  Guides, lecture capture, or unrelated working-tree files.

## 5. Done when

- [x] Andy selected **A · Verified-provider route** explicitly.
- [x] The choice is copied into the corrected `T1-academics-build-24.md` with
  a concrete server-side proof requirement and configuration checklist.
- [x] `T1-academics-build-24.md` no longer directs an executor to an unsafe
  `AI_PROVIDER=openai` setup.
- [x] No `src/`, Supabase, migration, or secret change occurred in this
  decision pass.

## 6. Commit

Commit this decision record and its tightly coupled corrected implementation
brief only:

```text
docs(academics): select Anthropic verified provider route
```

Do not stage unrelated in-progress briefs or the Flashcards V1 spec revision.

## 7. Next stage — not in scope

Execute the corrected Stage C build: bounded excerpt persistence, explicit
student-note baseline, source-only generation validation, UI fidelity, tests,
and the Anthropic server configuration checklist. Do not start it in this
decision pass.
