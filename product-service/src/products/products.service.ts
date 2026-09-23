import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

// Modelo de datos de un producto
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  createdAt: Date;
}

// Servicio con la lógica CRUD de productos (almacenamiento en memoria)
@Injectable()
export class ProductsService {
  private readonly logger = new Logger('PRODUCT-SERVICE');

  // Datos iniciales (seed) del catálogo
  private products: Product[] = [
    {
      id: 1,
      name: 'Laptop HP',
      description: 'Laptop 15 pulgadas',
      price: 800,
      stock: 10,
      createdAt: new Date(),
    },
    {
      id: 2,
      name: 'Mouse Logitech',
      description: 'Mouse inalámbrico',
      price: 25,
      stock: 50,
      createdAt: new Date(),
    },
    {
      id: 3,
      name: 'Teclado Mecánico',
      description: 'Teclado RGB',
      price: 120,
      stock: 30,
      createdAt: new Date(),
    },
  ];

  // Siguiente ID autoincremental
  private nextId = 4;

  // Archivo JSON donde se persisten los productos (montado como volumen Docker)
  private readonly storageFile = join(process.cwd(), 'data', 'products.json');

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

  // Persiste la lista actual de productos en el archivo JSON
  private save(): void {
    try {
      mkdirSync(dirname(this.storageFile), { recursive: true });
      writeFileSync(
        this.storageFile,
        JSON.stringify(this.products, null, 2),
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
      ) as Product[];
      this.products = raw.map((p) => ({ ...p, createdAt: new Date(p.createdAt) }));
      this.nextId =
        this.products.reduce((max, p) => Math.max(max, p.id), 0) + 1;
      this.logger.log('Datos restaurados desde el archivo de persistencia');
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.warn(`No se pudo cargar ${this.storageFile}: ${reason}`);
    }
  }

  // Verifica si ya existe un producto con el mismo nombre (ignorando mayúsculas)
  private nameExists(name: string, excludeId?: number): boolean {
    const normalized = name.trim().toLowerCase();
    return this.products.some(
      (p) => p.id !== excludeId && p.name.trim().toLowerCase() === normalized,
    );
  }

  // Lista todos los productos
  findAll(): Product[] {
    this.log('GET /products - Listando productos');
    return this.products;
  }

  // Obtiene un producto por ID o lanza 404 si no existe
  findOne(id: number): Product {
    this.log(`GET /products/${id} - Obteniendo producto`);
    const product = this.products.find((p) => p.id === id);
    if (!product) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    return product;
  }

  // Crea un producto nuevo con ID autoincremental
  create(dto: CreateProductDto): Product {
    const name = dto.name.trim();
    if (this.nameExists(name)) {
      throw new ConflictException(`Ya existe un producto llamado "${name}"`);
    }
    this.log(`POST /products - Creando producto: ${name}`);
    const product: Product = {
      id: this.nextId++,
      name,
      description: dto.description.trim(),
      price: dto.price,
      stock: dto.stock,
      createdAt: new Date(),
    };
    this.products.push(product);
    this.save();
    return product;
  }

  // Actualiza solo los campos enviados del producto (id y createdAt se conservan)
  update(id: number, dto: UpdateProductDto): Product {
    this.log(`PUT /products/${id} - Actualizando producto`);
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    const current = this.products[index];
    const name =
      dto.name !== undefined ? dto.name.trim() : current.name;
    if (dto.name !== undefined && this.nameExists(name, id)) {
      throw new ConflictException(`Ya existe un producto llamado "${name}"`);
    }
    const description =
      dto.description !== undefined
        ? dto.description.trim()
        : current.description;
    const updated: Product = {
      ...current,
      ...dto,
      name,
      description,
      id: current.id,
      createdAt: current.createdAt,
    };
    this.products[index] = updated;
    this.save();
    return updated;
  }

  // Elimina un producto del catálogo
  remove(id: number): Record<string, unknown> {
    this.log(`DELETE /products/${id} - Eliminando producto`);
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    this.products.splice(index, 1);
    this.save();
    return { deleted: true, id, message: 'Producto eliminado' };
  }
}
