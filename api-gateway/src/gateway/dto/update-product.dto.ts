import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

// DTO para la actualización: todos los campos del Create son opcionales
export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({ example: 'Laptop HP Actualizada' })
  declare name?: string;

  @ApiPropertyOptional({ example: 850 })
  declare price?: number;
}
