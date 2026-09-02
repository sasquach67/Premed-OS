import { useCallback, useMemo, useState } from 'react'
import { useStore } from '@/store/store'
import type { NormalizedScheduleEvent } from '@/lib/types'
import {
  connectCalendar,
  connectCalendarSilent,
  disconnectCalendar,
  fetchPrimaryUpcomingEvents,
  isCalendarConnected,
} from '@/lib/googleCalendar'
import { calendarAvailability, calendarUnavailableMessage } from '@/lib/calendarAccess'

export type CalendarSyncStatus = 'idle' | 'connecting' | 'syncing' | 'connected' | 'error'

export function useCalendarSync() {
  const calendar = useStore((s) => s.settings.calendar)
  const signedInEmail = useStore((s) => s.profile.email)
  const backupClientId = useStore((s) => s.settings.backup.googleClientId)
  const update = useStore((s) => s.update)
  const [status, setStatus] = useState<CalendarSyncStatus>('idle')
  const [error, setError] = useState('')

  const envClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || ''
  const envApiKey = (import.meta.env.VITE_GOOGLE_API_KEY as string | undefined) || ''

  const clientId = useMemo(
    () => calendar.googleClientId || envClientId || backupClientId || '',
    [backupClientId, calendar.googleClientId, envClientId]
  )
  const apiKey = calendar.googleApiKey || envApiKey
  const connected = calendar.enabled && isCalendarConnected()
  const availability = useMemo(
    () => calendarAvailability(signedInEmail, Boolean(clientId)),
    [signedInEmail, clientId],
  )
  const unavailableMessage = availability.available ? '' : calendarUnavailableMessage(availability.reason)

  const saveEvents = useCallback((events: NormalizedScheduleEvent[]) => {
    update((d) => {
      d.settings.calendar.enabled = true
      d.settings.calendar.cachedEvents = events
      d.settings.calendar.lastSyncedAt = Date.now()
      d.settings.calendar.lastError = undefined
      d.settings.calendar.connectedAccount = 'Google Calendar'
      if (!d.settings.calendar.googleClientId && clientId && clientId !== backupClientId) d.settings.calendar.googleClientId = clientId
      if (!d.settings.calendar.googleApiKey && apiKey) d.settings.calendar.googleApiKey = apiKey
    })
  }, [apiKey, backupClientId, clientId, update])

  const refresh = useCallback(async (date = new Date()) => {
    setStatus('syncing')
    setError('')
    try {
      if (!isCalendarConnected()) throw new Error('Reconnect Google Calendar to refresh upcoming events.')
      const events = await fetchPrimaryUpcomingEvents(date)
      saveEvents(events)
      setStatus('connected')
      return events
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Calendar refresh failed.'
      setError(msg)
      setStatus('error')
      update((d) => { d.settings.calendar.lastError = msg })
      throw e
    }
  }, [saveEvents, update])

  const connect = useCallback(async (date = new Date()) => {
    if (!availability.available) {
      setStatus('error')
      setError(unavailableMessage)
      throw new Error(unavailableMessage)
    }
    setStatus('connecting')
    setError('')
    try {
      await connectCalendar(clientId)
      const events = await refresh(date)
      return events
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Calendar connection failed.'
      setError(msg)
      setStatus('error')
      update((d) => { d.settings.calendar.lastError = msg })
      throw e
    }
  }, [availability, clientId, refresh, unavailableMessage, update])

  const connectSilent = useCallback(async (date = new Date()) => {
    if (!clientId || !availability.available) return null
    try {
      await connectCalendarSilent(clientId)
      return refresh(date)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Reconnect Google Calendar.'
      update((d) => { d.settings.calendar.lastError = msg })
      return null
    }
  }, [availability, clientId, refresh, update])

  const disconnect = useCallback(() => {
    disconnectCalendar()
    setStatus('idle')
    setError('')
    update((d) => {
      d.settings.calendar.enabled = false
      d.settings.calendar.connectedAccount = undefined
      d.settings.calendar.lastError = undefined
    })
  }, [update])

  return {
    calendar,
    clientId,
    apiKey,
    connected,
    configured: Boolean(clientId),
    canConnect: availability.available,
    availability,
    unavailableMessage,
    status,
    error: error || calendar.lastError || '',
    connect,
    connectSilent,
    refresh,
    disconnect,
  }
}
