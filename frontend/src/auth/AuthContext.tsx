import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Api } from '../api/types'
import type { Role, Session } from '../types/api'

interface AuthValue {
  session: Session | null
  loading: boolean
  login(email: string, password: string): Promise<Session>
  logout(): Promise<void>
  /** True right after a logout, so the login page can confirm it. */
  justLoggedOut: boolean
  api: Api
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ api, children }: { api: Api; children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [justLoggedOut, setJustLoggedOut] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .restoreSession()
      .then((s) => {
        if (!cancelled) setSession(s)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [api])

  const login = useCallback(
    async (email: string, password: string) => {
      const s = await api.login(email, password)
      setJustLoggedOut(false)
      setSession(s)
      return s
    },
    [api],
  )

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } finally {
      setJustLoggedOut(true)
      setSession(null)
    }
  }, [api])

  const value = useMemo(() => ({ session, loading, login, logout, justLoggedOut, api }), [session, loading, login, logout, justLoggedOut, api])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/* -------- permission helpers shared by routes and navigation -------- */

export const canChat = (r: Role) => r.classifications.length > 0
export const canAdmin = (r: Role) => r.canManageDocuments || r.canManageRoles
export const canAudit = (r: Role) => r.canViewAuditLog

/** Where a user lands after login. */
export function homePathFor(role: Role): string {
  if (canAdmin(role)) return '/admin'
  if (canAudit(role)) return '/audit'
  return '/chat'
}
