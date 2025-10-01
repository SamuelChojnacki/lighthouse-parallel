import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { queueConfig } from './config/queue.config';
import { LighthouseModule } from './lighthouse/lighthouse.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { LoggerModule } from './logger/logger.module';
import { SwaggerDocsModule } from './swagger/swagger.module';
import { ConfigurationModule } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { ApiKeyGuard } from './auth/guards/api-key.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'frontend', 'dist'),
    }),
    queueConfig,
    LoggerModule,
    MetricsModule,
    LighthouseModule,
    HealthModule,
    SwaggerDocsModule,
    AuthModule,
    ConfigurationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}