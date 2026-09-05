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
import { ArrowLeft, Check, Eye, EyeOff, Mail } from 'lucide-react'
import { PublicShell } from '@/components/public/PublicShell'
import { PublicNav } from '@/components/public/PublicNav'
import { Wordmark } from '@/components/public/Wordmark'
import { supabase, isSupabaseConfigured, authRedirectTo } from '@/lib/supabase'
import { useEnterApp } from '@/components/public/useEnterApp'
import { markEnteredApp } from '@/lib/publicLayer'
import type { User } from '@supabase/supabase-js'
import { activateGuestWorkspace } from '@/store/store'

type Screen = 'form' | 'sent' | 'recovery' | 'signed-in'
type Method = 'link' | 'password'
type PasswordIntent = 'sign-in' | 'create'
type SentPurpose = 'sign-in-link' | 'signup-confirmation'

/** Client-side cooldown between magic-link requests. The server rate-limits
 *  too; this exists so the limit is stated plainly before it is hit (§2.3). */
const RESEND_COOLDOWN_S = 60

/** HashRouter needs the recovery route in the fragment. Supabase adds its
 * PKCE code before the hash, then the client establishes the short-lived
 * recovery session and this page can safely ask for a new password. */
function passwordRecoveryRedirect() {
  if (typeof window === 'undefined') return authRedirectTo
  return `${window.location.origin}${import.meta.env.BASE_URL}#/auth?mode=recovery`
}

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
  weakPassword: 'Use at least 8 characters with uppercase, lowercase, a number, and a symbol.',
  passwordPolicyMismatch:
    'Password account creation is temporarily misconfigured. Use Google sign-up or try again shortly.',
} as const

