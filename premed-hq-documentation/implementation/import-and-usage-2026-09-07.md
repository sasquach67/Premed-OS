# Study-package import and generation usage — September 7, 2026

## User flow

In a class notebook, **Import a guide** accepts a version-1 JSON study package. Downloadable instructions and a complete example are in `public/templates/`. The app previews title, section titles, objective count, and source count before Save. Save creates a separate completed notebook entry, optional mastery map, and supplied source excerpts in the selected course through the existing store/cloud-sync path. No generation endpoint is called. Re-importing the normalized package in the same course opens the existing entry instead of duplicating it.

Content uses the existing guide renderer: sections, paragraphs, lists, callouts, comparison tables, and recall blocks. This is a structured package importer, not an arbitrary PDF or Markdown-to-guide converter. Inputs are size-bounded and reconstructed from allowed fields. Imported course IDs, artifact IDs, audit status, and other extra fields are ignored. Source IDs must be unique and every declared reference must resolve. New local IDs bind the content to the selected course. No imported HTML is executed.

Imported guides are labeled externally created and unreviewed. Supplied excerpts are stored as such; a resolvable source link does not prove the claim or the authenticity of the excerpt. Unsourced blocks are allowed with an import-preview notice. Missing objectives do not trigger an AI call. No instructor approval, coverage guarantee, or independent audit is inferred.

## Usage history

**Generation usage** displays the signed-in user's most recent 200 tracked generation/review requests, grouped by durable build job or synchronous request group. Guide and mastery generation can be separate jobs; this is not yet a merged per-lecture invoice. Historical work, recall checks, embeddings, transcription, and capability probes are outside this first tracking pass.

A pending row is written before each paid POST. If that initial write fails, the request is not sent. Usage is captured before parsing or validation, so failed/incomplete artifacts still retain their reported tokens. Transport failures remain unknown. Background polling updates the submitted response's row, rather than charging a repeated subtotal for every poll. A worker killed after dispatch leaves a pending row, which is not described as free. Requests already in flight before deployment cannot be reconstructed reliably.

Records retain IDs, provider/model, status, and provider token counts. They do not retain keys, prompts, source text, generated answer text, or raw provider error bodies. Source usage and provider billing are separate concepts.

Dollar amounts are explicitly **standard-rate estimates**, not invoices or budget reservations. Only GPT-6 Astra through direct OpenAI is priced, and only when ordinary/cache-read/cache-write token buckets can be distinguished. Rates verified September 7: ordinary input $10/M, cached input $1/M, writes $12.50/M, output $50/M; above 272k input tokens, input/cache rates double and output is 1.5x. Reasoning is included in output, not added again. Missing usage and unknown provider pricing stay null. Cheaper Inference and Anthropic are not guessed from direct OpenAI prices. The existing $10/week backup ledger is unchanged.

## Deployment boundaries

The live backend was version 94 and exactly matched branch `claude/premed-study-guide-deploy-test-2dm67e` at `8804857`. Usage changes are maintained on `codex/generation-usage`, based on that live source. Frontend/import changes are based on main. Do not redeploy main's older `study-tools` function over the newer live job service. Both additive migrations are included on the backend branch with their hosted migration versions and the required earlier job migrations. They are not copied onto main without those dependencies.

## Verification

Importer unit tests cover source remapping, untrusted ownership/audit fields, missing references, duplicate sources, source-free packages, optional mastery, and duplicate imports after serialization. The actual import dialog is tested for preview-before-save and zero network calls. Usage tests cover cache pricing, incomplete responses, unknown costs, transport failures, pre-dispatch persistence failure, and background poll deduplication. The real Edge task harness runs with the tracking module.

Live SQL checks verify owner visibility, cross-user isolation, denial of anonymous reads and client writes, and service-role writes; fixtures are rolled back. Security advisors report no finding for the new usage table. No paid generation trial is run for this release.

Deno checks the new tracking module successfully. The live backend baseline already has ten Deno type errors (Supabase generic types and fit-verdict narrowing); the patched entrypoint has the same ten, with none in the new module. Deployment uses the existing transpilation path, and the staged integration tests exercise the patched handler.

## References

- https://developers.openai.com/api/docs/models/gpt-6-astra
- https://developers.openai.com/api/docs/guides/prompt-caching
- https://supabase.com/docs/guides/database/postgres/row-level-security

Full runs: frontend 1,344 tests and backend 1,436 tests. One frontend and three backend tests hit 5-second timeouts while both full suites ran concurrently; all affected tests passed on focused reruns with two workers. Subsequent reader/import tests (11) passed after removing the imported-map generated-practice message. Frontend production build, backend TypeScript build, and focused lint passed. Browser checks confirmed the imported guide, sources, mastery map, and import dialog.
