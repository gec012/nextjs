'use client';

import Sidebar from '@/components/Sidebar';

interface AdminLayoutProps {
    children: React.ReactNode;
    activeTab?: string;
}

export default function AdminLayout({ children, activeTab }: AdminLayoutProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
            <Sidebar activeTab={activeTab} />
            <main className="md:ml-64 p-4 md:p-8 min-h-screen">
                {children}
            </main>
        </div>
    );
}
