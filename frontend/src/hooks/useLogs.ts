import { useState, useEffect } from 'react'

export interface LogEntry {
  timestamp: string
  level: string
  message: string
  context?: string
  trace?: string
}

export function useLogs(limit = 100) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`/logs?limit=${limit}`)

        if (!response.ok) {
          throw new Error('Failed to fetch logs')
        }

        const data = await response.json()
        setLogs(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 5000) // Poll every 5s

    return () => clearInterval(interval)
  }, [limit])

  return { logs, loading, error }
}
