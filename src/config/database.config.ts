import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { GABO_DATABASE_CONNECTION } from './database.constants';

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
    name: GABO_DATABASE_CONNECTION,
    type: 'mssql',

    host: configService.getOrThrow<string>('GABO_DB_SERVER'),
    port: Number(configService.get<string>('GABO_DB_PORT') ?? 1433),

    username: configService.getOrThrow<string>('GABO_DB_USER'),
    password: configService.getOrThrow<string>('GABO_DB_PASSWORD'),
    database: configService.getOrThrow<string>('GABO_DB_DATABASE'),

    autoLoadEntities: true,

    // Más adelante utilizaremos migraciones.
    synchronize: parseBoolean(
      configService.get<string>('GABO_DB_SYNCHRONIZE'),
      false,
    ),

    logging: parseBoolean(
      configService.get<string>('GABO_DB_LOGGING'),
      false,
    ),

    options: {
      encrypt: parseBoolean(
        configService.get<string>('GABO_DB_ENCRYPT'),
        true,
      ),

      trustServerCertificate: parseBoolean(
        configService.get<string>('GABO_DB_TRUST_SERVER_CERTIFICATE'),
        false,
      ),
    },

    connectionTimeout: 30000,
    requestTimeout: 30000,
  };
}
