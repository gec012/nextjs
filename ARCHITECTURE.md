# 🏋️ Mi Gimnasio - Documentación de Arquitectura

## 📋 Descripción General

**Mi Gimnasio** es un sistema integral de gestión para gimnasios desarrollado con **Next.js 15** (App Router), **Prisma ORM**, y **PostgreSQL**. El sistema permite gestionar usuarios, membresías, disciplinas, clases, reservaciones, pagos, y reportes con una interfaz moderna y responsiva.

---

## 🗂️ Estructura del Proyecto

```
nextjs/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (Backend)
│   │   ├── check-in/             # Check-in de usuarios
│   │   ├── classes/              # Gestión de clases
│   │   │   ├── [id]/             # Clase específica
│   │   │   ├── bulk/             # Creación masiva de clases
│   │   │   ├── cancel/[id]/      # Cancelar reservación
│   │   │   └── reserve/          # Reservar clase
│   │   ├── disciplines/          # Gestión de disciplinas
│   │   │   └── [id]/             # Disciplina específica
│   │   ├── login/                # Autenticación
│   │   ├── logout/               # Cerrar sesión
│   │   ├── me/                   # Perfil de usuario
│   │   │   └── password/         # Cambio de contraseña
│   │   ├── memberships/          # Gestión de membresías
│   │   ├── my-attendances/       # Historial de asistencias
│   │   ├── my-memberships/       # Membresías del usuario
│   │   ├── my-payments/          # Pagos del usuario
│   │   ├── my-reservations/      # Reservaciones del usuario
│   │   ├── payments/             # Gestión de pagos
│   │   │   └── [id]/             # Pago específico (aprobar/rechazar)
│   │   ├── plans/                # Gestión de planes
│   │   │   └── [id]/             # Plan específico
│   │   ├── qr/                   # Generación de códigos QR
│   │   │   └── generate/         # Generar QR dinámico
│   │   ├── reports/              # Reportes y estadísticas
│   │   └── users/                # Gestión de usuarios
│   │       ├── [id]/             # Usuario específico
│   │       └── [id]/history/     # Historial completo del usuario
│   ├── dashboard/                # Páginas del dashboard
│   │   ├── admin/                # Dashboard de administrador
│   │   │   ├── classes/          # Gestión de clases
│   │   │   ├── disciplines/      # Gestión de disciplinas
│   │   │   ├── memberships/      # Gestión de membresías
│   │   │   ├── plans/            # Gestión de planes
│   │   │   ├── reports/          # Reportes y estadísticas
│   │   │   ├── settings/         # Configuración del sistema
│   │   │   ├── users/            # Gestión de usuarios
│   │   │   ├── layout.tsx        # Layout INDEPENDIENTE con auth + Sidebar
│   │   │   └── page.tsx          # Panel principal
│   │   ├── staff/                # Dashboard de recepcionista
│   │   │   ├── layout.tsx        # Layout INDEPENDIENTE con auth + Sidebar
│   │   │   └── page.tsx          # Check-in de usuarios
│   │   ├── client/               # Dashboard de cliente
│   │   │   ├── classes/          # Ver y reservar clases
│   │   │   ├── history/          # Historial de asistencias
│   │   │   ├── payments/         # Pagos y compras
│   │   │   ├── qr/               # Código QR de acceso
│   │   │   ├── layout.tsx        # Layout INDEPENDIENTE con auth + Navbar
│   │   │   └── page.tsx          # Panel principal
│   │   └── layout.tsx            # Layout base (solo wrapper mínimo)
│   ├── globals.css               # Estilos globales
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Página de login
├── components/                   # Componentes reutilizables
│   ├── Navbar.tsx                # Navbar horizontal (clientes)
│   ├── Sidebar.tsx               # Sidebar vertical (admin/staff)
│   └── ReceiptModal.tsx          # Modal de comprobantes de pago
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
└── public/                       # Archivos estáticos
```

**Nota sobre Layouts:**
- Cada dashboard (`admin/`, `staff/`, `client/`) tiene su **propio layout completamente independiente**
- Cada layout incluye su propia lógica de autenticación, protección de rutas y componente de navegación
- El `dashboard/layout.tsx` es solo un wrapper mínimo (puede estar casi vacío)

---

## 👥 Sistema de Roles

El sistema tiene **3 roles** con diferentes niveles de acceso y navegación personalizada:

| Rol | Descripción | Dashboard | Navegación | Permisos |
|-----|-------------|-----------|------------|----------|
| `ADMIN` | Administrador | `/dashboard/admin` | **Sidebar vertical** | Acceso total: usuarios, pagos, planes, clases, disciplinas, reportes, configuración |
| `STAFF` | Recepcionista | `/dashboard/staff` | **Sidebar vertical** | Check-in de usuarios, visualización de clases, usuarios |
| `CLIENT` | Cliente | `/dashboard/client` | **Navbar horizontal** | Ver membresías, reservar clases, QR de acceso, historial, pagos |

