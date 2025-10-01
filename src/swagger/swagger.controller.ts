import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';

/**
 * Protected Swagger Documentation Endpoint
 *
 * This controller provides a secure way to access API documentation.
 * Requires valid API Key in X-API-Key header.
 *
 * The actual Swagger UI is served at /api but this endpoint
 * provides programmatic access to the documentation.
 */
@ApiTags('documentation')
@ApiSecurity('api-key')
@Controller('docs')
export class SwaggerController {
  @Get('info')
  @ApiOperation({
    summary: 'Get API documentation info',
    description: 'Returns information about accessing the Swagger documentation',
  })
  getDocumentation() {
    return {
      message: 'API Documentation is available',
      swaggerUI: '/api',
      swaggerJSON: '/api-json',
      note: 'Swagger UI requires API Key. Use the Authorize button in Swagger.',
    };
  }
}
