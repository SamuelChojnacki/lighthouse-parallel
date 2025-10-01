import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Metrics } from '@/pages/Metrics'
import { Admin } from '@/pages/Admin'
import { LoginPage } from '@/pages/Login'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user has valid token on mount
  useEffect(() => {
    const token = sessionStorage.getItem('auth_token')
    setIsAuthenticated(!!token)
    setIsLoading(false)
  }, [])

  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true)
  }, [])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  // Show dashboard if authenticated
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/metrics" element={<Metrics />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
