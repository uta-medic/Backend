import { Injectable } from '@nestjs/common';
import { UserQueryDto } from './dto/user-query.dto';
import { FoundryUserService } from './foundry-user.service';

@Injectable()
export class UserAiService {
  constructor(private readonly foundryUserService: FoundryUserService) {}

  async answer(dto: UserQueryDto) {
    const answer = await this.foundryUserService.answer(dto);

    return {
      answer,
      generatedAt: new Date().toISOString(),
      disclaimer:
        'Orientacion general. No reemplaza una evaluacion medica profesional.',
    };
  }
}
