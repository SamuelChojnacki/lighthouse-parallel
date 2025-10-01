import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { BullModule } from '@nestjs/bullmq';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './indicators/redis.health';
import { QueueHealthIndicator } from './indicators/queue.health';
import { LIGHTHOUSE_QUEUE } from '../config/queue.config';

@Module({
  imports: [
    TerminusModule,
    BullModule.registerQueue({
      name: LIGHTHOUSE_QUEUE,
    }),
  ],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, QueueHealthIndicator],
})
export class HealthModule {}
