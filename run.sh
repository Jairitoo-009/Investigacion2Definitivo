#!/usr/bin/env bash
# ==============================================================================
# run.sh - Script de levantamiento del proyecto (Linux/Mac)
# API Gateway con NestJS, Docker y Docker Compose - Investigación II
# ==============================================================================

set -euo pipefail

# Colores para mensajes profesionales
CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
NC='\033[0m' # sin color

step() {
    echo -e "\n${YELLOW}[$1] $2${NC}"
}

echo -e "${CYAN}==================================================================${NC}"
echo -e "${CYAN}  API GATEWAY CON NESTJS - DOCKER COMPOSE (Investigacion II)${NC}"
echo -e "${CYAN}==================================================================${NC}"

# ------------------------------------------------------------------------------
# 1. Verificar que Docker esta instalado y corriendo
# ------------------------------------------------------------------------------
step "1/7" "Verificando Docker..."

if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}  ERROR: Docker no esta instalado.${NC}"
    echo "  Instala Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}  ERROR: Docker no esta corriendo.${NC}"
    echo "  Inicia el demonio de Docker y vuelve a ejecutar el script."
    exit 1
fi
echo -e "${GREEN}  Docker OK: $(docker --version)${NC}"

# ------------------------------------------------------------------------------
# 2. Detener contenedores previos
# ------------------------------------------------------------------------------
step "2/7" "Deteniendo contenedores previos (docker compose down)..."
docker compose down
echo -e "${GREEN}  Contenedores detenidos.${NC}"

# ------------------------------------------------------------------------------
# 3. Construir las imagenes
# ------------------------------------------------------------------------------
step "3/7" "Construyendo imagenes (docker compose build)..."
docker compose build
echo -e "${GREEN}  Imagenes construidas correctamente.${NC}"

# ------------------------------------------------------------------------------
# 4. Levantar los servicios
# ------------------------------------------------------------------------------
step "4/7" "Levantando servicios (docker compose up -d)..."
docker compose up -d
echo -e "${GREEN}  Servicios levantados.${NC}"

# ------------------------------------------------------------------------------
# 5. Esperar a que los servicios esten listos
# ------------------------------------------------------------------------------
step "5/7" "Esperando a que los servicios esten listos (10 segundos)..."
sleep 10

# ------------------------------------------------------------------------------
# 6. Mostrar estado de los contenedores
# ------------------------------------------------------------------------------
step "6/7" "Estado de los contenedores:"
docker compose ps

# ------------------------------------------------------------------------------
# 7. URLs de prueba y comandos utiles
# ------------------------------------------------------------------------------
step "7/7" "Servicios disponibles:"
echo ""
echo -e "${GREEN}  API Gateway (entrada unica):${NC}"
echo "    Health   : http://localhost:3000/api/health"
echo "    Productos: http://localhost:3000/api/products"
echo "    Swagger  : http://localhost:3000/docs"
echo ""
echo -e "${GREEN}  Product Service (directo):${NC}"
echo "    Health   : http://localhost:3001/health"
echo "    Swagger  : http://localhost:3001/docs"
echo ""
echo -e "${CYAN}  Comandos utiles:${NC}"
echo "    Ver logs en vivo     : docker compose logs -f"
echo "    Logs del gateway     : docker compose logs -f api-gateway"
echo "    Logs del product     : docker compose logs -f product-service"
echo "    Detener todo         : docker compose down"
echo "    Probar con curl      : curl http://localhost:3000/api/products"
echo ""
echo -e "${GREEN}==================================================================${NC}"
echo -e "${GREEN}  PROYECTO LEVANTADO CON EXITO${NC}"
echo -e "${GREEN}==================================================================${NC}"
