'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth.store';
import Navbar from '@/components/Navbar';
import {
    QrCode,
    Users,
    Calendar,
    CreditCard,
    UserPlus,
    ClipboardList,
} from 'lucide-react';

export default function StaffDashboardPage() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);

    // Simple null check for TypeScript - layout handles all auth and role checks
    if (!user) {
        return null;
    }

    const quickActions = [
        {
            title: 'Escanear QR',
            description: 'Registrar asistencia con QR',
            icon: QrCode,
            href: '/dashboard/staff/scan',
            color: 'blue',
            highlight: true,
        },
        {
            title: 'Buscar Cliente',
            description: 'Buscar por DNI para marcar asistencia',
            icon: Users,
            href: '/dashboard/staff/search',
            color: 'purple',
        },
        {
            title: 'Registrar Cliente',
            description: 'Dar de alta un nuevo cliente',
            icon: UserPlus,
            href: '/dashboard/staff/register',
            color: 'green',
        },
        {
            title: 'Ver Clases de Hoy',
            description: 'Consultar clases programadas',
            icon: Calendar,
            href: '/dashboard/staff/classes',
            color: 'orange',
        },
        {
            title: 'Registrar Pago',
            description: 'Cobrar membresía o clase',
            icon: CreditCard,
            href: '/dashboard/staff/payments',
            color: 'pink',
        },
        {
            title: 'Asistencias de Hoy',
            description: 'Ver listado de asistencias',
            icon: ClipboardList,
            href: '/dashboard/staff/attendances',
            color: 'cyan',
        },
    ];

    const recentActivity = [
        { user: 'Juan Pérez', action: 'Check-in', time: 'Hace 2 min', status: 'success' },
        { user: 'María González', action: 'Pago registrado', time: 'Hace 8 min', status: 'success' },
        { user: 'Carlos Martínez', action: 'Check-in', time: 'Hace 15 min', status: 'success' },
        { user: 'Ana López', action: 'Cliente registrado', time: 'Hace 32 min', status: 'success' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
            <Navbar activeTab="inicio" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 animate-slide-in-up">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Panel de Recepción 🎯
                    </h1>
                    <p className="text-gray-400">
                        Bienvenido, {user.name || 'Recepcionista'}
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="glass rounded-xl p-6 animate-slide-in-up">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-gray-400 text-sm">Asistencias Hoy</p>
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <p className="text-white text-3xl font-bold">47</p>
                        <p className="text-green-400 text-xs mt-1">+12 vs ayer</p>
                    </div>

                    <div className="glass rounded-xl p-6 animate-slide-in-up" style={{ animationDelay: '50ms' }}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-gray-400 text-sm">Clases Restantes</p>
                            <Calendar className="w-5 h-5 text-purple-400" />
                        </div>
                        <p className="text-white text-3xl font-bold">8</p>
                        <p className="text-gray-400 text-xs mt-1">de 12 totales</p>
                    </div>

                    <div className="glass rounded-xl p-6 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-gray-400 text-sm">Ingresos Hoy</p>
                            <CreditCard className="w-5 h-5 text-green-400" />
                        </div>
                        <p className="text-white text-3xl font-bold">$2,450</p>
                        <p className="text-green-400 text-xs mt-1">15 pagos</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-white mb-4">Acciones Rápidas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {quickActions.map((action, index) => (
                            <button
                                key={action.title}
                                onClick={() => router.push(action.href)}
                                className={`glass rounded-xl p-6 text-left animate-slide-in-up hover:scale-105 transition-all ${action.highlight ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                                    }`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className={`w-14 h-14 rounded-lg bg-${action.color}-500/20 flex items-center justify-center mb-4`}>
                                    <action.icon className={`w-7 h-7 text-${action.color}-400`} />
                                </div>
                                <h3 className="text-white font-semibold mb-2 text-lg">{action.title}</h3>
                                <p className="text-gray-400 text-sm">{action.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="glass rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Actividad Reciente</h2>
                    <div className="space-y-3">
                        {recentActivity.map((activity, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                        <span className="text-white font-semibold text-sm">
                                            {activity.user.split(' ').map(n => n[0]).join('')}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">{activity.user}</p>
                                        <p className="text-gray-400 text-xs">{activity.action}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                        ✓
                                    </span>
                                    <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
