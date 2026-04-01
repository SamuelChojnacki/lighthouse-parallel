import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LighthouseService } from './lighthouse.service';
import { WebhookService } from './webhook.service';
import { CleanupAllResult } from './interfaces/queue-stats.interface';

@Injectable()
export class LighthouseCleanupService {
  private readonly logger = new Logger(LighthouseCleanupService.name);

  // Grace period before cleaning jobs (default: 5 minutes)
  // This prevents race conditions where jobs are removed while still finalizing
  private readonly gracePeriodMs: number;

  constructor(
    private readonly lighthouseService: LighthouseService,
    private readonly webhookService: WebhookService,
  ) {
    // Allow configuration via environment variable
    // Default to 5 minutes (300000ms) to give jobs time to complete
    this.gracePeriodMs = parseInt(
      process.env.CLEANUP_GRACE_PERIOD_MS || '300000',
      10,
    );

    this.logger.log(
      `Cleanup grace period: ${this.gracePeriodMs}ms (${this.gracePeriodMs / 60000} minutes)`,
    );
  }

  /**
   * Hourly cleanup - removes completed jobs only after webhooks are delivered
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldJobs() {
    this.logger.log('Starting automatic cleanup (hourly)...');

    try {
      await this.cleanEverything();
      this.logger.log('Automatic cleanup completed successfully');
    } catch (error) {
      this.logger.error('Error during automatic cleanup:', error);
    }
  }

  /**
   * Removes jobs with delivered webhooks. Jobs without webhooks are also cleaned.
   */
  async cleanEverything(): Promise<CleanupAllResult> {
    this.logger.log('Cleanup triggered - removing jobs with delivered webhooks');

    const lighthouseQueue = this.lighthouseService.getQueue();
    const webhookQueue = this.webhookService.getQueue();

    // 1. Get all completed Lighthouse jobs
    const completedLighthouseJobs = await lighthouseQueue.getJobs(['completed']);

    // 2. Get all completed webhook jobs → build Set of resolved Lighthouse job IDs
    const completedWebhooks = await webhookQueue.getJobs(['completed']);
    const resolvedJobIds = new Set(
      completedWebhooks.map((w) => w.data?.jobId).filter(Boolean),
    );

    this.logger.log(
      `Found ${completedLighthouseJobs.length} completed Lighthouse jobs, ` +
        `${resolvedJobIds.size} with resolved webhooks`,
    );

    // 3. Remove only Lighthouse jobs whose webhook is resolved (or no webhook configured)
    let completedCleaned = 0;
    let skippedPendingWebhook = 0;
    let skippedTooRecent = 0;

    for (const job of completedLighthouseJobs) {
      const jobId = job.id as string;

      // Safety check: Skip jobs completed within grace period
      // This prevents race conditions where job is still finalizing
      const jobAge = Date.now() - (job.finishedOn || job.processedOn || 0);
      if (jobAge < this.gracePeriodMs) {
        skippedTooRecent++;
        continue;
      }

      if (!job.data?.webhookUrl) {
        // No webhook configured - safe to remove
        await job.remove();
        completedCleaned++;
      } else if (resolvedJobIds.has(jobId)) {
        // Webhook delivered successfully - safe to remove
        await job.remove();
        completedCleaned++;
      } else {
        // Webhook not yet delivered - keep the job
        skippedPendingWebhook++;
      }
    }

    // 4. Clean failed Lighthouse jobs (always safe - no LHR to recover)
    // Use grace period to prevent race conditions with jobs still finalizing
    const failedCleaned = await lighthouseQueue.clean(
      this.gracePeriodMs,
      10000,
      'failed',
    );

    // 5. Clear only batches where ALL jobs have resolved webhooks
    this.lighthouseService.clearResolvedBatches(resolvedJobIds);

    // 6. Clean completed webhook jobs (they've served their purpose as "proof")
    // Use grace period to ensure webhooks are fully processed
    await webhookQueue.clean(this.gracePeriodMs, 10000, 'completed');

    const stats = await this.lighthouseService.getQueueStats();

    this.logger.log(
      `Cleanup done. Removed ${completedCleaned + failedCleaned.length} jobs ` +
        `(${completedCleaned} completed, ${failedCleaned.length} failed), ` +
        `skipped ${skippedPendingWebhook} pending webhook delivery, ` +
        `${skippedTooRecent} too recent (within grace period)`,
    );

    return {
      cleaned: completedCleaned + failedCleaned.length,
      completedCleaned,
      failedCleaned: failedCleaned.length,
      stats,
    };
  }
}
