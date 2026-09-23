import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';

// Punto de entrada del API Gateway
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Valida DTOs con class-validator
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  // Sirve la interfaz web de demostración desde /api-gateway/public
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Configuración de Swagger (documentación de endpoints)
  const config = new DocumentBuilder()
    .setTitle('API Gateway')
    .setDescription(
      'Punto de entrada único que redirige las peticiones al product-service',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Puerto del gateway desde variables de entorno
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const logger = new Logger('API-GATEWAY');
  logger.log(`API Gateway escuchando en http://localhost:${port}`);
}

bootstrap();
