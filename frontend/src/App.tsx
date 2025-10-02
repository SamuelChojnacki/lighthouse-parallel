import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Metrics } from '@/pages/Metrics'
import { Admin } from '@/pages/Admin'
import { LoginPage } from '@/pages/Login'
import { ProtectedRoute } from '@/components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes with Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/metrics"
          element={
            <ProtectedRoute>
              <Layout>
                <Metrics />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Layout>
                <Admin />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
