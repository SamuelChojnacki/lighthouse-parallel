import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { RedisHealthIndicator } from './indicators/redis.health';
import { QueueHealthIndicator } from './indicators/queue.health';

@ApiTags('health')
@Controller('health')
@Public()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private redis: RedisHealthIndicator,
    private queue: QueueHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness check - verifies the API is running' })
  @ApiResponse({
    status: 200,
    description: 'API is alive',
    schema: {
      example: {
        status: 'ok',
        info: { memory_heap: { status: 'up' } },
        error: {},
        details: { memory_heap: { status: 'up' } },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'API is not healthy' })
  check() {
    return this.health.check([
      // Basic liveness check - just memory
      () => this.memory.checkHeap('memory_heap', 8 * 1024 * 1024 * 1024), // 8GB
    ]);
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness check - verifies all dependencies are ready' })
  @ApiResponse({
    status: 200,
    description: 'API and all dependencies are ready',
    schema: {
      example: {
        status: 'ok',
        info: {
          memory_heap: { status: 'up' },
          redis: { status: 'up', message: 'Redis is up and running' },
          queue: { status: 'up', waiting: 0, active: 2, completed: 50, failed: 0 },
        },
        error: {},
        details: {
          memory_heap: { status: 'up' },
          redis: { status: 'up', message: 'Redis is up and running' },
          queue: { status: 'up', waiting: 0, active: 2, completed: 50, failed: 0 },
        },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'One or more dependencies are not ready' })
  checkReadiness() {
    return this.health.check([
      // Readiness check - all dependencies
      () => this.memory.checkHeap('memory_heap', 8 * 1024 * 1024 * 1024),
      () => this.redis.isHealthy('redis'),
      () => this.queue.isHealthy('queue'),
    ]);
  }
}
