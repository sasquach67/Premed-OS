import { FunctionsHttpError, type SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { beginGoogleDriveMaterialConnection } from './googleDriveMaterialSourceClient'

function clientReturning(result: { data: unknown; error: unknown }) {
  const invoke = vi.fn().mockResolvedValue(result)
  return {
    client: { functions: { invoke } } as unknown as SupabaseClient,
    invoke,
  }
}

describe('beginGoogleDriveMaterialConnection', () => {
  it('passes an optional return destination to the Edge Function', async () => {
    const { client, invoke } = clientReturning({
      data: { authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth', connectionId: 'connection-1' },
      error: null,
    })

    await expect(beginGoogleDriveMaterialConnection(client, {
      folderId: 'folder_12345678',
      rootLabel: 'BIOL 103',
      returnTo: '#/academics?mode=daily&tab=class-center',
    })).resolves.toEqual({
      ok: true,
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      connectionId: 'connection-1',
    })
    expect(invoke).toHaveBeenCalledWith('google-drive-materials', {
      body: {
        action: 'begin',
        folderId: 'folder_12345678',
        rootLabel: 'BIOL 103',
        returnTo: '#/academics?mode=daily&tab=class-center',
      },
    })
  })

  it('preserves a configuration-required response from FunctionsHttpError context', async () => {
    const error = new FunctionsHttpError(new Response(JSON.stringify({
      error: {
        code: 'configuration-required',
        message: 'Google Drive materials must be configured by the app owner first.',
      },
    }), { status: 503, headers: { 'Content-Type': 'application/json' } }))
    const { client } = clientReturning({ data: null, error })

    await expect(beginGoogleDriveMaterialConnection(client, {
      folderId: 'folder_12345678',
      rootLabel: 'BIOL 103',
    })).resolves.toEqual({
      ok: false,
      reason: 'configuration-required',
      message: 'Google Drive materials must be configured by the app owner first.',
    })
  })

  it('preserves the server message while retaining the caller fallback reason', async () => {
    const error = new FunctionsHttpError(new Response(JSON.stringify({
      error: {
        code: 'provider-unavailable',
        message: 'The folder connection could not be prepared.',
      },
    }), { status: 503, headers: { 'Content-Type': 'application/json' } }))
    const { client } = clientReturning({ data: null, error })

    await expect(beginGoogleDriveMaterialConnection(client, {
      folderId: 'folder_12345678',
      rootLabel: 'BIOL 103',
    })).resolves.toEqual({
      ok: false,
      reason: 'server-unavailable',
      message: 'The folder connection could not be prepared.',
    })
  })
})
