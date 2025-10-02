import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
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

  // Security headers with Helmet - configured to allow WebAssembly
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-eval'"], // Allow eval for WebAssembly
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
      },
    },
  }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Restrictive CORS - only allow specified origins
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:5173',
  ];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  });

  // Swagger Configuration with API Key security
  const config = new DocumentBuilder()
    .setTitle('Lighthouse Parallel API')
    .setDescription(
      '🔒 **PROTECTED API** - All endpoints require an API Key.\n\n' +
      'Production-ready API for running Lighthouse audits in parallel. ' +
      'Process multiple website performance audits concurrently with configurable workers.\n\n' +
      '**Authentication:** Click "Authorize" 🔓 below and enter your API Key.',
    )
    .setVersion('1.0')
    .addTag('lighthouse', 'Lighthouse audit operations')
    .addTag('health', 'Health check endpoints')
    .addTag('metrics', 'Prometheus metrics')
    .addTag('logs', 'Application logs')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key for authentication',
      },
      'api-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Setup Swagger with custom options
  // Note: Swagger UI itself is accessible, but ALL API endpoints require API Key
  // This means the documentation is viewable, but endpoints cannot be tested without authentication
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keep API key in browser storage
      docExpansion: 'none', // Collapse all sections by default
    },
    customSiteTitle: '🔒 Protected API Documentation',
  });

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