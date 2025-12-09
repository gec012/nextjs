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

        // Obtener todas las asistencias del usuario
        const attendances = await prisma.attendance.findMany({
            where: {
                userId: authUser.userId,
            },
            include: {
                discipline: true,
            },
            orderBy: {
                checkInTime: 'desc',
            },
        });

        // Formatear respuesta
        const formattedAttendances = attendances.map((a) => ({
            id: a.id,
            disciplineName: a.discipline.name,
            type: a.type,
            checkInTime: a.checkInTime.toISOString(),
        }));

        return NextResponse.json({
            attendances: formattedAttendances,
        });

    } catch (error) {
        console.error('Get attendances error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
