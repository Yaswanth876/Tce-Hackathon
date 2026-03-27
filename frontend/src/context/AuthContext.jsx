// src/context/AuthContext.jsx
// ---------------------------------------------------------------
// Global auth state provider (MongoDB/Express version).
// Wraps the app and exposes { user, userDoc, loading }.
//   user    — User object from localStorage or null
//   userDoc — User profile data or null
//   loading — false once hydration is complete
//
// NOTE: Authorization is currently mock-based (localStorage).
//       For production, integrate JWT or session-based auth in Express backend.
// ---------------------------------------------------------------

import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)
const AUTH_KEY = 'aqro_auth_user'
const USERS_KEY = 'aqro_localdb_users'

function nowIso() {
  return new Date().toISOString()
}

function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function ensureDemoUser(role) {
  const users = readUsers()
  const wantAdmin = role === 'municipality' || role === 'admin'
  const targetEmail = wantAdmin ? 'officer@gmail.com' : 'user@gmail.com'
  const targetRole = wantAdmin ? 'municipality' : 'citizen'

  let user = users.find((u) => String(u.email || '').toLowerCase() === targetEmail)
  if (!user) {
    const uid = wantAdmin ? 'uid_municipality_001' : 'uid_citizen_001'
    user = {
      id: uid,
      uid,
      email: targetEmail,
      name: wantAdmin ? 'Municipality Officer' : 'Test Citizen User',
      role: targetRole,
      created_at: nowIso(),
      updated_at: nowIso(),
      points: 0,
      cleared_complaints: 0,
      tokens: 0,
      total_complaints: 0,
    }
    users.push(user)
    writeUsers(users)
  } else if (user.role !== targetRole) {
    user.role = targetRole
    user.updated_at = nowIso()
    writeUsers(users)
  }

  return user
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [userDoc, setUserDoc] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Hydrate from localStorage on mount
    try {
      const stored = localStorage.getItem(AUTH_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setUser(parsed)
        setUserDoc(parsed)
      }
    } catch (err) {
      console.warn('[AuthContext] Failed to hydrate user:', err)
    }
    setLoading(false)
  }, [])

  // Update localStorage and state when user changes
  function setStoredUser(userData) {
    if (userData) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(userData))
      setUser(userData)
      setUserDoc(userData)
    } else {
      localStorage.removeItem(AUTH_KEY)
      setUser(null)
      setUserDoc(null)
    }
  }

  function autoSignInForRole(role) {
    const demoUser = ensureDemoUser(role)
    setStoredUser(demoUser)
    return demoUser
  }

  // Call this after creating/updating a user doc
  async function refreshUserDoc(uid) {
    try {
      // Get the user from localStorage (it should already be there from login)
      const stored = localStorage.getItem(AUTH_KEY)
      if (stored) {
        const user = JSON.parse(stored)
        // Verify the uid matches
        if (user.uid === uid || user.id === uid) {
          setUser(user)
          setUserDoc(user)
        }
      }
    } catch (err) {
      console.error('[AuthContext] refreshUserDoc failed:', err)
      setUserDoc(null)
    }
  }

  // Helper to logout
  function logout() {
    setStoredUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, userDoc, loading, refreshUserDoc, setUser: setStoredUser, autoSignInForRole, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
