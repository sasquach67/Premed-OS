# Google Calendar OAuth verification

**Current status:** the narrow runtime scope is deployed and Google Cloud Data
Access matches it. A fresh end-to-end consent test, a replacement demonstration
video, and Google's external verification are still required.

## Production behavior and least privilege

Premed OS requests exactly:

`https://www.googleapis.com/auth/calendar.events.owned.readonly`

The app calls `events.list` for the special `primary` calendar ID and renders
the next timed events on Overview. It does not call CalendarList, inspect other
calendars, read a Canvas token, or create, change, or delete Google events.

This is intentionally narrower than the retired `calendar.readonly` scope.
Google's Calendar scope reference describes the current scope as viewing events
on calendars the user owns. The Events API lists it as an accepted read scope.

- Scope reference: https://developers.google.com/workspace/calendar/api/auth
- Events.list authorization: https://developers.google.com/workspace/calendar/api/v3/reference/events/list

## Google Cloud Console alignment

The production configuration must remain aligned as follows:

1. Open the production Google Cloud project used by `VITE_GOOGLE_CLIENT_ID`.
2. Confirm the Google Calendar API is enabled.
3. Under Google Auth Platform → Data Access, remove
   `https://www.googleapis.com/auth/calendar.readonly`.
4. Add only
   `https://www.googleapis.com/auth/calendar.events.owned.readonly`.
5. Confirm the authorized production JavaScript origin is
   `https://premedos.app` and keep only intentional development origins.
6. Keep publishing status **In production**.

The scope in Cloud Console, the scope in `src/lib/googleCalendar.ts`, and the
scope visible in the consent video must match exactly.

## Fresh verification test

Use a test Google account with one clearly named timed event on its primary
calendar. Revoke Premed OS from that account first so the recording captures a
fresh consent grant and does not reuse an older broad grant.

1. Sign into Premed OS with the supplied reviewer account.
2. Open Settings → Google Calendar schedule.
3. Select **Connect Google Calendar**.
4. Show the complete Google consent screen in English. Expand **Show all
   services** so the requested Calendar permission is readable.
5. Approve access.
6. Return to Premed OS and show the named event on Overview.
7. Use **Refresh** and show that the event remains visible.
8. Open Google Calendar in another tab and show the same source event.
9. Return to Settings, disconnect Calendar, and show that cached Premed OS
   records remain while new Google refreshes stop.

Because the integration is read-only, there is no Google-side write or delete
impact to demonstrate. The video should explicitly show that the product has
no event-editing control.

## Reviewer navigation instructions

1. Visit `https://premedos.app` and sign in with the provided test account.
2. Open the profile menu → **Settings**.
3. Find **Google Calendar schedule** and choose **Connect Google Calendar**.
4. Complete Google consent with the same test Google account.
5. Return to **Overview** to see upcoming timed events.
6. Use **Refresh** to retrieve the latest primary-calendar events.
7. Return to Settings to disconnect.

Do not include a personal password in documentation or source control. Send
temporary reviewer credentials only through Google's requested reply channel.

## Completion gate

- [x] Runtime scope is `calendar.events.owned.readonly`.
- [x] No CalendarList request exists in production code.
- [x] Previously stored broad-scope bearer tokens are not reused.
- [x] Google Cloud Data Access matches the runtime scope exactly.
- [x] Production origin and client ID are correct.
- [ ] Fresh consent round-trip succeeds on production.
- [ ] A real primary-calendar event appears and refreshes.
- [ ] Disconnect stops refresh without deleting local records.
- [ ] New demonstration video satisfies Google's consent-screen requirements.
- [ ] Google confirms verification; only then describe the app as verified.
