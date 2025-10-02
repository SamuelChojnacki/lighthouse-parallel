// Set WORKER_CONCURRENCY before any imports
// Use CI value if set, otherwise default to 8 for local testing
if (!process.env.WORKER_CONCURRENCY) {
  process.env.WORKER_CONCURRENCY = '8';
}

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Parallel Lighthouse Audits (e2e)', () => {
  let app: INestApplication;
  const API_KEY = process.env.API_KEY || 'wKuU92vSNq67J16/GF55q1s5SYgztBy5vqQ9lILuM+I=';

  // Test URLs - using fast, reliable sites (reduced to 5 for faster CI)
  const TEST_URLS_5 = [
    'https://example.com',
    'https://www.google.com',
    'https://github.com',
    'https://stackoverflow.com',
    'https://www.npmjs.com',
  ];

  // Full test set for local dev (10 URLs)
  const TEST_URLS_10 = [
    'https://example.com',
    'https://www.google.com',
    'https://github.com',
    'https://stackoverflow.com',
    'https://www.npmjs.com',
    'https://nestjs.com',
    'https://en.wikipedia.org',
    'https://www.reddit.com',
    'https://twitter.com',
    'https://www.linkedin.com',
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Single Audit', () => {
    it('should create a single audit job', async () => {
      const response = await request(app.getHttpServer())
        .post('/lighthouse/audit')
        .set('X-API-Key', API_KEY)
        .send({ url: 'https://example.com' })
        .expect(201);

      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('url', 'https://example.com');
      expect(response.body).toHaveProperty('status', 'queued');
    });

    it('should get job status', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/lighthouse/audit')
        .set('X-API-Key', API_KEY)
        .send({ url: 'https://example.com' })
        .expect(201);

      const jobId = createResponse.body.jobId;

      const statusResponse = await request(app.getHttpServer())
        .get(`/lighthouse/job/${jobId}`)
        .set('X-API-Key', API_KEY)
        .expect(200);

      expect(statusResponse.body).toHaveProperty('jobId', jobId);
      expect(statusResponse.body).toHaveProperty('status');
    });
  });

  describe('Batch Audit - Parallel Audits', () => {
    it('should create batch audit with 5 URLs', async () => {
      const response = await request(app.getHttpServer())
        .post('/lighthouse/batch')
        .set('X-API-Key', API_KEY)
        .send({ urls: TEST_URLS_5 })
        .expect(201);

      expect(response.body).toHaveProperty('batchId');
      expect(response.body).toHaveProperty('jobIds');
      expect(response.body.jobIds).toHaveLength(5);
      expect(response.body).toHaveProperty('total', 5);
      expect(response.body).toHaveProperty('status', 'queued');
    });

    it('should run 5 audits in parallel and complete successfully', async () => {
      const startTime = Date.now();

      // Create batch
      const createResponse = await request(app.getHttpServer())
        .post('/lighthouse/batch')
        .set('X-API-Key', API_KEY)
        .send({ urls: TEST_URLS_5 })
        .expect(201);

      const { batchId, jobIds } = createResponse.body;

      expect(jobIds).toHaveLength(5);

      // Wait for completion (max 5 minutes)
      const maxWaitTime = 300000; // 5 minutes
      const pollInterval = 5000; // Check every 5 seconds
      let completed = false;
      let batchStatus: any;

      while (!completed && Date.now() - startTime < maxWaitTime) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        const statusResponse = await request(app.getHttpServer())
          .get(`/lighthouse/batch/${batchId}`)
          .set('X-API-Key', API_KEY)
          .expect(200);

        batchStatus = statusResponse.body;

        console.log(
          `Batch progress: ${batchStatus.completed}/${batchStatus.total} completed, ` +
            `${batchStatus.active} active, ${batchStatus.failed} failed`,
        );

        if (batchStatus.completed + batchStatus.failed === batchStatus.total) {
          completed = true;
        }
      }

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      console.log(`Total duration: ${totalDuration}ms (${totalDuration / 1000}s)`);

      // Assertions
      expect(completed).toBe(true);
      expect(batchStatus.total).toBe(5);
      expect(batchStatus.completed).toBeGreaterThan(0);

      // Verify parallel execution based on worker concurrency
      const workerCount = parseInt(process.env.WORKER_CONCURRENCY || '8', 10);

      // Adjust expectations based on worker count
      // With 1 worker: sequential execution, no speedup
      // With 8 workers: significant speedup expected
      if (workerCount === 1) {
        // For CI with 1 worker, just verify it completes
        console.log(`Running with 1 worker (CI mode) - Sequential execution`);
        expect(totalDuration).toBeLessThan(600000); // < 10 minutes for CI
      } else {
        // For local dev with multiple workers
        expect(totalDuration).toBeLessThan(180000); // < 3 minutes

        // Calculate speedup
        const avgAuditTime = 30000; // ~30s per audit
        const sequentialTime = avgAuditTime * 5;
        const speedup = sequentialTime / totalDuration;

        console.log(`Speedup with ${workerCount} workers: ${speedup.toFixed(2)}x`);
        expect(speedup).toBeGreaterThan(2); // At least 2x speedup with multiple workers
      }

      // Just verify completion without fetching individual results
      // The batch status already shows all jobs completed
    }, 600000); // 10 minute timeout for CI with 1 worker

    it('should handle concurrent batches', async () => {
      const batch1Urls = TEST_URLS_5.slice(0, 3);
      const batch2Urls = TEST_URLS_5.slice(3, 5);

      // Launch 2 batches simultaneously
      const [batch1Response, batch2Response] = await Promise.all([
        request(app.getHttpServer())
          .post('/lighthouse/batch')
          .set('X-API-Key', API_KEY)
          .send({ urls: batch1Urls }),
        request(app.getHttpServer())
          .post('/lighthouse/batch')
          .set('X-API-Key', API_KEY)
          .send({ urls: batch2Urls }),
      ]);

      expect(batch1Response.status).toBe(201);
      expect(batch2Response.status).toBe(201);
      expect(batch1Response.body.jobIds).toHaveLength(3);
      expect(batch2Response.body.jobIds).toHaveLength(2);
    });
  });

  describe('Queue Stats', () => {
    it('should return queue statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/lighthouse/stats')
        .set('X-API-Key', API_KEY)
        .expect(200);

      expect(response.body).toHaveProperty('waiting');
      expect(response.body).toHaveProperty('active');
      expect(response.body).toHaveProperty('completed');
      expect(response.body).toHaveProperty('failed');
      expect(response.body).toHaveProperty('total');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent job', async () => {
      await request(app.getHttpServer())
        .get('/lighthouse/job/non-existent-id')
        .set('X-API-Key', API_KEY)
        .expect(404);
    });

    it('should return 404 for non-existent batch', async () => {
      await request(app.getHttpServer())
        .get('/lighthouse/batch/non-existent-id')
        .set('X-API-Key', API_KEY)
        .expect(404);
    });

    it('should validate URLs', async () => {
      await request(app.getHttpServer())
        .post('/lighthouse/audit')
        .set('X-API-Key', API_KEY)
        .send({ url: 'not-a-valid-url' })
        .expect(400);
    });

    it('should reject requests without API key', async () => {
      await request(app.getHttpServer())
        .post('/lighthouse/audit')
        .send({ url: 'https://example.com' })
        .expect(401);
    });
  });
});
