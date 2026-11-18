import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { PREFIX, loadState, saveState, clearState } from '../utils/storage'
import { useData } from './DataContext'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { settings } = useData()
  const [session, setSession] = useState(() => loadState('session', null))

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === null || e.key === `${PREFIX}session`) setSession(loadState('session', null))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = useCallback(
    (username, password) => {
      const ok =
        username.trim().toLowerCase() === settings.adminUsername.toLowerCase() &&
        password === settings.adminPassword
      if (ok) {
        const next = { username: settings.adminUsername, loginAt: Date.now() }
        saveState('session', next)
        setSession(next)
      }
      return ok
    },
    [settings.adminUsername, settings.adminPassword],
  )

  const logout = useCallback(() => {
    clearState('session')
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({ isAuthenticated: Boolean(session), user: session, login, logout }),
    [session, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
