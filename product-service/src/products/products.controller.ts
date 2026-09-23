import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductsService } from './products.service';

// Controlador del microservicio: gestiona /products y /health
@ApiTags('products')
@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Verifica que el servicio está vivo (usado por el healthcheck de Docker)
  @Get('health')
  @ApiOperation({ summary: 'Verificar que el Product Service está vivo' })
  health(): Record<string, string> {
    return {
      status: 'ok',
      service: 'product-service',
      timestamp: new Date().toISOString(),
    };
  }

  // Lista todos los productos
  @Get('products')
  @ApiOperation({ summary: 'Listar todos los productos' })
  findAll(): Product[] {
    return this.productsService.findAll();
  }

  // Obtiene un producto por su ID
  @Get('products/:id')
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del producto' })
  findOne(@Param('id', ParseIntPipe) id: number): Product {
    return this.productsService.findOne(id);
  }

  // Crea un nuevo producto
  @Post('products')
  @HttpCode(201)
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiBody({ type: CreateProductDto })
  create(@Body() dto: CreateProductDto): Product {
    return this.productsService.create(dto);
  }

  // Actualiza un producto existente
  @Put('products/:id')
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del producto' })
  @ApiBody({ type: UpdateProductDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ): Product {
    return this.productsService.update(id, dto);
  }

  // Elimina un producto
  @Delete('products/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del producto' })
  remove(@Param('id', ParseIntPipe) id: number): Record<string, unknown> {
    return this.productsService.remove(id);
  }
}
