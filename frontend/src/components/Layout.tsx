import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h2 className="text-xl font-bold">Lighthouse Monitor</h2>
              <div className="flex gap-2">
                <Link to="/">
                  <Button
                    variant={isActive('/') ? 'default' : 'ghost'}
                    size="sm"
                  >
                    Dashboard
                  </Button>
                </Link>
                <Link to="/metrics">
                  <Button
                    variant={isActive('/metrics') ? 'default' : 'ghost'}
                    size="sm"
                  >
                    Metrics
                  </Button>
                </Link>
                <Link to="/admin">
                  <Button
                    variant={isActive('/admin') ? 'default' : 'ghost'}
                    size="sm"
                  >
                    Admin
                  </Button>
                </Link>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/api', '_blank')}
            >
              API Docs
            </Button>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
