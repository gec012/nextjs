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

        // Obtener todas las reservas del usuario
        const reservations = await prisma.reservation.findMany({
            where: {
                userId: authUser.userId,
            },
            include: {
                class: {
                    include: {
                        discipline: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Formatear respuesta
        const formattedReservations = reservations.map((r) => ({
            id: r.id,
            className: r.class.name,
            disciplineName: r.class.discipline.name,
            startTime: r.class.startTime.toISOString(),
            status: r.status,
            createdAt: r.createdAt.toISOString(),
            attended: r.attended,
        }));

        return NextResponse.json({
            reservations: formattedReservations,
        });

    } catch (error) {
        console.error('Get reservations error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
