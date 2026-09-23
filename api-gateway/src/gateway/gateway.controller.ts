import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GatewayService } from './gateway.service';
import { TimingInterceptor } from './timing.interceptor';

// Controlador del API Gateway: punto de entrada único (/api/*)
@ApiTags('api-gateway')
@Controller('api')
@UseInterceptors(TimingInterceptor)
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  // Verifica que el API Gateway está vivo
  @Get('health')
  @ApiOperation({ summary: 'Verificar que el API Gateway está vivo' })
  health(): Record<string, string> {
    return {
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
    };
  }

  // Redirige: lista todos los productos
  @Get('products')
  @ApiOperation({ summary: 'Listar todos los productos (proxy al product-service)' })
  findAll(@Req() req: Request): Promise<unknown> {
    return this.gatewayService.findAll(req.originalUrl);
  }

  // Redirige: obtiene un producto por ID
  @Get('products/:id')
  @ApiOperation({ summary: 'Obtener un producto por ID (proxy)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del producto' })
  findOne(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<unknown> {
    return this.gatewayService.findOne(req.originalUrl, id);
  }

  // Redirige: crea un producto
  @Post('products')
  @ApiOperation({ summary: 'Crear un producto (proxy)' })
  @ApiBody({ type: CreateProductDto })
  create(
    @Req() req: Request,
    @Body() body: CreateProductDto,
  ): Promise<unknown> {
    return this.gatewayService.create(req.originalUrl, body);
  }

  // Redirige: actualiza un producto
  @Put('products/:id')
  @ApiOperation({ summary: 'Actualizar un producto (proxy)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del producto' })
  @ApiBody({ type: UpdateProductDto })
  update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProductDto,
  ): Promise<unknown> {
    return this.gatewayService.update(req.originalUrl, id, body);
  }

  // Redirige: elimina un producto
  @Delete('products/:id')
  @ApiOperation({ summary: 'Eliminar un producto (proxy)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del producto' })
  remove(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<unknown> {
    return this.gatewayService.remove(req.originalUrl, id);
  }
}
