import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TokenGuard } from '../auth/guards/token.guard';
import { TokenProtected } from '../auth/decorators/token-protected.decorator';

/**
 * Configuration endpoint for frontend
 * Returns public configuration needed by the client
 * Protected by JWT token to prevent unauthorized API Key exposure
 */
@ApiTags('configuration')
@Controller('config')
export class ConfigController {
  constructor(private configService: ConfigService) {}

  @Get('public')
  @TokenProtected()
  @UseGuards(TokenGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get public configuration for frontend',
    description:
      'Returns API Key for authenticated frontend users. Requires valid JWT token from /auth/login.',
  })
  @ApiResponse({
    status: 200,
    description: 'Public configuration retrieved successfully',
    schema: {
      example: {
        apiKey: 'your-api-key-here',
        workerConcurrency: 10,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or missing JWT token',
  })
  getPublicConfig() {
    const concurrencyValue = this.configService.get<string>('WORKER_CONCURRENCY');
    const workerConcurrency = parseInt(concurrencyValue, 10);

    return {
      apiKey: this.configService.get<string>('API_KEY'),
      workerConcurrency: workerConcurrency,
    };
  }
}
