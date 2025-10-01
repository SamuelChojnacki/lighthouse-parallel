import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LighthouseService } from './lighthouse.service';
import { generateMinimalDashboardHTML } from './lighthouse-dashboard-minimal.html';

@ApiTags('lighthouse')
@Controller('lighthouse')
export class LighthouseDashboardController {
  constructor(private readonly lighthouseService: LighthouseService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Live dashboard with real-time queue statistics' })
  @ApiResponse({ status: 200, description: 'HTML dashboard page' })
  async getDashboard(@Res() res: Response) {
    const stats = await this.lighthouseService.getQueueStats();
    const html = generateMinimalDashboardHTML(stats);
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }

  @Get('dashboard-old')
  async getDashboardOld(@Res() res: Response) {
    const stats = await this.lighthouseService.getQueueStats();

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lighthouse API Dashboard</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      color: #fff;
    }

    .container {
      max-width: 1200px;
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

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
      animation: fadeInUp 0.6s ease;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 30px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
    }

    .stat-label {
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.8;
      margin-bottom: 10px;
    }

    .stat-value {
      font-size: 3em;
      font-weight: bold;
      margin-bottom: 10px;
    }

    .stat-icon {
      font-size: 2em;
      margin-bottom: 15px;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      overflow: hidden;
      margin-top: 15px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%);
      border-radius: 10px;
      transition: width 0.5s ease;
    }

    .chart-container {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 30px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      animation: fadeIn 0.8s ease;
    }

    .chart-title {
      font-size: 1.5em;
      margin-bottom: 20px;
      text-align: center;
    }

    .bar-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 200px;
      margin: 20px 0;
    }

    .bar {
      flex: 1;
      margin: 0 10px;
      background: linear-gradient(180deg, #4ade80 0%, #22c55e 100%);
      border-radius: 10px 10px 0 0;
      position: relative;
      transition: all 0.5s ease;
      min-height: 5px;
    }

    .bar:nth-child(1) { background: linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%); }
    .bar:nth-child(2) { background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%); }
    .bar:nth-child(3) { background: linear-gradient(180deg, #4ade80 0%, #22c55e 100%); }
    .bar:nth-child(4) { background: linear-gradient(180deg, #f87171 0%, #ef4444 100%); }

    .bar-label {
      position: absolute;
      bottom: -30px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.8em;
      white-space: nowrap;
    }

    .bar-value {
      position: absolute;
      top: -25px;
      left: 50%;
      transform: translateX(-50%);
      font-weight: bold;
      font-size: 1.1em;
    }

    .refresh-info {
      text-align: center;
      opacity: 0.7;
      margin-top: 30px;
      animation: pulse 2s ease infinite;
    }

    .actions {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 30px;
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
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      backdrop-filter: blur(10px);
    }

    .btn:hover {
      transform: scale(1.05);
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
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
      <h1>⚡ Lighthouse API</h1>
      <p class="subtitle">Real-time Performance Monitoring Dashboard</p>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">⏳</div>
        <div class="stat-label">En attente</div>
        <div class="stat-value" id="waiting">${stats.waiting}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${(stats.waiting / stats.total) * 100}%"></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🔄</div>
        <div class="stat-label">Actifs</div>
        <div class="stat-value" id="active">${stats.active}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${(stats.active / stats.total) * 100}%"></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-label">Terminés</div>
        <div class="stat-value" id="completed">${stats.completed}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${(stats.completed / stats.total) * 100}%"></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">❌</div>
        <div class="stat-label">Échoués</div>
        <div class="stat-value" id="failed">${stats.failed}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${(stats.failed / stats.total) * 100}%; background: linear-gradient(90deg, #f87171 0%, #ef4444 100%);"></div>
        </div>
      </div>
    </div>

    <div class="chart-container">
      <h2 class="chart-title">📊 Répartition de la queue</h2>
      <div class="bar-chart">
        <div class="bar" style="height: ${Math.max((stats.waiting / Math.max(stats.total, 1)) * 100, 5)}%">
          <span class="bar-value">${stats.waiting}</span>
          <span class="bar-label">Waiting</span>
        </div>
        <div class="bar" style="height: ${Math.max((stats.active / Math.max(stats.total, 1)) * 100, 5)}%">
          <span class="bar-value">${stats.active}</span>
          <span class="bar-label">Active</span>
        </div>
        <div class="bar" style="height: ${Math.max((stats.completed / Math.max(stats.total, 1)) * 100, 5)}%">
          <span class="bar-value">${stats.completed}</span>
          <span class="bar-label">Completed</span>
        </div>
        <div class="bar" style="height: ${Math.max((stats.failed / Math.max(stats.total, 1)) * 100, 5)}%">
          <span class="bar-value">${stats.failed}</span>
          <span class="bar-label">Failed</span>
        </div>
      </div>

      <div class="actions">
        <a href="/lighthouse/dashboard" class="btn btn-primary">🔄 Rafraîchir</a>
        <a href="/api" class="btn btn-secondary">📚 API Docs</a>
        <a href="/metrics" class="btn btn-secondary">📈 Metrics</a>
      </div>

      <p class="refresh-info">🔄 Rafraîchissement automatique toutes les 5 secondes</p>
    </div>
  </div>

  <script>
    // Auto-refresh every 5 seconds
    setTimeout(() => {
      window.location.reload();
    }, 5000);
  </script>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}
