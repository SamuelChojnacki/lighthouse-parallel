import { useState, useCallback, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { AUTH_ERROR_MESSAGES } from '@/constants/error-messages'

/**
 * Login page component
 * Displays password authentication form
 * @param onLoginSuccess - Callback when login succeeds
 */
interface LoginPageProps {
  onLoginSuccess: () => void
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: AUTH_ERROR_MESSAGES.INVALID_PASSWORD
        }))
        throw new Error(errorData.message || AUTH_ERROR_MESSAGES.INVALID_PASSWORD)
      }

      const data = await response.json()
      const token = data.access_token

      if (!token) {
        throw new Error(AUTH_ERROR_MESSAGES.NO_TOKEN_RECEIVED)
      }

      // Store token in sessionStorage (expires on browser close)
      sessionStorage.setItem('auth_token', token)

      // Notify parent component
      onLoginSuccess()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : AUTH_ERROR_MESSAGES.LOGIN_FAILED
      setError(errorMessage)
      setPassword('') // Clear password on error
    } finally {
      setLoading(false)
    }
  }, [password, onLoginSuccess])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Lighthouse Dashboard
          </CardTitle>
          <CardDescription className="text-center">
            Enter your password to access the dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                disabled={loading}
                autoFocus
                required
                aria-label="Dashboard password"
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby={error ? 'password-error' : undefined}
              />
              {error && (
                <p
                  id="password-error"
                  role="alert"
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  {error}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !password}
              aria-busy={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
