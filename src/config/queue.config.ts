import { BullModule } from '@nestjs/bullmq';

export const queueConfig = BullModule.forRoot({
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    username: process.env.REDIS_USERNAME || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const LIGHTHOUSE_QUEUE = 'lighthouse-audits';