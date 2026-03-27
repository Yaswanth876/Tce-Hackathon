// src/components/ProtectedRoute.jsx
// ---------------------------------------------------------------
// Guards routes by auth state and role.
//   <ProtectedRoute role="citizen"> — only citizens pass through
//   <ProtectedRoute role="admin">   — only admins pass through
//   <ProtectedRoute>                — any authenticated user
// While loading shows a full-screen spinner.
// Unauthenticated users → /login
// Wrong-role users      → their correct dashboard
// ---------------------------------------------------------------

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function FullSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0a2240 0%, #104080 55%, #1557a0 100%)' }}>
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" aria-label="Loading">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-white text-sm font-medium opacity-75">Verifying access…</span>
      </div>
    </div>
  )
}

export default function ProtectedRoute({ children, role }) {
  const { user, userDoc, loading } = useAuth()

  if (loading) return <FullSpinner />

  // Unauthenticated — send to the correct login page for the requested role
  if (!user) {
    return <Navigate to={role === 'admin' ? '/admin' : '/login'} replace />
  }

  // userDoc may still be loading/null if Firestore was slow — treat as loading
  if (!userDoc) return <FullSpinner />

  if (role && userDoc.role !== role) {
    // Send to the correct dashboard for their actual role
    const adminRoles = ['admin', 'municipality']
    return <Navigate to={adminRoles.includes(userDoc.role) ? '/admin/dashboard' : '/citizen'} replace />
  }

  return children
}