### Protección de Rutas

La protección se maneja en `lib/route-protection.ts`:

```typescript
// Permisos por ruta
/dashboard/admin   → Solo ADMIN
/dashboard/staff   → ADMIN, STAFF
/dashboard/client  → ADMIN, STAFF, CLIENT (todos)
```

### Navegación por Rol

#### Admin (Sidebar)
- Dashboard
- Usuarios
- Disciplinas
- Clases
- Planes
- Membresías
- Reportes
- Configuración

#### Staff (Sidebar)
- Escáner (Check-in)
- Clases
- Pagos
- Usuarios

#### Client (Navbar)
- Inicio
- Clases
- Pagos
- Mi QR
- Historial

---

## 📊 Modelo de Datos (Prisma Schema)

### Enums

```typescript
enum UserRole { 
  ADMIN,    // Administrador con acceso total
  STAFF,    // Recepcionista
  CLIENT    // Cliente del gimnasio
}

enum MembershipStatus { 
  ACTIVE,   // Membresía activa
  EXPIRED,  // Membresía vencida
  PENDING   // Pago pendiente de aprobación
}

enum ReservationStatus { 
  ACTIVE,     // Reservación confirmada
  ATTENDED,   // Asistió a la clase
  CANCELLED,  // Cancelada por el usuario
  NO_SHOW     // No asistió
}

enum PaymentStatus { 
  PENDING,   // Pendiente de aprobación
  APPROVED,  // Aprobado
  REJECTED   // Rechazado
}

enum PaymentMethod { 
  CASH,         // Efectivo
  TRANSFER,     // Transferencia bancaria
  CREDIT,       // Tarjeta de crédito
  DEBIT,        // Tarjeta de débito
  MERCADOPAGO   // Mercado Pago
}
```

### Entidades Principales

| Modelo | Descripción | Relaciones Clave |
|--------|-------------|------------------|
| **User** | Usuarios del sistema (admin, staff, clientes) | memberships, reservations, attendances, payments, accessLogs |
| **Discipline** | Disciplinas disponibles (Yoga, Musculación, etc.) | classes, plans, memberships, attendances |
| **Plan** | Planes de membresía con precios y créditos | discipline, memberships, payments |
| **Membership** | Membresías activas de usuarios | user, plan, discipline, reservations, attendances |
| **Class** | Clases programadas por disciplina | discipline, reservations |
| **Reservation** | Reservas de clases con sistema de cancelación | user, class, membership |
| **Attendance** | Registro de asistencias (check-in) | user, discipline, membership |
| **Payment** | Pagos registrados con sistema de aprobación | user, plan |
| **AccessLog** | Log de accesos mediante QR | user |
| **BankInfo** | Datos bancarios para transferencias | - |
| **SystemConfig** | Configuraciones del sistema (clave-valor) | - |

### Campos Importantes

#### User
- `rol`: ADMIN, STAFF, o CLIENT
- `isActive`: Control de acceso
- `pushToken`: Para notificaciones push

#### Membership
- `totalCredits` / `remainingCredits`: Sistema de créditos
- `isUnlimited`: Membresías ilimitadas
- `expirationDate`: Control de vencimiento
- `status`: ACTIVE, EXPIRED, PENDING

#### Reservation
- `status`: ACTIVE, ATTENDED, CANCELLED, NO_SHOW
- `cancelledAt`: Timestamp de cancelación
- **Constraint único**: `[userId, classId]` - Un usuario no puede reservar la misma clase dos veces

#### Payment
- `status`: PENDING, APPROVED, REJECTED
- `proofPhoto`: Comprobante de transferencia
- `approvedBy`: ID del admin que aprobó
- `approvedAt` / `rejectedAt`: Timestamps

### Diagrama de Relaciones

```
User ─────┬──── Membership ──── Plan ──── Discipline
          │          │
          │          └──── Reservation ──── Class ──── Discipline
          │
          ├──── Attendance ──── Discipline
          │                         │
          │                    Membership
          │
          ├──── Payment ──── Plan
          │
          └──── AccessLog
```

---

## 🔌 APIs (Endpoints)

### Base URL: `/api`

### 🔐 Autenticación

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| `POST` | `/api/login` | Iniciar sesión | ❌ | - |
| `POST` | `/api/logout` | Cerrar sesión | ✅ | Todos |

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

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| `GET` | `/api/me` | Obtener perfil del usuario autenticado | ✅ | Todos |
| `PUT` | `/api/me` | Actualizar perfil (nombre, email, teléfono) | ✅ | Todos |
| `PUT` | `/api/me/password` | Cambiar contraseña | ✅ | Todos |

---

### 👥 Gestión de Usuarios (Admin)

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| `GET` | `/api/users` | Listar todos los usuarios | ✅ | Admin |
| `GET` | `/api/users/[id]` | Obtener usuario específico | ✅ | Admin |
| `PUT` | `/api/users/[id]` | Actualizar usuario | ✅ | Admin |
| `DELETE` | `/api/users/[id]` | Eliminar/desactivar usuario | ✅ | Admin |
| `GET` | `/api/users/[id]/history` | Historial completo del usuario | ✅ | Admin |

