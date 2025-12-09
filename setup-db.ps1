$env:DATABASE_URL = "postgresql://gym_user:gym_password@localhost:5432/gym_db?schema=public"
$env:DIRECT_URL = "postgresql://gym_user:gym_password@localhost:5432/gym_db?schema=public"

Write-Host "Generando Prisma Client..." -ForegroundColor Green
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma Client generado exitosamente!" -ForegroundColor Green
    
    Write-Host "`nCreando tablas en la base de datos..." -ForegroundColor Green
    npx prisma db push --accept-data-loss
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tablas creadas exitosamente!" -ForegroundColor Green
        
        Write-Host "`nCargando datos de prueba..." -ForegroundColor Green
        npm run db:seed
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Base de datos lista!" -ForegroundColor Green
        }
    }
}
