# Task-staged generation — September 7, 2026

Supersedes `durable-generation-jobs-2026-09-07.md`, whose diagnosis over-claimed. Corrections are stated below rather than quietly edited.

## Diagnosis, restated carefully

**Established.** A Supabase `study-tools` worker logged a `WallClockTime` shutdown at boot 19:16:21 and shutdown 19:18:51 on September 6, 2026 — exactly 150 seconds, the free-plan wall clock. A generation was in flight. That is a real, reproducible way for the previous design to lose work, because it held one long provider call open inside one invocation.

**Withdrawn.** Three earlier claims went further than the evidence:

- *"The 141-second Cheaper Inference failures prove the client disconnected."* They do not. Two full requests failing at ~141s with zero tokens and zero recorded provider attempts is **consistent with** a client-side disconnect, and equally consistent with a failure inside Cheaper Inference's own routing before it reached an upstream. The timing is suggestive; it is not proof, and it was reported as proof.
- *"EarlyDrop shows an awaited socket was killed."* `EarlyDrop` normally means a worker was retired after its work finished. Treating it as a second failure mode was wrong.
- *"The provider connection is fine."* A 2.9s tiny Responses request on the saved key proves the credential, the model name and the endpoint work for a small request. It says nothing about a full generation. Full-generation reliability is exactly what remains unestablished.

**What is actually known.** One confirmed platform-level kill; two provider-side failures of unknown origin; a working small request. The honest reading is that the old design had at least one fatal structural flaw (an oversized synchronous request inside a bounded worker) **and** an unresolved question about the route's behaviour under a full-size request. This change fixes the first and stops the second from destroying work — it does not claim to have diagnosed the second.

## Limits, verified before designing against them

| Limit | Value | The part that matters |
|---|---|---|
| Wall clock | 150s free, 400s paid | Belongs to the **worker**, not the request. A worker part-way through its life has correspondingly less to give. |
| Request idle timeout | 150s → HTTP 504 | Separate from the above. |
| `EdgeRuntime.waitUntil` | Prevents early retirement | **Does not extend the wall clock.** Starting another stage inside the same invocation resets nothing. |
| pg_cron | Enabled by default on Supabase projects; sub-minute schedules on Postgres 15.1.1.61+ | The durable driver. Ticks inside Postgres, so no browser is involved. |
| pg_net | `net.http_post` from SQL | How a tick reaches the function. |

