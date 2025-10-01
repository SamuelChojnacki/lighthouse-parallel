export function generateMinimalMetricsHTML(rawMetrics: string): string {
  // Parse metrics
  const lines = rawMetrics.split('\n');
  const metrics: Array<{ name: string; help: string; type: string; values: string[] }> = [];
  let currentMetric: any = null;

  for (const line of lines) {
    if (line.startsWith('# HELP')) {
      if (currentMetric) metrics.push(currentMetric);
      const parts = line.substring(7).split(' ');
      const name = parts[0];
      const help = parts.slice(1).join(' ');
      currentMetric = { name, help, type: '', values: [] };
    } else if (line.startsWith('# TYPE')) {
      const parts = line.substring(7).split(' ');
      if (currentMetric) currentMetric.type = parts[1];
    } else if (line && !line.startsWith('#')) {
      if (currentMetric) currentMetric.values.push(line);
    }
  }
  if (currentMetric) metrics.push(currentMetric);

  const lighthouseMetrics = metrics.filter((m) => m.name.startsWith('lighthouse_'));
  const systemMetrics = metrics.filter((m) => !m.name.startsWith('lighthouse_'));

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prometheus Metrics</title>
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

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .summary-item {
      background: white;
      padding: 20px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      text-align: center;
      border-left: 3px solid #3498db;
    }

    .summary-value {
      font-size: 32px;
      font-weight: 600;
      color: #3498db;
      margin-bottom: 6px;
    }

    .summary-label {
      font-size: 12px;
      text-transform: uppercase;
      color: #7f8c8d;
      letter-spacing: 0.5px;
    }

    .section {
      background: white;
      padding: 32px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 2px solid #ecf0f1;
    }

    .metric-card {
      background: #f8f9fa;
      border-radius: 4px;
      padding: 20px;
      margin-bottom: 16px;
      border-left: 3px solid #3498db;
    }

    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .metric-name {
      font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
      font-size: 14px;
      font-weight: 600;
      color: #2c3e50;
    }

    .metric-type {
      background: #3498db;
      color: white;
      padding: 4px 10px;
      border-radius: 3px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
    }

    .metric-help {
      color: #7f8c8d;
      font-size: 13px;
      margin-bottom: 12px;
      font-style: italic;
    }

    .metric-values {
      background: white;
      border: 1px solid #ecf0f1;
      border-radius: 3px;
      padding: 12px;
      font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
      font-size: 12px;
      max-height: 200px;
      overflow-y: auto;
    }

    .metric-value-line {
      padding: 4px 0;
      color: #2c3e50;
    }

    details {
      background: white;
      padding: 20px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      margin-bottom: 16px;
      cursor: pointer;
    }

    summary {
      font-weight: 600;
      color: #2c3e50;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 4px;
      margin: -12px;
      margin-bottom: 16px;
    }

    details[open] summary {
      margin-bottom: 20px;
      border-bottom: 2px solid #ecf0f1;
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
      .summary {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Prometheus Metrics</h1>
      <div class="subtitle">Application performance and system metrics</div>
    </header>

    <div class="summary">
      <div class="summary-item">
        <div class="summary-value">${lighthouseMetrics.length}</div>
        <div class="summary-label">Lighthouse Metrics</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${systemMetrics.length}</div>
        <div class="summary-label">System Metrics</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${metrics.length}</div>
        <div class="summary-label">Total Metrics</div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Lighthouse Metrics</h2>
      ${
        lighthouseMetrics.length > 0
          ? lighthouseMetrics
              .map(
                (m) => `
        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-name">${m.name}</div>
            <div class="metric-type">${m.type}</div>
          </div>
          ${m.help ? `<div class="metric-help">${m.help}</div>` : ''}
          <div class="metric-values">
            ${
              m.values.length > 0
                ? m.values.map((v) => `<div class="metric-value-line">${escapeHtml(v)}</div>`).join('')
                : '<div class="metric-value-line" style="color: #95a5a6;">No values recorded</div>'
            }
          </div>
        </div>
      `,
              )
              .join('')
          : '<p style="color: #95a5a6; text-align: center; padding: 20px;">No lighthouse metrics available</p>'
      }
    </div>

    <details>
      <summary>System Metrics (${systemMetrics.length} metrics)</summary>
      ${systemMetrics
        .slice(0, 15)
        .map(
          (m) => `
        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-name">${m.name}</div>
            <div class="metric-type">${m.type}</div>
          </div>
          ${m.help ? `<div class="metric-help">${m.help}</div>` : ''}
          <div class="metric-values">
            ${m.values
              .slice(0, 5)
              .map((v) => `<div class="metric-value-line">${escapeHtml(v)}</div>`)
              .join('')}
            ${m.values.length > 5 ? `<div class="metric-value-line" style="color: #95a5a6;">... and ${m.values.length - 5} more</div>` : ''}
          </div>
        </div>
      `,
        )
        .join('')}
      ${systemMetrics.length > 15 ? `<p style="text-align: center; color: #95a5a6; margin-top: 16px;">... and ${systemMetrics.length - 15} more metrics</p>` : ''}
    </details>

    <div class="actions">
      <a href="/metrics/view" class="btn primary">Refresh</a>
      <a href="/metrics" target="_blank" class="btn">Raw Format</a>
      <a href="/lighthouse/dashboard" class="btn">Dashboard</a>
      <a href="/api" class="btn">API Docs</a>
    </div>

    <div class="footer">
      Lighthouse API v1.0 • Auto-refresh: 10 seconds
    </div>
  </div>

  <script>
    setTimeout(() => window.location.reload(), 10000);
  </script>
</body>
</html>
  `;
}
