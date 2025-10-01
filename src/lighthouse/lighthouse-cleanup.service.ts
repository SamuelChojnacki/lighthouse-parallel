import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LighthouseService } from './lighthouse.service';
import { CleanupResult, CleanupAllResult } from './interfaces/queue-stats.interface';

@Injectable()
export class LighthouseCleanupService {
  private readonly logger = new Logger(LighthouseCleanupService.name);

  constructor(private readonly lighthouseService: LighthouseService) {}

  /**
   * Clean up ALL jobs and Redis storage every hour
   * Removes everything: completed jobs, failed jobs, batches, and Redis data
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldJobs() {
    this.logger.log('Starting automatic complete cleanup (hourly)...');

    try {
      await this.cleanEverything();
      this.logger.log('Automatic cleanup completed successfully');
    } catch (error) {
      this.logger.error('Error during automatic cleanup:', error);
    }
  }

  /**
   * Clean EVERYTHING - BullMQ jobs, batches, and Redis storage
   * This is the ONLY cleanup method exposed to users
   */
  async cleanEverything(): Promise<CleanupAllResult> {
    this.logger.log('Complete cleanup triggered - cleaning EVERYTHING');

    const queue = this.lighthouseService.getQueue();

    // Clean ALL BullMQ jobs (completed and failed)
    const completedCleaned = await queue.clean(0, 10000, 'completed');
    const failedCleaned = await queue.clean(0, 10000, 'failed');

    // Clear all batch tracking from memory
    this.lighthouseService.clearAllBatches();

    const totalCleaned = completedCleaned.length + failedCleaned.length;
    const stats = await this.lighthouseService.getQueueStats();

    this.logger.log(
      `Complete cleanup done. Removed ${totalCleaned} jobs (${completedCleaned.length} completed, ${failedCleaned.length} failed), cleared all batches`,
    );

    return {
      cleaned: totalCleaned,
      completedCleaned: completedCleaned.length,
      failedCleaned: failedCleaned.length,
      stats,
    };
  }
}
