> **Superseded by `task-staged-generation-2026-09-07.md`.** Its diagnosis over-claimed: the 141-second Cheaper Inference failures do not by themselves prove a client disconnect, and `EarlyDrop` normally indicates completed work rather than a killed socket. The confirmed 150-second `WallClockTime` shutdown stands. The synchronous fallback described below was an oversized request relabelled as a stage and has been removed.

# Durable study generation — September 7, 2026

## Confirmed failure

Three independent signals name one cause.

- The Supabase `study-tools` function logged a **`WallClockTime` shutdown**: boot 19:16:21, shutdown 19:18:51 on September 6, 2026 — **exactly 150 seconds**.
- Cheaper Inference recorded two full generation requests **failing at about 141 seconds with zero tokens and zero provider attempts**. That is the shape of the *client* disconnecting, not of a provider refusing: roughly nine seconds of authentication, chunk retrieval and quota work, then 141 seconds of an open socket, ending when the worker was killed.
- A tiny request on the same saved `CHEAPER_INFERENCE_API_KEY`, the same `gpt-6-astra` model and the same `/v1/responses` endpoint returned **HTTP 200 in 2.9 seconds**. The credential and the route work.

So generation was not misconfigured and the provider was not down. **A single long call was held open inside one Edge invocation, and the platform ended the invocation.**

A later shutdown was **`EarlyDrop`**, which is a second, independent way the same design dies: a worker awaiting a socket performs no CPU work and can be retired as idle. The two failures share a design, not a symptom — which is why the fix is structural rather than a longer timeout.

Contributing directly: `postAstraResponse` issued its `fetch` with **no `AbortSignal`**, so nothing bounded the wait except the platform's own kill.

## Limits, verified before designing against them

Checked against Supabase's Edge Function limits and troubleshooting documentation, September 2026:

| Limit | Value | The part that matters |
|---|---|---|
| Wall clock (maximum duration) | **150s free, 400s paid** | It belongs to the **worker**, not the request. One worker may serve several requests during that window, so a call arriving late in a worker's life gets whatever is left — not a fresh 150s. |
| Request idle timeout | **150s**, then HTTP 504 | Separate from the above. |
| CPU time | ~2s per invocation | Not the binding constraint here; awaiting a socket is not CPU. |
| `EdgeRuntime.waitUntil` | Prevents early retirement | **Does not extend the wall clock.** Moving the same long call into a background task would not have fixed this. |
| Shutdown reasons | `WallClockTime` vs `EarlyDrop` | Hard ceiling versus idle retirement — the two failures observed. |

