import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { queueConfig } from './config/queue.config';
import { LighthouseModule } from './lighthouse/lighthouse.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    queueConfig,
    MetricsModule,
    LighthouseModule,
    HealthModule,
  ],
})
export class AppModule {}