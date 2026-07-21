import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UserQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(1_000)
  message?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(1_000)
  query?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(1_000)
  consulta?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  location?: string;
}
