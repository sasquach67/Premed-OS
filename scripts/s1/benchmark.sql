-- S1 Revision 3 benchmark. Synthetic JSON only; the transaction rolls back.
-- Uses the real guard function on a temporary copy of the dashboards shape.
-- The guard never reads `data`, so payload size should not change its cost.
begin;
create temporary table s1_perf (id int primary key, data jsonb, updated_at timestamptz, cloud_schema integer, write_rev bigint);
create trigger s1_perf_guard before insert or update on s1_perf for each row execute function public.guard_dashboard_write();
create temporary table s1_measurements (bytes int, guarded boolean, outcome text, iterations int, elapsed_ms numeric);
do $$
declare payload jsonb; started timestamptz; target int; guarded boolean; mode text; i int; rev bigint;
begin
  foreach target in array array[1048576, 4194304] loop
    -- MD5 text avoids an unrealistically compressible repeated-character fixture.
    select jsonb_build_object('_schema', 1, 'profile', '{}'::jsonb, 'settings', '{}'::jsonb, 'courses', '[]'::jsonb,
      'notes', jsonb_build_object('synthetic', string_agg(md5(n::text), '')), 'futureCollection', jsonb_build_array(1)) into payload
    from generate_series(1, target / 32) n;
    foreach guarded in array array[false, true] loop
      execute format('alter table s1_perf %s trigger s1_perf_guard', case when guarded then 'enable' else 'disable' end);
      foreach mode in array array['accepted (write_rev + 1)', 'old writer (no columns)'] loop
        truncate s1_perf;
        insert into s1_perf values (1, payload, now(), 1, 1);
        rev := 1;
        started := clock_timestamp();
        for i in 1..20 loop
          begin
            if mode like 'accepted%' then
              update s1_perf set data = payload || jsonb_build_object('edit', i), updated_at = clock_timestamp(), write_rev = rev + 1 where id = 1 and write_rev = rev;
              rev := rev + 1;
            else
              update s1_perf set data = payload - 'futureCollection', updated_at = clock_timestamp() where id = 1;
              if guarded then raise exception 'expected rejection' using errcode = 'XX000'; end if;
            end if;
          exception when sqlstate 'P0001' then
            if not (guarded and mode like 'old%') then raise; end if;
          end;
        end loop;
        insert into s1_measurements values (octet_length(payload::text), guarded, mode, 20, extract(epoch from clock_timestamp() - started) * 1000);
      end loop;
    end loop;
  end loop;
end $$;
select bytes, guarded, outcome, iterations, round(elapsed_ms, 1) as elapsed_ms, round(elapsed_ms / iterations, 2) as mean_ms from s1_measurements order by bytes, outcome, guarded;
rollback;
