import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader, request);

        if (!authUser) {
            return NextResponse.json(
                { message: 'No autenticado' },
                { status: 401 }
            );
        }

        // Solo admins pueden eliminar clases
        if (authUser.rol !== 'ADMIN') {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 403 }
            );
        }

        const classId = parseInt(params.id);

        if (isNaN(classId)) {
            return NextResponse.json(
                { message: 'ID de clase inválido' },
                { status: 400 }
            );
        }

        // Verificar que la clase existe
        const classItem = await prisma.class.findUnique({
            where: { id: classId },
            include: {
                reservations: {
                    where: { status: 'ACTIVE' }
                }
            }
        });

        if (!classItem) {
            return NextResponse.json(
                { message: 'Clase no encontrada' },
                { status: 404 }
            );
        }

        // Verificar si tiene reservas activas
        if (classItem.reservations.length > 0) {
            return NextResponse.json(
                {
                    message: `No se puede eliminar. La clase tiene ${classItem.reservations.length} reservas activas.`,
                    hasActiveReservations: true,
                    reservationCount: classItem.reservations.length
                },
                { status: 400 }
            );
        }

        // Eliminar la clase (las reservas canceladas se mantienen por historial)
        await prisma.class.delete({
            where: { id: classId }
        });

        return NextResponse.json({
            message: 'Clase eliminada exitosamente',
            deletedId: classId
        });

    } catch (error) {
        console.error('Delete class error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// También permitir GET para obtener detalles de una clase específica
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader, request);

        if (!authUser) {
            return NextResponse.json(
                { message: 'No autenticado' },
                { status: 401 }
            );
        }

        const classId = parseInt(params.id);

        if (isNaN(classId)) {
            return NextResponse.json(
                { message: 'ID de clase inválido' },
                { status: 400 }
            );
        }

        const classItem = await prisma.class.findUnique({
            where: { id: classId },
            include: {
                discipline: true,
                reservations: {
                    where: { status: 'ACTIVE' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        reservations: {
                            where: { status: 'ACTIVE' }
                        }
                    }
                }
            }
        });

        if (!classItem) {
            return NextResponse.json(
                { message: 'Clase no encontrada' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            class: {
                id: classItem.id,
                name: classItem.name,
                disciplineName: classItem.discipline.name,
                instructorName: classItem.instructorName,
                startTime: classItem.startTime.toISOString(),
                endTime: classItem.endTime.toISOString(),
                capacity: classItem.capacity,
                enrolled: classItem._count.reservations,
                availableSpots: classItem.capacity - classItem._count.reservations,
                isActive: classItem.isActive,
                reservations: classItem.reservations.map(r => ({
                    id: r.id,
                    userName: r.user.name,
                    userEmail: r.user.email
                }))
            }
        });

    } catch (error) {
        console.error('Get class error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
