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
create or replace function cron.schedule(job_name text, schedule text, command text) returns bigint language sql as $$ select 1::bigint $$;
create or replace function net.http_post(url text, headers jsonb default '{}', body jsonb default '{}', timeout_milliseconds integer default 5000) returns bigint language sql as $$ select 1::bigint $$;
