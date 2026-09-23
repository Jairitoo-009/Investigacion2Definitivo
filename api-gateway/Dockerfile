# ============================================
# Etapa 1: construcción (build) del proyecto
# ============================================
FROM node:22-alpine AS build
WORKDIR /app

# Copiar manifiestos de dependencias primero (mejora la caché de Docker)
COPY package.json package-lock.json ./

# Instalar dependencias de forma limpia y reproducible
RUN npm ci

# Copiar código fuente y compilar TypeScript
COPY . .
RUN npm run build

# ============================================
# Etapa 2: imagen de producción (mínima)
# ============================================
FROM node:22-alpine
WORKDIR /app

# Copiar manifiestos e instalar solo dependencias de producción
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copiar el código compilado desde la etapa de build
COPY --from=build /app/dist ./dist

# Exponer el puerto del API Gateway
EXPOSE 3000

# Comando de inicio
CMD ["node", "dist/main.js"]
