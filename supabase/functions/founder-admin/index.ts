import { createClient } from 'npm:@supabase/supabase-js@2.110.2'

const allowedOrigins = new Set([
  'https://premedos.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5180',
  'http://127.0.0.1:5180',
])

function corsHeaders(request: Request) {
  const origin = request.headers.get('Origin') ?? ''
  return {
    'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'https://premedos.app',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

function json(request: Request, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
  })
}

type RequestBody = {
  action?: 'overview' | 'delete-account'
  targetUserId?: string
  confirmationEmail?: string
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) })
  if (request.method !== 'POST') return json(request, 405, { error: 'method-not-allowed' })

  const authorization = request.headers.get('Authorization')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!authorization || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(request, 401, { error: 'sign-in-required' })
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authorization } },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return json(request, 401, { error: 'sign-in-required' })

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  const { data: founder, error: founderError } = await admin
    .from('founder_admins')
    .select('user_id, canonical_email')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (founderError) {
    console.error('founder authorization failed', founderError.message)
    return json(request, 503, { error: 'authorization-unavailable' })
  }
  if (!founder) return json(request, 403, { error: 'founder-only' })

  const body = await request.json().catch(() => null) as RequestBody | null
  if (!body?.action) return json(request, 400, { error: 'action-required' })

  if (body.action === 'overview') {
    const { data: usersPage, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (usersError) {
      console.error('founder account listing failed', usersError.message)
      return json(request, 503, { error: 'overview-unavailable' })
    }

    const users = usersPage.users
    const userIds = users.map((user) => user.id)
    const weekStart = new Date()
    weekStart.setUTCHours(0, 0, 0, 0)
    weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7))
    const [{ data: dashboards, error: dashboardsError }, { data: usage, error: usageError }] = await Promise.all([
      admin.from('dashboards').select('user_id').in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']),
      admin.from('ai_usage_buckets').select('requests').eq('bucket_kind', 'week').gte('bucket_start', weekStart.toISOString()),
    ])
    if (dashboardsError || usageError) {
      console.error('founder aggregates failed', dashboardsError?.message ?? usageError?.message)
      return json(request, 503, { error: 'overview-unavailable' })
    }

    const workspaceOwners = new Set((dashboards ?? []).map((row) => row.user_id))
    const now = Date.now()
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    const accounts = users
      .map((user) => ({
        id: user.id,
        email: user.email ?? 'Email unavailable',
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
        providers: Array.isArray(user.app_metadata?.providers)
          ? user.app_metadata.providers.filter((value): value is string => typeof value === 'string')
          : [],
        hasWorkspace: workspaceOwners.has(user.id),
        isFounder: user.id === founder.user_id,
      }))
      .sort((left, right) => Number(right.isFounder) - Number(left.isFounder) || left.email.localeCompare(right.email))

    return json(request, 200, {
      founder: { id: founder.user_id, email: founder.canonical_email },
      metrics: {
        accounts: accounts.length,
        workspaces: workspaceOwners.size,
        activeLast7Days: accounts.filter((account) => account.lastSignInAt && now - Date.parse(account.lastSignInAt) <= sevenDays).length,
        joinedLast7Days: accounts.filter((account) => now - Date.parse(account.createdAt) <= sevenDays).length,
        weeklyAiRequests: (usage ?? []).reduce((total, row) => total + (Number(row.requests) || 0), 0),
      },
      accounts,
      generatedAt: new Date().toISOString(),
    })
  }

  if (body.action === 'delete-account') {
    const targetUserId = body.targetUserId?.trim()
    const confirmationEmail = body.confirmationEmail?.trim().toLowerCase()
    if (!targetUserId || !confirmationEmail) return json(request, 400, { error: 'confirmation-required' })
    if (targetUserId === founder.user_id) return json(request, 409, { error: 'founder-is-protected' })

    const { data: targetData, error: targetError } = await admin.auth.admin.getUserById(targetUserId)
    if (targetError || !targetData.user) return json(request, 404, { error: 'account-not-found' })
    const targetEmail = targetData.user.email?.trim().toLowerCase()
    if (!targetEmail || targetEmail !== confirmationEmail) return json(request, 400, { error: 'confirmation-mismatch' })

    const { error: deleteError } = await admin.auth.admin.deleteUser(targetUserId)
    if (deleteError) {
      console.error('founder account deletion failed', deleteError.message)
      return json(request, 503, { error: 'delete-failed' })
    }

    const { error: auditError } = await admin.from('founder_admin_audit_log').insert({
      actor_user_id: founder.user_id,
      action: 'account.deleted',
      target_user_id: targetUserId,
      target_email: targetEmail,
      details: { source: 'founder-console' },
    })
    if (auditError) console.error('founder audit write failed', auditError.message)

    return json(request, 200, { deleted: true, targetUserId, targetEmail })
  }

  return json(request, 400, { error: 'unsupported-action' })
})
