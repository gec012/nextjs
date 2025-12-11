'use client';

import { useEffect, useState } from 'react';
import { useMembershipStore } from '@/lib/stores/membership.store';
import ClientCalendarView from './client-calendar-view';
import {
    Calendar,
    Clock,
    Users,
    Dumbbell,
    Filter,
    CheckCircle,
    X,
    Loader2,
    LayoutGrid,
    CalendarDays,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Class {
    id: number;
    name: string;
    disciplineName: string;
    instructorName: string | null;
    startTime: string;
    endTime: string;
    capacity: number;
    availableSpots: number;
    isReserved: boolean;
    reservationId: number | null;
}

export default function ClassesPage() {
    const { memberships, fetchMemberships } = useMembershipStore();

    const [classes, setClasses] = useState<Class[]>([]);
    const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [selectedDiscipline, setSelectedDiscipline] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [isReserving, setIsReserving] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'calendar'>(
        typeof window !== 'undefined' && window.innerWidth >= 768 ? 'calendar' : 'grid'
    );

    useEffect(() => {
        fetchClasses();
        fetchMemberships();
    }, []);

    useEffect(() => {
        if (selectedDiscipline === 'all') {
            setFilteredClasses(classes);
        } else {
            setFilteredClasses(classes.filter(c => c.disciplineName === selectedDiscipline));
        }
    }, [selectedDiscipline, classes]);

    const fetchClasses = async () => {
        try {
            const response = await fetch('/api/classes', {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Error al cargar clases');
            }

            const data = await response.json();
            setClasses(data.classes);
            setFilteredClasses(data.classes);
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Error al cargar las clases');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async (reservationId: number) => {
        setIsCancelling(true);
        try {
            const response = await fetch(`/api/classes/cancel/${reservationId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al cancel ar');
            }

            toast.success('Reserva cancelada exitosamente');
            fetchClasses();
            fetchMemberships();
        } catch (error: any) {
            console.error('Error cancelling reservation:', error);
            toast.error(error.message || 'Error al cancelar la reserva');
        } finally {
            setIsCancelling(false);
        }
    };

    const handleReserve = async () => {
        if (!selectedClass) return;

        setIsReserving(true);
        try {
            const response = await fetch('/api/classes/reserve', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    classId: selectedClass.id,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al reservar');
            }

            toast.success('¡Clase reservada exitosamente!');
            setSelectedClass(null);
            fetchClasses();
            fetchMemberships();
        } catch (error: any) {
            console.error('Error reserving class:', error);
            toast.error(error.message || 'Error al reservar la clase');
        } finally {
            setIsReserving(false);
        }
    };

    const disciplines = ['all', ...Array.from(new Set(classes.map(c => c.disciplineName)))];

    const getSpotColor = (availableSpots: number, capacity: number) => {
        const percentage = (availableSpots / capacity) * 100;
        if (percentage > 50) return 'text-green-400';
        if (percentage > 20) return 'text-yellow-400';
        return 'text-red-400';
    };

    const canReserve = (disciplineName: string) => {
        const membership = memberships.find(
            m => m.discipline === disciplineName && m.status === 'ACTIVE'
        );
        return membership && (membership.is_unlimited || membership.remaining_credits > 0);
    };

    return (
        <>
            <div className="mb-8 animate-slide-in-up">
                <h1 className="text-3xl font-bold text-white mb-2">
                    Clases Disponibles 📅
                </h1>
                <p className="text-gray-400">
                    Reserva tu lugar en las próximas clases
                </p>
            </div>

            <div className="mb-6 flex items-center gap-3 overflow-x-auto pb-2">
                <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
                {disciplines.map((discipline) => (
                    <button
                        key={discipline}
                        onClick={() => setSelectedDiscipline(discipline)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex-shrink-0 ${selectedDiscipline === discipline
                            ? 'gradient-primary text-white'
                            : 'glass text-gray-400 hover:text-white'
                            }`}
                    >
                        {discipline === 'all' ? 'Todas' : discipline}
                    </button>
                ))}
            </div>

            {/* View Toggle */}
            <div className="mb-6 flex justify-end">
                <div className="flex gap-2 glass rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${viewMode === 'calendar'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                        title="Vista calendario"
                    >
                        <CalendarDays className="w-4 h-4" />
                        <span className="hidden sm:inline">Calendario</span>
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${viewMode === 'grid'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                        title="Vista tarjetas"
                    >
                        <LayoutGrid className="w-4 h-4" />
                        <span className="hidden sm:inline">Tarjetas</span>
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="glass rounded-xl p-6 animate-pulse">
                            <div className="h-6 bg-white/10 rounded mb-4"></div>
                            <div className="h-4 bg-white/10 rounded mb-2"></div>
                            <div className="h-4 bg-white/10 rounded w-2/3"></div>
                        </div>
                    ))}
                </div>
            ) : filteredClasses.length === 0 ? (
                <div className="glass rounded-xl p-12 text-center">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No hay clases disponibles</p>
                    <p className="text-gray-500 text-sm mt-2">
                        {selectedDiscipline !== 'all'
                            ? 'Intenta con otra disciplina'
                            : 'Vuelve más tarde para ver nuevas clases'}
                    </p>
                </div>
            ) : viewMode === 'calendar' ? (
                <ClientCalendarView
                    classes={filteredClasses.map(c => ({
                        ...c,
                        isFull: c.availableSpots === 0,
                        enrolled: 0 // Not used in calendar view
                    }))}
                    onReserve={(classItem) => setSelectedClass({
                        ...classItem,
                        reservationId: classItem.reservationId ?? null
                    })}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClasses.map((classItem, index) => {
                        const hasAccess = canReserve(classItem.disciplineName);
                        const isFull = classItem.availableSpots === 0;
                        const isPast = parseISO(classItem.startTime) < new Date();

                        return (
                            <div
                                key={classItem.id}
                                className={`glass rounded-xl p-6 card-hover animate-slide-in-up ${isPast ? 'opacity-50' : ''}`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                                            <Dumbbell className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">
                                                {classItem.name}
                                            </h3>
                                            <p className="text-sm text-blue-400">
                                                {classItem.disciplineName}
                                            </p>
                                        </div>
                                    </div>
                                    {isPast && (
                                        <span className="px-2 py-1 rounded bg-gray-500/20 text-gray-400 text-xs font-bold">
                                            Pasada
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm">
                                            {format(parseISO(classItem.startTime), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <span className={`text-sm font-semibold ${getSpotColor(classItem.availableSpots, classItem.capacity)}`}>
                                            {classItem.availableSpots} / {classItem.capacity} lugares
                                        </span>
                                    </div>
                                </div>

                                {classItem.isReserved ? (
                                    <button
                                        onClick={() => classItem.reservationId && handleCancel(classItem.reservationId)}
                                        disabled={isCancelling}
                                        className="w-full py-3 rounded-lg font-semibold transition-all bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400"
                                    >
                                        {isCancelling ? 'Cancelando...' : '✓ Reservado - Click para cancelar'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setSelectedClass(classItem)}
                                        disabled={!hasAccess || isFull || isPast}
                                        className={`w-full py-3 rounded-lg font-semibold transition-all ${isPast
                                            ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                                            : !hasAccess
                                                ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                                                : isFull
                                                    ? 'bg-red-500/20 text-red-400 cursor-not-allowed'
                                                    : 'gradient-primary text-white hover:opacity-90'
                                            }`}
                                    >
                                        {isPast ? 'Clase pasada' : !hasAccess ? 'Sin membresía' : isFull ? 'Completo' : 'Reservar'}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedClass && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="glass rounded-2xl p-8 max-w-md w-full animate-slide-in-up">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Confirmar Reserva</h2>
                            <button onClick={() => setSelectedClass(null)} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="glass rounded-lg p-4">
                                <p className="text-gray-400 text-sm mb-1">Clase</p>
                                <p className="text-white font-semibold text-lg">{selectedClass.name}</p>
                            </div>

                            <div className="glass rounded-lg p-4">
                                <p className="text-gray-400 text-sm mb-1">Disciplina</p>
                                <p className="text-blue-400 font-semibold">{selectedClass.disciplineName}</p>
                            </div>

                            <div className="glass rounded-lg p-4">
                                <p className="text-gray-400 text-sm mb-1">Fecha y Hora</p>
                                <p className="text-white font-semibold">
                                    {format(parseISO(selectedClass.startTime), "EEEE dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                                </p>
                            </div>
                        </div>

                        {/* Política de cancelación */}
                        <div className="glass rounded-lg p-4 mb-6 border border-yellow-500/20">
                            <p className="text-yellow-400 text-sm font-semibold mb-2">⚠️ Política de cancelación</p>
                            <p className="text-gray-400 text-xs">
                                Puedes cancelar tu reserva hasta <strong className="text-white">3 horas antes</strong> de la clase.
                                Después de ese tiempo, no podrás cancelar y se descontará <strong className="text-white">1 crédito</strong> de tu membresía.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedClass(null)}
                                className="flex-1 py-3 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-all font-semibold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleReserve}
                                disabled={isReserving}
                                className="flex-1 py-3 rounded-lg gradient-primary text-white hover:opacity-90 transition-all font-semibold flex items-center justify-center gap-2"
                            >
                                {isReserving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Reservando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Confirmar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </>
    );
}
