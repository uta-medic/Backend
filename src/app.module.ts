import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MedicalFilesModule } from './medical-files/medical-files.module';

@Module({
  imports: [PrismaModule, MedicalFilesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}