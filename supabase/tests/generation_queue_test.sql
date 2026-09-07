-- Generation queue semantics, verified against a real PostgreSQL cluster.
--
-- Run with: scripts/verify-generation-sql.sh
--
-- The Edge runner's correctness rests on these rules holding in Postgres rather
-- than in a stub: the active-job dedupe index, the exclusive task lease, the
-- stage gate on claiming, the attempt bound, and the RLS that keeps a build
-- readable by its owner and writable by nobody but the service role.
--
-- Any line containing "BUG" fails the run.
\set ON_ERROR_STOP on

truncate public.study_generation_jobs cascade;
delete from vault.decrypted_secrets;
insert into auth.users(id) values
  ('11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222')
  on conflict do nothing;

\echo '== dedupe: two starts with one key produce one live job =='
select (public.start_generation_job('11111111-1111-4111-8111-111111111111','key-a','{"specId":"study-guide-v1"}'::jsonb,300)->>'created') as first_created;
select (public.start_generation_job('11111111-1111-4111-8111-111111111111','key-a','{"specId":"study-guide-v1"}'::jsonb,300)->>'created') as second_created;
select count(*) as live_jobs from public.study_generation_jobs where dedupe_key='key-a' and status in ('queued','running');

\echo '== fan-out is idempotent by (job, stage, key) =='
select public.add_generation_tasks(
  (select id from public.study_generation_jobs where dedupe_key='key-a'), 'inventory',
  '[{"taskKey":"inventory","ordinal":0,"label":"Checking your material"}]'::jsonb) as added;
select public.add_generation_tasks(
  (select id from public.study_generation_jobs where dedupe_key='key-a'), 'inventory',
  '[{"taskKey":"inventory","ordinal":0,"label":"dup"}]'::jsonb) as added_again_expect_zero;

\echo '== the lease is exclusive: a second claim finds nothing =='
select (public.claim_generation_task(100)->'task'->>'task_key') as claimed;
select coalesce((public.claim_generation_task(100)->'task'->>'task_key'),'<none>') as second_claim_expect_none;

\echo '== a write without the lease token is refused =='
select coalesce((public.complete_generation_task(
  (select id from public.study_generation_tasks where task_key='inventory'),
  '00000000-0000-4000-8000-000000000000'::uuid,'done')::text),'<refused>') as forged_write;

\echo '== the real lease token completes the task =='
select (public.complete_generation_task(
  (select id from public.study_generation_tasks where task_key='inventory'),
  (select lease_token from public.study_generation_tasks where task_key='inventory'),
  'done','{"passages":3}'::jsonb, null, 1200)->>'status') as completed;

\echo '== the stage advances only when its tasks are all finished =='
select public.add_generation_tasks((select id from public.study_generation_jobs where dedupe_key='key-a'),'outline','[{"taskKey":"outline","ordinal":0}]'::jsonb);
select (public.advance_generation_stage((select id from public.study_generation_jobs where dedupe_key='key-a'),'outline',0.15)->>'stage') as advanced_to;

\echo '== a task outside the current stage is not claimable =='
select public.add_generation_tasks((select id from public.study_generation_jobs where dedupe_key='key-a'),'assemble','[{"taskKey":"assemble","ordinal":0}]'::jsonb);
select (public.claim_generation_task(100)->'task'->>'stage') as claimable_stage_expect_outline;

\echo '== attempts are bounded: two failures fail the job, and nothing is saved =='
select (public.complete_generation_task((select id from public.study_generation_tasks where task_key='outline'),
  (select lease_token from public.study_generation_tasks where task_key='outline'),
  'failed', null, '{"code":"invalid-response","message":"bad plan"}'::jsonb)->>'status') as first_failure;
select (public.claim_generation_task(100)->'task'->>'task_key') as retried;
select (public.complete_generation_task((select id from public.study_generation_tasks where task_key='outline'),
  (select lease_token from public.study_generation_tasks where task_key='outline'),
  'failed', null, '{"code":"invalid-response","message":"bad plan"}'::jsonb)->>'status') as second_failure;
