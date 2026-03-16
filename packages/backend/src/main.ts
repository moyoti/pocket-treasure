import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting application...');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  logger.log('Nest application created');

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });
  logger.log('CORS enabled');

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Set global prefix
  app.setGlobalPrefix('api', {
    exclude: ['health'],
  });
  logger.log('API prefix set');

  // Health check endpoint (required by cloud hosting)
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (req: any, res: any) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const port = process.env.PORT || 3000;
  logger.log(`Preparing to listen on port: ${port}`);

  await app.listen(port);
  logger.log(`Treasure Hunt API running on port ${port}`);
  logger.log(`API address: http://localhost:${port}/api`);
}

bootstrap().catch(err => {
  console.error('Startup failed:', err);
  process.exit(1);
});