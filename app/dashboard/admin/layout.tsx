'use client';

import { useLayoutAuth } from '@/lib/hooks/useLayoutAuth';
import { Loader2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isChecking, user, isAuthenticated } = useLayoutAuth();

    // Show loading while checking routes
    if (isChecking || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
            <Sidebar />
            <main className="md:ml-64 p-4 md:p-8 min-h-screen">
                {children}
            </main>
        </div>
    );
}