#### GET /api/users/[id]/history

**Response:**
```json
{
  "user": {
    "id": 5,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "rol": "CLIENT"
  },
  "activeMemberships": [
    {
      "id": 1,
      "discipline": "Musculación",
      "plan": "Plan Mensual",
      "remainingCredits": 15,
      "totalCredits": 20,
      "expirationDate": "2025-12-31"
    }
  ],
  "reservations": [
    {
      "id": 10,
      "className": "Yoga Matutino",
      "discipline": "Yoga",
      "startTime": "2025-12-15T09:00:00Z",
      "status": "ACTIVE",
      "createdAt": "2025-12-10T10:00:00Z"
    }
  ],
  "attendances": [
    {
      "id": 50,
      "discipline": "Musculación",
      "checkInTime": "2025-12-10T08:00:00Z",
      "type": "direct_access"
    }
  ],
  "payments": [
    {
      "id": 3,
      "plan": "Plan Mensual",
      "amount": 5000,
      "method": "TRANSFER",
      "status": "APPROVED",
      "createdAt": "2025-12-01T10:00:00Z"
    }
  ],
  "stats": {
    "totalReservations": 25,
    "attended": 20,
    "noShow": 3,
    "cancelled": 2,
    "attendanceRate": 80,
    "totalPaid": 15000,
    "totalPayments": 3
  }
}
```

---

### 🎯 Disciplinas

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| `GET` | `/api/disciplines` | Listar disciplinas activas | ✅ | Todos |
| `POST` | `/api/disciplines` | Crear nueva disciplina | ✅ | Admin |
| `PUT` | `/api/disciplines/[id]` | Actualizar disciplina | ✅ | Admin |
| `DELETE` | `/api/disciplines/[id]` | Eliminar disciplina | ✅ | Admin |

---

### 📋 Planes de Membresía

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| `GET` | `/api/plans` | Listar planes activos | ✅ | Todos |
| `POST` | `/api/plans` | Crear nuevo plan | ✅ | Admin |
| `PUT` | `/api/plans/[id]` | Actualizar plan | ✅ | Admin |
| `DELETE` | `/api/plans/[id]` | Eliminar plan | ✅ | Admin |

---

### 🎫 Membresías

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| `GET` | `/api/my-memberships` | Obtener membresías del usuario autenticado | ✅ | Todos |
| `GET` | `/api/memberships` | Listar todas las membresías (filtros disponibles) | ✅ | Admin |
| `POST` | `/api/memberships` | Crear nueva membresía | ✅ | Admin |

**GET /api/my-memberships Response:**
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

### 📅 Clases

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| `GET` | `/api/classes` | Listar clases disponibles (con filtros) | ✅ | Todos |
| `POST` | `/api/classes` | Crear nueva clase | ✅ | Admin |
| `POST` | `/api/classes/bulk` | Crear múltiples clases (recurrencia) | ✅ | Admin |
| `PUT` | `/api/classes/[id]` | Actualizar clase | ✅ | Admin |
| `DELETE` | `/api/classes/[id]` | Eliminar clase | ✅ | Admin |

**GET /api/classes Query Params:**
- `disciplineId`: Filtrar por disciplina
- `startDate`: Fecha de inicio
- `endDate`: Fecha de fin

**Response:**
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

---

### 📝 Reservaciones

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| `POST` | `/api/classes/reserve` | Reservar una clase | ✅ | Todos |
| `DELETE` | `/api/classes/cancel/[id]` | Cancelar reservación | ✅ | Todos |
| `GET` | `/api/my-reservations` | Reservaciones activas del usuario | ✅ | Todos |

**POST /api/classes/reserve:**

**Request:**
```json
{
  "classId": 1
}
```

**Validaciones:**
- Usuario debe tener membresía activa de la disciplina
- No puede reservar la misma clase dos veces
- La clase debe tener cupos disponibles
- Membresía debe tener créditos disponibles (si no es ilimitada)

**Response (200):**
```json
{
  "message": "Reservación exitosa",
  "reservation": {
    "id": 10,
    "classId": 1,
    "className": "Yoga Matutino",
    "startTime": "2025-12-10T09:00:00.000Z",
    "status": "ACTIVE"
  }
}
```

**DELETE /api/classes/cancel/[id]:**

**Reglas de Cancelación:**
- Debe cancelarse con **al menos 3 horas de anticipación**
- Si se cancela con menos de 3 horas, **NO se reembolsa el crédito**
- Si se cancela dentro del tiempo permitido, el crédito se devuelve

**Response (200):**
```json
{
  "message": "Reservación cancelada exitosamente",
  "creditRefunded": true
}
```

---

