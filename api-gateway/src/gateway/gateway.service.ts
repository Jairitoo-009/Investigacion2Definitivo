import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProductDto } from './dto/update-product.dto';

// Servicio proxy: recibe las peticiones del gateway y las reenvía
// al microservicio que corresponda (product-service o users-service)
@Injectable()
export class GatewayService {
  private readonly logger = new Logger('API-GATEWAY');
  private readonly productBaseUrl: string;
  private readonly usersBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // URLs de los microservicios desde variables de entorno
    this.productBaseUrl =
      this.configService.get<string>('PRODUCT_SERVICE_URL') ??
      'http://product-service:3001';
    this.usersBaseUrl =
      this.configService.get<string>('USERS_SERVICE_URL') ??
      'http://users-service:3002';
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
    baseUrl: string,
  ): void {
    const target = `${baseUrl}${targetPath}`;
    this.logger.log(
      `${this.timestamp()} - ${method} ${clientPath} - Redirigiendo a ${target}`,
    );
  }

  // GET /api/products -> GET product-service/products
  async findAll(clientPath: string): Promise<unknown> {
    this.logRedirect('GET', clientPath, '/products', this.productBaseUrl);
    return this.forward(this.productBaseUrl, 'get', '/products');
  }

  // GET /api/products/:id -> GET product-service/products/:id
  async findOne(clientPath: string, id: number): Promise<unknown> {
    this.logRedirect('GET', clientPath, `/products/${id}`, this.productBaseUrl);
    return this.forward(this.productBaseUrl, 'get', `/products/${id}`);
  }

  // POST /api/products -> POST product-service/products
  async create(
    clientPath: string,
    body: CreateProductDto,
  ): Promise<unknown> {
    this.logRedirect('POST', clientPath, '/products', this.productBaseUrl);
    return this.forward(this.productBaseUrl, 'post', '/products', body);
  }

  // PUT /api/products/:id -> PUT product-service/products/:id
  async update(
    clientPath: string,
    id: number,
    body: UpdateProductDto,
  ): Promise<unknown> {
    this.logRedirect(
      'PUT',
      clientPath,
      `/products/${id}`,
      this.productBaseUrl,
    );
    return this.forward(
      this.productBaseUrl,
      'put',
      `/products/${id}`,
      body,
    );
  }

  // DELETE /api/products/:id -> DELETE product-service/products/:id
  async remove(clientPath: string, id: number): Promise<unknown> {
    this.logRedirect(
      'DELETE',
      clientPath,
      `/products/${id}`,
      this.productBaseUrl,
    );
    return this.forward(this.productBaseUrl, 'delete', `/products/${id}`);
  }

  // GET /api/users -> GET users-service/users
  async findAllUsers(clientPath: string): Promise<unknown> {
    this.logRedirect('GET', clientPath, '/users', this.usersBaseUrl);
    return this.forward(this.usersBaseUrl, 'get', '/users');
  }

  // GET /api/users/:id -> GET users-service/users/:id
  async findOneUser(clientPath: string, id: number): Promise<unknown> {
    this.logRedirect('GET', clientPath, `/users/${id}`, this.usersBaseUrl);
    return this.forward(this.usersBaseUrl, 'get', `/users/${id}`);
  }

  // POST /api/users -> POST users-service/users
  async createUser(
    clientPath: string,
    body: CreateUserDto,
  ): Promise<unknown> {
    this.logRedirect('POST', clientPath, '/users', this.usersBaseUrl);
    return this.forward(this.usersBaseUrl, 'post', '/users', body);
  }

  // DELETE /api/users/:id -> DELETE users-service/users/:id
  async removeUser(clientPath: string, id: number): Promise<unknown> {
    this.logRedirect(
      'DELETE',
      clientPath,
      `/users/${id}`,
      this.usersBaseUrl,
    );
    return this.forward(this.usersBaseUrl, 'delete', `/users/${id}`);
  }

  // Ejecuta la petición HTTP al microservicio indicado (patrón proxy)
  private async forward(
    baseUrl: string,
    method: 'get' | 'post' | 'put' | 'delete',
    path: string,
    data?: CreateProductDto | UpdateProductDto | CreateUserDto,
  ): Promise<unknown> {
    const url = `${baseUrl}${path}`;
    try {
      const response = await firstValueFrom(
        this.httpService.request({ method, url, data }),
      );
      return response.data;
    } catch (error) {
      // Convierte el error en una respuesta HTTP apropiada
      this.handleForwardError(error, path);
    }
  }

  // Maneja errores del microservicio o de red y devuelve respuestas adecuadas
  private handleForwardError(error: unknown, path: string): never {
    const axiosError = error as AxiosError<{ message?: string }>;

    // El microservicio respondió con un error (4xx/5xx)
    if (axiosError.response) {
      const status = axiosError.response.status;
      const message =
        axiosError.response.data?.message ?? 'Error devuelto por el microservicio';
      this.logger.error(`${path} respondió ${status}: ${message}`);
      throw new HttpException(message, status);
    }

    // No se pudo contactar al microservicio (caído o red)
    const reason = error instanceof Error ? error.message : 'Error desconocido';
    this.logger.error(`No se pudo contactar al servicio (${path}): ${reason}`);
    throw new HttpException('El microservicio no está disponible', 503);
  }
}