-- Usage telemetry is separate from budget reservations. No prompt/output text or keys.
create table public.study_generation_usage (
  id uuid primary key,
  job_id uuid not null references public.study_generation_jobs(id) on delete cascade,
  task_id uuid not null references public.study_generation_tasks(id) on delete cascade,
  stage text not null,
  provider text not null check (provider in ('openai','cheaper-inference','anthropic')),
  model text,
  response_id text,
  request_id text,
  status text not null default 'pending',
  http_status integer,
  input_tokens bigint,
  output_tokens bigint,
  cached_input_tokens bigint,
  cache_write_tokens bigint,
  reasoning_tokens bigint,
  estimated_usd numeric,
  pricing_basis text not null default 'unknown',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (input_tokens is null or input_tokens >= 0),
  check (output_tokens is null or output_tokens >= 0),
  check (estimated_usd is null or estimated_usd >= 0)
);
create index study_generation_usage_job_idx on public.study_generation_usage(job_id);
create index study_generation_usage_response_idx on public.study_generation_usage(provider,response_id);
alter table public.study_generation_usage enable row level security;
revoke all on public.study_generation_usage from public,anon,authenticated;
grant select on public.study_generation_usage to authenticated;
grant all on public.study_generation_usage to service_role;
create policy "Read own generation usage" on public.study_generation_usage for select to authenticated using (
  exists (select 1 from public.study_generation_jobs j where j.id = job_id and j.user_id = (select auth.uid()))
);
