# Notebook generation system diagnosis — September 6, 2026

## Outcome and evidence boundary

The PSYC failure was an application contract problem: readable material produced a Study Guide, but Mastery rules demanded explicitly labeled instructor objectives and rejected both map attempts. The composer then discarded the successful guide. The prior local correction is recorded in `notebook-generation-recovery-2026-09-06.md` and commit `b58f770`.

This follow-up used three independent agents for extraction, generation, and recovery, plus a separate read-only Claude review. Fixes below have deterministic reproductions. They do not establish the cause of every historical failure or prove a successful signed-in production generation. No additional paid application generation, push, merge, or deployment was performed.

## Confirmed failures corrected locally

| Boundary | Failure and correction | Evidence |
| --- | --- | --- |
| Extraction | Unnamed PNGs without MIME were rejected; recognize common image signatures. PDF loading tasks leaked on success and rejection; destroy them after extraction/OCR. | `documentText.test.ts` |
| PDF support assets | PDF.js was missing CMap/font locations and corresponding deployed assets. Configure both paths and serve/build files from the same installed PDF.js version. | Before fix the local CMap URL returned HTML; after fix it returned the exact binary. All 185 built support files match the dependency byte for byte. |
| Scanned material | OCR could stall indefinitely after worker startup; bound configuration/render/recognition operations and terminate on timeout or cancellation. Retain already extracted pages. | `documentOcr.test.ts` |
| Coverage disclosure | A header or page number alone can count as extracted text. Replace “pages readable” with “Text extracted on … pages”; preserve OCR and missing-page warnings. | Header-only regression in `lectureWorkspace.test.ts` |
| Source transport | Ordinary Notebook generation could proceed after only some selected source passages reached the server. Require the complete selection before quota/provider work. | Actual Edge handler, with external dependencies replaced, rejects partial selections for guide, map, and assignment in `studyTools.sourceCompleteness.test.ts`. |
| Failure routing | All HTTP 422 errors were described as absent sources, even missing citations. Classify the server reason: incomplete source mirror gets one restore/retry; citation failure gets citation repair, without source sync. | `notebookGenerationReliability.audit.test.ts`, existing source-recovery tests |
| Output shape | Invalid rich-text blocks could pass the guide guard and crash rendering. Validate block content, types, provenance, and emphasis shape before saving/rendering. | `notebookGuideShape.audit.test.ts` |
| Thin sources | Mandatory bullet and practice quotas made valid short material impossible to use without invention. Preserve rich-source depth; allow explicitly explained `evidenceLimit` only for missing source support. At least one supported understanding point, recall, and selected citations remain required. Show the limitation in both map readers. | `generateUnitMasteryOutline.test.ts`, `MasteryLearningModes.test.tsx` |
| Prompt coherence | Global provenance instructions demanded fields absent from artifact schemas. Make provenance follow the actual schema; coverage is computed from real selected/cited sources. Clarify labeled hypothetical practice versus outside empirical claims. | Prompt assembly and artifact contract suites |
| Saved-result recovery | Editing the next source selection broke retained citations, explicit map IDs could lose to older associated maps, and late requests could overwrite newer work. Resolve saved evidence independently and guard saves/navigation by current attempt and guide identity. | Composer and reader concurrency/recovery tests |

## Remaining architecture limits

The generator still uses a single bounded packet, not a staged whole-library pipeline: 480 passages / 220,000 source characters and a 10,000-token provider output cap. A large input can fit while its requested detailed output cannot. Increasing the cap alone would not guarantee complete coverage or fix incompatible output requirements. A larger-library design needs durable per-source extraction records, bounded generation batches, source-backed synthesis, explicit coverage reconciliation, and resumable per-stage results.

Supported import paths are text, PDF, DOCX, and image OCR, with 50 MB/file and 250 pages/PDF limits. There is no dedicated PowerPoint parser. English OCR is not diagram understanding. Hybrid pages with a small native text header and a scanned body currently bypass OCR; DOCX embedded images are not read. The wording correction prevents a false full-page claim but does not recover that missing content. Supplied resource text is evidence, not authorization to execute instructions embedded in it.

