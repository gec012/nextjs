# Implementation Plan

- [x] 1. Create route protection utility module


  - Create `lib/route-protection.ts` with route permission mappings
  - Implement `getDashboardPathForRole(role: UserRole): string` function
  - Implement `canAccessRoute(userRole: UserRole, pathname: string): boolean` function
  - Implement `getRedirectPath(userRole: UserRole, pathname: string): string | null` function
  - Export all utility functions with proper TypeScript types
  - _Requirements: 4.1, 4.2_



- [ ] 1.1 Write property test for role-based login redirection
  - **Property 1: Role-based login redirection**

  - **Validates: Requirements 1.1, 2.1, 3.1**



- [ ] 1.2 Write property test for role-route mismatch redirection
  - **Property 2: Role-route mismatch redirection**
  - **Validates: Requirements 1.2, 2.2, 3.2, 3.3, 4.2**

- [ ] 2. Enhance dashboard layout with role-based protection
  - Import `usePathname` from `next/navigation` in `app/dashboard/layout.tsx`
  - Import route protection utilities from `lib/route-protection`
  - Add state for tracking route checking: `const [isChecking, setIsChecking] = useState(true)`
  - Implement useEffect to verify authentication and role on mount and pathname changes


  - Add logic to redirect unauthenticated users to login page
  - Add logic to redirect users to correct dashboard based on role using `getRedirectPath`

  - Update loading condition to show loading screen while checking routes
  - _Requirements: 4.1, 4.2, 4.3, 4.4_



- [ ] 2.1 Write property test for route persistence on reload
  - **Property 3: Route persistence on reload**
  - **Validates: Requirements 1.3, 2.3, 3.4**

- [x] 2.2 Write property test for unauthenticated user redirection


  - **Property 5: Unauthenticated user redirection**
  - **Validates: Requirements 4.3**

- [ ] 3. Simplify individual dashboard pages
  - Remove redundant role verification logic from `app/dashboard/admin/page.tsx`


  - Remove redundant role verification logic from `app/dashboard/staff/page.tsx`
  - Remove redundant role verification logic from `app/dashboard/client/page.tsx`

  - Keep only simple null checks for TypeScript type safety
  - Remove individual useEffect hooks that handle redirections


  - _Requirements: 1.1, 2.1, 3.1_

- [ ] 4. Update login page to use centralized routing
  - Import `getDashboardPathForRole` from `lib/route-protection` in `app/page.tsx`
  - Replace switch statement in login handler with call to `getDashboardPathForRole(data.user.rol)`
  - Add small delay (50ms) before redirect to ensure state persistence completes


  - _Requirements: 1.1, 2.1, 3.1_

- [ ] 4.1 Write property test for auth state persistence
  - **Property 4: Auth state persistence**
  - **Validates: Requirements 1.4, 5.1, 5.2, 5.3**

- [ ] 4.2 Write property test for logout cleanup
  - **Property 6: Logout cleanup**
  - **Validates: Requirements 5.4**

- [x] 5. Add error handling for edge cases

  - Add try-catch block in dashboard layout's useEffect
  - Handle corrupted auth state by clearing localStorage and redirecting to login
  - Add console.error logging for debugging route protection issues
  - Handle unrecognized roles with default redirect to client dashboard
  - _Requirements: 4.2, 4.3_

- [ ] 5.1 Write unit tests for route protection utilities
  - Test `getDashboardPathForRole` returns correct path for each role
  - Test `canAccessRoute` returns true for authorized access
  - Test `canAccessRoute` returns false for unauthorized access
  - Test `getRedirectPath` returns null when user can access route
  - Test `getRedirectPath` returns correct redirect path when user cannot access
  - Test handling of unrecognized roles
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 4.2_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6.1 Write integration tests for complete routing flow
  - Test login as ADMIN redirects to `/dashboard/admin`
  - Test login as STAFF redirects to `/dashboard/staff`
  - Test login as CLIENT redirects to `/dashboard/client`
  - Test unauthorized route access triggers redirect
  - Test page reload maintains correct route
  - Test logout clears state and redirects to login
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 5.4_

- [ ] 7. Final checkpoint - Verify all functionality
  - Ensure all tests pass, ask the user if questions arise.
