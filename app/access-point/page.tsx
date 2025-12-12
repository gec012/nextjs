'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth.store';
import {
    QrCode,
    Search,
    UserCheck,
    XCircle,
    Loader2,
    Delete,
    ArrowRight,
    CheckCircle,
    AlertCircle,
    Power,
    HelpCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ScanResult {
    status: 'success' | 'error' | 'selection_required';
    message: string;
    data?: {
        discipline: string;
        remaining_credits: number;
        photo_url: string | null;
        type: string;
    };
    options?: {
        id: number;
        name: string;
        type: string;
        detail?: string;
        remaining?: number;
    }[];
}

export default function AccessPointPage() {
    const router = useRouter();
    const logout = useAuthStore((state) => state.logout);
    const inputRef = useRef<HTMLInputElement>(null);
    const [dni, setDni] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastResult, setLastResult] = useState<ScanResult | null>(null);
    const [kioskQr, setKioskQr] = useState('');

    // QR Rotativo Generator
    useEffect(() => {
        const QRCodeLib = require('qrcode');
        let interval: NodeJS.Timeout;

        const generateKioskQr = async () => {
            const ts = Date.now();
            const code = `GYM_ACCESS_POINT_${ts}`;
            try {
                const url = await QRCodeLib.toDataURL(code, {
                    width: 300,
                    margin: 2,
                    color: { dark: '#3b82f6', light: '#00000000' } // Blue QR, transparent bg
                });
                setKioskQr(url);
            } catch (e) {
                console.error(e);
            }
        };

        generateKioskQr(); // Initial
        interval = setInterval(generateKioskQr, 15 * 60 * 1000); // 15 mins

        return () => clearInterval(interval);
    }, []);

    // Auto-focus logic
    useEffect(() => {
        const focusInput = () => {
            if (inputRef.current && !isProcessing && lastResult?.status !== 'selection_required') {
                inputRef.current.focus();
            }
        };

        focusInput();

        // ... rest of focus logic

        const handleBlur = () => {
            // Solo re-enfocar si no estamos mostrando un modal de selección
            if (lastResult?.status !== 'selection_required') {
                setTimeout(focusInput, 100);
            }
        };

        const input = inputRef.current;
        if (input) {
            input.addEventListener('blur', handleBlur);
        }

        return () => {
            if (input) {
                input.removeEventListener('blur', handleBlur);
            }
        };
    }, [isProcessing, lastResult]);

    const handleScan = async (scannedDni: string, disciplineId?: number) => {
        if (!scannedDni) return;

        setIsProcessing(true);
        if (!disciplineId) {
            setLastResult(null);
        }

        try {
            const body: any = {};

            // Detectar si es QR (JSON) o DNI
            const cleanInput = scannedDni.trim();
            if (cleanInput.startsWith('{') && cleanInput.endsWith('}')) {
                body.qr_data = cleanInput;
            } else {
                body.dni = cleanInput;
            }

            if (disciplineId) body.discipline_id = disciplineId;

            const response = await fetch('/api/check-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            setLastResult({
                status: data.status,
                message: data.message,
                data: data.data,
                options: data.options,
            });

            if (data.status === 'success') {
                toast.success(data.message);
                setDni(''); // Limpiar para el siguiente

                // Si fue exitoso, esperar 5 segundos y limpiar la pantalla
                setTimeout(() => {
                    setLastResult(null);
                }, 5000);

            } else if (data.status === 'selection_required') {
                // No limpiar DNI, esperar selección del usuario
                // El modal se encargará de mostrar las opciones
            } else {
                toast.error(data.message);
                setDni(''); // Limpiar DNI siempre

                // También limpiar error automáticamente después de 6 seg
                setTimeout(() => {
                    setLastResult(null);
                }, 6000);

                if (inputRef.current) {
                    inputRef.current.focus(); // Re-enfocar simplemente
                }
            }
        } catch (error) {
            setLastResult({
                status: 'error',
                message: 'Error de conexión',
            });
            toast.error('Error de conexión');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleScan(dni);
    };

    const handleOptionSelect = (disciplineId: number) => {
        handleScan(dni, disciplineId);
    };

    // Bloquear navegación y otras acciones
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.startsWith('F') || e.ctrlKey || e.metaKey || e.altKey) return;

            // Si estamos en modo selección, permitir teclado normal o navegación
            if (lastResult?.status === 'selection_required') return;

            if (document.activeElement !== inputRef.current) {
                inputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lastResult]);

    const handleKeypadClick = (key: string) => {
        if (key === 'Enter') {
            handleScan(dni);
        } else if (key === 'Backspace') {
            setDni(prev => prev.slice(0, -1));
        } else if (key === 'Clear') {
            setDni('');
        } else {
            setDni(prev => prev + key);
        }
        inputRef.current?.focus();
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            logout();
            router.push('/login');
        } catch (error) {
            console.error('Logout error', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col p-4 md:p-8 relative">

            {/* Header discreto */}
            <div className="absolute top-4 left-6 z-10 opacity-50 hover:opacity-100 transition-opacity flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-mono text-green-500 uppercase tracking-widest">Sistema en línea • Modo Kiosco</span>
            </div>

            <div className="absolute top-4 right-6 z-10">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all text-xs font-medium"
                >
                    <Power className="w-3 h-3" />
                    <span>Salir</span>
                </button>
            </div>

            <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full gap-8 items-center justify-center">

                {/* Panel Central: Scanner (Si no hay resultado o si es selección) */}
                <div className={`w-full max-w-5xl transition-all duration-500 ${lastResult?.status === 'success' || lastResult?.status === 'error' ? 'hidden md:flex md:w-1/2 opacity-50 pointer-events-none' : 'flex-1'}`}>

                    <div className="glass p-8 rounded-2xl w-full flex flex-col md:flex-row gap-12 items-center justify-center relative border border-white/5 shadow-2xl">

                        {/* Columna Izquierda: QR */}
                        {!isProcessing && (
                            <div className="flex-1 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 pb-8 md:pb-0 md:pr-12 w-full">
                                <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-widest text-center">Escanea el QR con tu App</h3>
                                {kioskQr ? (
                                    <div className="p-4 bg-white rounded-xl shadow-lg shadow-blue-500/20 mb-4 animate-fade-in ring-4 ring-blue-500/20">
                                        <img src={kioskQr} alt="QR de Acceso" className="w-64 h-64 md:w-80 md:h-80 object-contain" />
                                    </div>
                                ) : (
                                    <QrCode className="w-64 h-64 mb-4 text-blue-500/20 animate-pulse" />
                                )}
                                <p className="text-blue-400/60 text-sm font-mono text-center">El código cambia cada 15 minutos</p>
                            </div>
                        )}

                        {/* Columna Derecha: Teclado */}
                        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
                            <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-widest opacity-50">O ingresa tu DNI para acceder</h3>

                            <form onSubmit={handleFormSubmit} className="w-full mb-6 relative">
                                <div className="relative group">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500/50 w-8 h-8 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={dni}
                                        onChange={(e) => setDni(e.target.value)}
                                        className="w-full bg-black/40 border-2 border-blue-500/30 rounded-2xl py-6 pl-20 pr-6 text-4xl text-white font-mono tracking-[0.2em] text-center focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-800"
                                        placeholder="••••••••"
                                        autoComplete="off"
                                        autoFocus
                                        disabled={lastResult?.status === 'selection_required'}
                                    />
                                    {isProcessing && (
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                        </div>
                                    )}
                                </div>
                            </form>

                            {/* Keypad Numérico */}
                            <div className={`grid grid-cols-3 gap-3 w-full transition-opacity ${lastResult?.status === 'selection_required' ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => handleKeypadClick(num.toString())}
                                        className="h-16 rounded-xl bg-gradient-to-br from-white/5 to-white/0 hover:from-white/10 hover:to-white/5 border border-white/5 text-2xl font-bold text-white transition-all active:scale-95 shadow-lg"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    onClick={() => handleKeypadClick('Clear')}
                                    className="h-16 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all active:scale-95 flex items-center justify-center"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => handleKeypadClick('0')}
                                    className="h-16 rounded-xl bg-gradient-to-br from-white/5 to-white/0 hover:from-white/10 hover:to-white/5 border border-white/5 text-2xl font-bold text-white transition-all active:scale-95 shadow-lg"
                                >
                                    0
                                </button>
                                <button
                                    onClick={() => handleKeypadClick('Backspace')}
                                    className="h-16 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 transition-all active:scale-95 flex items-center justify-center"
                                >
                                    <Delete className="w-6 h-6" />
                                </button>
                            </div>

                            <button
                                onClick={() => handleScan(dni)}
                                className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                                disabled={lastResult?.status === 'selection_required'}
                            >
                                CONFIRMAR ACCESO <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>

                    </div>
                </div>

                {/* Panel Derecho: Resultado / Selección */}
                {(lastResult?.status === 'success' || lastResult?.status === 'error' || lastResult?.status === 'selection_required') && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm md:static md:bg-transparent md:backdrop-blur-none md:w-1/2 md:max-w-xl md:h-full md:max-h-[800px]">

                        {/* Modal de Selección */}
                        {lastResult.status === 'selection_required' && lastResult.options && (
                            <div className="bg-gray-900 border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-scale-in">
                                <div className="text-center mb-8">
                                    <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                                        <HelpCircle className="w-10 h-10 text-blue-400" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-2">¿A qué actividad ingresas?</h2>
                                    <p className="text-gray-400">{lastResult.message}</p>
                                </div>

                                <div className="grid gap-4">
                                    {lastResult.options.map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => handleOptionSelect(option.id)}
                                            className="relative group p-6 rounded-2xl bg-white/5 hover:bg-blue-600 hover:scale-[1.02] border border-white/5 transition-all text-left"
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xl font-bold text-white group-hover:text-white">{option.name}</span>
                                                {option.type === 'reservation' && (
                                                    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded font-bold uppercase">
                                                        Reserva: {option.detail}
                                                    </span>
                                                )}
                                            </div>
                                            {option.remaining !== undefined && (
                                                <p className="text-sm text-gray-500 group-hover:text-blue-200">
                                                    Creditos disponibles: {option.remaining}
                                                </p>
                                            )}
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight className="w-6 h-6 text-white" />
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setLastResult(null)}
                                    className="mt-8 w-full py-3 text-gray-500 hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}

                        {/* Resultado Exitoso */}
                        {lastResult.status === 'success' && lastResult.data && (
                            <div className="bg-gray-900/90 border-2 border-green-500/50 rounded-3xl p-12 w-full h-full flex flex-col items-center justify-center text-center shadow-2xl animate-scale-in cursor-pointer" onClick={() => setLastResult(null)}>
                                <div className="relative mb-8 inline-block">
                                    <div className="w-56 h-56 rounded-full border-4 border-green-500 p-1 mx-auto bg-gray-900 overflow-hidden shadow-2xl shadow-green-500/30">
                                        {lastResult.data.photo_url ? (
                                            <img src={lastResult.data.photo_url} alt="Usuario" className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-6xl">👤</div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-4 right-4 bg-green-500 text-white rounded-full p-3 shadow-lg border-4 border-gray-900 animate-bounce">
                                        <CheckCircle className="w-10 h-10" />
                                    </div>
                                </div>

                                <h2 className="text-5xl font-bold text-white mb-2 tracking-tight">{lastResult.message.replace('¡Bienvenido ', '').split('!')[0]}</h2>
                                <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-green-500/20 text-green-400 font-bold tracking-wider mb-8 border border-green-500/20">
                                    <CheckCircle className="w-5 h-5" /> ACCESO PERMITIDO
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full text-left bg-black/40 p-8 rounded-2xl border border-white/10">
                                    <div>
                                        <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Disciplina</p>
                                        <p className="text-2xl font-bold text-white">{lastResult.data.discipline}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Créditos</p>
                                        <p className={`text-4xl font-mono font-bold ${lastResult.data.remaining_credits < 3 ? 'text-orange-400' : 'text-white'}`}>
                                            {lastResult.data.remaining_credits}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Resultado Error */}
                        {lastResult.status === 'error' && (
                            <div className="bg-gray-900/90 border-2 border-red-500/50 rounded-3xl p-12 w-full h-full flex flex-col items-center justify-center text-center shadow-2xl animate-shake cursor-pointer" onClick={() => setLastResult(null)}>
                                <div className="w-48 h-48 rounded-full bg-red-500/10 border-4 border-red-500/50 flex items-center justify-center mx-auto mb-8 text-red-500 shadow-2xl shadow-red-500/20">
                                    <XCircle className="w-24 h-24" />
                                </div>
                                <h2 className="text-4xl font-bold text-white mb-4">Datos inválidos</h2>
                                <p className="text-2xl text-red-400 mb-8 font-medium">{lastResult.message}</p>
                                <div className="p-6 bg-red-500/10 rounded-xl w-full border border-red-500/20">
                                    <p className="text-base text-red-200 text-center leading-relaxed">
                                        Por favor, verifique su estado en recepción.
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>
                )}

            </main>
        </div>
    );
}
