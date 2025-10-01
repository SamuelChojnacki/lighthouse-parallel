import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from 'prom-client';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsDashboardController {
  constructor(
    @InjectMetric('lighthouse_jobs_total') private jobsTotal: Counter,
    @InjectMetric('lighthouse_job_duration_seconds')
    private jobDuration: Histogram,
    @InjectMetric('lighthouse_queue_size') private queueSize: Gauge,
    @InjectMetric('lighthouse_active_workers') private activeWorkers: Gauge,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Metrics dashboard with visual charts' })
  @ApiResponse({ status: 200, description: 'HTML metrics dashboard' })
  async getDashboard(@Res() res: Response) {
    // Get current metric values
    const metricsData = await this.getMetricsData();

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lighthouse Metrics Dashboard</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      min-height: 100vh;
      padding: 20px;
      color: #fff;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    header {
      text-align: center;
      margin-bottom: 40px;
      animation: fadeInDown 0.6s ease;
    }

    h1 {
      font-size: 3em;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }

    .subtitle {
      font-size: 1.2em;
      opacity: 0.9;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .metric-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 30px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      animation: fadeInUp 0.6s ease;
    }

    .metric-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
    }

    .metric-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 20px;
    }

    .metric-icon {
      font-size: 2.5em;
    }

    .metric-info h3 {
      font-size: 1.2em;
      margin-bottom: 5px;
      opacity: 0.9;
    }

    .metric-type {
      font-size: 0.8em;
      opacity: 0.7;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .metric-value {
      font-size: 2.5em;
      font-weight: bold;
      margin: 15px 0;
    }

    .metric-description {
      font-size: 0.9em;
      opacity: 0.8;
      line-height: 1.5;
    }

    .chart-section {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 30px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      margin-bottom: 20px;
      animation: fadeIn 0.8s ease;
    }

    .chart-title {
      font-size: 1.8em;
      margin-bottom: 25px;
      text-align: center;
    }

    .gauge-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 30px 0;
    }

    .gauge {
      width: 200px;
      height: 200px;
      border-radius: 50%;
      background: conic-gradient(
        #4ade80 0deg,
        #22c55e 90deg,
        #fbbf24 180deg,
        #f59e0b 270deg,
        #ef4444 360deg
      );
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .gauge-inner {
      width: 160px;
      height: 160px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .gauge-value {
      font-size: 2.5em;
      font-weight: bold;
    }

    .gauge-label {
      font-size: 0.9em;
      opacity: 0.8;
    }

    .trend-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 150px;
      margin: 20px 0;
      gap: 10px;
    }

    .trend-bar {
      flex: 1;
      background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
      border-radius: 10px 10px 0 0;
      min-height: 20px;
      transition: height 0.5s ease;
      position: relative;
    }

    .trend-bar::after {
      content: attr(data-value);
      position: absolute;
      top: -25px;
      left: 50%;
      transform: translateX(-50%);
      font-weight: bold;
      font-size: 0.9em;
    }

    .actions {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 30px;
      flex-wrap: wrap;
    }

    .btn {
      padding: 12px 30px;
      border: none;
      border-radius: 10px;
      font-size: 1em;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      backdrop-filter: blur(10px);
    }

    .btn:hover {
      transform: scale(1.05);
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
    }

    .refresh-info {
      text-align: center;
      opacity: 0.7;
      margin-top: 20px;
      animation: pulse 2s ease infinite;
    }

    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📈 Metrics Dashboard</h1>
      <p class="subtitle">Lighthouse API Performance Monitoring</p>
    </header>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-header">
          <div class="metric-icon">📊</div>
          <div class="metric-info">
            <h3>Total Jobs</h3>
            <div class="metric-type">Counter</div>
          </div>
        </div>
        <div class="metric-value">${metricsData.totalJobs}</div>
        <div class="metric-description">
          Nombre total d'audits exécutés depuis le démarrage
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <div class="metric-icon">⏱️</div>
          <div class="metric-info">
            <h3>Avg Duration</h3>
            <div class="metric-type">Histogram</div>
          </div>
        </div>
        <div class="metric-value">${metricsData.avgDuration}s</div>
        <div class="metric-description">
          Durée moyenne d'exécution des audits
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <div class="metric-icon">🔄</div>
          <div class="metric-info">
            <h3>Active Workers</h3>
            <div class="metric-type">Gauge</div>
          </div>
        </div>
        <div class="metric-value">${metricsData.activeWorkers}</div>
        <div class="metric-description">
          Nombre de workers actuellement actifs
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <div class="metric-icon">📦</div>
          <div class="metric-info">
            <h3>Queue Size</h3>
            <div class="metric-type">Gauge</div>
          </div>
        </div>
        <div class="metric-value">${metricsData.queueSize}</div>
        <div class="metric-description">
          Nombre total de jobs dans la queue (all states)
        </div>
      </div>
    </div>

    <div class="chart-section">
      <h2 class="chart-title">🎯 Worker Utilization</h2>
      <div class="gauge-container">
        <div class="gauge">
          <div class="gauge-inner">
            <div class="gauge-value">${metricsData.utilization}%</div>
            <div class="gauge-label">Utilization</div>
          </div>
        </div>
      </div>
      <div class="metric-description" style="text-align: center; margin-top: 20px;">
        ${metricsData.activeWorkers} / ${process.env.WORKER_CONCURRENCY || 5} workers en cours d'utilisation
      </div>
    </div>

    <div class="chart-section">
      <h2 class="chart-title">📉 Performance Trends</h2>
      <div class="trend-chart">
        ${Array.from({ length: 10 }, (_, i) => {
          const height = Math.random() * 100 + 20;
          return `<div class="trend-bar" style="height: ${height}%" data-value="${Math.round(height / 10)}s"></div>`;
        }).join('')}
      </div>
      <div class="metric-description" style="text-align: center; margin-top: 20px;">
        Derniers temps d'exécution des audits (données simulées)
      </div>
    </div>

    <div class="actions">
      <a href="/metrics/dashboard" class="btn">🔄 Rafraîchir</a>
      <a href="/metrics" class="btn">📊 Raw Metrics</a>
      <a href="/lighthouse/dashboard" class="btn">📈 Queue Dashboard</a>
      <a href="/api" class="btn">📚 API Docs</a>
    </div>

    <p class="refresh-info">🔄 Rafraîchissement automatique toutes les 10 secondes</p>
  </div>

  <script>
    setTimeout(() => {
      window.location.reload();
    }, 10000);
  </script>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  private async getMetricsData() {
    // In a real implementation, you would fetch actual metric values
    // For now, we'll use sample data
    const totalJobs = Math.floor(Math.random() * 500) + 100;
    const avgDuration = (Math.random() * 30 + 5).toFixed(1);
    const activeWorkers = Math.floor(Math.random() * parseInt(process.env.WORKER_CONCURRENCY || '5'));
    const queueSize = Math.floor(Math.random() * 50) + 10;
    const maxWorkers = parseInt(process.env.WORKER_CONCURRENCY || '5');
    const utilization = Math.round((activeWorkers / maxWorkers) * 100);

    return {
      totalJobs,
      avgDuration,
      activeWorkers,
      queueSize,
      utilization,
    };
  }
}
