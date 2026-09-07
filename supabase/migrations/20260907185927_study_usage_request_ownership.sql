-- Include synchronous generation and review requests, which have no durable task.
alter table public.study_generation_usage alter column job_id drop not null;
alter table public.study_generation_usage alter column task_id drop not null;
alter table public.study_generation_usage add column user_id uuid references auth.users(id) on delete cascade;
alter table public.study_generation_usage add column request_group_id uuid;
alter table public.study_generation_usage add constraint study_usage_owner_required check (job_id is not null or user_id is not null);
create index study_generation_usage_user_idx on public.study_generation_usage(user_id,created_at desc);
create policy "Read own synchronous generation usage" on public.study_generation_usage for select to authenticated using (user_id = (select auth.uid()));
