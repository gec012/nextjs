'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import ReceiptModal from '@/components/ReceiptModal';
import {
    Receipt,
    Loader2,
    Calendar,
    DollarSign,
    CheckCircle,
    Clock,
    XCircle,
    Eye,
    CreditCard,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '@/lib/stores/auth.store';

interface Payment {
    id: number;
    planName: string;
    disciplineName: string;
    amount: number;
    method: string;
    status: string;
    notes: string | null;
    createdAt: string;
}

const paymentMethodLabels: Record<string, { label: string; icon: string }> = {
    CASH: { label: 'Efectivo', icon: '💵' },
    TRANSFER: { label: 'Transferencia', icon: '🏦' },
    CREDIT: { label: 'Crédito', icon: '💳' },
    DEBIT: { label: 'Débito', icon: '💳' },
    MERCADOPAGO: { label: 'MercadoPago', icon: '📱' },
};

export default function ClientPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/my-payments', {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setPayments(data.payments || []);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                        <CheckCircle className="w-3 h-3" /> Aprobado
                    </span>
                );
            case 'PENDING':
                return (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                        <Clock className="w-3 h-3" /> Pendiente
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">
                        <XCircle className="w-3 h-3" /> Rechazado
                    </span>
                );
            default:
                return null;
        }
    };

    const totalPaid = payments
        .filter(p => p.status === 'APPROVED')
        .reduce((acc, p) => acc + p.amount, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
            <Navbar activeTab="pagos" />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 animate-slide-in-up">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Mis Pagos 💳
                    </h1>
                    <p className="text-gray-400">
                        Historial de pagos y comprobantes
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="glass rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <Receipt className="w-8 h-8 text-blue-400" />
                            <div>
                                <p className="text-2xl font-bold text-white">{payments.length}</p>
                                <p className="text-sm text-gray-400">Total pagos</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    {payments.filter(p => p.status === 'APPROVED').length}
                                </p>
                                <p className="text-sm text-gray-400">Aprobados</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <DollarSign className="w-8 h-8 text-green-400" />
                            <div>
                                <p className="text-2xl font-bold text-green-400">
                                    ${totalPaid.toLocaleString('es-AR')}
                                </p>
                                <p className="text-sm text-gray-400">Total pagado</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lista de pagos */}
                {isLoading ? (
                    <div className="glass rounded-xl p-12 text-center">
                        <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                        <p className="text-gray-400 mt-4">Cargando pagos...</p>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="glass rounded-xl p-12 text-center">
                        <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No hay pagos registrados</p>
                        <p className="text-gray-500 text-sm mt-2">
                            Tus comprobantes aparecerán aquí cuando realices un pago
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {payments.map((payment) => {
                            const methodInfo = paymentMethodLabels[payment.method] || { label: payment.method, icon: '💰' };
                            const paymentDate = parseISO(payment.createdAt);

                            return (
                                <div
                                    key={payment.id}
                                    className="glass rounded-xl p-6 hover:border-blue-500/30 border-2 border-transparent transition-all"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-blue-500/20">
                                                <CreditCard className="w-6 h-6 text-green-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">{payment.planName}</h3>
                                                <p className="text-gray-400 text-sm">{payment.disciplineName}</p>
                                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(paymentDate, "d MMM yyyy, HH:mm", { locale: es })}
                                                    </span>
                                                    <span>{methodInfo.icon} {methodInfo.label}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-green-400">
                                                    ${payment.amount.toLocaleString('es-AR')}
                                                </p>
                                                <div className="mt-1">
                                                    {getStatusBadge(payment.status)}
                                                </div>
                                            </div>

                                            {payment.status === 'APPROVED' && (
                                                <button
                                                    onClick={() => setSelectedPayment(payment)}
                                                    className="p-3 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                                                    title="Ver comprobante"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Receipt Modal */}
            {selectedPayment && user && (
                <ReceiptModal
                    receipt={{
                        id: selectedPayment.id,
                        userName: user.name,
                        userEmail: user.email,
                        planName: selectedPayment.planName,
                        disciplineName: selectedPayment.disciplineName,
                        amount: selectedPayment.amount,
                        method: selectedPayment.method,
                        status: selectedPayment.status,
                        createdAt: selectedPayment.createdAt,
                        notes: selectedPayment.notes,
                    }}
                    onClose={() => setSelectedPayment(null)}
                />
            )}
        </div>
    );
}
