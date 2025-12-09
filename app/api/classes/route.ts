import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader);

        if (!authUser) {
            return NextResponse.json(
                { message: 'No autenticado' },
                { status: 401 }
            );
        }

        const now = new Date();

        // Obtener clases futuras y actuales (no pasadas)
        const classes = await prisma.class.findMany({
            where: {
                isActive: true,
                startTime: {
                    gte: now,
                },
            },
            include: {
                discipline: true,
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
            take: 50, // Limitar a las próximas 50 clases
        });

        // Formatear respuesta
        const formattedClasses = classes.map((c) => {
            const enrolled = c._count.reservations;
            const availableSpots = c.capacity - enrolled;

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
