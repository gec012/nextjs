'use client';

import Sidebar from '@/components/Sidebar';

interface AdminLayoutProps {
    children: React.ReactNode;
    activeTab?: string;
}

export default function AdminLayout({ children, activeTab }: AdminLayoutProps) {
    return (
        <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
            <Sidebar activeTab={activeTab} />
            <main className="flex-1 p-4 md:p-8 overflow-auto">
                {children}
            </main>
        </div>
    );
}
