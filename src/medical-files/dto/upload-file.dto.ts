import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import { FILE_TYPES } from '../constants';

export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  patientCi: string;

  @IsIn(FILE_TYPES)
  fileType: (typeof FILE_TYPES)[number];

  @IsOptional()
  @IsString()
  description?: string;
}