# Deploying the AI study-tools function

The recall session's gap-check runs in a Supabase Edge Function so the model API
key stays server-side. This app deploys as **static GitHub Pages** — any
`VITE_*` variable is compiled into the public bundle, so a model key can never
live in `.env`. Only the Supabase *anon* key belongs there; it is public-safe by
design and RLS protects the data.

## Three surfaces — they are not interchangeable

Most of the confusion here is putting the right thing in the wrong place.

| Surface | What runs there | Used for |
|---|---|---|
| **SQL editor** (dashboard) | Postgres SQL only | Running `schema.sql` and `migrations/*.sql` |
| **Edge Functions → Secrets** (dashboard form) | Nothing — a name/value form | API keys |
| **Terminal** (Mac Terminal / iTerm) | Shell commands | `brew`, `supabase link`, `supabase functions deploy` |

Anything starting with `supabase ` is a **terminal** command. Anything shaped
like `select … from …` is the **SQL editor**. An API key is neither — it is a
form field. Never paste a key into the SQL editor: the query fails *and* the
editor saves the snippet, so the key persists in your saved queries.

## Order of operations

### 1. Restore the project (dashboard)

Free-tier projects pause after ~7 days idle. Dashboard → the project →
**Restore project**. The project URL and anon key survive a restore, so
`.env.local` and the `VITE_SUPABASE_*` GitHub Actions secrets keep working.

### 2. Check the D6 migration has run (SQL editor)

```sql
select to_regclass('public.academic_source_chunks'), to_regclass('public.ai_usage_buckets');
```

Two nulls means it hasn't. Paste the contents of
`migrations/20260727_d6_ai_coverage.sql` into the SQL editor and run it. It
enables the `vector` extension, creates the chunk store with RLS, the
`ai_usage_buckets` rate limiter, and `match_academic_chunks()`.

### 3. Add the secrets (dashboard form)

Edge Functions → Secrets. Names must match exactly — the function reads them by
name, and a typo surfaces as a generic "provider unavailable", not as a
configuration error.

| Name | Required? | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | **Yes** | Generates the gap report, with verified citations |
| `OPENAI_EMBEDDING_API_KEY` | Optional | Semantic retrieval. Without it, retrieval falls back to the 24 oldest chunks for the topic |
| `ANTHROPIC_MODEL` | Optional | Overrides the code default (`claude-opus-5`) |
| `AI_PROVIDER` | **Leave unset** | Setting it to `openai` swaps the generator to a path with no verified citations — see the warning below |
| `OPENAI_API_KEY` | No | Only read when `AI_PROVIDER=openai`. Unused otherwise |

Paste values raw — no surrounding quotes, no trailing whitespace.

### 4. Deploy the function (terminal)

Only this step needs the CLI.

**You do not need Homebrew.** Verified Aug 19, 2026: this machine has no `brew`
at all, which is what "command not found" actually means here — it is brew that
is missing, not the Supabase CLI. `npx` runs the CLI without installing
anything, without sudo, and without touching `package.json`:

```bash
npx --yes supabase@latest --version
```

Use `npx --yes supabase@latest <command>` in place of `supabase <command>`
everywhere below. The Homebrew route still works if you would rather have it
on PATH permanently:

```bash
brew install supabase/tap/supabase
```

```bash
cd ~/Documents/premed-os
```

First authenticate — **this step is yours**, it opens a browser and signs in to
your Supabase account:

```bash
npx --yes supabase@latest login
```

Then link. This project's ref is derived from `VITE_SUPABASE_URL` in
`.env.local`, so it is filled in here rather than left as a placeholder:

```bash
npx --yes supabase@latest link --project-ref poichxqptuupzrkyewrq
```

`link` pairs this folder with one cloud project so later commands know where to
send things. `YOUR_PROJECT_REF` is the string in your dashboard URL
(`https://supabase.com/dashboard/project/<ref>`), also under Project Settings →
General → Reference ID. It may prompt for a database password; you can skip
that for functions and secrets work.

