// src/pages/LoginPage.jsx
// ---------------------------------------------------------------
// Citizen login — /login
// Supports Google Sign-In and Email/Password.
// Always routes to /citizen on success.
// New Google users get an auto-created Firestore "users" doc.
// ---------------------------------------------------------------

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  auth,
  db,
  googleProvider,
} from '../localDb'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import { HiExclamationTriangle } from 'react-icons/hi2'

// ── Ensure Firestore citizen doc exists (Google new users) ──
async function ensureCitizenDoc(firebaseUser) {
  const ref = doc(db, 'users', firebaseUser.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      uid:        firebaseUser.uid,
      name:       firebaseUser.displayName ?? '',
      email:      firebaseUser.email ?? '',
      role:       'citizen',
      created_at: serverTimestamp(),
    })
  }
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

// ── Ashoka Chakra mini mark ───────────────────────────────────
function ChakraMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="20" stroke="#104080" strokeWidth="2" fill="none" />
      <circle cx="24" cy="24" r="3" fill="#104080" />
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 15 * Math.PI) / 180
        return (
          <line key={i}
            x1={24 + 4 * Math.cos(angle)} y1={24 + 4 * Math.sin(angle)}
            x2={24 + 18 * Math.cos(angle)} y2={24 + 18 * Math.sin(angle)}
            stroke="#104080" strokeWidth="1.2" strokeLinecap="round"
          />
        )
      })}
    </svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, userDoc, loading: authLoading, refreshUserDoc } = useAuth()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [gLoading, setGLoading] = useState(false)

  // ── Safety net: already logged in → redirect immediately ────
  useEffect(() => {
    if (!authLoading && user && userDoc) {
      navigate(userDoc.role === 'admin' ? '/admin' : '/citizen', { replace: true })
    }
  }, [authLoading, user, userDoc, navigate])

  // ── Google Sign-In via popup (synchronous result, no page reload) ──
  async function handleGoogle() {
    setError('')
    setGLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      await ensureCitizenDoc(result.user)
      await refreshUserDoc(result.user.uid)
      navigate('/citizen', { replace: true })
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(friendlyError(err.code ?? err.message))
      }
    } finally {
      setGLoading(false)
    }
  }

  // ── Email / Password ──────────────────────────────────────
  async function handleEmailSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const snap = await getDoc(doc(db, 'users', cred.user.uid))
      if (!snap.exists()) throw new Error('profile-not-found')
      if (snap.data().role !== 'citizen') {
        await auth.signOut()
        throw new Error('This portal is for citizens only. Use the Admin portal.')
      }
      navigate('/citizen', { replace: true })
    } catch (err) {
      setError(friendlyError(err.code ?? err.message))
    } finally {
      setLoading(false)
    }
  }

  const inputCls = `w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm
    focus:outline-none focus:ring-2 focus:ring-[#104080] focus:border-transparent
    placeholder:text-slate-400 transition`

  return (
    <div
      className="flex-1 flex items-center justify-center px-4 py-16"
      style={{ background: 'linear-gradient(135deg, #0a2240 0%, #104080 55%, #1557a0 100%)' }}
    >
      <div className="w-full max-w-md">
        {/* Tricolor stripe */}
        <div className="flex h-1.5 rounded-t-xl overflow-hidden">
          <div className="flex-1" style={{ background: '#FF9933' }} />
          <div className="flex-1 bg-white" />
          <div className="flex-1" style={{ background: '#138808' }} />
        </div>

        {/* Card */}
        <div className="bg-white rounded-b-xl shadow-2xl px-8 py-10">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <Link to="/" aria-label="Go to home page">
              <ChakraMark />
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-[#0a2240] tracking-tight">
              Citizen Login
            </h1>
            <p className="mt-1 text-xs text-slate-500 text-center">
              Aqro  — Municipal Cleanliness Portal · Government of Tamil Nadu
            </p>

          </div>

          {/* Error */}
          {error && (
            <div role="alert"
              className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <HiExclamationTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={gLoading || loading}
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-slate-300
                       bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold py-2.5 px-4
                       shadow-sm transition-colors disabled:opacity-60 focus:outline-none
                       focus:ring-2 focus:ring-offset-1 focus:ring-[#104080]"
          >
            {gLoading ? <Spinner /> : (
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
            )}
            {gLoading ? 'Signing in…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Email / Password form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#0a2240] mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <input
                id="email" type="email" autoComplete="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[#0a2240] mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                id="password" type="password" autoComplete="current-password" required
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Sign In
            </Button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-sm text-slate-500">
            New here?{' '}
            <Link to="/register" className="font-semibold text-[#104080] hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-blue-200 opacity-70">
          © {new Date().getFullYear()} Ministry of Urban Development · All rights reserved
        </p>
      </div>
    </div>
  )
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found':         'No account found for this email.',
    'auth/wrong-password':         'Incorrect password. Please try again.',
    'auth/invalid-credential':     'Invalid email or password.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/too-many-requests':      'Too many attempts. Please wait and try again.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/account-exists-with-different-credential':
      'An account already exists with this email using a different sign-in method.',
    'profile-not-found': 'Account setup incomplete. Please register again.',
  }
  return map[code] ?? code ?? 'An unexpected error occurred.'
}
