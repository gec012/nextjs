'use client';

import { useEffect, useState } from 'react';
import {
    CreditCard,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    X,
    DollarSign,
    Calendar,
    Infinity,
    Hash,
    Dumbbell,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

interface Discipline {
    id: number;
    name: string;
    requiresReservation: boolean;
}

interface Plan {
    id: number;
    name: string;
    description: string | null;
    price: number;
    credits: number;
    isUnlimited: boolean;
    durationDays: number;
    disciplineId: number;
    disciplineName: string;
    requiresReservation: boolean;
    isActive: boolean;
    activeMemberships: number;
    createdAt: string;
}

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [disciplines, setDisciplines] = useState<Discipline[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filterDiscipline, setFilterDiscipline] = useState<string>('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        credits: '',
        isUnlimited: false,
        durationDays: '30',
        disciplineId: '',
    });

    useEffect(() => {
        fetchPlans();
        fetchDisciplines();
    }, []);

    const fetchPlans = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/plans', {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setPlans(data.plans || []);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('Error al cargar planes');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDisciplines = async () => {
        try {
            const response = await fetch('/api/disciplines', {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setDisciplines(data.disciplines || []);
            }
        } catch (error) {
            console.error('Error fetching disciplines:', error);
        }
    };

    const handleOpenModal = (plan?: Plan) => {
        if (plan) {
            setSelectedPlan(plan);
            setFormData({
                name: plan.name,
                description: plan.description || '',
                price: plan.price.toString(),
                credits: plan.credits.toString(),
                isUnlimited: plan.isUnlimited,
                durationDays: plan.durationDays.toString(),
                disciplineId: plan.disciplineId.toString(),
            });
        } else {
            setSelectedPlan(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                credits: '',
                isUnlimited: false,
                durationDays: '30',
                disciplineId: disciplines[0]?.id.toString() || '',
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPlan(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = selectedPlan
                ? `/api/plans/${selectedPlan.id}`
                : '/api/plans';

            const method = selectedPlan ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    disciplineId: parseInt(formData.disciplineId),
                    price: parseFloat(formData.price),
                    credits: parseInt(formData.credits) || 0,
                    durationDays: parseInt(formData.durationDays),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || 'Error al guardar');
                return;
            }

            toast.success(selectedPlan ? 'Plan actualizado' : 'Plan creado');
            handleCloseModal();
            fetchPlans();
        } catch (error) {
            toast.error('Error al guardar plan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (planId: number) => {
        if (!confirm('¿Estás seguro de eliminar este plan?')) {
            return;
        }

        try {
            const response = await fetch(`/api/plans/${planId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || 'Error al eliminar');
                return;
            }

            toast.success('Plan eliminado');
            fetchPlans();
        } catch (error) {
            toast.error('Error al eliminar plan');
        }
    };

    const filteredPlans = filterDiscipline
        ? plans.filter(p => p.disciplineId === parseInt(filterDiscipline))
        : plans;

    // Agrupar planes por disciplina
    const plansByDiscipline = filteredPlans.reduce((acc, plan) => {
        if (!acc[plan.disciplineName]) {
            acc[plan.disciplineName] = [];
        }
        acc[plan.disciplineName].push(plan);
        return acc;
    }, {} as Record<string, Plan[]>);

    return (
        <>
            <div className="flex items-center justify-between mb-8 animate-slide-in-up">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Gestionar Planes 💳
                    </h1>
                    <p className="text-gray-400">
                        Administra los planes de membresía
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg gradient-primary text-white font-semibold hover:opacity-90 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Plan
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-blue-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">{plans.length}</p>
                            <p className="text-sm text-gray-400">Total planes</p>
                        </div>
                    </div>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <Infinity className="w-8 h-8 text-purple-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {plans.filter(p => p.isUnlimited).length}
                            </p>
                            <p className="text-sm text-gray-400">Ilimitados</p>
                        </div>
                    </div>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <Hash className="w-8 h-8 text-green-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {plans.filter(p => !p.isUnlimited).length}
                            </p>
                            <p className="text-sm text-gray-400">Con créditos</p>
                        </div>
                    </div>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <Dumbbell className="w-8 h-8 text-orange-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {Object.keys(plansByDiscipline).length}
                            </p>
                            <p className="text-sm text-gray-400">Disciplinas</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="glass rounded-xl p-4 mb-6">
                <select
                    value={filterDiscipline}
                    onChange={(e) => setFilterDiscipline(e.target.value)}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="" className="bg-gray-800">Todas las disciplinas</option>
                    {disciplines.map((d) => (
                        <option key={d.id} value={d.id} className="bg-gray-800">
                            {d.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Plans List */}
            {isLoading ? (
                <div className="glass rounded-xl p-12 text-center">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                    <p className="text-gray-400 mt-4">Cargando planes...</p>
                </div>
            ) : plans.length === 0 ? (
                <div className="glass rounded-xl p-12 text-center">
                    <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No hay planes creados</p>
                    <p className="text-gray-500 text-sm mt-2">
                        Crea el primer plan para comenzar
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(plansByDiscipline).map(([disciplineName, disciplinePlans]) => (
                        <div key={disciplineName}>
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Dumbbell className="w-5 h-5 text-blue-400" />
                                {disciplineName}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {disciplinePlans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className={`glass rounded-xl p-6 border-2 transition-all hover:scale-[1.02] ${plan.isActive
                                            ? 'border-transparent hover:border-blue-500/30'
                                            : 'border-red-500/30 opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                                                {plan.description && (
                                                    <p className="text-sm text-gray-400 mt-1">{plan.description}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleOpenModal(plan)}
                                                    className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(plan.id)}
                                                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400 flex items-center gap-2">
                                                    <DollarSign className="w-4 h-4" />
                                                    Precio
                                                </span>
                                                <span className="text-2xl font-bold text-green-400">
                                                    ${plan.price.toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400 flex items-center gap-2">
                                                    {plan.isUnlimited ? (
                                                        <Infinity className="w-4 h-4" />
                                                    ) : (
                                                        <Hash className="w-4 h-4" />
                                                    )}
                                                    Créditos
                                                </span>
                                                <span className="text-white font-semibold">
                                                    {plan.isUnlimited ? (
                                                        <span className="text-purple-400">∞ Ilimitado</span>
                                                    ) : (
                                                        `${plan.credits} créditos`
                                                    )}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400 flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    Duración
                                                </span>
                                                <span className="text-white font-semibold">
                                                    {plan.durationDays} días
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                                            <span className={`px-2 py-1 rounded-full text-xs ${plan.requiresReservation
                                                ? 'bg-purple-500/20 text-purple-400'
                                                : 'bg-orange-500/20 text-orange-400'
                                                }`}>
                                                {plan.requiresReservation ? 'Con reserva' : 'Acceso libre'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {plan.activeMemberships} activas
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="glass rounded-2xl p-8 max-w-lg w-full animate-slide-in-up max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    {selectedPlan ? 'Editar Plan' : 'Nuevo Plan'}
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
                                        Disciplina
                                    </label>
                                    <select
                                        value={formData.disciplineId}
                                        onChange={(e) => setFormData({ ...formData, disciplineId: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                        disabled={!!selectedPlan}
                                    >
                                        <option value="" className="bg-gray-800">Seleccionar disciplina</option>
                                        {disciplines.map((d) => (
                                            <option key={d.id} value={d.id} className="bg-gray-800">
                                                {d.name} {d.requiresReservation ? '(Con reserva)' : '(Acceso libre)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Nombre del plan
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ej: Mensual, 12 clases, Premium..."
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Descripción (opcional)
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe el plan..."
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        rows={2}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Precio ($)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            placeholder="15000"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Duración (días)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.durationDays}
                                            onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                                            placeholder="30"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            min="1"
                                        />
                                    </div>
                                </div>

                                {/* Tipo de créditos */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        Tipo de acceso
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, isUnlimited: true, credits: '' })}
                                            className={`p-4 rounded-lg border-2 transition-all text-left ${formData.isUnlimited
                                                ? 'border-purple-500 bg-purple-500/10'
                                                : 'border-white/10 hover:border-white/30'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Infinity className={`w-5 h-5 ${formData.isUnlimited ? 'text-purple-400' : 'text-gray-400'}`} />
                                                <span className={`font-semibold ${formData.isUnlimited ? 'text-purple-400' : 'text-gray-400'}`}>
                                                    Ilimitado
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">Acceso sin límite de créditos</p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, isUnlimited: false })}
                                            className={`p-4 rounded-lg border-2 transition-all text-left ${!formData.isUnlimited
                                                ? 'border-green-500 bg-green-500/10'
                                                : 'border-white/10 hover:border-white/30'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Hash className={`w-5 h-5 ${!formData.isUnlimited ? 'text-green-400' : 'text-gray-400'}`} />
                                                <span className={`font-semibold ${!formData.isUnlimited ? 'text-green-400' : 'text-gray-400'}`}>
                                                    Con créditos
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">Cantidad limitada de accesos</p>
                                        </button>
                                    </div>
                                </div>

                                {!formData.isUnlimited && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Cantidad de créditos
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.credits}
                                            onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                                            placeholder="12"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required={!formData.isUnlimited}
                                            min="1"
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
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 py-3 rounded-lg gradient-primary text-white hover:opacity-90 transition-all font-semibold flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            selectedPlan ? 'Guardar cambios' : 'Crear plan'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </>
    );
}