### 📊 Asistencias

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| `GET` | `/api/my-attendances` | Historial de asistencias del usuario | ✅ | Todos |
| `POST` | `/api/check-in` | Registrar entrada de usuario | ✅ | Staff, Admin |

**POST /api/check-in:**

**Request (Manual):**
```json
{
  "user_id": 5,
  "discipline_id": 1
}
```

**Request (con QR):**
```json
{
  "qr_data": "eyJpZCI6MSwi...",
  "discipline_id": 1
}
```

**Response:**
```json
{
  "message": "Check-in exitoso",
  "attendance": {
    "id": 50,
    "userName": "Juan Pérez",
    "discipline": "Musculación",
    "checkInTime": "2025-12-10T08:00:00Z",
    "remainingCredits": 14
  }
}
```

---

### 💰 Pagos

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| `GET` | `/api/my-payments` | Historial de pagos del usuario | ✅ | Todos |
| `GET` | `/api/payments` | Listar todos los pagos (con filtros) | ✅ | Admin, Staff |
| `POST` | `/api/payments` | Crear nuevo pago | ✅ | Todos |
| `PUT` | `/api/payments/[id]` | Aprobar/rechazar pago | ✅ | Admin |

**GET /api/payments Query Params:**
- `status`: PENDING, APPROVED, REJECTED
- `userId`: Filtrar por usuario
- `startDate` / `endDate`: Rango de fechas

**PUT /api/payments/[id] (Aprobar):**
```json
{
  "action": "approve",
  "notes": "Verificado"
}
```

Al aprobar un pago:
1. Se actualiza el estado a `APPROVED`
2. Se crea automáticamente la **Membership** asociada
3. Se registra quién aprobó y cuándo

---

### 📱 QR de Acceso

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| `POST` | `/api/qr/generate` | Generar código QR dinámico (5 min) | ✅ | CLIENT |

**Response:**
```json
{
  "qr_data": "eyJpZCI6NSwidGltZXN0YW1wIjoxNzAyM...签名",
  "expires_in": 300
}
```

El QR incluye:
- ID del usuario
- Timestamp de generación
- Firma criptográfica (verificación de integridad)
- Validez de 5 minutos

---

### 📈 Reportes y Estadísticas

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| `GET` | `/api/reports` | Estadísticas del gimnasio | ✅ | Admin |

**Response:**
```json
{
  "today": {
    "attendances": 45,
    "reservations": 20,
    "revenue": 25000
  },
  "thisMonth": {
    "newMembers": 12,
    "totalRevenue": 150000,
    "activeMembers": 85
  },
  "topDisciplines": [
    { "name": "Musculación", "attendances": 250 },
    { "name": "Yoga", "attendances": 180 }
  ]
}
```

---

## 🔐 Autenticación

### JWT (JSON Web Tokens) con HttpOnly Cookies 🔒

El sistema utiliza **JWT** almacenado en **cookies HttpOnly** para máxima seguridad:

**Características de Seguridad:**
- **HttpOnly**: JavaScript NO puede acceder al token (protección contra XSS)
- **SameSite: lax**: Protección contra CSRF
- **Secure**: Solo HTTPS en producción
- **Expiración**: 7 días
- **Path**: `/` (disponible en toda la aplicación)

### Flujo de Autenticación

```
1. Usuario ingresa credenciales → POST /api/login
2. Backend valida credenciales con bcrypt
3. Backend genera JWT con { id, email, rol }
4. Backend setea cookie HttpOnly con el token
5. Frontend guarda solo datos públicos del usuario en Zustand
6. Cada request incluye credentials: 'include' para enviar cookie
7. Backend lee y verifica token desde cookie automáticamente
8. Al hacer logout, cookie se elimina con maxAge: 0
```

### Implementación en `lib/auth.ts`

```typescript
// Configuración de cookie
export const COOKIE_OPTIONS = {
    httpOnly: true,      // JavaScript NO puede acceder
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: '/',
};

// Generar token
export function generateToken(payload: { id: number; email: string; rol: string }) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verificar request (lee de header O cookie)
export async function authenticateRequest(authHeader: string | null, request: NextRequest) {
    // Intenta leer de cookie primero, luego de header
    const token = request.cookies.get('auth_token')?.value || 
                  authHeader?.replace('Bearer ', '');
    
    // Verifica y decodifica
    return jwt.verify(token, JWT_SECRET);
}
```

### Haciendo Requests desde el Frontend

```typescript
// SIEMPRE incluir credentials: 'include' para enviar la cookie
const response = await fetch('/api/my-memberships', {
    credentials: 'include',
});

// Para POST/PUT con body
const response = await fetch('/api/classes/reserve', {
    method: 'POST',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ classId: 1 }),
});
```

---

## 💾 Estado Global (Zustand)

### auth.store.ts

