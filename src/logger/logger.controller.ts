import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LoggerService } from './logger.service';

@ApiTags('logs')
@Controller('logs')
export class LoggerController {
  constructor(private readonly loggerService: LoggerService) {}

  @Get()
  @ApiOperation({ summary: 'Get recent application logs' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of logs to retrieve (default: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Logs retrieved successfully',
    schema: {
      example: [
        {
          timestamp: '2025-10-01 23:45:12',
          level: 'info',
          message: 'Application started',
          context: 'NestFactory',
        },
      ],
    },
  })
  async getLogs(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    return this.loggerService.getRecentLogs(parsedLimit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get logs statistics' })
  @ApiResponse({
    status: 200,
    description: 'Stats retrieved successfully',
  })
  async getStats() {
    return this.loggerService.getLogsStats();
  }
}
