import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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

  // Genera un timestamp con formato yyyy-MM-dd HH:mm:ss para los logs
  private timestamp(): string {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
  }

  // Registra cada operación realizada en el servicio
  private log(action: string): void {
    this.logger.log(`${this.timestamp()} - ${action}`);
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
    this.log(`POST /products - Creando producto: ${dto.name}`);
    const product: Product = {
      id: this.nextId++,
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock,
      createdAt: new Date(),
    };
    this.products.push(product);
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
    const updated: Product = {
      ...current,
      ...dto,
      id: current.id,
      createdAt: current.createdAt,
    };
    this.products[index] = updated;
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
    return { deleted: true, id, message: 'Producto eliminado' };
  }
}
