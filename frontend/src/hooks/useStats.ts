import { useState, useEffect } from 'react'

export interface QueueStats {
  waiting: number
  active: number
  completed: number
  failed: number
  total: number
}

/**
 * Hook pour récupérer les stats de la queue en temps réel
 * Polling toutes les 3 secondes
 */
export function useStats() {
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/lighthouse/stats', {
          headers: {
            'Accept': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }

        const data = await response.json()
        setStats(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    // Fetch initial data
    fetchStats()

    // Poll every 3 seconds
    const interval = setInterval(fetchStats, 3000)

    return () => clearInterval(interval)
  }, [])

  return { stats, loading, error }
}