function classifyError(error: unknown): string {
  if (error instanceof TypeError) return MESSAGES.network
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  if (message.includes('rate') || message.includes('too many') || message.includes('429')) {
    return MESSAGES.rateLimited
  }
  if (message.includes('invalid login') || message.includes('credentials')) return MESSAGES.credentials
  const serverMinimum = message.match(/password should be at least (\d+) characters/)
  if (serverMinimum && Number(serverMinimum[1]) > 8) return MESSAGES.passwordPolicyMismatch
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

function meetsNewPasswordRule(value: string) {
  return newPasswordRequirements(value).every((requirement) => requirement.met)
}

function newPasswordRequirements(value: string) {
  return [
    { label: 'At least 8 characters', met: value.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(value) },
    { label: 'One lowercase letter', met: /[a-z]/.test(value) },
    { label: 'One number', met: /\d/.test(value) },
    { label: 'One symbol', met: /[^A-Za-z0-9\s]/.test(value) },
  ]
}

/** Google's four-colour G is a brand mark, not a generic application icon.
 * Keep it isolated from the button text so the auth intent can change without
 * redrawing or recolouring the mark. */
function GoogleGIcon() {
  return (
    <svg
      className="pl-google-g"
      viewBox="0 0 18 18"
      aria-hidden="true"
      focusable="false"
    >
      <path fill="#4285F4" d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.797 2.715v2.258h2.909c1.702-1.567 2.684-3.875 2.684-6.614Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.468-.806 5.956-2.181l-2.909-2.258c-.806.54-1.835.859-3.047.859-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.963 10.706A5.41 5.41 0 0 1 3.682 9c0-.592.102-1.168.281-1.706V4.962H.956A9 9 0 0 0 0 9c0 1.452.347 2.827.956 4.038l3.007-2.332Z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.507.454 3.441 1.346l2.581-2.581C13.464.892 11.426 0 9 0A9 9 0 0 0 .956 4.962l3.007 2.332C4.672 5.165 6.656 3.58 9 3.58Z" />
    </svg>
  )
}

function PasswordInput({
  id,
  label,
  value,
  visible,
  autoComplete,
  onChange,
  onToggle,
}: {
  id: string
  label: string
  value: string
  visible: boolean
  autoComplete: 'current-password' | 'new-password'
  onChange: (value: string) => void
  onToggle: () => void
}) {
  const toggleLabel = `${visible ? 'Hide' : 'Show'}${id === 'auth-confirm-password' ? ' confirmed' : ''} password`
  return (
    <div className="pl-field">
      <label className="pl-lbl" htmlFor={id}>{label}</label>
      <div className="pl-password-control">
        <input
          id={id}
          className="pl-inp"
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="pl-password-toggle"
          aria-label={toggleLabel}
          aria-pressed={visible}
          onClick={onToggle}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

function PasswordRequirements({ password, confirmation }: { password: string; confirmation: string }) {
  const requirements = [
    ...newPasswordRequirements(password),
    { label: 'Passwords match', met: confirmation.length > 0 && password === confirmation },
  ]
  return (
    <ul className="pl-password-requirements" aria-label="Password requirements" aria-live="polite">
      {requirements.map((requirement) => (
        <li
          key={requirement.label}
          data-met={requirement.met}
          aria-label={`${requirement.label}: ${requirement.met ? 'met' : 'not met'}`}
        >
          <span className="pl-password-check" aria-hidden="true">
            {requirement.met ? <Check /> : null}
          </span>
          {requirement.label}
        </li>
      ))}
    </ul>
  )
}

export function AuthPage() {
  const navigate = useNavigate()
  const enterApp = useEnterApp()
  const [params] = useSearchParams()

  const [screen, setScreen] = useState<Screen>('form')
  const [method, setMethod] = useState<Method>('password')
  const [passwordIntent, setPasswordIntent] = useState<PasswordIntent>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [sentPurpose, setSentPurpose] = useState<SentPurpose>('sign-in-link')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(() => (readLinkError() ? MESSAGES.expired : ''))
  const [notice, setNotice] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [user, setUser] = useState<User | null>(null)

  /** Deep-link preservation (§2.3): signing in from a shared link lands on
   *  that link, not the home page. */
  const next = params.get('next') || '/'
  const recoveryMode = params.get('mode') === 'recovery'

  // ── already signed in ────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) return
    let alive = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      if (data.session?.user) {
        setUser(data.session.user)
        setScreen(recoveryMode ? 'recovery' : 'signed-in')
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return
      if (session?.user) {
        markEnteredApp()
        setUser(session.user)
        setScreen(event === 'PASSWORD_RECOVERY' || recoveryMode ? 'recovery' : 'signed-in')
      }
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [recoveryMode])

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
      setSentPurpose('sign-in-link')
      setScreen('sent')
      setCooldown(RESEND_COOLDOWN_S)
    } catch (e) {
      setError(classifyError(e))
    } finally {
      setBusy(false)
    }
  }, [email])

  const resendSignupConfirmation = useCallback(async () => {
    if (!supabase) {
      setError(MESSAGES.notConfigured)
      return
    }
    setBusy(true)
    setError('')
    try {
      const { error: e } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: authRedirectTo },
      })
      if (e) throw e
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
    if (!meetsNewPasswordRule(password)) {
      setError(MESSAGES.weakPassword)
      return
    }
    if (password !== confirmPassword) {
      setError('Those passwords do not match.')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const { data, error: e } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: authRedirectTo },
      })
      if (e) throw e
      if (data.session?.user) {
        markEnteredApp()
        setUser(data.session.user)
        setScreen('signed-in')
        return
      }
      // Supabase deliberately obscures whether this address already exists.
      setSentPurpose('signup-confirmation')
      setScreen('sent')
      setCooldown(RESEND_COOLDOWN_S)
    } catch (e) {
      setError(classifyError(e))
    } finally {
      setBusy(false)
    }
  }, [confirmPassword, email, password])

  const sendPasswordReset = useCallback(async () => {
    if (!supabase) {
      setError(MESSAGES.notConfigured)
      return
    }
    if (!emailValid) {
      setError('Enter the email address you use to sign in.')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      // Keep the outcome indistinguishable whether or not the account exists.
      const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: passwordRecoveryRedirect(),
      })
      if (e) throw e
      setNotice('If that address has an account, we sent a password-reset link. Check your email.')
      setCooldown(RESEND_COOLDOWN_S)
    } catch (e) {
      setError(classifyError(e))
    } finally {
      setBusy(false)
    }
  }, [email, emailValid])

  const updateRecoveryPassword = useCallback(async (nextPassword: string) => {
    if (!supabase) {
      setError(MESSAGES.notConfigured)
      return
    }
    if (!meetsNewPasswordRule(nextPassword)) {
      setError(MESSAGES.weakPassword)
      return
    }
    setBusy(true)
    setError('')
    try {
      const { error: e } = await supabase.auth.updateUser({ password: nextPassword })
      if (e) throw e
      setNotice('Your password has been updated.')
      setScreen('signed-in')
    } catch (e) {
      setError(classifyError(e))
    } finally {
      setBusy(false)
    }
  }, [])

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

  const choosePasswordIntent = useCallback((intent: PasswordIntent) => {
    setPasswordIntent(intent)
    setMethod('password')
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setError('')
    setNotice('')
  }, [])

  // ─────────────────────────────────────────────────────────────────────
  return (
    <PublicShell title="Sign in — premedOS">
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
              purpose={sentPurpose}
              cooldown={cooldown}
              busy={busy}
              error={error}
              onResend={sentPurpose === 'signup-confirmation' ? resendSignupConfirmation : sendLink}
              onChange={() => {
                setScreen('form')
                setError('')
              }}
              onUsePassword={() => {
                setScreen('form')
                setMethod('password')
                setPasswordIntent(sentPurpose === 'signup-confirmation' ? 'create' : 'sign-in')
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
                if (!window.confirm('Sign out of Premed OS? Your account data will stay saved.')) return
                await supabase?.auth.signOut()
                activateGuestWorkspace()
                setUser(null)
                setScreen('form')
              }}
            />
          ) : screen === 'recovery' ? (
            <PasswordRecovery
              busy={busy}
              error={error}
              onSave={updateRecoveryPassword}
            />
          ) : (
            <>
              <div className="pl-hd pl-authhead">
                <div className="pl-auth-titleblock">
                  <span className="pl-auth-eyebrow">Your Premed OS workspace</span>
                  <h1 className="pl-ti">
                    {passwordIntent === 'create' ? 'Create your account' : 'Welcome back'}
                  </h1>
                  <div className="pl-sub pl-auth-subcopy">
                    {passwordIntent === 'create'
                      ? 'Start a new private workspace linked only to this account.'
                      : 'Sign in to reopen the workspace linked to your account.'}
                  </div>
                </div>
              </div>

              <div className="pl-bd" style={{ gap: 13 }}>
                <div className="pl-auth-intent" role="tablist" aria-label="Choose account action" onKeyDown={(event) => {
                  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
                  event.preventDefault()
                  const tabs = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')]
                  const current = tabs.indexOf(document.activeElement as HTMLButtonElement)
                  const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
                  tabs[next]?.click()
                  tabs[next]?.focus()
                }}>
                  <button
                    id="auth-sign-in-tab"
                    type="button"
                    role="tab"
                    aria-selected={passwordIntent === 'sign-in'}
                    aria-controls="auth-method-panel"
                    tabIndex={passwordIntent === 'sign-in' ? 0 : -1}
                    onClick={() => choosePasswordIntent('sign-in')}
                  >
                    Sign in
                    <span>I already have an account</span>
                  </button>
                  <button
                    id="auth-create-tab"
                    type="button"
                    role="tab"
                    aria-selected={passwordIntent === 'create'}
                    aria-controls="auth-method-panel"
                    tabIndex={passwordIntent === 'create' ? 0 : -1}
                    onClick={() => choosePasswordIntent('create')}
                  >
                    Create account
                    <span>I'm new to Premed OS</span>
                  </button>
                </div>

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

                <button
                  type="button"
                  className="pl-sbtn pl-sbtn-full pl-google-btn"
                  disabled={busy}
                  onClick={continueWithGoogle}
                >
                  <GoogleGIcon />
                  {passwordIntent === 'create' ? 'Sign up with Google' : 'Sign in with Google'}
                </button>

                <p className="pl-auth-method-note">
                  {passwordIntent === 'create'
                    ? 'This creates a clean Premed OS workspace for the Google account you choose.'
                    : 'Choose the same Google account you used before to restore its workspace.'}
                </p>

                <div className="pl-orbar">
                  <i />
                  <span>OR USE EMAIL</span>
                  <i />
                </div>

                <div
                  id="auth-method-panel"
                  className="pl-auth-method-panel"
                  role="tabpanel"
                  aria-labelledby={passwordIntent === 'create' ? 'auth-create-tab' : 'auth-sign-in-tab'}
                >
                <div className="pl-field">
                  <label className="pl-lbl" htmlFor="auth-email">
                    Email
                  </label>
                  <input
                    id="auth-email"
                    className="pl-inp"
                    type="email"
                    autoComplete="email"
                    placeholder="Personal or school email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError('')
                    }}
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
                      {passwordIntent === 'create' ? 'Create account with an email link' : 'Send me a sign-in link'}
                    </button>
                    <button
                      type="button"
                      className="pl-lk"
                      onClick={() => {
                        setMethod('password')
                        setPasswordIntent('sign-in')
                        setError('')
                      }}
                    >
                      Use a password instead
                    </button>
                  </>
                ) : (
                  <>
                    <PasswordInput
                      id="auth-password"
                      label="Password"
                      autoComplete={passwordIntent === 'create' ? 'new-password' : 'current-password'}
                      value={password}
                      visible={showPassword}
                      onChange={(value) => {
                        setPassword(value)
                        setError('')
                      }}
                      onToggle={() => setShowPassword((visible) => !visible)}
                    />
                    {passwordIntent === 'create' ? (
                      <>
                        <PasswordInput
                          id="auth-confirm-password"
                          label="Repeat password"
                          autoComplete="new-password"
                          value={confirmPassword}
                          visible={showConfirmPassword}
                          onChange={(value) => {
                            setConfirmPassword(value)
                            setError('')
                          }}
                          onToggle={() => setShowConfirmPassword((visible) => !visible)}
                        />
                        <PasswordRequirements password={password} confirmation={confirmPassword} />
                      </>
                    ) : null}
                    <button
                      type="button"
                      className="pl-sbtn pl-sbtn-p pl-sbtn-full"
                      disabled={busy || !emailValid || password.length === 0 || (passwordIntent === 'create' && (!meetsNewPasswordRule(password) || password !== confirmPassword))}
                      onClick={passwordIntent === 'create' ? createWithPassword : signInWithPassword}
                    >
                      {passwordIntent === 'create' ? 'Create account' : 'Sign in with email'}
                    </button>
                    <button
                      type="button"
                      className="pl-lk"
                      disabled={busy}
                      onClick={() => choosePasswordIntent(passwordIntent === 'create' ? 'sign-in' : 'create')}
                    >
                      {passwordIntent === 'create' ? 'Already have an account? Sign in' : 'New here? Create an account'}
                    </button>
                    {passwordIntent === 'sign-in' ? <button
                      type="button"
                      className="pl-lk"
                      disabled={busy}
                      onClick={sendPasswordReset}
                    >
                      Forgot your password?
                    </button> : null}
                    <button
                      type="button"
                      className="pl-lk"
                      onClick={() => {
                        setMethod('link')
                        setError('')
                      }}
                    >
                      Email me a link instead
                    </button>
                  </>
                )}
                </div>

                <p className="pl-fine">
                  By continuing, you confirm that you are at least 13 and agree to the{' '}
                  <Link className="pl-lk" to="/terms">Terms</Link> and{' '}
                  <Link className="pl-lk" to="/privacy">Privacy Policy</Link>. Google sign-in uses
                  your identity only; Calendar and Drive are requested later, separately, if you want them.
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
  purpose,
  cooldown,
  busy,
  error,
  onResend,
  onChange,
  onUsePassword,
}: {
  email: string
  purpose: SentPurpose
  cooldown: number
  busy: boolean
  error: string
  onResend: () => void
  onChange: () => void
  onUsePassword: () => void
}) {
  const confirmingAccount = purpose === 'signup-confirmation'
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
            {confirmingAccount ? 'We sent an account confirmation link to:' : 'We sent a sign-in link to:'}
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
          <b>{confirmingAccount ? 'Open the link to finish creating your account.' : 'The link works once and expires in 15 minutes.'}</b>{' '}
          If it hasn't arrived in a couple of minutes, check spam.
        </p>

        <button
          type="button"
          className="pl-sbtn pl-sbtn-g pl-sbtn-full"
          disabled={busy || cooldown > 0}
          onClick={onResend}
        >
          {cooldown > 0
            ? `Resend ${confirmingAccount ? 'confirmation' : 'link'} in ${cooldown}s`
            : `Resend ${confirmingAccount ? 'confirmation' : 'link'}`}
        </button>
        <button type="button" className="pl-sbtn pl-sbtn-g pl-sbtn-full" onClick={onUsePassword}>
          {confirmingAccount ? 'Back to account creation' : 'Use a password instead'}
        </button>

        <p className="pl-fine">
          Nothing you've already tracked is affected. <b>Your data is still on this device.</b>
        </p>
      </div>
    </>
  )
}

