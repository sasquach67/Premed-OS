-- S1 Revision 3 SQL matrix. Disposable local database only; everything rolls back.
-- Runs as the local superuser, so RLS is bypassed and only the guard decides.
-- Every rejection also proves the row (data, updated_at, both columns) is unchanged.
begin;
set local client_min_messages = notice;

create function pg_temp.snap(uid uuid) returns text language sql as $$
  select coalesce((select jsonb_build_object('data', data, 'updated_at', updated_at, 'cloud_schema', cloud_schema, 'write_rev', write_rev)::text
                   from public.dashboards where user_id = uid), '<no row>') $$;

create function pg_temp.reject(label text, uid uuid, statement text) returns void language plpgsql as $$
declare before text := pg_temp.snap(uid); detail text; message text;
begin
  begin
    execute statement;
  exception when sqlstate 'P0001' then
    get stacked diagnostics detail = pg_exception_detail, message = message_text;
    if detail is distinct from 'S1_SCHEMA_GUARD' or message not like 'This tab is out of date.%' then raise; end if;
    if pg_temp.snap(uid) is distinct from before then raise exception 'FAIL %: rejected write changed the row', label; end if;
    raise notice 'PASS reject  | %', label;
    return;
  end;
  raise exception 'FAIL %: expected S1_SCHEMA_GUARD rejection', label;
end $$;

create function pg_temp.accept(label text, statement text, expected_rows int default 1) returns void language plpgsql as $$
declare affected int;
begin
  execute statement;
  get diagnostics affected = row_count;
  if affected <> expected_rows then raise exception 'FAIL %: % rows, expected %', label, affected, expected_rows; end if;
  raise notice 'PASS accept  | %', label;
end $$;

create function pg_temp.check(label text, ok boolean) returns void language plpgsql as $$
begin
  if ok is not true then raise exception 'FAIL %', label; end if;
  raise notice 'PASS check   | %', label;
end $$;

-- Synthetic users only (rolled back).
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 's1-sql-a@example.invalid'),
  ('00000000-0000-4000-8000-0000000000b2', 's1-sql-b@example.invalid'),
  ('00000000-0000-4000-8000-0000000000c3', 's1-sql-c@example.invalid'),
  ('00000000-0000-4000-8000-0000000000d4', 's1-sql-d@example.invalid'),
  ('00000000-0000-4000-8000-0000000000e5', 's1-sql-e@example.invalid');

-- ---- Installation ----
select pg_temp.check('columns exist, nullable, no defaults',
  (select count(*) = 2 and bool_and(is_nullable = 'YES') and bool_and(column_default is null)
   from information_schema.columns where table_schema = 'public' and table_name = 'dashboards' and column_name in ('cloud_schema', 'write_rev')));
select pg_temp.check('column types: cloud_schema integer, write_rev bigint',
  (select string_agg(column_name || ':' || data_type, ',' order by column_name) = 'cloud_schema:integer,write_rev:bigint'
   from information_schema.columns where table_schema = 'public' and table_name = 'dashboards' and column_name in ('cloud_schema', 'write_rev')));
select pg_temp.check('exactly one enabled guard, BEFORE INSERT OR UPDATE, per row',
  (select count(*) = 1 from pg_trigger t where t.tgrelid = 'public.dashboards'::regclass and t.tgname = 'dashboards_write_guard'
     and t.tgenabled = 'O' and (t.tgtype & 1) = 1 and (t.tgtype & 2) = 2 and (t.tgtype & 4) = 4 and (t.tgtype & 16) = 16 and (t.tgtype & 8) = 0));
select pg_temp.check('v1 in-document guard absent',
  not exists (select 1 from pg_trigger where tgrelid = 'public.dashboards'::regclass and tgname = 'dashboards_schema_guard')
  and to_regprocedure('public.guard_dashboard_schema()') is null);
select pg_temp.check('guard is SECURITY INVOKER with a fixed search_path',
  (select not prosecdef and proconfig @> array['search_path=pg_catalog'] from pg_proc where oid = 'public.guard_dashboard_write()'::regprocedure));
select pg_temp.check('RLS still enabled with the four own-row policies',
  (select relrowsecurity from pg_class where oid = 'public.dashboards'::regclass)
  and (select count(*) = 4 from pg_policies where schemaname = 'public' and tablename = 'dashboards'));
select pg_temp.check('user triggers on dashboards: only the S1 guard',
  (select count(*) = 1 from pg_trigger where tgrelid = 'public.dashboards'::regclass and not tgisinternal));

