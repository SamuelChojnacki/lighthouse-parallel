// Load dotenv before anything else to make env vars available in decorators
import * as dotenv from 'dotenv';
dotenv.config();

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fork, ChildProcess } from 'child_process';
import { join } from 'path';
import { LighthouseMetricsService } from '../metrics/lighthouse-metrics.service';

export interface LighthouseJobData {
  url: string;
  categories?: string[];
  locale?: string;
  jobId: string;
  webhookUrl?: string;
  webhookToken?: string;
}

// Get concurrency from environment with fallback
const workerConcurrency = process.env.WORKER_CONCURRENCY
  ? parseInt(process.env.WORKER_CONCURRENCY, 10)
  : undefined;

// Log configuration at module load
console.log(`[LighthouseProcessor] Configuration:`, {
  WORKER_CONCURRENCY_ENV: process.env.WORKER_CONCURRENCY,
  workerConcurrency: workerConcurrency,
  willSetConcurrency: !!workerConcurrency
});

@Processor('lighthouse-audits', {
  ...(workerConcurrency && { concurrency: workerConcurrency }),
  lockDuration: 150000,  // 150 seconds (> 120s Lighthouse timeout)
})
export class LighthouseProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(LighthouseProcessor.name);
  private readonly concurrency: number;

  constructor(
    private configService: ConfigService,
    private metricsService: LighthouseMetricsService,
  ) {
    super();
    const concurrencyValue = parseInt(this.configService.get<string>('WORKER_CONCURRENCY', '10'), 10);
    this.concurrency = Number.isFinite(concurrencyValue) && concurrencyValue > 0 ? concurrencyValue : 10;
    this.logger.log(`Processor initialized with concurrency: ${this.concurrency}`);
  }

  onModuleInit() {
    // Log actual worker configuration
    this.logger.log(`Worker configuration:`, {
      configuredConcurrency: this.concurrency,
      actualWorkerConcurrency: this.worker?.concurrency,
      envValue: process.env.WORKER_CONCURRENCY
    });

    // Update worker concurrency dynamically after initialization
    if (this.worker && Number.isFinite(this.concurrency) && this.concurrency > 0) {
      this.worker.concurrency = this.concurrency;
      this.logger.log(`Worker concurrency set to: ${this.concurrency}`);
    } else {
      this.logger.warn(`Invalid concurrency value: ${this.concurrency}, keeping default`);
    }
  }

  getConcurrency(): number {
    return this.concurrency;
  }

  getMaxConcurrency(): number {
    return this.concurrency;
  }


  async process(job: Job<LighthouseJobData>): Promise<any> {
    const { url, categories, locale, webhookUrl, webhookToken } = job.data;
    const startTime = Date.now();

    this.metricsService.recordJobStart();
    this.logger.log(`Starting Lighthouse audit for ${url} (Job: ${job.id})`);

    try {
      const result = await new Promise((resolve, reject) => {
        const workerPath = join(__dirname, 'workers', 'lighthouse-runner.js');

        // Fork a child process for isolation
        const child: ChildProcess = fork(workerPath, [], {
          stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
          env: { ...process.env }, // Explicitly pass environment variables including CHROME_PATH
        });

        // Track if result was received to prevent hanging promises
        let resultReceived = false;

        // Timeout after 2 minutes
        const timeout = setTimeout(() => {
          if (!resultReceived) {
            resultReceived = true;
            child.kill('SIGKILL');
            reject(new Error(`Lighthouse audit timed out for ${url}`));
          }
        }, 120000);

        // Handle messages from child process
        child.on('message', (msg: any) => {
          if (msg.type === 'AUDIT_RESULT' && !resultReceived) {
            resultReceived = true;
            clearTimeout(timeout);

            if (msg.result.success) {
              this.logger.log(
                `Completed audit for ${url} in ${msg.result.duration}ms`,
              );
              // Kill child immediately after receiving result to prevent race conditions
              child.kill('SIGTERM');
              resolve(msg.result);
            } else {
              this.logger.error(`Audit failed for ${url}: ${msg.result.error}`);
              child.kill('SIGTERM');
              reject(new Error(msg.result.error));
            }
          }
        });

        // Handle errors
        child.on('error', (error) => {
          if (!resultReceived) {
            resultReceived = true;
            clearTimeout(timeout);
            this.logger.error(`Child process error for ${url}: ${error.message}`);
            reject(error);
          }
        });

        child.on('exit', (code) => {
          if (!resultReceived) {
            resultReceived = true;
            clearTimeout(timeout);
            const errorMsg = `Child process exited prematurely with code ${code} for ${url}`;
            this.logger.warn(errorMsg);
            reject(new Error(errorMsg));
          }
        });

        // Send audit request to child process
        child.send({
          type: 'RUN_AUDIT',
          url,
          options: { categories, locale },
        });
      });

      // Record successful completion
      const durationSeconds = (Date.now() - startTime) / 1000;
      this.metricsService.recordJobCompleted(durationSeconds, url);


      // Send webhook if configured
      if (webhookUrl) {
        await this.sendWebhook(job.id as string, 'completed', result, webhookUrl, webhookToken);
      }

      return result;
    } catch (error) {
      // Record failure
      this.metricsService.recordJobFailed(error.message || 'unknown');

      // Send webhook if configured
      if (webhookUrl) {
        await this.sendWebhook(job.id as string, 'failed', { error: error.message || 'Unknown error' }, webhookUrl, webhookToken);
      }

      throw error;
    } finally {
      this.logger.log(`Job processing finished for ${url}`);
    }
  }

  /**
   * Send webhook notification with job results (fire-and-forget pattern)
   */
  private async sendWebhook(
    jobId: string,
    state: 'completed' | 'failed',
    result: any,
    webhookUrl: string,
    webhookToken?: string
  ): Promise<void> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (webhookToken) {
        headers['Authorization'] = `Bearer ${webhookToken}`;
      }

      // Format scores for IncluScan (multiply by 100: Lighthouse uses 0-1, IncluScan expects 0-100)
      const formattedResult = state === 'completed' && result.scores ? {
        ...result,
        scores: {
          performance: (result.scores.performance || 0) * 100,
          accessibility: (result.scores.accessibility || 0) * 100,
          seo: (result.scores.seo || 0) * 100,
          'best-practices': (result.scores['best-practices'] || 0) * 100,
        }
      } : result;

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ jobId, state, result: formattedResult }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.log(`✅ Webhook sent successfully for job ${jobId} to ${webhookUrl}`);
    } catch (error) {
      // Fire-and-forget: log error but don't fail the job
      this.logger.error(`❌ Failed to send webhook for job ${jobId}: ${error.message}`);
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} is now active`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}