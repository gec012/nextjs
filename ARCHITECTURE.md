# 🏋️ Mi Gimnasio - Documentación de Arquitectura

## 📋 Descripción General

**Mi Gimnasio** es un sistema de gestión para gimnasios desarrollado con **Next.js 16** (App Router), **Prisma ORM**, y **PostgreSQL**. El sistema permite gestionar usuarios, membresías, clases, reservaciones, y pagos.

---

## 🗂️ Estructura del Proyecto

```
nextjs/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (Backend)
│   ├── dashboard/                # Páginas del dashboard
│   │   ├── admin/                # Dashboard de administrador
│   │   ├── staff/                # Dashboard de recepción
│   │   ├── client/               # Dashboard de cliente
│   │   └── layout.tsx            # Layout protegido con auth
│   ├── globals.css               # Estilos globales
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Página de login
├── lib/                          # Utilidades y lógica compartida
│   ├── stores/                   # Zustand stores (estado global)
│   │   ├── auth.store.ts         # Estado de autenticación
│   │   └── membership.store.ts   # Estado de membresías
│   ├── auth.ts                   # Funciones de autenticación (JWT)
│   ├── prisma.ts                 # Cliente de Prisma
│   ├── route-protection.ts       # Protección de rutas por rol
│   ├── validations.ts            # Esquemas de validación (Zod)
│   ├── utils.ts                  # Utilidades generales
│   └── qr.ts                     # Generación/validación de QR
├── prisma/                       # Configuración de base de datos
│   ├── schema.prisma             # Esquema de la BD
│   ├── seed.ts                   # Datos iniciales
│   └── migrations/               # Migraciones de BD
├── types/                        # Definiciones de TypeScript
│   └── index.ts                  # Tipos compartidos
├── components/                   # Componentes reutilizables
└── public/                       # Archivos estáticos
```

---

## 👥 Sistema de Roles

El sistema tiene **3 roles** con diferentes niveles de acceso:

| Rol | Descripción | Dashboard | Permisos |
|-----|-------------|-----------|----------|
| `ADMIN` | Administrador | `/dashboard/admin` | Acceso total: usuarios, pagos, planes, clases, estadísticas |
| `STAFF` | Recepcionista | `/dashboard/staff` | Check-in de usuarios, visualización de clases |
| `CLIENT` | Cliente | `/dashboard/client` | Ver membresías, reservar clases, QR de acceso, historial |

### Protección de Rutas

La protección se maneja en `lib/route-protection.ts`:

```typescript
// Permisos por ruta
/dashboard/admin   → Solo ADMIN
/dashboard/staff   → ADMIN, STAFF
/dashboard/client  → ADMIN, STAFF, CLIENT (todos)
```

---

## 📊 Modelo de Datos (Prisma Schema)

### Enums

```typescript
enum UserRole { ADMIN, STAFF, CLIENT }
enum MembershipStatus { ACTIVE, EXPIRED, PENDING }
enum ReservationStatus { ACTIVE, ATTENDED, CANCELLED, NO_SHOW }
enum PaymentStatus { PENDING, APPROVED, REJECTED }
enum PaymentMethod { TRANSFER, CASH, CARD, MERCADOPAGO }
```

### Entidades Principales

| Modelo | Descripción | Relaciones |
|--------|-------------|------------|
| **User** | Usuarios del sistema | memberships, reservations, attendances, payments |
| **Discipline** | Disciplinas (ej: Yoga, Musculación) | classes, plans, memberships |
| **Plan** | Planes de membresía | discipline, memberships, payments |
| **Membership** | Membresías activas de usuarios | user, plan, discipline, reservations |
| **Class** | Clases programadas | discipline, reservations |
| **Reservation** | Reservas de clases | user, class, membership |
| **Attendance** | Registro de asistencias | user, discipline, membership |
| **Payment** | Pagos registrados | user, plan |
| **AccessLog** | Log de accesos (QR) | user |
| **BankInfo** | Datos bancarios para transferencias | - |
| **SystemConfig** | Configuraciones del sistema | - |

### Diagrama de Relaciones

