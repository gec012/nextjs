/**
 * Route Protection Utilities
 * 
 * Centralizes route permission logic and role-based redirections
 */

// Define UserRole type to match Prisma schema
type UserRole = 'ADMIN' | 'STAFF' | 'CLIENT' | 'MONITOR';

interface RouteConfig {
  allowedRoles: UserRole[];
  redirectPath: string;
}

interface RoleRouteMap {
  [key: string]: RouteConfig;
}

/**
 * Mapping of routes to their allowed roles and default redirect paths
 */
const ROUTE_PERMISSIONS: RoleRouteMap = {
  '/dashboard/admin': {
    allowedRoles: ['ADMIN'],
    redirectPath: '/dashboard/client',
  },
  '/dashboard/staff': {
    allowedRoles: ['ADMIN', 'STAFF'],
    redirectPath: '/dashboard/client',
  },
  '/dashboard/client': {
    allowedRoles: ['ADMIN', 'STAFF', 'CLIENT'],
    redirectPath: '/dashboard/client',
  },
  '/access-point': {
    allowedRoles: ['ADMIN', 'STAFF', 'MONITOR'],
    redirectPath: '/dashboard/client',
  }
};

/**
 * Get the correct dashboard path for a given user role
 * 
 * @param role - The user's role (ADMIN, STAFF, CLIENT, MONITOR)
 * @returns The dashboard path for that role
 */
export function getDashboardPathForRole(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return '/dashboard/admin';
    case 'STAFF':
      return '/dashboard/staff';
    case 'CLIENT':
      return '/dashboard/client';
    case 'MONITOR':
      return '/access-point';
    default:
      // Fallback for unrecognized roles
      console.warn(`Unrecognized role: ${role}, defaulting to client dashboard`);
      return '/dashboard/client';
  }
}

/**
 * Check if a user with a given role can access a specific route
 * 
 * @param userRole - The user's role
 * @param pathname - The route pathname to check
 * @returns true if the user can access the route, false otherwise
 */
export function canAccessRoute(userRole: UserRole, pathname: string): boolean {
  // Extract base dashboard path
  // Handle root paths like /access-point properly
  let basePath = pathname;
  if (pathname.startsWith('/dashboard')) {
    basePath = pathname.split('/').slice(0, 3).join('/');
  }

  const routeConfig = ROUTE_PERMISSIONS[basePath];

  // If route is in our permissions map, check against allowed roles
  if (routeConfig) {
    return routeConfig.allowedRoles.includes(userRole);
  }

  // For sub-routes not in the map, check the parent path
  if (pathname.startsWith('/dashboard/admin')) {
    return userRole === 'ADMIN';
  }
  if (pathname.startsWith('/dashboard/staff')) {
    return userRole === 'ADMIN' || userRole === 'STAFF';
  }
  if (pathname.startsWith('/dashboard/client')) {
    if (userRole === 'MONITOR') return false; // Monitor cannot see client dashboard
    return true; // All validated users can access client routes (except monitor)
  }
  if (pathname.startsWith('/access-point')) {
    return ['ADMIN', 'STAFF', 'MONITOR'].includes(userRole);
  }

  // Default: allow access for unknown routes
  return true;
}

/**
 * Get the redirect path for a user if they cannot access the current route
 * 
 * @param userRole - The user's role
 * @param pathname - The current route pathname
 * @returns The redirect path if user cannot access, null if they can access
 */
export function getRedirectPath(userRole: UserRole, pathname: string): string | null {
  // Check if user can access the current route
  if (canAccessRoute(userRole, pathname)) {
    return null;
  }

  // User cannot access, redirect to their appropriate dashboard
  return getDashboardPathForRole(userRole);
}
