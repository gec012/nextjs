import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { reserveClassSchema } from '@/lib/validations';
import { hasClassStarted } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader, request);

        if (!authUser) {
            return NextResponse.json(
                { message: 'No autenticado' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validatedData = reserveClassSchema.parse(body);

        // Obtener la clase
        const classData = await prisma.class.findUnique({
            where: { id: validatedData.classId },
            include: {
                discipline: true,
                _count: {
                    select: {
                        reservations: {
                            where: { status: 'ACTIVE' },
                        },
                    },
                },
            },
        });

        if (!classData) {
            return NextResponse.json(
                { message: 'Clase no encontrada' },
                { status: 404 }
            );
        }

        // Verificar que la clase no haya comenzado
        if (hasClassStarted(classData.startTime)) {
            return NextResponse.json(
                {
                    status: 'error',
                    message: 'No puedes reservar una clase que ya ha comenzado o finalizado.',
                },
                { status: 400 }
            );
        }

        // Verificar que haya cupo
        if (classData._count.reservations >= classData.capacity) {
            return NextResponse.json(
                { message: 'La clase está llena' },
                { status: 400 }
            );
        }

        // Verificar que el usuario no tenga ya una reserva para esta clase
        const existingReservation = await prisma.reservation.findUnique({
            where: {
                userId_classId: {
                    userId: authUser.userId,
                    classId: validatedData.classId,
                },
            },
        });

        if (existingReservation && existingReservation.status === 'ACTIVE') {
            return NextResponse.json(
                { message: 'Ya tienes una reserva para esta clase' },
                { status: 400 }
            );
        }

        // Obtener membresía activa de la disciplina correspondiente
        const membership = await prisma.membership.findFirst({
            where: {
                userId: authUser.userId,
                disciplineId: classData.disciplineId,
                status: 'ACTIVE',
                expirationDate: {
                    gte: new Date(),
                },
            },
        });

        if (!membership) {
            return NextResponse.json(
                {
                    message: `No tienes una membresía activa para ${classData.discipline.name}`,
                },
                { status: 402 } // Payment Required
            );
        }

        // Verificar créditos (si no es ilimitada)
        if (!membership.isUnlimited && membership.remainingCredits <= 0) {
            return NextResponse.json(
                { message: 'No tienes créditos suficientes' },
                { status: 402 }
            );
        }

        // Crear reserva y descontar crédito en una transacción
        const result = await prisma.$transaction(async (tx) => {
            // Crear/actualizar reserva
            const reservation = existingReservation
                ? await tx.reservation.update({
                    where: { id: existingReservation.id },
                    data: {
                        status: 'ACTIVE',
                        attended: false,
                        cancelledAt: null,
                    },
                })
                : await tx.reservation.create({
                    data: {
                        userId: authUser.userId,
                        classId: validatedData.classId,
                        membershipId: membership.id,
                        status: 'ACTIVE',
                    },
                });

            // Descontar crédito (si no es ilimitada)
            if (!membership.isUnlimited) {
                await tx.membership.update({
                    where: { id: membership.id },
                    data: {
                        remainingCredits: {
                            decrement: 1,
                        },
                    },
                });
            }

            return reservation;
        });

        // Obtener créditos actualizados
        const updatedMembership = await prisma.membership.findUnique({
            where: { id: membership.id },
        });

        return NextResponse.json({
            message: '¡Reserva confirmada! Te esperamos.',
            remaining_credits: updatedMembership?.remainingCredits || 0,
            discipline: classData.discipline.name,
        });

    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                {
                    message: 'Datos inválidos',
                    errors: error.errors,
                },
                { status: 400 }
            );
        }

        console.error('Reserve class error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
