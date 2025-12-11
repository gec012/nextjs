'use client';

import { useEffect, useState } from 'react';

import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    Calendar,
    CreditCard,
    Download,
    Filter,
    Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface ReportsData {
    period: {
        type: string;
        start: string;
        end: string;
    };
    revenue: {
        total: number;
        byMethod: Record<string, number>;
        byDiscipline: Record<string, number>;
        change: number;
    };
    checkIns: {
        total: number;
        byDiscipline: Record<string, number>;
        change: number;
    };
    reservations: {
        total: number;
        active: number;
        completed: number;
        cancelled: number;
        byClass: Record<string, number>;
    };
    memberships: {
        new: number;
        active: number;
        expiring: number;
    };
    users: {
        new: number;
        totalActive: number;
        byRole: Record<string, number>;
    };
    topClasses: Array<{ name: string; count: number }>;
    topDisciplines: Array<{ name: string; count: number }>;
}

export default function ReportsPage() {
    const [data, setData] = useState<ReportsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [period, setPeriod] = useState('today');
    const [customDates, setCustomDates] = useState({
        start: format(new Date(), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd'),
    });

    useEffect(() => {
        fetchReports();
    }, [period]);

    const fetchReports = async () => {
        try {
            setIsLoading(true);
            let url = `/api/reports?period=${period}`;

            if (period === 'custom') {
                url += `&startDate=${customDates.start}&endDate=${customDates.end}`;
            }

            const response = await fetch(url, {
                credentials: 'include',
            });

            if (response.ok) {
                const reportData = await response.json();
                setData(reportData);
            } else {
                toast.error('Error al cargar reportes');
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Error al cargar reportes');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportPDF = async () => {
        if (!data) {
            toast.error('No hay datos para exportar');
            return;
        }

        try {
            // Importar dinámicamente para reducir bundle
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            toast.loading('Generando PDF...');

            // Crear un contenedor temporal con el reporte
            const reportElement = document.createElement('div');
            reportElement.style.padding = '40px';
            reportElement.style.backgroundColor = 'white';
            reportElement.style.width = '800px';
            reportElement.innerHTML = `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h1 style="color: #2563eb; margin-bottom: 10px;">Reporte de Gimnasio 📊</h1>
                    <p style="color: #666; margin-bottom: 30px;">Período: ${format(new Date(data.period.start), 'dd/MM/yyyy', { locale: es })} - ${format(new Date(data.period.end), 'dd/MM/yyyy', { locale: es })}</p>
                    
                    <h2 style="color: #2563eb; margin-top: 30px; margin-bottom: 15px;">💰 Resumen Financiero</h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr style="background: #f3f4f6;">
                            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Ingresos Totales</td>
                            <td style="padding: 10px; border: 1px solid #e5e7eb;">${formatCurrency(data.revenue.total)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Cambio vs Período Anterior</td>
                            <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.revenue.change > 0 ? '+' : ''}${data.revenue.change.toFixed(1)}%</td>
                        </tr>
                    </table>

                    <h3 style="margin-top: 20px;">Ingresos por Método de Pago</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        ${Object.entries(data.revenue.byMethod).map(([method, amount]) => `
                            <tr>
                                <td style="padding: 8px; border: 1px solid #e5e7eb;">${method}</td>
                                <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(amount)}</td>
                            </tr>
                        `).join('')}
                    </table>

                    <h2 style="color: #2563eb; margin-top: 30px; margin-bottom: 15px;">📊 Estadísticas de Actividad</h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr style="background: #f3f4f6;">
                            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Total Asistencias</td>
                            <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.checkIns.total}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Total Reservas</td>
                            <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.reservations.total}</td>
                        </tr>
                        <tr style="background: #f3f4f6;">
                            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Nuevas Membresías</td>
                            <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.memberships.new}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Nuevos Usuarios</td>
                            <td style="padding: 10px; border: 1px solid #e5e7eb;">${data.users.new}</td>
                        </tr>
                    </table>

                    <h3 style="margin-top: 20px;">Top 5 Clases Más Populares</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        ${data.topClasses.map((item, index) => `
                            <tr>
                                <td style="padding: 8px; border: 1px solid #e5e7eb;">${index + 1}. ${item.name}</td>
                                <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${item.count} reservas</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            `;

            document.body.appendChild(reportElement);

            const canvas = await html2canvas(reportElement);
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`reporte-gimnasio-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

            document.body.removeChild(reportElement);
            toast.dismiss();
            toast.success('PDF descargado exitosamente');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            toast.dismiss();
            toast.error('Error al generar PDF');
        }
    };

    const handleExportExcel = async () => {
        if (!data) {
            toast.error('No hay datos para exportar');
            return;
        }

        try {
            const XLSX = await import('xlsx');

            // Hoja 1: Resumen
            const summaryData = [
                ['REPORTE DE GIMNASIO'],
                ['Período', `${format(new Date(data.period.start), 'dd/MM/yyyy')} - ${format(new Date(data.period.end), 'dd/MM/yyyy')}`],
                [],
                ['RESUMEN FINANCIERO'],
                ['Ingresos Totales', data.revenue.total],
                ['Cambio vs Anterior', `${data.revenue.change.toFixed(1)}%`],
                [],
                ['ESTADÍSTICAS'],
                ['Total Asistencias', data.checkIns.total],
                ['Total Reservas', data.reservations.total],
                ['Nuevas Membresías', data.memberships.new],
                ['Nuevos Usuarios', data.users.new],
            ];

            // Hoja 2: Ingresos por Método
            const revenueMethodData = [
                ['Método de Pago', 'Monto'],
                ...Object.entries(data.revenue.byMethod).map(([method, amount]) => [method, amount]),
            ];

            // Hoja 3: Ingresos por Disciplina
            const revenueDisciplineData = [
                ['Disciplina', 'Monto'],
                ...Object.entries(data.revenue.byDiscipline).map(([discipline, amount]) => [discipline, amount]),
            ];

            // Hoja 4: Top Clases
            const topClassesData = [
                ['Posición', 'Clase', 'Reservas'],
                ...data.topClasses.map((item, index) => [index + 1, item.name, item.count]),
            ];

            // Crear workbook
            const wb = XLSX.utils.book_new();

            const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
            const ws2 = XLSX.utils.aoa_to_sheet(revenueMethodData);
            const ws3 = XLSX.utils.aoa_to_sheet(revenueDisciplineData);
            const ws4 = XLSX.utils.aoa_to_sheet(topClassesData);

            XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');
            XLSX.utils.book_append_sheet(wb, ws2, 'Por Método');
            XLSX.utils.book_append_sheet(wb, ws3, 'Por Disciplina');
            XLSX.utils.book_append_sheet(wb, ws4, 'Top Clases');

            XLSX.writeFile(wb, `reporte-gimnasio-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

            toast.success('Excel descargado exitosamente');
        } catch (error) {
            console.error('Error exporting Excel:', error);
            toast.error('Error al generar Excel');
        }
    };

    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString()}`;
    };

    const getChangeIcon = (change: number) => {
        if (change > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
        if (change < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
        return null;
    };

    const getChangeColor = (change: number) => {
        if (change > 0) return 'text-green-400';
        if (change < 0) return 'text-red-400';
        return 'text-gray-400';
    };

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-8 animate-slide-in-up">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Reportes y Estadísticas 📊
                    </h1>
                    <p className="text-gray-400">
                        Análisis completo del rendimiento del gimnasio
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                    >
                        <Download className="w-5 h-5" />
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all"
                    >
                        <Download className="w-5 h-5" />
                        <span className="hidden sm:inline">Excel</span>
                    </button>
                </div>
            </div>

            {/* Period Filter */}
            <div className="glass rounded-xl p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-blue-400" />
                    <h2 className="text-lg font-semibold text-white">Período</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setPeriod('today')}
                        className={`px-4 py-2 rounded-lg transition-all ${period === 'today'
                            ? 'gradient-primary text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        Hoy
                    </button>
                    <button
                        onClick={() => setPeriod('week')}
                        className={`px-4 py-2 rounded-lg transition-all ${period === 'week'
                            ? 'gradient-primary text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        Esta Semana
                    </button>
                    <button
                        onClick={() => setPeriod('month')}
                        className={`px-4 py-2 rounded-lg transition-all ${period === 'month'
                            ? 'gradient-primary text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        Este Mes
                    </button>
                    <button
                        onClick={() => setPeriod('custom')}
                        className={`px-4 py-2 rounded-lg transition-all ${period === 'custom'
                            ? 'gradient-primary text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        Personalizado
                    </button>
                </div>

                {period === 'custom' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <input
                            type="date"
                            value={customDates.start}
                            onChange={(e) => setCustomDates({ ...customDates, start: e.target.value })}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="date"
                            value={customDates.end}
                            onChange={(e) => setCustomDates({ ...customDates, end: e.target.value })}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={fetchReports}
                            className="px-4 py-2 rounded-lg gradient-primary text-white hover:opacity-90 transition-all"
                        >
                            Aplicar
                        </button>
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="glass rounded-xl p-12 text-center">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                    <p className="text-gray-400 mt-4">Cargando reportes...</p>
                </div>
            ) : data ? (
                <>
                    {/* Main Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="glass rounded-xl p-6 card-hover">
                            <div className="flex items-center justify-between mb-4">
                                <DollarSign className="w-10 h-10 text-green-400" />
                                {getChangeIcon(data.revenue.change)}
                            </div>
                            <p className="text-3xl font-bold text-white mb-2">
                                {formatCurrency(data.revenue.total)}
                            </p>
                            <p className="text-sm text-gray-400 mb-1">Ingresos Totales</p>
                            <p className={`text-sm font-semibold ${getChangeColor(data.revenue.change)}`}>
                                {data.revenue.change > 0 ? '+' : ''}{data.revenue.change.toFixed(1)}% vs anterior
                            </p>
                        </div>

                        <div className="glass rounded-xl p-6 card-hover">
                            <div className="flex items-center justify-between mb-4">
                                <Users className="w-10 h-10 text-blue-400" />
                                {getChangeIcon(data.checkIns.change)}
                            </div>
                            <p className="text-3xl font-bold text-white mb-2">{data.checkIns.total}</p>
                            <p className="text-sm text-gray-400 mb-1">Asistencias</p>
                            <p className={`text-sm font-semibold ${getChangeColor(data.checkIns.change)}`}>
                                {data.checkIns.change > 0 ? '+' : ''}{data.checkIns.change.toFixed(1)}% vs anterior
                            </p>
                        </div>

                        <div className="glass rounded-xl p-6 card-hover">
                            <div className="flex items-center justify-between mb-4">
                                <Calendar className="w-10 h-10 text-purple-400" />
                            </div>
                            <p className="text-3xl font-bold text-white mb-2">{data.reservations.total}</p>
                            <p className="text-sm text-gray-400 mb-1">Reservas</p>
                            <p className="text-sm text-green-400">
                                {data.reservations.completed} completadas
                            </p>
                        </div>

                        <div className="glass rounded-xl p-6 card-hover">
                            <div className="flex items-center justify-between mb-4">
                                <CreditCard className="w-10 h-10 text-orange-400" />
                            </div>
                            <p className="text-3xl font-bold text-white mb-2">{data.memberships.new}</p>
                            <p className="text-sm text-gray-400 mb-1">Nuevas Membresías</p>
                            <p className="text-sm text-yellow-400">
                                {data.memberships.expiring} por vencer
                            </p>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Revenue by Method */}
                        <div className="glass rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Ingresos por Método de Pago
                            </h3>
                            <div className="space-y-3">
                                {Object.entries(data.revenue.byMethod).map(([method, amount]) => {
                                    const percentage = (amount / data.revenue.total) * 100;
                                    const methodLabels: Record<string, string> = {
                                        CASH: 'Efectivo',
                                        TRANSFER: 'Transferencia',
                                        CREDIT: 'Crédito',
                                        DEBIT: 'Débito',
                                        MERCADOPAGO: 'MercadoPago',
                                    };
                                    return (
                                        <div key={method}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-400">{methodLabels[method] || method}</span>
                                                <span className="text-white font-semibold">{formatCurrency(amount)}</span>
                                            </div>
                                            <div className="w-full bg-white/10 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Top Classes */}
                        <div className="glass rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Clases Más Populares
                            </h3>
                            <div className="space-y-3">
                                {data.topClasses.map((item, index) => (
                                    <div key={item.name} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{item.name}</p>
                                            <p className="text-gray-400 text-sm">{item.count} reservas</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* More Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue by Discipline */}
                        <div className="glass rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Ingresos por Disciplina
                            </h3>
                            <div className="space-y-3">
                                {Object.entries(data.revenue.byDiscipline)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([discipline, amount]) => {
                                        const percentage = (amount / data.revenue.total) * 100;
                                        return (
                                            <div key={discipline}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-400">{discipline}</span>
                                                    <span className="text-white font-semibold">
                                                        {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                                                    </span>
                                                </div>
                                                <div className="w-full bg-white/10 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Top Disciplines by Check-ins */}
                        <div className="glass rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Disciplinas Más Visitadas
                            </h3>
                            <div className="space-y-3">
                                {data.topDisciplines.map((item, index) => (
                                    <div key={item.name} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{item.name}</p>
                                            <p className="text-gray-400 text-sm">{item.count} check-ins</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="glass rounded-xl p-12 text-center">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No hay datos disponibles</p>
                </div>
            )}
        </>
    );
}
