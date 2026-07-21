import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  email: string;

  @IsString()
  password: string;
}