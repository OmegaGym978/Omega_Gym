import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  roles?: ('admin' | 'trainer' | 'member')[]
}

export function ProtectedRoute({ children, roles }: Props) {
  const { user, loading, initialized } = useAuthStore()
  const location = useLocation()

  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-bg text-text-3 text-sm">
        Cargando...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
