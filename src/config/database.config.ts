import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

function parseBoolean(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
}

export function createDatabaseConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'mssql',

    host: configService.getOrThrow<string>('DB_SERVER'),
    port: Number(configService.get<string>('DB_PORT') ?? 1433),

    username: configService.getOrThrow<string>('DB_USER'),
    password: configService.getOrThrow<string>('DB_PASSWORD'),
    database: configService.getOrThrow<string>('DB_DATABASE'),

    autoLoadEntities: true,

    // Más adelante utilizaremos migraciones.
    synchronize: parseBoolean(
      configService.get<string>('DB_SYNCHRONIZE'),
      false,
    ),

    logging: parseBoolean(configService.get<string>('DB_LOGGING'), false),

    options: {
      encrypt: parseBoolean(configService.get<string>('DB_ENCRYPT'), true),

      trustServerCertificate: parseBoolean(
        configService.get<string>('DB_TRUST_SERVER_CERTIFICATE'),
        false,
      ),
    },

    connectionTimeout: 30000,
    requestTimeout: 30000,
  };
}
