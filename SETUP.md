# 🚀 GUÍA DE CONFIGURACIÓN RÁPIDA

## 📝 Paso 1: Configurar Variables de Entorno

Copia este contenido al archivo `.env.local` (créalo si no existe):

```env
# 🗄️ Base de Datos Local (Docker)
DATABASE_URL="postgresql://gym_user:gym_password@localhost:5432/gym_db?schema=public"
DIRECT_URL="postgresql://gym_user:gym_password@localhost:5432/gym_db?schema=public"

# 🔐 JWT Secret
JWT_SECRET="desarrollo-secret-cambiar-en-produccion-123456789"

# 🌐 URLs
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 🏋️ Configuración del Gimnasio
GYM_NAME="Mi Gimnasio"
GYM_TIMEZONE="America/Argentina/Buenos_Aires"

# 📱 QR Configuration
QR_EXPIRATION_MINUTES=30
QR_SECRET_KEY="qr-secret-key-desarrollo-123"

# ⏰ Políticas de Reserva
CANCELLATION_HOURS=3
RESERVATION_WINDOW_MINUTES=30
```

## 🐳 Paso 2: Levantar PostgreSQL con Docker

```bash
# Asegúrate de que Docker Desktop esté corriendo

# Inicia PostgreSQL
docker-compose up -d

# Verifica que esté corriendo
docker ps
```

## 🗄️ Paso 3: Configurar Base de Datos

```bash
# Genera el cliente de Prisma
npm run db:generate

# Ejecuta las migraciones (crea las tablas)
npm run db:migrate

# Carga datos de prueba
npm run db:seed
```

## 🎯 Paso 4: Iniciar el Servidor

```bash
npm run dev
```

Abre http://localhost:3000

## 👥 Usuarios de Prueba

| Email | Password | Rol |
|-------|----------|-----|
| admin@gym.com | 123456 | ADMIN |
| recepcion@gym.com | 123456 | RECEPCIONISTA |
| cliente@gym.com | 123456 | CLIENTE |

## 🆘 Solución de Problemas

### Error: DATABASE_URL no encontrada
- Verifica que el archivo `.env.local` exista en la raíz del proyecto
- Copia el contenido de arriba exactamente

### Error: PostgreSQL no conecta
- Verifica que Docker Desktop esté corriendo
- Ejecuta `docker-compose up -d`
- Verifica con `docker ps` que el contenedor esté activo

### Error: Prisma Client no generado
- Ejecuta `npm run db:generate`
- Reinicia el servidor de desarrollo

### Error: Tablas no existen
- Ejecuta `npm run db:migrate`
- Luego `npm run db:seed`

## 🔧 Comandos Útiles

```bash
# Ver la base de datos gráficamente
npm run db:studio

# Resetear la base de datos
npm run db:migrate -- --force-reset

# Ver logs de Docker
docker-compose logs -f

# Detener PostgreSQL
docker-compose down
```
