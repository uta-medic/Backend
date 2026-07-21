import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import 'mssql';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validateEnvironment } from './config/environment.config';
import { DatabaseModule } from './database/database.module';
import { DoctorAiModule } from './doctor-ai/doctor-ai.module';
import { HealthModule } from './health/health.module';
import { SignalingGateway } from './signaling/signaling.gateway';
import { UserAiModule } from './user-ai/user-ai.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: validateEnvironment,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mssql',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT')),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
        connectionTimeout: 30_000,
        requestTimeout: 30_000,
        options: {
          encrypt: true,
          trustServerCertificate: false,
        },
      }),
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    DoctorAiModule,
    HealthModule,
    UserAiModule,
  ],
  controllers: [AppController],
  providers: [AppService, AllExceptionsFilter, SignalingGateway],
})
export class AppModule {}
