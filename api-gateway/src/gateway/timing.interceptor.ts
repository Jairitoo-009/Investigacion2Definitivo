import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs';

// Interceptor que mide el tiempo de respuesta de cada petición que pasa por el gateway
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('API-GATEWAY');

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();
    const method: string = request.method;
    const url: string = request.url;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const timestamp = new Date()
          .toISOString()
          .replace('T', ' ')
          .slice(0, 19);
        this.logger.log(
          `${timestamp} - ${method} ${url} - Tiempo de respuesta: ${duration}ms`,
        );
      }),
    );
  }
}
