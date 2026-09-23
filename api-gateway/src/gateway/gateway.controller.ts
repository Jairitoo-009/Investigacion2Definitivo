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
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GatewayService } from './gateway.service';
import { TimingInterceptor } from './timing.interceptor';

// Controlador del API Gateway: punto de entrada único (/api/*)
@ApiTags('api-gateway')
@Controller('api')
@UseInterceptors(TimingInterceptor)
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  // Verifica que el API Gateway está vivo (exento del rate limiting)
  @Get('health')
  @SkipThrottle()
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

  // Límites de rate limiting por recurso (más estricto en usuarios)
  private static readonly USERS_LIMIT = { ttl: 15000, limit: 10 };

  // Redirige: lista todos los usuarios
  @Get('users')
  @Throttle({ default: GatewayController.USERS_LIMIT })
  @ApiOperation({ summary: 'Listar todos los usuarios (proxy al users-service)' })
  findAllUsers(@Req() req: Request): Promise<unknown> {
    return this.gatewayService.findAllUsers(req.originalUrl);
  }

  // Redirige: obtiene un usuario por ID
  @Get('users/:id')
  @Throttle({ default: GatewayController.USERS_LIMIT })
  @ApiOperation({ summary: 'Obtener un usuario por ID (proxy)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del usuario' })
  findOneUser(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<unknown> {
    return this.gatewayService.findOneUser(req.originalUrl, id);
  }

  // Redirige: crea un usuario
  @Post('users')
  @Throttle({ default: GatewayController.USERS_LIMIT })
  @ApiOperation({ summary: 'Crear un usuario (proxy)' })
  @ApiBody({ type: CreateUserDto })
  createUser(
    @Req() req: Request,
    @Body() body: CreateUserDto,
  ): Promise<unknown> {
    return this.gatewayService.createUser(req.originalUrl, body);
  }

  // Redirige: elimina un usuario
  @Delete('users/:id')
  @Throttle({ default: GatewayController.USERS_LIMIT })
  @ApiOperation({ summary: 'Eliminar un usuario (proxy)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del usuario' })
  removeUser(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<unknown> {
    return this.gatewayService.removeUser(req.originalUrl, id);
  }
}
