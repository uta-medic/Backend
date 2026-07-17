import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SqlModule } from './database/sql.module';
import { DoctorAiModule } from './doctor-ai/doctor-ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SqlModule,
    DoctorAiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