-- ---- A: legacy (unclaimed) rows keep today's behavior ----
select pg_temp.accept('legacy insert (columns omitted, as deployed apps send)',
  $$insert into public.dashboards (user_id, data, updated_at) values ('00000000-0000-4000-8000-0000000000a1', '{"notes":{"a":"legacy"}}', '2026-01-01T00:00:00Z')$$);
select pg_temp.accept('legacy -> legacy update (old app on an unclaimed row)',
  $$update public.dashboards set data = '{"notes":{"a":"old edit"}}', updated_at = '2026-01-02T00:00:00Z' where user_id = '00000000-0000-4000-8000-0000000000a1'$$);
select pg_temp.accept('legacy upsert on conflict omitting columns (synthetic merge-duplicates)',
  $$insert into public.dashboards (user_id, data, updated_at) values ('00000000-0000-4000-8000-0000000000a1', '{"notes":{"a":"upsert"}}', '2026-01-03T00:00:00Z')
    on conflict (user_id) do update set data = excluded.data, updated_at = excluded.updated_at$$);
select pg_temp.reject('legacy -> claim with write_rev 2', '00000000-0000-4000-8000-0000000000a1',
  $$update public.dashboards set cloud_schema = 1, write_rev = 2 where user_id = '00000000-0000-4000-8000-0000000000a1'$$);
select pg_temp.reject('legacy -> half-claimed (cloud_schema only)', '00000000-0000-4000-8000-0000000000a1',
  $$update public.dashboards set cloud_schema = 1 where user_id = '00000000-0000-4000-8000-0000000000a1'$$);
select pg_temp.reject('legacy -> half-claimed (write_rev only)', '00000000-0000-4000-8000-0000000000a1',
  $$update public.dashboards set write_rev = 1 where user_id = '00000000-0000-4000-8000-0000000000a1'$$);
select pg_temp.reject('legacy -> claim with cloud_schema 0', '00000000-0000-4000-8000-0000000000a1',
  $$update public.dashboards set cloud_schema = 0, write_rev = 1 where user_id = '00000000-0000-4000-8000-0000000000a1'$$);
select pg_temp.reject('legacy -> claim with negative cloud_schema', '00000000-0000-4000-8000-0000000000a1',
  $$update public.dashboards set cloud_schema = -1, write_rev = 1 where user_id = '00000000-0000-4000-8000-0000000000a1'$$);
select pg_temp.reject('legacy -> claim with write_rev 0', '00000000-0000-4000-8000-0000000000a1',
  $$update public.dashboards set cloud_schema = 1, write_rev = 0 where user_id = '00000000-0000-4000-8000-0000000000a1'$$);

-- ---- B: the conditional first claim ----
select pg_temp.accept('conditional claim misses a stale reviewed timestamp (0 rows, no error)',
  $$update public.dashboards set data = data || '{"_schema":1}', updated_at = '2026-01-04T00:00:00Z', cloud_schema = 1, write_rev = 1
    where user_id = '00000000-0000-4000-8000-0000000000a1' and updated_at = '2026-01-01T00:00:00Z' and cloud_schema is null and write_rev is null$$, 0);
select pg_temp.accept('conditional first claim (write_rev 1, reviewed timestamp, both NULL)',
  $$update public.dashboards set data = data || '{"_schema":1}', updated_at = '2026-01-04T00:00:00Z', cloud_schema = 1, write_rev = 1
    where user_id = '00000000-0000-4000-8000-0000000000a1' and updated_at = '2026-01-03T00:00:00Z' and cloud_schema is null and write_rev is null$$);
select pg_temp.accept('a second identical claim misses (0 rows): the loser of two new writers',
  $$update public.dashboards set data = data || '{"_schema":1}', updated_at = '2026-01-04T00:00:01Z', cloud_schema = 1, write_rev = 1
    where user_id = '00000000-0000-4000-8000-0000000000a1' and updated_at = '2026-01-03T00:00:00Z' and cloud_schema is null and write_rev is null$$, 0);

-- ---- C: claimed rows fence every non-conforming writer ----
select pg_temp.reject('old app {data, updated_at} PATCH on a claimed row', '00000000-0000-4000-8000-0000000000a1',
  $$update public.dashboards set data = '{"notes":{"a":"old app drops sections"}}', updated_at = '2026-02-01T00:00:00Z' where user_id = '00000000-0000-4000-8000-0000000000a1'$$);