```typescript
interface AuthState {
  // Estado
  user: StoreUser | null;      // Datos públicos del usuario
  isAuthenticated: boolean;    // Si hay sesión activa
  isLoading: boolean;          // Cargando datos

  // Actions
  login: (user: StoreUser) => void;
  logout: () => void;
  updateUser: (user: Partial<StoreUser>) => void;
  setLoading: (loading: boolean) => void;
}

// Tipo de usuario en el store
interface StoreUser {
  id: number;
  name: string;
  email: string;
  rol: 'ADMIN' | 'STAFF' | 'CLIENT';
  phone?: string;
  profilePhoto?: string;
}

// ⚠️ IMPORTANTE: NO se guarda el token en el store
// El token está en una cookie HttpOnly (seguridad)

// Selectores optimizados para componentes
export const useUser = () => useAuthStore(state => state.user);
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated);
export const useIsAdmin = () => useAuthStore(state => state.user?.rol === 'ADMIN');
export const useIsStaff = () => useAuthStore(state => state.user?.rol === 'STAFF');
export const useIsClient = () => useAuthStore(state => state.user?.rol === 'CLIENT');
```

### membership.store.ts

```typescript
interface MembershipState {
  memberships: Membership[];
  isLoading: boolean;
  
  setMemberships: (memberships: Membership[]) => void;
  updateMembership: (id: number, data: Partial<Membership>) => void;
  fetchMemberships: () => Promise<void>;
}
```

---

## ✅ Validaciones (Zod)

Todas las validaciones están centralizadas en `lib/validations.ts`:

| Schema | Uso | Campos Validados |
|--------|-----|------------------|
| `loginSchema` | Login de usuarios | email, password |
| `registerSchema` | Registro de nuevos usuarios | name, email, password, rol |
| `changePasswordSchema` | Cambio de contraseña | currentPassword, newPassword, confirmPassword |
| `reserveClassSchema` | Reservar clase | classId |
| `checkInSchema` | Check-in de usuarios | user_id o qr_data, discipline_id |
| `createPlanSchema` | Crear planes | name, price, credits, disciplineId, durationDays |
| `createClassSchema` | Crear clases | name, disciplineId, startTime, endTime, capacity |
| `createDisciplineSchema` | Crear disciplinas | name, description, requiresReservation |
| `approvePaymentSchema` | Aprobar/rechazar pagos | action, notes |

---

## 🎨 Dashboard por Rol

### 🔴 Admin (`/dashboard/admin`) - Sidebar Vertical

**Layout:** Sidebar fijo a la izquierda con navegación vertical

**Páginas:**
1. **Dashboard (`/`)** - Estadísticas del día
   - Total de asistencias
   - Ingresos del día
   - Reservaciones activas
   - Gráficos y métricas

2. **Usuarios (`/users`)** - Gestión completa
   - Lista de todos los usuarios
   - Crear/editar/eliminar usuarios
   - Ver historial completo (reservas, asistencias, pagos)
   - Filtros por rol y estado

3. **Disciplinas (`/disciplines`)** - CRUD de disciplinas
   - Crear disciplinas (Yoga, Musculación, etc.)
   - Configurar si requiere reservación
   - Asignar colores e iconos

4. **Clases (`/classes`)** - Programación de clases
   - Calendario de clases
   - Crear clases individuales o recurrentes
   - Ver cupos y reservas
   - Asignar instructores

5. **Planes (`/plans`)** - Gestión de planes de membresía
   - Crear planes por disciplina
   - Configurar precio, créditos, duración
   - Planes ilimitados o por créditos

6. **Membresías (`/memberships`)** - Gestión de membresías activas
   - Ver todas las membresías
   - Filtrar por estado (activas, vencidas)
   - Crear membresías manualmente

7. **Reportes (`/reports`)** - Estadísticas y reportes
   - Reportes de ingresos
   - Disciplinas más populares
   - Tasa de asistencia
   - Exportar datos

8. **Configuración (`/settings`)** - Configuración del sistema
   - Datos bancarios para transferencias
   - Configuraciones generales

### 🟡 Staff (`/dashboard/staff`) - Sidebar Vertical

**Layout:** Sidebar fijo a la izquierda con navegación vertical

**Páginas:**
1. **Escáner (`/`)** - Check-in de usuarios
   - Escanear QR de usuarios
   - Búsqueda manual por nombre
   - Seleccionar disciplina
   - Ver créditos restantes

2. **Clases (`/classes`)** - Ver clases programadas
   - Calendario de clases
   - Ver cupos y reservas

3. **Pagos (`/payments`)** - Ver pagos
   - Lista de pagos pendientes y aprobados
   - Ver comprobantes

4. **Usuarios (`/users`)** - Consulta de usuarios
   - Buscar usuarios
   - Ver información básica

### 🟢 Client (`/dashboard/client`) - Navbar Horizontal

**Layout:** Navbar horizontal en la parte superior

**Páginas:**
1. **Inicio (`/`)** - Panel principal
   - Resumen de membresías activas
   - Créditos disponibles
   - Próximas clases reservadas
   - Días restantes de membresía

