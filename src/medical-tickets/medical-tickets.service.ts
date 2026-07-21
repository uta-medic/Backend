import { Injectable } from '@nestjs/common';

import { CreateMedicalTicketDto } from './dto/create-medical-ticket.dto';
import { UpdateMedicalTicketDto } from './dto/update-medical-ticket.dto';

@Injectable()
export class MedicalTicketsService {
  create(createMedicalTicketDto: CreateMedicalTicketDto): string {
    void createMedicalTicketDto;

    return 'Esta acción genera una nueva ficha médica';
  }

  findAll(): string {
    return 'Esta acción devuelve todas las fichas médicas';
  }

  findOne(id: number): string {
    return `Esta acción devuelve la ficha médica ${id}`;
  }

  update(id: number, updateMedicalTicketDto: UpdateMedicalTicketDto): string {
    void updateMedicalTicketDto;

    return `Esta acción actualiza la ficha médica ${id}`;
  }

  remove(id: number): string {
    return `Esta acción elimina la ficha médica ${id}`;
  }
}
