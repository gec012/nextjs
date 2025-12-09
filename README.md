# 🏋️ Sistema de Gimnasio - Next.js

Sistema completo de gestión de gimnasio con frontend y backend en Next.js.

## 🚀 Stack Tecnológico

- **Frontend:** Next.js 16 + React 19 + TypeScript + TailwindCSS 4
- **Backend:** Next.js API Routes
- **Base de Datos:** PostgreSQL + Prisma ORM
- **Autenticación:** JWT
- **Deploy:** Vercel + Vercel Postgres

## 📋 Prerrequisitos

- Node.js 18+
- Docker Desktop (para base de datos local)

## ⚙️ Configuración Local

### 1️⃣ Instalar dependencias
```bash
npm install
```

### 2️⃣ Configurar variables de entorno
```bash
# Copia el template
cp env.local.template .env.local
```

### 3️⃣ Levantar PostgreSQL con Docker
```bash
# Inicia Docker Desktop primero

# Levanta la base de datos
docker-compose up -d

# Verifica que esté corriendo
docker ps
```

### 4️⃣ Configurar la base de datos
```bash
# Genera el cliente de Prisma
npx prisma generate

# Ejecuta las migraciones
npx prisma migrate dev --name init

# (Opcional) Abre Prisma Studio para ver la DB
npx prisma studio
```

### 5️⃣ Cargar datos de prueba (opcional)
```bash
npm run seed
```

### 6️⃣ Iniciar el servidor de desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) 🎉

## 📱 Usuarios de Prueba

| Email | Password | Rol |
|-------|----------|-----|
| admin@gym.com | admin123 | ADMIN |
| recepcion@gym.com | recep123 | RECEPCIONISTA |
| cliente@gym.com | cliente123 | CLIENTE |

## 🗄️ Comandos de Docker

```bash
# Iniciar PostgreSQL
docker-compose up -d

# Detener PostgreSQL
docker-compose down

# Ver logs
docker-compose logs -f

# Eliminar todo (incluyendo datos)
docker-compose down -v
```

## 🛠️ Comandos de Prisma

```bash
# Generar cliente
npx prisma generate

# Crear migración
npx prisma migrate dev --name nombre_migracion

# Resetear base de datos
npx prisma migrate reset

# Abrir Prisma Studio
npx prisma studio
```

## 🚀 Deploy en Vercel

1. **Push a GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin tu-repo
git push -u origin main
```

2. **Importar en Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Import repository
   - Agrega Vercel Postgres desde el dashboard
   - Las variables DATABASE_URL y DIRECT_URL se configuran automáticamente

3. **Configurar variables de entorno:**
   - Copia las variables de `.env.local` al dashboard de Vercel
   - Genera JWT_SECRET seguro para producción

## 📚 Documentación de API

Ver `API_DOCS.md` para documentación completa de endpoints.

## 🏗️ Estructura del Proyecto

```
nextjs/
├── app/
│   ├── (auth)/           # Rutas de autenticación
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/      # Rutas protegidas
│   │   ├── admin/
│   │   ├── staff/
│   │   └── client/
│   ├── api/              # API Routes
│   │   ├── login/
│   │   ├── classes/
│   │   ├── memberships/
│   │   └── ...
│   └── layout.tsx
├── components/           # Componentes reutilizables
├── lib/                  # Utilidades y helpers
├── types/                # TypeScript types
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
├── docker-compose.yml    # PostgreSQL local
└── .env.local           # Variables de entorno
```

## 🎯 Características Principales

### 👥 Sistema de Roles
- **ADMIN:** Gestión completa del sistema
- **RECEPCIONISTA:** Check-in, validaciones, pagos
- **CLIENTE:** Reservas, membresías, acceso

### 🎫 Membresías por Disciplina
- Sistema de créditos por disciplina
- Membresías ilimitadas
- Vencimientos automáticos

### 📅 Sistema de Reservas
- Reservas de clases
- Política de cancelación (3 horas)
- Check-in automático (±30 min)

### 🔐 Check-in Inteligente
- QR dinámico con expiración
- QR estático para recepción
- Validación de reservas
- Descuento automático de créditos

### 💰 Gestión de Pagos
- Pago por transferencia
- Aprobación por staff
- Historial de pagos

## 🧪 Testing

```bash
# Tests unitarios
npm test

# Tests e2e
npm run test:e2e
```

## 📝 Licencia

MIT

## 👨‍💻 Autor

Tu Nombre