/* ── Password recovery ─────────────────────────────────────────────────── */
function PasswordRecovery({
  busy,
  error,
  onSave,
}: {
  busy: boolean
  error: string
  onSave: (password: string) => void
}) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const mismatch = confirmation.length > 0 && password !== confirmation

  return (
    <>
      <div className="pl-hd">
        <div>
          <h1 className="pl-ti">Choose a new password</h1>
          <div className="pl-sub" style={{ marginTop: 4, fontWeight: 600 }}>
            This link is single-use. Use 8+ characters with uppercase, lowercase, a number, and a symbol.
          </div>
        </div>
      </div>
      <div className="pl-bd" style={{ gap: 13 }}>
        {error ? <p className="pl-alert pl-alert-bad" role="alert">{error}</p> : null}
        <div className="pl-field">
          <label className="pl-lbl" htmlFor="recovery-password">New password</label>
          <input
            id="recovery-password"
            className="pl-inp"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className="pl-field">
          <label className="pl-lbl" htmlFor="recovery-confirmation">Confirm new password</label>
          <input
            id="recovery-confirmation"
            className="pl-inp"
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </div>
        {mismatch ? <p className="pl-alert pl-alert-bad" role="alert">Those passwords do not match.</p> : null}
        <button
          type="button"
          className="pl-sbtn pl-sbtn-p pl-sbtn-full"
          disabled={busy || !meetsNewPasswordRule(password) || mismatch}
          onClick={() => onSave(password)}
        >
          Save new password
        </button>
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
