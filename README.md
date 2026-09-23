# API Gateway con NestJS — Investigación II

Proyecto de la investigación sobre **API Gateway**. Implementamos un punto de entrada único hecho en
NestJS que recibe las peticiones de un cliente y las reenvía a los microservicios que corresponda
(productos y usuarios). Todos los servicios corren en contenedores con Docker Compose.

## Integrantes

- Jairo Jose Silva Martinez
- Daniel Emilio Elizondo Gutierrez
- Andrey Gonzalez

## Tema y tecnología

- **Tema:** API Gateway
- **Framework:** NestJS (Node.js + TypeScript)
- **Infraestructura:** Docker + Docker Compose
- **Servicios:** `api-gateway` (puerto 3000), `product-service` (puerto 3001) y `users-service`
  (puerto 3002)

## Qué es un API Gateway

Es un servidor que funciona como la puerta de entrada única hacia los servicios internos. En lugar
de que cada cliente conozca la dirección y el puerto de cada microservicio, todos los pedidos van al
gateway, y él se encarga de reenviarlos al servicio correspondiente, de registrar lo que pasa y de
devolver la respuesta al cliente.

En este proyecto el cliente solo le habla al `api-gateway` por el puerto 3000. El gateway decide que
las rutas `/api/products` van al `product-service` (puerto 3001) y las rutas `/api/users` van al
`users-service` (puerto 3002) y se las envía, sin que el cliente tenga que saber que esos servicios
existen.

## Qué problema resuelve

Cuando una aplicación tiene varios servicios (productos, usuarios, pagos, etc.), cada cliente tendría
que repetir lógica de autenticación, logs y enrutamiento, y si un servicio cambia de puerto o de
dirección habría que tocar todos los clientes.

Con un API Gateway se centraliza todo eso:

- un solo punto de contacto, el puerto 3000;
- el enrutamiento de cada petición hacia el servicio correcto;
- los logs y el tiempo de respuesta de cada pedido;
- el manejo de errores: si un servicio cae, responde 503 de forma controlada;
- la limitación de peticiones (rate limiting): si un cliente dispara muchas peticiones en poco
  tiempo, responde 429 Too Many Requests.

## Arquitectura

```
Cliente (navegador o curl)
        |
        |  solo conoce http://localhost:3000
        v
 +---------------------+      HTTP      +--------------------------+
 |   API Gateway       | -------------> |   Product Service        |
 |   (NestJS) :3000    |                |   (NestJS) :3001         |
 +---------------------+      HTTP      +--------------------------+
        |   \           | -------------> |   Users Service          |
        |    \  (proxy) |                |   (NestJS) :3002         |
        +-----+----------+               +--------------------------+
            misma red Docker (api-gateway-network)
```

El gateway usa el `HttpService` de `@nestjs/axios` para reenviar cada petición y devuelve al cliente
la respuesta del microservicio correspondiente.

## Cómo ejecutarlo

Solo necesita Git, Docker y Docker Compose. En la terminal, dentro de la carpeta del proyecto:

PowerShell (Windows):

```powershell
.\run.ps1
```

Linux / Mac:

```bash
chmod +x run.sh
./run.sh
```

El script verifica que Docker esté corriendo, construye las imágenes, levanta los servicios y muestra
el estado. Alternativa manual:

```bash
docker compose up -d --build
```

Al final deben quedar tres contenedores "Up (healthy)":

- `api-gateway` en el puerto 3000
- `product-service` en el puerto 3001
- `users-service` en el puerto 3002

Para detener todo:

```bash
docker compose down
```

## Persistencia de datos

Los datos se guardan en archivos JSON dentro de volúmenes nombrados de Docker
(`product-data` y `users-data` montados en `/app/data`). Así lo que se crea, actualiza o elimina
sobrevive a reinicios y a `docker compose down`. Solo se borran al eliminar los volúmenes a mano:

```bash
docker compose down -v
```

Si no quieres los cambios del último uso, borra los volúmenes con ese comando y al levantar de nuevo
cada servicio arranca con sus datos de ejemplo (seed).

## Imágenes en Docker Hub

Las imágenes de los tres servicios también se subieron a Docker Hub:

- `andrey20051809/investigacion2definitivo-api-gateway:latest`
- `andrey20051809/investigacion2definitivo-product-service:latest`
- `andrey20051809/investigacion2definitivo-users-service:latest`

Se pueden bajar directo con:

```bash
docker pull andrey20051809/investigacion2definitivo-api-gateway:latest
docker pull andrey20051809/investigacion2definitivo-product-service:latest
docker pull andrey20051809/investigacion2definitivo-users-service:latest
```

O bajarlas las dos con Compose:

```bash
docker compose pull
```

El `docker-compose.yml` ya referencia estas imágenes, así que también se puede levantar sin compilar:

```bash
docker compose up -d
```

De todos modos no es obligatorio: `docker compose up -d --build` construye desde los Dockerfiles que
están en el repositorio de la misma manera.

## Cómo probarlo

Abrir en el navegador:

- `http://localhost:3000/` — interfaz web de prueba (listar, crear, actualizar y eliminar productos y
  usuarios pasando por el gateway, más una demo del rate limiting)
- `http://localhost:3000/api/products` — JSON de los productos vía gateway
- `http://localhost:3000/api/users` — JSON de los usuarios vía gateway
- `http://localhost:3001/products` — los productos pero directo al microservicio (para comparar)
- `http://localhost:3002/users` — los usuarios pero directo al microservicio (para comparar)

O con curl:

```bash
curl http://localhost:3000/api/products
curl http://localhost:3000/api/users
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Monitor Samsung","description":"Monitor 24 pulgadas","price":250,"stock":15}'
```

Para confirmar que la comunicación ocurre, ver los logs de los servicios:

```bash
docker compose logs -f api-gateway
docker compose logs -f product-service
docker compose logs -f users-service
```

El gateway escribe "Redirigiendo a http://product-service:3001/..." o
"Redirigiendo a http://users-service:3002/..." y cada microservicio escribe su log con cada
petición.

## Rate limiting (demo)

El gateway limita las peticiones por franja de tiempo e IP. Por defecto son 30 peticiones cada 15
segundos (variables `THROTTLE_TTL` y `THROTTLE_LIMIT` en `.env`). Al superar el límite responde
`429 Too Many Requests` y, al terminar la franja, vuelve a funcionar solo. En la interfaz web, el
botón **"Demo: rate limiting (spam)"** dispara 40 peticiones seguidas para mostrarlo en vivo.

## Flujo de comunicación

1. El cliente hace una petición a `http://localhost:3000/api/products`. Solo conoce el puerto 3000.
2. El gateway registra la petición y calcula el destino: `http://product-service:3001/products`.
3. Reenvía la petición con `@nestjs/axios`.
4. El microservicio la procesa, registra su log y responde el JSON.
5. El gateway recibe la respuesta, mide el tiempo de respuesta y se la envía al cliente.