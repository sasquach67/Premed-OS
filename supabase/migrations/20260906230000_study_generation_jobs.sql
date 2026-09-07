-- Durable study-generation jobs.
--
-- Why this table exists: a Supabase Edge Function worker has a wall-clock
-- lifetime (150s free / 400s paid, per Supabase's Edge Function limits docs),
-- and that clock belongs to the WORKER, not to the request — a worker may
-- already be part-way through its life when it picks up a call, and it can also
-- be retired early (EarlyDrop) while it looks idle awaiting a socket. Holding a
-- multi-minute gpt-6-astra call open inside one invocation therefore loses the
-- work with nothing recorded, which is exactly the failure this replaces.
--
-- The job row is the durable record. Each Edge invocation leases it, performs
-- ONE bounded step well inside the remaining worker budget, writes progress
-- back, and returns. Closing or refreshing the page cannot lose the job.
--
-- Privacy: this table stores request *identifiers* and prompts, never source
-- material text, never provider credentials. Chunk text stays in
-- academic_source_chunks, which the function reads under the caller's RLS.

create table public.study_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Client-supplied idempotency key over (course, scope, spec, chunk set,
  -- request). Two presses of Create entry for the same build join one job.
  dedupe_key text not null check (char_length(dedupe_key) between 1 and 200),
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed')),
  -- The resumable cursor. Steps are ordered and each one is short.
  step text not null default 'submit' check (step in ('submit','sync','poll','audit','done')),
  -- Short label the composer shows; never contains study material.
  phase text not null default 'Preparing',
  payload jsonb not null,
  -- Which upstream actually holds the in-flight response, so a later step polls
  -- the same one. 'wallet' = Cheaper Inference, 'openai-backup' = capped direct.
  provider_route text check (provider_route in ('wallet','openai-backup')),
  provider_response_id text,
  -- Set only when the capped direct-OpenAI backup carried this job, so the
  -- allowance is settled against real usage once the response is terminal.
  backup_reservation_id uuid,
  -- Paid work is bounded here, not by client good behaviour.
  provider_attempts integer not null default 0 check (provider_attempts >= 0),
  poll_count integer not null default 0 check (poll_count >= 0),
  -- Single-runner lease: two tabs cannot both pay for the same step.
  lease_token uuid,
  lease_expires_at timestamptz,
  quota_reservation_cents integer not null default 0 check (quota_reservation_cents >= 0),
  result jsonb,
  -- { code, message, providerStatus, requestId } — diagnostics only.
  error jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);

-- Dedupe is scoped to jobs that are still live. A finished job must not block
-- an intentional rebuild of the same material.
create unique index study_generation_jobs_active_dedupe
  on public.study_generation_jobs (user_id, dedupe_key)
  where status in ('queued','running');
create index study_generation_jobs_user_recent
  on public.study_generation_jobs (user_id, created_at desc);

alter table public.study_generation_jobs enable row level security;
revoke all on public.study_generation_jobs from public, anon, authenticated;
grant all on public.study_generation_jobs to service_role;

-- The owner may read their own jobs directly (Realtime/status), never write:
-- every mutation goes through the service-role Edge function so that leases,
-- attempt caps, and quota accounting cannot be bypassed from a browser.
grant select on public.study_generation_jobs to authenticated;
create policy study_generation_jobs_owner_read on public.study_generation_jobs
  for select to authenticated using (user_id = (select auth.uid()));

/**
 * Claim or rejoin a job. Returns the row plus whether this call created it.
 * The dedupe index makes a concurrent double-press converge on one job rather
 * than paying twice.
 */
