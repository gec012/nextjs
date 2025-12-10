# Requirements Document

## Introduction

El sistema de gestión de gimnasio tiene un problema crítico de enrutamiento donde los usuarios con rol ADMIN son redirigidos incorrectamente a la vista de cliente después del login, a pesar de que el sistema intenta redirigirlos a la vista de administrador. Este problema afecta la experiencia del usuario y el control de acceso basado en roles.

## Glossary

- **System**: El sistema de gestión de gimnasio basado en Next.js 16
- **User**: Cualquier persona que interactúa con el sistema
- **Role**: El nivel de permisos asignado a un usuario (ADMIN, STAFF, CLIENT)
- **Dashboard**: La interfaz principal después del login
- **Route Protection**: Mecanismo que previene acceso no autorizado a rutas específicas
- **Auth Store**: El almacenamiento de estado de autenticación usando Zustand

## Requirements

### Requirement 1

**User Story:** Como administrador del sistema, quiero que cuando inicie sesión con credenciales de ADMIN, el sistema me redirija y mantenga en la vista de administrador, para poder acceder a las funcionalidades administrativas sin interrupciones.

#### Acceptance Criteria

1. WHEN un usuario con rol ADMIN completa el login THEN el System SHALL redirigir al usuario a /dashboard/admin
2. WHEN un usuario con rol ADMIN accede directamente a /dashboard/client THEN el System SHALL redirigir al usuario a /dashboard/admin
3. WHEN un usuario con rol ADMIN recarga la página en /dashboard/admin THEN el System SHALL mantener al usuario en /dashboard/admin
4. WHEN el Auth Store persiste el rol del usuario THEN el System SHALL mantener el rol correcto después de recargas de página

### Requirement 2

**User Story:** Como miembro del staff, quiero que cuando inicie sesión con credenciales de STAFF, el sistema me redirija y mantenga en la vista de staff, para poder realizar mis tareas de recepción sin problemas.

#### Acceptance Criteria

1. WHEN un usuario con rol STAFF completa el login THEN el System SHALL redirigir al usuario a /dashboard/staff
2. WHEN un usuario con rol STAFF accede directamente a /dashboard/client THEN el System SHALL redirigir al usuario a /dashboard/staff
3. WHEN un usuario con rol STAFF recarga la página en /dashboard/staff THEN el System SHALL mantener al usuario en /dashboard/staff

### Requirement 3

**User Story:** Como cliente del gimnasio, quiero que cuando inicie sesión con credenciales de CLIENT, el sistema me redirija a la vista de cliente y me impida acceder a vistas administrativas, para tener una experiencia segura y apropiada a mi rol.

#### Acceptance Criteria

1. WHEN un usuario con rol CLIENT completa el login THEN el System SHALL redirigir al usuario a /dashboard/client
2. WHEN un usuario con rol CLIENT intenta acceder a /dashboard/admin THEN el System SHALL redirigir al usuario a /dashboard/client
3. WHEN un usuario con rol CLIENT intenta acceder a /dashboard/staff THEN el System SHALL redirigir al usuario a /dashboard/client
4. WHEN un usuario con rol CLIENT recarga la página en /dashboard/client THEN el System SHALL mantener al usuario en /dashboard/client

### Requirement 4

**User Story:** Como desarrollador del sistema, quiero que el layout del dashboard implemente protección de rutas basada en roles, para centralizar la lógica de control de acceso y evitar duplicación de código.

#### Acceptance Criteria

1. WHEN el dashboard layout se monta THEN el System SHALL verificar el rol del usuario autenticado
2. WHEN el rol del usuario no coincide con la ruta actual THEN el System SHALL redirigir al usuario a su dashboard correspondiente
3. WHEN no hay usuario autenticado THEN el System SHALL redirigir al usuario a la página de login
4. WHILE el System verifica la autenticación y el rol THEN el System SHALL mostrar un indicador de carga

### Requirement 5

**User Story:** Como usuario del sistema, quiero que el estado de autenticación se persista correctamente en el navegador, para no tener que iniciar sesión repetidamente ni experimentar problemas de redirección.

#### Acceptance Criteria

1. WHEN un usuario inicia sesión THEN el System SHALL almacenar el token y los datos del usuario en localStorage
2. WHEN la página se recarga THEN el System SHALL recuperar el estado de autenticación desde localStorage
3. WHEN el estado de autenticación se recupera THEN el System SHALL incluir el rol correcto del usuario
4. WHEN un usuario cierra sesión THEN el System SHALL limpiar completamente el estado de autenticación de localStorage
