import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LighthouseService } from './lighthouse.service';

@Injectable()
export class LighthouseCleanupService {
  private readonly logger = new Logger(LighthouseCleanupService.name);

  constructor(private readonly lighthouseService: LighthouseService) {}

  /**
   * Clean up completed and failed jobs every hour
   * Keeps only jobs from the last 24 hours
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldJobs() {
    this.logger.log('Starting Redis cleanup job...');

    try {
      const queue = this.lighthouseService.getQueue();

      // Clean completed jobs older than 24 hours
      const completedCleaned = await queue.clean(24 * 60 * 60 * 1000, 1000, 'completed');
      this.logger.log(`Cleaned ${completedCleaned.length} completed jobs`);

      // Clean failed jobs older than 24 hours
      const failedCleaned = await queue.clean(24 * 60 * 60 * 1000, 1000, 'failed');
      this.logger.log(`Cleaned ${failedCleaned.length} failed jobs`);

      // Get current stats
      const stats = await this.lighthouseService.getQueueStats();
      this.logger.log(
        `Redis cleanup complete. Current queue size: ${stats.waiting + stats.active + stats.completed + stats.failed}`,
      );
    } catch (error) {
      this.logger.error('Error during Redis cleanup:', error);
    }
  }

  /**
   * Manual cleanup method (can be called via endpoint if needed)
   */
  async manualCleanup(): Promise<{ cleaned: number; stats: any }> {
    this.logger.log('Manual cleanup triggered');

    const queue = this.lighthouseService.getQueue();

    const completedCleaned = await queue.clean(24 * 60 * 60 * 1000, 1000, 'completed');
    const failedCleaned = await queue.clean(24 * 60 * 60 * 1000, 1000, 'failed');

    const totalCleaned = completedCleaned.length + failedCleaned.length;
    const stats = await this.lighthouseService.getQueueStats();

    this.logger.log(`Manual cleanup complete. Removed ${totalCleaned} jobs`);

    return {
      cleaned: totalCleaned,
      stats,
    };
  }
}
