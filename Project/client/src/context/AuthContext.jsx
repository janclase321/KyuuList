import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient.js'

const DEFAULT_AVATAR_URL = 'https://api.dicebear.com/9.x/shapes/svg?seed=default'

const AuthContext = createContext(undefined)

/**
 * AuthProvider
 * Wrap your app in this once (e.g. in main.jsx, inside ThemeProvider).
 * Exposes: { session, user, profile, loading, refreshProfile, signOut }
 *
 *  - session/user come from Supabase Auth (email, id, etc)
 *  - profile comes from your `users` table (username, handle, bio, avatar)
 *  - profile is null while logged out, or briefly while loading after login
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, handle, bio, avatar')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Failed to load profile:', error.message)
      setProfile(null)
      return
    }
    setProfile(data)
  }

  useEffect(() => {
    let cancelled = false

    // Get current session on first load (e.g. page refresh)
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (cancelled) return
      setSession(initialSession)
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id).finally(() => {
          if (!cancelled) setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    // Listen for login/logout/token refresh events anywhere in the app
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        fetchProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  async function refreshProfile() {
    if (session?.user) await fetchProfile(session.user.id)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    refreshProfile,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

export { DEFAULT_AVATAR_URL }