import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Res,
  Req,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { LighthouseService } from './lighthouse.service';
import { LighthouseCleanupService } from './lighthouse-cleanup.service';
import { RedisCleanupService } from './redis-cleanup.service';
import { AuditRequestDto, BatchAuditDto } from './dto/audit-request.dto';
import { generateMinimalStatsHTML } from './lighthouse-stats-minimal.html';

@ApiTags('lighthouse')
@Controller('lighthouse')
export class LighthouseController {
  constructor(
    private readonly lighthouseService: LighthouseService,
    private readonly cleanupService: LighthouseCleanupService,
    private readonly redisCleanupService: RedisCleanupService,
  ) {}

  @Post('audit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a single Lighthouse audit job' })
  @ApiResponse({
    status: 201,
    description: 'Audit job created successfully',
    schema: {
      example: {
        jobId: 'abc123-def456-ghi789',
        url: 'https://example.com',
        status: 'pending',
        message: 'Audit job queued successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid URL or parameters' })
  async createAudit(@Body(ValidationPipe) auditDto: AuditRequestDto) {
    return this.lighthouseService.addAudit(
      auditDto.url,
      auditDto.categories,
    );
  }

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create batch Lighthouse audit jobs for multiple URLs' })
  @ApiResponse({
    status: 201,
    description: 'Batch audit jobs created successfully',
    schema: {
      example: {
        batchId: 'batch-xyz789',
        jobs: [
          { jobId: 'job-1', url: 'https://example.com', status: 'pending' },
          { jobId: 'job-2', url: 'https://google.com', status: 'pending' },
        ],
        totalJobs: 2,
        message: 'Batch audit jobs queued successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid URLs or parameters' })
  async createBatchAudit(@Body(ValidationPipe) batchDto: BatchAuditDto) {
    return this.lighthouseService.addBatchAudits(
      batchDto.urls,
      batchDto.categories,
    );
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get status and results of a single audit job' })
  @ApiParam({ name: 'jobId', description: 'The unique job ID returned when creating an audit' })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved successfully',
    schema: {
      example: {
        jobId: 'abc123-def456-ghi789',
        state: 'completed',
        progress: 100,
        result: {
          success: true,
          scores: {
            performance: 100,
            accessibility: 95,
          },
          duration: 8600,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobStatus(@Param('jobId') jobId: string) {
    const status = await this.lighthouseService.getJobStatus(jobId);

    if (!status) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    return status;
  }

  @Get('batch/:batchId')
  @ApiOperation({ summary: 'Get status and results of a batch audit' })
  @ApiParam({ name: 'batchId', description: 'The unique batch ID returned when creating a batch audit' })
  @ApiResponse({
    status: 200,
    description: 'Batch status retrieved successfully',
    schema: {
      example: {
        batchId: 'batch-xyz789',
        totalJobs: 3,
        completed: 2,
        failed: 0,
        pending: 1,
        jobs: [
          { jobId: 'job-1', url: 'https://example.com', state: 'completed' },
          { jobId: 'job-2', url: 'https://google.com', state: 'completed' },
          { jobId: 'job-3', url: 'https://github.com', state: 'active' },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async getBatchStatus(@Param('batchId') batchId: string) {
    const status = await this.lighthouseService.getBatchStatus(batchId);

    if (!status) {
      throw new NotFoundException(`Batch ${batchId} not found`);
    }

    return status;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get queue statistics and worker status' })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics retrieved successfully',
    schema: {
      example: {
        waiting: 5,
        active: 3,
        completed: 120,
        failed: 2,
        delayed: 0,
        paused: 0,
      },
    },
  })
  async getStats(@Req() req: Request, @Res() res: Response) {
    const stats = await this.lighthouseService.getQueueStats();

    // Si c'est un navigateur, retourner HTML
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('text/html')) {
      const html = generateMinimalStatsHTML(stats);
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }

    // Sinon retourner JSON
    return res.json(stats);
  }

  private oldGenerateStatsHTML(stats: any): string {
    const total = stats.total || 0;
    const maxConcurrency = parseInt(process.env.WORKER_CONCURRENCY || '5');
    const utilization = total > 0 ? Math.round((stats.active / maxConcurrency) * 100) : 0;

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Queue Statistics</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      padding: 24px;
      color: #1a1a1a;
      line-height: 1.6;
    }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
    h1 {
      text-align: center;
      font-size: 2.5em;
      margin-bottom: 40px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .stat-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 25px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      text-align: center;
      transition: transform 0.3s ease;
    }
    .stat-card:hover { transform: translateY(-5px); }
    .stat-icon { font-size: 2.5em; margin-bottom: 10px; }
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
    }
    .info-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 30px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      margin-bottom: 20px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 15px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: 600; opacity: 0.9; }
    .info-value {
      font-family: 'Monaco', 'Courier New', monospace;
      background: rgba(0, 0, 0, 0.2);
      padding: 5px 15px;
      border-radius: 8px;
    }
    .progress-bar {
      width: 100%;
      height: 30px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 15px;
      overflow: hidden;
      margin-top: 10px;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      transition: width 0.5s ease;
    }
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
    .refresh-note {
      text-align: center;
      opacity: 0.7;
      margin-top: 20px;
      font-size: 0.9em;
    }
    .json-link {
      text-align: center;
      margin-top: 20px;
    }
    .json-link a {
      color: #fff;
      text-decoration: underline;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Queue Statistics</h1>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">⏳</div>
        <div class="stat-label">Waiting</div>
        <div class="stat-value">${stats.waiting}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔄</div>
        <div class="stat-label">Active</div>
        <div class="stat-value">${stats.active}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-label">Completed</div>
        <div class="stat-value">${stats.completed}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">❌</div>
        <div class="stat-label">Failed</div>
        <div class="stat-value">${stats.failed}</div>
      </div>
    </div>

    <div class="info-card">
      <h2 style="margin-bottom: 20px;">⚙️ Configuration</h2>
      <div class="info-row">
        <span class="info-label">Total Jobs</span>
        <span class="info-value">${total}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Worker Concurrency</span>
        <span class="info-value">${maxConcurrency}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Worker Utilization</span>
        <span class="info-value">${stats.active} / ${maxConcurrency} (${utilization}%)</span>
      </div>
      <div style="margin-top: 20px;">
        <div style="font-size: 0.9em; margin-bottom: 5px;">Utilization</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${utilization}%">${utilization}%</div>
        </div>
      </div>
    </div>

    <div class="actions">
      <a href="/lighthouse/stats" class="btn">🔄 Refresh</a>
      <a href="/lighthouse/dashboard" class="btn">📊 Full Dashboard</a>
      <a href="/api" class="btn">📚 API Docs</a>
    </div>

    <div class="json-link">
      <a href="/lighthouse/stats" onclick="fetch('/lighthouse/stats', {headers: {'Accept': 'application/json'}}).then(r => r.json()).then(d => alert(JSON.stringify(d, null, 2))); return false;">
        📋 View as JSON
      </a>
    </div>

    <div class="refresh-note">
      💡 Tip: Bookmark this page for quick access to queue stats
    </div>
  </div>

  <script>
    // Auto-refresh every 5 seconds
    setTimeout(() => window.location.reload(), 5000);
  </script>
</body>
</html>
    `;
  }

  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger Redis cleanup (removes jobs older than 24h)' })
  @ApiResponse({
    status: 200,
    description: 'Cleanup completed successfully',
    schema: {
      example: {
        cleaned: 45,
        stats: {
          waiting: 0,
          active: 2,
          completed: 10,
          failed: 1,
        },
      },
    },
  })
  async triggerCleanup() {
    return this.cleanupService.manualCleanup();
  }

  @Post('redis/cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger Redis old jobs cleanup (auto cleanup runs every hour)' })
  @ApiResponse({
    status: 200,
    description: 'Redis cleanup completed',
    schema: {
      example: {
        completed: 10,
        failed: 5,
        duration: 125,
      },
    },
  })
  async triggerRedisCleanup() {
    return this.redisCleanupService.cleanupNow();
  }

  @Get('redis/storage-stats')
  @ApiOperation({ summary: 'Get Redis storage statistics and cleanup configuration' })
  @ApiResponse({
    status: 200,
    description: 'Storage stats retrieved successfully',
    schema: {
      example: {
        completed: 50,
        failed: 5,
        delayed: 0,
        active: 2,
        waiting: 3,
        cleanupConfig: {
          enabled: true,
          completedAgeHours: 24,
          failedAgeHours: 48,
        },
      },
    },
  })
  async getStorageStats() {
    return this.redisCleanupService.getStorageStats();
  }
}