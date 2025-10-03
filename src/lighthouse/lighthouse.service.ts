import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LighthouseJobData } from './lighthouse.processor';
import { randomUUID } from 'crypto';
import { LighthouseMetricsService } from '../metrics/lighthouse-metrics.service';
import { QueueStats } from './interfaces/queue-stats.interface';

@Injectable()
export class LighthouseService {
  private readonly logger = new Logger(LighthouseService.name);
  private batches = new Map<string, { jobIds: string[]; urls: string[] }>();

  constructor(
    @InjectQueue('lighthouse-audits')
    private lighthouseQueue: Queue<LighthouseJobData>,
    private metricsService: LighthouseMetricsService,
  ) {}

  async addAudit(url: string, categories?: string[], locale?: string) {
    const jobId = randomUUID();

    const job = await this.lighthouseQueue.add(
      'audit',
      {
        url,
        categories,
        locale,
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

  async addBatchAudits(urls: string[], categories?: string[], webhookUrl?: string, webhookToken?: string, locale?: string) {
    const batchId = randomUUID();
    const jobIds: string[] = [];

    this.logger.log(`Creating batch ${batchId} with ${urls.length} URLs`);

    for (const url of urls) {
      const jobId = randomUUID();
      await this.lighthouseQueue.add(
        'audit',
        {
          url,
          categories,
          locale,
          jobId,
          webhookUrl,
          webhookToken,
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

    // Calculate timing stats
    const completedJobs = jobs.filter((j) => j?.status === 'completed' && j?.finishedOn);
    const avgDuration = completedJobs.length > 0
      ? completedJobs.reduce((sum, j) => {
          const duration = j.finishedOn - j.processedOn;
          return sum + duration;
        }, 0) / completedJobs.length
      : 0;

    return {
      batchId,
      total: batch.jobIds.length,
      completed,
      failed,
      active,
      waiting,
      avgDuration: Math.round(avgDuration),
      jobs: jobs.filter((j) => j !== null),
      urls: batch.urls,
    };
  }

  async getAllBatches() {
    const batchIds = Array.from(this.batches.keys());

    const batchesWithStats = await Promise.all(
      batchIds.map(async (batchId) => {
        const batch = this.batches.get(batchId);
        const jobs = await Promise.all(
          batch.jobIds.map((jobId) => this.getJobStatus(jobId)),
        );

        // Si tous les jobs ont été supprimés (cleanup), on nettoie le batch
        const validJobs = jobs.filter(j => j !== null);
        if (validJobs.length === 0) {
          this.batches.delete(batchId);
          this.logger.log(`Removed batch ${batchId} (all jobs cleaned)`);
          return null;
        }

        const completed = jobs.filter((j) => j?.status === 'completed').length;
        const failed = jobs.filter((j) => j?.status === 'failed').length;
        const active = jobs.filter((j) => j?.status === 'active').length;
        const waiting = jobs.filter(
          (j) => j?.status === 'waiting' || j?.status === 'delayed',
        ).length;

        const status = active > 0 ? 'processing' :
                      waiting > 0 ? 'waiting' :
                      completed === batch.jobIds.length ? 'completed' :
                      failed > 0 ? 'partial' : 'unknown';

        return {
          batchId,
          total: batch.jobIds.length,
          completed,
          failed,
          active,
          waiting,
          status,
          urls: batch.urls.slice(0, 3), // Only first 3 URLs for summary
        };
      }),
    );

    // Filtrer les batches null et trier par plus récent
    return batchesWithStats.filter(b => b !== null).reverse();
  }

  async getQueueStats(): Promise<QueueStats> {
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

  /**
   * Clear all batch tracking (used during cleanup)
   */
  clearAllBatches() {
    const count = this.batches.size;
    this.batches.clear();
    this.logger.log(`Cleared ${count} batch(es) from memory`);
  }
}