'use client';

import { useEffect, useState } from 'react';

import {
    Dumbbell,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    X,
    Calendar,
    Building2,
    Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Discipline {
    id: number;
    name: string;
    description: string;
    requiresReservation: boolean;
    color: string;
    isActive: boolean;
}

export default function AdminDisciplinesPage() {
    const [disciplines, setDisciplines] = useState<Discipline[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        requiresReservation: true,
    });

    useEffect(() => {
        fetchDisciplines();
    }, []);

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
            toast.error('Error al cargar las disciplinas');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (discipline?: Discipline) => {
        if (discipline) {
            setEditingDiscipline(discipline);
            setFormData({
                name: discipline.name,
                description: discipline.description || '',
                requiresReservation: discipline.requiresReservation,
            });
        } else {
            setEditingDiscipline(null);
            setFormData({
                name: '',
                description: '',
                requiresReservation: true,
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingDiscipline(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = editingDiscipline
                ? `/api/disciplines/${editingDiscipline.id}`
                : '/api/disciplines';

            const method = editingDiscipline ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || 'Error al guardar');
                return;
            }

            toast.success(
                editingDiscipline
                    ? 'Disciplina actualizada'
                    : 'Disciplina creada exitosamente'
            );
            handleCloseModal();
            fetchDisciplines();
        } catch (error) {
            console.error('Error saving discipline:', error);
            toast.error('Error al guardar la disciplina');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (disciplineId: number) => {
        if (!confirm('¿Estás seguro de eliminar esta disciplina? Esto podría afectar membresías y clases existentes.')) {
            return;
        }

        try {
            const response = await fetch(`/api/disciplines/${disciplineId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || 'Error al eliminar');
                return;
            }

            toast.success('Disciplina eliminada');
            fetchDisciplines();
        } catch (error) {
            console.error('Error deleting discipline:', error);
            toast.error('Error al eliminar la disciplina');
        }
    };

    const programmedCount = disciplines.filter(d => d.requiresReservation).length;
    const freeAccessCount = disciplines.filter(d => !d.requiresReservation).length;

    return (
        <>
            <div className="flex items-center justify-between mb-8 animate-slide-in-up">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Disciplinas 🏋️
                    </h1>
                    <p className="text-gray-400">
                        Administra las disciplinas disponibles en el gimnasio
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg gradient-primary text-white font-semibold hover:opacity-90 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Disciplina
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <Dumbbell className="w-8 h-8 text-blue-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">{disciplines.length}</p>
                            <p className="text-sm text-gray-400">Total disciplinas</p>
                        </div>
                    </div>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-purple-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">{programmedCount}</p>
                            <p className="text-sm text-gray-400">Con reserva</p>
                        </div>
                    </div>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-orange-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">{freeAccessCount}</p>
                            <p className="text-sm text-gray-400">Acceso libre</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Disciplines List */}
            {isLoading ? (
                <div className="glass rounded-xl p-12 text-center">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                    <p className="text-gray-400 mt-4">Cargando disciplinas...</p>
                </div>
            ) : disciplines.length === 0 ? (
                <div className="glass rounded-xl p-12 text-center">
                    <Dumbbell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No hay disciplinas configuradas</p>
                    <p className="text-gray-500 text-sm mt-2">
                        Crea tu primera disciplina para comenzar
                    </p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="mt-6 px-6 py-3 rounded-lg gradient-primary text-white font-semibold"
                    >
                        Crear primera disciplina
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {disciplines.map((discipline, index) => (
                        <div
                            key={discipline.id}
                            className="glass rounded-xl p-6 card-hover animate-slide-in-up"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${discipline.color} flex items-center justify-center`}>
                                        {discipline.requiresReservation ? (
                                            <Calendar className="w-6 h-6 text-white" />
                                        ) : (
                                            <Building2 className="w-6 h-6 text-white" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">
                                            {discipline.name}
                                        </h3>
                                        <span className={`text-xs px-2 py-1 rounded-full ${discipline.requiresReservation
                                            ? 'bg-purple-500/20 text-purple-400'
                                            : 'bg-orange-500/20 text-orange-400'
                                            }`}>
                                            {discipline.requiresReservation ? 'Con reserva' : 'Acceso libre'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(discipline)}
                                        className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(discipline.id)}
                                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {discipline.description && (
                                <p className="text-gray-400 text-sm mb-4">
                                    {discipline.description}
                                </p>
                            )}

                            <div className="pt-4 border-t border-white/10">
                                <p className="text-gray-500 text-xs">
                                    {discipline.requiresReservation
                                        ? 'Los usuarios deben reservar turno antes de asistir'
                                        : 'Los usuarios pueden acceder en cualquier momento del horario del gym'
                                    }
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="glass rounded-2xl p-8 max-w-lg w-full animate-slide-in-up">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    {editingDiscipline ? 'Editar Disciplina' : 'Nueva Disciplina'}
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
                                        Nombre
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ej: Yoga, CrossFit, Musculación"
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
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        placeholder="Describe brevemente la disciplina..."
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        Tipo de acceso
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, requiresReservation: true })}
                                            className={`p-4 rounded-lg border-2 transition-all text-left ${formData.requiresReservation
                                                ? 'border-purple-500 bg-purple-500/10'
                                                : 'border-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar className={`w-5 h-5 ${formData.requiresReservation ? 'text-purple-400' : 'text-gray-400'}`} />
                                                <span className={`font-semibold ${formData.requiresReservation ? 'text-purple-400' : 'text-gray-400'}`}>
                                                    Con reserva
                                                </span>
                                                {formData.requiresReservation && (
                                                    <Check className="w-4 h-4 text-purple-400 ml-auto" />
                                                )}
                                            </div>
                                            <p className="text-gray-500 text-xs">
                                                Clases programadas con horario y cupo
                                            </p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, requiresReservation: false })}
                                            className={`p-4 rounded-lg border-2 transition-all text-left ${!formData.requiresReservation
                                                ? 'border-orange-500 bg-orange-500/10'
                                                : 'border-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <Building2 className={`w-5 h-5 ${!formData.requiresReservation ? 'text-orange-400' : 'text-gray-400'}`} />
                                                <span className={`font-semibold ${!formData.requiresReservation ? 'text-orange-400' : 'text-gray-400'}`}>
                                                    Acceso libre
                                                </span>
                                                {!formData.requiresReservation && (
                                                    <Check className="w-4 h-4 text-orange-400 ml-auto" />
                                                )}
                                            </div>
                                            <p className="text-gray-500 text-xs">
                                                Disponible todo el horario del gym
                                            </p>
                                        </button>
                                    </div>
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
                                            editingDiscipline ? 'Guardar cambios' : 'Crear disciplina'
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
