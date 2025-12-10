'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Calendar, CheckCircle, X, Clock, Dumbbell, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Reservation {
    id: number;
    className: string;
    disciplineName: string;
    startTime: string;
    status: 'ACTIVE' | 'ATTENDED' | 'CANCELLED' | 'NO_SHOW';
    createdAt: string;
}

interface Attendance {
    id: number;
    disciplineName: string;
    type: string;
    checkInTime: string;
}

export default function HistoryPage() {

    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [activeTab, setActiveTab] = useState<'reservations' | 'attendances'>('reservations');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const resRes = await fetch('/api/my-reservations', {
                credentials: 'include',
            });

            const attRes = await fetch('/api/my-attendances', {
                credentials: 'include',
            });

            if (resRes.ok) {
                const resData = await resRes.json();
                setReservations(resData.reservations || []);
            }

            if (attRes.ok) {
                const attData = await attRes.json();
                setAttendances(attData.attendances || []);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
            toast.error('Error al cargar el historial');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelReservation = async (reservationId: number) => {
        if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;

        try {
            const response = await fetch(`/api/classes/cancel/${reservationId}`, {
                method: 'POST',
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al cancelar');
            }

            if (data.status === 'warning') {
                toast.error(data.message, { duration: 5000 });
            } else {
                toast.success(data.message);
            }

            fetchHistory();
        } catch (error: any) {
            console.error('Error cancelling reservation:', error);
            toast.error(error.message || 'Error al cancelar la reserva');
        }
    };

    const canCancel = (startTime: string) => {
        const now = new Date();
        const classStart = new Date(startTime);
        const hoursUntil = (classStart.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursUntil >= 3;
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            ACTIVE: { text: 'Activa', class: 'bg-blue-500/20 text-blue-400' },
            ATTENDED: { text: 'Asistida', class: 'bg-green-500/20 text-green-400' },
            CANCELLED: { text: 'Cancelada', class: 'bg-red-500/20 text-red-400' },
            NO_SHOW: { text: 'No asistió', class: 'bg-yellow-500/20 text-yellow-400' },
        };
        const badge = badges[status as keyof typeof badges] || badges.ACTIVE;
        return <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.class}`}>{badge.text}</span>;
    };

    const getTypeIcon = (type: string) => {
        return type === 'reservation' ? (
            <Calendar className="w-4 h-4 text-blue-400" />
        ) : (
            <Clock className="w-4 h-4 text-green-400" />
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
            <Navbar activeTab="historial" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 animate-slide-in-up">
                    <h1 className="text-3xl font-bold text-white mb-2">Historial 📊</h1>
                    <p className="text-gray-400">Revisa tus reservas y asistencias</p>
                </div>

                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('reservations')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'reservations' ? 'gradient-primary text-white' : 'glass text-gray-400 hover:text-white'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Reservas ({reservations.length})
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('attendances')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'attendances' ? 'gradient-primary text-white' : 'glass text-gray-400 hover:text-white'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Asistencias ({attendances.length})
                        </div>
                    </button>
                </div>

                {isLoading ? (
                    <div className="glass rounded-xl p-12 text-center animate-pulse">
                        <div className="h-6 bg-white/10 rounded w-1/2 mx-auto mb-4"></div>
                        <div className="h-4 bg-white/10 rounded w-1/3 mx-auto"></div>
                    </div>
                ) : activeTab === 'reservations' ? (
                    <div className="space-y-4">
                        {reservations.length === 0 ? (
                            <div className="glass rounded-xl p-12 text-center">
                                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-400 text-lg">No tienes reservas</p>
                                <p className="text-gray-500 text-sm mt-2">Ve a la sección de Clases para reservar</p>
                            </div>
                        ) : (
                            reservations.map((reservation, index) => (
                                <div key={reservation.id} className="glass rounded-xl p-6 card-hover animate-slide-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                                                <Dumbbell className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="text-lg font-bold text-white mb-1">{reservation.className}</h3>
                                                        <p className="text-sm text-blue-400">{reservation.disciplineName}</p>
                                                    </div>
                                                    {getStatusBadge(reservation.status)}
                                                </div>
                                                <div className="space-y-2 mt-4">
                                                    <div className="flex items-center gap-2 text-gray-400">
                                                        <Clock className="w-4 h-4" />
                                                        <span className="text-sm">
                                                            {format(parseISO(reservation.startTime), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-400">
                                                        <Calendar className="w-4 h-4" />
                                                        <span className="text-sm">Reservado el {format(parseISO(reservation.createdAt), "d 'de' MMMM", { locale: es })}</span>
                                                    </div>
                                                </div>
                                                {reservation.status === 'ACTIVE' && (
                                                    <div className="mt-4">
                                                        {canCancel(reservation.startTime) ? (
                                                            <button
                                                                onClick={() => handleCancelReservation(reservation.id)}
                                                                className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all font-semibold flex items-center gap-2"
                                                            >
                                                                <X className="w-4 h-4" />
                                                                Cancelar reserva
                                                            </button>
                                                        ) : (
                                                            <p className="text-xs text-yellow-400">
                                                                ⚠️ No puedes cancelar (menos de 3 horas para la clase)
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {attendances.length === 0 ? (
                            <div className="glass rounded-xl p-12 text-center">
                                <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-400 text-lg">No tienes asistencias registradas</p>
                                <p className="text-gray-500 text-sm mt-2">Tus check-ins aparecerán aquí</p>
                            </div>
                        ) : (
                            attendances.map((attendance, index) => (
                                <div key={attendance.id} className="glass rounded-xl p-6 card-hover animate-slide-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle className="w-6 h-6 text-green-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-white mb-1">{attendance.disciplineName}</h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                                <div className="flex items-center gap-2">
                                                    {getTypeIcon(attendance.type)}
                                                    <span className="capitalize">{attendance.type === 'reservation' ? 'Con reserva' : 'Acceso directo'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{format(parseISO(attendance.checkInTime), "d 'de' MMMM, HH:mm", { locale: es })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {!isLoading && (reservations.length > 0 || attendances.length > 0) && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass rounded-xl p-6">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-8 h-8 text-blue-400" />
                                <div>
                                    <p className="text-2xl font-bold text-white">{reservations.length}</p>
                                    <p className="text-sm text-gray-400">Reservas totales</p>
                                </div>
                            </div>
                        </div>
                        <div className="glass rounded-xl p-6">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-8 h-8 text-green-400" />
                                <div>
                                    <p className="text-2xl font-bold text-white">{attendances.length}</p>
                                    <p className="text-sm text-gray-400">Asistencias</p>
                                </div>
                            </div>
                        </div>
                        <div className="glass rounded-xl p-6">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-8 h-8 text-purple-400" />
                                <div>
                                    <p className="text-2xl font-bold text-white">
                                        {attendances.length > 0 ? Math.round((attendances.length / Math.max(reservations.length, 1)) * 100) : 0}%
                                    </p>
                                    <p className="text-sm text-gray-400">Tasa de asistencia</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
