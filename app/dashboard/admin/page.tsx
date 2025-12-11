'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth.store';

import {
    Users,
    Calendar,
    DollarSign,
    TrendingUp,
    Dumbbell,
    CreditCard,
} from 'lucide-react';

export default function AdminDashboardPage() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);

    // Simple null check for TypeScript - layout handles all auth and role checks
    if (!user) {
        return null;
    }

    const stats = [
        {
            label: 'Usuarios Activos',
            value: '156',
            icon: Users,
            color: 'from-blue-500 to-blue-600',
            change: '+12%',
        },
        {
            label: 'Clases Hoy',
            value: '24',
            icon: Calendar,
            color: 'from-purple-500 to-purple-600',
            change: '+3',
        },
        {
            label: 'Ingresos del Mes',
            value: '$45,230',
            icon: DollarSign,
            color: 'from-green-500 to-green-600',
            change: '+18%',
        },
        {
            label: 'Asistencias Hoy',
            value: '89',
            icon: TrendingUp,
            color: 'from-orange-500 to-orange-600',
            change: '+7%',
        },
    ];

    const quickActions = [
        {
            title: 'Gestionar Usuarios',
            description: 'Administrar clientes y personal',
            icon: Users,
            href: '/dashboard/admin/users',
            color: 'blue',
        },
        {
            title: 'Gestionar Clases',
            description: 'Crear y editar clases',
            icon: Dumbbell,
            href: '/dashboard/admin/classes',
            color: 'purple',
        },
        {
            title: 'Membresías',
            description: 'Gestionar planes y membresías',
            icon: CreditCard,
            href: '/dashboard/admin/memberships',
            color: 'green',
        },
        {
            title: 'Reportes',
            description: 'Ver estadísticas e informes',
            icon: TrendingUp,
            href: '/dashboard/admin/reports',
            color: 'orange',
        },
    ];

    return (
        <>
            {/* Header */}
            <div className="mb-8 animate-slide-in-up">
                <h1 className="text-3xl font-bold text-white mb-2">
                    Panel de Administración 📊
                </h1>
                <p className="text-gray-400">
                    Bienvenido, {user.name || 'Administrador'}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <div
                        key={stat.label}
                        className="glass rounded-xl p-6 card-hover animate-slide-in-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-green-400 text-sm font-semibold">
                                {stat.change}
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                        <p className="text-white text-2xl font-bold">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Acciones Rápidas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {quickActions.map((action, index) => (
                        <button
                            key={action.title}
                            onClick={() => router.push(action.href)}
                            className="glass rounded-xl p-6 card-hover text-left animate-slide-in-up hover:scale-105 transition-transform"
                            style={{ animationDelay: `${(index + 4) * 50}ms` }}
                        >
                            <div className={`w-12 h-12 rounded-lg bg-${action.color}-500/20 flex items-center justify-center mb-4`}>
                                <action.icon className={`w-6 h-6 text-${action.color}-400`} />
                            </div>
                            <h3 className="text-white font-semibold mb-2">{action.title}</h3>
                            <p className="text-gray-400 text-sm">{action.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Actividad Reciente</h2>
                <div className="space-y-4">
                    {[
                        { user: 'Juan Pérez', action: 'reservó', target: 'CrossFit WOD', time: 'Hace 5 min' },
                        { user: 'María González', action: 'canceló', target: 'Yoga Flow', time: 'Hace 12 min' },
                        { user: 'Carlos Martínez', action: 'asistió a', target: 'Spinning Power', time: 'Hace 25 min' },
                        { user: 'Ana López', action: 'reservó', target: 'CrossFit Strength', time: 'Hace 35 min' },
                    ].map((activity, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">
                                        {activity.user.split(' ').map(n => n[0]).join('')}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-white text-sm">
                                        <span className="font-semibold">{activity.user}</span>
                                        {' '}{activity.action}{' '}
                                        <span className="text-blue-400">{activity.target}</span>
                                    </p>
                                    <p className="text-gray-500 text-xs">{activity.time}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
