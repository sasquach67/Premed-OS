/* ============================================================
   AuthPage — sign in / create an account (05 §2).

   Magic link is the DEFAULT surface, password is a real equally-supported
   path (not a fallback stub), Google is third and is asked for SIGN-IN
   IDENTITY ONLY — Calendar and Drive scopes are requested later,
   separately, at the point of use (§2.1). Do not bundle them here.

   Every state in §2.2 renders, including the two everyone skips:
   "check your email" is a DESIGNED screen rather than a redirect with a
   toast, and an expired link says so instead of failing silently.

   ENUMERATION SAFETY (§2.3) is the rule that shapes the error handling:
   the response is byte-identical whether or not an email has an account.
   `signInWithOtp` sends the same mail either way, and Supabase returns
   one generic credential error for both a wrong password and an unknown
   address. Nothing in this file may branch on "does this user exist".

   And nothing in any auth mail carries grades, scores, coursework, or
   record counts — the transactional mail is a link and nothing else.
   ============================================================ */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, Mail } from 'lucide-react'
import { PublicShell } from '@/components/public/PublicShell'
import { PublicNav } from '@/components/public/PublicNav'
import { Wordmark } from '@/components/public/Wordmark'
import { supabase, isSupabaseConfigured, authRedirectTo } from '@/lib/supabase'
import { useEnterApp } from '@/components/public/useEnterApp'
import { markEnteredApp } from '@/lib/publicLayer'
import type { User } from '@supabase/supabase-js'

type Screen = 'form' | 'sent' | 'signed-in'
type Method = 'link' | 'password'

/** Client-side cooldown between magic-link requests. The server rate-limits
 *  too; this exists so the limit is stated plainly before it is hit (§2.3). */
const RESEND_COOLDOWN_S = 60

/** One generic message per failure class. None of them reveal whether an
 *  address has an account. */
const MESSAGES = {
  credentials: "That email and password don't match an account.",
  rateLimited: 'Too many attempts. Wait a minute and try again.',
  network: "Couldn't reach the server. Check your connection and try again.",
  generic: 'Something went wrong on our side. Try again in a moment.',
  expired: 'That link has expired or has already been used. Send yourself a new one.',
  notConfigured:
    'Accounts are not switched on in this build. Everything still works signed out — your data is on this device.',
  weakPassword: 'Use at least 8 characters.',
} as const

function classifyError(error: unknown): string {
  if (error instanceof TypeError) return MESSAGES.network
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  if (message.includes('rate') || message.includes('too many') || message.includes('429')) {
    return MESSAGES.rateLimited
  }
  if (message.includes('invalid login') || message.includes('credentials')) return MESSAGES.credentials
  if (message.includes('password')) return MESSAGES.weakPassword
  if (message.includes('fetch') || message.includes('network')) return MESSAGES.network
  return MESSAGES.generic
}

/** Supabase returns link failures as query params on the redirect target.
 *  With HashRouter they can land in either the search string or the part
 *  of the hash after `?`, so both are checked. */
function readLinkError(): string | null {
  if (typeof window === 'undefined') return null
  const fromSearch = new URLSearchParams(window.location.search).get('error_description')
  const hashQuery = window.location.hash.split('?')[1] ?? ''
  const fromHash = new URLSearchParams(hashQuery).get('error_description')
  return fromSearch ?? fromHash
}

