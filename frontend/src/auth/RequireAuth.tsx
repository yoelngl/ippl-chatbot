import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Role } from '../types/api'
import { useAuth } from './AuthContext'
import { ForbiddenPage } from '../pages/ForbiddenPage'
import { FullPageSpinner } from '../components/ui/Spinner'

interface Props {
  children: ReactNode
  /** Extra permission check on top of being logged in. */
  allow?: (role: Role) => boolean
}

export function RequireAuth({ children, allow }: Props) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageSpinner />
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (allow && !allow(session.role)) return <ForbiddenPage />
  return <>{children}</>
}
