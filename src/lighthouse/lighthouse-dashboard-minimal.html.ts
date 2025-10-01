export function generateMinimalDashboardHTML(stats: any): string {
  const total = stats.total || 0;
  const maxConcurrency = parseInt(process.env.WORKER_CONCURRENCY || '5');
  const utilization = total > 0 ? Math.round((stats.active / maxConcurrency) * 100) : 0;

  // Calculate percentages for each state
  const waitingPct = total > 0 ? Math.round((stats.waiting / total) * 100) : 0;
  const activePct = total > 0 ? Math.round((stats.active / total) * 100) : 0;
  const completedPct = total > 0 ? Math.round((stats.completed / total) * 100) : 0;
  const failedPct = total > 0 ? Math.round((stats.failed / total) * 100) : 0;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lighthouse Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
      background: #fafafa;
      color: #2c3e50;
      line-height: 1.6;
      padding: 24px;
    }

    .container { max-width: 1400px; margin: 0 auto; }

    header {
      background: white;
      padding: 32px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      margin-bottom: 24px;
      border-left: 4px solid #3498db;
    }

    h1 {
      font-size: 28px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 8px;
    }

    .subtitle {
      color: #7f8c8d;
      font-size: 14px;
    }

    .timestamp {
      background: white;
      padding: 12px 20px;
      border-radius: 4px;
      margin-bottom: 24px;
      font-size: 13px;
      color: #7f8c8d;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: white;
      padding: 28px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      border-left: 4px solid #ecf0f1;
    }

    .stat-card.waiting { border-left-color: #f39c12; }
    .stat-card.active { border-left-color: #3498db; }
    .stat-card.completed { border-left-color: #27ae60; }
    .stat-card.failed { border-left-color: #e74c3c; }

    .stat-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .stat-icon {
      font-size: 24px;
    }

    .stat-label {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #95a5a6;
      font-weight: 500;
    }

    .stat-value {
      font-size: 42px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 12px;
      font-variant-numeric: tabular-nums;
    }

    .stat-card.waiting .stat-value { color: #f39c12; }
    .stat-card.active .stat-value { color: #3498db; }
    .stat-card.completed .stat-value { color: #27ae60; }
    .stat-card.failed .stat-value { color: #e74c3c; }

    .stat-meta {
      font-size: 13px;
      color: #95a5a6;
      padding-top: 12px;
      border-top: 1px solid #ecf0f1;
    }

    .chart-section {
      background: white;
      padding: 32px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      margin-bottom: 24px;
    }

    .chart-title {
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 2px solid #ecf0f1;
    }

    .bar-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 200px;
      gap: 16px;
      margin: 24px 0;
    }

    .bar-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .bar {
      width: 100%;
      background: #ecf0f1;
      border-radius: 4px 4px 0 0;
      position: relative;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      min-height: 20px;
    }

    .bar.waiting { background: #f39c12; }
    .bar.active { background: #3498db; }
    .bar.completed { background: #27ae60; }
    .bar.failed { background: #e74c3c; }

    .bar-value {
      font-weight: 600;
      color: white;
      font-size: 16px;
      padding: 8px;
    }

    .bar-label {
      font-size: 12px;
      color: #7f8c8d;
      text-align: center;
      font-weight: 500;
    }

    .info-section {
      background: white;
      padding: 32px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      margin-bottom: 24px;
    }

    .info-section h2 {
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 2px solid #ecf0f1;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .info-item {
      padding: 16px;
      background: #f8f9fa;
      border-radius: 4px;
      border-left: 3px solid #3498db;
    }

    .info-item-label {
      font-size: 12px;
      color: #7f8c8d;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-item-value {
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
      font-family: 'SF Mono', 'Monaco', monospace;
    }

    .actions {
      background: white;
      padding: 24px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      padding: 10px 20px;
      border: 1px solid #bdc3c7;
      background: white;
      color: #2c3e50;
      text-decoration: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }

    .btn:hover {
      background: #f8f9fa;
      border-color: #95a5a6;
    }

    .btn.primary {
      background: #3498db;
      color: white;
      border-color: #3498db;
    }

    .btn.primary:hover {
      background: #2980b9;
      border-color: #2980b9;
    }

    .footer {
      text-align: center;
      padding: 24px;
      color: #95a5a6;
      font-size: 13px;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      h1 {
        font-size: 22px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Lighthouse Dashboard</h1>
      <div class="subtitle">Real-time queue monitoring and performance analytics</div>
    </header>

    <div class="timestamp">
      Last updated: ${new Date().toLocaleString('fr-FR')} • Auto-refresh: 10 seconds
    </div>

    <div class="stats-grid">
      <div class="stat-card waiting">
        <div class="stat-header">
          <span class="stat-icon">⏳</span>
          <span class="stat-label">Waiting</span>
        </div>
        <div class="stat-value">${stats.waiting}</div>
        <div class="stat-meta">${waitingPct}% of total</div>
      </div>

      <div class="stat-card active">
        <div class="stat-header">
          <span class="stat-icon">🔄</span>
          <span class="stat-label">Active</span>
        </div>
        <div class="stat-value">${stats.active}</div>
        <div class="stat-meta">${activePct}% of total</div>
      </div>

      <div class="stat-card completed">
        <div class="stat-header">
          <span class="stat-icon">✅</span>
          <span class="stat-label">Completed</span>
        </div>
        <div class="stat-value">${stats.completed}</div>
        <div class="stat-meta">${completedPct}% of total</div>
      </div>

      <div class="stat-card failed">
        <div class="stat-header">
          <span class="stat-icon">❌</span>
          <span class="stat-label">Failed</span>
        </div>
        <div class="stat-value">${stats.failed}</div>
        <div class="stat-meta">${failedPct}% of total</div>
      </div>
    </div>

    <div class="chart-section">
      <h2 class="chart-title">Queue Distribution</h2>
      <div class="bar-chart">
        <div class="bar-container">
          <div class="bar waiting" style="height: ${Math.max(waitingPct, 10)}%">
            <span class="bar-value">${stats.waiting}</span>
          </div>
          <div class="bar-label">Waiting</div>
        </div>

        <div class="bar-container">
          <div class="bar active" style="height: ${Math.max(activePct, 10)}%">
            <span class="bar-value">${stats.active}</span>
          </div>
          <div class="bar-label">Active</div>
        </div>

        <div class="bar-container">
          <div class="bar completed" style="height: ${Math.max(completedPct, 10)}%">
            <span class="bar-value">${stats.completed}</span>
          </div>
          <div class="bar-label">Completed</div>
        </div>

        <div class="bar-container">
          <div class="bar failed" style="height: ${Math.max(failedPct, 10)}%">
            <span class="bar-value">${stats.failed}</span>
          </div>
          <div class="bar-label">Failed</div>
        </div>
      </div>
    </div>

    <div class="info-section">
      <h2>System Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-item-label">Total Jobs</div>
          <div class="info-item-value">${total}</div>
        </div>

        <div class="info-item">
          <div class="info-item-label">Worker Concurrency</div>
          <div class="info-item-value">${maxConcurrency}</div>
        </div>

        <div class="info-item">
          <div class="info-item-label">Active Workers</div>
          <div class="info-item-value">${stats.active} / ${maxConcurrency}</div>
        </div>

        <div class="info-item">
          <div class="info-item-label">Utilization</div>
          <div class="info-item-value">${utilization}%</div>
        </div>
      </div>
    </div>

    <div class="actions">
      <a href="/lighthouse/dashboard" class="btn primary">Refresh</a>
      <a href="/lighthouse/stats" class="btn">Stats</a>
      <a href="/metrics/view" class="btn">Metrics</a>
      <a href="/api" class="btn">API Docs</a>
    </div>

    <div class="footer">
      Lighthouse API v1.0 • Production Ready
    </div>
  </div>

  <script>
    setTimeout(() => window.location.reload(), 10000);
  </script>
</body>
</html>
  `;
}
