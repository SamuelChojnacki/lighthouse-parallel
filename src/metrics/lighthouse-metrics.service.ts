import { Injectable } from '@nestjs/common';
import {
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

// Counter for total jobs
export const JobsTotalCounter = makeCounterProvider({
  name: 'lighthouse_jobs_total',
  help: 'Total number of Lighthouse jobs',
  labelNames: ['status'] as const,
});

// Counter for failed jobs
export const JobsFailedCounter = makeCounterProvider({
  name: 'lighthouse_jobs_failed_total',
  help: 'Total number of failed Lighthouse jobs',
  labelNames: ['reason'] as const,
});

// Histogram for job duration
export const JobDurationHistogram = makeHistogramProvider({
  name: 'lighthouse_job_duration_seconds',
  help: 'Duration of Lighthouse jobs in seconds',
  labelNames: ['url_host'] as const,
  buckets: [5, 10, 20, 30, 60, 90, 120],
});

// Histogram for queue wait time
export const QueueWaitTimeHistogram = makeHistogramProvider({
  name: 'lighthouse_queue_wait_time_seconds',
  help: 'Time jobs spend waiting in queue',
  buckets: [1, 5, 10, 30, 60, 120, 300],
});

// Gauge for queue size
export const QueueSizeGauge = makeGaugeProvider({
  name: 'lighthouse_queue_size',
  help: 'Current size of the Lighthouse queue',
  labelNames: ['state'] as const,
});

// Gauge for active workers
export const ActiveWorkersGauge = makeGaugeProvider({
  name: 'lighthouse_active_workers',
  help: 'Number of currently active Lighthouse workers',
});

@Injectable()
export class LighthouseMetricsService {
  constructor(
    @InjectMetric('lighthouse_jobs_total')
    public readonly jobsTotal: Counter<'status'>,
    @InjectMetric('lighthouse_jobs_failed_total')
    public readonly jobsFailed: Counter<'reason'>,
    @InjectMetric('lighthouse_job_duration_seconds')
    public readonly jobDuration: Histogram<'url_host'>,
    @InjectMetric('lighthouse_queue_wait_time_seconds')
    public readonly queueWaitTime: Histogram,
    @InjectMetric('lighthouse_queue_size')
    public readonly queueSize: Gauge<'state'>,
    @InjectMetric('lighthouse_active_workers')
    public readonly activeWorkers: Gauge,
  ) {}

  recordJobStart() {
    this.jobsTotal.inc({ status: 'started' });
  }

  recordJobCompleted(durationSeconds: number, url: string) {
    this.jobsTotal.inc({ status: 'completed' });
    const urlHost = this.extractHost(url);
    this.jobDuration.observe({ url_host: urlHost }, durationSeconds);
  }

  recordJobFailed(reason: string) {
    this.jobsTotal.inc({ status: 'failed' });
    this.jobsFailed.inc({ reason });
  }

  recordQueueWaitTime(seconds: number) {
    this.queueWaitTime.observe(seconds);
  }

  updateQueueSize(waiting: number, active: number, completed: number, failed: number) {
    this.queueSize.set({ state: 'waiting' }, waiting);
    this.queueSize.set({ state: 'active' }, active);
    this.queueSize.set({ state: 'completed' }, completed);
    this.queueSize.set({ state: 'failed' }, failed);
  }

  updateActiveWorkers(count: number) {
    this.activeWorkers.set(count);
  }

  private extractHost(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return 'unknown';
    }
  }
}
