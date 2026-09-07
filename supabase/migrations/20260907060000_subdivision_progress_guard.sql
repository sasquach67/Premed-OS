-- Subdivision must make progress, or say so.
--
-- `subdivide_generation_task` returned the number of rows it INSERTED, and the
-- runner treated any non-null return as success — including 0. A split that
-- inserted nothing therefore marked its parent skipped/oversized and moved on
-- having produced no work at all, and the section's material left the build
-- without an error anywhere.
--
-- Zero inserts is reachable: child keys are `${parent_task_key ?? task_key}::…`
-- and `parent_task_key` flattens to the ROOT, so a second-level split proposes
-- the same keys as its own siblings, every insert conflicts, and the content
-- disappears. (That flattening is also what bounds the work: an adversarial
-- splitter converges at depth 2 — see supabase/tests/subdivision_bound_test.sql.)
--
-- The function now retires the parent only when it actually inserted a child.
-- A split that inserted nothing returns 0 and leaves the task exactly as it
-- was, so the runner records a real failure instead of the material leaving
-- the build unnoticed.
create or replace function public.subdivide_generation_task(
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

  -- Newly inserted rows are the honest measure of progress. A replay cannot
  -- reach here: this call requires a live lease, and a split that succeeded
  -- cleared it, so a second call with the same token finds no row at all.
  if v_added = 0 then
    -- Nothing was created. Leave the task as it is — still leased, still the
    -- caller's to complete — so the runner records a real failure instead of
    -- this function retiring the parent and dropping its material silently.
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
