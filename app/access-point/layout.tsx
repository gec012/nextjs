'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useUser } from '@/lib/stores/auth.store';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AccessPointLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useUser();
    const logout = useAuthStore((state) => state.logout);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            // 1. Si no hay sesión local, verificar con API (caso: nueva pestaña)
            if (!isAuthenticated) {
                try {
                    const response = await fetch('/api/me');
                    if (response.ok) {
                        const userData = await response.json();
                        useAuthStore.getState().login({
                            id: userData.id,
                            name: userData.nombre,
                            email: userData.email,
                            rol: userData.rol,
                        });
                        // Continuar verificación con datos actualizados
                    } else {
                        // Si no hay sesión válida, redirigir al login
                        // Pero como es un Access Point, tal vez queramos mostrar un login específico o el general
                        // Redirigir al login general con callback URL
                        router.push('/login?callbackUrl=/access-point');
                        return;
                    }
                } catch (error) {
                    router.push('/login?callbackUrl=/access-point');
                    return;
                }
            }

            // Es posible que el state se actualice asíncronamente, así que esperamos al siguiente render
            // O verificamos directamente contra el store actualizado si acabamos de hacer login
            const currentUser = useAuthStore.getState().user;

            if (currentUser) {
                // Verificar roles permitidos: ADMIN, STAFF, MONITOR
                const allowedRoles = ['ADMIN', 'STAFF', 'MONITOR'];
                if (!allowedRoles.includes(currentUser.rol)) {
                    toast.error('No tienes permisos para acceder a esta terminal');
                    router.push('/dashboard/client'); // O home
                    return;
                }
            }

            setIsLoading(false);
        };

        checkAuth();
    }, [isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="ml-4 text-white font-medium">Iniciando Terminal...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white selection:bg-blue-500/30">
            {children}
        </div>
    );
}
