import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { createDatabaseConfig } from './config/database.config';
import { AppointmentsModule } from './appointments/appointments.module';
import { TriageAssessmentsModule } from './triage-assessments/triage-assessments.module';
import { MedicalTicketsModule } from './medical-tickets/medical-tickets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions =>
        createDatabaseConfig(configService),
    }),

    AppointmentsModule,

    TriageAssessmentsModule,

    MedicalTicketsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