```
User ─────┬──── Membership ──── Plan ──── Discipline
          │          │
          │          └──── Reservation ──── Class ──── Discipline
          │
          ├──── Attendance ──── Discipline
          │
          ├──── Payment ──── Plan
          │
          └──── AccessLog
```

---

## 🔌 APIs (Endpoints)

### Base URL: `/api`

### 🔐 Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/login` | Iniciar sesión | ❌ |
| `POST` | `/api/logout` | Cerrar sesión | ✅ |

#### POST /api/login

**Request:**
```json
{
  "email": "admin@gym.com",
  "password": "123456"
}
```

**Response (200):**
```json
{
  "message": "Login exitoso",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "name": "Gastón Admin",
    "email": "admin@gym.com",
    "rol": "ADMIN",
    "phone": null,
    "profilePhoto": null
  }
}
```

---

### 👤 Usuario Actual

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/me` | Obtener perfil del usuario | ✅ |
| `PUT` | `/api/me` | Actualizar perfil | ✅ |
| `PUT` | `/api/me/password` | Cambiar contraseña | ✅ |

---

### 🎫 Membresías

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/my-memberships` | Obtener membresías del usuario | ✅ |

**Response:**
```json
{
  "memberships": [
    {
      "id": 1,
      "discipline": "Musculación",
      "discipline_id": 1,
      "total_credits": 20,
      "remaining_credits": 15,
      "is_unlimited": false,
      "start_date": "2025-12-01",
      "expiration_date": "2025-12-31",
      "days_remaining": 22,
      "status": "ACTIVE"
    }
  ]
}
```

---

### 📅 Clases y Reservaciones

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/classes` | Listar clases disponibles | ✅ |
| `POST` | `/api/classes/reserve` | Reservar una clase | ✅ |
| `DELETE` | `/api/classes/cancel/[id]` | Cancelar reservación | ✅ |

**GET /api/classes Response:**
```json
{
  "classes": [
    {
      "id": 1,
      "name": "Yoga Matutino",
      "disciplineId": 2,
      "disciplineName": "Yoga",
      "instructorName": "María López",
      "startTime": "2025-12-10T09:00:00.000Z",
      "endTime": "2025-12-10T10:00:00.000Z",
      "capacity": 20,
      "enrolled": 5,
      "availableSpots": 15,
      "isFull": false,
      "isReserved": false,
      "reservationId": null
    }
  ]
}
```

**POST /api/classes/reserve Request:**
```json
{
  "classId": 1
}
```

---

### 📋 Reservaciones e Historial

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/my-reservations` | Reservaciones activas | ✅ |
| `GET` | `/api/my-attendances` | Historial de asistencias | ✅ |

---

### 📱 QR de Acceso

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/qr/generate` | Generar QR dinámico | ✅ |

**Response:**
```json
{
  "qr_data": "eyJpZCI6MSwi..."  // Base64 encoded JSON with signature
}
```

---

### ✅ Check-In (Staff/Admin)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/check-in` | Registrar entrada de usuario | ✅ (Staff+) |

**Request:**
```json
{
  "user_id": 5,
  "discipline_id": 1
}
```
O con QR:
```json
{
  "qr_data": "eyJpZCI6MSwi...",
  "discipline_id": 1
}
```

---

## 🔐 Autenticación

### JWT (JSON Web Tokens) con HttpOnly Cookies 🔒

El token JWT se almacena en una cookie **HttpOnly**, lo que proporciona mayor seguridad:

- **HttpOnly**: JavaScript NO puede acceder al token (protección contra XSS)
- **SameSite: lax**: Protección contra CSRF
- **Secure**: Solo se envía por HTTPS en producción
- **Expiración**: 7 días

### Flujo de Autenticación

```
1. Usuario ingresa credenciales → POST /api/login
2. Backend valida y genera JWT
3. Backend setea cookie HttpOnly con el token
4. Frontend guarda solo datos del usuario en Zustand (sin token)
5. Cada request incluye credentials: 'include' para enviar cookie
6. Backend lee token desde cookie automáticamente
7. Al hacer logout, cookie se elimina con maxAge: 0
```