2. **Clases (`/classes`)** - Ver y reservar clases
   - Calendario de clases disponibles
   - Filtrar por disciplina
   - Reservar clases (si tiene membresía activa)
   - Ver mis reservas
   - **Cancelar reservas** (3 horas de anticipación)

3. **Pagos (`/payments`)** - Gestión de pagos
   - Comprar nueva membresía
   - Ver planes disponibles
   - Subir comprobante de pago
   - Historial de pagos

4. **Mi QR (`/qr`)** - Código de acceso
   - Generar código QR dinámico (válido 5 minutos)
   - Mostrar para escanear en recepción

5. **Historial (`/history`)** - Historial de asistencias
   - Lista de asistencias pasadas
   - Por disciplina y fecha
   - Tasa de asistencia

---

## 🎨 Componentes de UI

### Sidebar.tsx (Admin/Staff)
- Navegación vertical fija
- Logo y nombre del gimnasio
- Avatar del usuario
- Menú dinámico según rol
- Botón de cerrar sesión
- **Responsive**: Menu hamburguesa en móvil

### Navbar.tsx (Client)
- Navegación horizontal superior
- Links de páginas principales
- Avatar del usuario
- Dropdown de perfil
- **Responsive**: Menu colapsable en móvil

### ReceiptModal.tsx
- Modal para ver comprobantes de pago
- Visualización de imagen
- Información del pago
- Acciones de aprobar/rechazar (Admin)

---

## 🚀 Ejecución

### Desarrollo
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Ejecutar migraciones
npx prisma migrate dev

# Seed de datos iniciales
npx prisma db seed

# Iniciar servidor de desarrollo
npm run dev
```

### Variables de Entorno
```env
# .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/gimnasio"
JWT_SECRET="tu-secreto-muy-seguro-aqui"
NODE_ENV="development"
```

### Scripts Disponibles
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npx prisma studio    # GUI de base de datos
npx prisma migrate   # Gestión de migraciones
```

### Usuarios de Prueba (Seed)
| Rol | Email | Contraseña | Descripción |
|-----|-------|------------|-------------|
| **Admin** | admin@gym.com | 123456 | Acceso completo al sistema |
| **Staff** | recepcion@gym.com | 123456 | Check-in y consultas |
| **Cliente** | cliente@gym.com | 123456 | Usuario de prueba con membresías |

---

## 🛠️ Tecnologías

### Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Next.js** | 15 | Framework React con App Router |
| **React** | 18 | Biblioteca UI |
| **TypeScript** | 5 | Tipado estático |
| **Tailwind CSS** | 3 | Estilos utility-first |
| **Zustand** | 4 | Estado global minimalista |
| **react-hot-toast** | - | Notificaciones toast |
| **Lucide React** | - | Librería de iconos |
| **QRCode.react** | - | Generación de códigos QR |

### Backend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Prisma** | 5 | ORM para PostgreSQL |
| **PostgreSQL** | 14+ | Base de datos relacional |
| **Zod** | 3 | Validación de esquemas |
| **jsonwebtoken** | - | Generación y validación de JWT |
| **bcryptjs** | - | Hash de contraseñas |

---

## 📁 Archivos Clave

| Archivo | Propósito | Ubicación |
|---------|-----------|-----------|
| **Hook Compartido (DRY)** | | |
| `useLayoutAuth.ts` | Hook de auth compartido (DRY + SRP) | `lib/hooks/useLayoutAuth.ts` |
| **Layouts Independientes** | | |
| `admin/layout.tsx` | Layout Admin (usa hook + Sidebar) | `app/dashboard/admin/layout.tsx` |
| `staff/layout.tsx` | Layout Staff (usa hook + Sidebar) | `app/dashboard/staff/layout.tsx` |
| `client/layout.tsx` | Layout Client (usa hook + Navbar) | `app/dashboard/client/layout.tsx` |
| **Componentes de Navegación** | | |
| `Sidebar.tsx` | Navegación vertical (Admin/Staff) | `components/Sidebar.tsx` |
| `Navbar.tsx` | Navegación horizontal (Client) | `components/Navbar.tsx` |
| **Base de Datos** | | |
| `schema.prisma` | Definición del modelo de datos | `prisma/schema.prisma` |
| `seed.ts` | Datos iniciales (usuarios, disciplinas) | `prisma/seed.ts` |
| **Autenticación y Estado** | | |
| `auth.ts` | Funciones de JWT y cookies | `lib/auth.ts` |
| `auth.store.ts` | Estado de autenticación (Zustand) | `lib/stores/auth.store.ts` |
| `route-protection.ts` | Protección de rutas por rol | `lib/route-protection.ts` |
| **Validaciones** | | |
| `validations.ts` | Esquemas de validación Zod | `lib/validations.ts` |
| **Layout Base** | | |
| `dashboard/layout.tsx` | Layout base (wrapper mínimo) | `app/dashboard/layout.tsx` |

---

## 🌟 Características Destacadas

