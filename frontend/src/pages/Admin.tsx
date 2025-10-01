import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLogs } from "@/hooks/useLogs"
import { useBatches } from "@/hooks/useBatches"

type BadgeVariant = "default" | "destructive" | "outline" | "secondary"

export function Admin() {
  const { logs, loading, error } = useLogs(100)
  const { batches, loading: batchesLoading } = useBatches()
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<string | null>(null)

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-500'
      case 'warn': return 'text-yellow-500'
      case 'info': return 'text-blue-500'
      case 'debug': return 'text-gray-500'
      default: return 'text-foreground'
    }
  }

  const getLevelBadge = (level: string): BadgeVariant => {
    switch (level) {
      case 'error': return 'destructive'
      case 'warn': return 'default'
      case 'info': return 'secondary'
      default: return 'outline'
    }
  }

  const handleCleanup = async () => {
    setCleanupLoading(true)
    setCleanupResult(null)
    try {
      const response = await fetch('/lighthouse/cleanup', {
        method: 'POST',
      })
      const data = await response.json()
      setCleanupResult(
        `✅ Complete cleanup done! Removed ${data.cleaned} total jobs (${data.completedCleaned} completed, ${data.failedCleaned} failed) + all batches`
      )
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setCleanupResult(`❌ Error: ${error.message}`)
    } finally {
      setCleanupLoading(false)
    }
  }

  const getStatusBadge = (status: string): BadgeVariant => {
    switch (status) {
      case 'completed': return 'default'
      case 'processing': return 'secondary'
      case 'waiting': return 'outline'
      case 'partial': return 'destructive'
      default: return 'outline'
    }
  }

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 id="admin-header" className="text-4xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">System logs and maintenance operations</p>
          </div>
          <Badge variant="outline" className="text-sm">
            <span className="h-2 w-2 bg-orange-500 rounded-full mr-2 animate-pulse" />
            Admin
          </Badge>
        </header>

        {/* Cleanup Actions */}
        <section aria-labelledby="maintenance-heading">
          <Card>
            <CardHeader>
              <CardTitle id="maintenance-heading">Maintenance</CardTitle>
              <CardDescription>
                Manual cleanup • Auto-cleanup runs every hour
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleCleanup}
                  disabled={cleanupLoading}
                  variant="destructive"
                  size="lg"
                  aria-label="Clean all jobs, batches and Redis storage"
                >
                  {cleanupLoading ? '🧹 Cleaning...' : '🧹 Clean Everything'}
                </Button>
                <span className="text-xs text-muted-foreground">
                  Removes all jobs, batches & Redis data
                </span>
              </div>
              {cleanupResult && (
                <div className="p-3 rounded-md bg-secondary text-sm font-mono">
                  {cleanupResult}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Batches Display */}
        <section aria-labelledby="batches-heading">
          <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle id="batches-heading">Recent Batches</CardTitle>
                <CardDescription>
                  Lighthouse audit batches with real-time progress
                </CardDescription>
              </div>
              <Badge variant="secondary">{batches.length} batches</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {batchesLoading && batches.length === 0 ? (
              <p className="text-sm text-muted-foreground">Loading batches...</p>
            ) : batches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No batches found</p>
            ) : (
              <div className="space-y-3">
                {batches.map((batch) => (
                  <div
                    key={batch.batchId}
                    className="p-4 rounded-md border bg-card hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant={getStatusBadge(batch.status)}>
                          {batch.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {batch.batchId.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="text-green-500">{batch.completed} ✓</span>
                        <span className="text-red-500">{batch.failed} ✗</span>
                        <span className="text-blue-500">{batch.active} ⚙</span>
                        <span className="text-gray-500">{batch.waiting} ⏳</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">{batch.total} URLs</span>
                        {batch.urls.length > 0 && (
                          <span className="text-muted-foreground ml-2">
                            - {batch.urls.slice(0, 2).join(', ')}
                            {batch.urls.length > 2 && '...'}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${(batch.completed / batch.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Math.round((batch.completed / batch.total) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </section>

        {/* Logs Display */}
        <section aria-labelledby="logs-heading">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle id="logs-heading">System Logs</CardTitle>
                  <CardDescription>
                    Real-time application logs (last 100 entries)
                  </CardDescription>
                </div>
                <Badge variant="secondary">{logs.length} logs</Badge>
              </div>
            </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-sm text-destructive">
                Failed to load logs: {error.message}
              </div>
            ) : (
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No logs available</p>
                ) : (
                  logs.map((log, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-2 rounded-md hover:bg-secondary/50 text-sm font-mono border-b last:border-0"
                    >
                      <span className="text-muted-foreground text-xs whitespace-nowrap">
                        {log.timestamp}
                      </span>
                      <Badge
                        variant={getLevelBadge(log.level)}
                        className="shrink-0 h-5"
                      >
                        {log.level}
                      </Badge>
                      {log.context && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          [{log.context}]
                        </span>
                      )}
                      <span className={`flex-1 ${getLevelColor(log.level)}`}>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </section>
      </div>
    </main>
  )
}