select pg_temp.reject('old app PATCH with an encoded gzip payload', '00000000-0000-4000-8000-0000000000a1',
  $$update public.dashboards set data = '{"format":"premed-os-dashboard-gzip-v1","gzip":"H4sIAAAAAAAAA6uuBQBDv6ajAgAAAA=="}', updated_at = '2026-02-01T00:00:00Z' where user_id = '00000000-0000-4000-8000-0000000000a1'$$);
select pg_temp.reject('old app PATCH with a text-JSON payload', '00000000-0000-4000-8000-0000000000a1',
  $$update public.dashboards set data = '{"format":"premed-os-dashboard-json-text-v1","json":"{}"}', updated_at = '2026-02-01T00:00:00Z' where user_id = '00000000-0000-4000-8000-0000000000a1'$$);
select pg_temp.reject('timestamp-only update on a claimed row', '00000000-0000-4000-8000-0000000000a1',
  $$update public.dashboards set updated_at = '2026-02-02T00:00:00Z' where user_id = '00000000-0000-4000-8000-0000000000a1'$$);
select pg_temp.reject('synthetic merge upsert omitting columns on a claimed row', '00000000-0000-4000-8000-0000000000a1',
  $$insert into public.dashboards (user_id, data, updated_at) values ('00000000-0000-4000-8000-0000000000a1', '{}', '2026-02-03T00:00:00Z')
    on conflict (user_id) do update set data = excluded.data, updated_at = excluded.updated_at$$);
select pg_temp.reject('synthetic merge upsert sending NULL columns on a claimed row', '00000000-0000-4000-8000-0000000000a1',
  $$insert into public.dashboards (user_id, data, updated_at, cloud_schema, write_rev) values ('00000000-0000-4000-8000-0000000000a1', '{}', '2026-02-03T00:00:00Z', null, null)
    on conflict (user_id) do update set data = excluded.data, updated_at = excluded.updated_at, cloud_schema = excluded.cloud_schema, write_rev = excluded.write_rev$$);
select pg_temp.reject('synthetic merge upsert with column defaults (missing=default)', '00000000-0000-4000-8000-0000000000a1',
  $$insert into public.dashboards (user_id, data, updated_at, cloud_schema, write_rev) values ('00000000-0000-4000-8000-0000000000a1', '{}', '2026-02-03T00:00:00Z', default, default)
    on conflict (user_id) do update set data = excluded.data, updated_at = excluded.updated_at, cloud_schema = excluded.cloud_schema, write_rev = excluded.write_rev$$);
select pg_temp.reject('metadata-only unclaim (both NULL)', '00000000-0000-4000-8000-0000000000a1',
  $$update public.dashboards set cloud_schema = null, write_rev = null where user_id = '00000000-0000-4000-8000-0000000000a1'$$);
select pg_temp.reject('unclaim write_rev only', '00000000-0000-4000-8000-0000000000a1',
  $$update public.dashboards set write_rev = null where user_id = '00000000-0000-4000-8000-0000000000a1'$$);
select pg_temp.reject('same counter (write_rev unchanged) with new data', '00000000-0000-4000-8000-0000000000a1',
  $$update public.dashboards set data = '{"_schema":1}', write_rev = 1 where user_id = '00000000-0000-4000-8000-0000000000a1'$$);
select pg_temp.reject('skipped counter (write_rev + 2)', '00000000-0000-4000-8000-0000000000a1',
  $$update public.dashboards set data = '{"_schema":1}', write_rev = 3 where user_id = '00000000-0000-4000-8000-0000000000a1'$$);
select pg_temp.reject('lowered counter', '00000000-0000-4000-8000-0000000000a1',
  $$update public.dashboards set write_rev = 0 where user_id = '00000000-0000-4000-8000-0000000000a1'$$);
select pg_temp.accept('conforming write: write_rev + 1, same schema, gzip payload',
  $$update public.dashboards set data = '{"format":"premed-os-dashboard-gzip-v1","gzip":"H4sIAAAAAAAAA6uuBQBDv6ajAgAAAA=="}', updated_at = '2026-02-04T00:00:00Z', write_rev = 2
    where user_id = '00000000-0000-4000-8000-0000000000a1' and updated_at = '2026-01-04T00:00:00Z' and cloud_schema = 1 and write_rev = 1$$);
select pg_temp.accept('conforming write: text-JSON payload, write_rev + 1',
  $$update public.dashboards set data = '{"format":"premed-os-dashboard-json-text-v1","json":"{}"}', updated_at = '2026-02-05T00:00:00Z', write_rev = 3
    where user_id = '00000000-0000-4000-8000-0000000000a1' and cloud_schema = 1 and write_rev = 2$$);
