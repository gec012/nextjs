# Seteando variables de entorno
$env:DATABASE_URL = "postgresql://gym_user:gym_password@localhost:5432/gym_db?schema=public"
$env:DIRECT_URL = "postgresql://gym_user:gym_password@localhost:5432/gym_db?schema=public"
$env:JWT_SECRET = "desarrollo-secret-cambiar-en-produccion-123456789"
$env:NEXT_PUBLIC_API_URL = "http://localhost:3000/api"
$env:NEXT_PUBLIC_APP_URL = "http://localhost:3000"
$env:GYM_NAME = "Mi Gimnasio"
$env:GYM_TIMEZONE = "America/Argentina/Buenos_Aires"
$env:QR_EXPIRATION_MINUTES = "30"
$env:QR_SECRET_KEY = "qr-secret-key-desarrollo-123"
$env:CANCELLATION_HOURS = "3"
$env:RESERVATION_WINDOW_MINUTES = "30"

# Ruta exacta al binario local de Prisma (para asegurar v5)
$PrismaCmd = ".\node_modules\.bin\prisma.cmd"

Write-Host "🚀 Iniciando configuración de base de datos..." -ForegroundColor Cyan
Write-Host "🛠️ Usando Prisma local desde: $PrismaCmd"

# Generar cliente
Write-Host "`n1. Generando Prisma Client..."
& $PrismaCmd generate
if ($LASTEXITCODE -ne 0) { Write-Error "Falló prisma generate"; exit }

# Crear tablas
Write-Host "`n2. Creando tablas en DB..."
& $PrismaCmd db push --accept-data-loss
if ($LASTEXITCODE -ne 0) { Write-Error "Falló prisma db push"; exit }

# Seed
Write-Host "`n3. Cargando datos de prueba..."
npm run db:seed
if ($LASTEXITCODE -ne 0) { Write-Error "Falló seed"; exit }

Write-Host "`n✅ ¡TODO LISTO! Iniciando servidor..." -ForegroundColor Green
npm run dev