### ✨ Sistema de Navegación Diferenciado
- **Admin/Staff**: Sidebar vertical fijo (siempre visible en desktop)
- **Client**: Navbar horizontal limpio y moderno
- **Responsive**: Menús colapsables en móvil

### 🎫 Sistema de Reservas Inteligente
- Un usuario no puede reservar la misma clase dos veces
- Validación de créditos disponibles
- Cancelación con política de 3 horas
- Reembolso automático de créditos (si se cancela a tiempo)

### 💳 Gestión de Pagos
- Múltiples métodos de pago (efectivo, transferencia, tarjetas, MercadoPago)
- Sistema de aprobación manual para transferencias
- Creación automática de membresía al aprobar pago
- Historial completo de pagos por usuario

### 📊 Historial Completo de Usuarios
- Endpoint `/api/users/[id]/history` con toda la información
- Reservaciones, asistencias, pagos, membresías activas
- Estadísticas calculadas (tasa de asistencia, total pagado, etc.)

### 🔐 Seguridad Robusta
- JWT en cookies HttpOnly (protección contra XSS)
- Protección CSRF con SameSite
- Hash de contraseñas con bcrypt
- Validación de datos con Zod
- Protección de rutas por rol

### 📱 Códigos QR Dinámicos
- QR temporal con validez de 5 minutos
- Firma criptográfica para verificar integridad
- Check-in rápido y seguro

---

## 🏗️ Arquitectura de Layouts Independientes

### Filosofía de Diseño: DRY + SRP

Cada dashboard (Admin, Staff, Client) funciona como una **aplicación independiente** dentro del sistema, aplicando dos principios fundamentales:

