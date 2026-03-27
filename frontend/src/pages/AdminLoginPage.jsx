// src/pages/AdminLoginPage.jsx
// ---------------------------------------------------------------
// Admin-only login — /admin-mc
// Email/Password ONLY (no Google).
// Verifies role === 'admin' from Firestore before granting access.
// Intentionally has no register link — admins are pre-created.
// ---------------------------------------------------------------

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, doc, getDoc, auth, db } from '../localDb'
import { HiLockClosed, HiExclamationTriangle } from 'react-icons/hi2'

function ShieldIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6l-9-4z"
        fill="#104080" opacity="0.15"
      />
      <path
        d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6l-9-4z"
        stroke="#104080" strokeWidth="1.5" strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="#104080" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const snap = await getDoc(doc(db, 'users', cred.user.uid))

      if (!snap.exists()) {
        await auth.signOut()
        throw new Error('no-profile')
      }

      if (snap.data().role !== 'admin') {
        await auth.signOut()
        throw new Error('not-admin')
      }

      navigate('/admin', { replace: true })
    } catch (err) {
      setError(friendlyError(err.code ?? err.message))
    } finally {
      setLoading(false)
    }
  }

  const inputCls = `w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm
    focus:outline-none focus:ring-2 focus:ring-[#0a2240] focus:border-transparent
    placeholder:text-slate-400 transition`

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: 'linear-gradient(160deg, #04111f 0%, #0a2240 50%, #0d3060 100%)' }}
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
            <div className="w-14 h-14 rounded-full bg-[#0a2240]/8 border border-[#104080]/30 flex items-center justify-center">
              <ShieldIcon />
            </div>
            <h1 className="mt-3 text-2xl font-bold text-[#0a2240] tracking-tight">
              Admin Portal
            </h1>
            <p className="mt-1 text-xs text-slate-500 text-center">
              Aqro  — Authorised Personnel Only
            </p>
            {/* Restricted access notice */}
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-xs text-amber-800 text-center flex items-center justify-center gap-2">
              <HiLockClosed className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              This portal is restricted to Aqro  administrators
            </div>
          </div>

          {/* Error */}
          {error && (
            <div role="alert"
              className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <HiExclamationTriangle className="mt-0.5 flex-shrink-0 w-4 h-4" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-semibold text-[#0a2240] mb-1.5 uppercase tracking-wide">
                Admin Email
              </label>
              <input
                id="admin-email" type="email" autoComplete="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@mclean.gov.in"
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-[#0a2240] mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                id="admin-password" type="password" autoComplete="current-password" required
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-2.5 text-sm font-semibold text-white
                         bg-[#0a2240] hover:bg-[#04111f] disabled:opacity-60
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0a2240]
                         transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <><Spinner />Verifying…</> : 'Access Admin Dashboard'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Citizen?{' '}
            <a href="/login" className="font-semibold text-[#104080] hover:underline">
              Go to Citizen Login
            </a>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-blue-300 opacity-60">
          © {new Date().getFullYear()} Ministry of Urban Development · Restricted Access
        </p>
      </div>
    </div>
  )
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found':         'No admin account found for this email.',
    'auth/wrong-password':         'Incorrect password.',
    'auth/invalid-credential':     'Invalid credentials.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/too-many-requests':      'Too many attempts. Please wait and try again.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'no-profile':  'Admin profile not found. Contact your system administrator.',
    'not-admin':   'Access denied. This portal is for admins only.',
  }
  return map[code] ?? code ?? 'An unexpected error occurred.'
}
