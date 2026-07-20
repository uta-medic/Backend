import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

interface ApplicationOptions {
  enableSwagger?: boolean;
}

export function configureApplication(
  app: INestApplication,
  options: ApplicationOptions = {},
): INestApplication {
  const config = app.get(ConfigService);
  const prefix = config.get<string>('API_PREFIX', 'api/v1');
  const frontendUrl = config.get<string>(
    'FRONTEND_URL',
    'http://localhost:5173',
  );

  const correlationIdMiddleware = new CorrelationIdMiddleware();
  app.use(correlationIdMiddleware.use.bind(correlationIdMiddleware));
  app.setGlobalPrefix(prefix);
  app.use(helmet());
  app.enableCors({
    origin: [frontendUrl],
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id'],
    exposedHeaders: ['X-Correlation-Id'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(app.get(AllExceptionsFilter));
  app.enableShutdownHooks();

  const isDevelopment = config.get<string>('NODE_ENV') !== 'production';
  if (isDevelopment && options.enableSwagger !== false) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Utamedic API')
      .setDescription('API backend de Utamedic')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  return app;
}