**DRY (Don't Repeat Yourself):**
- Lógica de autenticación centralizada en `useLayoutAuth` hook
- Sin duplicación de código entre layouts
- Fácil mantenimiento: cambios en un solo lugar

**SRP (Single Responsibility Principle):**
- **useLayoutAuth**: Única responsabilidad = Autenticación y protección de rutas
- **AdminLayout**: Única responsabilidad = Renderizar layout con Sidebar
- **StaffLayout**: Única responsabilidad = Renderizar layout con Sidebar
- **ClientLayout**: Única responsabilidad = Renderizar layout con Navbar

### Ventajas de esta Arquitectura

- **Independencia visual**: Cada dashboard tiene su propio componente de navegación
- **Código compartido**: La lógica de auth está en un solo lugar (DRY)
- **Responsabilidades claras**: Cada componente hace una sola cosa (SRP)
- **Fácil testing**: Hook y layouts se pueden testear por separado
- **Mantenimiento**: Cambios de auth en un lugar, cambios de UI en cada layout

### Hook Compartido: useLayoutAuth

**Ubicación:** `lib/hooks/useLayoutAuth.ts`

**Responsabilidad única:** Manejar autenticación y protección de rutas

```typescript
export function useLayoutAuth() {
    // 1. Verifica autenticación
    if (!isAuthenticated) router.push('/');
    
    // 2. Verifica integridad de datos
    if (!user || !user.rol) {
        logout();
        toast.error('Sesión inválida');
        router.push('/');
    }
    
    // 3. Verifica permisos de ruta
    const redirectPath = getRedirectPath(user.rol, pathname);
    if (redirectPath) router.push(redirectPath);
    
    // 4. Retorna estado
    return { isChecking, user, isAuthenticated };
}
```

### Estructura de Cada Layout

Todos los layouts (`admin/layout.tsx`, `staff/layout.tsx`, `client/layout.tsx`) son **simples y concisos**:

```typescript
export default function AdminLayout({ children }) {
    // 1. Usar hook compartido (DRY)
    const { isChecking, user, isAuthenticated } = useLayoutAuth();
    
    // 2. Mostrar loading
    if (isChecking || !user) return <LoadingSpinner />;
    if (!isAuthenticated) return null;
    
    // 3. Renderizar layout específico (SRP)
    return (
        <div>
            <Sidebar />  {/* o <Navbar /> para Client */}
            <main>{children}</main>
        </div>
    );
}
```

### Flujo de Autenticación

```
Usuario accede a /dashboard/admin/users
    ↓
1. AdminLayout se monta
    ↓
2. useLayoutAuth verifica autenticación
    ↓
3. ¿Autenticado? NO → Redirect a /
    ↓ SÍ
4. ¿Datos válidos? NO → Logout + Redirect
    ↓ SÍ
5. ¿Tiene permiso? NO → Redirect a su dashboard
    ↓ SÍ
6. AdminLayout renderiza <Sidebar /> + children
```

### Comparación: Antes vs Después

| Aspecto | Antes (Código Duplicado) | Después (DRY + SRP) |
|---------|-------------------------|---------------------|
| **Líneas por layout** | ~80 líneas | ~35 líneas |
| **Lógica de auth** | Repetida 3 veces | Una sola vez en hook |
| **Mantenimiento** | Cambiar en 3 lugares | Cambiar en 1 lugar |
| **Responsabilidades** | Mezcladas (auth + UI) | Separadas (hook + layout) |
| **Testing** | Difícil (lógica mezclada) | Fácil (componentes aislados) |
| **Legibilidad** | Compleja (mucho código) | Simple (fácil de entender) |

---

## 📐 Estructura de Layouts

### Parámetros Asíncronos en Next.js 15
En Next.js 15, los parámetros de ruta (`params`) son **promesas**:

```typescript
// ✅ Correcto en Next.js 15
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // Await params
  // ...
}

// ❌ Incorrecto (Next.js 14)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id; // No funciona en Next.js 15
}
```

### Estructura de Layouts

Cada dashboard tiene su **propio layout completamente independiente** con toda la lógica de autenticación y protección de rutas:

```
app/dashboard/
  layout.tsx              # Layout base (puede estar vacío o con lógica mínima)
  admin/
    layout.tsx            # Layout INDEPENDIENTE con auth + Sidebar
    page.tsx              # Solo contenido
  staff/
    layout.tsx            # Layout INDEPENDIENTE con auth + Sidebar
    page.tsx              # Solo contenido
  client/
    layout.tsx            # Layout INDEPENDIENTE con auth + Navbar
    page.tsx              # Solo contenido
```

**Cada layout incluye:**
- ✅ Verificación de autenticación
- ✅ Protección de rutas por rol
- ✅ Redirecciones automáticas
- ✅ Estados de carga
- ✅ Manejo de errores
- ✅ Su propio componente de navegación (Sidebar o Navbar)

---

## 📝 Notas Finales

### Cambios Importantes en Versión 2.0

1. **Arquitectura DRY + SRP**: 
   - **DRY (Don't Repeat Yourself)**: Lógica de auth centralizada en hook `useLayoutAuth`
   - **SRP (Single Responsibility Principle)**: Cada componente tiene una única responsabilidad
   - Reducción de código: De ~80 líneas por layout a ~35 líneas
   - Mantenimiento: Cambios de auth en un solo lugar

2. **Layouts Independientes**: Cada dashboard (admin, staff, client) tiene:
   - Su propio layout con componente de navegación específico
   - Uso del hook compartido para auth (DRY)
   - Responsabilidad única: renderizar UI (SRP)

3. **Navegación Diferenciada**: 
   - Admin/Staff: Sidebar vertical fijo
   - Client: Navbar horizontal limpio

4. **Sistema de Reservas**: Política de cancelación de 3 horas con reembolso automático de créditos

5. **Gestión de Pagos**: Aprobación manual con creación automática de membresías

6. **Historial Completo**: Endpoint `/api/users/[id]/history` con estadísticas detalladas

### Principios de Diseño Aplicados

- ✅ **DRY**: No repetir código (hook compartido)
- ✅ **SRP**: Una responsabilidad por componente
- ✅ **Separation of Concerns**: Lógica separada de presentación
- ✅ **Composition over Inheritance**: Composición con hooks
- ✅ **KISS**: Keep It Simple (layouts concisos y claros)

### ⚠️ Nota Importante

**Páginas de cliente** (`/dashboard/client/*`) deben seguir esta estructura:

```tsx
// ✅ CORRECTO
export default function ClientPage() {
    return (
        <>
            {/* Solo contenido, sin wrappers */}
            <div className="mb-8">
                <h1>Título</h1>
            </div>
        </>
    );
}
```

**NO incluir:**
- ❌ `import Navbar from '@/components/Navbar';`
- ❌ `<div className="min-h-screen...">`
- ❌ `<Navbar />`
- ❌ `<main>`

El `client/layout.tsx` ya maneja todo esto.

**Estado de las páginas:**
- ✅ `app/dashboard/client/page.tsx` - **COMPLETADO**
- ✅ `app/dashboard/client/history/page.tsx` - **COMPLETADO**
- ✅ `app/dashboard/client/qr/page.tsx` - **COMPLETADO**
- ✅ `app/dashboard/client/payments/page.tsx` - **COMPLETADO**
- ✅ `app/dashboard/client/classes/page.tsx` - **COMPLETADO**

🎉 **Refactorización DRY + SRP: 100% COMPLETADA**

### 📋 Instrucciones para arreglar `classes/page.tsx`:

1. Eliminar línea 5: `import Navbar from '@/components/Navbar';`
2. Reemplazar líneas 153-157:
   ```tsx
   // Antes (líneas 153-157)
   return (
       <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
           <Navbar activeTab="clases" />
           <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
   
   // Después
   return (
       <>
   ```
3. Reemplazar líneas 274-275:
   ```tsx
   // Antes (líneas 274-275)
           </main>
       </div>
   
   // Después
       </>
   ```

Ver `DRY-SRP-REFACTOR.md` para instrucciones detalladas.

---

*Última actualización: Diciembre 10, 2025*  
*Versión: 2.0*  
*Arquitectura: DRY + SRP con Layouts Independientes*
