import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader, request);

        if (!authUser || (authUser.rol !== 'ADMIN' && authUser.rol !== 'STAFF')) {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'today'; // today, week, month, custom
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Calcular rango de fechas
        let start: Date;
        let end: Date;

        switch (period) {
            case 'today':
                start = startOfDay(new Date());
                end = endOfDay(new Date());
                break;
            case 'week':
                start = startOfWeek(new Date(), { weekStartsOn: 1 });
                end = endOfWeek(new Date(), { weekStartsOn: 1 });
                break;
            case 'month':
                start = startOfMonth(new Date());
                end = endOfMonth(new Date());
                break;
            case 'custom':
                if (!startDate || !endDate) {
                    return NextResponse.json(
                        { message: 'Se requieren startDate y endDate para período personalizado' },
                        { status: 400 }
                    );
                }
                start = new Date(startDate);
                end = new Date(endDate);
                break;
            default:
                start = startOfDay(new Date());
                end = endOfDay(new Date());
        }

        // 1. Estadísticas de Ingresos
        const payments = await prisma.payment.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
                status: 'APPROVED',
            },
            include: {
                plan: {
                    include: {
                        discipline: true,
                    },
                },
            },
        });

        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const paymentsByMethod = payments.reduce((acc, p) => {
            acc[p.method] = (acc[p.method] || 0) + p.amount;
            return acc;
        }, {} as Record<string, number>);

        const revenueByDiscipline = payments.reduce((acc, p) => {
            const disciplineName = p.plan.discipline.name;
            acc[disciplineName] = (acc[disciplineName] || 0) + p.amount;
            return acc;
        }, {} as Record<string, number>);

        // 2. Estadísticas de Asistencias (Attendances)
        const attendances = await prisma.attendance.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
            include: {
                discipline: true,
            },
        });

        const totalCheckIns = attendances.length;
        const checkInsByDiscipline = attendances.reduce((acc: Record<string, number>, a) => {
            const disciplineName = a.discipline.name;
            acc[disciplineName] = (acc[disciplineName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // 3. Estadísticas de Reservas
        const reservations = await prisma.reservation.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
            include: {
                class: {
                    include: {
                        discipline: true,
                    },
                },
            },
        });

        const totalReservations = reservations.length;
        const activeReservations = reservations.filter(r => r.status === 'ACTIVE').length;
        const completedReservations = reservations.filter(r => r.status === 'ATTENDED').length;
        const cancelledReservations = reservations.filter(r => r.status === 'CANCELLED').length;

        const reservationsByClass = reservations.reduce((acc: Record<string, number>, r) => {
            const className = r.class.name;
            acc[className] = (acc[className] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // 4. Estadísticas de Membresías
        const newMemberships = await prisma.membership.count({
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
        });

        const activeMemberships = await prisma.membership.count({
            where: {
                status: 'ACTIVE',
                expirationDate: {
                    gte: new Date(),
                },
            },
        });

        const expiringMemberships = await prisma.membership.count({
            where: {
                status: 'ACTIVE',
                expirationDate: {
                    gte: new Date(),
                    lte: endOfDay(subDays(new Date(), -7)), // próximos 7 días
                },
            },
        });

        // 5. Estadísticas de Usuarios
        const newUsers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
        });

        const totalActiveUsers = await prisma.user.count({
            where: {
                isActive: true,
            },
        });

        const usersByRole = await prisma.user.groupBy({
            by: ['rol'],
            _count: {
                rol: true,
            },
            where: {
                isActive: true,
            },
        });

        // 6. Top Clases más populares
        const topClasses = Object.entries(reservationsByClass)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 5)
            .map(([name, count]) => ({ name, count: count as number }));

        // 7. Top Disciplinas más populares
        const topDisciplines = Object.entries(checkInsByDiscipline)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 5)
            .map(([name, count]) => ({ name, count: count as number }));

        // 8. Comparación con período anterior
        const previousStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
        const previousEnd = start;

        const previousRevenue = await prisma.payment.aggregate({
            where: {
                createdAt: {
                    gte: previousStart,
                    lte: previousEnd,
                },
                status: 'APPROVED',
            },
            _sum: {
                amount: true,
            },
        });

        const previousCheckIns = await prisma.attendance.count({
            where: {
                createdAt: {
                    gte: previousStart,
                    lte: previousEnd,
                },
            },
        });

        const revenueChange = previousRevenue._sum.amount
            ? ((totalRevenue - previousRevenue._sum.amount) / previousRevenue._sum.amount) * 100
            : 0;

        const checkInsChange = previousCheckIns
            ? ((totalCheckIns - previousCheckIns) / previousCheckIns) * 100
            : 0;

        return NextResponse.json({
            period: {
                type: period,
                start: start.toISOString(),
                end: end.toISOString(),
            },
            revenue: {
                total: totalRevenue,
                byMethod: paymentsByMethod,
                byDiscipline: revenueByDiscipline,
                change: revenueChange,
            },
            checkIns: {
                total: totalCheckIns,
                byDiscipline: checkInsByDiscipline,
                change: checkInsChange,
            },
            reservations: {
                total: totalReservations,
                active: activeReservations,
                completed: completedReservations,
                cancelled: cancelledReservations,
                byClass: reservationsByClass,
            },
            memberships: {
                new: newMemberships,
                active: activeMemberships,
                expiring: expiringMemberships,
            },
            users: {
                new: newUsers,
                totalActive: totalActiveUsers,
                byRole: usersByRole.reduce((acc, u) => {
                    acc[u.rol] = u._count.rol;
                    return acc;
                }, {} as Record<string, number>),
            },
            topClasses,
            topDisciplines,
        });
    } catch (error) {
        console.error('Get reports error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
