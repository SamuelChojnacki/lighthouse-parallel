export function generateMinimalStatsHTML(stats: any): string {
  const total = stats.total || 0;
  const maxConcurrency = parseInt(process.env.WORKER_CONCURRENCY || '5');
  const utilization = total > 0 ? Math.round((stats.active / maxConcurrency) * 100) : 0;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Queue Statistics - Lighthouse API</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
      background: #fafafa;
      color: #2c3e50;
      line-height: 1.6;
      padding: 32px 16px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    header {
      background: white;
      padding: 32px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      margin-bottom: 24px;
      border-left: 4px solid #3498db;
    }

    h1 {
      font-size: 24px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 8px;
    }

    .subtitle {
      color: #7f8c8d;
      font-size: 14px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      border-left: 3px solid #ecf0f1;
    }

    .stat-card.waiting { border-left-color: #f39c12; }
    .stat-card.active { border-left-color: #3498db; }
    .stat-card.completed { border-left-color: #27ae60; }
    .stat-card.failed { border-left-color: #e74c3c; }

    .stat-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #95a5a6;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .stat-value {
      font-size: 36px;
      font-weight: 600;
      color: #2c3e50;
      font-variant-numeric: tabular-nums;
    }

    .stat-card.waiting .stat-value { color: #f39c12; }
    .stat-card.active .stat-value { color: #3498db; }
    .stat-card.completed .stat-value { color: #27ae60; }
    .stat-card.failed .stat-value { color: #e74c3c; }

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

    .info-table {
      width: 100%;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #ecf0f1;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      color: #7f8c8d;
      font-size: 14px;
    }

    .info-value {
      color: #2c3e50;
      font-weight: 500;
      font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
      font-size: 14px;
    }

    .progress-section {
      margin-top: 24px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .progress-label {
      font-size: 14px;
      color: #7f8c8d;
    }

    .progress-percentage {
      font-size: 14px;
      font-weight: 600;
      color: #2c3e50;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: #ecf0f1;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #3498db;
      border-radius: 4px;
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
      display: inline-block;
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

    .timestamp {
      background: white;
      padding: 16px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      margin-bottom: 24px;
      text-align: center;
      font-size: 13px;
      color: #7f8c8d;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      h1 {
        font-size: 20px;
      }

      .stat-value {
        font-size: 28px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Queue Statistics</h1>
      <div class="subtitle">Real-time Lighthouse audit queue monitoring</div>
    </header>

    <div class="timestamp">
      Last updated: ${new Date().toLocaleString('fr-FR')} • Auto-refresh: 10 seconds
    </div>

    <div class="stats-grid">
      <div class="stat-card waiting">
        <div class="stat-label">Waiting</div>
        <div class="stat-value">${stats.waiting}</div>
      </div>

      <div class="stat-card active">
        <div class="stat-label">Active</div>
        <div class="stat-value">${stats.active}</div>
      </div>

      <div class="stat-card completed">
        <div class="stat-label">Completed</div>
        <div class="stat-value">${stats.completed}</div>
      </div>

      <div class="stat-card failed">
        <div class="stat-label">Failed</div>
        <div class="stat-value">${stats.failed}</div>
      </div>
    </div>

    <div class="info-section">
      <h2>Configuration</h2>
      <div class="info-table">
        <div class="info-row">
          <span class="info-label">Total Jobs</span>
          <span class="info-value">${total}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Worker Concurrency</span>
          <span class="info-value">${maxConcurrency} workers</span>
        </div>
        <div class="info-row">
          <span class="info-label">Active Workers</span>
          <span class="info-value">${stats.active} / ${maxConcurrency}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Worker Utilization</span>
          <span class="info-value">${utilization}%</span>
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-header">
          <span class="progress-label">Utilization</span>
          <span class="progress-percentage">${utilization}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${utilization}%"></div>
        </div>
      </div>
    </div>

    <div class="actions">
      <a href="/lighthouse/stats" class="btn primary">Refresh</a>
      <a href="/lighthouse/dashboard" class="btn">Full Dashboard</a>
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
