import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

// Servicio proxy: recibe las peticiones del gateway y las reenvía al product-service
@Injectable()
export class GatewayService {
  private readonly logger = new Logger('API-GATEWAY');
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // URL del microservicio desde variables de entorno
    this.baseUrl =
      this.configService.get<string>('PRODUCT_SERVICE_URL') ??
      'http://product-service:3001';
  }

  // Genera un timestamp con formato yyyy-MM-dd HH:mm:ss para los logs
  private timestamp(): string {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
  }

  // Registra cada redirección (evidencia de comunicación entre servicios)
  private logRedirect(
    method: string,
    clientPath: string,
    targetPath: string,
  ): void {
    const target = `${this.baseUrl}${targetPath}`;
    this.logger.log(
      `${this.timestamp()} - ${method} ${clientPath} - Redirigiendo a ${target}`,
    );
  }

  // GET /api/products -> GET product-service/products
  async findAll(clientPath: string): Promise<unknown> {
    this.logRedirect('GET', clientPath, '/products');
    return this.forward('get', '/products');
  }

  // GET /api/products/:id -> GET product-service/products/:id
  async findOne(clientPath: string, id: number): Promise<unknown> {
    this.logRedirect('GET', clientPath, `/products/${id}`);
    return this.forward('get', `/products/${id}`);
  }

  // POST /api/products -> POST product-service/products
  async create(clientPath: string, body: CreateProductDto): Promise<unknown> {
    this.logRedirect('POST', clientPath, '/products');
    return this.forward('post', '/products', body);
  }

  // PUT /api/products/:id -> PUT product-service/products/:id
  async update(
    clientPath: string,
    id: number,
    body: UpdateProductDto,
  ): Promise<unknown> {
    this.logRedirect('PUT', clientPath, `/products/${id}`);
    return this.forward('put', `/products/${id}`, body);
  }

  // DELETE /api/products/:id -> DELETE product-service/products/:id
  async remove(clientPath: string, id: number): Promise<unknown> {
    this.logRedirect('DELETE', clientPath, `/products/${id}`);
    return this.forward('delete', `/products/${id}`);
  }

  // Ejecuta la petición HTTP al microservicio (patrón proxy)
  private async forward(
    method: 'get' | 'post' | 'put' | 'delete',
    path: string,
    data?: CreateProductDto | UpdateProductDto,
  ): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.request({ method, url: path, data }),
      );
      return response.data;
    } catch (error) {
      // Convierte el error en una respuesta HTTP apropiada
      this.handleForwardError(error);
    }
  }

  // Maneja errores del microservicio o de red y devuelve respuestas adecuadas
  private handleForwardError(error: unknown): never {
    const axiosError = error as AxiosError<{ message?: string }>;

    // El microservicio respondió con un error (4xx/5xx)
    if (axiosError.response) {
      const status = axiosError.response.status;
      const message =
        axiosError.response.data?.message ?? 'Error devuelto por el microservicio';
      this.logger.error(`product-service respondió ${status}: ${message}`);
      throw new HttpException(message, status);
    }

    // No se pudo contactar al microservicio (caído o red)
    const reason = error instanceof Error ? error.message : 'Error desconocido';
    this.logger.error(`No se pudo contactar a product-service: ${reason}`);
    throw new HttpException('El microservicio no está disponible', 503);
  }
}