```bash
npx --yes supabase@latest functions deploy study-tools
```

**Check it worked** — this is the fastest way to tell deployment apart from a
key problem, and they are different failures:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$(grep '^VITE_SUPABASE_URL=' .env.local | cut -d= -f2-)/functions/v1/study-tools" -H "Content-Type: application/json" -d '{}'
```

`404` = the function is not deployed, and no secret can help until it is.
`401` = deployed and correctly rejecting unauthenticated calls. **As of
Aug 19, 2026 this returns 404.**

⚠️ **Do not paste the API key into a command someone else runs for you.** Use
the dashboard's Edge Functions → Secrets form, or run
`npx --yes supabase@latest secrets set ANTHROPIC_API_KEY=...` yourself in your
own terminal. The key should never appear in a shared transcript.

### 5. Sign in

The function rejects unauthenticated calls (`sign-in-required`). Settings →
Cloud sync & login → magic link. The gap-check button in the recall session is
gated on `isSupabaseConfigured`, so it stays disabled until the client has
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

## Two things worth knowing about the function

**Citations, not structured outputs.** The Anthropic call enables document
citations and does *not* set `output_config.format` — the two are mutually
exclusive and return a 400 together. Citations are the load-bearing half:
`validateResult` cross-checks every claimed citation against the Citations API's
real character offsets and rejects the whole response if one doesn't match. That
check is what makes the blue "from your materials" chip in the gap report a
verified claim rather than an assertion. The JSON shape is enforced by
`validateResult` instead of by the API.

**The OpenAI generation path is weaker, and the UI doesn't say so.**
`callOpenAI` returns no `trustedCitations`, which makes that verification step
skip entirely — a citation then only has to point at a real chunk with in-bounds
offsets, never verified as actually supporting the claim. The gap report renders
identically either way. This is why `AI_PROVIDER` should stay unset until the
OpenAI path either produces verified citations or marks its items as unverified.

## Rate limits

`claim_ai_request` caps usage at **20/hour and 100/day per user**. Fine for one
person; revisit before anyone else uses it.

## Optional Google Drive materials folder

`google-drive-materials` is separate from the existing browser-only Google
Drive **backup** integration. It requests `drive.readonly` only after a
student explicitly selects one folder; the server uses it only to stage
metadata proposals and to retrieve a single file after that proposal is
accepted. It never mirrors a folder to Supabase Storage.

Before deploying it, apply
`migrations/20260824044417_academic_material_source_connections.sql`, then set
these **Edge Function Secrets** (never `VITE_*`):

| Secret | Purpose |
|---|---|
| `GOOGLE_DRIVE_CLIENT_ID` | OAuth web client ID for the server-side folder reader |
| `GOOGLE_DRIVE_CLIENT_SECRET` | matching OAuth client secret |
| `MATERIAL_SOURCE_TOKEN_ENCRYPTION_KEY` | random 32-byte key, base64 encoded; encrypts refresh tokens before database storage |
| `PREMEDOS_APP_ORIGIN` | exact deployed app origin, e.g. `https://premedos.app` |
| `MATERIAL_SOURCE_ALLOWED_ORIGINS` | comma-separated exact browser origins, including the production and deliberate local dev origin |

Enable the Google Drive API and add
`https://<project-ref>.supabase.co/functions/v1/google-drive-materials?action=callback`
as the OAuth client’s **exact** redirect URI. Add `drive.readonly` to the
consent-screen scope disclosure and update the public privacy explanation
before asking a user to connect a folder. Deploy with:

```bash
npx --yes supabase@latest functions deploy google-drive-materials
```

Then use a non-admin account and a disposable folder to verify: connect → list
metadata → review/accept locally → record accepted revision → download that one
file → disconnect. A static GitHub Pages browser cannot watch a folder in the
background; v1 offers an explicit check only.
