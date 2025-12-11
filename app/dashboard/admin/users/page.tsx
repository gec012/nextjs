'use client';

import { useEffect, useState, useCallback } from 'react';

import ReceiptModal from '@/components/ReceiptModal';
import {
    Users,
    Search,
    UserPlus,
    Loader2,
    X,
    Pencil,
    Trash2,
    Mail,
    Phone,
    Shield,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    ChevronDown,
    Eye,
    DollarSign,
    CreditCard,
    Plus,
    FileText,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    rol: string;
    profilePhoto: string | null;
    createdAt: string;
    activeMemberships: number;
}

interface UserHistory {
    reservations: {
        id: number;
        className: string;
        disciplineName: string;
        date: string;
        status: string;
        attended: boolean;
    }[];
    attendances: {
        id: number;
        className: string;
        disciplineName: string;
        date: string;
    }[];
    payments: {
        id: number;
        amount: number;
        status: string;
        method: string;
        planName: string;
        disciplineName: string;
        date: string;
        reference: string | null;
    }[];
    memberships: {
        id: number;
        planName: string;
        disciplineName: string;
        remainingCredits: number;
        totalCredits: number;
        isUnlimited: boolean;
        status: string;
        expirationDate: string;
        startDate: string;
    }[];
    stats: {
        totalReservations: number;
        attended: number;
        noShow: number;
        cancelled: number;
        attendanceRate: number;
        totalPaid: number;
        totalPayments: number;
        activeMemberships: number;
    };
}

interface Plan {
    id: number;
    name: string;
    price: number;
    credits: number;
    isUnlimited: boolean;
    durationDays: number;
    disciplineId: number;
    disciplineName: string;
}

