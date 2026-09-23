import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { GatewayModule } from './gateway/gateway.module';

// Módulo raíz del API Gateway
@Module({
  imports: [
    // Carga las variables de entorno (.env) de forma global
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting global: limita peticiones por franja de tiempo (por IP)
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: Number(config.get('THROTTLE_TTL', 60000)),
          limit: Number(config.get('THROTTLE_LIMIT', 10)),
        },
      ],
    }),
    GatewayModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}