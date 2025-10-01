import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useMetrics, type MetricData } from "@/hooks/useMetrics"

function formatValue(metric: MetricData): string {
  const { value, name } = metric

  if (name.includes('bytes')) {
    // Convert bytes to MB
    return `${(value / 1024 / 1024).toFixed(2)} MB`
  }

  if (name.includes('seconds')) {
    if (value < 1) {
      return `${(value * 1000).toFixed(2)} ms`
    }
    return `${value.toFixed(2)} s`
  }

  if (name.includes('percent')) {
    return `${value.toFixed(1)}%`
  }

  return value.toFixed(2)
}

function MetricRow({ metric }: { metric: MetricData }) {
  const shortName = metric.name.replace('lighthouse_', '').replace(/_/g, ' ')

  return (
    <div className="flex justify-between items-start py-2 border-b last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium">{shortName}</p>
        {metric.help && (
          <p className="text-xs text-muted-foreground mt-0.5">{metric.help}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold tabular-nums">
          {formatValue(metric)}
        </span>
        <Badge variant="outline" className="text-xs">
          {metric.type}
        </Badge>
      </div>
    </div>
  )
}

export function Metrics() {
  const { metrics, loading, error } = useMetrics()

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading metrics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>Failed to load metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">System Metrics</h1>
            <p className="text-muted-foreground">Real-time application monitoring</p>
          </div>
          <Badge variant="outline" className="text-sm">
            <span className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            Live
          </Badge>
        </div>

        {/* System Metrics */}
        {metrics && metrics.system.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>System Metrics</CardTitle>
              <CardDescription>Process and Node.js runtime statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {metrics.system.map((metric, i) => (
                <MetricRow key={i} metric={metric} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Lighthouse Metrics */}
        {metrics && metrics.lighthouse.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Lighthouse Queue Metrics</CardTitle>
              <CardDescription>Audit processing statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {metrics.lighthouse.map((metric, i) => (
                <MetricRow key={i} metric={metric} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* HTTP Metrics */}
        {metrics && metrics.http.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>HTTP Metrics</CardTitle>
              <CardDescription>Request and response statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {metrics.http.map((metric, i) => (
                <MetricRow key={i} metric={metric} />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
