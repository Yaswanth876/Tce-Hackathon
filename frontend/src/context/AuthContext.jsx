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

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [userDoc, setUserDoc] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Hydrate from localStorage on mount
    try {
      const stored = localStorage.getItem('_auth_user')
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
      localStorage.setItem('_auth_user', JSON.stringify(userData))
      setUser(userData)
      setUserDoc(userData)
    } else {
      localStorage.removeItem('_auth_user')
      setUser(null)
      setUserDoc(null)
    }
  }

  // Call this after creating/updating a user doc
  async function refreshUserDoc(uid) {
    try {
      // In future: fetch user profile from MongoDB API
      // const profile = await getUserProfile(uid)
      // setStoredUser(profile)
      console.info('[AuthContext] refreshUserDoc: TODO - implement with Express API')
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
    <AuthContext.Provider value={{ user, userDoc, loading, refreshUserDoc, setUser: setStoredUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
