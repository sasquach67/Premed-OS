-- Measured execution budgets, and the columns that make subdivision durable.
--
-- "Small by construction" is a claim about shape, not about time. This records
-- what each stage actually costs on THIS deployment so the runner can size the
-- next request against measurement instead of hope, and can subdivide a task
-- before sending it rather than discovering the problem as a dead worker.
--
-- No secrets and no source text: character counts, token counts, durations.

create table public.generation_stage_stats (
  spec_id text not null,
  stage text not null,
  samples integer not null default 0 check (samples >= 0),
  -- Exponentially weighted rates, maintained by the runner.
  ms_per_output_token double precision not null default 14,
  ms_per_kilo_input_char double precision not null default 40,
  max_ms integer not null default 0,
  -- Largest request that has actually completed, for sanity against estimates.
  max_input_chars integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (spec_id, stage)
);
alter table public.generation_stage_stats enable row level security;
revoke all on public.generation_stage_stats from public, anon, authenticated;
grant all on public.generation_stage_stats to service_role;

alter table public.study_generation_tasks
  -- A task proven too large for one request. It is never retried unchanged:
  -- the next attempt must be a subdivision, or the job fails with a reason.
  add column if not exists oversized boolean not null default false,
  -- Set on subtasks, so a subdivided piece knows what it belongs to and the
  -- assembler can put it back in its parent's place.
  add column if not exists parent_task_key text,
  -- Ordering within a parent, for coherent reassembly.
  add column if not exists part integer not null default 0,
  -- What sizing predicted, kept beside what it actually took.
  add column if not exists estimated_ms integer,
  add column if not exists input_chars integer,
  add column if not exists output_tokens integer;

create index if not exists study_generation_tasks_parent
  on public.study_generation_tasks (job_id, stage, parent_task_key);

/**
 * Fold one completed provider request into a stage's measured rates.
 *
 * Attribution between input and output follows what the current rates predict,
 * so neither term silently absorbs the other's cost. `max_ms` is a high-water
 * mark: a stage that has ever run long is treated as able to run long again.
 */
create function public.record_stage_duration(
  p_spec_id text,
  p_stage text,
  p_duration_ms integer,
  p_input_chars integer,
  p_output_tokens integer
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  v_row public.generation_stage_stats;
  v_alpha constant double precision := 0.3;
  v_overhead constant double precision := 3000;
  v_work double precision;
  v_input_kilo double precision;
  v_output double precision;
  v_pred_in double precision;
  v_pred_out double precision;
  v_total double precision;
begin
  if p_duration_ms is null or p_duration_ms <= 0 then return null; end if;

  insert into public.generation_stage_stats (spec_id, stage)
  values (p_spec_id, p_stage)
  on conflict (spec_id, stage) do nothing;

  select * into v_row from public.generation_stage_stats
   where spec_id = p_spec_id and stage = p_stage for update;

  v_work := greatest(p_duration_ms - v_overhead, 1);
  v_input_kilo := greatest(coalesce(p_input_chars, 0) / 1000.0, 0.001);
  v_output := greatest(coalesce(p_output_tokens, 0), 1);
  v_pred_in := v_input_kilo * v_row.ms_per_kilo_input_char;
  v_pred_out := v_output * v_row.ms_per_output_token;
  v_total := greatest(v_pred_in + v_pred_out, 1);

  update public.generation_stage_stats
     set samples = samples + 1,
         ms_per_kilo_input_char = ms_per_kilo_input_char * (1 - v_alpha)
           + ((v_work * (v_pred_in / v_total)) / v_input_kilo) * v_alpha,
         ms_per_output_token = ms_per_output_token * (1 - v_alpha)
           + ((v_work * (v_pred_out / v_total)) / v_output) * v_alpha,
         max_ms = greatest(max_ms, p_duration_ms),
         max_input_chars = greatest(max_input_chars, coalesce(p_input_chars, 0)),
         updated_at = now()
   where spec_id = p_spec_id and stage = p_stage
  returning * into v_row;
  return to_jsonb(v_row);
end $$;

revoke all on function public.record_stage_duration(text, text, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.record_stage_duration(text, text, integer, integer, integer) to service_role;

/**
 * A subdivided retry. Marks the oversized task skipped and adds its parts in
 * one transaction, so a task can never be both "retrying unchanged" and
 * "subdivided" — and a crash between the two cannot lose either.
 */
create function public.subdivide_generation_task(
  p_task_id uuid,
  p_lease_token uuid,
  p_parts jsonb
) returns integer
language plpgsql security invoker set search_path = '' as $$
declare v_task public.study_generation_tasks; v_added integer;
begin
  select * into v_task from public.study_generation_tasks
   where id = p_task_id and lease_token = p_lease_token for update;
  if v_task.id is null then return null; end if;
  if jsonb_array_length(coalesce(p_parts, '[]'::jsonb)) = 0 then return 0; end if;

  with incoming as (
    select
      (value->>'taskKey')::text as task_key,
      coalesce((value->>'ordinal')::integer, v_task.ordinal) as ordinal,
      coalesce((value->>'part')::integer, 0) as part,
      coalesce(value->>'label', v_task.label) as label,
      coalesce(value->'input', '{}'::jsonb) as input
    from jsonb_array_elements(p_parts) as value
  ), inserted as (
    insert into public.study_generation_tasks
      (job_id, stage, ordinal, task_key, label, input, max_attempts, parent_task_key, part)
    select v_task.job_id, v_task.stage, ordinal, task_key, label, input, v_task.max_attempts,
           coalesce(v_task.parent_task_key, v_task.task_key), part
      from incoming
    on conflict (job_id, stage, task_key) do nothing
    returning 1
  )
  select count(*) into v_added from inserted;

  update public.study_generation_tasks
     set status = 'skipped', oversized = true, lease_token = null, lease_expires_at = null,
         finished_at = now(), updated_at = now()
   where id = p_task_id;
  return v_added;
end $$;

revoke all on function public.subdivide_generation_task(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.subdivide_generation_task(uuid, uuid, jsonb) to service_role;

-- Sections are independent, so throughput is a dispatch question, not a
-- latency one. Tick faster and dispatch wider; the lease still guarantees a
-- task is claimed once. Re-scheduling by the same job name replaces the entry
-- rather than adding a second scheduler.
select cron.unschedule('premedos-generation-runner');
select cron.schedule('premedos-generation-runner', '5 seconds', $cron$ select public.dispatch_generation_work(8) $cron$);
