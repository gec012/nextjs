import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
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

        const classId = parseInt(id);

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
            // Cancelar automáticamente todas las reservas activas
            await prisma.reservation.updateMany({
                where: {
                    classId: classId,
                    status: 'ACTIVE'
                },
                data: {
                    status: 'CANCELLED'
                }
            });
        }

        // Eliminar TODAS las reservas de la clase (activas, canceladas, etc.)
        // para evitar error de foreign key constraint
        await prisma.reservation.deleteMany({
            where: {
                classId: classId
            }
        });

        // Eliminar la clase
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
            {
                message: 'Error interno del servidor',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader, request);

        if (!authUser) {
            return NextResponse.json(
                { message: 'No autenticado' },
                { status: 401 }
            );
        }

        // Solo admins pueden editar clases
        if (authUser.rol !== 'ADMIN') {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 403 }
            );
        }

        const classId = parseInt(id);

        if (isNaN(classId)) {
            return NextResponse.json(
                { message: 'ID de clase inválido' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { name, disciplineId, instructorName, capacity } = body;

        // Verificar que la clase existe
        const existingClass = await prisma.class.findUnique({
            where: { id: classId }
        });

        if (!existingClass) {
            return NextResponse.json(
                { message: 'Clase no encontrada' },
                { status: 404 }
            );
        }

        // Actualizar la clase
        const updatedClass = await prisma.class.update({
            where: { id: classId },
            data: {
                ...(name && { name }),
                ...(disciplineId && { disciplineId }),
                ...(instructorName !== undefined && { instructorName }),
                ...(capacity && { capacity }),
            },
            include: {
                discipline: true
            }
        });

        return NextResponse.json({
            message: 'Clase actualizada exitosamente',
            class: {
                id: updatedClass.id,
                name: updatedClass.name,
                disciplineName: updatedClass.discipline.name,
                instructorName: updatedClass.instructorName,
                capacity: updatedClass.capacity,
            }
        });

    } catch (error) {
        console.error('Update class error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// También permitir GET para obtener detalles de una clase específica
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader, request);

        if (!authUser) {
            return NextResponse.json(
                { message: 'No autenticado' },
                { status: 401 }
            );
        }

        const classId = parseInt(id);

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
                    oderId: r.user.id,
                    userName: r.user.name,
                    userEmail: r.user.email,
                    attended: r.attended,
                    reservedAt: r.createdAt
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
