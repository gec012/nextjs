'use client';

import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, Printer, CheckCircle, Download } from 'lucide-react';
import { useRef } from 'react';

interface ReceiptData {
    id: number;
    userName: string;
    userEmail: string;
    planName: string;
    disciplineName: string;
    amount: number;
    method: string;
    status: string;
    createdAt: string;
    notes?: string | null;
}

interface ReceiptModalProps {
    receipt: ReceiptData;
    gymName?: string;
    onClose: () => void;
}

const paymentMethodLabels: Record<string, string> = {
    CASH: 'Efectivo',
    TRANSFER: 'Transferencia Bancaria',
    CREDIT: 'Tarjeta de Crédito',
    DEBIT: 'Tarjeta de Débito',
    MERCADOPAGO: 'MercadoPago',
};

const statusLabels: Record<string, { label: string; color: string }> = {
    APPROVED: { label: 'Aprobado', color: 'text-green-500' },
    PENDING: { label: 'Pendiente', color: 'text-yellow-500' },
    REJECTED: { label: 'Rechazado', color: 'text-red-500' },
};

export default function ReceiptModal({ receipt, gymName = 'Mi Gimnasio', onClose }: ReceiptModalProps) {
    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = async () => {
        if (!receiptRef.current) return;

        try {
            // Importar dinámicamente html2canvas y jspdf
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                backgroundColor: '#1a1a2e',
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`recibo-${String(receipt.id).padStart(6, '0')}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            // Fallback: usar print
            handlePrint();
        }
    };

    const receiptDate = parseISO(receipt.createdAt);
    const statusInfo = statusLabels[receipt.status] || { label: receipt.status, color: 'text-gray-500' };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:bg-white print:p-0">
            <div className="bg-gray-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto print:bg-white print:max-w-full print:rounded-none print:shadow-none">
                {/* Header con botones */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 print:hidden">
                    <h2 className="text-lg font-semibold text-white">Comprobante de Pago</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownload}
                            className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all"
                            title="Descargar PDF"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handlePrint}
                            className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                            title="Imprimir"
                        >
                            <Printer className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Contenido del recibo */}
                <div ref={receiptRef} className="p-6 print:p-8 print:text-black">
                    {/* Logo y nombre del gym */}
                    <div className="text-center mb-6 print:mb-8">
                        <h1 className="text-2xl font-bold text-white print:text-black">{gymName}</h1>
                        <p className="text-gray-400 print:text-gray-600 text-sm mt-1">
                            Comprobante de Pago
                        </p>
                    </div>

                    {/* Número de recibo y fecha */}
                    <div className="flex justify-between items-start mb-6 text-sm">
                        <div>
                            <p className="text-gray-400 print:text-gray-600">Recibo N°</p>
                            <p className="text-white print:text-black font-mono font-bold">
                                #{String(receipt.id).padStart(6, '0')}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 print:text-gray-600">Fecha</p>
                            <p className="text-white print:text-black font-medium">
                                {format(receiptDate, "d 'de' MMMM, yyyy", { locale: es })}
                            </p>
                            <p className="text-gray-500 print:text-gray-500 text-xs">
                                {format(receiptDate, 'HH:mm')} hs
                            </p>
                        </div>
                    </div>

                    {/* Datos del cliente */}
                    <div className="bg-white/5 print:bg-gray-100 rounded-lg p-4 mb-6">
                        <p className="text-gray-400 print:text-gray-600 text-xs uppercase tracking-wider mb-2">Cliente</p>
                        <p className="text-white print:text-black font-semibold">{receipt.userName}</p>
                        <p className="text-gray-400 print:text-gray-600 text-sm">{receipt.userEmail}</p>
                    </div>

                    {/* Detalle del servicio */}
                    <div className="border-t border-b border-white/10 print:border-gray-300 py-4 mb-4">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-400 print:text-gray-600">
                                    <th className="text-left pb-2">Descripción</th>
                                    <th className="text-right pb-2">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="py-2">
                                        <p className="text-white print:text-black font-medium">{receipt.planName}</p>
                                        <p className="text-gray-400 print:text-gray-600 text-xs">{receipt.disciplineName}</p>
                                    </td>
                                    <td className="text-right text-white print:text-black">
                                        ${receipt.amount.toLocaleString('es-AR')}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-lg font-semibold text-white print:text-black">TOTAL</span>
                        <span className="text-2xl font-bold text-green-400 print:text-green-600">
                            ${receipt.amount.toLocaleString('es-AR')}
                        </span>
                    </div>

                    {/* Método de pago y estado */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white/5 print:bg-gray-100 rounded-lg p-3">
                            <p className="text-gray-400 print:text-gray-600 text-xs uppercase tracking-wider mb-1">
                                Método de Pago
                            </p>
                            <p className="text-white print:text-black font-medium text-sm">
                                {paymentMethodLabels[receipt.method] || receipt.method}
                            </p>
                        </div>
                        <div className="bg-white/5 print:bg-gray-100 rounded-lg p-3">
                            <p className="text-gray-400 print:text-gray-600 text-xs uppercase tracking-wider mb-1">
                                Estado
                            </p>
                            <div className={`flex items-center gap-1 ${statusInfo.color}`}>
                                {receipt.status === 'APPROVED' && <CheckCircle className="w-4 h-4" />}
                                <span className="font-medium text-sm">{statusInfo.label}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notas si existen */}
                    {receipt.notes && (
                        <div className="bg-yellow-500/10 print:bg-yellow-50 rounded-lg p-3 mb-6">
                            <p className="text-yellow-400 print:text-yellow-700 text-xs uppercase tracking-wider mb-1">
                                Notas
                            </p>
                            <p className="text-white print:text-black text-sm">{receipt.notes}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="text-center text-gray-500 print:text-gray-500 text-xs pt-4 border-t border-white/10 print:border-gray-300">
                        <p>Gracias por confiar en nosotros</p>
                        <p className="mt-1">Este comprobante es válido como constancia de pago</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
