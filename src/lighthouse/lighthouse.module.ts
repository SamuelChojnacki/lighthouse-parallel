import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { LighthouseController } from './lighthouse.controller';
import { LighthouseDashboardController } from './lighthouse-dashboard.controller';
import { LighthouseService } from './lighthouse.service';
import { LighthouseProcessor } from './lighthouse.processor';
import { LighthouseCleanupService } from './lighthouse-cleanup.service';
import { RedisCleanupService } from './redis-cleanup.service';
import { LIGHTHOUSE_QUEUE } from '../config/queue.config';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: LIGHTHOUSE_QUEUE,
    }),
    MetricsModule,
  ],
  controllers: [LighthouseController, LighthouseDashboardController],
  providers: [
    LighthouseService,
    LighthouseProcessor,
    LighthouseCleanupService,
    RedisCleanupService,
  ],
})
export class LighthouseModule {}