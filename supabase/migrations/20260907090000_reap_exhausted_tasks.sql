-- A dead worker must not strand a build.
--
-- The reaper released every expired lease back to 'pending' regardless of how
-- many attempts the task had spent. `dispatch_generation_work` only dispatches
-- where `attempts < max_attempts`, so a task whose worker died on its LAST
-- attempt came back pending and was never dispatched again: no runner would
-- touch it, no failure was ever recorded, and the job sat 'running' until its
-- 24-hour expiry swept it away with a generic 'job-expired'.
--
-- Reaping now mirrors `complete_generation_task`: a task with attempts left is
-- released to be retried, and a task that has spent them fails, taking its job
-- with it and saying so. The two paths are the same rule — a task that cannot
-- run again is finished — applied whether the worker reported back or died.
create or replace function public.reap_generation_work()
returns integer
language plpgsql security definer set search_path = '' as $$
declare v_reaped integer; v_exhausted integer;
begin
  -- Still has attempts: hand it back to the queue.
  with released as (
    update public.study_generation_tasks
       set status = 'pending', lease_token = null, lease_expires_at = null, updated_at = now()
     where status = 'running' and lease_expires_at is not null and lease_expires_at < now()
       and attempts < max_attempts
    returning 1
  ) select count(*) into v_reaped from released;

  -- Out of attempts: it will never be dispatched again, so record the failure
  -- now rather than leaving the build to time out hours later with no reason.
  with spent as (
    update public.study_generation_tasks
       set status = 'failed', lease_token = null, lease_expires_at = null,
           finished_at = now(), updated_at = now(),
           error = coalesce(error, jsonb_build_object(
             'code','worker-lost',
             'message','This piece of the build stopped without reporting back and had no attempts left. Nothing was saved.'))
     where status = 'running' and lease_expires_at is not null and lease_expires_at < now()
       and attempts >= max_attempts
    returning job_id, error
  ), failed_jobs as (
    update public.study_generation_jobs j
       set status = 'failed', stage = 'done', phase = 'Stopped',
           error = coalesce(j.error, s.error), updated_at = now()
      from spent s
     where j.id = s.job_id and j.status in ('queued','running')
    returning 1
  ) select count(*) into v_exhausted from failed_jobs;

  update public.study_generation_jobs
     set status = 'failed', stage = 'done', phase = 'Stopped',
         error = jsonb_build_object('code','job-expired','message','This build stopped before it finished and was not saved. Your material and any previously saved entry are unchanged.'),
         updated_at = now()
   where status in ('queued','running') and expires_at < now();
  return v_reaped + v_exhausted;
end $$;

revoke all on function public.reap_generation_work() from public, anon, authenticated;
grant execute on function public.reap_generation_work() to service_role;
