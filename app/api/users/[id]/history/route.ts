import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Obtener historial completo de un usuario (reservas, asistencias, pagos)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader, request);

        if (!authUser) {
            return NextResponse.json(
                { message: 'No autenticado' },
                { status: 401 }
            );
        }

        if (authUser.rol !== 'ADMIN' && authUser.rol !== 'STAFF') {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 403 }
            );
        }

        const userId = parseInt(id);

        if (isNaN(userId)) {
            return NextResponse.json(
                { message: 'ID de usuario inválido' },
                { status: 400 }
            );
        }

        // Obtener reservaciones con información de clases
        const reservations = await prisma.reservation.findMany({
            where: { userId },
            include: {
                class: {
                    include: {
                        discipline: true,
                    }
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50, // Últimas 50 reservas
        });

        // Obtener asistencias con disciplina
        const attendances = await prisma.attendance.findMany({
            where: { userId },
            include: {
                discipline: true,
            },
            orderBy: { checkInTime: 'desc' },
            take: 20,
        });

        // Obtener pagos con plan
        const payments = await prisma.payment.findMany({
            where: { userId },
            include: {
                plan: {
                    include: {
                        discipline: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 30,
        });

        // Obtener membresías activas
        const memberships = await prisma.membership.findMany({
            where: { userId },
            include: {
                plan: true,
                discipline: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Calcular estadísticas
        const totalReservations = reservations.length;
        const attended = reservations.filter(r => r.attended === true).length;
        const cancelled = reservations.filter(r => r.status === 'CANCELLED').length;
        const noShow = reservations.filter(r => r.status === 'ACTIVE' && r.attended === false && new Date(r.class.endTime) < new Date()).length;
        const activeCompleted = totalReservations - cancelled;
        const attendanceRate = activeCompleted > 0 ? Math.round((attended / activeCompleted) * 100) : 0;

        // Calcular totales de pagos
        const totalPaid = payments
            .filter(p => p.status === 'APPROVED')
            .reduce((sum, p) => sum + p.amount, 0);

        const formattedReservations = reservations.map(r => ({
            id: r.id,
            className: r.class.name,
            disciplineName: r.class.discipline.name,
            date: r.class.startTime.toISOString(),
            status: r.status,
            attended: r.attended,
        }));

        const formattedAttendances = attendances.map(a => ({
            id: a.id,
            className: a.type === 'reservation' ? 'Clase reservada' : 'Acceso directo',
            disciplineName: a.discipline.name,
            date: a.checkInTime.toISOString(),
        }));

        const formattedPayments = payments.map(p => ({
            id: p.id,
            amount: p.amount,
            status: p.status,
            method: p.method,
            planName: p.plan.name,
            disciplineName: p.plan.discipline.name,
            date: p.createdAt.toISOString(),
            reference: p.notes || null,
        }));

        const formattedMemberships = memberships.map(m => ({
            id: m.id,
            planName: m.plan.name,
            disciplineName: m.discipline.name,
            remainingCredits: m.remainingCredits,
            totalCredits: m.totalCredits,
            isUnlimited: m.isUnlimited,
            status: m.status,
            expirationDate: m.expirationDate.toISOString(),
            startDate: m.startDate.toISOString(),
        }));

        return NextResponse.json({
            reservations: formattedReservations,
            attendances: formattedAttendances,
            payments: formattedPayments,
            memberships: formattedMemberships,
            stats: {
                totalReservations,
                attended,
                noShow,
                cancelled,
                attendanceRate: isNaN(attendanceRate) ? 0 : attendanceRate,
                totalPaid,
                totalPayments: payments.length,
                activeMemberships: memberships.filter(m => m.status === 'ACTIVE').length,
            }
        });

    } catch (error) {
        console.error('Get user history error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
