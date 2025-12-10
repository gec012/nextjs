'use client';

import Sidebar from '@/components/Sidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
            <Sidebar />
            <main className="flex-1 p-4 md:p-8 overflow-auto">
                {children}
            </main>
        </div>
    );
}
