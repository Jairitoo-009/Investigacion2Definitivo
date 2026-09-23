import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Punto de entrada del microservicio de productos
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Validación global de DTOs con class-validator
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  // Configuración de Swagger (documentación de endpoints)
  const config = new DocumentBuilder()
    .setTitle('Product Service')
    .setDescription('Microservicio de productos con CRUD en memoria')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Puerto del servicio desde variables de entorno
  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  const logger = new Logger('PRODUCT-SERVICE');
  logger.log(`Product Service escuchando en http://localhost:${port}`);
}

bootstrap();
