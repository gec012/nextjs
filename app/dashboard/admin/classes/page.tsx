'use client';

import { useEffect, useState } from 'react';
import BulkGeneratorModal from './bulk-generator-modal';
import {
    Calendar,
    Clock,
    Users,
    Dumbbell,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    X,
    Repeat,
    Building2,
    Zap,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Class {
    id: number;
    name: string;
    disciplineId: number;
    disciplineName: string;
    instructorName: string | null;
    startTime: string;
    endTime: string;
    capacity: number;
    enrolled: number;
    availableSpots: number;
    isActive: boolean;
}

interface Discipline {
    id: number;
    name: string;
    requiresReservation: boolean; // true = clase programada, false = acceso libre
    color: string;
}

// Horarios del gym (esto idealmente vendría de configuración)
const GYM_HOURS = {
    openTime: '06:00',
    closeTime: '22:00',
};

const DAYS_OF_WEEK = [
    { id: 1, name: 'Lunes', short: 'L' },
    { id: 2, name: 'Martes', short: 'M' },
    { id: 3, name: 'Miércoles', short: 'X' },
    { id: 4, name: 'Jueves', short: 'J' },
    { id: 5, name: 'Viernes', short: 'V' },
    { id: 6, name: 'Sábado', short: 'S' },
    { id: 0, name: 'Domingo', short: 'D' },
];

type ModalType = 'class' | 'area' | null;

export default function AdminClassesPage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [disciplines, setDisciplines] = useState<Discipline[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalType, setModalType] = useState<ModalType>(null);
    const [editingClass, setEditingClass] = useState<Class | null>(null);
    const [activeTab, setActiveTab] = useState<'classes' | 'areas'>('classes');
    const [showBulkGenerator, setShowBulkGenerator] = useState(false);

    // Form state para clases programadas
    const [classFormData, setClassFormData] = useState({
        name: '',
        disciplineId: '',
        instructorName: '',
        time: '09:00',
        duration: 60, // minutos
        capacity: 20,
        selectedDays: [] as number[],
    });

    // Form state para áreas de acceso libre
    const [areaFormData, setAreaFormData] = useState({
        name: '',
        disciplineId: '',
        capacity: 50,
        openTime: GYM_HOURS.openTime,
        closeTime: GYM_HOURS.closeTime,
    });

    useEffect(() => {
        fetchClasses();
        fetchDisciplines();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await fetch('/api/classes', {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setClasses(data.classes || []);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Error al cargar las clases');
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

    const programmedDisciplines = disciplines.filter(d => d.requiresReservation);
    const freeAccessDisciplines = disciplines.filter(d => !d.requiresReservation);

    const handleOpenClassModal = (classItem?: Class) => {
        if (classItem) {
            setEditingClass(classItem);
            // Parse existing class data
            const startDate = parseISO(classItem.startTime);
            setClassFormData({
                name: classItem.name,
                disciplineId: classItem.disciplineId.toString(),
                instructorName: classItem.instructorName || '',
                time: format(startDate, 'HH:mm'),
                duration: 60,
                capacity: classItem.capacity,
                selectedDays: [startDate.getDay()],
            });
        } else {
            setEditingClass(null);
            setClassFormData({
                name: '',
                disciplineId: '',
                instructorName: '',
                time: '09:00',
                duration: 60,
                capacity: 20,
                selectedDays: [],
            });
        }
        setModalType('class');
    };

    const handleOpenAreaModal = () => {
        setAreaFormData({
            name: '',
            disciplineId: '',
            capacity: 50,
            openTime: GYM_HOURS.openTime,
            closeTime: GYM_HOURS.closeTime,
        });
        setModalType('area');
    };

    const handleCloseModal = () => {
        setModalType(null);
        setEditingClass(null);
    };

    const toggleDay = (dayId: number) => {
        setClassFormData(prev => ({
            ...prev,
            selectedDays: prev.selectedDays.includes(dayId)
                ? prev.selectedDays.filter(d => d !== dayId)
                : [...prev.selectedDays, dayId]
        }));
    };

    const handleSubmitClass = async (e: React.FormEvent) => {
        e.preventDefault();

        if (classFormData.selectedDays.length === 0) {
            toast.error('Selecciona al menos un día');
            return;
        }

        // TODO: Implementar API para crear/editar clases
        // Esto crearía una clase para cada día seleccionado
        const selectedDayNames = classFormData.selectedDays
            .map(d => DAYS_OF_WEEK.find(day => day.id === d)?.name)
            .join(', ');

        toast.success(
            editingClass
                ? 'Clase actualizada'
                : `Clase creada para: ${selectedDayNames}`
        );
        handleCloseModal();
        fetchClasses();
    };

    const handleSubmitArea = async (e: React.FormEvent) => {
        e.preventDefault();

        // TODO: Implementar API para crear áreas de acceso libre
        toast.success('Área de acceso libre configurada');
        handleCloseModal();
    };

    const handleDelete = async (classId: number) => {
        if (!confirm('¿Estás seguro de eliminar esta clase?')) return;

        try {
            const response = await fetch(`/api/classes/${classId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.hasActiveReservations) {
                    toast.error(`No se puede eliminar: ${data.reservationCount} reservas activas`);
                } else {
                    toast.error(data.message || 'Error al eliminar');
                }
                return;
            }

            toast.success('Clase eliminada exitosamente');
            fetchClasses();
        } catch (error) {
            console.error('Error deleting class:', error);
            toast.error('Error al eliminar la clase');
        }
    };

    const getSpotColor = (availableSpots: number, capacity: number) => {
        const percentage = (availableSpots / capacity) * 100;
        if (percentage > 50) return 'text-green-400';
        if (percentage > 20) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <>
            <div className="flex items-center justify-between mb-8 animate-slide-in-up">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Gestionar Clases 📅
                    </h1>
                    <p className="text-gray-400">
                        Administra las clases y áreas del gimnasio
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowBulkGenerator(true)}
                        className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold hover:opacity-90 transition-all"
                    >
                        <Zap className="w-5 h-5" />
                        <span className="hidden md:inline">Generador Masivo</span>
                    </button>
                    <button
                        onClick={handleOpenAreaModal}
                        className="flex items-center gap-2 px-4 py-3 rounded-lg bg-orange-500/20 text-orange-400 font-semibold hover:bg-orange-500/30 transition-all"
                    >
                        <Building2 className="w-5 h-5" />
                        <span className="hidden sm:inline">Área Libre</span>
                    </button>
                    <button
                        onClick={() => handleOpenClassModal()}
                        className="flex items-center gap-2 px-4 py-3 rounded-lg gradient-primary text-white font-semibold hover:opacity-90 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Nueva Clase
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('classes')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${activeTab === 'classes'
                        ? 'gradient-primary text-white'
                        : 'glass text-gray-400 hover:text-white'
                        }`}
                >
                    <Calendar className="w-5 h-5" />
                    Clases Programadas
                </button>
                <button
                    onClick={() => setActiveTab('areas')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${activeTab === 'areas'
                        ? 'gradient-primary text-white'
                        : 'glass text-gray-400 hover:text-white'
                        }`}
                >
                    <Building2 className="w-5 h-5" />
                    Áreas de Acceso Libre
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-blue-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">{classes.length}</p>
                            <p className="text-sm text-gray-400">Clases hoy</p>
                        </div>
                    </div>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-orange-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">{freeAccessDisciplines.length}</p>
                            <p className="text-sm text-gray-400">Áreas libres</p>
                        </div>
                    </div>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-green-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {classes.reduce((sum, c) => sum + c.enrolled, 0)}
                            </p>
                            <p className="text-sm text-gray-400">Reservas hoy</p>
                        </div>
                    </div>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <Clock className="w-8 h-8 text-purple-400" />
                        <div>
                            <p className="text-2xl font-bold text-white">{GYM_HOURS.openTime} - {GYM_HOURS.closeTime}</p>
                            <p className="text-sm text-gray-400">Horario del gym</p>
                        </div>
                    </div>
                </div>
            </div>

            {activeTab === 'classes' ? (
                <>
                    {/* Clases Programadas */}
                    {isLoading ? (
                        <div className="glass rounded-xl p-12 text-center">
                            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                            <p className="text-gray-400 mt-4">Cargando clases...</p>
                        </div>
                    ) : classes.length === 0 ? (
                        <div className="glass rounded-xl p-12 text-center">
                            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-400 text-lg">No hay clases programadas</p>
                            <p className="text-gray-500 text-sm mt-2">
                                Crea una nueva clase para comenzar
                            </p>
                            <button
                                onClick={() => handleOpenClassModal()}
                                className="mt-6 px-6 py-3 rounded-lg gradient-primary text-white font-semibold"
                            >
                                Crear primera clase
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {classes.map((classItem, index) => (
                                <div
                                    key={classItem.id}
                                    className="glass rounded-xl p-6 card-hover animate-slide-in-up"
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
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleOpenClassModal(classItem)}
                                                className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(classItem.id)}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-sm">
                                                {format(parseISO(classItem.startTime), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                                            </span>
                                        </div>

                                        {classItem.instructorName && (
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Users className="w-4 h-4" />
                                                <span className="text-sm">
                                                    Instructor: {classItem.instructorName}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-gray-400" />
                                            <span className={`text-sm font-semibold ${getSpotColor(classItem.availableSpots, classItem.capacity)}`}>
                                                {classItem.enrolled} / {classItem.capacity} inscriptos
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full gradient-primary rounded-full transition-all"
                                            style={{
                                                width: `${(classItem.enrolled / classItem.capacity) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* Áreas de Acceso Libre */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {freeAccessDisciplines.map((discipline, index) => (
                            <div
                                key={discipline.id}
                                className="glass rounded-xl p-6 card-hover animate-slide-in-up"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${discipline.color} flex items-center justify-center`}>
                                            <Building2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">
                                                {discipline.name}
                                            </h3>
                                            <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full">
                                                Acceso libre
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleOpenAreaModal}
                                        className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm">
                                            {GYM_HOURS.openTime} - {GYM_HOURS.closeTime}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Repeat className="w-4 h-4" />
                                        <span className="text-sm">Todos los días</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-green-400 font-semibold">
                                            Sin límite de cupo
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <p className="text-gray-500 text-xs">
                                        Los usuarios pueden acceder en cualquier momento dentro del horario del gimnasio sin necesidad de reserva.
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Add New Area Card */}
                        <button
                            onClick={handleOpenAreaModal}
                            className="glass rounded-xl p-6 border-2 border-dashed border-white/20 hover:border-orange-400/50 transition-all flex flex-col items-center justify-center gap-4 min-h-[200px]"
                        >
                            <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                <Plus className="w-6 h-6 text-orange-400" />
                            </div>
                            <p className="text-gray-400 font-medium">Agregar área libre</p>
                        </button>
                    </div>
                </>
            )}

            {/* Modal Nueva Clase */}
            {
                modalType === 'class' && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="glass rounded-2xl p-8 max-w-lg w-full animate-slide-in-up max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    {editingClass ? 'Editar Clase' : 'Nueva Clase Programada'}
                                </h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitClass} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Nombre de la clase
                                    </label>
                                    <input
                                        type="text"
                                        value={classFormData.name}
                                        onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ej: Yoga Matutino"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Disciplina
                                    </label>
                                    <select
                                        value={classFormData.disciplineId}
                                        onChange={(e) => setClassFormData({ ...classFormData, disciplineId: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Seleccionar disciplina</option>
                                        {programmedDisciplines.map((d) => (
                                            <option key={d.id} value={d.id} className="bg-gray-800">
                                                {d.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Instructor (opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={classFormData.instructorName}
                                        onChange={(e) => setClassFormData({ ...classFormData, instructorName: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nombre del instructor"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Hora de inicio
                                        </label>
                                        <input
                                            type="time"
                                            value={classFormData.time}
                                            onChange={(e) => setClassFormData({ ...classFormData, time: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Duración (min)
                                        </label>
                                        <select
                                            value={classFormData.duration}
                                            onChange={(e) => setClassFormData({ ...classFormData, duration: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value={30} className="bg-gray-800">30 min</option>
                                            <option value={45} className="bg-gray-800">45 min</option>
                                            <option value={60} className="bg-gray-800">1 hora</option>
                                            <option value={90} className="bg-gray-800">1.5 horas</option>
                                            <option value={120} className="bg-gray-800">2 horas</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Días de la semana
                                    </label>
                                    <div className="flex gap-2 flex-wrap">
                                        {DAYS_OF_WEEK.map((day) => (
                                            <button
                                                key={day.id}
                                                type="button"
                                                onClick={() => toggleDay(day.id)}
                                                className={`w-10 h-10 rounded-lg font-semibold transition-all ${classFormData.selectedDays.includes(day.id)
                                                    ? 'gradient-primary text-white'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                {day.short}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-gray-500 text-xs mt-2">
                                        La clase se repetirá cada semana en los días seleccionados
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Capacidad máxima
                                    </label>
                                    <input
                                        type="number"
                                        value={classFormData.capacity}
                                        onChange={(e) => setClassFormData({ ...classFormData, capacity: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        min="1"
                                        max="100"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 py-3 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-all font-semibold"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 rounded-lg gradient-primary text-white hover:opacity-90 transition-all font-semibold"
                                    >
                                        {editingClass ? 'Guardar cambios' : 'Crear clase'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Modal Área de Acceso Libre */}
            {
                modalType === 'area' && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="glass rounded-2xl p-8 max-w-lg w-full animate-slide-in-up">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    Configurar Área de Acceso Libre
                                </h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="glass rounded-lg p-4 mb-6 border border-orange-500/20">
                                <p className="text-orange-400 text-sm font-semibold mb-2">💡 ¿Qué es un área de acceso libre?</p>
                                <p className="text-gray-400 text-xs">
                                    Las áreas de acceso libre (como Musculación o Pesas) están disponibles durante todo el horario del gimnasio.
                                    Los usuarios NO necesitan reservar, solo presentan su QR o membresía al entrar.
                                </p>
                            </div>

                            <form onSubmit={handleSubmitArea} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Disciplina
                                    </label>
                                    <select
                                        value={areaFormData.disciplineId}
                                        onChange={(e) => setAreaFormData({ ...areaFormData, disciplineId: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Seleccionar disciplina</option>
                                        {freeAccessDisciplines.map((d) => (
                                            <option key={d.id} value={d.id} className="bg-gray-800">
                                                {d.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Hora apertura
                                        </label>
                                        <input
                                            type="time"
                                            value={areaFormData.openTime}
                                            onChange={(e) => setAreaFormData({ ...areaFormData, openTime: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Hora cierre
                                        </label>
                                        <input
                                            type="time"
                                            value={areaFormData.closeTime}
                                            onChange={(e) => setAreaFormData({ ...areaFormData, closeTime: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Capacidad máxima simultánea (opcional)
                                    </label>
                                    <input
                                        type="number"
                                        value={areaFormData.capacity}
                                        onChange={(e) => setAreaFormData({ ...areaFormData, capacity: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        min="1"
                                        max="500"
                                        placeholder="Dejar vacío para sin límite"
                                    />
                                    <p className="text-gray-500 text-xs mt-1">
                                        Número máximo de personas que pueden estar al mismo tiempo
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 py-3 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-all font-semibold"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90 transition-all font-semibold"
                                    >
                                        Guardar configuración
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Bulk Generator Modal */}
            {
                showBulkGenerator && (
                    <BulkGeneratorModal
                        disciplines={programmedDisciplines}
                        onClose={() => setShowBulkGenerator(false)}
                        onGenerate={() => {
                            fetchClasses();
                            setShowBulkGenerator(false);
                        }}
                    />
                )
            }
        </>
    );
}
