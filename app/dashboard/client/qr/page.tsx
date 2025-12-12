'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser } from '@/lib/stores/auth.store';
import { QrCode, Shield, Loader2, Camera, CheckCircle, XCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import toast from 'react-hot-toast';

export default function ScanPage() {
    const user = useUser();
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Inicializar scanner solo si no hay resultado
        if (!scanResult && !scannerRef.current) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                /* verbose= */ false
            );

            scanner.render(onScanSuccess, onScanFailure);
            scannerRef.current = scanner;
        }

        // Cleanup
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => console.error("Failed to clear html5-qrcode scanner. ", error));
                scannerRef.current = null;
            }
        };
    }, [scanResult]);

    async function onScanSuccess(decodedText: string, decodedResult: any) {
        if (isProcessing) return;

        // Validar formato básico del QR del gimnasio
        if (!decodedText.startsWith('GYM_ACCESS_POINT_')) {
            toast.error('Código QR no válido para este gimnasio');
            return;
        }

        setIsProcessing(true);
        // Pausar o limpiar scanner
        if (scannerRef.current) {
            scannerRef.current.clear().catch(e => console.error(e));
            scannerRef.current = null;
        }

        try {
            const response = await fetch('/api/check-in/client-scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qr_code: decodedText,
                    user_id: user?.id
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setScanResult('success');
                toast.success(data.message);
            } else {
                setScanResult(data.message || 'Error al procesar ingreso');
                toast.error(data.message);
            }

        } catch (error) {
            console.error('Scan error:', error);
            setScanResult('Error de conexión');
            toast.error('No se pudo conectar con el servidor');
        } finally {
            setIsProcessing(false);
        }
    }

    function onScanFailure(error: any) {
        // Ignorar errores de "no QR found" que ocurren en cada frame
        // console.warn(`Code scan error = ${error}`);
    }

    const resetScanner = () => {
        setScanResult(null);
        setIsProcessing(false);
        // El useEffect reinicializará el scanner
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8 animate-slide-in-up">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Camera className="w-8 h-8 text-blue-500" />
                    Escanear Ingreso
                </h1>
                <p className="text-gray-400">
                    Escanea el código QR ubicado en el ingreso para registrar tu asistencia.
                </p>
            </div>

            <div className="glass rounded-2xl p-6 md:p-8 animate-slide-in-up shadow-2xl overflow-hidden relative">

                {/* Estado: Escaneando */}
                {!scanResult && (
                    <div className="flex flex-col items-center">
                        <div id="reader" className="w-full max-w-md overflow-hidden rounded-xl border-2 border-white/10 bg-black"></div>
                        <p className="text-sm text-gray-500 mt-4 text-center">
                            Apunta tu cámara al código QR del gimnasio.
                        </p>
                    </div>
                )}

                {/* Estado: Procesando */}
                {isProcessing && (
                    <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center z-20">
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
                        <p className="text-xl text-white font-medium animate-pulse">Procesando acceso...</p>
                    </div>
                )}

                {/* Estado: Resultado Éxito */}
                {scanResult === 'success' && (
                    <div className="flex flex-col items-center text-center py-8">
                        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6 animate-scale-in">
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">¡Bienvenido!</h2>
                        <p className="text-gray-400 mb-8 max-w-xs">
                            Tu ingreso ha sido registrado exitosamente. ¡Buen entrenamiento!
                        </p>
                        <button
                            onClick={resetScanner}
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                        >
                            Escanear de nuevo
                        </button>
                    </div>
                )}

                {/* Estado: Resultado Error */}
                {scanResult && scanResult !== 'success' && !isProcessing && (
                    <div className="flex flex-col items-center text-center py-8">
                        <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mb-6 animate-shake">
                            <XCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
                        <p className="text-red-400 mb-8 max-w-xs font-medium">
                            {scanResult}
                        </p>
                        <button
                            onClick={resetScanner}
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                        >
                            Intentar de nuevo
                        </button>
                    </div>
                )}

            </div>

            {/* Manual Entry for Testing/Fallback */}
            <div className="mt-8 glass rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">¿Problemas con la cámara?</h3>
                <p className="text-gray-400 text-sm mb-4">
                    Si no puedes acceder a la cámara (común en entornos de prueba sin HTTPS), puedes ingresar el código manualmente.
                </p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="GYM_ACCESS_POINT_..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onScanSuccess(e.currentTarget.value, null);
                            }
                        }}
                    />
                    <button
                        className="px-4 py-2 bg-blue-600 rounded-lg text-white text-sm font-bold"
                        onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            onScanSuccess(input.value, null);
                        }}
                    >
                        Enviar
                    </button>
                </div>
            </div>

            <div className="mt-6 glass rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <Shield className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">¿Dónde está el código?</h3>
                        <p className="text-gray-400 text-sm">
                            Busca el código QR impreso en el mostrador de recepción o en la pantalla de la terminal de acceso.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
