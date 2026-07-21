import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class AnalyzePatientDto {
  @IsUUID()
  patientId!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(1_000)
  question!: string;
}
