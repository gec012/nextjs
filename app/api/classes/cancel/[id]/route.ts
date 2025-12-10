import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getHoursDifference } from '@/lib/utils';

const CANCELLATION_HOURS = parseInt(process.env.CANCELLATION_HOURS || '3');

async function handleCancelReservation(
    request: NextRequest,
    params: { id: string }
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

        const reservationId = parseInt(params.id);

        if (isNaN(reservationId)) {
            return NextResponse.json(
                { message: 'ID de reserva inválido' },
                { status: 400 }
            );
        }

        // Obtener la reserva con la clase
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
            include: {
                class: true,
                membership: true,
            },
        });

        if (!reservation) {
            return NextResponse.json(
                { message: 'Reserva no encontrada' },
                { status: 404 }
            );
        }

        // Verificar que sea del usuario
        if (reservation.userId !== authUser.userId) {
            return NextResponse.json(
                { message: 'No tienes permiso para cancelar esta reserva' },
                { status: 403 }
            );
        }

        // Verificar que esté activa
        if (reservation.status !== 'ACTIVE') {
            return NextResponse.json(
                { message: 'La reserva ya fue cancelada o finalizada' },
                { status: 400 }
            );
        }

        // Calcular horas hasta la clase
        const hoursUntilClass = getHoursDifference(new Date(), reservation.class.startTime);
        const refundCredit = hoursUntilClass >= CANCELLATION_HOURS;

        // Cancelar reserva en transacción
        await prisma.$transaction(async (tx) => {
            // Actualizar reserva
            await tx.reservation.update({
                where: { id: reservationId },
                data: {
                    status: 'CANCELLED',
                    cancelledAt: new Date(),
                },
            });

            // Reembolsar crédito si cancela con tiempo
            if (refundCredit && !reservation.membership.isUnlimited) {
                await tx.membership.update({
                    where: { id: reservation.membershipId },
                    data: {
                        remainingCredits: {
                            increment: 1,
                        },
                    },
                });
            }
        });

        // Obtener créditos actualizados
        const updatedMembership = await prisma.membership.findUnique({
            where: { id: reservation.membershipId! },
        });

        if (refundCredit) {
            return NextResponse.json({
                status: 'success',
                message: 'Reserva cancelada. Crédito reembolsado.',
                remaining_credits: updatedMembership?.remainingCredits || 0,
            });
        } else {
            return NextResponse.json({
                status: 'warning',
                message: `Cancelada fuera de término (menos de ${CANCELLATION_HOURS}hs). Crédito NO reembolsado.`,
                remaining_credits: updatedMembership?.remainingCredits || 0,
            });
        }

    } catch (error) {
        console.error('Cancel reservation error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// Exportar ambos métodos HTTP
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return handleCancelReservation(request, params);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return handleCancelReservation(request, params);
}
