import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { Loader } from './Loader'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  requireWallet?: boolean
}

export const ProtectedRoute = ({ children, requireWallet = true }: ProtectedRouteProps) => {
  const { isConnected, isConnecting } = useAccount()
  const location = useLocation()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  // Wait for initial authentication check to complete
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasCheckedAuth(true)
    }, 100) // Small delay to ensure wagmi has initialized

    return () => clearTimeout(timer)
  }, [])

  // Show loader while checking connection status or during initial auth check
  if (isConnecting || !hasCheckedAuth) {
    return <Loader />
  }

  // If wallet is required but not connected, redirect to login
  if (requireWallet && !isConnected) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If wallet is connected and user is on login page, redirect to dashboard
  if (isConnected && location.pathname === '/login') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
