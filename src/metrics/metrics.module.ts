import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import {
  LighthouseMetricsService,
  JobsTotalCounter,
  JobsFailedCounter,
  JobDurationHistogram,
  QueueWaitTimeHistogram,
  QueueSizeGauge,
  ActiveWorkersGauge,
} from './lighthouse-metrics.service';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'lighthouse_',
        },
      },
    }),
  ],
  providers: [
    LighthouseMetricsService,
    JobsTotalCounter,
    JobsFailedCounter,
    JobDurationHistogram,
    QueueWaitTimeHistogram,
    QueueSizeGauge,
    ActiveWorkersGauge,
  ],
  exports: [LighthouseMetricsService, PrometheusModule],
})
export class MetricsModule {}
