import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'

export interface Batch {
  batchId: string
  total: number
  completed: number
  failed: number
  active: number
  waiting: number
  status: 'processing' | 'waiting' | 'completed' | 'partial' | 'unknown'
  urls: string[]
}

export function useBatches() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const data = await api.get<Batch[]>('/lighthouse/batches')
        setBatches(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchBatches()
    const interval = setInterval(fetchBatches, 5000) // Poll every 5s

    return () => clearInterval(interval)
  }, [])

  return { batches, loading, error }
}
