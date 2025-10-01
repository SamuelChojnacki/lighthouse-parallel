import { useState, useEffect } from 'react'

export interface PublicConfig {
  apiKey: string
  workerConcurrency: number
}

/**
 * Hook to fetch public configuration from backend
 * Includes API key and worker concurrency setting
 * Uses cached API key fetch to avoid duplicate requests
 */
export function useConfig() {
  const [config, setConfig] = useState<PublicConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // This will use the cached API key from getApiKey()
        const token = sessionStorage.getItem('auth_token')
        if (!token) {
          throw new Error('No authentication token')
        }

        const response = await fetch('/config/public', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch configuration')
        }

        const data = await response.json()
        setConfig(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  return { config, loading, error }
}
