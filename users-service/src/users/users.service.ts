import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { CreateUserDto } from './dto/create-user.dto';

// Modelo de datos de un usuario
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

// Servicio con la lógica CRUD de usuarios (almacenamiento en memoria)
@Injectable()
export class UsersService {
  private readonly logger = new Logger('USERS-SERVICE');

  // Datos iniciales (seed)
  private users: User[] = [
    {
      id: 1,
      name: 'Ana Torres',
      email: 'ana@example.com',
      createdAt: new Date(),
    },
    {
      id: 2,
      name: 'Carlos Rojas',
      email: 'carlos@example.com',
      createdAt: new Date(),
    },
  ];

  // Siguiente ID autoincremental
  private nextId = 3;

  // Archivo JSON donde se persisten los usuarios (montado como volumen Docker)
  private readonly storageFile = join(process.cwd(), 'data', 'users.json');

  constructor() {
    // Si ya existe un archivo guardado, se restaura en vez de usar los seeds
    this.load();
  }

  // Genera un timestamp con formato yyyy-MM-dd HH:mm:ss para los logs
  private timestamp(): string {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
  }

  // Registra cada operación realizada en el servicio
  private log(action: string): void {
    this.logger.log(`${this.timestamp()} - ${action}`);
  }

  // Persiste la lista actual de usuarios en el archivo JSON
  private save(): void {
    try {
      mkdirSync(dirname(this.storageFile), { recursive: true });
      writeFileSync(
        this.storageFile,
        JSON.stringify(this.users, null, 2),
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.warn(`No se pudo guardar ${this.storageFile}: ${reason}`);
    }
  }

  // Restaura los datos desde el archivo JSON si existe (persistencia)
  private load(): void {
    try {
      if (!existsSync(this.storageFile)) return;
      const raw = JSON.parse(
        readFileSync(this.storageFile, 'utf8'),
      ) as User[];
      this.users = raw.map((u) => ({ ...u, createdAt: new Date(u.createdAt) }));
      this.nextId = this.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
      this.logger.log('Datos restaurados desde el archivo de persistencia');
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.warn(`No se pudo cargar ${this.storageFile}: ${reason}`);
    }
  }

  // Verifica si ya existe un usuario con el mismo email
  private emailExists(email: string, excludeId?: number): boolean {
    const normalized = email.trim().toLowerCase();
    return this.users.some(
      (u) => u.id !== excludeId && u.email.trim().toLowerCase() === normalized,
    );
  }

  // Lista todos los usuarios
  findAll(): User[] {
    this.log('GET /users - Listando usuarios');
    return this.users;
  }

  // Obtiene un usuario por ID o lanza 404 si no existe
  findOne(id: number): User {
    this.log(`GET /users/${id} - Obteniendo usuario`);
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    return user;
  }

  // Crea un usuario nuevo con ID autoincremental
  create(dto: CreateUserDto): User {
    const name = dto.name.trim();
    const email = dto.email.trim();
    if (this.emailExists(email)) {
      throw new ConflictException(`Ya existe un usuario con el email "${email}"`);
    }
    this.log(`POST /users - Creando usuario: ${name}`);
    const user: User = {
      id: this.nextId++,
      name,
      email,
      createdAt: new Date(),
    };
    this.users.push(user);
    this.save();
    return user;
  }

  // Elimina un usuario del catálogo
  remove(id: number): Record<string, unknown> {
    this.log(`DELETE /users/${id} - Eliminando usuario`);
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    this.users.splice(index, 1);
    this.save();
    return { deleted: true, id, message: 'Usuario eliminado' };
  }
}