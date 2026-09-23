import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';

// Módulo del gateway: configura HttpService apuntando al product-service
@Module({
  imports: [
    // HttpService configurado con la URL del microservicio desde .env
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL: config.get<string>(
          'PRODUCT_SERVICE_URL',
          'http://product-service:3001',
        ),
        timeout: 5000,
      }),
    }),
  ],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}
