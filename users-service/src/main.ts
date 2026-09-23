import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Punto de entrada del microservicio de usuarios
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Validación global de DTOs con class-validator
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  // Configuración de Swagger (documentación de endpoints)
  const config = new DocumentBuilder()
    .setTitle('Users Service')
    .setDescription('Microservicio de usuarios con CRUD en memoria')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Puerto del servicio desde variables de entorno
  const port = process.env.PORT ?? 3002;
  await app.listen(port);

  const logger = new Logger('USERS-SERVICE');
  logger.log(`Users Service escuchando en http://localhost:${port}`);
}

bootstrap();