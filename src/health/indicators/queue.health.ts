import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LIGHTHOUSE_QUEUE } from '../../config/queue.config';

@Injectable()
export class QueueHealthIndicator extends HealthIndicator {
  constructor(
    @InjectQueue(LIGHTHOUSE_QUEUE)
    private queue: Queue,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Get queue counts to verify it's accessible
      const counts = await this.queue.getJobCounts();

      const isHealthy = typeof counts.waiting !== 'undefined';

      if (!isHealthy) {
        throw new Error('Queue is not accessible');
      }

      return this.getStatus(key, true, {
        waiting: counts.waiting,
        active: counts.active,
        completed: counts.completed,
        failed: counts.failed,
      });
    } catch (error) {
      throw new HealthCheckError(
        'Queue health check failed',
        this.getStatus(key, false, {
          message: error.message,
        }),
      );
    }
  }
}
