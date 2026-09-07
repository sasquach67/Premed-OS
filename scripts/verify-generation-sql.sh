#!/usr/bin/env bash
# Verify the generation queue's SQL against a real PostgreSQL cluster.
#
# The Edge runner assumes Postgres enforces the rules that keep a build from
# being generated — or paid for — twice: the active-job dedupe index, the
# exclusive task lease, the stage gate on claiming, the attempt bound, and the
# RLS that makes a build readable by its owner and writable by nobody but the
# service role. Those are properties of the database, so they are checked in a
# database rather than in a stub.
#
# A local cluster has no pg_cron, pg_net or Vault, so `local_supabase_stubs.sql`
# supplies just enough of each for the migrations to run and their logic to be
# exercised. The scheduling itself is Supabase's and is verified on deployment.
set -euo pipefail

PGBIN=${PGBIN:-/usr/lib/postgresql/16/bin}
ROOT=${ROOT:-/var/lib/postgresql/premedos-verify}
PORT=${PORT:-55432}
REPO="$(cd "$(dirname "$0")/.." && pwd)"

command -v "$PGBIN/initdb" >/dev/null || { echo "PostgreSQL not found at $PGBIN (set PGBIN)"; exit 1; }

cleanup() { su postgres -c "PATH=$PGBIN:\$PATH pg_ctl -D $ROOT/data stop -m immediate" >/dev/null 2>&1 || true; }
trap cleanup EXIT

rm -rf "$ROOT"; mkdir -p "$ROOT"; chown -R postgres:postgres "$ROOT"
su postgres -c "PATH=$PGBIN:\$PATH initdb -D $ROOT/data -A trust" >"$ROOT/initdb.log" 2>&1
su postgres -c "PATH=$PGBIN:\$PATH pg_ctl -D $ROOT/data -o '-k $ROOT -p $PORT -c listen_addresses=' -l $ROOT/pg.log -w start" >/dev/null
for attempt in $(seq 1 30); do
  if su postgres -c "PATH=$PGBIN:\$PATH pg_isready -h $ROOT -p $PORT -q"; then break; fi
  sleep 1
done
su postgres -c "PATH=$PGBIN:\$PATH pg_isready -h $ROOT -p $PORT -q" || { echo "postgres did not start"; tail -20 "$ROOT/pg.log"; exit 1; }

cp "$REPO/supabase/tests/local_supabase_stubs.sql" "$ROOT/00_stubs.sql"
cp "$REPO/supabase/migrations/20260906230000_study_generation_jobs.sql" "$ROOT/01_jobs.sql"
# pg_cron and pg_net ship with the platform, not with a local cluster.
sed 's/^create extension if not exists pg_cron;/-- pg_cron: provided by Supabase/; s/^create extension if not exists pg_net;/-- pg_net: provided by Supabase/' \
  "$REPO/supabase/migrations/20260907010000_generation_task_stages.sql" > "$ROOT/02_tasks.sql"
sed 's/^select cron.unschedule/-- pg_cron: /' \
  "$REPO/supabase/migrations/20260907030000_generation_stage_budgets.sql" > "$ROOT/03_budgets.sql"
cp "$REPO/supabase/tests/generation_queue_test.sql" "$ROOT/04_test.sql"
chown postgres:postgres "$ROOT"/*.sql

for file in 00_stubs 01_jobs 02_tasks 03_budgets; do
  su postgres -c "psql -h $ROOT -p $PORT -d postgres -v ON_ERROR_STOP=1 -q -f $ROOT/$file.sql" >/dev/null
done
echo "migrations applied"
su postgres -c "psql -h $ROOT -p $PORT -d postgres -v ON_ERROR_STOP=1 -q -f $ROOT/04_test.sql" 2>&1 | tee "$ROOT/test.out"

if grep -qi "BUG" "$ROOT/test.out"; then echo "FAILED: a guarantee did not hold"; exit 1; fi
echo "generation queue SQL verified"