Sources: [Limits](https://supabase.com/docs/guides/functions/limits) · [Background Tasks](https://supabase.com/docs/guides/functions/background-tasks) · [Worker timeouts and WebSocket drops](https://supabase.com/docs/guides/troubleshooting/edge-functions-worker-timeouts-and-websocket-drops) · ["wall clock time limit reached"](https://supabase.com/docs/guides/troubleshooting/edge-function-wall-clock-time-limit-reached-Nk38bW) · [Shutdown reasons explained](https://supabase.com/docs/guides/troubleshooting/edge-function-shutdown-reasons-explained)

## The established method, back-checked

Per `reference-sources.md`, the repo first: Premed OS had **no** job or queue infrastructure — no `pg_cron`, no `pg_net`, no `pgmq`, no `EdgeRuntime.waitUntil` anywhere in `supabase/`. Nothing to extend.

The standard approach for work that exceeds a function's lifetime is the **asynchronous job pattern**: persist the job, return its id immediately, and drive it with short steps a worker can survive; the client polls status rather than holding a connection. Supabase's own troubleshooting guidance states it directly — *"split work into smaller units and move long work to async/background processing and return early."* The community pattern for the driving half is Supabase Cron + Queues invoking the function repeatedly.

The provider half is [OpenAI's background mode](https://developers.openai.com/api/docs/guides/background): submit with `background: true`, receive a response id in seconds, then poll `GET /v1/responses/{id}` until it leaves `queued`/`in_progress`. This is exactly the primitive the durable design needs, and it works with `store: false` — a background response is retained only long enough to be polled, so the app's no-retention stance is unchanged.

**Where this departs from the standard shape, deliberately:** the driver is the browser, not `pg_cron`. Each step is a normal function call, so the mechanism needs no new database extension and no scheduling infrastructure, and it can be verified end to end in the test suite. The cost of the departure is that a closed page pauses the job instead of finishing it unattended; the job stays durable and is resumed on reopen. A cron-driven runner can be added later against the same table without changing the steps.

## Design

**Job store** — `study_generation_jobs` (`20260906230000_study_generation_jobs.sql`). Owner-read RLS; every mutation goes through `security invoker` RPCs the service role alone may execute.

- A **partial unique index** over `(user_id, dedupe_key)` restricted to live jobs means a double press, a retry after a dropped connection, or a second tab converge on one job. Quota is claimed only for a job that was actually created.
- A **single-runner lease** (`lease_generation_job`) means two runners cannot both pay for one step; every write requires the lease token, so a runner whose worker was retired mid-step cannot overwrite its successor.
- The row holds identifiers, prompts and diagnostics. **No source text, no credentials.** Passages are re-read from the caller's own mirror under their RLS, and only by the steps that need them.

**Bounded steps** — `submit → poll → audit → done`, with `sync` as the fallback branch.

- Worker budget is read at **module scope**, which is worker boot: a step that cannot finish inside what this worker has left is not started, it is handed back for the next invocation. `EDGE_WALL_CLOCK_MS` moves the ceiling to 400000 on a paid plan with no code change.
- Every provider call now carries an `AbortSignal` deadline clamped to the remaining budget. A timeout is a recorded, resumable job failure rather than a killed worker.
- Polls widen from 3s toward 15s, and do not re-read the source mirror. A build polled for minutes costs a handful of invocations.

**When the route has no background mode.** Cheaper Inference's support for `background: true` is **unverified** — it could not be exercised from the development environment. An unknown-parameter rejection is detected as a capability answer rather than an outage (`isBackgroundParameterRejection`), is not charged as a generation attempt, and moves the job to `sync`: one bounded synchronous call on its own fresh worker, so the model gets the whole budget instead of the tail of an invocation. That is strictly better than the behaviour it replaces even in the worst case, because the outcome is persisted either way.

## Policy preserved

- **`gpt-6-astra` remains the generation model**, pinned in one payload builder shared by all three routes.
- **Cheaper Inference remains primary.** The direct-OpenAI backup still activates only on an explicit `insufficient_balance` 402, under the $10/week app-enforced cap; the durable submit reuses that policy rather than restating it, and settles the allowance from real usage when the background response turns terminal. Timeouts, auth failures and rate limits never reach the backup.
- **The Anthropic audit keeps its authority.** It still blocks a result it rejects; only its runtime is bounded, and an unreachable review is still reported as `unavailable`.
- **Citation and source validation are unchanged.** An unaudited artifact is never exposed: `publicJob` releases a result only once the job has succeeded.

## Bounded paid work

Two provider attempts per job: the authoring pass, and **one** rebuild after a citation rejection. That rebuild moved from the client into the job, carrying the artifact-specific guidance the client used to add (`artifactRepairGuidance`), because only there can the attempt budget be enforced. `generateWithSourceRecovery` no longer replays a citation rejection itself — replaying it in both places would mean a second job and paid work nobody is counting.

## Errors the student can act on

`"AI study tools are unavailable. Your local data was not changed."` was hiding a timeout, a refused artifact and a spent allowance behind one sentence. A failed job now carries a code, a sentence, the upstream HTTP status and the provider's request id — enough to trace a failure with Cheaper Inference or OpenAI, and containing no credential, prompt or study material. `generationJobFailure` maps each code to a specific message.

## Verification

Automated, against the **real compiled Edge handler** with a faithful in-memory job store (`edgeStudyToolsHarness.testing.ts`): job recorded with no provider call; submit → poll → audit progression; unaudited artifacts withheld; refresh resuming the same job; double press rejoining one job; a held lease refusing a second paid step; the two-attempt cap and its repair guidance; a timeout named as a timeout with status and request id; the background-unsupported fallback; polls not re-reading source; failure persisting no result. Plus worker-budget and routing-policy unit coverage. 208 files / 1375 tests pass; `npm run build` and `npm run lint` are clean.

**Not verified.** A real signed-in generation through premedos.app was not performed: this development environment's egress proxy blocks both `premedos.app` and the Supabase project (`CONNECT tunnel failed, 403`), and the Supabase CLI is not installed. The migration is **not applied** and the function is **not deployed**. Specifically unverified until then: whether Cheaper Inference implements `background: true` (the `sync` fallback exists for that answer), real end-to-end timing, and the RPCs against real Postgres rather than their in-memory equivalents.
