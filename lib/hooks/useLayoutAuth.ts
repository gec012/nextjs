'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, useUser } from '@/lib/stores/auth.store';
import { getRedirectPath } from '@/lib/route-protection';
import toast from 'react-hot-toast';

/**
 * Hook compartido para manejar la autenticación y protección de rutas en los layouts.
 * Implementa el principio DRY (Don't Repeat Yourself) para evitar duplicación de código.
 * 
 * @returns {Object} Estado de autenticación
 * @returns {boolean} isChecking - True mientras se verifica la autenticación
 * @returns {User | null} user - Usuario autenticado o null
 */
export function useLayoutAuth() {
    const router = useRouter();
    const pathname = usePathname();
    const user = useUser();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const logout = useAuthStore((state) => state.logout);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // 1. If we think we are not authenticated, double check with the server
                // This handles cases like new tabs where localStorage might not be hydrated yet
                // or simply cleared but cookie remains.
                if (!isAuthenticated) {
                    try {
                        const response = await fetch('/api/me');
                        if (response.ok) {
                            const userData = await response.json();
                            // Adapt API response to StoreUser format
                            useAuthStore.getState().login({
                                id: userData.id,
                                name: userData.nombre,
                                email: userData.email,
                                rol: userData.rol,
                            });
                            // Verify path access will happen in next render cycle or immediately below
                            // But usually, updating store triggers re-render of this hook.
                            return;
                        } else {
                            // Valid session not found
                            throw new Error('No session');
                        }
                    } catch (e) {
                        router.push('/');
                        return;
                    }
                }

                // 2. Check for corrupted state
                if (!user || !user.rol) {
                    // Try one last recovery attempt if we just logged in? 
                    // No, if isAuthenticated is true but user is null, it's weird.
                    console.error('Corrupted auth state detected');
                    logout();
                    router.push('/');
                    return;
                }

                // 3. Check Route Permissions
                const redirectPath = getRedirectPath(user.rol, pathname);

                if (redirectPath) {
                    console.log(`Redirecting ${user.rol} from ${pathname} to ${redirectPath}`);
                    router.push(redirectPath);
                } else {
                    setIsChecking(false);
                }

            } catch (error) {
                console.error('Route protection error:', error);
                logout();
                router.push('/');
            }
        };

        checkAuth();
    }, [isAuthenticated, user, pathname, router, logout]);

    return {
        isChecking,
        user,
        isAuthenticated,
    };
}
