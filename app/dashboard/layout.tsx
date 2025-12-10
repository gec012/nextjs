'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, useUser } from '@/lib/stores/auth.store';
import { getRedirectPath } from '@/lib/route-protection';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const user = useUser();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const logout = useAuthStore((state) => state.logout);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        try {
            // Redirect if not authenticated
            if (!isAuthenticated) {
                router.push('/');
                return;
            }

            // Check if user data is corrupted
            if (!user || !user.rol) {
                console.error('Corrupted auth state detected');
                logout();
                toast.error('Sesión inválida, por favor inicia sesión nuevamente');
                router.push('/');
                return;
            }

            // Check if user can access current route
            const redirectPath = getRedirectPath(user.rol, pathname);
            
            if (redirectPath) {
                // User cannot access this route, redirect to their dashboard
                console.log(`Redirecting ${user.rol} from ${pathname} to ${redirectPath}`);
                router.push(redirectPath);
            } else {
                // User can access this route, stop checking
                setIsChecking(false);
            }
        } catch (error) {
            console.error('Route protection error:', error);
            logout();
            router.push('/');
        }
    }, [isAuthenticated, user, pathname, router, logout]);

    // Show loading while checking routes
    if (isChecking || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
