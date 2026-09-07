-- Minimal stand-ins for the parts of a Supabase project a local cluster lacks.
-- Only enough to let the real migrations run and their logic be exercised.
create schema if not exists auth;
create schema if not exists cron;
create schema if not exists net;
create schema if not exists vault;
create table if not exists auth.users (id uuid primary key);
create or replace function auth.uid() returns uuid language sql stable as $$ select current_setting('request.jwt.claim.sub', true)::uuid $$;
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
do $$ begin create role service_role; exception when duplicate_object then null; end $$;
create table if not exists vault.decrypted_secrets (name text primary key, decrypted_secret text);
-- pg_cron stand-in. It validates the schedule string exactly as pg_cron does
-- and keeps a registry, so an invalid schedule or an unschedule of a job that
-- was never scheduled fails here instead of on deployment. A stub that accepts
-- every schedule hid a '1 minute' reaper schedule that pg_cron rejects:
-- interval format is '[1-59] seconds' only, and anything per-minute or slower
-- must be cron format.
create table if not exists cron.job_registry (jobname text primary key, schedule text not null);
create or replace function cron.schedule(job_name text, schedule text, command text) returns bigint
language plpgsql as $$
begin
  if schedule !~ '^\s*([1-9]|[1-5][0-9])\s+seconds\s*$'
     and array_length(regexp_split_to_array(btrim(schedule), '\s+'), 1) <> 5 then
    raise exception 'invalid schedule: %', schedule
      using hint = 'Use cron format (e.g. 5 4 * * *), or interval format ''[1-59] seconds''';
  end if;
  insert into cron.job_registry (jobname, schedule) values (job_name, schedule)
    on conflict (jobname) do update set schedule = excluded.schedule;
  return 1::bigint;
end $$;
create or replace function cron.unschedule(job_name text) returns boolean
language plpgsql as $$
begin
  delete from cron.job_registry where jobname = job_name;
  if not found then
    raise exception 'could not find valid entry for job %', job_name;
  end if;
  return true;
end $$;
create or replace function net.http_post(url text, headers jsonb default '{}', body jsonb default '{}', timeout_milliseconds integer default 5000) returns bigint language sql as $$ select 1::bigint $$;
