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
  jobId: string;
}

// Get concurrency from environment with fallback
const workerConcurrency = process.env.WORKER_CONCURRENCY
  ? parseInt(process.env.WORKER_CONCURRENCY, 10)
  : undefined;

@Processor('lighthouse-audits', {
  ...(workerConcurrency && { concurrency: workerConcurrency })
})
export class LighthouseProcessor extends WorkerHost implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(LighthouseProcessor.name);
  private readonly concurrency: number;
  private activeJobs = 0;
  private shutdownTimeout = 120000; // 2 minutes max wait

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

  async onModuleDestroy() {
    this.logger.log('Graceful shutdown initiated, waiting for active jobs to complete...');

    const startTime = Date.now();
    while (this.activeJobs > 0 && Date.now() - startTime < this.shutdownTimeout) {
      this.logger.log(`Waiting for ${this.activeJobs} active jobs to complete...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (this.activeJobs > 0) {
      this.logger.warn(`Shutdown timeout reached. ${this.activeJobs} jobs still active.`);
    } else {
      this.logger.log('All jobs completed successfully. Processor shutdown complete.');
    }
  }

  async process(job: Job<LighthouseJobData>): Promise<any> {
    const { url, categories } = job.data;
    const startTime = Date.now();

    this.activeJobs++;
    this.metricsService.recordJobStart();
    this.metricsService.updateActiveWorkers(this.activeJobs);
    this.logger.log(`Starting Lighthouse audit for ${url} (Job: ${job.id}) - Active jobs: ${this.activeJobs}`);

    try {
      const result = await new Promise((resolve, reject) => {
        const workerPath = join(__dirname, 'workers', 'lighthouse-runner.js');

        // Fork a child process for isolation
        const child: ChildProcess = fork(workerPath, [], {
          stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        });

        // Timeout after 2 minutes
        const timeout = setTimeout(() => {
          child.kill('SIGKILL');
          reject(new Error(`Lighthouse audit timed out for ${url}`));
        }, 120000);

        // Handle messages from child process
        child.on('message', (msg: any) => {
          if (msg.type === 'AUDIT_RESULT') {
            clearTimeout(timeout);

            if (msg.result.success) {
              this.logger.log(
                `Completed audit for ${url} in ${msg.result.duration}ms`,
              );
              resolve(msg.result);
            } else {
              this.logger.error(`Audit failed for ${url}: ${msg.result.error}`);
              reject(new Error(msg.result.error));
            }
          }
        });

        // Handle errors
        child.on('error', (error) => {
          clearTimeout(timeout);
          this.logger.error(`Child process error for ${url}: ${error.message}`);
          reject(error);
        });

        child.on('exit', (code) => {
          clearTimeout(timeout);
          if (code !== 0) {
            this.logger.warn(`Child process exited with code ${code} for ${url}`);
          }
        });

        // Send audit request to child process
        child.send({
          type: 'RUN_AUDIT',
          url,
          options: { categories },
        });
      });

      // Record successful completion
      const durationSeconds = (Date.now() - startTime) / 1000;
      this.metricsService.recordJobCompleted(durationSeconds, url);

      return result;
    } catch (error) {
      // Record failure
      this.metricsService.recordJobFailed(error.message || 'unknown');
      throw error;
    } finally {
      this.activeJobs--;
      this.metricsService.updateActiveWorkers(this.activeJobs);
      this.logger.log(`Job completed for ${url} - Active jobs: ${this.activeJobs}`);
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