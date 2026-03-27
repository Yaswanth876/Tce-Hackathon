// src/pages/AdminLogin.jsx
// ---------------------------------------------------------------
// Municipality Control Panel — /admin
// Supports Sign In AND self-registration (role = "municipality").
// Google sign-in: creates a municipality doc if new, verifies role
// if returning.
// ---------------------------------------------------------------

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  auth,
  db,
  googleProvider,
} from '../localDb'

import { useAuth } from '../context/AuthContext'

const ADMIN_ROLES = ['admin', 'municipality']

// ── Icons ────────────────────────────────────────────────────
function LockIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      aria-hidden="true" className="text-white">
      <rect x="3" y="11" width="18" height="11" rx="2"
        stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found':         'No account found for this email address.',
    'auth/wrong-password':         'Incorrect password. Please try again.',
    'auth/invalid-credential':     'Invalid credentials. Please verify and retry.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/email-already-in-use':   'An account with this email already exists. Sign in instead.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/too-many-requests':      'Too many attempts. Please wait and try again.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/user-disabled':          'This account has been disabled.',
    'auth/account-exists-with-different-credential':
      'An account already exists with this email via a different sign-in method.',
    'not-authorized': 'Access restricted to Municipal Officers only.',
  }
  return map[code] ?? code ?? 'An unexpected error occurred. Please try again.'
}

