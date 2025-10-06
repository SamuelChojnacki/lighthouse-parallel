import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LIGHTHOUSE_QUEUE } from '../../config/queue.config';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(
    @InjectQueue(LIGHTHOUSE_QUEUE)
    private queue: Queue,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Try to ping Redis through the queue client
      const client = await this.queue.client;
      await client.ping();

      return this.getStatus(key, true, {
        message: 'Redis is up and running',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false, {
          message,
        }),
      );
    }
  }
}
