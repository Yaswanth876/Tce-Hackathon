// src/pages/RegisterPage.jsx
// ---------------------------------------------------------------
// Creates a Firebase Auth user and a matching Firestore document
// in the "users" collection, then redirects based on selected role.
// ---------------------------------------------------------------

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  auth,
  db,
  googleProvider,
} from '../localDb'
// MIGRATED: Use MongoDB API
// import { auth, db, googleProvider } from '../firebase'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import { HiExclamationTriangle, HiUserCircle } from 'react-icons/hi2'

// ── Ensure Firestore citizen doc exists ──────────────────────
async function ensureCitizenDoc(firebaseUser) {
  const ref = doc(db, 'users', firebaseUser.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      uid:                firebaseUser.uid,
      name:               firebaseUser.displayName ?? '',
      email:              firebaseUser.email ?? '',
      role:               'citizen',
      points:             0,
      cleared_complaints: 0,
      created_at:         serverTimestamp(),
    })
  }
}

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

export default function RegisterPage() {
  const navigate = useNavigate()
  const { refreshUserDoc } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [gLoading, setGLoading] = useState(false)

  // ── Google Sign-Up via popup ──────────────────────────────
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

  function set(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password)
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid:                cred.user.uid,
        name:               form.name.trim(),
        email:              form.email.toLowerCase().trim(),
        role:               'citizen',
        points:             0,
        cleared_complaints: 0,
        created_at:         serverTimestamp(),
      })
      // Sync userDoc into AuthContext immediately so ProtectedRoute doesn't spin forever
      await refreshUserDoc(cred.user.uid)
      navigate('/citizen', { replace: true })
    } catch (err) {
      setError(friendlyError(err.code ?? err.message))
    } finally {
      setLoading(false)
    }
  }

  const field = 'w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#104080] focus:border-transparent placeholder:text-slate-400 transition'
  const label = 'block text-xs font-semibold text-[#0a2240] mb-1.5 uppercase tracking-wide'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: 'linear-gradient(135deg, #0a2240 0%, #104080 55%, #1557a0 100%)' }}>

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
            <ChakraMark />
            <h1 className="mt-3 text-2xl font-bold text-[#0a2240] tracking-tight">
              Create Citizen Account
            </h1>
            <p className="mt-1 text-xs text-slate-500 text-center">
              Aqro  Portal — Citizen Registration
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

          {/* Google Sign-Up */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={gLoading || loading}
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-slate-300
                       bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold py-2.5 px-4
                       shadow-sm transition-colors disabled:opacity-60 focus:outline-none
                       focus:ring-2 focus:ring-offset-1 focus:ring-[#104080]"
          >
            {gLoading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
            )}
            {gLoading ? 'Signing up…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or register with email</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Full Name */}
            <div>
              <label htmlFor="name" className={label}>Full Name</label>
              <input id="name" type="text" autoComplete="name" required
                value={form.name} onChange={set('name')}
                placeholder="Ravi Kumar"
                className={field}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={label}>Email Address</label>
              <input id="email" type="email" autoComplete="email" required
                value={form.email} onChange={set('email')}
                placeholder="you@example.gov.in"
                className={field}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className={label}>Password</label>
              <input id="password" type="password" autoComplete="new-password" required
                value={form.password} onChange={set('password')}
                placeholder="At least 6 characters"
                className={field}
              />
            </div>

            {/* Citizen notice */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-[#104080] flex items-center gap-2">
              <HiUserCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              Citizens can file complaints and track their status in real-time.
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Register
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#104080] hover:underline">
              Sign in
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
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/weak-password':        'Password must be at least 6 characters.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  }
  return map[code] ?? code ?? 'An unexpected error occurred.'
}
