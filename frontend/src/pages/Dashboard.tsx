import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useStats } from "@/hooks/useStats"

const WORKER_CONCURRENCY = 5

export function Dashboard() {
  const { stats, loading, error } = useStats()

  const utilization = stats
    ? Math.round((stats.active / WORKER_CONCURRENCY) * 100)
    : 0

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Connection Error</CardTitle>
            <CardDescription>Failed to connect to API</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
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
            <h1 className="text-4xl font-bold">Lighthouse Dashboard</h1>
            <p className="text-muted-foreground">Real-time audit monitoring</p>
          </div>
          <Badge variant="outline" className="text-sm">
            <span className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            Live
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Waiting</CardTitle>
              <Badge variant="secondary">⏳</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums">
                {stats?.waiting ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">In queue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Badge variant="secondary">🔄</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums">
                {stats?.active ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">Processing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Badge variant="secondary">✅</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums">
                {stats?.completed ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">Finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <Badge variant="secondary">❌</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums">
                {stats?.failed ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">Errors</p>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Worker settings and utilization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Jobs</span>
              <span className="font-mono font-semibold tabular-nums">
                {stats?.total ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Worker Concurrency</span>
              <span className="font-mono font-semibold">{WORKER_CONCURRENCY} workers</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active Workers</span>
              <span className="font-mono font-semibold tabular-nums">
                {stats?.active ?? 0} / {WORKER_CONCURRENCY}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Utilization</span>
                <span className="font-mono font-semibold tabular-nums">
                  {utilization}%
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${utilization}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
