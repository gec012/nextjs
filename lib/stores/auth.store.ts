import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserRole } from '@prisma/client';

// Tipo de usuario simplificado para el store (sin datos sensibles)
interface StoreUser {
    id: number;
    name: string;
    email: string;
    rol: UserRole;
    profilePhoto?: string | null;
}

interface AuthState {
    user: StoreUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    login: (user: StoreUser) => void;
    logout: () => void;
    updateUser: (user: Partial<StoreUser>) => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: true,

            login: (user: StoreUser) => {
                set({
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                });
            },

            logout: () => {
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            },

            updateUser: (userData: Partial<StoreUser>) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null,
                }));
            },

            setLoading: (loading: boolean) => {
                set({ isLoading: loading });
            },
        }),
        {
            name: 'gym-auth-storage',
            storage: createJSONStorage(() => localStorage),
            // Solo guardar user e isAuthenticated (NO token - está en HttpOnly cookie)
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

// Selectores para mejor performance
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsAdmin = () => useAuthStore((state) => state.user?.rol === 'ADMIN');
export const useIsStaff = () => useAuthStore((state) =>
    state.user?.rol === 'ADMIN' || state.user?.rol === 'STAFF'
);
export const useIsClient = () => useAuthStore((state) => state.user?.rol === 'CLIENT');
