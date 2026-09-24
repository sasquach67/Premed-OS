// S1 Revision 3 local SQL runner. Disposable project `premed-s1-disposable` only.
// No .env files are read, no hosted API is contacted, and no container is started or removed.
import { readFileSync, realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
const root = fileURLToPath(new URL('../../', import.meta.url))
const mode = process.argv[2]
const modes = ['bootstrap', 'sql', 'benchmark', 'repeat-apply', 'rollback-check', 'inspect']
if (!modes.includes(mode)) throw new Error(`Use ${modes.join('|')}`)
if (process.env.S1_LOCAL_CONFIRMED !== 'yes') throw new Error('Set S1_LOCAL_CONFIRMED=yes only for the disposable local stack')
const docker = '/Applications/Docker.app/Contents/Resources/bin/docker'
const container = 'supabase_db_premed-s1-disposable'
const cleanEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(SUPABASE|PG|DATABASE|VITE_|AWS_|S3_)/.test(k)))
if (execFileSync(docker, ['context', 'show'], { env: cleanEnv, encoding: 'utf8' }).trim() !== 'desktop-linux') throw new Error('Refuse a non-local Docker context')
const project = execFileSync(docker, ['inspect', '--format', '{{index .Config.Labels "com.supabase.cli.project"}}', container], { env: cleanEnv, encoding: 'utf8' }).trim()
if (project !== 'premed-s1-disposable') throw new Error('Refuse a container outside the isolated project')
// psql inside the verified local container; no host install.
const query = sql => execFileSync(docker, ['exec', '-i', '-e', 'PGPASSWORD=postgres', container, 'psql', '-X', '-q', '-v', 'ON_ERROR_STOP=1', '-h', '127.0.0.1', '-p', '5432', '-U', 'postgres', '-d', 'postgres'],
  { env: cleanEnv, input: sql, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] })
const run = sql => { try { return query(sql) } catch (error) { process.stdout.write(error.stdout ?? ''); process.stderr.write(error.stderr ?? ''); process.exit(1) } }
// psql prints NOTICE lines on stderr; run with stderr merged for the matrix.
const runWithNotices = sql => {
  try {
    return execFileSync('/bin/sh', ['-c', `"${docker}" exec -i -e PGPASSWORD=postgres ${container} psql -X -q -v ON_ERROR_STOP=1 -h 127.0.0.1 -p 5432 -U postgres -d postgres 2>&1`], { env: cleanEnv, input: sql, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  } catch (error) { process.stdout.write(error.stdout ?? ''); process.exit(1) }
}
const file = p => readFileSync(realpathSync(resolve(root, p)), 'utf8')
const migration = file('supabase/migrations/20260924233000_s1_dashboard_write_guard.sql')
console.log(run("select 'database ' || current_database() || ', PostgreSQL ' || current_setting('server_version') || ', >=17: ' || (current_setting('server_version_num')::int >= 170000)::text;").trim())

const invariants = `
  do $$ begin
    if (select count(*) from pg_trigger where tgrelid = 'public.dashboards'::regclass and tgname = 'dashboards_write_guard' and tgenabled = 'O') <> 1 then raise exception 'expected exactly one enabled S1 guard'; end if;
    if exists (select 1 from pg_trigger where tgrelid = 'public.dashboards'::regclass and tgname = 'dashboards_schema_guard') then raise exception 'v1 guard still installed'; end if;
    if exists ((select * from public.dashboards except select * from s1_rows_before) union all (select * from s1_rows_before except select * from public.dashboards)) then
      raise exception 'applying the migration changed dashboard rows';
    end if;
  end $$;`

if (mode === 'bootstrap') {
  // Fresh-fixture setup: the repo's own table/RLS file, the authenticated grant from
  // the tracked migrations, then the S1 migration. All in one transaction.
  console.log(run(`begin;\n${file('supabase/schema.sql')}\ngrant select, insert, update, delete on public.dashboards to authenticated;\n${migration}\ncommit;`))
  console.log(run(`select 'rows ' || count(*) || ', claimed ' || count(*) filter (where write_rev is not null) from public.dashboards;`).trim())
} else if (mode === 'repeat-apply') {
  // Applying twice changes no row and leaves exactly one guard (brief item 6).
  console.log(run(`begin;
    lock table public.dashboards in access exclusive mode;
    create temporary table s1_rows_before as select * from public.dashboards;
    ${migration}
    ${migration}
    ${invariants}
    commit;
    select 'repeat-apply: rows unchanged, one enabled guard, v1 absent';`).trim())
} else if (mode === 'rollback-check') {
  // Local rehearsal of the out-of-band rollback, then roll forward, in one
  // transaction so the guard is never absent between statements.
  const rollback = file('scripts/s1/rollback.sql').replace(/^\s*(begin|commit);\s*$/gim, '')
  console.log(run(`begin;
    lock table public.dashboards in access exclusive mode;
    create temporary table s1_rows_before as select * from public.dashboards where false;
    ${rollback}
    do $$ begin
      if exists (select 1 from pg_trigger where tgrelid = 'public.dashboards'::regclass and tgname = 'dashboards_write_guard') then raise exception 'rollback left the guard'; end if;
      if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'dashboards' and column_name in ('cloud_schema', 'write_rev')) then raise exception 'rollback left the columns'; end if;
    end $$;
    ${migration}
    truncate s1_rows_before; insert into s1_rows_before select * from public.dashboards;
    ${invariants}
    rollback;
    select 'rollback-check: rollback removed guard and columns; roll-forward reinstalled them; all rolled back';`).trim())
} else if (mode === 'inspect') {
  console.log(run(`select user_id, cloud_schema, write_rev, updated_at, length(data::text) as bytes from public.dashboards order by updated_at desc limit 20;`))
} else {
  process.stdout.write(runWithNotices(file(`scripts/s1/${mode === 'sql' ? 'sql-tests' : 'benchmark'}.sql`)))
}
