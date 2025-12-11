'use client';

import { useState } from 'react';
import { X, Zap, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface DaySchedule {
    dayId: number;
    dayName: string;
    enabled: boolean;
    startTime: string;
    endTime: string;
    interval: number; // minutos entre clases
}

interface BulkGeneratorModalProps {
    disciplines: Array<{ id: number; name: string }>;
    onClose: () => void;
    onGenerate: () => void;
}

const DAYS = [
    { id: 1, name: 'Lunes' },
    { id: 2, name: 'Martes' },
    { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' },
    { id: 5, name: 'Viernes' },
    { id: 6, name: 'Sábado' },
    { id: 0, name: 'Domingo' },
];

export default function BulkGeneratorModal({ disciplines, onClose, onGenerate }: BulkGeneratorModalProps) {
    const [loading, setLoading] = useState(false);

    // Calcular fechas por defecto: lunes de esta semana hasta domingo
    const getDefaultDates = () => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        return {
            start: monday.toISOString().split('T')[0],
            end: sunday.toISOString().split('T')[0]
        };
    };

    const defaultDates = getDefaultDates();
    const [startDate, setStartDate] = useState(defaultDates.start);
    const [endDate, setEndDate] = useState(defaultDates.end);

    // Calcular qué días de la semana están en el rango de fechas
    const getDaysInRange = (start: string, end: string): number[] => {
        const days = new Set<number>();
        const startD = new Date(start);
        const endD = new Date(end);
        endD.setHours(23, 59, 59);

        let current = new Date(startD);
        while (current <= endD) {
            days.add(current.getDay());
            current.setDate(current.getDate() + 1);
        }
        return Array.from(days);
    };

    const daysInRange = getDaysInRange(startDate, endDate);

    const [formData, setFormData] = useState({
        name: '',
        disciplineId: '',
        instructorName: '',
        capacity: 20,
        duration: 60,
    });

    const [schedules, setSchedules] = useState<DaySchedule[]>(
        DAYS.map(day => ({
            dayId: day.id,
            dayName: day.name,
            enabled: [1, 2, 3, 4, 5, 6].includes(day.id), // Lunes a Sábado por defecto
            startTime: '08:00',
            endTime: '22:00',
            interval: 60, // 1 hora
        }))
    );

    // Auto-actualizar días habilitados cuando cambia el rango
    const updateDaysFromRange = (start: string, end: string) => {
        const days = getDaysInRange(start, end);
        setSchedules(prev => prev.map(s => ({
            ...s,
            enabled: days.includes(s.dayId)
        })));
    };

    const handleStartDateChange = (value: string) => {
        setStartDate(value);
        updateDaysFromRange(value, endDate);
    };

    const handleEndDateChange = (value: string) => {
        setEndDate(value);
        updateDaysFromRange(startDate, value);
    };

    const toggleDay = (dayId: number) => {
        // Solo permitir toggle si el día está en el rango
        if (!daysInRange.includes(dayId)) return;
        setSchedules(schedules.map(s =>
            s.dayId === dayId ? { ...s, enabled: !s.enabled } : s
        ));
    };

    const updateSchedule = (dayId: number, field: keyof DaySchedule, value: any) => {
        setSchedules(schedules.map(s =>
            s.dayId === dayId ? { ...s, [field]: value } : s
        ));
    };

    const applyToAll = () => {
        const firstEnabled = schedules.find(s => s.enabled);
        if (!firstEnabled) return;

        setSchedules(schedules.map(s =>
            s.enabled ? {
                ...s,
                startTime: firstEnabled.startTime,
                endTime: firstEnabled.endTime,
                interval: firstEnabled.interval,
            } : s
        ));
        toast.success('Horarios aplicados a todos los días');
    };

    const calculateTotal = () => {
        return schedules.reduce((total, schedule) => {
            if (!schedule.enabled) return total;

            const start = parseInt(schedule.startTime.split(':')[0]);
            const end = parseInt(schedule.endTime.split(':')[0]);
            const hours = end - start;
            const classesPerDay = Math.floor((hours * 60) / schedule.interval);

            return total + classesPerDay;
        }, 0);
    };

    const handleGenerate = async () => {
        if (!formData.name || !formData.disciplineId) {
            toast.error('Completa el nombre y la disciplina');
            return;
        }

        const enabledSchedules = schedules.filter(s => s.enabled);
        if (enabledSchedules.length === 0) {
            toast.error('Selecciona al menos un día');
            return;
        }

        setLoading(true);
        try {
            const classes = [];

            for (const schedule of enabledSchedules) {
                const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
                const [endHour, endMinute] = schedule.endTime.split(':').map(Number);

                const startMinutes = startHour * 60 + startMinute;
                const endMinutes = endHour * 60 + endMinute;

                for (let currentMinutes = startMinutes; currentMinutes < endMinutes; currentMinutes += schedule.interval) {
                    const hour = Math.floor(currentMinutes / 60);
                    const minute = currentMinutes % 60;

                    classes.push({
                        name: formData.name,
                        disciplineId: parseInt(formData.disciplineId),
                        instructorName: formData.instructorName || null,
                        time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
                        duration: formData.duration,
                        capacity: formData.capacity,
                        dayOfWeek: schedule.dayId,
                    });
                }
            }

            const response = await fetch('/api/classes/bulk', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classes, startDate, endDate }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || 'Error al generar clases');
                return;
            }

            toast.success(`${data.created} clases creadas exitosamente`);
            onGenerate();
            onClose();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al generar clases');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="glass rounded-2xl p-6 max-w-4xl w-full animate-slide-in-up max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Generador Masivo de Clases</h2>
                            <p className="text-gray-400 text-sm">Crea múltiples clases a la vez</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Configuración general */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white mb-4">📝 Configuración General</h3>

                        {/* Selector de fechas */}
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                            <label className="block text-sm font-medium text-orange-400 mb-3">📅 Rango de fechas</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Desde</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => handleStartDateChange(e.target.value)}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Hasta</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => handleEndDateChange(e.target.value)}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Se crearán clases para cada día habilitado dentro de este rango
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Nombre de la clase</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Ej: CrossFit WOD"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Disciplina</label>
                            <select
                                value={formData.disciplineId}
                                onChange={(e) => setFormData({ ...formData, disciplineId: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="">Seleccionar...</option>
                                {disciplines.map((d) => (
                                    <option key={d.id} value={d.id} className="bg-gray-800">{d.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Instructor (opcional)</label>
                            <input
                                type="text"
                                value={formData.instructorName}
                                onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Nombre del instructor"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Duración</label>
                                <select
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                    <option value={30} className="bg-gray-800">30 min</option>
                                    <option value={45} className="bg-gray-800">45 min</option>
                                    <option value={60} className="bg-gray-800">1 hora</option>
                                    <option value={90} className="bg-gray-800">1.5 horas</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Capacidad</label>
                                <input
                                    type="number"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    min="1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Horarios por día */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">🗓️ Horarios por Día</h3>
                            <button
                                onClick={applyToAll}
                                className="text-xs px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                            >
                                Aplicar a todos
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {schedules.map((schedule) => {
                                const isInRange = daysInRange.includes(schedule.dayId);

                                return (
                                    <div
                                        key={schedule.dayId}
                                        className={`p-3 rounded-lg border-2 transition-all ${!isInRange
                                            ? 'border-gray-700 bg-gray-800/50 opacity-40'
                                            : schedule.enabled
                                                ? 'border-orange-500/30 bg-orange-500/5'
                                                : 'border-white/10 bg-white/5 opacity-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <label className={`flex items-center gap-2 ${isInRange ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={schedule.enabled && isInRange}
                                                    onChange={() => toggleDay(schedule.dayId)}
                                                    disabled={!isInRange}
                                                    className="w-4 h-4 rounded accent-orange-500 disabled:opacity-30"
                                                />
                                                <span className={`font-medium ${isInRange ? 'text-white' : 'text-gray-500'}`}>
                                                    {schedule.dayName}
                                                    {!isInRange && <span className="text-xs ml-2 text-gray-600">(fuera del rango)</span>}
                                                </span>
                                            </label>
                                        </div>

                                        {schedule.enabled && (
                                            <div className="grid grid-cols-3 gap-2 mt-2">
                                                <input
                                                    type="time"
                                                    value={schedule.startTime}
                                                    onChange={(e) => updateSchedule(schedule.dayId, 'startTime', e.target.value)}
                                                    className="px-2 py-1 text-sm bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                                                />
                                                <input
                                                    type="time"
                                                    value={schedule.endTime}
                                                    onChange={(e) => updateSchedule(schedule.dayId, 'endTime', e.target.value)}
                                                    className="px-2 py-1 text-sm bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                                                />
                                                <select
                                                    value={schedule.interval}
                                                    onChange={(e) => updateSchedule(schedule.dayId, 'interval', parseInt(e.target.value))}
                                                    className="px-2 py-1 text-sm bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                                                >
                                                    <option value={30} className="bg-gray-800">30min</option>
                                                    <option value={60} className="bg-gray-800">1h</option>
                                                    <option value={90} className="bg-gray-800">1.5h</option>
                                                    <option value={120} className="bg-gray-800">2h</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Resumen y botones */}
                <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                            Se crearán <span className="text-orange-400 font-bold text-lg">{calculateTotal()}</span> clases en total
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-all font-semibold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:opacity-90 transition-all font-semibold flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Generando...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-5 h-5" />
                                        Generar {calculateTotal()} Clases
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