export function AuthPage() {
  const navigate = useNavigate()
  const enterApp = useEnterApp()
  const [params] = useSearchParams()

  const [screen, setScreen] = useState<Screen>('form')
  const [method, setMethod] = useState<Method>('link')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [user, setUser] = useState<User | null>(null)

  /** Deep-link preservation (§2.3): signing in from a shared link lands on
   *  that link, not the home page. */
  const next = params.get('next') || '/'

  // ── already signed in ────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) return
    let alive = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      if (data.session?.user) {
        setUser(data.session.user)
        setScreen('signed-in')
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return
      if (session?.user) {
        markEnteredApp()
        setUser(session.user)
        setScreen('signed-in')
      }
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // ── an expired or already-used link comes back as an error param ─────
  useEffect(() => {
    if (readLinkError()) setError(MESSAGES.expired)
  }, [])

  // ── resend cooldown ──────────────────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setTimeout(() => setCooldown((n) => n - 1), 1000)
    return () => window.clearTimeout(id)
  }, [cooldown])

  const emailValid = useMemo(() => /.+@.+\..+/.test(email.trim()), [email])

  const sendLink = useCallback(async () => {
    if (!supabase) {
      setError(MESSAGES.notConfigured)
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const { error: e } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: authRedirectTo },
      })
      if (e) throw e
      // Identical outcome whether or not the address has an account.
      setScreen('sent')
      setCooldown(RESEND_COOLDOWN_S)
    } catch (e) {
      setError(classifyError(e))
    } finally {
      setBusy(false)
    }
  }, [email])

  const signInWithPassword = useCallback(async () => {
    if (!supabase) {
      setError(MESSAGES.notConfigured)
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const { error: e } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (e) throw e
    } catch (e) {
      setError(classifyError(e))
    } finally {
      setBusy(false)
    }
  }, [email, password])

  const createWithPassword = useCallback(async () => {
    if (!supabase) {
      setError(MESSAGES.notConfigured)
      return
    }
    if (password.length < 8) {
      setError(MESSAGES.weakPassword)
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const { error: e } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: authRedirectTo },
      })
      if (e) throw e
      // Same wording for a new address and one that already exists.
      setNotice('Check your email to confirm the address, then come back and sign in.')
    } catch (e) {
      setError(classifyError(e))
    } finally {
      setBusy(false)
    }
  }, [email, password])

  const continueWithGoogle = useCallback(async () => {
    if (!supabase) {
      setError(MESSAGES.notConfigured)
      return
    }
    setBusy(true)
    setError('')
    try {
      // Identity only. No `scopes` option: Calendar and Drive are asked
      // for separately, at the moment they are used.
      const { error: e } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: authRedirectTo },
      })
      if (e) throw e
    } catch (e) {
      setError(classifyError(e))
      setBusy(false)
    }
  }, [])

  // ─────────────────────────────────────────────────────────────────────
  return (
    <PublicShell title="Sign in — Premed OS">
      <div className="pl-band">
        <PublicNav />
      </div>

      <div className="pl-authwrap">
        <div className="pl-authstack">
          {/* A sign-in screen with no mark is the one place a stranger
              checks they are in the right product. Not a link here — it is
              a label on the card, and the nav above already goes home. */}
          <Wordmark asLink={false} small />

          <div className="pl-card pl-authcard">
          {screen === 'sent' ? (
            <CheckYourEmail
              email={email.trim()}
              cooldown={cooldown}
              busy={busy}
              error={error}
              onResend={sendLink}
              onChange={() => {
                setScreen('form')
                setError('')
              }}
              onUsePassword={() => {
                setScreen('form')
                setMethod('password')
                setError('')
              }}
            />
          ) : screen === 'signed-in' ? (
            <SignedIn
              email={user?.email ?? ''}
              onContinue={() => {
                markEnteredApp()
                navigate(next)
              }}
              onSignOut={async () => {
                await supabase?.auth.signOut()
                setUser(null)
                setScreen('form')
              }}
            />
          ) : (
            <>
              <div className="pl-hd">
                <div>
                  <h1 className="pl-ti">Sign in</h1>
                  <div className="pl-sub" style={{ marginTop: 4, fontWeight: 600 }}>
                    Or create an account — same form either way.
                  </div>
                </div>
              </div>

              <div className="pl-bd" style={{ gap: 13 }}>
                {!isSupabaseConfigured ? (
                  <p className="pl-alert">{MESSAGES.notConfigured}</p>
                ) : null}
                {error ? (
                  <p className="pl-alert pl-alert-bad" role="alert">
                    {error}
                  </p>
                ) : null}
                {notice ? (
                  <p className="pl-alert pl-alert-ok" role="status">
                    {notice}
                  </p>
                ) : null}

                <div className="pl-field">
                  <label className="pl-lbl" htmlFor="auth-email">
                    Email
                  </label>
                  <input
                    id="auth-email"
                    className="pl-inp"
                    type="email"
                    autoComplete="email"
                    placeholder="you@unc.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {method === 'link' ? (
                  <>
                    <button
                      type="button"
                      className="pl-sbtn pl-sbtn-p pl-sbtn-full"
                      disabled={busy || !emailValid}
                      onClick={sendLink}
                    >
                      Email me a sign-in link
                    </button>
                    <div className="pl-orbar">
                      <i />
                      <span>OR</span>
                      <i />
                    </div>
                    <button
                      type="button"
                      className="pl-sbtn pl-sbtn-g pl-sbtn-full"
                      onClick={() => {
                        setMethod('password')
                        setError('')
                      }}
                    >
                      Use a password instead
                    </button>
                  </>
                ) : (
                  <>
                    <div className="pl-field">
                      <label className="pl-lbl" htmlFor="auth-password">
                        Password
                      </label>
                      <input
                        id="auth-password"
                        className="pl-inp"
                        type="password"
                        autoComplete="current-password"
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="pl-sbtn pl-sbtn-p pl-sbtn-full"
                      disabled={busy || !emailValid || password.length === 0}
                      onClick={signInWithPassword}
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      className="pl-sbtn pl-sbtn-g pl-sbtn-full"
                      disabled={busy || !emailValid || password.length === 0}
                      onClick={createWithPassword}
                    >
                      Create an account with this password
                    </button>
                    <div className="pl-orbar">
                      <i />
                      <span>OR</span>
                      <i />
                    </div>
                    <button
                      type="button"
                      className="pl-sbtn pl-sbtn-g pl-sbtn-full"
                      onClick={() => {
                        setMethod('link')
                        setError('')
                      }}
                    >
                      Email me a link instead
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="pl-sbtn pl-sbtn-g pl-sbtn-full"
                  disabled={busy}
                  onClick={continueWithGoogle}
                >
                  Continue with Google
                </button>

                <p className="pl-fine">
                  By continuing you agree to the <Link className="pl-lk" to="/terms">Terms</Link> and{' '}
                  <Link className="pl-lk" to="/privacy">Privacy Policy</Link>. We ask Google for your
                  sign-in identity only — Calendar and Drive are requested later, separately, if you
                  want them.
                </p>

                <button type="button" className="pl-lk" onClick={enterApp}>
                  <ArrowLeft size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> Keep
                  going without an account
                </button>
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </PublicShell>
  )
}

/* ── "Check your email" — a DESIGNED state (05 §2.2, decisions #7) ────────
   Expiry stated, resend offered, password fallback offered, and it closes
   by reassuring that local data is untouched. */
function CheckYourEmail({
  email,
  cooldown,
  busy,
  error,
  onResend,
  onChange,
  onUsePassword,
}: {
  email: string
  cooldown: number
  busy: boolean
  error: string
  onResend: () => void
  onChange: () => void
  onUsePassword: () => void
}) {
  return (
    <>
      <div className="pl-hd">
        <div className="pl-mailbadge">
          <Mail aria-hidden="true" />
        </div>
      </div>
      <div className="pl-bd" style={{ gap: 13 }}>
        <div>
          <h1 className="pl-ti">Check your email</h1>
          <div className="pl-sub" style={{ marginTop: 5, fontWeight: 600 }}>
            We sent a sign-in link to:
          </div>
        </div>

        <div className="pl-row">
          <span>{email}</span>
          <button type="button" className="pl-lk" onClick={onChange}>
            Change
          </button>
        </div>

        {error ? (
          <p className="pl-alert pl-alert-bad" role="alert">
            {error}
          </p>
        ) : null}

        <p className="pl-fine">
          <b>The link works once and expires in 15 minutes.</b> If it hasn't arrived in a couple of
          minutes, check spam — or use a password instead.
        </p>

        <button
          type="button"
          className="pl-sbtn pl-sbtn-g pl-sbtn-full"
          disabled={busy || cooldown > 0}
          onClick={onResend}
        >
          {cooldown > 0 ? `Resend link in ${cooldown}s` : 'Resend link'}
        </button>
        <button type="button" className="pl-sbtn pl-sbtn-g pl-sbtn-full" onClick={onUsePassword}>
          Use a password instead
        </button>

        <p className="pl-fine">
          Nothing you've already tracked is affected. <b>Your data is still on this device.</b>
        </p>
      </div>
    </>
  )
}

/* ── Already signed in ──────────────────────────────────────────────────── */
function SignedIn({
  email,
  onContinue,
  onSignOut,
}: {
  email: string
  onContinue: () => void
  onSignOut: () => void
}) {
  return (
    <>
      <div className="pl-hd">
        <div className="pl-mailbadge">
          <Check aria-hidden="true" />
        </div>
      </div>
      <div className="pl-bd" style={{ gap: 13 }}>
        <div>
          <h1 className="pl-ti">You're already signed in</h1>
          <div className="pl-sub" style={{ marginTop: 5, fontWeight: 600 }}>
            {email}
          </div>
        </div>
        <button type="button" className="pl-sbtn pl-sbtn-p pl-sbtn-full" onClick={onContinue}>
          Go to your workspace
        </button>
        <button type="button" className="pl-sbtn pl-sbtn-g pl-sbtn-full" onClick={onSignOut}>
          Sign out
        </button>
        <p className="pl-fine">
          Signing out does not delete anything. <b>Your data stays on this device.</b>
        </p>
      </div>
    </>
  )
}
