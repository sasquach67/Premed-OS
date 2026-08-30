import { createClient } from 'npm:@supabase/supabase-js@2.110.2'

const cors = {
  'Access-Control-Allow-Origin': 'https://premedos.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function response(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return response(405, { error: 'method-not-allowed' })

  const authorization = request.headers.get('Authorization')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!authorization || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return response(401, { error: 'sign-in-required' })
  }

  const body = await request.json().catch(() => null) as { confirmation?: unknown } | null
  if (body?.confirmation !== 'DELETE') return response(400, { error: 'confirmation-required' })

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authorization } },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return response(401, { error: 'sign-in-required' })

  // Revoke every refresh session before removing the account. The service
  // client below keeps the verified user id, so it can still perform the
  // deletion after the user's browser token has been invalidated.
  await fetch(`${supabaseUrl}/auth/v1/logout?scope=global`, {
    method: 'POST',
    headers: { apikey: anonKey, Authorization: authorization },
  })

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  const { error: deleteError } = await admin.auth.admin.deleteUser(userData.user.id)
  if (deleteError) {
    console.error('account deletion failed', deleteError.message)
    return response(503, { error: 'delete-failed' })
  }

  return response(200, { deleted: true })
})
