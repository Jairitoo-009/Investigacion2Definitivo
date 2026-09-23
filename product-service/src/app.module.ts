import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './products/products.module';

// Módulo raíz del Product Service
@Module({
  imports: [
    // Carga las variables de entorno (.env) de forma global
    ConfigModule.forRoot({ isGlobal: true }),
    ProductsModule,
  ],
})
export class AppModule {}
