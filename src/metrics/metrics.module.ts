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
import { MetricsDashboardController } from './metrics-dashboard.controller';
import { MetricsViewerController } from './metrics-viewer.controller';

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
  controllers: [MetricsDashboardController, MetricsViewerController],
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
