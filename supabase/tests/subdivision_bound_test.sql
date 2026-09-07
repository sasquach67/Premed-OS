-- Does subdivision terminate, and is the money bounded?
--
-- Per-task attempt caps bound retries of ONE task. They say nothing about a
-- subdivider that keeps minting tasks. This drives subdivision adversarially:
-- every pending task is split again, as deeply as it will go, using the exact
-- key scheme the Edge runner uses (`${parent_task_key ?? task_key}::part-N`),
-- and asks whether the task set — and therefore the bill — is finite.
\set ON_ERROR_STOP on
begin;
insert into auth.users (id) values ('11111111-1111-1111-1111-111111111111');

insert into public.study_generation_jobs (id, user_id, dedupe_key, payload, stage, status)
values ('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111',
        'bound-test','{}'::jsonb,'draft','running');

insert into public.study_generation_tasks (job_id, stage, ordinal, task_key, label, input)
values ('22222222-2222-2222-2222-222222222222','draft',0,'sec-1','Section 1','{}'::jsonb);

do $$
declare
  v_task record; v_parts jsonb; v_added integer; v_round integer := 0;
  v_before integer; v_after integer; v_total integer;
begin
  loop
    v_round := v_round + 1;
    exit when v_round > 40;
    select count(*) into v_before from public.study_generation_tasks where job_id = '22222222-2222-2222-2222-222222222222';
    -- Split every task still pending, three ways, exactly as the runner names them.
    for v_task in
      select * from public.study_generation_tasks
       where job_id = '22222222-2222-2222-2222-222222222222' and status = 'pending'
    loop
      update public.study_generation_tasks
         set lease_token = gen_random_uuid(), lease_expires_at = now() + interval '60 seconds'
       where id = v_task.id;
      select lease_token into v_task.lease_token from public.study_generation_tasks where id = v_task.id;
      select jsonb_agg(jsonb_build_object(
               'taskKey', coalesce(v_task.parent_task_key, v_task.task_key) || '::part-' || n,
               'ordinal', v_task.ordinal, 'part', n - 1,
               'label', 'part ' || n, 'input', '{}'::jsonb))
        into v_parts from generate_series(1,3) as n;
      v_added := public.subdivide_generation_task(v_task.id, v_task.lease_token, v_parts);
    end loop;
    select count(*) into v_after from public.study_generation_tasks where job_id = '22222222-2222-2222-2222-222222222222';
    if v_after = v_before then
      raise notice 'converged after % rounds', v_round;
      exit;
    end if;
  end loop;
  select count(*) into v_total from public.study_generation_tasks where job_id = '22222222-2222-2222-2222-222222222222';
  raise notice 'TOTAL TASKS EVER CREATED: %', v_total;
  if v_total > 16 then
    raise notice 'BUG: subdivision is not bounded (% tasks)', v_total;
  end if;
  -- With the progress guard, a split that inserts nothing must NOT retire its
  -- parent: the work stays claimable and the runner fails it loudly instead of
  -- the material leaving the build unnoticed.
  if not exists (select 1 from public.study_generation_tasks where job_id = '22222222-2222-2222-2222-222222222222' and status = 'pending') then
    raise notice 'BUG: every task was retired by subdivision; the build has no work left';
  else
    raise notice 'progress guard held: % task(s) still claimable',
      (select count(*) from public.study_generation_tasks where job_id = '22222222-2222-2222-2222-222222222222' and status = 'pending');
  end if;
end $$;

select status, oversized, count(*) as tasks
  from public.study_generation_tasks where job_id = '22222222-2222-2222-2222-222222222222' group by status, oversized order by status;

-- The bill: every task that could ever be paid for, at its attempt cap.
select count(*) as distinct_tasks,
       sum(max_attempts) as max_paid_attempts_for_this_job
  from public.study_generation_tasks where job_id = '22222222-2222-2222-2222-222222222222';

-- Depth, read from the key scheme itself.
select max(array_length(string_to_array(task_key,'::'),1)) as max_key_depth
  from public.study_generation_tasks where job_id = '22222222-2222-2222-2222-222222222222';
rollback;
