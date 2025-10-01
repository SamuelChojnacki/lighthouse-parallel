import { Controller, Get, Res, Req } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { register } from 'prom-client';
import { generateMinimalMetricsHTML } from './metrics-viewer-minimal.html';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsViewerController {
  @Get('view')
  @ApiOperation({ summary: 'Beautiful HTML view of Prometheus metrics' })
  @ApiResponse({ status: 200, description: 'HTML metrics viewer' })
  async getMetricsView(@Res() res: Response, @Req() req: Request) {
    const rawMetrics = await register.metrics();
    const html = generateMinimalMetricsHTML(rawMetrics);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  private oldGenerateMetricsHTML(rawMetrics: string): string {
    // Parse metrics into structured data
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

    // Filter for Lighthouse metrics
    const lighthouseMetrics = metrics.filter(m => m.name.startsWith('lighthouse_'));
    const systemMetrics = metrics.filter(m => !m.name.startsWith('lighthouse_'));

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prometheus Metrics Viewer</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      min-height: 100vh;
      padding: 40px 20px;
      color: #fff;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 {
      text-align: center;
      font-size: 2.5em;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    .subtitle {
      text-align: center;
      opacity: 0.8;
      margin-bottom: 40px;
      font-size: 1.1em;
    }
    .section {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 30px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 1.8em;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .metric-card {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 15px;
      border-left: 4px solid #60a5fa;
    }
    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .metric-name {
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 1.1em;
      font-weight: bold;
      color: #60a5fa;
    }
    .metric-type {
      background: rgba(96, 165, 250, 0.3);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.8em;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .metric-help {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9em;
      margin-bottom: 15px;
      font-style: italic;
    }
    .metric-values {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      padding: 15px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.85em;
      max-height: 200px;
      overflow-y: auto;
    }
    .metric-value-line {
      padding: 4px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .metric-value-line:last-child { border-bottom: none; }
    .actions {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 30px;
      flex-wrap: wrap;
    }
    .btn {
      padding: 12px 25px;
      border: none;
      border-radius: 10px;
      font-size: 1em;
      font-weight: bold;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      text-decoration: none;
      transition: all 0.3s ease;
    }
    .btn:hover {
      transform: scale(1.05);
      background: rgba(255, 255, 255, 0.3);
    }
    .stats-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .stat-box {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 15px;
      text-align: center;
    }
    .stat-box-value {
      font-size: 2em;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .stat-box-label {
      font-size: 0.85em;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Prometheus Metrics</h1>
    <p class="subtitle">Real-time application metrics in Prometheus format</p>

    <div class="stats-summary">
      <div class="stat-box">
        <div class="stat-box-value">${lighthouseMetrics.length}</div>
        <div class="stat-box-label">Lighthouse Metrics</div>
      </div>
      <div class="stat-box">
        <div class="stat-box-value">${systemMetrics.length}</div>
        <div class="stat-box-label">System Metrics</div>
      </div>
      <div class="stat-box">
        <div class="stat-box-value">${metrics.length}</div>
        <div class="stat-box-label">Total Metrics</div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">⚡ Lighthouse Metrics</h2>
      ${lighthouseMetrics.map(m => `
        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-name">${m.name}</div>
            <div class="metric-type">${m.type}</div>
          </div>
          ${m.help ? `<div class="metric-help">${m.help}</div>` : ''}
          <div class="metric-values">
            ${m.values.map(v => `<div class="metric-value-line">${this.escapeHtml(v)}</div>`).join('') || '<div class="metric-value-line" style="opacity: 0.5;">No values recorded yet</div>'}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2 class="section-title">🖥️ System Metrics</h2>
      <details>
        <summary style="cursor: pointer; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 15px;">
          Click to expand (${systemMetrics.length} metrics)
        </summary>
        ${systemMetrics.slice(0, 10).map(m => `
          <div class="metric-card">
            <div class="metric-header">
              <div class="metric-name">${m.name}</div>
              <div class="metric-type">${m.type}</div>
            </div>
            ${m.help ? `<div class="metric-help">${m.help}</div>` : ''}
            <div class="metric-values">
              ${m.values.slice(0, 5).map(v => `<div class="metric-value-line">${this.escapeHtml(v)}</div>`).join('')}
              ${m.values.length > 5 ? `<div class="metric-value-line" style="opacity: 0.5;">... and ${m.values.length - 5} more</div>` : ''}
            </div>
          </div>
        `).join('')}
        ${systemMetrics.length > 10 ? `<div style="text-align: center; opacity: 0.7; margin-top: 15px;">... and ${systemMetrics.length - 10} more system metrics</div>` : ''}
      </details>
    </div>

    <div class="actions">
      <a href="/metrics/view" class="btn">🔄 Refresh</a>
      <a href="/metrics" target="_blank" class="btn">📄 Raw Format</a>
      <a href="/metrics/dashboard" class="btn">📊 Dashboard</a>
      <a href="/api" class="btn">📚 API Docs</a>
    </div>

    <div style="text-align: center; opacity: 0.7; margin-top: 30px; font-size: 0.9em;">
      💡 This page shows Prometheus metrics in a readable format
    </div>
  </div>

  <script>
    // Auto-refresh every 10 seconds
    setTimeout(() => window.location.reload(), 10000);
  </script>
</body>
</html>
    `;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
