import { Controller, Post, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LighthouseService } from '../lighthouse.service';
import { LighthouseCleanupService } from '../lighthouse-cleanup.service';

/**
 * Controller dedicated to administration operations
 * Manages: stats, cleanup, monitoring
 */
@ApiTags('lighthouse')
@Controller('lighthouse')
export class LighthouseAdminController {
  constructor(
    private readonly lighthouseService: LighthouseService,
    private readonly cleanupService: LighthouseCleanupService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get queue statistics and worker status' })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics retrieved successfully',
    schema: {
      example: {
        waiting: 5,
        active: 3,
        completed: 120,
        failed: 2,
        total: 130,
      },
    },
  })
  async getStats() {
    return this.lighthouseService.getQueueStats();
  }

  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clean EVERYTHING - all jobs, batches, and Redis storage (auto runs every hour)',
  })
  @ApiResponse({
    status: 200,
    description: 'Complete cleanup successful',
    schema: {
      example: {
        cleaned: 150,
        completedCleaned: 120,
        failedCleaned: 30,
        stats: {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
        },
      },
    },
  })
  async triggerCompleteCleanup() {
    return this.cleanupService.cleanEverything();
  }

  @Get('batches')
  @ApiOperation({
    summary: 'Get all batches with their statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Batches retrieved successfully',
    schema: {
      example: [
        {
          batchId: '123e4567-e89b-12d3-a456-426614174000',
          total: 5,
          completed: 3,
          failed: 1,
          active: 1,
          waiting: 0,
          status: 'processing',
          urls: ['https://example.com', 'https://google.com'],
        },
      ],
    },
  })
  async getAllBatches() {
    return this.lighthouseService.getAllBatches();
  }
}