select pg_temp.accept('stale compare-and-set misses (0 rows): write_rev already moved',
  $$update public.dashboards set data = '{"_schema":1}', updated_at = '2026-02-06T00:00:00Z', write_rev = 3
    where user_id = '00000000-0000-4000-8000-0000000000a1' and cloud_schema = 1 and write_rev = 2$$, 0);
select pg_temp.accept('schema upgrade with write_rev + 1 (1 -> 2)',
  $$update public.dashboards set data = '{"_schema":2}', updated_at = '2026-02-07T00:00:00Z', cloud_schema = 2, write_rev = 4 where user_id = '00000000-0000-4000-8000-0000000000a1'$$);
select pg_temp.reject('schema downgrade with a valid counter (2 -> 1)', '00000000-0000-4000-8000-0000000000a1',
  $$update public.dashboards set data = '{"_schema":1}', cloud_schema = 1, write_rev = 5 where user_id = '00000000-0000-4000-8000-0000000000a1'$$);
select pg_temp.reject('metadata-only schema downgrade', '00000000-0000-4000-8000-0000000000a1',
  $$update public.dashboards set cloud_schema = 1 where user_id = '00000000-0000-4000-8000-0000000000a1'$$);
select pg_temp.accept('metadata-only write that follows the counter (conforming writer; allowed by design)',
  $$update public.dashboards set write_rev = 5 where user_id = '00000000-0000-4000-8000-0000000000a1'$$);
select pg_temp.check('row A ends claimed at schema 2, write_rev 5',
  (select cloud_schema = 2 and write_rev = 5 from public.dashboards where user_id = '00000000-0000-4000-8000-0000000000a1'));

-- ---- D: inserts ----
select pg_temp.accept('new-app insert: a first claim (write_rev 1)',
  $$insert into public.dashboards (user_id, data, updated_at, cloud_schema, write_rev) values ('00000000-0000-4000-8000-0000000000b2', '{"_schema":1}', '2026-03-01T00:00:00Z', 1, 1)$$);
select pg_temp.reject('insert with write_rev 2', '00000000-0000-4000-8000-0000000000c3',
  $$insert into public.dashboards (user_id, data, updated_at, cloud_schema, write_rev) values ('00000000-0000-4000-8000-0000000000c3', '{}', now(), 1, 2)$$);
select pg_temp.reject('insert half-claimed', '00000000-0000-4000-8000-0000000000c3',
  $$insert into public.dashboards (user_id, data, updated_at, cloud_schema) values ('00000000-0000-4000-8000-0000000000c3', '{}', now(), 1)$$);
select pg_temp.reject('insert beyond the safe-integer cap', '00000000-0000-4000-8000-0000000000c3',
  $$insert into public.dashboards (user_id, data, updated_at, cloud_schema, write_rev) values ('00000000-0000-4000-8000-0000000000c3', '{}', now(), 1, 9007199254740992)$$);
do $$ begin
  begin
    insert into public.dashboards (user_id, data, updated_at, cloud_schema, write_rev) values ('00000000-0000-4000-8000-0000000000b2', '{"_schema":1}', now(), 1, 1);
    raise exception 'FAIL competing insert should conflict';
  exception when unique_violation then raise notice 'PASS reject  | competing insert for an existing row: unique_violation (client rereads)';
  end;
end $$;

-- ---- E: the safe-integer cap ----
alter table public.dashboards disable trigger dashboards_write_guard;
update public.dashboards set write_rev = 9007199254740990 where user_id = '00000000-0000-4000-8000-0000000000b2';
alter table public.dashboards enable trigger dashboards_write_guard;
select pg_temp.accept('write_rev 2^53 - 2 -> 2^53 - 1 (the last accepted save)',
  $$update public.dashboards set write_rev = 9007199254740991, updated_at = now() where user_id = '00000000-0000-4000-8000-0000000000b2'$$);
select pg_temp.reject('write_rev 2^53 - 1 -> 2^53 is rejected deterministically', '00000000-0000-4000-8000-0000000000b2',
  $$update public.dashboards set write_rev = 9007199254740992, updated_at = now() where user_id = '00000000-0000-4000-8000-0000000000b2'$$);

-- ---- F: stored illegal states fail closed ----
alter table public.dashboards disable trigger dashboards_write_guard;
insert into public.dashboards (user_id, data, updated_at, cloud_schema, write_rev) values
  ('00000000-0000-4000-8000-0000000000c3', '{}', '2026-04-01T00:00:00Z', 1, null),
  ('00000000-0000-4000-8000-0000000000d4', '{}', '2026-04-01T00:00:00Z', 0, 5),
  ('00000000-0000-4000-8000-0000000000e5', '{}', '2026-04-01T00:00:00Z', 1, 9007199254740993);
