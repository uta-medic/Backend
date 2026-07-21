import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CreateTriageAssessmentDto } from './dto/create-triage-assessment.dto';
import { ReviewTriageAssessmentDto } from './dto/review-triage-assessment.dto';
import { TriageAssessment } from './entities/triage-assessment.entity';
import { TriageAssessmentsService } from './triage-assessments.service';

@ApiTags('Evaluación de síntomas')
@Controller('triage-assessments')
export class TriageAssessmentsController {
  constructor(private readonly triageService: TriageAssessmentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar los síntomas declarados por un paciente',
  })
  @ApiCreatedResponse({
    description:
      'Los síntomas fueron registrados y están pendientes de revisión',
    type: TriageAssessment,
  })
  @ApiNotFoundResponse({
    description: 'No se encontró la cita relacionada',
  })
  @ApiConflictResponse({
    description: 'La cita ya tiene una evaluación registrada',
  })
  create(
    @Body() createDto: CreateTriageAssessmentDto,
  ): Promise<TriageAssessment> {
    return this.triageService.create(createDto);
  }

  @Get('pending')
  @ApiOperation({
    summary: 'Obtener las evaluaciones pendientes de revisión médica',
  })
  @ApiOkResponse({
    description: 'Listado de evaluaciones pendientes de revisión',
    type: TriageAssessment,
    isArray: true,
  })
  findPending(): Promise<TriageAssessment[]> {
    return this.triageService.findPending();
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las evaluaciones de síntomas',
  })
  @ApiOkResponse({
    type: TriageAssessment,
    isArray: true,
  })
  findAll(): Promise<TriageAssessment[]> {
    return this.triageService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una evaluación por su identificador',
  })
  @ApiOkResponse({
    type: TriageAssessment,
  })
  @ApiNotFoundResponse({
    description: 'No se encontró la evaluación',
  })
  findOne(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      }),
    )
    id: string,
  ): Promise<TriageAssessment> {
    return this.triageService.findOne(id);
  }

  @Patch(':id/review')
  @ApiOperation({
    summary: 'Asignar prioridad después de la revisión médica',
  })
  @ApiOkResponse({
    description: 'La evaluación fue revisada correctamente',
    type: TriageAssessment,
  })
  @ApiBadRequestResponse({
    description: 'La evaluación ya fue revisada o no puede modificarse',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró la evaluación',
  })
  review(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      }),
    )
    id: string,
    @Body() reviewDto: ReviewTriageAssessmentDto,
  ): Promise<TriageAssessment> {
    return this.triageService.review(id, reviewDto);
  }
}
