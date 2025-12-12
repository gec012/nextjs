'use client';

import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    X,
    Users,
    CheckCircle,
    Clock,
    Loader2,
    UserCheck,
    UserX,
    MailOpen,
    Calendar
} from 'lucide-react';

interface Attendee {
    id: number;
    userId: number;
    userName: string;
    userEmail: string;
    attended: boolean;
    reservedAt: string;
}

interface ClassDetails {
    id: number;
    name: string;
    disciplineName: string;
    startTime: string;
    endTime: string;
    capacity: number;
    enrolled: number;
    reservations: Attendee[];
}

interface AttendeesModalProps {
    classId: number;
    className: string;
    onClose: () => void;
}

export default function AttendeesModal({ classId, className, onClose }: AttendeesModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchClassDetails();
    }, [classId]);

    const fetchClassDetails = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(`/api/classes/${classId}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Error al cargar los detalles de la clase');
            }

            const data = await response.json();
            setClassDetails(data.class);
        } catch (err) {
            console.error('Error fetching class details:', err);
            setError('No se pudieron cargar los asistentes');
        } finally {
            setIsLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const attendedCount = classDetails?.reservations.filter(r => r.attended).length || 0;
    const pendingCount = classDetails?.reservations.filter(r => !r.attended).length || 0;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="glass rounded-2xl p-6 max-w-2xl w-full animate-slide-in-up max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Users className="w-6 h-6 text-green-400" />
                            Asistentes
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                            {className}
                            {classDetails && (
                                <span className="ml-2 text-blue-400">
                                    • {format(parseISO(classDetails.startTime), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                                </span>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Stats Cards */}
                {classDetails && !isLoading && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-blue-400">{classDetails.enrolled}</div>
                            <div className="text-xs text-gray-400 mt-1">Reservas</div>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-green-400">{attendedCount}</div>
                            <div className="text-xs text-gray-400 mt-1">Asistieron</div>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-400">{pendingCount}</div>
                            <div className="text-xs text-gray-400 mt-1">Pendientes</div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                            <p className="text-gray-400 mt-4">Cargando asistentes...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <X className="w-12 h-12 text-red-400" />
                            <p className="text-gray-400 mt-4">{error}</p>
                            <button
                                onClick={fetchClassDetails}
                                className="mt-4 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : classDetails?.reservations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Users className="w-12 h-12 text-gray-500" />
                            <p className="text-gray-400 mt-4">No hay reservas para esta clase</p>
                            <p className="text-gray-500 text-sm mt-2">
                                Los usuarios aún no han reservado
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {classDetails?.reservations.map((attendee) => (
                                <div
                                    key={attendee.id}
                                    className={`flex items-center justify-between p-4 rounded-xl transition-all ${attendee.attended
                                            ? 'bg-green-500/10 border border-green-500/20'
                                            : 'bg-white/5 border border-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${attendee.attended
                                                ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                                                : 'bg-gradient-to-br from-gray-500 to-gray-600 text-white'
                                            }`}>
                                            {getInitials(attendee.userName)}
                                        </div>

                                        {/* Info */}
                                        <div>
                                            <p className="font-semibold text-white">{attendee.userName}</p>
                                            <p className="text-sm text-gray-400 flex items-center gap-1">
                                                <MailOpen className="w-3 h-3" />
                                                {attendee.userEmail}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Reservó</p>
                                            <p className="text-sm text-gray-400">
                                                {format(parseISO(attendee.reservedAt), "d MMM, HH:mm", { locale: es })}
                                            </p>
                                        </div>
                                        {attendee.attended ? (
                                            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg">
                                                <UserCheck className="w-4 h-4" />
                                                <span className="text-sm font-medium">Asistió</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-sm font-medium">Pendiente</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                        {classDetails && (
                            <>
                                Capacidad: {classDetails.enrolled} / {classDetails.capacity}
                            </>
                        )}
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
