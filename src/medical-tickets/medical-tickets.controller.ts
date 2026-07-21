import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MedicalTicketsService } from './medical-tickets.service';
import { CreateMedicalTicketDto } from './dto/create-medical-ticket.dto';
import { UpdateMedicalTicketDto } from './dto/update-medical-ticket.dto';

@Controller('medical-tickets')
export class MedicalTicketsController {
  constructor(private readonly medicalTicketsService: MedicalTicketsService) {}

  @Post()
  create(@Body() createMedicalTicketDto: CreateMedicalTicketDto) {
    return this.medicalTicketsService.create(createMedicalTicketDto);
  }

  @Get()
  findAll() {
    return this.medicalTicketsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.medicalTicketsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMedicalTicketDto: UpdateMedicalTicketDto,
  ) {
    return this.medicalTicketsService.update(+id, updateMedicalTicketDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.medicalTicketsService.remove(+id);
  }
}
