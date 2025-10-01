import { useState, useEffect } from 'react'
import { getApiKey } from '@/lib/api-client'

export interface MetricData {
  name: string
  value: number
  type: string
  help: string
}

export interface ParsedMetrics {
  system: MetricData[]
  lighthouse: MetricData[]
  http: MetricData[]
}

function parsePrometheusMetrics(text: string): ParsedMetrics {
  const lines = text.split('\n')
  const metrics: MetricData[] = []

  let currentHelp = ''
  let currentType = ''

  for (const line of lines) {
    if (line.startsWith('# HELP')) {
      currentHelp = line.replace('# HELP', '').trim().split(' ').slice(1).join(' ')
    } else if (line.startsWith('# TYPE')) {
      const parts = line.replace('# TYPE', '').trim().split(' ')
      currentType = parts[1] || 'gauge'
    } else if (line && !line.startsWith('#')) {
      const parts = line.split(' ')
      if (parts.length >= 2) {
        const name = parts[0]
        const value = parseFloat(parts[1])
        if (!isNaN(value)) {
          metrics.push({
            name,
            value,
            type: currentType,
            help: currentHelp,
          })
        }
      }
    }
  }

  // Categorize metrics
  const system = metrics.filter(m =>
    m.name.includes('process_') ||
    m.name.includes('nodejs_') ||
    m.name.includes('up')
  )

  const lighthouse = metrics.filter(m =>
    m.name.includes('lighthouse_audits') ||
    m.name.includes('lighthouse_queue')
  )

  const http = metrics.filter(m =>
    m.name.includes('http_')
  )

  return { system, lighthouse, http }
}

/**
 * Hook to fetch and parse Prometheus metrics in real-time
 * Polls every 5 seconds
 * Uses api-client for automatic API key authentication
 */
export function useMetrics() {
  const [metrics, setMetrics] = useState<ParsedMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/metrics', {
          headers: {
            'X-API-Key': await getApiKey(),
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch metrics')
        }

        const text = await response.text()
        const parsed = parsePrometheusMetrics(text)
        setMetrics(parsed)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000) // Poll every 5s

    return () => clearInterval(interval)
  }, [])

  return { metrics, loading, error }
}
