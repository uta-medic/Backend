import { Module } from '@nestjs/common';
import { FoundryUserService } from './foundry-user.service';
import { UserAiController } from './user-ai.controller';
import { UserAiService } from './user-ai.service';

@Module({
  controllers: [UserAiController],
  providers: [FoundryUserService, UserAiService],
})
export class UserAiModule {}
