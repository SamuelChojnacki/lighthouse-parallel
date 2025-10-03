import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { LighthouseService } from '../lighthouse.service';
import { AuditRequestDto, BatchAuditDto } from '../dto/audit-request.dto';

/**
 * Controller dédié aux opérations d'audit Lighthouse
 * Gère : création d'audits, batches, récupération de résultats
 */
@ApiTags('lighthouse')
@Controller('lighthouse')
export class LighthouseAuditController {
  constructor(private readonly lighthouseService: LighthouseService) {}

  @Post('audit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a single Lighthouse audit job' })
  @ApiResponse({
    status: 201,
    description: 'Audit job created successfully',
    schema: {
      example: {
        jobId: 'abc123-def456-ghi789',
        url: 'https://example.com',
        status: 'pending',
        message: 'Audit job queued successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid URL or parameters' })
  async createAudit(@Body(ValidationPipe) auditDto: AuditRequestDto) {
    return this.lighthouseService.addAudit(
      auditDto.url,
      auditDto.categories,
    );
  }

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create batch Lighthouse audit jobs for multiple URLs',
  })
  @ApiResponse({
    status: 201,
    description: 'Batch audit jobs created successfully',
    schema: {
      example: {
        batchId: 'batch-xyz789',
        jobIds: ['job-1', 'job-2'],
        total: 2,
        status: 'queued',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid URLs or parameters' })
  async createBatchAudit(@Body(ValidationPipe) batchDto: BatchAuditDto) {
    return this.lighthouseService.addBatchAudits(
      batchDto.urls,
      batchDto.categories,
      batchDto.webhookUrl,
      batchDto.webhookToken,
    );
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get status and results of a single audit job' })
  @ApiParam({
    name: 'jobId',
    description: 'The unique job ID returned when creating an audit',
  })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved successfully',
    schema: {
      example: {
        jobId: 'abc123-def456-ghi789',
        state: 'completed',
        progress: 100,
        result: {
          success: true,
          scores: {
            performance: 100,
            accessibility: 95,
          },
          duration: 8600,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobStatus(@Param('jobId') jobId: string) {
    const status = await this.lighthouseService.getJobStatus(jobId);

    if (!status) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    return status;
  }

  @Get('batch/:batchId')
  @ApiOperation({ summary: 'Get status and results of a batch audit' })
  @ApiParam({
    name: 'batchId',
    description: 'The unique batch ID returned when creating a batch audit',
  })
  @ApiResponse({
    status: 200,
    description: 'Batch status retrieved successfully',
    schema: {
      example: {
        batchId: 'batch-xyz789',
        total: 3,
        completed: 2,
        failed: 0,
        active: 1,
        waiting: 0,
        jobs: [
          { jobId: 'job-1', url: 'https://example.com', status: 'completed' },
          { jobId: 'job-2', url: 'https://google.com', status: 'completed' },
          { jobId: 'job-3', url: 'https://github.com', status: 'active' },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async getBatchStatus(@Param('batchId') batchId: string) {
    const status = await this.lighthouseService.getBatchStatus(batchId);

    if (!status) {
      throw new NotFoundException(`Batch ${batchId} not found`);
    }

    return status;
  }
}