create function public.start_generation_job(
  p_user_id uuid,
  p_dedupe_key text,
  p_payload jsonb,
  p_reservation_cents integer default 0
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  v_row public.study_generation_jobs;
  v_created boolean := true;
begin
  if p_user_id is null or p_dedupe_key is null or p_payload is null then
    raise exception 'Invalid generation job request';
  end if;

  -- Reap abandoned work before deduping, so a crashed job cannot wedge the key.
  update public.study_generation_jobs
     set status = 'failed',
         step = 'done',
         phase = 'Stopped',
         error = jsonb_build_object('code','job-expired','message','This build stopped before it finished and was not saved.'),
         updated_at = now()
   where user_id = p_user_id
     and status in ('queued','running')
     and expires_at < now();

  insert into public.study_generation_jobs (user_id, dedupe_key, payload, quota_reservation_cents)
  values (p_user_id, p_dedupe_key, p_payload, greatest(coalesce(p_reservation_cents, 0), 0))
  on conflict do nothing
  returning * into v_row;

  if v_row.id is null then
    v_created := false;
    select * into v_row from public.study_generation_jobs
     where user_id = p_user_id and dedupe_key = p_dedupe_key and status in ('queued','running')
     limit 1;
  end if;

  if v_row.id is null then raise exception 'Generation job could not be claimed'; end if;
  return jsonb_build_object('created', v_created, 'job', to_jsonb(v_row));
end $$;

/**
 * Take the single runner lease for one bounded step.
 *
 * Returns null when the job is finished or another runner holds an unexpired
 * lease. That null is what stops two tabs — or a retry racing its own first
 * attempt — from issuing two paid provider calls for one job.
 */
create function public.lease_generation_job(
  p_user_id uuid,
  p_job_id uuid,
  p_lease_seconds integer default 120
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_row public.study_generation_jobs;
begin
  if p_lease_seconds is null or p_lease_seconds < 1 or p_lease_seconds > 600 then
    raise exception 'Invalid lease window';
  end if;
  update public.study_generation_jobs
     set lease_token = gen_random_uuid(),
         lease_expires_at = now() + make_interval(secs => p_lease_seconds),
         status = 'running',
         updated_at = now()
   where id = p_job_id
     and user_id = p_user_id
     and status in ('queued','running')
     and (lease_expires_at is null or lease_expires_at < now())
  returning * into v_row;
  if v_row.id is null then return null; end if;
  return to_jsonb(v_row);
end $$;

/**
 * Write one step's outcome. The lease token is required, so a runner whose
 * lease already expired (its worker was retired mid-step) cannot overwrite the
 * progress of the runner that legitimately took over.
 *
 * A succeeded job keeps its result forever-ish; a failed one keeps a
 * diagnostics-only error. Neither ever holds study material or a credential.
 */
create function public.update_generation_job(
  p_job_id uuid,
  p_lease_token uuid,
  p_status text default null,
  p_step text default null,
  p_payload jsonb default null,
  p_phase text default null,
  p_provider_route text default null,
  p_provider_response_id text default null,
  p_backup_reservation_id uuid default null,
  p_clear_backup_reservation boolean default false,
  p_provider_attempts_delta integer default 0,
  p_poll_delta integer default 0,
  p_result jsonb default null,
  p_error jsonb default null,
  p_release_lease boolean default true
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_row public.study_generation_jobs;
begin
  update public.study_generation_jobs
     set status = coalesce(p_status, status),
         step = coalesce(p_step, step),
         payload = coalesce(p_payload, payload),
         phase = coalesce(p_phase, phase),
         provider_route = coalesce(p_provider_route, provider_route),
         provider_response_id = coalesce(p_provider_response_id, provider_response_id),
         backup_reservation_id = case when coalesce(p_clear_backup_reservation, false) then null
                                      else coalesce(p_backup_reservation_id, backup_reservation_id) end,
         provider_attempts = provider_attempts + greatest(coalesce(p_provider_attempts_delta, 0), 0),
         poll_count = poll_count + greatest(coalesce(p_poll_delta, 0), 0),
         result = coalesce(p_result, result),
         error = case when p_error is not null then p_error
                      when coalesce(p_status, status) = 'succeeded' then null
                      else error end,
         lease_token = case when coalesce(p_release_lease, true) then null else lease_token end,
         lease_expires_at = case when coalesce(p_release_lease, true) then null else lease_expires_at end,
         updated_at = now()
   where id = p_job_id and lease_token = p_lease_token
  returning * into v_row;
  if v_row.id is null then return null; end if;
  return to_jsonb(v_row);
end $$;

revoke all on function
  public.start_generation_job(uuid, text, jsonb, integer),
  public.lease_generation_job(uuid, uuid, integer),
  public.update_generation_job(uuid, uuid, text, text, jsonb, text, text, text, uuid, boolean, integer, integer, jsonb, jsonb, boolean)
  from public, anon, authenticated;
grant execute on function
  public.start_generation_job(uuid, text, jsonb, integer),
  public.lease_generation_job(uuid, uuid, integer),
  public.update_generation_job(uuid, uuid, text, text, jsonb, text, text, text, uuid, boolean, integer, integer, jsonb, jsonb, boolean)
  to service_role;
