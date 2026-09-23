import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UsersService } from './users.service';

// Controlador del microservicio: gestiona /users y /health
@ApiTags('users')
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Verifica que el servicio está vivo (usado por el healthcheck de Docker)
  @Get('health')
  @ApiOperation({ summary: 'Verificar que el Users Service está vivo' })
  health(): Record<string, string> {
    return {
      status: 'ok',
      service: 'users-service',
      timestamp: new Date().toISOString(),
    };
  }

  // Lista todos los usuarios
  @Get('users')
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  findAll(): User[] {
    return this.usersService.findAll();
  }

  // Obtiene un usuario por su ID
  @Get('users/:id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del usuario' })
  findOne(@Param('id', ParseIntPipe) id: number): User {
    return this.usersService.findOne(id);
  }

  // Crea un nuevo usuario
  @Post('users')
  @HttpCode(201)
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiBody({ type: CreateUserDto })
  create(@Body() dto: CreateUserDto): User {
    return this.usersService.create(dto);
  }

  // Elimina un usuario
  @Delete('users/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Eliminar un usuario' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del usuario' })
  remove(@Param('id', ParseIntPipe) id: number): Record<string, unknown> {
    return this.usersService.remove(id);
  }
}