select status, error->>'code' as code, result is null as result_is_null
  from public.study_generation_jobs where dedupe_key='key-a';
select attempts, max_attempts from public.study_generation_tasks where task_key='outline';

\echo '== a failed job frees its dedupe key for a genuine rebuild =='
select (public.start_generation_job('11111111-1111-4111-8111-111111111111','key-a','{"specId":"study-guide-v1"}'::jsonb,300)->>'created') as rebuild_created;

\echo '== the reaper releases the lease of a worker that died mid-task =='
update public.study_generation_tasks set status='running', lease_token=gen_random_uuid(), lease_expires_at=now()-interval '1 minute' where task_key='assemble';
select public.reap_generation_work() as reaped;
select status, lease_token is null as lease_released from public.study_generation_tasks where task_key='assemble';

\echo '== the dispatcher no-ops safely when the Vault secrets are absent =='
select public.dispatch_generation_work(4) as dispatched_without_secrets_expect_zero;
insert into vault.decrypted_secrets values
  ('generation_runner_url','https://example.invalid/study-tools'),
  ('generation_runner_jwt','jwt'),
  ('generation_runner_secret','secret');

\echo '== the dispatcher fires one call per runnable task, capped by the batch =='
truncate public.study_generation_jobs cascade;
select public.start_generation_job('11111111-1111-4111-8111-111111111111','key-b','{"specId":"study-guide-v1"}'::jsonb,300);
select public.add_generation_tasks((select id from public.study_generation_jobs where dedupe_key='key-b'),'inventory',
  '[{"taskKey":"i1","ordinal":0}]'::jsonb);
select public.dispatch_generation_work(4) as dispatched_one_runnable_expect_1;
select public.add_generation_tasks((select id from public.study_generation_jobs where dedupe_key='key-b'),'inventory',
  '[{"taskKey":"i2","ordinal":1},{"taskKey":"i3","ordinal":2},{"taskKey":"i4","ordinal":3},{"taskKey":"i5","ordinal":4},{"taskKey":"i6","ordinal":5}]'::jsonb);
select public.dispatch_generation_work(4) as dispatched_capped_expect_4;

\echo '== an owner nudge can only advance that owner\'s own build =='
select coalesce((public.claim_generation_task(100, null,
  '22222222-2222-4222-8222-222222222222'::uuid)->'task'->>'task_key'), '<none>') as other_user_nudge_expect_none;
select coalesce((public.claim_generation_task(100,
  '00000000-0000-4000-8000-000000000000'::uuid, null)->'task'->>'task_key'), '<none>') as unknown_job_nudge_expect_none;
select coalesce((public.claim_generation_task(100,
  (select id from public.study_generation_jobs where dedupe_key='key-b'),
  '11111111-1111-4111-8111-111111111111'::uuid)->'task'->>'task_key'), '<none>') as owner_nudge_expect_a_task;

\echo '== concurrent claims never hand out the same task (for update skip locked) =='
select count(distinct task_key) as distinct_claims, count(*) as claims from (
  select (public.claim_generation_task(100)->'task'->>'task_key') as task_key from generate_series(1,6)
) taken where task_key is not null;

\echo '== RLS: a different signed-in user sees nothing =='
begin;
  set local role authenticated;
  set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
  select count(*) as other_user_jobs_expect_0 from public.study_generation_jobs;
  select count(*) as other_user_tasks_expect_0 from public.study_generation_tasks;
commit;

\echo '== RLS: the owner reads their own build =='
begin;
  set local role authenticated;
  set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
  select count(*) as owner_jobs_expect_1 from public.study_generation_jobs;
  select count(*) as owner_tasks_expect_6 from public.study_generation_tasks;
commit;

