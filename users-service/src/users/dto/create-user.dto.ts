import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

// DTO para la creación de usuarios (validado con class-validator)
export class CreateUserDto {
  @ApiProperty({ example: 'Ana Torres', description: 'Nombre del usuario' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name!: string;

  @ApiProperty({ example: 'ana@example.com', description: 'Correo del usuario' })
  @IsString({ message: 'El email debe ser una cadena de texto' })
  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  @MaxLength(120, { message: 'El email es demasiado largo' })
  email!: string;
}