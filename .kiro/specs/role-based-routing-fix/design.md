# Design Document: Role-Based Routing Fix

## Overview

Este diseño soluciona el problema de enrutamiento basado en roles donde los usuarios ADMIN son incorrectamente redirigidos a la vista de cliente después del login. El problema radica en la falta de una protección de rutas centralizada y consistente que verifique el rol del usuario y lo redirija apropiadamente.

La solución implementa un sistema de protección de rutas en dos niveles:
1. **Middleware de Next.js**: Para protección a nivel de servidor
2. **Layout mejorado**: Para protección y redirección a nivel de cliente

## Architecture

### Current Architecture Issues

El sistema actual tiene los siguientes problemas:

1. **Redirección en múltiples lugares**: La lógica de redirección está duplicada en:
   - `app/page.tsx` (página de login)
   - Cada página individual del dashboard (`admin/page.tsx`, `client/page.tsx`, `staff/page.tsx`)

2. **Layout sin verificación de rol**: El `dashboard/layout.tsx` solo verifica autenticación, no el rol del usuario

3. **Race conditions**: Puede haber condiciones de carrera entre la redirección del login y las verificaciones de las páginas individuales

4. **Persistencia del estado**: El estado se persiste correctamente, pero las verificaciones no son consistentes

### Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Login Page                           │
│                      (app/page.tsx)                          │
│  - Autentica usuario                                         │
│  - Guarda en Auth Store                                      │
│  - Redirección inicial basada en rol                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Middleware                        │
│                   (middleware.ts - NEW)                      │
│  - Verifica token en cookies/headers                         │
│  - Protege rutas /dashboard/*                                │
│  - Redirección temprana si no autenticado                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Dashboard Layout (ENHANCED)                     │
│            (app/dashboard/layout.tsx)                        │
│  - Verifica autenticación desde Auth Store                   │
│  - Verifica rol del usuario                                  │
│  - Redirección basada en rol y ruta actual                   │
│  - Muestra loading durante verificación                      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Admin   │  │  Staff   │  │  Client  │
│   Page   │  │   Page   │  │   Page   │
└──────────┘  └──────────┘  └──────────┘
```

## Components and Interfaces

### 1. Route Protection Utility

**File**: `lib/route-protection.ts` (NEW)

```typescript
interface RouteConfig {
  allowedRoles: UserRole[];
  redirectPath: string;
}

interface RoleRouteMap {
  [key: string]: RouteConfig;
}

// Mapeo de rutas y roles permitidos
const ROUTE_PERMISSIONS: RoleRouteMap

// Función para obtener la ruta correcta según el rol
function getDashboardPathForRole(role: UserRole): string

// Función para verificar si un usuario puede acceder a una ruta
function canAccessRoute(userRole: UserRole, pathname: string): boolean

// Función para obtener la ruta de redirección si no tiene acceso
function getRedirectPath(userRole: UserRole, pathname: string): string | null
```

### 2. Enhanced Dashboard Layout

**File**: `app/dashboard/layout.tsx` (MODIFIED)

Mejoras:
- Agregar verificación de rol
- Implementar redirección basada en rol
- Mejorar manejo de estados de carga
- Prevenir flashes de contenido incorrecto

```typescript
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const user = useUser();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Verificar autenticación y rol
        if (!isAuthenticated) {
            router.push('/');
            return;
        }

        if (user) {
            const redirectPath = getRedirectPath(user.rol, pathname);
            if (redirectPath) {
                router.push(redirectPath);
            } else {
                setIsChecking(false);
            }
        }
    }, [isAuthenticated, user, pathname, router]);

    // Mostrar loading mientras verifica
    if (isChecking || !user) {
        return <LoadingScreen />;
    }

    return <>{children}</>;
}
```

### 3. Individual Dashboard Pages

**Files**: `app/dashboard/admin/page.tsx`, `app/dashboard/staff/page.tsx`, `app/dashboard/client/page.tsx` (MODIFIED)

Simplificación:
- Remover lógica de redirección (ahora manejada por el layout)
- Mantener solo verificación simple para TypeScript
- Confiar en el layout para protección de rutas

### 4. Login Page

**File**: `app/page.tsx` (MODIFIED)

Mejoras:
- Usar la función `getDashboardPathForRole` para redirección consistente
- Agregar pequeño delay antes de redirección para asegurar que el estado se persista

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Role-based login redirection

*For any* valid UserRole (ADMIN, STAFF, CLIENT), when a user with that role completes login, the system should redirect to the correct dashboard path for that role (`/dashboard/admin`, `/dashboard/staff`, or `/dashboard/client` respectively).

**Validates: Requirements 1.1, 2.1, 3.1**

### Property 2: Role-route mismatch redirection

*For any* UserRole and dashboard pathname combination where the user's role does not have permission to access that path, the system should redirect the user to their correct dashboard path.

**Validates: Requirements 1.2, 2.2, 3.2, 3.3, 4.2**

### Property 3: Route persistence on reload

*For any* UserRole, when a user is on their correct dashboard path and the page is reloaded, the system should keep the user on that same path without redirecting.

**Validates: Requirements 1.3, 2.3, 3.4**

### Property 4: Auth state persistence

*For any* user authentication data (token, user object with role), when stored in the Auth Store, the data should persist correctly in localStorage and be recoverable after page reload with all fields intact including the role.

**Validates: Requirements 1.4, 5.1, 5.2, 5.3**

### Property 5: Unauthenticated user redirection

*For any* dashboard route, when accessed by a user who is not authenticated, the system should redirect to the login page (`/`).

**Validates: Requirements 4.3**

### Property 6: Logout cleanup

*For any* authenticated user, when logout is performed, the system should completely clear all authentication data from localStorage, leaving no residual user data or tokens.

**Validates: Requirements 5.4**

## Data Models

No se requieren cambios en los modelos de datos. Los tipos existentes son suficientes:

```typescript
// types/index.ts (NO CHANGES)
export interface User {
    id: number;
    name: string;
    email: string;
    rol: UserRole; // 'ADMIN' | 'STAFF' | 'CLIENT'
    phone?: string;
    profilePhoto?: string;
    isActive: boolean;
}
```

## Error Handling

### Escenarios de Error

1. **Usuario no autenticado intenta acceder al dashboard**
   - Redirección inmediata a `/` (login)
   - No mostrar contenido del dashboard

2. **Usuario con rol incorrecto intenta acceder a ruta protegida**
   - Redirección silenciosa a su dashboard correspondiente
   - No mostrar error al usuario (experiencia fluida)

3. **Estado de autenticación corrupto o inválido**
   - Limpiar localStorage
   - Redirección a login
   - Mostrar mensaje: "Sesión inválida, por favor inicia sesión nuevamente"

4. **Rol no reconocido**
   - Redirección por defecto a `/dashboard/client`
   - Log de error en consola para debugging

### Error Handling Implementation

```typescript
// En dashboard/layout.tsx
try {
    if (!isAuthenticated) {
        router.push('/');
        return;
    }

    if (!user || !user.rol) {
        // Estado corrupto
        logout();
        toast.error('Sesión inválida, por favor inicia sesión nuevamente');
        router.push('/');
        return;
    }

    const redirectPath = getRedirectPath(user.rol, pathname);
    if (redirectPath) {
        router.push(redirectPath);
    }
} catch (error) {
    console.error('Route protection error:', error);
    logout();
    router.push('/');
}
```

## Testing Strategy

### Unit Tests

Se utilizará Jest y React Testing Library para las pruebas unitarias.

**Test File**: `lib/__tests__/route-protection.test.ts`

Tests a implementar:
1. `getDashboardPathForRole` retorna la ruta correcta para cada rol
2. `canAccessRoute` retorna true cuando el rol tiene permiso
3. `canAccessRoute` retorna false cuando el rol no tiene permiso
4. `getRedirectPath` retorna null cuando el usuario puede acceder
5. `getRedirectPath` retorna la ruta correcta cuando el usuario no puede acceder
6. Manejo de roles no reconocidos

**Test File**: `app/dashboard/__tests__/layout.test.tsx`

Tests a implementar:
1. Redirección a login cuando no está autenticado
2. Redirección a dashboard correcto según rol
3. Renderiza children cuando el usuario tiene acceso
4. Muestra loading durante verificación
5. Maneja estado corrupto correctamente

### Property-Based Tests

Se utilizará fast-check para property-based testing.

**Test File**: `lib/__tests__/route-protection.pbt.test.ts`

Properties a testear:
1. **Property 1: Role-route consistency**
   - *For any* valid UserRole, calling `getDashboardPathForRole` then `canAccessRoute` with that path should return true
   - **Validates: Requirements 1.1, 2.1, 3.1**

2. **Property 2: Redirect path validity**
   - *For any* UserRole and pathname combination, if `getRedirectPath` returns a non-null value, that value should be a valid dashboard path
   - **Validates: Requirements 1.2, 2.2, 3.2, 3.3**

3. **Property 3: Access symmetry**
   - *For any* UserRole and pathname, if `canAccessRoute` returns true, then `getRedirectPath` should return null, and vice versa
   - **Validates: Requirements 4.2**

### Integration Tests

**Test File**: `app/__tests__/role-routing.integration.test.tsx`

Tests a implementar:
1. Login como ADMIN y verificar redirección a `/dashboard/admin`
2. Login como STAFF y verificar redirección a `/dashboard/staff`
3. Login como CLIENT y verificar redirección a `/dashboard/client`
4. Intentar acceder a ruta no autorizada y verificar redirección
5. Recargar página y verificar que se mantiene en la ruta correcta

### Manual Testing Checklist

1. Login como ADMIN → Verificar que va a `/dashboard/admin`
2. Estando como ADMIN, navegar manualmente a `/dashboard/client` → Verificar redirección a `/dashboard/admin`
3. Recargar página en `/dashboard/admin` → Verificar que se mantiene
4. Logout y login como CLIENT → Verificar que va a `/dashboard/client`
5. Estando como CLIENT, intentar acceder a `/dashboard/admin` → Verificar redirección a `/dashboard/client`
6. Login como STAFF → Verificar que va a `/dashboard/staff`

## Implementation Notes

### Orden de Implementación

1. Crear `lib/route-protection.ts` con las funciones de utilidad
2. Modificar `app/dashboard/layout.tsx` para usar las nuevas funciones
3. Simplificar las páginas individuales del dashboard
4. Actualizar `app/page.tsx` para usar `getDashboardPathForRole`
5. Agregar tests unitarios
6. Agregar property-based tests
7. Realizar testing manual

### Consideraciones de Performance

- Las verificaciones de rol son síncronas y muy rápidas (< 1ms)
- El estado se lee desde Zustand que ya está en memoria
- No hay llamadas a API adicionales
- El loading screen solo se muestra brevemente durante la verificación inicial

### Backwards Compatibility

- No hay breaking changes en la API
- El Auth Store mantiene la misma interfaz
- Las rutas existentes no cambian
- Los componentes existentes siguen funcionando

### Security Considerations

- La protección de rutas es solo en el frontend (UX)
- El backend ya tiene protección con JWT y verificación de roles
- Nunca confiar solo en la protección del frontend
- Todas las APIs deben verificar roles independientemente
