import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LighthouseJobData } from './lighthouse.processor';
import { v4 as uuidv4 } from 'uuid';
import { LighthouseMetricsService } from '../metrics/lighthouse-metrics.service';

@Injectable()
export class LighthouseService {
  private readonly logger = new Logger(LighthouseService.name);
  private batches = new Map<string, { jobIds: string[]; urls: string[] }>();

  constructor(
    @InjectQueue('lighthouse-audits')
    private lighthouseQueue: Queue<LighthouseJobData>,
    private metricsService: LighthouseMetricsService,
  ) {}

  async addAudit(url: string, categories?: string[]) {
    const jobId = uuidv4();

    const job = await this.lighthouseQueue.add(
      'audit',
      {
        url,
        categories,
        jobId,
      },
      {
        jobId,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    this.logger.log(`Added audit job for ${url} (Job ID: ${job.id})`);

    return {
      jobId: job.id,
      url,
      status: 'queued',
    };
  }

  async addBatchAudits(urls: string[], categories?: string[]) {
    const batchId = uuidv4();
    const jobIds: string[] = [];

    this.logger.log(`Creating batch ${batchId} with ${urls.length} URLs`);

    for (const url of urls) {
      const jobId = uuidv4();
      await this.lighthouseQueue.add(
        'audit',
        {
          url,
          categories,
          jobId,
        },
        {
          jobId,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );
      jobIds.push(jobId);
    }

    this.batches.set(batchId, { jobIds, urls });

    return {
      batchId,
      jobIds,
      total: urls.length,
      status: 'queued',
    };
  }

  async getJobStatus(jobId: string) {
    const job = await this.lighthouseQueue.getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress;

    return {
      jobId: job.id,
      status: state,
      progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
      timestamp: job.timestamp,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
    };
  }

  async getBatchStatus(batchId: string) {
    const batch = this.batches.get(batchId);

    if (!batch) {
      return null;
    }

    const jobs = await Promise.all(
      batch.jobIds.map((jobId) => this.getJobStatus(jobId)),
    );

    const completed = jobs.filter((j) => j?.status === 'completed').length;
    const failed = jobs.filter((j) => j?.status === 'failed').length;
    const active = jobs.filter((j) => j?.status === 'active').length;
    const waiting = jobs.filter(
      (j) => j?.status === 'waiting' || j?.status === 'delayed',
    ).length;

    return {
      batchId,
      total: batch.jobIds.length,
      completed,
      failed,
      active,
      waiting,
      jobs: jobs.filter((j) => j !== null),
      urls: batch.urls,
    };
  }

  async getQueueStats() {
    const waiting = await this.lighthouseQueue.getWaitingCount();
    const active = await this.lighthouseQueue.getActiveCount();
    const completed = await this.lighthouseQueue.getCompletedCount();
    const failed = await this.lighthouseQueue.getFailedCount();

    // Update Prometheus metrics
    this.metricsService.updateQueueSize(waiting, active, completed, failed);

    return {
      waiting,
      active,
      completed,
      failed,
      total: waiting + active + completed + failed,
    };
  }

  /**
   * Expose queue instance for cleanup service
   */
  getQueue(): Queue<LighthouseJobData> {
    return this.lighthouseQueue;
  }
}