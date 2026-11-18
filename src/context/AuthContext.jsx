import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!supabaseConfigured) {
      setSession(null)
      return undefined
    }
    let mounted = true

    const apply = async (sess) => {
      if (!sess?.user) {
        if (mounted) {
          setSession(null)
          setIsAdmin(false)
        }
        return
      }
      const { data } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', sess.user.id)
        .maybeSingle()
      if (!mounted) return
      if (data) {
        setSession(sess)
        setIsAdmin(true)
      } else {
        setSession(null)
        setIsAdmin(false)
        await supabase.auth.signOut()
      }
    }

    supabase.auth.getSession().then(({ data }) => apply(data.session))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sess) => apply(sess))

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) return { ok: false, message: 'Incorrect email or password.' }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!data) {
      await supabase.auth.signOut()
      return { ok: false, message: 'This account is not an administrator.' }
    }
    return { ok: true }
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(session && isAdmin),
      loading: session === undefined,
      user: session?.user || null,
      login,
      logout,
    }),
    [session, isAdmin, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