Sources: [Limits](https://supabase.com/docs/guides/functions/limits) · [Background Tasks](https://supabase.com/docs/guides/functions/background-tasks) · [Worker timeouts](https://supabase.com/docs/guides/troubleshooting/edge-functions-worker-timeouts-and-websocket-drops) · [Shutdown reasons](https://supabase.com/docs/guides/troubleshooting/edge-function-shutdown-reasons-explained) · [Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions) · [Supabase Cron quickstart](https://supabase.com/docs/guides/cron/quickstart)

## The unit of work is a piece of the artifact

Not a slice of the material. Dividing inputs into thirds or equal batches truncates context, breaks cross-source reasoning, and produces sections that cannot see each other. Dividing the **output** by its own structure keeps every task grounded in all the evidence that bears on it — including evidence from other sources — while making each request small enough to finish inside one invocation with real headroom.

**Study Guide and the notebook pages** (`study-guide-v1`, `notebook-entry-v1`, `notebook-assessment-v1`, `notebook-assignment-v1`):

| Stage | Inputs | Outputs | Completion |
|---|---|---|---|
| `inventory` | Selected passage IDs; the stored mirror | Coverage inventory: passages per source, characters, empty passages, repeated-text groups | Every selected ID resolves; inventory persisted |
| `outline` | The whole deduplicated corpus, the spec, the coverage briefing | Section plan; per section the exact supporting passage IDs; sources it cannot use, named with reasons | Every section resolves to real passages, and every source is used or explicitly explained |
| `sections` | One section: its mapped passages **at full length**, plus the whole plan | That section's blocks with `sourceRef`s | Every planned section has a valid persisted result |
| `verify` | All pieces, the plan, the inventory | A report naming pieces with unverified citations, uncovered sources, duplicate identities | The report exists; a clean one advances, a dirty one schedules targeted repairs |
| `repair` | Only the pieces the report named, with the problem | Replacements for exactly those | Each named piece rebuilt once, or its attempts are spent |
| `audit` | The assembled artifact and the full corpus | Approval, or blocking issues | Approved, or recorded unavailable. A rejection fails the job |
| `assemble` | Verified pieces in plan order, the closed citation set, the audit status | The finished artifact | Persisted as the job result |

`unit-mastery-outline-v1` uses the same stages with objectives as the unit. `unit-question-bank-v1` keeps its Anthropic-only carve-out — `inventory → draft → verify → assemble`, one grounded pass with required research, no cross-provider audit — because the section pipeline would break the single pass its specification requires. Small artifacts (flashcards, reading summary, revised notes, mock, term report) keep one drafting task and gain the durability, verification and audit stages around it. Nothing is forced into a common shape.

Only `outline` sees the whole corpus at once, and it stays fast because its **output** is a plan rather than prose. The passages it selects are carried into the writing stage at full length; nothing is summarised at the boundary.

## Quality rules

- **All original material is stored and retained.** `academic_source_chunks` is unchanged; the stage machine reads it under the owner's RLS and never rewrites it. A build whose corpus has lost a passage fails with `source-sync-incomplete` rather than generating from less.
- **Sources are uploaded once.** `sync-sources` uploads; every stage thereafter references stored passage IDs. No stage re-uploads source text.
- **Exact duplicate payload text is transferred once.** Identical passage text crosses the wire a single time, and every passage ID that carries it stays citable. This is a transfer optimisation and is stated as one — it does not shrink the corpus the model reasons over, and it is explicitly not a remedy for generation latency.
- **Meaningful repetition survives.** A repeated passage is reported with its occurrence count, its passage IDs, and whether the repeats sit inside one source (that source's own emphasis) or across sources (usually a running header). Collapsing that silently would delete an instructor's signal.
- **Redundant instructions are removed, not the requirements they carry.** The citation contract is stated once per request instead of once per section.

## Execution

- **Each stage is persisted before its successor is scheduled.** The order is: complete the task, seed the next stage's tasks, then move the stage pointer. A crash between stages restarts at the last completed stage, never mid-stage.
- **One invocation runs exactly one task.** Chaining a second would pretend the worker's clock restarts.
- **pg_cron drives it.** Every 10 seconds `dispatch_generation_work` fires one `net.http_post` per runnable task, capped by a batch. Closing the browser changes nothing. The page's own "nudge" on start is a latency courtesy; the lease makes an eager nudge and a scheduled tick unable to run the same task twice.
- **Durations are measured.** Every task records `duration_ms`, so headroom is observed rather than assumed. Stage ceilings are ≤115s against a 150s worker with 20s held back, and a provider stage that cannot finish in what this worker has left is handed back unstarted.
- **Duplicate work and duplicate charges are bounded by** the active-job dedupe index, the exclusive task lease, `(job, stage, task_key)` idempotency on fan-out, per-task attempt caps, and persisted provider request IDs. An `Idempotency-Key` header is sent as a best-effort mitigation; it is **not** the control, because its support on `/v1/responses` is unverified.
- **Ambiguous submission timeouts are handled explicitly.** A synchronous request that hits its deadline may have been accepted and billed. The task is marked `ambiguous`, the attempt is counted, and the message says so. Nothing assumes an interrupted request never landed.
- **Abort deadlines are failure controls.** They stop a worker being killed with nothing written down. They are not a claim that the work finishes — the stage shapes are what make the requests small.
- **Previously saved artifacts survive a failed replacement.** The job writes only to its own row; the composer writes to the student's entry only on success.

## Provider background mode is proved, never assumed

`background: true` plus `GET /v1/responses/{id}` is the right primitive for a long request, and it works with `store: false` (a background response is retained only long enough to be polled). Whether **Cheaper Inference** implements it is unknown and could not be tested from the development environment.

So the engine does not guess. `action: 'probe-background'` submits a real tiny background request on the live route and then attempts to **read the result back**, and records `background_submit` and `background_retrieve` separately in `generation_provider_capabilities`. Background mode is used only when both are true. Until then every stage runs synchronously — which its task shapes already keep small, so this is a genuinely bounded request and not an oversized one relabelled as a stage.

The earlier design's synchronous "fallback stage" was exactly that relabelling. It is gone.

## Deployment

1. `supabase db push` — applies `20260907010000_generation_task_stages.sql`.
2. Set the function secret: `supabase secrets set GENERATION_RUNNER_SECRET=<random>`. Optionally `EDGE_WALL_CLOCK_MS=400000` on a paid plan, and `GENERATION_STAGE_DEADLINE_MS` to tighten every stage ceiling.
3. Store the scheduler's credentials in Vault (the service role key is deliberately **not** used, so a database-side compromise cannot escalate):
   ```sql
   select vault.create_secret('https://<project>.supabase.co/functions/v1/study-tools', 'generation_runner_url');
   select vault.create_secret('<anon key>', 'generation_runner_jwt');
   select vault.create_secret('<same value as GENERATION_RUNNER_SECRET>', 'generation_runner_secret');
   ```
   Without these the dispatcher warns and does nothing; it never fails a build.
4. `supabase functions deploy study-tools`.
5. Run the capability probe once, signed in: `POST /functions/v1/study-tools {"action":"probe-background"}`. Read `usable` in the response.
6. Confirm the schedule: `select * from cron.job where jobname like 'premedos-generation%';`

## Verification

**Verified here.**

- *Against a real PostgreSQL 16 cluster* (`scripts/verify-generation-sql.sh`, `supabase/tests/generation_queue_test.sql`): both migrations apply; the active-job dedupe index collapses a double start; fan-out is idempotent; the lease is exclusive and a forged token is refused; a task outside the current stage is not claimable; the stage gate holds; attempts are bounded and a spent task fails its job with no result written; a failed job frees its dedupe key; the reaper releases a dead worker's lease; the dispatcher no-ops without Vault secrets and otherwise fires one call per runnable task capped by the batch; six concurrent claims return six distinct tasks; and RLS gives the owner read-only access while another signed-in user sees nothing, cannot claim, cannot dispatch, and cannot read the capability table.
- *Against the real compiled Edge handler* (`durableGeneration.integration.test.ts`, `masteryTransportRepair.integration.test.ts`): the stage sequence and one task per planned section; the planning call sees the whole corpus while each section call sees only its mapped passages; the artifact assembles in plan order with verified citations; a build completes with no client call after the start; each stage is persisted before the next is scheduled; a build resumes from the last completed stage after a worker dies mid-task without redoing finished stages; an unauthenticated runner call is refused; duplicate text is transferred once while the duplicate stays citable; a plan that leaves a source unexplained is refused; repair rebuilds only the flagged piece; attempts stay bounded; an ambiguous timeout is recorded as possibly billed; the engine stays synchronous with no capability row and records a submit-without-retrieve route as unusable; every task duration is recorded.
- 210 test files / 1402 tests pass. `npm run build`, `tsc -b` and `npm run lint` are clean (52 pre-existing warnings, unchanged).

**Not verified — the blocker.** No live signed-in generation was run. This environment's egress policy returns HTTP 403 on CONNECT for `premedos.app`, `poichxqptuupzrkyewrq.supabase.co`, `api.openai.com` and `api.cheaperinference.com`, and the Supabase CLI is not installed. Therefore: the migration is **not applied**, the function is **not deployed**, the cron job does **not exist yet**, and `probe-background` has **not been run**. Whether Cheaper Inference supports background submission and retrieval is still unknown, and real stage durations against the live route are unmeasured. Steps 1–6 above produce all of that.
