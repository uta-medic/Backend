import { Body, Controller, Post } from '@nestjs/common';
import { UserQueryDto } from './dto/user-query.dto';
import { UserAiService } from './user-ai.service';

@Controller('user-ai')
export class UserAiController {
  constructor(private readonly userAiService: UserAiService) {}

  @Post('chat')
  async chat(@Body() dto: UserQueryDto) {
    return this.userAiService.answer(dto);
  }
}
