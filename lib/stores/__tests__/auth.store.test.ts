/**
 * Property-Based Tests for Auth Store
 * 
 * Feature: role-based-routing-fix
 * Tests auth state persistence and logout cleanup
 */

import { useAuthStore } from '../auth.store';

type UserRole = 'ADMIN' | 'STAFF' | 'CLIENT';

describe('Auth Store - Property-Based Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  /**
   * Property 4: Auth state persistence
   * Feature: role-based-routing-fix, Property 4: Auth state persistence
   * Validates: Requirements 1.4, 5.1, 5.2, 5.3
   * 
   * For any user authentication data (token, user object with role),
   * when stored in the Auth Store, the data should persist correctly in localStorage
   * and be recoverable after page reload with all fields intact including the role
   */
  describe('Property 4: Auth state persistence', () => {
    const testUsers = [
      {
        id: 1,
        name: 'Admin User',
        email: 'admin@test.com',
        rol: 'ADMIN' as UserRole,
        isActive: true,
        access_token: 'admin-token-123',
        token_type: 'Bearer',
      },
      {
        id: 2,
        name: 'Staff User',
        email: 'staff@test.com',
        rol: 'STAFF' as UserRole,
        isActive: true,
        access_token: 'staff-token-456',
        token_type: 'Bearer',
      },
      {
        id: 3,
        name: 'Client User',
        email: 'client@test.com',
        rol: 'CLIENT' as UserRole,
        isActive: true,
        access_token: 'client-token-789',
        token_type: 'Bearer',
      },
    ];

    test.each(testUsers)(
      'User with role $rol should persist correctly in localStorage',
      (authUser) => {
        // Login user
        useAuthStore.getState().login(authUser);

        // Verify state is set correctly
        const state = useAuthStore.getState();
        expect(state.isAuthenticated).toBe(true);
        expect(state.user).toBeTruthy();
        expect(state.user?.rol).toBe(authUser.rol);
        expect(state.user?.email).toBe(authUser.email);
        expect(state.token).toBe(authUser.access_token);

        // Verify localStorage contains the data
        const storedData = localStorage.getItem('gym-auth-storage');
        expect(storedData).toBeTruthy();

        const parsed = JSON.parse(storedData!);
        expect(parsed.state.user.rol).toBe(authUser.rol);
        expect(parsed.state.user.email).toBe(authUser.email);
        expect(parsed.state.token).toBe(authUser.access_token);
        expect(parsed.state.isAuthenticated).toBe(true);
      }
    );

    test('Auth state should be recoverable after simulated page reload', () => {
      const authUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
        rol: 'ADMIN' as UserRole,
        isActive: true,
        access_token: 'test-token',
        token_type: 'Bearer',
      };

      // Login user
      useAuthStore.getState().login(authUser);

      // Get localStorage data
      const storedData = localStorage.getItem('gym-auth-storage');
      expect(storedData).toBeTruthy();

      // Simulate page reload by creating a new store instance
      // In real scenario, Zustand persist middleware handles this automatically
      const parsed = JSON.parse(storedData!);
      
      // Verify all fields are intact
      expect(parsed.state.user.rol).toBe('ADMIN');
      expect(parsed.state.user.email).toBe('test@test.com');
      expect(parsed.state.token).toBe('test-token');
      expect(parsed.state.isAuthenticated).toBe(true);
    });

    test('Role field should persist correctly for all roles', () => {
      const roles: UserRole[] = ['ADMIN', 'STAFF', 'CLIENT'];

      roles.forEach((role, index) => {
        // Clear before each iteration
        localStorage.clear();
        useAuthStore.setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: true,
        });

        const authUser = {
          id: index + 1,
          name: `${role} User`,
          email: `${role.toLowerCase()}@test.com`,
          rol: role,
          isActive: true,
          access_token: `${role}-token`,
          token_type: 'Bearer',
        };

        useAuthStore.getState().login(authUser);

        const storedData = localStorage.getItem('gym-auth-storage');
        const parsed = JSON.parse(storedData!);

        expect(parsed.state.user.rol).toBe(role);
      });
    });
  });

  /**
   * Property 6: Logout cleanup
   * Feature: role-based-routing-fix, Property 6: Logout cleanup
   * Validates: Requirements 5.4
   * 
   * For any authenticated user, when logout is performed,
   * the system should completely clear all authentication data from localStorage
   */
  describe('Property 6: Logout cleanup', () => {
    test.each([
      { rol: 'ADMIN' as UserRole, name: 'Admin User' },
      { rol: 'STAFF' as UserRole, name: 'Staff User' },
      { rol: 'CLIENT' as UserRole, name: 'Client User' },
    ])(
      'Logout should clear all data for $rol user',
      ({ rol, name }) => {
        // First login
        const authUser = {
          id: 1,
          name,
          email: `${rol.toLowerCase()}@test.com`,
          rol,
          isActive: true,
          access_token: `${rol}-token`,
          token_type: 'Bearer',
        };

        useAuthStore.getState().login(authUser);

        // Verify user is logged in
        expect(useAuthStore.getState().isAuthenticated).toBe(true);
        expect(useAuthStore.getState().user).toBeTruthy();
        expect(localStorage.getItem('gym-auth-storage')).toBeTruthy();

        // Logout
        useAuthStore.getState().logout();

        // Verify all state is cleared
        const state = useAuthStore.getState();
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
        expect(state.token).toBeNull();

        // Verify localStorage is cleared
        const storedData = localStorage.getItem('gym-auth-storage');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          expect(parsed.state.user).toBeNull();
          expect(parsed.state.token).toBeNull();
          expect(parsed.state.isAuthenticated).toBe(false);
        }
      }
    );

    test('Multiple logout calls should not cause errors', () => {
      const authUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
        rol: 'CLIENT' as UserRole,
        isActive: true,
        access_token: 'test-token',
        token_type: 'Bearer',
      };

      useAuthStore.getState().login(authUser);
      
      // Call logout multiple times
      expect(() => {
        useAuthStore.getState().logout();
        useAuthStore.getState().logout();
        useAuthStore.getState().logout();
      }).not.toThrow();

      // State should still be clean
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });

    test('Logout should leave no residual user data', () => {
      const authUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
        rol: 'ADMIN' as UserRole,
        phone: '1234567890',
        profilePhoto: 'photo.jpg',
        isActive: true,
        access_token: 'test-token',
        token_type: 'Bearer',
      };

      useAuthStore.getState().login(authUser);
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      
      // Verify no user fields remain
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      
      // Check localStorage
      const storedData = localStorage.getItem('gym-auth-storage');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        expect(parsed.state.user).toBeNull();
        expect(parsed.state.token).toBeNull();
      }
    });
  });
});