// ── Component ─────────────────────────────────────────────────
export default function AdminLogin() {
  const navigate   = useNavigate()
  const [params]   = useSearchParams()
  const { user, userDoc, loading: authLoading, refreshUserDoc } = useAuth()

  const [tab,      setTab]      = useState('signin')   // 'signin' | 'register'
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(
    params.get('unauthorized') === '1'
      ? 'Access restricted to Municipal Officers only.'
      : ''
  )
  const [loading,  setLoading]  = useState(false)
  const [gLoading, setGLoading] = useState(false)
  const [showPwd,  setShowPwd]  = useState(false)

  // Already authenticated → skip
  useEffect(() => {
    if (!authLoading && user && userDoc) {
      if (ADMIN_ROLES.includes(userDoc.role)) {
        navigate('/admin/dashboard', { replace: true })
      }
    }
  }, [authLoading, user, userDoc, navigate])

  function switchTab(t) {
    setTab(t)
    setError('')
    setName('')
    setEmail('')
    setPassword('')
  }

  // ── Google (sign-in or register) ─────────────────────────
  async function handleGoogle() {
    setError('')
    setGLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const ref    = doc(db, 'users', result.user.uid)
      const snap   = await getDoc(ref)

      if (!snap.exists()) {
        // New user via Google → create municipality account
        await setDoc(ref, {
          uid:        result.user.uid,
          name:       result.user.displayName ?? '',
          email:      result.user.email ?? '',
          role:       'municipality',
          created_at: serverTimestamp(),
        })
        await refreshUserDoc(result.user.uid)
      } else if (!ADMIN_ROLES.includes(snap.data().role)) {
        // Existing user but wrong role
        await auth.signOut()
        throw new Error('not-authorized')
      }

      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      if (
        err.code !== 'auth/popup-closed-by-user' &&
        err.code !== 'auth/cancelled-popup-request'
      ) {
        setError(friendlyError(err.code ?? err.message))
      }
    } finally {
      setGLoading(false)
    }
  }

  // ── Email Sign-In ─────────────────────────────────────────
  async function handleSignIn(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
      const snap = await getDoc(doc(db, 'users', cred.user.uid))

      if (!snap.exists() || !ADMIN_ROLES.includes(snap.data().role)) {
        await auth.signOut()
        throw new Error('not-authorized')
      }

      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(friendlyError(err.code ?? err.message))
    } finally {
      setLoading(false)
    }
  }

  // ── Email Register ────────────────────────────────────────
  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid:        cred.user.uid,
        name:       name.trim(),
        email:      email.toLowerCase().trim(),
        role:       'municipality',
        created_at: serverTimestamp(),
      })
      await refreshUserDoc(cred.user.uid)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(friendlyError(err.code ?? err.message))
    } finally {
      setLoading(false)
    }
  }

  const inputBase = `w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-800
    focus:outline-none focus:ring-2 focus:ring-[#104080] focus:border-transparent
    placeholder:text-slate-400 transition bg-white border-slate-300`

  const labelCls = 'block text-xs font-semibold text-[#0a2240] mb-1.5 uppercase tracking-wider'

  const busy = loading || gLoading

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(160deg, #04111f 0%, #0a2240 50%, #0d3a6e 100%)' }}
    >
      {/* Decorative orbs */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #1557a0, transparent)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #FF9933, transparent)' }} />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Tricolor stripe */}
        <div className="flex h-1.5 rounded-t-xl overflow-hidden">
          <div className="flex-1" style={{ background: '#FF9933' }} />
          <div className="flex-1 bg-white" />
          <div className="flex-1" style={{ background: '#138808' }} />
        </div>

        {/* Card */}
        <div className="bg-white rounded-b-xl shadow-2xl px-8 py-10">

          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg mb-4"
              style={{ background: 'linear-gradient(135deg, #0a2240, #1557a0)' }}>
              <LockIcon />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0a2240] tracking-tight text-center leading-snug">
              Municipality Control Panel
            </h1>
            <p className="mt-1 text-xs text-slate-500 text-center font-medium tracking-wide uppercase">
              Aqro  · Municipal Officer Portal
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-lg overflow-hidden border border-slate-200 mb-6">
            {[['signin', 'Sign In'], ['register', 'Register']].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => switchTab(val)}
                className={`flex-1 py-2 text-sm font-semibold transition-colors
                  ${tab === val
                    ? 'bg-[#0a2240] text-white'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div role="alert"
              className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-slate-300
                       bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold py-2.5 px-4
                       shadow-sm transition-colors disabled:opacity-60
                       focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#104080]"
          >
            {gLoading ? <Spinner /> : <GoogleIcon />}
            {gLoading
              ? (tab === 'register' ? 'Creating account…' : 'Verifying…')
              : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">
              {tab === 'register' ? 'or register with email' : 'or sign in with email'}
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* ── SIGN IN form ── */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} noValidate className="space-y-5">
              <div>
                <label htmlFor="mc-email" className={labelCls}>Official Email</label>
                <input id="mc-email" type="email" autoComplete="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="officer@mclean.gov.in"
                  className={inputBase} disabled={busy} />
              </div>

              <div>
                <label htmlFor="mc-password" className={labelCls}>Password</label>
                <div className="relative">
                  <input id="mc-password" type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password" required
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputBase} pr-10`} disabled={busy} />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPwd ? 'Hide password' : 'Show password'}>
                    {showPwd ? (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={busy || !email || !password}
                className="w-full rounded-lg py-3 text-sm font-bold text-white shadow-md
                           hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#104080]
                           transition-all duration-150 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(90deg, #0a2240, #104080)' }}>
                {loading ? <><Spinner />Verifying…</> : <><LockIcon size={18} />Sign In</>}
              </button>
            </form>
          )}

          {/* ── REGISTER form ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} noValidate className="space-y-4">
              <div>
                <label htmlFor="mc-name" className={labelCls}>Full Name</label>
                <input id="mc-name" type="text" autoComplete="name" required
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Officer / Department Name"
                  className={inputBase} disabled={busy} />
              </div>

              <div>
                <label htmlFor="mc-reg-email" className={labelCls}>Official Email</label>
                <input id="mc-reg-email" type="email" autoComplete="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="officer@mclean.gov.in"
                  className={inputBase} disabled={busy} />
              </div>

              <div>
                <label htmlFor="mc-reg-password" className={labelCls}>Password</label>
                <div className="relative">
                  <input id="mc-reg-password" type={showPwd ? 'text' : 'password'}
                    autoComplete="new-password" required
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={`${inputBase} pr-10`} disabled={busy} />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPwd ? 'Hide password' : 'Show password'}>
                    {showPwd ? (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Role info notice */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-[#104080]">
                🏛️ New accounts are registered as <strong>Municipality Officers</strong> with access to the admin dashboard.
              </div>

              <button type="submit" disabled={busy || !name || !email || !password}
                className="w-full rounded-lg py-3 text-sm font-bold text-white shadow-md
                           hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#104080]
                           transition-all duration-150 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(90deg, #0a2240, #104080)' }}>
                {loading ? <><Spinner />Creating account…</> : 'Create Municipality Account'}
              </button>
            </form>
          )}

          {/* Bottom link */}
          <p className="mt-6 text-center text-xs text-slate-400">
            Not a municipal officer?{' '}
            <a href="/login"
              className="font-semibold text-[#104080] hover:underline hover:text-[#0a2240] transition-colors">
              Citizen login →
            </a>
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-blue-200 opacity-50">
          © {new Date().getFullYear()} Ministry of Urban Development · Aqro  Portal
        </p>
      </div>
    </div>
  )
}
