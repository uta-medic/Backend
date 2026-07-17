import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sql from 'mssql';

@Injectable()
export class SqlService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SqlService.name);
  private pool: sql.ConnectionPool | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const server = this.configService.getOrThrow<string>('DB_SERVER');
    const database = this.configService.getOrThrow<string>('DB_DATABASE');
    const user = this.configService.getOrThrow<string>('DB_USER');
    const password = this.configService.getOrThrow<string>('DB_PASSWORD');
    const port = Number(this.configService.get<string>('DB_PORT') ?? '1433');

    const configuration: sql.config = {
      server,
      port,
      database,
      user,
      password,
      options: {
        encrypt: true,
        trustServerCertificate: false,
      },
      pool: {
        min: 0,
        max: 10,
        idleTimeoutMillis: 30_000,
      },
      connectionTimeout: 15_000,
      requestTimeout: 20_000,
    };

    try {
      this.pool = await new sql.ConnectionPool(configuration).connect();
      this.logger.log(`Conectado a Azure SQL: ${server}/${database}`);
    } catch (error) {
      this.logger.error('No se pudo conectar con Azure SQL', error);
      throw new InternalServerErrorException(
        'No se pudo establecer conexion con la base de datos.',
      );
    }
  }

  getPool(): sql.ConnectionPool {
    if (!this.pool?.connected) {
      throw new InternalServerErrorException(
        'La conexion SQL no esta disponible.',
      );
    }

    return this.pool;
  }

  createRequest(): sql.Request {
    return this.getPool().request();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
    }
  }
}
