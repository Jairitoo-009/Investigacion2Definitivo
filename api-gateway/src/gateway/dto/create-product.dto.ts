import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

// DTO para la creación de productos (validado con class-validator)
export class CreateProductDto {
  @ApiProperty({ example: 'Monitor Samsung', description: 'Nombre del producto' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name!: string;

  @ApiProperty({
    example: 'Monitor 24 pulgadas',
    description: 'Descripción del producto',
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  description!: string;

  @ApiProperty({ example: 250, description: 'Precio del producto' })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  price!: number;

  @ApiProperty({ example: 15, description: 'Cantidad en stock' })
  @IsNumber({}, { message: 'El stock debe ser un número' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock!: number;
}
