'use client';

import { useEffect, useState } from 'react';
import {
    CreditCard,
    Search,
    Loader2,
    Calendar,
    User,
    Award,
    AlertCircle,
    CheckCircle,
    XCircle,
    Filter,
    Eye,
} from 'lucide-react';
import { format, parseISO, isPast, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Membership {
    id: number;
    userId: number;
    userName: string;
    userEmail: string;
    planName: string;
    disciplineName: string;
    startDate: string;
    expirationDate: string;
    totalCredits: number;
    remainingCredits: number;
    isUnlimited: boolean;
    status: string;
}

interface Stats {
    total: number;
    active: number;
    expiringSoon: number;
    expired: number;
}

export default function AdminMembershipsPage() {
    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [filteredMemberships, setFilteredMemberships] = useState<Membership[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [stats, setStats] = useState<Stats>({
        total: 0,
        active: 0,
        expiringSoon: 0,
        expired: 0,
    });

    useEffect(() => {
        fetchMemberships();
    }, []);

    useEffect(() => {
        filterMemberships();
    }, [memberships, search, statusFilter]);

    const fetchMemberships = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/memberships', {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setMemberships(data.memberships || []);
                calculateStats(data.memberships || []);
            }
        } catch (error) {
            console.error('Error fetching memberships:', error);
            toast.error('Error al cargar membresías');
        } finally {
            setIsLoading(false);
        }
    };

    const calculateStats = (data: Membership[]) => {
        const now = new Date();
        const active = data.filter(m => m.status === 'ACTIVE' && !isPast(parseISO(m.expirationDate))).length;
        const expiringSoon = data.filter(m => {
            if (m.status !== 'ACTIVE') return false;
            const days = differenceInDays(parseISO(m.expirationDate), now);
            return days >= 0 && days <= 7;
        }).length;
        const expired = data.filter(m => isPast(parseISO(m.expirationDate))).length;

        setStats({
            total: data.length,
            active,
            expiringSoon,
            expired,
        });
    };

    const filterMemberships = () => {
        let filtered = [...memberships];

        // Filtro de búsqueda
        if (search) {
            filtered = filtered.filter(
                m =>
                    m.userName.toLowerCase().includes(search.toLowerCase()) ||
                    m.userEmail.toLowerCase().includes(search.toLowerCase()) ||
                    m.planName.toLowerCase().includes(search.toLowerCase()) ||
                    m.disciplineName.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Filtro de estado
        if (statusFilter === 'ACTIVE') {
            filtered = filtered.filter(m => m.status === 'ACTIVE' && !isPast(parseISO(m.expirationDate)));
        } else if (statusFilter === 'EXPIRING') {
            const now = new Date();
            filtered = filtered.filter(m => {
                if (m.status !== 'ACTIVE') return false;
                const days = differenceInDays(parseISO(m.expirationDate), now);
                return days >= 0 && days <= 7;
            });
        } else if (statusFilter === 'EXPIRED') {
            filtered = filtered.filter(m => isPast(parseISO(m.expirationDate)));
        }

        setFilteredMemberships(filtered);
    };

    const getStatusBadge = (membership: Membership) => {
        const expirationDate = parseISO(membership.expirationDate);
        const daysRemaining = differenceInDays(expirationDate, new Date());

        if (isPast(expirationDate)) {
            return (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400">
                    <XCircle className="w-3 h-3" /> Vencida
                </span>
            );
        }

        if (daysRemaining <= 7) {
            return (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                    <AlertCircle className="w-3 h-3" /> Vence en {daysRemaining}d
                </span>
            );
        }

        return (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                <CheckCircle className="w-3 h-3" /> Activa
            </span>
        );
    };

    return (
        <>
            {/* Header */}
            <div className="mb-8 animate-slide-in-up">
                <h1 className="text-3xl font-bold text-white mb-2">
                    Gestión de Membresías 💳
                </h1>
                <p className="text-gray-400">
                    Administra todas las membresías activas
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="glass rounded-xl p-6 card-hover">
                    <div className="flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-blue-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">{stats.total}</p>
                            <p className="text-sm text-gray-400">Total Membresías</p>
                        </div>
                    </div>
                </div>
                <div className="glass rounded-xl p-6 card-hover">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">{stats.active}</p>
                            <p className="text-sm text-gray-400">Activas</p>
                        </div>
                    </div>
                </div>
                <div className="glass rounded-xl p-6 card-hover">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-8 h-8 text-yellow-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">{stats.expiringSoon}</p>
                            <p className="text-sm text-gray-400">Próximas a Vencer</p>
                        </div>
                    </div>
                </div>
                <div className="glass rounded-xl p-6 card-hover">
                    <div className="flex items-center gap-3">
                        <XCircle className="w-8 h-8 text-red-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">{stats.expired}</p>
                            <p className="text-sm text-gray-400">Vencidas</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="glass rounded-xl p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por usuario, email, plan o disciplina..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setStatusFilter('')}
                            className={`px-4 py-2 rounded-lg transition-all ${statusFilter === ''
                                ? 'bg-blue-500 text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => setStatusFilter('ACTIVE')}
                            className={`px-4 py-2 rounded-lg transition-all ${statusFilter === 'ACTIVE'
                                ? 'bg-green-500 text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            Activas
                        </button>
                        <button
                            onClick={() => setStatusFilter('EXPIRING')}
                            className={`px-4 py-2 rounded-lg transition-all ${statusFilter === 'EXPIRING'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            Por Vencer
                        </button>
                        <button
                            onClick={() => setStatusFilter('EXPIRED')}
                            className={`px-4 py-2 rounded-lg transition-all ${statusFilter === 'EXPIRED'
                                ? 'bg-red-500 text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            Vencidas
                        </button>
                    </div>
                </div>
            </div>

            {/* Memberships Table */}
            {isLoading ? (
                <div className="glass rounded-xl p-12 text-center">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                    <p className="text-gray-400 mt-4">Cargando membresías...</p>
                </div>
            ) : filteredMemberships.length === 0 ? (
                <div className="glass rounded-xl p-12 text-center">
                    <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">
                        {search || statusFilter ? 'No se encontraron membresías' : 'No hay membresías registradas'}
                    </p>
                </div>
            ) : (
                <div className="glass rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">Usuario</th>
                                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">Plan</th>
                                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">Disciplina</th>
                                    <th className="text-center px-6 py-4 text-xs font-medium text-gray-400 uppercase">Créditos</th>
                                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase">Vencimiento</th>
                                    <th className="text-center px-6 py-4 text-xs font-medium text-gray-400 uppercase">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredMemberships.map((membership) => (
                                    <tr key={membership.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-white font-medium">{membership.userName}</p>
                                                <p className="text-gray-400 text-sm">{membership.userEmail}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-white">{membership.planName}</td>
                                        <td className="px-6 py-4 text-gray-300">{membership.disciplineName}</td>
                                        <td className="px-6 py-4 text-center">
                                            {membership.isUnlimited ? (
                                                <span className="text-purple-400 font-medium">∞ Ilimitado</span>
                                            ) : (
                                                <span className="text-blue-400 font-medium">
                                                    {membership.remainingCredits} / {membership.totalCredits}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <p className="text-white">
                                                    {format(parseISO(membership.expirationDate), "d MMM yyyy", { locale: es })}
                                                </p>
                                                <p className="text-gray-500 text-xs">
                                                    {differenceInDays(parseISO(membership.expirationDate), new Date())} días
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(membership)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredMemberships.length > 0 && (
                        <div className="bg-white/5 px-6 py-3 text-sm text-gray-400 text-center">
                            Mostrando {filteredMemberships.length} de {memberships.length} membresías
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