Deterministic checks validate shape, identifiers, and required structure. They do not prove that a model’s claims faithfully interpret every passage. The justification for an `evidenceLimit` still needs semantic review.

## Verification and integration

- Final combined Academics, generation, and intelligence run: 121 suites / 923 tests passed, including all follow-up regressions.
- Production build passed. Existing bundle-size/dynamic-import warnings remain.
- Whole-repository lint: zero errors, 52 warnings. Focused changed-code checks passed.
- Actual local Mastery reader visually checked with a synthetic psychology objective: limitation is visible, unsupported practice is explicitly absent, supported explanation remains readable.
- PDF support assets verified in dev HTTP response and the production output.

These changes are local. Integration requires both the frontend bundle (including PDF support assets and runtime prompt changes) and the `study-tools` Edge function completeness check. No database migration or provider-routing change is required. A signed-in production trial is still required after integration before claiming the live creation path is fixed.

## Implementation references

PDF.js documents the required [CMap and standard font URL options](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html). The asset plugin uses Vite’s [development server and build hooks](https://vite.dev/guide/api-plugin.html). OpenAI documents that [maximum output tokens include reasoning tokens](https://developers.openai.com/api/reference/typescript/resources/beta/subresources/responses/methods/create); the repository’s output setting is therefore not a guarantee of a comparably sized rendered guide.

## Claude review and adjudication

Claude desktop completed a read-only cloud review of an attached, line-numbered local snapshot. The saved Claude CLI login had expired; its CLI attempt did not run. The desktop review read the snapshot and compared it with its cloud checkout; it did not implement changes. Its snapshot preceded the later local thin-source, PDF asset-build, and unconditional source-completeness changes, so its findings were checked against the current worktree before remediation.

| Claude finding | Current evidence and disposition |
| --- | --- |
| SOURCE_ONLY versus required hypothetical practice | Clarified in the global/source-mode contract. This conflict is real in the older rules, but Claude did not reproduce the user's live failure; the observed response specifically named missing explicit objectives. |
| Thin-source versus depth quotas | Corrected with the explicit, visible evidence-limit contract described above. |
| Empty standards rejected by Edge before shape repair | Confirmed through actual Edge handler, client classification, recovery wrapper, and generator with synthetic provider responses. The existing single transport retry now receives Mastery-specific shape/objective/evidence-limit instructions. No extra retry or unverified artifact acceptance. A second empty response stops. |
| Rejected outputs consume allowance | Not every retained reservation is a leak: provider work may have been billed. The ledger intentionally reserves conservatively and founder accounts bypass these limits. No live account/ledger check established this as Andy's blocker. A distinct deterministic bug was fixed: invalid assembled prompts claimed allowance before any provider work; prompt preflight now precedes quota. Weekly-limit copy explains reservation accounting. No blanket refunds or schema changes. |
| Source scope re-homing | Confirmed: one row per owner/chunk was assigned a mutable topic label, so concurrent scopes could move shared passages away from retrieval. Explicit retrieval now closes on owner + course + requested IDs, without mutable topic filtering. Tests preserve exclusions for other users, courses, and unselected chunks. |
| Input/output size mismatch | Confirmed structural limit, not solved by this patch. Staged generation remains required for reliably processing larger libraries. No speculative cap increase. |
| Filename-based instructor classification | `PSYC 101 Lecture 5.pdf` can be classified as other. This affects priority quality, but current rules make instructor sources optional; no deterministic remaining refusal was found from classification alone. No broad filename heuristic change. |
| Audit degradation and dropped feedback | Confirmed that only the first of three safe audit issues reached repair. All bounded issues now reach repair. Maps now store the final successful response's audit status, including repairs; saved guide/map readers disclose skipped or unavailable independent review. Audit token exhaustion remains a hypothesis without runtime evidence; provider settings were not tuned on speculation. |

Additional regressions: `masteryTransportRepair.integration.test.ts`, `studyTools.sourceScope.test.ts`, `studyTools.budgetPreflight.test.ts`, all-issues repair coverage in `notebookGenerationReliability.audit.test.ts`, and saved-map review-status display tests. The review-status field is optional for backward compatibility; no migration is needed.
