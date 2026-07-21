import { PartialType } from '@nestjs/swagger';
import { CreateMedicalTicketDto } from './create-medical-ticket.dto';

export class UpdateMedicalTicketDto extends PartialType(
  CreateMedicalTicketDto,
) {}
