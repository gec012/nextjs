import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader, request);

        if (!authUser) {
            return NextResponse.json(
                { message: 'No autenticado' },
                { status: 401 }
            );
        }

        const now = new Date();

        // Obtener el inicio de la semana actual (lunes a las 00:00)
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        startOfWeek.setHours(0, 0, 0, 0);

        // Obtener clases desde el inicio de la semana actual
        const classes = await prisma.class.findMany({
            where: {
                isActive: true,
                startTime: {
                    gte: startOfWeek,
                },
            },
            include: {
                discipline: true,
                reservations: {
                    where: {
                        userId: authUser.userId,
                        status: 'ACTIVE',
                    },
                },
                _count: {
                    select: {
                        reservations: {
                            where: {
                                status: 'ACTIVE',
                            },
                        },
                    },
                },
            },
            orderBy: {
                startTime: 'asc',
            },
            take: 500, // Permitir hasta 500 clases
        });

        // Formatear respuesta
        const formattedClasses = classes.map((c) => {
            const enrolled = c._count.reservations;
            const availableSpots = c.capacity - enrolled;
            const userReservation = c.reservations[0]; // Solo puede haber una reserva activa por usuario

            return {
                id: c.id,
                name: c.name,
                disciplineId: c.disciplineId,
                disciplineName: c.discipline.name,
                instructorName: c.instructorName,
                startTime: c.startTime.toISOString(),
                endTime: c.endTime.toISOString(),
                capacity: c.capacity,
                enrolled,
                availableSpots: availableSpots,
                isFull: availableSpots <= 0,
                isReserved: !!userReservation,
                reservationId: userReservation?.id || null,
            };
        });

        return NextResponse.json({
            classes: formattedClasses,
        });

    } catch (error) {
        console.error('Get classes error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
