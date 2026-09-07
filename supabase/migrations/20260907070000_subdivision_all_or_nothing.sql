-- Subdivision is all-or-nothing.
--
-- The progress guard added in 20260907060000 caught a split that inserted
-- NOTHING. It did not catch a split that inserted SOME of its parts, and that
-- is the case that silently loses material.
--
-- Child keys are `${parent_task_key ?? task_key}::…` and `parent_task_key`
-- flattens to the ROOT, so a second-level split proposes keys in its own
-- siblings' namespace. A live survey subdivision showed the result: a span
-- holding 36 passages and one holding 24 re-split, their proposed keys
-- collided with existing siblings, only two new rows were inserted carrying 14
-- passages between them, and both parents were retired as "subdivided". 46 of
-- 60 passages left the build with no error recorded anywhere.
--
-- A partial insert is therefore not progress. Either every proposed part
-- becomes a real task or the split made no coherent smaller work, the task is
-- left exactly as it was, and the runner fails it loudly. That keeps the
-- guarantee this design rests on — a subdivision preserves complete coverage —
-- as a property the database enforces rather than one the caller must get
-- right.
--
-- Nesting child keys under the IMMEDIATE parent would let these deeper splits
-- succeed instead of failing. That changes how parts are grouped for
-- reassembly and needs its own design pass; until then, failing loudly is the
-- honest behaviour.
create or replace function public.subdivide_generation_task(
  p_task_id uuid,
  p_lease_token uuid,
  p_parts jsonb
) returns integer
language plpgsql security invoker set search_path = '' as $$
declare v_task public.study_generation_tasks; v_added integer; v_wanted integer; v_inserted text[];
begin
  select * into v_task from public.study_generation_tasks
   where id = p_task_id and lease_token = p_lease_token for update;
  if v_task.id is null then return null; end if;
  v_wanted := jsonb_array_length(coalesce(p_parts, '[]'::jsonb));
  if v_wanted = 0 then return 0; end if;

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
    returning task_key
  )
  select array_agg(task_key), count(*) into v_inserted, v_added from inserted;

  -- Every part, or none. A replay cannot reach here: this call requires a live
  -- lease and a split that succeeded cleared it.
  if v_added < v_wanted then
    -- Undo the partial split so the parent's material stays in exactly one
    -- place, then leave the task for the runner to fail.
    -- Only the rows THIS call inserted. Matching on the proposed keys instead
    -- would delete the very siblings the split collided with.
    delete from public.study_generation_tasks
     where job_id = v_task.job_id and stage = v_task.stage
       and task_key = any(coalesce(v_inserted, '{}'::text[]));
    return 0;
  end if;

  update public.study_generation_tasks
     set status = 'skipped', oversized = true, lease_token = null, lease_expires_at = null,
         finished_at = now(), updated_at = now()
   where id = p_task_id;
  return v_added;
end $$;

revoke all on function public.subdivide_generation_task(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.subdivide_generation_task(uuid, uuid, jsonb) to service_role;