### Archivo: `lib/auth.ts`

```typescript
// Configuración de cookie
export const COOKIE_OPTIONS = {
    httpOnly: true,      // JavaScript NO puede acceder
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',     // Protección CSRF
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: '/',
};

// Generar token
generateToken({ id, email, rol })

// Verificar request (lee de header O cookie)
authenticateRequest(authHeader, request) → { userId, email, rol }
```

### Haciendo requests desde el frontend

```typescript
// El token se envía automáticamente en la cookie
const response = await fetch('/api/my-memberships', {
    credentials: 'include', // Importante: incluir cookies
});
```

---

## 💾 Estado Global (Zustand)

### auth.store.ts

```typescript
interface AuthState {
  user: StoreUser | null;  // Solo datos públicos del usuario
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (user: StoreUser) => void;
  logout: () => void;
  updateUser: (user: Partial<StoreUser>) => void;
  setLoading: (loading: boolean) => void;
}

// Nota: NO se guarda el token - está en HttpOnly cookie

// Selectores optimizados
useUser()           // Usuario actual
useIsAuthenticated()
useIsAdmin()
useIsStaff()
useIsClient()
```

---

## ✅ Validaciones (Zod)

Las validaciones están centralizadas en `lib/validations.ts`:

| Schema | Uso |
|--------|-----|
| `loginSchema` | Validar credenciales de login |
| `registerSchema` | Registro de nuevos usuarios |
| `changePasswordSchema` | Cambio de contraseña |
| `reserveClassSchema` | Reservar una clase |
| `checkInSchema` | Check-in de usuarios |
| `createPlanSchema` | Crear planes (Admin) |
| `createClassSchema` | Crear clases (Admin) |

---

## 🎨 Dashboard por Rol

### Admin (`/dashboard/admin`)
- **Panel principal:** Estadísticas del día
- **Pagos:** Aprobar/rechazar transferencias pendientes
- **Usuarios:** Gestión de usuarios
- **Planes:** CRUD de planes de membresía
- **Clases:** Programación de clases
- **Estadísticas:** Reportes y métricas

### Staff (`/dashboard/staff`)
- **Panel principal:** Check-in de usuarios
- Escanear QR o buscar por nombre
- Ver clases del día

### Client (`/dashboard/client`)
- **Panel principal:** Resumen de membresías
- **Clases:** Ver y reservar clases
- **QR:** Generar código de acceso
- **Historial:** Ver asistencias pasadas

---

## 🚀 Ejecución

### Desarrollo
```bash
npm run dev
```

### Variables de Entorno
```env
# .env.local
DATABASE_URL="postgresql://..."
JWT_SECRET="tu-secreto-jwt"
```

### Usuarios de Prueba
| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@gym.com | 123456 |
| Staff | recepcion@gym.com | 123456 |
| Cliente | cliente@gym.com | 123456 |

---

## 🛠️ Tecnologías

| Tecnología | Uso |
|------------|-----|
| **Next.js 16** | Framework React con App Router |
| **TypeScript** | Tipado estático |
| **Prisma** | ORM para PostgreSQL |
| **PostgreSQL** | Base de datos |
| **Zustand** | Estado global |
| **Zod** | Validación de esquemas |
| **JWT** | Autenticación |
| **bcryptjs** | Hash de contraseñas |
| **Tailwind CSS** | Estilos |
| **react-hot-toast** | Notificaciones |
| **Lucide React** | Iconos |

---

## 📁 Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| `app/page.tsx` | Página de login |
| `app/dashboard/layout.tsx` | Layout protegido con verificación de auth |
| `lib/auth.ts` | Funciones de JWT |
| `lib/stores/auth.store.ts` | Estado de autenticación Zustand |
| `lib/route-protection.ts` | Lógica de protección de rutas |
| `lib/validations.ts` | Esquemas de validación Zod |
| `prisma/schema.prisma` | Modelo de datos |
| `prisma/seed.ts` | Datos iniciales |

---

*Última actualización: Diciembre 2025*