alter table public.dashboards enable trigger dashboards_write_guard;
select pg_temp.reject('stored half-claimed row: legacy write', '00000000-0000-4000-8000-0000000000c3',
  $$update public.dashboards set data = '{"x":1}' where user_id = '00000000-0000-4000-8000-0000000000c3'$$);
select pg_temp.reject('stored half-claimed row: "repair" to a valid claim', '00000000-0000-4000-8000-0000000000c3',
  $$update public.dashboards set write_rev = 1 where user_id = '00000000-0000-4000-8000-0000000000c3'$$);
select pg_temp.reject('stored cloud_schema 0: counter write', '00000000-0000-4000-8000-0000000000d4',
  $$update public.dashboards set write_rev = 6 where user_id = '00000000-0000-4000-8000-0000000000d4'$$);
select pg_temp.reject('stored write_rev beyond the cap: counter write', '00000000-0000-4000-8000-0000000000e5',
  $$update public.dashboards set write_rev = 9007199254740994 where user_id = '00000000-0000-4000-8000-0000000000e5'$$);

-- ---- H: the ROLLBACK.md repair rehearsal (synthetic row C, stored half-claimed 1/NULL) ----
-- A mismatched predicate (stale metadata) must change nothing and abort.
do $$
declare changed int;
begin
  set local session_replication_role = replica;
  update public.dashboards set cloud_schema = 1, write_rev = 1, updated_at = clock_timestamp()
   where user_id = '00000000-0000-4000-8000-0000000000c3' and updated_at = '2026-04-01T00:00:00Z'
     and cloud_schema is not distinct from 1 and write_rev is not distinct from 7;
  get diagnostics changed = row_count;
  set local session_replication_role = origin;
  if changed <> 0 then raise exception 'FAIL repair with stale metadata changed % rows', changed; end if;
  raise notice 'PASS check   | repair predicate with stale metadata matches 0 rows (would abort)';
end $$;
do $$
declare changed int;
begin
  set local session_replication_role = replica;
  update public.dashboards set cloud_schema = 1, write_rev = 1, updated_at = clock_timestamp()
   where user_id = '00000000-0000-4000-8000-0000000000c3' and updated_at = '2026-04-01T00:00:00Z'
     and cloud_schema is not distinct from 1 and write_rev is not distinct from null
     and clock_timestamp() <> '2026-04-01T00:00:00Z';
  get diagnostics changed = row_count;
  set local session_replication_role = origin;
  if changed <> 1 then raise exception 'FAIL repair matched % rows; expected exactly 1', changed; end if;
  raise notice 'PASS accept  | repair: exact metadata predicate, exactly one row, fresh updated_at';
end $$;
select pg_temp.check('repair left data untouched, a valid claim and a fresh timestamp',
  (select cloud_schema = 1 and write_rev = 1 and data = '{}'::jsonb and updated_at <> '2026-04-01T00:00:00Z' from public.dashboards where user_id = '00000000-0000-4000-8000-0000000000c3'));
select pg_temp.accept('a client holding the pre-repair tuple (old updated_at, write_rev 1) matches 0 rows',
  $$update public.dashboards set data = '{"_schema":1}', updated_at = now(), cloud_schema = 1, write_rev = 2
    where user_id = '00000000-0000-4000-8000-0000000000c3' and updated_at = '2026-04-01T00:00:00Z' and cloud_schema = 1 and write_rev = 1$$, 0);
select pg_temp.accept('after repair a conforming write on the repaired revision (write_rev + 1) is accepted',
  $$update public.dashboards set data = '{"_schema":1}', updated_at = now(), write_rev = 2 where user_id = '00000000-0000-4000-8000-0000000000c3' and write_rev = 1$$);
select pg_temp.reject('after repair an old {data, updated_at} write is still rejected', '00000000-0000-4000-8000-0000000000c3',
  $$update public.dashboards set data = '{}', updated_at = now() where user_id = '00000000-0000-4000-8000-0000000000c3'$$);

-- ---- G: delete stays the declared limit ----
select pg_temp.accept('DELETE of a claimed row is allowed (declared limit, not guarded)',
  $$delete from public.dashboards where user_id = '00000000-0000-4000-8000-0000000000b2'$$);

rollback;
