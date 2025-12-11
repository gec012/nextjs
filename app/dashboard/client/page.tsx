'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/lib/stores/auth.store';
import { useMembershipStore } from '@/lib/stores/membership.store';
import {
    CreditCard,
    AlertCircle,
    CheckCircle,
    Clock,
    Dumbbell
} from 'lucide-react';
import { formatDate, formatCurrency, getGreeting } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ClientDashboard() {
    const user = useUser();
    const memberships = useMembershipStore((state) => state.memberships);
    const setMemberships = useMembershipStore((state) => state.setMemberships);
    const setLoading = useMembershipStore((state) => state.setLoading);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        fetchMemberships();
    }, []);

    const fetchMemberships = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/my-memberships', {
                credentials: 'include', // Cookie se envía automáticamente
            });

            if (!response.ok) {
                throw new Error('Error al cargar membresías');
            }

            const data = await response.json();
            setMemberships(data.memberships);
        } catch (error) {
            console.error('Error fetching memberships:', error);
            toast.error('Error al cargar tus membresías');
        } finally {
            setLoading(false);
            setIsLoadingData(false);
        }
    };

    const activeMemberships = memberships.filter((m) => m.status === 'ACTIVE');
    const totalCredits = activeMemberships.reduce(
        (sum, m) => sum + (m.is_unlimited ? 999 : m.remaining_credits),
        0
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'text-green-400 bg-green-500/10';
            case 'EXPIRED':
                return 'text-red-400 bg-red-500/10';
            case 'PENDING':
                return 'text-yellow-400 bg-yellow-500/10';
            default:
                return 'text-gray-400 bg-gray-500/10';
        }
    };

    const getDisciplineIcon = (discipline: string) => {
        // Podrías hacer un switch más completo aquí
        return <Dumbbell className="w-6 h-6" />;
    };

    return (
        <>
            {/* Header */}
            <div className="mb-8 animate-slide-in-up">
                <h1 className="text-3xl font-bold text-white mb-2">
                    {getGreeting()}, {user?.name}! 👋
                </h1>
                <p className="text-gray-400">
                    Aquí está el resumen de tus membresías
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Active Memberships */}
                <div className="glass rounded-xl p-6 card-hover animate-slide-in-up">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-green-400 text-sm font-medium">Activas</span>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">
                        {activeMemberships.length}
                    </p>
                    <p className="text-gray-400 text-sm">Membresías activas</p>
                </div>

                {/* Total Credits */}
                <div className="glass rounded-xl p-6 card-hover animate-slide-in-up" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg gradient-secondary flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-blue-400 text-sm font-medium">Créditos</span>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">
                        {totalCredits > 900 ? '∞' : totalCredits}
                    </p>
                    <p className="text-gray-400 text-sm">Créditos disponibles</p>
                </div>

                {/* Next Expiration */}
                <div className="glass rounded-xl p-6 card-hover animate-slide-in-up" style={{ animationDelay: '200ms' }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-orange-400" />
                        </div>
                        <span className="text-orange-400 text-sm font-medium">Próximo vencimiento</span>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">
                        {activeMemberships.length > 0
                            ? Math.min(...activeMemberships.map((m) => m.days_remaining))
                            : '-'}
                    </p>
                    <p className="text-gray-400 text-sm">Días restantes</p>
                </div>
            </div>

            {/* Memberships List */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white mb-4">Mis Membresías</h2>

                {isLoadingData ? (
                    <div className="glass rounded-xl p-8 text-center">
                        <div className="animate-pulse">
                            <div className="h-4 bg-white/10 rounded w-3/4 mx-auto mb-4"></div>
                            <div className="h-4 bg-white/10 rounded w-1/2 mx-auto"></div>
                        </div>
                    </div>
                ) : memberships.length === 0 ? (
                    <div className="glass rounded-xl p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                        <p className="text-gray-400">No tienes membresías activas</p>
                        <p className="text-gray-500 text-sm mt-2">
                            Contacta con recepción para adquirir una membresía
                        </p>
                    </div>
                ) : (
                    memberships.map((membership, index) => (
                        <div
                            key={membership.id}
                            className="glass rounded-xl p-6 card-hover animate-slide-in-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center">
                                        {getDisciplineIcon(membership.discipline)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">
                                            {membership.discipline}
                                        </h3>
                                        <p className="text-gray-400 text-sm">
                                            ID: #{membership.id}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                        membership.status
                                    )}`}
                                >
                                    {membership.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                {/* Credits */}
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Créditos</p>
                                    <p className="text-white font-semibold">
                                        {membership.is_unlimited ? (
                                            <span className="text-green-400">Ilimitado</span>
                                        ) : (
                                            `${membership.remaining_credits} / ${membership.total_credits}`
                                        )}
                                    </p>
                                </div>

                                {/* Start Date */}
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Inicio</p>
                                    <p className="text-white font-semibold">
                                        {formatDate(membership.start_date)}
                                    </p>
                                </div>

                                {/* Expiration */}
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Vencimiento</p>
                                    <p className="text-white font-semibold">
                                        {formatDate(membership.expiration_date)}
                                    </p>
                                </div>

                                {/* Days Remaining */}
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Días restantes</p>
                                    <p
                                        className={`font-semibold ${membership.days_remaining < 7
                                            ? 'text-red-400'
                                            : membership.days_remaining < 15
                                                ? 'text-yellow-400'
                                                : 'text-green-400'
                                            }`}
                                    >
                                        {membership.days_remaining} días
                                    </p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {!membership.is_unlimited && (
                                <div className="mt-4">
                                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full gradient-primary rounded-full transition-all"
                                            style={{
                                                width: `${(membership.remaining_credits / membership.total_credits) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </>
    );
}
