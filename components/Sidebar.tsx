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
    ScanLine,
    Activity,
    Receipt,
    TrendingUp,
    Menu,
    X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface SidebarProps {
    activeTab?: string;
}

export default function Sidebar({ activeTab }: SidebarProps) {
    const router = useRouter();
    const user = useUser();
    const logout = useAuthStore((state) => state.logout);
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                logout();
                router.push('/login');
                toast.success('Sesión cerrada');
            }
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Error al cerrar sesión');
        }
    };

    const getInitials = (name: string | undefined) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getNavItems = () => {
        switch (user?.rol) {
            case 'ADMIN':
                return [
                    { icon: BarChart3, label: 'Dashboard', href: '/dashboard/admin' },
                    { icon: Users, label: 'Usuarios', href: '/dashboard/admin/users' },
                    { icon: Activity, label: 'Disciplinas', href: '/dashboard/admin/disciplines' },
                    { icon: Calendar, label: 'Clases', href: '/dashboard/admin/classes' },
                    { icon: CreditCard, label: 'Planes', href: '/dashboard/admin/plans' },
                    { icon: Receipt, label: 'Membresías', href: '/dashboard/admin/memberships' },
                    { icon: TrendingUp, label: 'Reportes', href: '/dashboard/admin/reports' },
                    { icon: ScanLine, label: 'Check-in', href: '/access-point' },
                    { icon: Settings, label: 'Configuración', href: '/dashboard/admin/settings' },
                ];
            case 'STAFF':
                return [
                    { icon: ScanLine, label: 'Escáner', href: '/access-point' },
                    { icon: Calendar, label: 'Clases', href: '/dashboard/staff/classes' },
                    { icon: CreditCard, label: 'Pagos', href: '/dashboard/staff/payments' },
                    { icon: Users, label: 'Usuarios', href: '/dashboard/staff/users' },
                ];
            default:
                return [
                    { icon: User, label: 'Inicio', href: '/dashboard/client' },
                    { icon: Calendar, label: 'Clases', href: '/dashboard/client/classes' },
                    { icon: CreditCard, label: 'Pagos', href: '/dashboard/client/payments' },
                    { icon: QrCode, label: 'Escanear', href: '/dashboard/client/qr' },
                    { icon: History, label: 'Historial', href: '/dashboard/client/history' },
                ];
        }
    };

    const navItems = getNavItems();

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg glass text-white hover:bg-white/10 transition-all"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Overlay para móvil */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-screen w-64 bg-gray-900 border-r border-white/10 flex flex-col z-40 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
            >
                {/* Logo / Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                            <Dumbbell className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Mi Gimnasio</h1>
                            <p className="text-xs text-gray-400">{user?.rol || 'CLIENT'}</p>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                            {getInitials(user?.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name || 'Usuario'}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto py-4 px-3">
                    <div className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.label.toLowerCase();

                            return (
                                <button
                                    key={item.label}
                                    onClick={() => {
                                        if (item.href === '/access-point') {
                                            window.open(item.href, '_blank');
                                        } else {
                                            router.push(item.href);
                                        }
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Cerrar sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
