import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

/**
 * Configuration endpoint for frontend
 * Returns public configuration needed by the client
 */
@ApiTags('configuration')
@Controller('config')
@Public() // This endpoint is public - needed for frontend to bootstrap
export class ConfigController {
  constructor(private configService: ConfigService) {}

  @Get('public')
  @ApiOperation({
    summary: 'Get public configuration for frontend',
    description: 'Returns configuration values needed by the frontend application',
  })
  @ApiResponse({
    status: 200,
    description: 'Public configuration retrieved successfully',
    schema: {
      example: {
        apiKey: 'your-api-key-here',
      },
    },
  })
  getPublicConfig() {
    return {
      apiKey: this.configService.get<string>('API_KEY'),
    };
  }
}
