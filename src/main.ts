import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { winstonConfig } from './common/logger/winston.config';

const logger = new Logger('Bootstrap');

function printBanner(port: number | string) {
  const banner = `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ⚡ LIGHTHOUSE API - Production Ready ⚡                    ║
║                                                               ║
║  🚀 Server:        http://localhost:${port}                       ║
║  📊 Dashboard:     http://localhost:${port}/lighthouse/dashboard  ║
║  📚 API Docs:      http://localhost:${port}/api                   ║
║  📈 Metrics:       http://localhost:${port}/metrics               ║
║  🏥 Health:        http://localhost:${port}/health                ║
║  ✅ Ready:         http://localhost:${port}/health/ready          ║
║                                                               ║
║  🔧 Workers: ${process.env.WORKER_CONCURRENCY || 5} concurrent audits                   ║
║  🗄️  Redis:  ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}                            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `;
  console.log('\x1b[36m%s\x1b[0m', banner);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: winstonConfig,
  });

  // Enable shutdown hooks for graceful shutdown
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Lighthouse Parallel API')
    .setDescription('Production-ready API for running Lighthouse audits in parallel. Process multiple website performance audits concurrently with configurable workers.')
    .setVersion('1.0')
    .addTag('lighthouse', 'Lighthouse audit operations')
    .addTag('health', 'Health check endpoints')
    .addTag('metrics', 'Prometheus metrics')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  // Print beautiful banner
  printBanner(port);

  // Graceful shutdown handling
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

  signals.forEach((signal) => {
    process.on(signal, async () => {
      logger.log(`Received ${signal}, starting graceful shutdown...`);

      try {
        // Close HTTP server (stop accepting new connections)
        await app.close();
        logger.log('Application closed successfully');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});