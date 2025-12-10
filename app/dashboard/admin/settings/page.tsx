'use client';

import {
    Settings,
    Save,
    Clock,
    Building2,
    Bell,
    Shield,
    Palette,
    Calendar,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
    const [gymName, setGymName] = useState('Mi Gimnasio');
    const [openTime, setOpenTime] = useState('06:00');
    const [closeTime, setCloseTime] = useState('22:00');
    const [cancellationHours, setCancellationHours] = useState(3);
    const [reservationWindowMinutes, setReservationWindowMinutes] = useState(30);
    const [maxReservationsPerDay, setMaxReservationsPerDay] = useState(3);
    const [requireQRForCheckIn, setRequireQRForCheckIn] = useState(true);
    const [sendEmailReminders, setSendEmailReminders] = useState(true);
    const [primaryColor, setPrimaryColor] = useState('#3B82F6');

    const handleSave = () => {
        toast.success('Configuración guardada');
    };

    return (
        <>
            <div className="mb-8 animate-slide-in-up">
                <h1 className="text-3xl font-bold text-white mb-2">
                    Configuración ⚙️
                </h1>
                <p className="text-gray-400">
                    Ajustes generales del sistema
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General */}
                <div className="glass rounded-xl p-6 animate-slide-in-up" style={{ animationDelay: '0ms' }}>
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-400" />
                        </div>
                        Información General
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Nombre del gimnasio
                            </label>
                            <input
                                type="text"
                                value={gymName}
                                onChange={(e) => setGymName(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Color principal
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="w-12 h-12 rounded-lg border-0 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Horario */}
                <div className="glass rounded-xl p-6 animate-slide-in-up" style={{ animationDelay: '50ms' }}>
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-purple-400" />
                        </div>
                        Horario del Gimnasio
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Hora de apertura
                            </label>
                            <input
                                type="time"
                                value={openTime}
                                onChange={(e) => setOpenTime(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Hora de cierre
                            </label>
                            <input
                                type="time"
                                value={closeTime}
                                onChange={(e) => setCloseTime(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="mt-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <p className="text-purple-400 text-sm">
                            <strong>Horario actual:</strong> {openTime} - {closeTime}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                            Este horario se usa para las áreas de acceso libre
                        </p>
                    </div>
                </div>

                {/* Reservaciones */}
                <div className="glass rounded-xl p-6 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-green-400" />
                        </div>
                        Reservaciones
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Horas mínimas para cancelar sin penalización
                            </label>
                            <input
                                type="number"
                                value={cancellationHours}
                                onChange={(e) => setCancellationHours(parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="1"
                                max="24"
                            />
                            <p className="text-gray-500 text-xs mt-1">
                                Si cancela con menos tiempo, pierde el crédito
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Ventana de check-in (minutos)
                            </label>
                            <input
                                type="number"
                                value={reservationWindowMinutes}
                                onChange={(e) => setReservationWindowMinutes(parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="10"
                                max="60"
                            />
                            <p className="text-gray-500 text-xs mt-1">
                                Tiempo antes/después del inicio para hacer check-in
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Máximo de reservas por día por usuario
                            </label>
                            <input
                                type="number"
                                value={maxReservationsPerDay}
                                onChange={(e) => setMaxReservationsPerDay(parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="1"
                                max="10"
                            />
                        </div>
                    </div>
                </div>

                {/* Seguridad */}
                <div className="glass rounded-xl p-6 animate-slide-in-up" style={{ animationDelay: '150ms' }}>
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-orange-400" />
                        </div>
                        Seguridad y Acceso
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                            <div>
                                <p className="text-white font-medium">Requerir QR para check-in</p>
                                <p className="text-gray-500 text-xs">Solo permite acceso con QR dinámico</p>
                            </div>
                            <button
                                onClick={() => setRequireQRForCheckIn(!requireQRForCheckIn)}
                                className={`relative w-14 h-7 rounded-full transition-colors ${requireQRForCheckIn ? 'bg-green-500' : 'bg-gray-600'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${requireQRForCheckIn ? 'left-8' : 'left-1'
                                        }`}
                                />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                            <div>
                                <p className="text-white font-medium">Recordatorios por email</p>
                                <p className="text-gray-500 text-xs">Enviar recordatorio antes de cada clase</p>
                            </div>
                            <button
                                onClick={() => setSendEmailReminders(!sendEmailReminders)}
                                className={`relative w-14 h-7 rounded-full transition-colors ${sendEmailReminders ? 'bg-green-500' : 'bg-gray-600'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${sendEmailReminders ? 'left-8' : 'left-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    className="px-8 py-4 rounded-lg gradient-primary text-white font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                    <Save className="w-5 h-5" />
                    Guardar Configuración
                </button>
            </div>
        </>
    );
}
