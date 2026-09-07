-- Task-based generation stages, driven by a durable server-side scheduler.
--
-- The previous shape kept one job row and asked the browser to advance it. That
-- made the browser the scheduler: close the tab and the build stopped. Here the
-- work is decomposed into TASKS — a plan, one section, the audit — and pg_cron
-- drives them through pg_net. The browser only watches.
--
-- A task is a piece of the ARTIFACT, never a slice of the material. Splitting
-- inputs into equal batches would truncate context and break cross-source
-- reasoning; splitting the output by its own structure keeps every task
-- grounded in all the evidence that bears on it while keeping each provider
-- request small enough to finish inside one Edge invocation with real headroom.
--
-- Privacy: these rows hold identifiers, plans, generated artifact fragments and
-- diagnostics. Source text stays in academic_source_chunks and is read under
-- the owner's RLS. No credentials are stored here.

alter table public.study_generation_jobs
  add column if not exists spec_id text,
  add column if not exists stage text not null default 'inventory',
  -- Coverage inventory from stage one: passages per source, empty passages,
  -- repeated-text groups. Proof of what the build actually had to work with.
  add column if not exists inventory jsonb,
  -- The section/objective plan and its passage map.
  add column if not exists outline jsonb,
  -- Verification report; drives targeted repair rather than a whole rebuild.
  add column if not exists verification jsonb,
  add column if not exists progress real not null default 0;

/**
 * One unit of work. Ordinal orders tasks within a stage; `task_key` makes a
 * task idempotent, so a redelivered dispatch or a retried fan-out can never
 * create a second copy of the same piece of work — or pay for one.
 */
