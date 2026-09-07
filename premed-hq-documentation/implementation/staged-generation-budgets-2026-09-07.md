# Sized stages — September 7, 2026

Extends `task-staged-generation-2026-09-07.md`. That change made generation a sequence of tasks; this one makes each task **provably** small enough to finish, and fixes four real defects the sizing work exposed.

## The correction

Naming a stage does not bound it. The previous pass reasoned that a section is "small by construction" and left it there — which is a claim about shape, not about time. Under a conservative latency model a single section request wanting 5,000 output tokens costs roughly 70 seconds of generation alone, before any input. That is not small; it is one slow provider away from the same 150-second worker kill.

So every provider task is now **sized before it is sent**, and a task that does not fit is subdivided along the artifact's own structure. Nothing is sent and hoped for.

## Defects found and fixed

Four came out of writing the tests, not from reading the code:

1. **Trimming output to fit truncated the artifact.** The first sizing implementation shrank `max_output_tokens` until the request fit the clock. That does not make the work smaller — it cuts the reply off mid-artifact, which is the same information loss this design exists to prevent, arriving through a different door. Sizing now requires the **full** requested output; a task that cannot afford its answer is subdivided.
2. **Subdivision only shrank the input.** Parts inherited the parent's full output ask, so splitting a section into three still asked for 5,000 tokens three times and each part failed the same way. Parts now carry a proportional share of the writing, floored at what a real piece needs.
3. **Coverage was judged file by file.** A plan that used one passage from a source counted that whole source as covered. Coverage is now accounted **passage by passage against the original inventory**, and passages no section accounted for get their own repair task carrying exactly those passages.
4. **The completion record measured the wrong request.** Durations were recorded against the task row as it looked when claimed, before sizing had written what was actually sent, so the learned rates were empty. The sized values now travel to the completion record.

## The latency model

One real datapoint exists: a 2.9-second round trip for a 16-token reply on the live route. It fixes the fixed overhead and says nothing about throughput. So the priors are chosen to be wrong in the safe direction — 14 ms per output token (~71 tok/s including reasoning) and 40 ms per 1,000 input characters (~2,500 tok/s prefill, low because Astra carries a long-context surcharge).

Under these rates **output is the binding constraint, not input**. Planning a 700,000-character corpus costs ~31s; writing a whole document in one reply costs ~115s. That asymmetry is the design: planning is long-in/short-out and fits, section writing is short-in/long-out and subdivides.

Rates are per stage, because a plan and a section have opposite shapes and one blended number would hide both. `record_stage_duration` folds each completed request into an exponentially weighted rate and keeps a high-water mark; a single fast run moves the estimate only an eighth of the way off the prior, and learning is never allowed to become more optimistic than the measurement itself.

**Corpus size is capped structurally, not by the latency model.** Long-context latency is nonlinear and, on this route, entirely unmeasured. Until a stage has eight real samples, a single planning request carries at most 120,000 characters (~30k tokens); above that the survey/merge path runs. This is deliberately more conservative than the arithmetic allows.

## Hierarchical planning

When the corpus exceeds that cap:

| Stage | Unit | Why it is bounded |
|---|---|---|
| `survey` | One **source** | A source is a coherent unit of the student's material. Reads it in full, returns a topic list with exact passage IDs and the qualifications the instructor attached. Short output. |
| `merge` | All surveys | Reads topic lists, never the corpus. Small by shape rather than by trimming. Produces the section plan, including each section's own subpoints. |

When a single source is itself larger than one request, its survey runs as ordered spans of that source's own passage sequence. That is an execution detail of surveying an oversized document, not a definition of a stage: every passage is surveyed exactly once, provenance is preserved, and the merge re-establishes meaning across the spans. Exactly one planning branch runs — the one-pass planner is skipped when hierarchical planning is used, and vice versa.

## Subdivision

A section that does not fit is split along **its own subpoints**, which the planner supplies. Each part is a coherent piece of writing that reassembles under the parent's title, so the reader sees no seam. Only when the plan offered no subpoints does it fall back to ordered spans of that section's own passages.

The audit is likewise per section over that section's own evidence, plus one consistency pass over the assembled claims with no documents at all — so neither grows with the corpus. The job's audit status takes the weakest result: one unreachable reviewer means `unavailable`, never `approved`.

`subdivide_generation_task` marks the oversized task `skipped` and inserts its parts in one transaction, so a task can never be both retrying unchanged and subdivided. An ambiguous timeout marks the task `oversized` for the same reason: the request may have been accepted and billed, so it is counted, and its next attempt must be a subdivision.

## Throughput

pg_cron ticks every 5 seconds and dispatches up to 8 runnable tasks; sections are independent, so they run in parallel and the lease guarantees each is claimed once. The page polls every 2.5 seconds and does not drive anything. For a nine-section guide from three sources that is roughly: inventory (~1s) + three surveys in parallel (~1 tick + provider) + merge + nine sections across two dispatch waves + verify + ten audits + assemble — dominated by provider time, not by scheduling.

## Verification

**Verified against real PostgreSQL 16** (`scripts/verify-generation-sql.sh`): all three migrations apply; the oversized parent is skipped and its parts become claimable, so it can never be retried unchanged; subdivision is idempotent under redelivery; stage rates are recorded per stage, keep the worst case, and stay separate between stages; the stats table is invisible to signed-in users. Plus everything previously verified — dedupe, exclusive lease, stage gate, attempt bounds, reaper, dispatcher batching, `skip locked` under six concurrent claims, ownership-scoped nudges, and RLS.

**Verified against the real compiled Edge handler**: hierarchical planning engages on a 213,000-character corpus and never plans the whole corpus at once, with the merge request measurably smaller than any survey and instructor qualifications surviving the boundary; an oversized single source is surveyed as ordered spans covering every passage exactly once; a section too large splits along its subpoints and reassembles into one section; a plan that silently forgot a passage is caught against the inventory and gets a repair carrying exactly that passage; a request sizing rejects is never sent at all; an ambiguous timeout is recorded as possibly billed and not repeated; per-stage durations, estimates and token counts are recorded.

211 test files / 1429 tests pass. `npm run build`, `tsc -b` and `npm run lint` are clean (52 pre-existing warnings, unchanged).

## The blocker

**Nothing is deployed, and no live provider call was made.** This environment's egress policy answers HTTP 403 to CONNECT for `premedos.app`, `poichxqptuupzrkyewrq.supabase.co`, `api.openai.com`, `api.cheaperinference.com` and `api.supabase.com`; there are no Supabase credentials in the environment and no Supabase CLI. The agent proxy documents these as organisation policy denials and instructs that they not be routed around.

Consequently the following remain **unverified**, and no amount of local testing substitutes for them:

- Whether Cheaper Inference supports `background: true` submission and later retrieval. `probe-background` exercises both halves for real and records them separately; until it passes, the engine runs every stage synchronously.
- Real per-stage durations. Every number above is a conservative prior, not a measurement. The system is built to replace them with measurements automatically.
- Whether a full study guide completes end to end through the live app.

Deployment steps are in `task-staged-generation-2026-09-07.md`, plus `supabase db push` for `20260907030000_generation_stage_budgets.sql`. After deploying, the evidence to capture is: the `probe-background` result; `select spec_id, stage, samples, max_ms from generation_stage_stats` after one build; and `select stage, task_key, status, attempts, estimated_ms, duration_ms, oversized, ambiguous from study_generation_tasks where job_id = ...` for the test job.
