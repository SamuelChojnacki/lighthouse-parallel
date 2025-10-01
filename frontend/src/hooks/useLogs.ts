import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'

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
        const data = await api.get<LogEntry[]>('/logs', {
          params: { limit },
        })
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
