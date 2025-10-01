import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Parallel Lighthouse Audits (e2e)', () => {
  let app: INestApplication;
  const API_KEY = process.env.API_KEY || 'wKuU92vSNq67J16/GF55q1s5SYgztBy5vqQ9lILuM+I=';

  // Test URLs - using fast, reliable sites
  const TEST_URLS = [
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

  describe('Batch Audit - 10 Parallel Audits', () => {
    it('should create batch audit with 10 URLs', async () => {
      const response = await request(app.getHttpServer())
        .post('/lighthouse/batch')
        .set('X-API-Key', API_KEY)
        .send({ urls: TEST_URLS })
        .expect(201);

      expect(response.body).toHaveProperty('batchId');
      expect(response.body).toHaveProperty('jobIds');
      expect(response.body.jobIds).toHaveLength(10);
      expect(response.body).toHaveProperty('total', 10);
      expect(response.body).toHaveProperty('status', 'queued');
    });

    it('should run 10 audits in parallel and complete successfully', async () => {
      const startTime = Date.now();

      // Create batch
      const createResponse = await request(app.getHttpServer())
        .post('/lighthouse/batch')
        .set('X-API-Key', API_KEY)
        .send({ urls: TEST_URLS })
        .expect(201);

      const { batchId, jobIds } = createResponse.body;

      expect(jobIds).toHaveLength(10);

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
      expect(batchStatus.total).toBe(10);
      expect(batchStatus.completed).toBeGreaterThan(0);

      // Verify parallel execution
      // If sequential: ~10 x 45s = 450s
      // If parallel: ~60-120s (depends on slowest + overhead)
      expect(totalDuration).toBeLessThan(180000); // < 3 minutes

      // Calculate speedup
      const avgAuditTime = 50000; // ~50s per audit
      const sequentialTime = avgAuditTime * 10;
      const speedup = sequentialTime / totalDuration;

      console.log(`Speedup: ${speedup.toFixed(2)}x`);
      expect(speedup).toBeGreaterThan(2); // At least 2x speedup

      // Verify individual job results
      const jobStatuses = await Promise.all(
        jobIds.map((jobId: string) =>
          request(app.getHttpServer())
            .get(`/lighthouse/job/${jobId}`)
            .set('X-API-Key', API_KEY),
        ),
      );

      const completedJobs = jobStatuses.filter(
        (res) => res.body.status === 'completed',
      );

      expect(completedJobs.length).toBeGreaterThan(0);

      // Verify Lighthouse results structure
      completedJobs.forEach((jobRes) => {
        const result = jobRes.body.result;
        expect(result).toHaveProperty('success', true);
        expect(result).toHaveProperty('lhr');
        expect(result.lhr).toHaveProperty('categories');
        expect(result.lhr.categories).toHaveProperty('performance');
        expect(result).toHaveProperty('duration');
        expect(result).toHaveProperty('url');
      });
    }, 300000); // 5 minute timeout

    it('should handle concurrent batches', async () => {
      const batch1Urls = TEST_URLS.slice(0, 5);
      const batch2Urls = TEST_URLS.slice(5, 10);

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
      expect(batch1Response.body.jobIds).toHaveLength(5);
      expect(batch2Response.body.jobIds).toHaveLength(5);
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
