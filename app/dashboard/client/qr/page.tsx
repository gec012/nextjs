'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/lib/stores/auth.store';
import Navbar from '@/components/Navbar';
import { QrCode, RefreshCw, Clock, Shield, AlertCircle } from 'lucide-react';
import QRCodeLib from 'qrcode';
import toast from 'react-hot-toast';

export default function QRPage() {
    const user = useUser();

    const [qrCode, setQrCode] = useState<string>('');
    const [qrData, setQrData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);

    useEffect(() => {
        generateQR();
    }, []);

    useEffect(() => {
        if (!qrData) return;

        const interval = setInterval(() => {
            const expiresAt = new Date(qrData.expiresAt).getTime();
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));

            setTimeRemaining(remaining);

            if (remaining === 0) {
                toast.error('QR expirado. Genera uno nuevo.');
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [qrData]);

    const generateQR = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/qr/generate', {
                method: 'POST',
                credentials: 'include', // Cookie se envía automáticamente
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al generar QR');
            }

            const data = await response.json();
            setQrData(data);

            // Generar imagen QR
            const qrImage = await QRCodeLib.toDataURL(data.code, {
                width: 400,
                margin: 2,
                color: {
                    dark: '#1e40af',
                    light: '#ffffff',
                },
            });

            setQrCode(qrImage);
            toast.success('QR generado exitosamente');
        } catch (error) {
            console.error('Error generating QR:', error);
            toast.error('Error al generar el código QR');
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const isExpired = timeRemaining === 0;
    const isExpiringSoon = timeRemaining > 0 && timeRemaining <= 60;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
            <Navbar activeTab="mi qr" />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 animate-slide-in-up">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Mi Código QR 📱
                    </h1>
                    <p className="text-gray-400">
                        Muestra este código en recepción para hacer check-in
                    </p>
                </div>

                {/* QR Card */}
                <div className="glass rounded-2xl p-8 animate-slide-in-up">
                    {/* User Info */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">{user?.name}</h2>
                        <p className="text-gray-400">{user?.email}</p>
                    </div>

                    {/* QR Code */}
                    {qrCode && !isExpired ? (
                        <div className="relative">
                            <div className="bg-white rounded-2xl p-8 mb-6">
                                <img
                                    src={qrCode}
                                    alt="QR Code"
                                    className="w-full max-w-sm mx-auto"
                                />
                            </div>

                            {/* Timer */}
                            <div className={`text-center mb-6 ${isExpiringSoon ? 'animate-pulse' : ''}`}>
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Clock className={`w-5 h-5 ${isExpiringSoon ? 'text-red-400' : 'text-blue-400'}`} />
                                    <span className={`text-lg font-semibold ${isExpiringSoon ? 'text-red-400' : 'text-white'}`}>
                                        Expira en: {formatTime(timeRemaining)}
                                    </span>
                                </div>
                                {isExpiringSoon && (
                                    <p className="text-sm text-yellow-400">
                                        ⚠️ El código expirará pronto
                                    </p>
                                )}
                            </div>

                            {/* QR Code Info */}
                            <div className="glass rounded-lg p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                                    <div>
                                        <p className="text-white font-semibold mb-1">Código seguro y temporal</p>
                                        <p className="text-gray-400 text-sm">
                                            Este código QR es único y caduca automáticamente después de 30 minutos por seguridad.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Refresh Button */}
                            <button
                                onClick={generateQR}
                                disabled={isLoading}
                                className="w-full py-4 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all font-semibold flex items-center justify-center gap-2"
                            >
                                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                                Generar nuevo código
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-10 h-10 text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Código expirado</h3>
                            <p className="text-gray-400 mb-6">
                                Tu código QR ha expirado. Genera uno nuevo para continuar.
                            </p>
                            <button
                                onClick={generateQR}
                                disabled={isLoading}
                                className="px-8 py-3 rounded-lg gradient-primary text-white font-semibold hover:opacity-90 transition-all inline-flex items-center gap-2"
                            >
                                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                                {isLoading ? 'Generando...' : 'Generar código QR'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="mt-6 glass rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">📋 Instrucciones</h3>
                    <ul className="space-y-3 text-gray-400">
                        <li className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-semibold flex-shrink-0">1</span>
                            <span>Genera tu código QR haciendo clic en el botón.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-semibold flex-shrink-0">2</span>
                            <span>Muestra el código al personal de recepción para hacer check-in.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-semibold flex-shrink-0">3</span>
                            <span>El código expira en 30 minutos. Si caduca, genera uno nuevo.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-semibold flex-shrink-0">4</span>
                            <span>Asegúrate de tener una membresía activa antes de hacer check-in.</span>
                        </li>
                    </ul>
                </div>
            </main>
        </div>
    );
}