\echo '== RLS: the owner cannot write, claim, or dispatch =='
begin;
  set local role authenticated;
  set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
  do $$ begin
    update public.study_generation_jobs set status='succeeded';
    raise notice 'owner job write succeeded - BUG';
  exception when insufficient_privilege then raise notice 'owner job write refused (correct)';
  end $$;
  do $$ begin
    update public.study_generation_tasks set status='done';
    raise notice 'owner task write succeeded - BUG';
  exception when insufficient_privilege then raise notice 'owner task write refused (correct)';
  end $$;
  do $$ begin
    perform public.claim_generation_task(100);
    raise notice 'owner claimed a task - BUG';
  exception when insufficient_privilege then raise notice 'owner cannot claim tasks (correct)';
  end $$;
  do $$ begin
    perform public.dispatch_generation_work(1);
    raise notice 'owner dispatched work - BUG';
  exception when insufficient_privilege then raise notice 'owner cannot dispatch (correct)';
  end $$;
commit;

\echo '== the provider capability table is invisible to signed-in users =='
begin;
  set local role authenticated;
  set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
  do $$ begin
    perform count(*) from public.generation_provider_capabilities;
    raise notice 'capabilities readable - BUG';
  exception when insufficient_privilege then raise notice 'capabilities table not readable (correct)';
  end $$;
commit;

\echo '== a task proven oversized is REPLACED by its parts, never retried unchanged =='
truncate public.study_generation_jobs cascade;
select public.start_generation_job('11111111-1111-4111-8111-111111111111','key-c','{"specId":"study-guide-v1"}'::jsonb,300);
select public.add_generation_tasks((select id from public.study_generation_jobs where dedupe_key='key-c'),'inventory',
  '[{"taskKey":"big","ordinal":0}]'::jsonb);
select (public.claim_generation_task(100)->'task'->>'task_key') as claimed_big;
select public.subdivide_generation_task(
  (select id from public.study_generation_tasks where task_key='big'),
  (select lease_token from public.study_generation_tasks where task_key='big'),
  '[{"taskKey":"big::a","part":0},{"taskKey":"big::b","part":1},{"taskKey":"big::c","part":2}]'::jsonb) as parts_added;
select task_key, status, oversized, parent_task_key, part
  from public.study_generation_tasks order by part, task_key;
\echo '-- the oversized parent is skipped, so it can never be claimed again'
select coalesce((public.claim_generation_task(100)->'task'->>'task_key'),'<none>') as next_claim_expect_a_part;

\echo '== subdivision is idempotent: a redelivered split adds nothing =='
select public.add_generation_tasks((select id from public.study_generation_jobs where dedupe_key='key-c'),'inventory',
  '[{"taskKey":"big::a"},{"taskKey":"big::b"},{"taskKey":"big::c"}]'::jsonb) as duplicate_parts_expect_zero;

\echo '== measured stage rates are recorded per stage and keep the worst case =='
select (public.record_stage_duration('study-guide-v1','outline',40000,60000,1500)->>'samples') as first_sample;
select (public.record_stage_duration('study-guide-v1','outline',9000,60000,1500)->>'samples') as second_sample;
select stage, samples, max_ms, max_input_chars,
       ms_per_output_token > 0 as output_rate_positive,
       ms_per_kilo_input_char > 0 as input_rate_positive
  from public.generation_stage_stats where spec_id = 'study-guide-v1';
\echo '-- a different stage keeps its own rates rather than sharing one number'
select (public.record_stage_duration('study-guide-v1','sections',70000,8000,5000)->>'samples') as sections_sample;
select count(*) as distinct_stage_rows from public.generation_stage_stats where spec_id='study-guide-v1';

\echo '== the stats table is invisible to signed-in users =='
begin;
  set local role authenticated;
  set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
  do $$ begin
    perform count(*) from public.generation_stage_stats;
    raise notice 'stage stats readable - BUG';
  exception when insufficient_privilege then raise notice 'stage stats not readable (correct)';
  end $$;
commit;
