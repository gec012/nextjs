'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore, useUser } from '@/lib/stores/auth.store';
import {
    Dumbbell,
    LogOut,
    User,
    Calendar,
    CreditCard,
    QrCode,
    History,
    Settings,
    Users,
    BarChart3,
    ScanLine
} from 'lucide-react';
import toast from 'react-hot-toast';

interface NavbarProps {
    activeTab?: string;
}

export default function Navbar({ activeTab = 'home' }: NavbarProps) {
    const router = useRouter();
    const user = useUser();
    const logout = useAuthStore((state) => state.logout);

    const handleLogout = async () => {
        try {
            const token = useAuthStore.getState().token;

            await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            logout();
            toast.success('Sesión cerrada');
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
            logout();
            router.push('/');
        }
    };

    const getInitials = (name?: string) => {
        if (!name) return '??';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Navigation items por rol
    const getNavItems = () => {
        switch (user?.rol) {
            case 'ADMIN':
                return [
                    { icon: BarChart3, label: 'Dashboard', href: '/dashboard/admin' },
                    { icon: Users, label: 'Usuarios', href: '/dashboard/admin/users' },
                    { icon: Calendar, label: 'Clases', href: '/dashboard/admin/classes' },
                    { icon: CreditCard, label: 'Planes', href: '/dashboard/admin/plans' },
                    { icon: Settings, label: 'Configuración', href: '/dashboard/admin/settings' },
                ];
            case 'RECEPCIONISTA':
                return [
                    { icon: ScanLine, label: 'Escáner', href: '/dashboard/staff' },
                    { icon: Calendar, label: 'Clases', href: '/dashboard/staff/classes' },
                    { icon: CreditCard, label: 'Pagos', href: '/dashboard/staff/payments' },
                ];
            case 'CLIENTE':
            default:
                return [
                    { icon: User, label: 'Inicio', href: '/dashboard/client' },
                    { icon: Calendar, label: 'Clases', href: '/dashboard/client/classes' },
                    { icon: QrCode, label: 'Mi QR', href: '/dashboard/client/qr' },
                    { icon: History, label: 'Historial', href: '/dashboard/client/history' },
                ];
        }
    };

    const navItems = getNavItems();

    return (
        <nav className="glass border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                            <Dumbbell className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">Mi Gimnasio</h1>
                            <p className="text-xs text-gray-400">{user?.rol || 'CLIENTE'}</p>
                        </div>
                    </div>

                    {/* Navigation Links - Desktop */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.label.toLowerCase();

                            return (
                                <button
                                    key={item.label}
                                    onClick={() => router.push(item.href)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isActive
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center gap-3">
                        {/* User Info */}
                        <div className="hidden sm:flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-medium text-white">{user?.name || 'Usuario'}</p>
                                <p className="text-xs text-gray-400">{user?.email || ''}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                {getInitials(user?.name)}
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="hidden sm:inline font-medium">Salir</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden flex gap-1 pb-3 overflow-x-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.label.toLowerCase();

                        return (
                            <button
                                key={item.label}
                                onClick={() => router.push(item.href)}
                                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isActive
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
