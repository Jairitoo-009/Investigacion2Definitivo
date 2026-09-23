# ==============================================================================
# run.ps1 - Script de levantamiento del proyecto (Windows PowerShell)
# API Gateway con NestJS, Docker y Docker Compose - Investigación II
# ==============================================================================

$ErrorActionPreference = "Stop"

# Colores para mensajes profesionales
$Cyan   = "Cyan"
$Green  = "Green"
$Yellow = "Yellow"
$Red    = "Red"

function Write-Step($n, $msg) {
    Write-Host "`n[$n] $msg" -ForegroundColor $Yellow
}

Write-Host "==================================================================" -ForegroundColor $Cyan
Write-Host "  API GATEWAY CON NESTJS - DOCKER COMPOSE (Investigacion II)"       -ForegroundColor $Cyan
Write-Host "==================================================================" -ForegroundColor $Cyan

# ------------------------------------------------------------------------------
# 1. Verificar que Docker esta instalado y corriendo
# ------------------------------------------------------------------------------
Write-Step "1/7" "Verificando Docker..."

try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -ne 0) { throw "docker no encontrado" }
} catch {
    Write-Host "  ERROR: Docker no esta instalado." -ForegroundColor $Red
    Write-Host "  Instala Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor $Red
    exit 1
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Docker no esta corriendo." -ForegroundColor $Red
    Write-Host "  Inicia Docker Desktop y vuelve a ejecutar el script." -ForegroundColor $Red
    exit 1
}
Write-Host "  Docker OK: $dockerVersion" -ForegroundColor $Green

# ------------------------------------------------------------------------------
# 2. Detener contenedores previos
# ------------------------------------------------------------------------------
Write-Step "2/7" "Deteniendo contenedores previos (docker compose down)..."
docker compose down
Write-Host "  Contenedores detenidos." -ForegroundColor $Green

# ------------------------------------------------------------------------------
# 3. Construir las imagenes
# ------------------------------------------------------------------------------
Write-Step "3/7" "Construyendo imagenes (docker compose build)..."
docker compose build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Fallio la construccion de las imagenes." -ForegroundColor $Red
    exit 1
}
Write-Host "  Imagenes construidas correctamente." -ForegroundColor $Green

# ------------------------------------------------------------------------------
# 4. Levantar los servicios
# ------------------------------------------------------------------------------
Write-Step "4/7" "Levantando servicios (docker compose up -d)..."
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Fallio el levantamiento de los servicios." -ForegroundColor $Red
    exit 1
}
Write-Host "  Servicios levantados." -ForegroundColor $Green

# ------------------------------------------------------------------------------
# 5. Esperar a que los servicios esten listos
# ------------------------------------------------------------------------------
Write-Step "5/7" "Esperando a que los servicios esten listos (10 segundos)..."
Start-Sleep -Seconds 10

# ------------------------------------------------------------------------------
# 6. Mostrar estado de los contenedores
# ------------------------------------------------------------------------------
Write-Step "6/7" "Estado de los contenedores:"
docker compose ps

# ------------------------------------------------------------------------------
# 7. URLs de prueba y comandos utiles
# ------------------------------------------------------------------------------
Write-Step "7/7" "Servicios disponibles:"
Write-Host ""
Write-Host "  API Gateway (entrada unica):" -ForegroundColor $Green
Write-Host "    Health : http://localhost:3000/api/health"
Write-Host "    Productos: http://localhost:3000/api/products"
Write-Host "    Swagger : http://localhost:3000/docs"
Write-Host ""
Write-Host "  Product Service (directo):" -ForegroundColor $Green
Write-Host "    Health : http://localhost:3001/health"
Write-Host "    Swagger: http://localhost:3001/docs"
Write-Host ""

Write-Host "  Comandos utiles:" -ForegroundColor $Cyan
Write-Host "    Ver logs en vivo     : docker compose logs -f"
Write-Host "    Logs del gateway     : docker compose logs -f api-gateway"
Write-Host "    Logs del product     : docker compose logs -f product-service"
Write-Host "    Detener todo         : docker compose down"
Write-Host "    Probar con curl      : curl http://localhost:3000/api/products"
Write-Host ""

Write-Host "==================================================================" -ForegroundColor $Green
Write-Host "  PROYECTO LEVANTADO CON EXITO"                                    -ForegroundColor $Green
Write-Host "==================================================================" -ForegroundColor $Green
