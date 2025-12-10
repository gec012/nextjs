import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Obtener una disciplina específica
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

        const disciplineId = parseInt(params.id);

        if (isNaN(disciplineId)) {
            return NextResponse.json(
                { message: 'ID de disciplina inválido' },
                { status: 400 }
            );
        }

        const discipline = await prisma.discipline.findUnique({
            where: { id: disciplineId },
        });

        if (!discipline) {
            return NextResponse.json(
                { message: 'Disciplina no encontrada' },
                { status: 404 }
            );
        }

        return NextResponse.json({ discipline });

    } catch (error) {
        console.error('Get discipline error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// PUT - Actualizar disciplina
export async function PUT(
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

        if (authUser.rol !== 'ADMIN') {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 403 }
            );
        }

        const disciplineId = parseInt(params.id);

        if (isNaN(disciplineId)) {
            return NextResponse.json(
                { message: 'ID de disciplina inválido' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { name, description, requiresReservation } = body;

        // Verificar que existe
        const existing = await prisma.discipline.findUnique({
            where: { id: disciplineId },
        });

        if (!existing) {
            return NextResponse.json(
                { message: 'Disciplina no encontrada' },
                { status: 404 }
            );
        }

        // Verificar nombre duplicado (excluyendo la actual)
        if (name && name !== existing.name) {
            const duplicate = await prisma.discipline.findFirst({
                where: {
                    name: {
                        equals: name,
                        mode: 'insensitive',
                    },
                    id: {
                        not: disciplineId,
                    },
                },
            });

            if (duplicate) {
                return NextResponse.json(
                    { message: 'Ya existe una disciplina con ese nombre' },
                    { status: 400 }
                );
            }
        }

        const updated = await prisma.discipline.update({
            where: { id: disciplineId },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(requiresReservation !== undefined && { requiresReservation }),
            },
        });

        return NextResponse.json({
            message: 'Disciplina actualizada exitosamente',
            discipline: updated,
        });

    } catch (error) {
        console.error('Update discipline error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// DELETE - Eliminar disciplina
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

        if (authUser.rol !== 'ADMIN') {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 403 }
            );
        }

        const disciplineId = parseInt(params.id);

        if (isNaN(disciplineId)) {
            return NextResponse.json(
                { message: 'ID de disciplina inválido' },
                { status: 400 }
            );
        }

        // Verificar si tiene membresías activas
        const activeMemberships = await prisma.membership.count({
            where: {
                disciplineId,
                status: 'ACTIVE',
            },
        });

        if (activeMemberships > 0) {
            return NextResponse.json(
                {
                    message: `No se puede eliminar. Hay ${activeMemberships} membresías activas asociadas.`,
                    hasActiveMemberships: true,
                    membershipCount: activeMemberships,
                },
                { status: 400 }
            );
        }

        // Verificar si tiene clases futuras
        const futureClasses = await prisma.class.count({
            where: {
                disciplineId,
                startTime: {
                    gte: new Date(),
                },
            },
        });

        if (futureClasses > 0) {
            return NextResponse.json(
                {
                    message: `No se puede eliminar. Hay ${futureClasses} clases programadas.`,
                    hasFutureClasses: true,
                    classCount: futureClasses,
                },
                { status: 400 }
            );
        }

        // Eliminar (o marcar como inactiva)
        await prisma.discipline.update({
            where: { id: disciplineId },
            data: { isActive: false },
        });

        return NextResponse.json({
            message: 'Disciplina eliminada exitosamente',
            deletedId: disciplineId,
        });

    } catch (error) {
        console.error('Delete discipline error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
