import {
  INestApplication,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

interface ApplicationOptions {
  enableSwagger?: boolean;
}

const DEPLOYED_FRONTEND_ORIGIN = 'https://uta-medic.vercel.app';
const STATIC_WEB_APP_ORIGIN =
  'https://jolly-field-07dc5a10f.7.azurestaticapps.net';

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
  const configuredOrigins = config
    .get<string>('CORS_ORIGINS', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = new Set([
    frontendUrl,
    DEPLOYED_FRONTEND_ORIGIN,
    STATIC_WEB_APP_ORIGIN,
    ...configuredOrigins,
  ]);

  const correlationIdMiddleware = new CorrelationIdMiddleware();
  app.use(correlationIdMiddleware.use.bind(correlationIdMiddleware));
  app.setGlobalPrefix(prefix, {
    exclude: [
      { path: 'auth/login', method: RequestMethod.POST },
      { path: 'auth/register', method: RequestMethod.POST },
      { path: 'auth/profile', method: RequestMethod.GET },
    ],
  });
  app.use(helmet());
  app.enableCors({
    origin: (origin, callback) => {
      callback(null, !origin || allowedOrigins.has(origin));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Correlation-Id',
      'X-Doctor-User-Id',
      'X-Doctor-Id',
    ],
    exposedHeaders: ['X-Correlation-Id'],
    maxAge: 86_400,
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
