import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const location = useLocation()

  useEffect(() => {
    const token = sessionStorage.getItem('auth_token')
    setIsAuthenticated(!!token)
  }, [])

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  // Not authenticated - redirect to login with return location
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Authenticated - render children
  return <>{children}</>
}