create table public.study_generation_tasks (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.study_generation_jobs(id) on delete cascade,
  stage text not null,
  ordinal integer not null default 0,
  task_key text not null,
  status text not null default 'pending' check (status in ('pending','running','done','failed','skipped')),
  label text not null default '',
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 2 check (max_attempts >= 1),
  -- Persisted so an ambiguous submission can be reconciled against the provider
  -- instead of guessed at, and so a retry is never a blind second charge.
  provider_route text check (provider_route in ('wallet','openai-backup','anthropic')),
  provider_request_id text,
  provider_response_id text,
  -- Set only when the capped direct-OpenAI backup carried this task, so the
  -- $10/week allowance is settled against real usage once the response lands.
  backup_reservation_id uuid,
  idempotency_key uuid not null default gen_random_uuid(),
  -- True when a request timed out with no confirmed outcome: it may have been
  -- accepted and billed. Never silently retried.
  ambiguous boolean not null default false,
  lease_token uuid,
  lease_expires_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  -- Measured, so headroom under the worker lifetime is observed, not assumed.
  duration_ms integer,
  error jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index study_generation_tasks_key on public.study_generation_tasks (job_id, stage, task_key);
create index study_generation_tasks_runnable on public.study_generation_tasks (job_id, stage, status);
create index study_generation_tasks_claim on public.study_generation_tasks (status, lease_expires_at);

alter table public.study_generation_tasks enable row level security;
revoke all on public.study_generation_tasks from public, anon, authenticated;
grant all on public.study_generation_tasks to service_role;
grant select on public.study_generation_tasks to authenticated;
create policy study_generation_tasks_owner_read on public.study_generation_tasks
  for select to authenticated using (
    exists (select 1 from public.study_generation_jobs job
             where job.id = job_id and job.user_id = (select auth.uid()))
  );

/**
 * What the provider route can actually do, proved against the live deployment.
 *
 * Background submission is useless without retrieval, so both are recorded
 * separately and a route counts as capable only when a real request was
 * submitted AND its result was later read back. Nothing infers this from
 * documentation or from a test double.
 */
create table public.generation_provider_capabilities (
  route text primary key check (route in ('wallet','openai-backup')),
  background_submit boolean not null default false,
  background_retrieve boolean not null default false,
  checked_at timestamptz not null default now(),
  -- Diagnostics only: status codes, provider request ids, a short reason.
  detail jsonb
);
alter table public.generation_provider_capabilities enable row level security;
revoke all on public.generation_provider_capabilities from public, anon, authenticated;
grant all on public.generation_provider_capabilities to service_role;

/**
 * Claim the next runnable task, across all jobs.
 *
 * Runnable means: its job is live, its stage is the job's current stage, it has
 * attempts left, and nobody holds an unexpired lease. Ordering by ordinal keeps
 * a document's sections in reading order, which matters for the cross-section
 * context each one receives.
 *
 * The lease is the duplicate-charge control: two dispatches in the same tick
 * cannot both take the same task, so they cannot both pay for it.
 *
 * The scheduler claims across all jobs. A signed-in owner nudging their own
 * build passes both ids, so an eager nudge can only ever advance the build that
 * asked for it — the scoping is enforced here rather than trusted to the caller.
 */
create function public.claim_generation_task(
  p_lease_seconds integer default 100,
  p_job_id uuid default null,
  p_user_id uuid default null
)
returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_task public.study_generation_tasks; v_job public.study_generation_jobs;
begin
  if p_lease_seconds is null or p_lease_seconds < 10 or p_lease_seconds > 600 then
    raise exception 'Invalid lease window';
  end if;

  select t.* into v_task
    from public.study_generation_tasks t
    join public.study_generation_jobs j on j.id = t.job_id
   where t.status in ('pending','running')
     and t.stage = j.stage
     and j.status in ('queued','running')
     and j.expires_at > now()
     and t.attempts < t.max_attempts
     and (t.lease_expires_at is null or t.lease_expires_at < now())
     and (p_job_id is null or t.job_id = p_job_id)
     and (p_user_id is null or j.user_id = p_user_id)
   order by j.created_at, t.ordinal, t.created_at
   limit 1
   for update of t skip locked;

  if v_task.id is null then return null; end if;

  update public.study_generation_tasks
     set status = 'running',
         lease_token = gen_random_uuid(),
         lease_expires_at = now() + make_interval(secs => p_lease_seconds),
         attempts = attempts + 1,
         started_at = coalesce(started_at, now()),
         updated_at = now()
   where id = v_task.id
  returning * into v_task;

  update public.study_generation_jobs
     set status = 'running', updated_at = now()
   where id = v_task.job_id and status = 'queued';

  select * into v_job from public.study_generation_jobs where id = v_task.job_id;
  return jsonb_build_object('task', to_jsonb(v_task), 'job', to_jsonb(v_job));
end $$;

/**
 * Record a finished task. The lease token is required, so a runner whose worker
 * was retired mid-task cannot overwrite the runner that legitimately took over.
 *
 * A task that has spent its attempts fails its whole job: the artifact would
 * otherwise be missing a piece, and a partial artifact is worse than an honest
 * failure. Previously saved work is untouched — this table never writes to the
 * student's stored entries.
 */
create function public.complete_generation_task(
  p_task_id uuid,
  p_lease_token uuid,
  p_status text,
  p_output jsonb default null,
  p_error jsonb default null,
  p_duration_ms integer default null,
  p_provider_route text default null,
  p_provider_request_id text default null,
  p_provider_response_id text default null,
  p_backup_reservation_id uuid default null,
  p_clear_backup_reservation boolean default false,
  p_ambiguous boolean default null
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_task public.study_generation_tasks; v_retryable boolean;
begin
  if p_status not in ('done','failed','pending') then raise exception 'Invalid task status'; end if;

  update public.study_generation_tasks
     set status = p_status,
         output = coalesce(p_output, output),
         error = case when p_error is not null then p_error when p_status = 'done' then null else error end,
         duration_ms = coalesce(p_duration_ms, duration_ms),
         provider_route = coalesce(p_provider_route, provider_route),
         provider_request_id = coalesce(p_provider_request_id, provider_request_id),
         provider_response_id = coalesce(p_provider_response_id, provider_response_id),
         backup_reservation_id = case when coalesce(p_clear_backup_reservation, false) then null
                                      else coalesce(p_backup_reservation_id, backup_reservation_id) end,
         ambiguous = coalesce(p_ambiguous, ambiguous),
         finished_at = case when p_status in ('done','failed') then now() else finished_at end,
         lease_token = null,
         lease_expires_at = null,
         updated_at = now()
   where id = p_task_id and lease_token = p_lease_token
  returning * into v_task;

  if v_task.id is null then return null; end if;

  if p_status = 'failed' then
    v_retryable := v_task.attempts < v_task.max_attempts;
    if v_retryable then
      -- Leave it claimable again; the attempt counter already moved.
      update public.study_generation_tasks set status = 'pending', updated_at = now() where id = v_task.id;
    else
      update public.study_generation_jobs
         set status = 'failed', stage = 'done', phase = 'Stopped',
             error = coalesce(v_task.error, jsonb_build_object('code','stage-failed','message','A generation stage could not be completed. Nothing was saved.')),
             updated_at = now()
       where id = v_task.job_id;
    end if;
  end if;

  return to_jsonb(v_task);
end $$;

/**
 * Create a stage's tasks. Idempotent by (job, stage, task_key), so a fan-out
 * that is retried after an interrupted write adds nothing the second time.
 */
create function public.add_generation_tasks(p_job_id uuid, p_stage text, p_tasks jsonb)
returns integer
language plpgsql security invoker set search_path = '' as $$
declare v_added integer;
begin
  with incoming as (
    select
      (value->>'taskKey')::text as task_key,
      coalesce((value->>'ordinal')::integer, 0) as ordinal,
      coalesce(value->>'label','') as label,
      coalesce(value->'input','{}'::jsonb) as input,
      coalesce((value->>'maxAttempts')::integer, 2) as max_attempts
    from jsonb_array_elements(p_tasks) as value
  ), inserted as (
    insert into public.study_generation_tasks (job_id, stage, ordinal, task_key, label, input, max_attempts)
    select p_job_id, p_stage, ordinal, task_key, label, input, max_attempts from incoming
    on conflict (job_id, stage, task_key) do nothing
    returning 1
  )
  select count(*) into v_added from inserted;
  return v_added;
end $$;

/**
 * Move a job to its next stage once every task of the current stage is done.
 *
 * The stage is persisted BEFORE the successor's tasks become claimable, which
 * is what makes a crash between stages recoverable: the job restarts at the
 * last completed stage, never in the middle of one.
 */
create function public.advance_generation_stage(p_job_id uuid, p_next_stage text, p_progress real default null)
returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_open integer; v_job public.study_generation_jobs;
begin
  select count(*) into v_open
    from public.study_generation_tasks t
    join public.study_generation_jobs j on j.id = t.job_id
   where t.job_id = p_job_id and t.stage = j.stage and t.status not in ('done','skipped');
  if v_open > 0 then return null; end if;

  update public.study_generation_jobs
     set stage = p_next_stage,
         progress = coalesce(p_progress, progress),
         updated_at = now()
   where id = p_job_id and status in ('queued','running')
  returning * into v_job;
  return to_jsonb(v_job);
end $$;

/** Live stage counts for the composer's single continuous progress reading. */
create function public.generation_job_view(p_job_id uuid)
returns jsonb
language sql security invoker set search_path = '' stable as $$
  select jsonb_build_object(
    'job', to_jsonb(j),
    'stageDone', (select count(*) from public.study_generation_tasks t where t.job_id = j.id and t.stage = j.stage and t.status in ('done','skipped')),
    'stageTotal', (select count(*) from public.study_generation_tasks t where t.job_id = j.id and t.stage = j.stage),
    'tasks', (select coalesce(jsonb_agg(jsonb_build_object(
        'stage', t.stage, 'ordinal', t.ordinal, 'label', t.label, 'status', t.status,
        'attempts', t.attempts, 'durationMs', t.duration_ms, 'ambiguous', t.ambiguous
      ) order by t.stage, t.ordinal), '[]'::jsonb)
      from public.study_generation_tasks t where t.job_id = j.id)
  )
  from public.study_generation_jobs j where j.id = p_job_id;
$$;

revoke all on function
  public.claim_generation_task(integer, uuid, uuid),
  public.complete_generation_task(uuid, uuid, text, jsonb, jsonb, integer, text, text, text, uuid, boolean, boolean),
  public.add_generation_tasks(uuid, text, jsonb),
  public.advance_generation_stage(uuid, text, real),
  public.generation_job_view(uuid)
  from public, anon, authenticated;
grant execute on function
  public.claim_generation_task(integer, uuid, uuid),
  public.complete_generation_task(uuid, uuid, text, jsonb, jsonb, integer, text, text, text, uuid, boolean, boolean),
  public.add_generation_tasks(uuid, text, jsonb),
  public.advance_generation_stage(uuid, text, real),
  public.generation_job_view(uuid)
  to service_role;
grant execute on function public.generation_job_view(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- The durable scheduler.
--
-- pg_cron ticks inside Postgres and pg_net makes the call, so nothing about a
-- running build depends on a browser being open. Sub-minute schedules need
-- Postgres 15.1.1.61+; pg_cron is enabled by default on Supabase projects.
-- ---------------------------------------------------------------------------

create extension if not exists pg_cron;
create extension if not exists pg_net;

/**
 * Fire one HTTP call per runnable task, up to p_batch.
 *
 * The call carries a JWT so the function's verify_jwt passes, plus a runner
 * secret that authorises the task endpoint. Both live in Vault: the service
 * role key is deliberately NOT used here, so a database-side compromise cannot
 * escalate to full table access.
 *
 * Over-dispatching is harmless — an extra call finds no claimable task and
 * returns — while under-dispatching only delays a task to the next tick. The
 * lease, not the dispatch count, is what prevents duplicate work.
 */
create function public.dispatch_generation_work(p_batch integer default 4)
returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_url text; v_jwt text; v_secret text; v_runnable integer; v_sent integer := 0;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'generation_runner_url';
  select decrypted_secret into v_jwt from vault.decrypted_secrets where name = 'generation_runner_jwt';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'generation_runner_secret';
  if v_url is null or v_jwt is null or v_secret is null then
    raise warning 'generation runner secrets are not configured; no work dispatched';
    return 0;
  end if;

  select count(*) into v_runnable
    from public.study_generation_tasks t
    join public.study_generation_jobs j on j.id = t.job_id
   where t.status in ('pending','running')
     and t.stage = j.stage
     and j.status in ('queued','running')
     and j.expires_at > now()
     and t.attempts < t.max_attempts
     and (t.lease_expires_at is null or t.lease_expires_at < now());

  while v_sent < least(v_runnable, greatest(p_batch, 1)) loop
    perform net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_jwt,
        'x-generation-runner', v_secret
      ),
      body := jsonb_build_object('action', 'run-task'),
      timeout_milliseconds := 120000
    );
    v_sent := v_sent + 1;
  end loop;
  return v_sent;
end $$;

revoke all on function public.dispatch_generation_work(integer) from public, anon, authenticated;
grant execute on function public.dispatch_generation_work(integer) to service_role;

/**
 * Release the leases of runners that died mid-task.
 *
 * An Edge worker retired mid-task leaves a lease that will expire on its own,
 * but a job whose every task is stalled should not wait for that silently. This
 * also fails jobs that outlived their expiry so a wedged build cannot hold its
 * dedupe key forever.
 */
create function public.reap_generation_work()
returns integer
language plpgsql security definer set search_path = '' as $$
declare v_reaped integer;
begin
  with released as (
    update public.study_generation_tasks
       set status = 'pending', lease_token = null, lease_expires_at = null, updated_at = now()
     where status = 'running' and lease_expires_at is not null and lease_expires_at < now()
    returning 1
  ) select count(*) into v_reaped from released;

  update public.study_generation_jobs
     set status = 'failed', stage = 'done', phase = 'Stopped',
         error = jsonb_build_object('code','job-expired','message','This build stopped before it finished and was not saved. Your material and any previously saved entry are unchanged.'),
         updated_at = now()
   where status in ('queued','running') and expires_at < now();
  return v_reaped;
end $$;
revoke all on function public.reap_generation_work() from public, anon, authenticated;
grant execute on function public.reap_generation_work() to service_role;

-- Every 10 seconds: dispatch runnable work. Every minute: release dead leases.
-- `cron.schedule` is idempotent by job name, so re-running this migration is safe.
select cron.schedule('premedos-generation-runner', '10 seconds', $cron$ select public.dispatch_generation_work(4) $cron$);
select cron.schedule('premedos-generation-reaper', '1 minute', $cron$ select public.reap_generation_work() $cron$);
