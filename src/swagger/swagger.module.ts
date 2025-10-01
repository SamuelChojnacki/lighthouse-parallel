import { Module } from '@nestjs/common';
import { SwaggerController } from './swagger.controller';

@Module({
  controllers: [SwaggerController],
})
export class SwaggerDocsModule {}
