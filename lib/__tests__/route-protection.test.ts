/**
 * Unit Tests for Route Protection Utilities
 * 
 * Tests specific examples and edge cases for route protection functions
 */

import { getDashboardPathForRole, canAccessRoute, getRedirectPath } from '../route-protection';

type UserRole = 'ADMIN' | 'STAFF' | 'CLIENT';

describe('Route Protection Utilities - Unit Tests', () => {
  describe('getDashboardPathForRole', () => {
    test('should return /dashboard/admin for ADMIN role', () => {
      expect(getDashboardPathForRole('ADMIN')).toBe('/dashboard/admin');
    });

    test('should return /dashboard/staff for STAFF role', () => {
      expect(getDashboardPathForRole('STAFF')).toBe('/dashboard/staff');
    });

    test('should return /dashboard/client for CLIENT role', () => {
      expect(getDashboardPathForRole('CLIENT')).toBe('/dashboard/client');
    });

    test('should return /dashboard/client for unrecognized role', () => {
      // @ts-expect-error Testing invalid role
      const result = getDashboardPathForRole('INVALID_ROLE');
      expect(result).toBe('/dashboard/client');
    });

    test('should log warning for unrecognized role', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      // @ts-expect-error Testing invalid role
      getDashboardPathForRole('UNKNOWN');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unrecognized role')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('canAccessRoute', () => {
    describe('ADMIN role', () => {
      test('should allow access to /dashboard/admin', () => {
        expect(canAccessRoute('ADMIN', '/dashboard/admin')).toBe(true);
      });

      test('should allow access to /dashboard/staff', () => {
        expect(canAccessRoute('ADMIN', '/dashboard/staff')).toBe(true);
      });

      test('should allow access to /dashboard/client', () => {
        expect(canAccessRoute('ADMIN', '/dashboard/client')).toBe(true);
      });

      test('should allow access to admin sub-routes', () => {
        expect(canAccessRoute('ADMIN', '/dashboard/admin/users')).toBe(true);
        expect(canAccessRoute('ADMIN', '/dashboard/admin/settings')).toBe(true);
      });

      test('should allow access to staff sub-routes', () => {
        expect(canAccessRoute('ADMIN', '/dashboard/staff/scan')).toBe(true);
      });
    });

    describe('STAFF role', () => {
      test('should not allow access to /dashboard/admin', () => {
        expect(canAccessRoute('STAFF', '/dashboard/admin')).toBe(false);
      });

      test('should allow access to /dashboard/staff', () => {
        expect(canAccessRoute('STAFF', '/dashboard/staff')).toBe(true);
      });

      test('should allow access to /dashboard/client', () => {
        expect(canAccessRoute('STAFF', '/dashboard/client')).toBe(true);
      });

      test('should not allow access to admin sub-routes', () => {
        expect(canAccessRoute('STAFF', '/dashboard/admin/users')).toBe(false);
      });

      test('should allow access to staff sub-routes', () => {
        expect(canAccessRoute('STAFF', '/dashboard/staff/scan')).toBe(true);
        expect(canAccessRoute('STAFF', '/dashboard/staff/payments')).toBe(true);
      });
    });

    describe('CLIENT role', () => {
      test('should not allow access to /dashboard/admin', () => {
        expect(canAccessRoute('CLIENT', '/dashboard/admin')).toBe(false);
      });

      test('should not allow access to /dashboard/staff', () => {
        expect(canAccessRoute('CLIENT', '/dashboard/staff')).toBe(false);
      });

      test('should allow access to /dashboard/client', () => {
        expect(canAccessRoute('CLIENT', '/dashboard/client')).toBe(true);
      });

      test('should not allow access to admin sub-routes', () => {
        expect(canAccessRoute('CLIENT', '/dashboard/admin/users')).toBe(false);
      });

      test('should not allow access to staff sub-routes', () => {
        expect(canAccessRoute('CLIENT', '/dashboard/staff/scan')).toBe(false);
      });

      test('should allow access to client sub-routes', () => {
        expect(canAccessRoute('CLIENT', '/dashboard/client/classes')).toBe(true);
        expect(canAccessRoute('CLIENT', '/dashboard/client/qr')).toBe(true);
      });
    });
  });

  describe('getRedirectPath', () => {
    describe('ADMIN role', () => {
      test('should return null when accessing /dashboard/admin', () => {
        expect(getRedirectPath('ADMIN', '/dashboard/admin')).toBeNull();
      });

      test('should return null when accessing /dashboard/staff', () => {
        expect(getRedirectPath('ADMIN', '/dashboard/staff')).toBeNull();
      });

      test('should return null when accessing /dashboard/client', () => {
        expect(getRedirectPath('ADMIN', '/dashboard/client')).toBeNull();
      });

      test('should return null for admin sub-routes', () => {
        expect(getRedirectPath('ADMIN', '/dashboard/admin/users')).toBeNull();
      });
    });

    describe('STAFF role', () => {
      test('should redirect to /dashboard/staff when accessing /dashboard/admin', () => {
        expect(getRedirectPath('STAFF', '/dashboard/admin')).toBe('/dashboard/staff');
      });

      test('should return null when accessing /dashboard/staff', () => {
        expect(getRedirectPath('STAFF', '/dashboard/staff')).toBeNull();
      });

      test('should return null when accessing /dashboard/client', () => {
        expect(getRedirectPath('STAFF', '/dashboard/client')).toBeNull();
      });

      test('should redirect when accessing admin sub-routes', () => {
        expect(getRedirectPath('STAFF', '/dashboard/admin/users')).toBe('/dashboard/staff');
      });

      test('should return null for staff sub-routes', () => {
        expect(getRedirectPath('STAFF', '/dashboard/staff/scan')).toBeNull();
      });
    });

    describe('CLIENT role', () => {
      test('should redirect to /dashboard/client when accessing /dashboard/admin', () => {
        expect(getRedirectPath('CLIENT', '/dashboard/admin')).toBe('/dashboard/client');
      });

      test('should redirect to /dashboard/client when accessing /dashboard/staff', () => {
        expect(getRedirectPath('CLIENT', '/dashboard/staff')).toBe('/dashboard/client');
      });

      test('should return null when accessing /dashboard/client', () => {
        expect(getRedirectPath('CLIENT', '/dashboard/client')).toBeNull();
      });

      test('should redirect when accessing admin sub-routes', () => {
        expect(getRedirectPath('CLIENT', '/dashboard/admin/users')).toBe('/dashboard/client');
      });

      test('should redirect when accessing staff sub-routes', () => {
        expect(getRedirectPath('CLIENT', '/dashboard/staff/scan')).toBe('/dashboard/client');
      });

      test('should return null for client sub-routes', () => {
        expect(getRedirectPath('CLIENT', '/dashboard/client/classes')).toBeNull();
      });
    });

    describe('Edge cases', () => {
      test('should handle paths with trailing slashes', () => {
        expect(canAccessRoute('CLIENT', '/dashboard/admin/')).toBe(false);
        expect(getRedirectPath('CLIENT', '/dashboard/admin/')).toBe('/dashboard/client');
      });

      test('should handle deep nested paths', () => {
        expect(canAccessRoute('ADMIN', '/dashboard/admin/users/edit/123')).toBe(true);
        expect(canAccessRoute('CLIENT', '/dashboard/admin/users/edit/123')).toBe(false);
      });

      test('should return correct redirect for unrecognized role', () => {
        // @ts-expect-error Testing invalid role
        const result = getRedirectPath('INVALID', '/dashboard/admin');
        expect(result).toBe('/dashboard/client');
      });
    });
  });

  describe('Integration between functions', () => {
    test('getDashboardPathForRole result should be accessible by that role', () => {
      const roles: UserRole[] = ['ADMIN', 'STAFF', 'CLIENT'];
      
      roles.forEach(role => {
        const dashboardPath = getDashboardPathForRole(role);
        expect(canAccessRoute(role, dashboardPath)).toBe(true);
        expect(getRedirectPath(role, dashboardPath)).toBeNull();
      });
    });

    test('redirect path should always be a valid dashboard path', () => {
      const testCases: Array<{ role: UserRole; path: string }> = [
        { role: 'STAFF', path: '/dashboard/admin' },
        { role: 'CLIENT', path: '/dashboard/admin' },
        { role: 'CLIENT', path: '/dashboard/staff' },
      ];

      testCases.forEach(({ role, path }) => {
        const redirectPath = getRedirectPath(role, path);
        expect(redirectPath).toMatch(/^\/dashboard\/(admin|staff|client)$/);
      });
    });

    test('if canAccessRoute returns true, getRedirectPath should return null', () => {
      const testCases: Array<{ role: UserRole; path: string }> = [
        { role: 'ADMIN', path: '/dashboard/admin' },
        { role: 'ADMIN', path: '/dashboard/staff' },
        { role: 'ADMIN', path: '/dashboard/client' },
        { role: 'STAFF', path: '/dashboard/staff' },
        { role: 'STAFF', path: '/dashboard/client' },
        { role: 'CLIENT', path: '/dashboard/client' },
      ];

      testCases.forEach(({ role, path }) => {
        if (canAccessRoute(role, path)) {
          expect(getRedirectPath(role, path)).toBeNull();
        }
      });
    });

    test('if canAccessRoute returns false, getRedirectPath should return a path', () => {
      const testCases: Array<{ role: UserRole; path: string }> = [
        { role: 'STAFF', path: '/dashboard/admin' },
        { role: 'CLIENT', path: '/dashboard/admin' },
        { role: 'CLIENT', path: '/dashboard/staff' },
      ];

      testCases.forEach(({ role, path }) => {
        if (!canAccessRoute(role, path)) {
          expect(getRedirectPath(role, path)).not.toBeNull();
        }
      });
    });
  });
});
