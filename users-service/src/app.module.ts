import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';

// Módulo raíz del Users Service
@Module({
  imports: [
    // Carga las variables de entorno (.env) de forma global
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
  ],
})
export class AppModule {}