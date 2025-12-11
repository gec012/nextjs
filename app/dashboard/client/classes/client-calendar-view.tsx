'use client';

import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Users, CheckCircle } from 'lucide-react';

interface Class {
    id: number;
    name: string;
    disciplineName: string;
    instructorName: string | null;
    startTime: string;
    endTime: string;
    capacity: number;
    enrolled?: number;
    availableSpots: number;
    isFull: boolean;
    isReserved: boolean;
    reservationId?: number | null;
}

interface ClientCalendarViewProps {
    classes: Class[];
    onReserve: (classItem: Class) => void;
}

const DAYS_OF_WEEK = [
    { id: 1, name: 'Lunes' },
    { id: 2, name: 'Martes' },
    { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' },
    { id: 5, name: 'Viernes' },
    { id: 6, name: 'Sábado' },
    { id: 0, name: 'Domingo' },
];

const TIME_SLOTS = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00'
];

export default function ClientCalendarView({ classes, onReserve }: ClientCalendarViewProps) {
    // Calcular fechas de la semana actual
    const getWeekDates = () => {
        const today = new Date();
        const currentDay = today.getDay();
        const monday = new Date(today);

        // Ajustar al lunes de esta semana
        const diff = currentDay === 0 ? -6 : 1 - currentDay;
        monday.setDate(today.getDate() + diff);

        return DAYS_OF_WEEK.map(day => {
            const date = new Date(monday);
            const daysToAdd = day.id === 0 ? 6 : day.id - 1; // Domingo es 0, pero va al final
            date.setDate(monday.getDate() + daysToAdd);
            return {
                ...day,
                date: date,
                dateStr: format(date, 'd/MM')
            };
        });
    };

    const weekDates = getWeekDates();

    // Agrupar clases por día de la semana y hora
    const classesByDayAndTime = classes.reduce((acc, classItem) => {
        const date = parseISO(classItem.startTime);
        const dayOfWeek = date.getDay();
        const time = format(date, 'HH:mm');

        const key = `${dayOfWeek}-${time}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(classItem);
        return acc;
    }, {} as Record<string, Class[]>);

    const getSpotColor = (availableSpots: number, capacity: number, isFull: boolean, isReserved: boolean) => {
        if (isReserved) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        if (isFull) return 'bg-gray-500/20 text-gray-400 border-gray-500/30';

        const percentage = (availableSpots / capacity) * 100;
        if (percentage > 50) return 'bg-green-500/20 text-green-400 border-green-500/30';
        if (percentage > 20) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    };

    return (
        <div className="glass rounded-xl overflow-hidden">
            {/* Hint de scroll */}
            <div className="bg-blue-500/10 border-l-4 border-blue-500 px-4 py-2 text-sm text-blue-300 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
                <span>Desliza horizontalmente para ver todos los días de la semana →</span>
            </div>

            {/* Vista de calendario tipo grid */}
            <div className="overflow-x-auto scrollbar-custom">
                <style jsx>{`
                    .scrollbar-custom::-webkit-scrollbar {
                        height: 12px;
                    }
                    .scrollbar-custom::-webkit-scrollbar-track {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 6px;
                    }
                    .scrollbar-custom::-webkit-scrollbar-thumb {
                        background: linear-gradient(to right, #3b82f6, #60a5fa);
                        border-radius: 6px;
                    }
                    .scrollbar-custom::-webkit-scrollbar-thumb:hover {
                        background: linear-gradient(to right, #2563eb, #3b82f6);
                    }
                `}</style>
                <table className="w-full min-w-[1600px]">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="sticky left-0 z-10 bg-gray-900/95 backdrop-blur-sm px-4 py-3 text-left text-sm font-semibold text-gray-400">
                                Hora
                            </th>
                            {weekDates.map((day) => {
                                const isToday = format(day.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                                return (
                                    <th
                                        key={day.id}
                                        className={`px-4 py-3 text-center text-sm font-semibold min-w-[180px] ${isToday ? 'text-blue-400' : 'text-white'
                                            }`}
                                    >
                                        <div>{day.name}</div>
                                        <div className={`text-xs mt-1 ${isToday ? 'text-blue-300' : 'text-gray-400'}`}>
                                            {day.dateStr}
                                            {isToday && ' (Hoy)'}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {TIME_SLOTS.map((time) => (
                            <tr key={time} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="sticky left-0 z-10 bg-gray-900/95 backdrop-blur-sm px-4 py-3 text-sm text-gray-400 font-medium">
                                    {time}
                                </td>
                                {DAYS_OF_WEEK.map((day) => {
                                    const key = `${day.id}-${time}`;
                                    const dayClasses = classesByDayAndTime[key] || [];

                                    return (
                                        <td key={`${day.id}-${time}`} className="px-2 py-2 align-top min-w-[180px]">
                                            <div className="space-y-2">
                                                {dayClasses.map((classItem) => {
                                                    // Usar Date directamente para evitar problemas de timezone con parseISO
                                                    const startDate = new Date(classItem.startTime);
                                                    const endDate = new Date(classItem.endTime);
                                                    const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
                                                    const now = new Date();
                                                    const isPast = startDate.getTime() < now.getTime();

                                                    return (
                                                        <div
                                                            key={classItem.id}
                                                            className={`relative group p-3 rounded-lg border-2 transition-all ${isPast ? 'opacity-50' : 'hover:scale-105 cursor-pointer'
                                                                } ${getSpotColor(
                                                                    classItem.availableSpots,
                                                                    classItem.capacity,
                                                                    classItem.isFull,
                                                                    classItem.isReserved
                                                                )}`}
                                                            style={{
                                                                minHeight: `${Math.max(duration / 15, 4)}rem`,
                                                            }}
                                                        >
                                                            {/* Badge de estado */}
                                                            {isPast && (
                                                                <div className="absolute top-1 right-1 px-2 py-0.5 rounded bg-gray-500 text-white text-xs font-bold">
                                                                    Pasada
                                                                </div>
                                                            )}
                                                            {!isPast && classItem.isReserved && (
                                                                <div className="absolute top-1 right-1 px-2 py-0.5 rounded bg-blue-500 text-white text-xs font-bold flex items-center gap-1">
                                                                    <CheckCircle className="w-3 h-3" />
                                                                    <span>Reservado</span>
                                                                </div>
                                                            )}

                                                            {/* Título y disciplina */}
                                                            <div className="mb-2">
                                                                <h4 className="font-bold text-sm line-clamp-1">
                                                                    {classItem.name}
                                                                </h4>
                                                                <p className="text-xs opacity-80">
                                                                    {classItem.disciplineName}
                                                                </p>
                                                            </div>

                                                            {/* Horario */}
                                                            <div className="flex items-center gap-1 text-xs mb-1 opacity-75">
                                                                <Clock className="w-3 h-3" />
                                                                <span>
                                                                    {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                                                                </span>
                                                            </div>

                                                            {/* Capacidad */}
                                                            <div className="flex items-center gap-1 text-xs font-semibold mb-2">
                                                                <Users className="w-3 h-3" />
                                                                <span>
                                                                    {classItem.isFull
                                                                        ? 'Completo'
                                                                        : `${classItem.availableSpots} cupo${classItem.availableSpots !== 1 ? 's' : ''}`
                                                                    }
                                                                </span>
                                                            </div>

                                                            {/* Botón reservar */}
                                                            {!classItem.isReserved && !classItem.isFull && !isPast && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onReserve(classItem);
                                                                    }}
                                                                    className="w-full py-1.5 px-2 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition-all"
                                                                >
                                                                    Reservar
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Leyenda */}
            <div className="border-t border-white/10 p-4 bg-gray-900/50">
                <div className="flex items-center gap-6 text-xs flex-wrap">
                    <span className="text-gray-400 font-semibold">Estado:</span>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-blue-500/20 border-2 border-blue-500/30"></div>
                        <span className="text-gray-400">Ya reservado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-green-500/20 border-2 border-green-500/30"></div>
                        <span className="text-gray-400">Muchos cupos</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-yellow-500/20 border-2 border-yellow-500/30"></div>
                        <span className="text-gray-400">Pocos cupos</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-red-500/20 border-2 border-red-500/30"></div>
                        <span className="text-gray-400">Muy pocos cupos</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-gray-500/20 border-2 border-gray-500/30"></div>
                        <span className="text-gray-400">Completo</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
