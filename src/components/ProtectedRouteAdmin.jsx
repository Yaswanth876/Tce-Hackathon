// src/components/ProtectedRouteAdmin.jsx
// ---------------------------------------------------------------
// Guards admin routes — permits ONLY users with role "admin" or
// "municipality". All other authenticated users are bounced back
// to /admin (login). Unauthenticated users → /admin.
// Shows a full-screen spinner while auth state resolves.
// ---------------------------------------------------------------

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ADMIN_ROLES = ['admin', 'municipality']

function FullSpinner() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #04111f 0%, #0a2240 55%, #104080 100%)' }}
    >
      <div className="flex flex-col items-center gap-4">
        <svg
          className="animate-spin h-10 w-10 text-white"
          viewBox="0 0 24 24"
          fill="none"
          aria-label="Verifying access"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-white text-sm font-medium opacity-75">Verifying access…</span>
      </div>
    </div>
  )
}

export default function ProtectedRouteAdmin({ children }) {
  const { user, userDoc, loading } = useAuth()

  if (loading) return <FullSpinner />

  // Not authenticated → admin login
  if (!user) return <Navigate to="/admin" replace />

  // Firestore doc not yet loaded → keep spinning
  if (!userDoc) return <FullSpinner />

  // Wrong role → back to admin login with an "unauthorized" hint
  if (!ADMIN_ROLES.includes(userDoc.role)) {
    return <Navigate to="/admin?unauthorized=1" replace />
  }

  return children
}