type ModalType = 'create' | 'edit' | 'view' | 'assign' | null;

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [modalType, setModalType] = useState<ModalType>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userHistory, setUserHistory] = useState<UserHistory | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('');
    const [paymentNotes, setPaymentNotes] = useState<string>('');
    const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<any>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        rol: 'CLIENT',
    });

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchUsers();
    }, [debouncedSearch, roleFilter]);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (roleFilter) params.append('role', roleFilter);

            const response = await fetch(`/api/users?${params}`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Error al cargar usuarios');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserHistory = async (userId: number) => {
        setIsLoadingHistory(true);
        try {
            const response = await fetch(`/api/users/${userId}/history`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setUserHistory(data);
            }
        } catch (error) {
            console.error('Error fetching user history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const response = await fetch('/api/plans?activeOnly=true', {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setPlans(data.plans || []);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
        }
    };

    const handleOpenModal = (type: ModalType, user?: User) => {
        setModalType(type);
        if (user) {
            setSelectedUser(user);
            if (type === 'edit') {
                setFormData({
                    name: user.name,
                    email: user.email,
                    password: '',
                    phone: user.phone || '',
                    rol: user.rol,
                });
            } else if (type === 'view') {
                fetchUserHistory(user.id);
            } else if (type === 'assign') {
                fetchPlans();
                setSelectedPlanId('');
            }
        } else {
            setSelectedUser(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                phone: '',
                rol: 'CLIENT',
            });
        }
    };

    const handleCloseModal = () => {
        setModalType(null);
        setSelectedUser(null);
        setUserHistory(null);
        setSelectedPlanId('');
        setPaymentMethod('');
        setPaymentNotes('');
    };

    const handleAssignPlan = async () => {
        if (!selectedUser || !selectedPlanId) {
            toast.error('Selecciona un plan');
            return;
        }

        if (!paymentMethod) {
            toast.error('Selecciona un método de pago');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/memberships', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUser.id,
                    planId: parseInt(selectedPlanId),
                    paymentMethod,
                    paymentNotes: paymentNotes || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || 'Error al asignar plan');
                return;
            }

            toast.success(data.message || 'Plan asignado exitosamente');
            handleCloseModal();
            fetchUsers();
        } catch (error) {
            toast.error('Error al asignar plan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = selectedUser
                ? `/api/users/${selectedUser.id}`
                : '/api/users';

            const method = selectedUser ? 'PUT' : 'POST';

            const body = selectedUser
                ? { ...formData, password: formData.password || undefined }
                : formData;

            const response = await fetch(url, {
                method,
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || 'Error al guardar');
                return;
            }

            toast.success(selectedUser ? 'Usuario actualizado' : 'Usuario creado');
            handleCloseModal();
            fetchUsers();
        } catch (error) {
            toast.error('Error al guardar usuario');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (userId: number) => {
        if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || 'Error al eliminar');
                return;
            }

            toast.success('Usuario eliminado');
            fetchUsers();
        } catch (error) {
            toast.error('Error al eliminar usuario');
        }
    };

    const getRoleBadge = (rol: string) => {
        const badges: Record<string, { bg: string; text: string; label: string }> = {
            ADMIN: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Admin' },
            STAFF: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Staff' },
            CLIENT: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Cliente' },
        };
        const badge = badges[rol] || badges.CLIENT;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    };

    const getStatusBadge = (status: string, attended: boolean) => {
        if (status === 'CANCELLED') {
            return <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">Cancelado</span>;
        }
        if (attended) {
            return <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">Asistió ✓</span>;
        }
        return <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">No asistió ✗</span>;
    };

    const clientCount = users.filter(u => u.rol === 'CLIENT').length;
    const staffCount = users.filter(u => u.rol === 'STAFF').length;
    const adminCount = users.filter(u => u.rol === 'ADMIN').length;

    return (
        <>
            <div className="flex items-center justify-between mb-8 animate-slide-in-up">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Gestionar Usuarios 👥
                    </h1>
                    <p className="text-gray-400">
                        Administra los usuarios del gimnasio
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal('create')}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg gradient-primary text-white font-semibold hover:opacity-90 transition-all"
                >
                    <UserPlus className="w-5 h-5" />
                    Nuevo Usuario
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">{users.length}</p>
                            <p className="text-sm text-gray-400">Total usuarios</p>
                        </div>
                    </div>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-green-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">{clientCount}</p>
                            <p className="text-sm text-gray-400">Clientes</p>
                        </div>
                    </div>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-orange-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">{staffCount}</p>
                            <p className="text-sm text-gray-400">Staff</p>
                        </div>
                    </div>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-red-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">{adminCount}</p>
                            <p className="text-sm text-gray-400">Admins</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="glass rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o email..."
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="" className="bg-gray-800">Todos los roles</option>
                    <option value="CLIENT" className="bg-gray-800">Clientes</option>
                    <option value="STAFF" className="bg-gray-800">Staff</option>
                    <option value="ADMIN" className="bg-gray-800">Admins</option>
                </select>
            </div>

            {/* Users List */}
            {isLoading ? (
                <div className="glass rounded-xl p-12 text-center">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                    <p className="text-gray-400 mt-4">Cargando usuarios...</p>
                </div>
            ) : users.length === 0 ? (
                <div className="glass rounded-xl p-12 text-center">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No se encontraron usuarios</p>
                    <p className="text-gray-500 text-sm mt-2">
                        {search ? 'Intenta con otro término de búsqueda' : 'Crea el primer usuario'}
                    </p>
                </div>
            ) : (
                <div className="glass rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Usuario</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Contacto</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Rol</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Membresías</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Registro</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-white font-medium">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                <Mail className="w-4 h-4" />
                                                {user.email}
                                            </div>
                                            {user.phone && (
                                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                    <Phone className="w-4 h-4" />
                                                    {user.phone}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getRoleBadge(user.rol)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`font-medium ${user.activeMemberships > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                                            {user.activeMemberships} activa{user.activeMemberships !== 1 ? 's' : ''}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">
                                        {format(parseISO(user.createdAt), 'dd/MM/yyyy')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal('assign', user)}
                                                className="p-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all"
                                                title="Asignar plan"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleOpenModal('view', user)}
                                                className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all"
                                                title="Ver historial"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleOpenModal('edit', user)}
                                                className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                                                title="Editar"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create/Edit Modal */}
            {
                (modalType === 'create' || modalType === 'edit') && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="glass rounded-2xl p-8 max-w-lg w-full animate-slide-in-up">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                                </h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Nombre completo
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {selectedUser ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña'}
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required={!selectedUser}
                                        minLength={6}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Teléfono (opcional)
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Rol
                                    </label>
                                    <select
                                        value={formData.rol}
                                        onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="CLIENT" className="bg-gray-800">Cliente</option>
                                        <option value="STAFF" className="bg-gray-800">Staff</option>
                                        <option value="ADMIN" className="bg-gray-800">Administrador</option>
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 py-3 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-all font-semibold"
                                        disabled={isSubmitting}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 py-3 rounded-lg gradient-primary text-white hover:opacity-90 transition-all font-semibold flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            selectedUser ? 'Guardar cambios' : 'Crear usuario'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* View History Modal */}
            {
                modalType === 'view' && selectedUser && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="glass rounded-2xl p-8 max-w-3xl w-full animate-slide-in-up max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                                        {selectedUser.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">{selectedUser.name}</h2>
                                        <p className="text-gray-400">{selectedUser.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {isLoadingHistory ? (
                                <div className="text-center py-12">
                                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                                    <p className="text-gray-400 mt-4">Cargando historial...</p>
                                </div>
                            ) : userHistory ? (
                                <>
                                    {/* Stats Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                                        <div className="bg-white/5 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-white">{userHistory.stats.activeMemberships || 0}</p>
                                            <p className="text-xs text-gray-400">Membresías</p>
                                        </div>
                                        <div className="bg-green-500/10 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-green-400">{userHistory.stats.attended}</p>
                                            <p className="text-xs text-gray-400">Asistió</p>
                                        </div>
                                        <div className="bg-red-500/10 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-red-400">{userHistory.stats.noShow}</p>
                                            <p className="text-xs text-gray-400">No asistió</p>
                                        </div>
                                        <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-blue-400">{userHistory.stats.attendanceRate}%</p>
                                            <p className="text-xs text-gray-400">Asistencia</p>
                                        </div>
                                        <div className="bg-purple-500/10 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-purple-400">${userHistory.stats.totalPaid?.toLocaleString() || 0}</p>
                                            <p className="text-xs text-gray-400">Total pagado</p>
                                        </div>
                                    </div>

                                    {/* Memberships */}
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-purple-400" />
                                        Membresías
                                    </h3>

                                    {userHistory.memberships.length === 0 ? (
                                        <div className="bg-white/5 rounded-lg p-6 text-center text-gray-400 mb-6">
                                            Sin membresías registradas
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            {userHistory.memberships.map((mem) => (
                                                <div
                                                    key={mem.id}
                                                    className={`p-4 rounded-lg border ${mem.status === 'ACTIVE'
                                                        ? 'bg-green-500/10 border-green-500/30'
                                                        : 'bg-gray-500/10 border-gray-500/30'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-bold text-white">{mem.disciplineName}</span>
                                                        <span className={`px-2 py-1 rounded-full text-xs ${mem.status === 'ACTIVE'
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : 'bg-gray-500/20 text-gray-400'
                                                            }`}>
                                                            {mem.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-400">{mem.planName}</p>
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <span className="text-sm text-gray-400">
                                                            Créditos: {mem.isUnlimited ? '∞ Ilimitado' : `${mem.remainingCredits}/${mem.totalCredits}`}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            Vence: {format(parseISO(mem.expirationDate), 'dd/MM/yyyy')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Reservation History */}
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-blue-400" />
                                        Historial de Reservas
                                    </h3>

                                    {userHistory.reservations.length === 0 ? (
                                        <div className="bg-white/5 rounded-lg p-6 text-center text-gray-400 mb-6">
                                            Sin reservas registradas
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 rounded-lg overflow-hidden mb-6">
                                            <table className="w-full">
                                                <thead className="bg-white/5">
                                                    <tr>
                                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Fecha</th>
                                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Clase</th>
                                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Disciplina</th>
                                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {userHistory.reservations.slice(0, 10).map((res) => (
                                                        <tr key={res.id}>
                                                            <td className="px-4 py-3 text-sm text-gray-300">
                                                                {format(parseISO(res.date), 'dd/MM/yyyy HH:mm', { locale: es })}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-white">{res.className}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-400">{res.disciplineName}</td>
                                                            <td className="px-4 py-3">
                                                                {getStatusBadge(res.status, res.attended)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {userHistory.reservations.length > 10 && (
                                                <div className="text-center py-2 text-gray-500 text-sm">
                                                    Mostrando 10 de {userHistory.reservations.length} reservas
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Payment History */}
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-green-400" />
                                        Historial de Pagos
                                    </h3>

                                    {userHistory.payments.length === 0 ? (
                                        <div className="bg-white/5 rounded-lg p-6 text-center text-gray-400">
                                            Sin pagos registrados
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 rounded-lg overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-white/5">
                                                    <tr>
                                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Fecha</th>
                                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Plan</th>
                                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Monto</th>
                                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Método</th>
                                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Estado</th>
                                                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-400">Factura</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {userHistory.payments.slice(0, 10).map((pay) => (
                                                        <tr key={pay.id}>
                                                            <td className="px-4 py-3 text-sm text-gray-300">
                                                                {format(parseISO(pay.date), 'dd/MM/yyyy', { locale: es })}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-white">
                                                                {pay.planName}
                                                                <span className="text-gray-500 text-xs ml-1">({pay.disciplineName})</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-green-400 font-medium">
                                                                ${pay.amount.toLocaleString()}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-400">
                                                                {pay.method === 'CASH' ? 'Efectivo' :
                                                                    pay.method === 'TRANSFER' ? 'Transferencia' :
                                                                        pay.method === 'CREDIT' ? 'Crédito' :
                                                                            pay.method === 'DEBIT' ? 'Débito' :
                                                                                pay.method === 'MERCADOPAGO' ? 'MercadoPago' : pay.method}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {pay.status === 'APPROVED' && (
                                                                    <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">Aprobado</span>
                                                                )}
                                                                {pay.status === 'PENDING' && (
                                                                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">Pendiente</span>
                                                                )}
                                                                {pay.status === 'REJECTED' && (
                                                                    <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">Rechazado</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                {pay.status === 'APPROVED' && (
                                                                    <button
                                                                        onClick={() => setSelectedPaymentForReceipt({
                                                                            id: pay.id,
                                                                            userName: selectedUser?.name || '',
                                                                            userEmail: selectedUser?.email || '',
                                                                            planName: pay.planName,
                                                                            disciplineName: pay.disciplineName,
                                                                            amount: pay.amount,
                                                                            method: pay.method,
                                                                            status: pay.status,
                                                                            createdAt: pay.date,
                                                                            notes: null,
                                                                        })}
                                                                        className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                                                                        title="Ver factura"
                                                                    >
                                                                        <FileText className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {userHistory.payments.length > 10 && (
                                                <div className="text-center py-2 text-gray-500 text-sm">
                                                    Mostrando 10 de {userHistory.payments.length} pagos
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    No se pudo cargar el historial
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Assign Plan Modal */}
            {
                modalType === 'assign' && selectedUser && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="glass rounded-2xl p-8 max-w-lg w-full animate-slide-in-up">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Asignar Plan</h2>
                                    <p className="text-gray-400 mt-1">Usuario: {selectedUser.name}</p>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Seleccionar Plan
                                    </label>
                                    <select
                                        value={selectedPlanId}
                                        onChange={(e) => setSelectedPlanId(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="" className="bg-gray-800">-- Seleccionar plan --</option>
                                        {plans.map((plan) => (
                                            <option key={plan.id} value={plan.id} className="bg-gray-800">
                                                {plan.disciplineName} - {plan.name} (${plan.price.toLocaleString()})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedPlanId && (
                                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                                        {(() => {
                                            const plan = plans.find(p => p.id === parseInt(selectedPlanId));
                                            if (!plan) return null;
                                            return (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Disciplina:</span>
                                                        <span className="text-white font-medium">{plan.disciplineName}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Plan:</span>
                                                        <span className="text-white font-medium">{plan.name}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Precio:</span>
                                                        <span className="text-green-400 font-bold">${plan.price.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Créditos:</span>
                                                        <span className="text-white font-medium">
                                                            {plan.isUnlimited ? '∞ Ilimitado' : `${plan.credits} créditos`}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400">Duración:</span>
                                                        <span className="text-white font-medium">{plan.durationDays} días</span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Método de Pago */}
                                {selectedPlanId && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-3">
                                            Método de Pago
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {[
                                                { value: 'CASH', label: 'Efectivo', icon: '💵' },
                                                { value: 'TRANSFER', label: 'Transferencia', icon: '🏦' },
                                                { value: 'MERCADOPAGO', label: 'MercadoPago', icon: '📱' },
                                                { value: 'DEBIT', label: 'Débito', icon: '💳' },
                                                { value: 'CREDIT', label: 'Crédito', icon: '💳' },
                                            ].map((method) => (
                                                <button
                                                    key={method.value}
                                                    type="button"
                                                    onClick={() => setPaymentMethod(method.value)}
                                                    className={`p-3 rounded-lg border-2 transition-all text-center ${paymentMethod === method.value
                                                        ? 'border-green-500 bg-green-500/10'
                                                        : 'border-white/10 hover:border-white/30'
                                                        }`}
                                                >
                                                    <span className="text-xl mb-1 block">{method.icon}</span>
                                                    <span className={`text-xs font-medium ${paymentMethod === method.value ? 'text-green-400' : 'text-gray-400'
                                                        }`}>
                                                        {method.label}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Notas */}
                                {selectedPlanId && paymentMethod && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Notas (opcional)
                                        </label>
                                        <input
                                            type="text"
                                            value={paymentNotes}
                                            onChange={(e) => setPaymentNotes(e.target.value)}
                                            placeholder="Ej: Pago parcial, promoción, etc."
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 py-3 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-all font-semibold"
                                        disabled={isSubmitting}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleAssignPlan}
                                        disabled={isSubmitting || !selectedPlanId || !paymentMethod}
                                        className="flex-1 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <CreditCard className="w-5 h-5" />
                                                Asignar y Cobrar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Receipt Modal */}
            {
                selectedPaymentForReceipt && (
                    <ReceiptModal
                        receipt={selectedPaymentForReceipt}
                        onClose={() => setSelectedPaymentForReceipt(null)}
                    />
                )
            }
        </>
    );
}
