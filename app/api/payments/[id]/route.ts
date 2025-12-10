import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { addDays } from 'date-fns';

// GET /api/payments/[id] - Obtener un pago específico
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const paymentId = parseInt(id);

        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                plan: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        credits: true,
                        isUnlimited: true,
                        durationDays: true,
                        discipline: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!payment) {
            return NextResponse.json(
                { message: 'Pago no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json(payment);
    } catch (error) {
        console.error('Get payment error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// PUT /api/payments/[id] - Aprobar o rechazar un pago
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader, request);

        if (!authUser || (authUser.rol !== 'ADMIN' && authUser.rol !== 'STAFF')) {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 403 }
            );
        }

        const { id } = await params;
        const paymentId = parseInt(id);
        const body = await request.json();
        const { action, notes } = body; // action: 'approve' | 'reject'

        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                plan: {
                    include: {
                        discipline: true,
                    },
                },
                user: true,
            },
        });

        if (!payment) {
            return NextResponse.json(
                { message: 'Pago no encontrado' },
                { status: 404 }
            );
        }

        if (payment.status !== 'PENDING') {
            return NextResponse.json(
                { message: 'Este pago ya fue procesado' },
                { status: 400 }
            );
        }

        if (action === 'approve') {
            // Aprobar pago y crear membresía
            const membershipStartDate = new Date();
            const expirationDate = addDays(membershipStartDate, payment.plan.durationDays);

            // Verificar si ya tiene membresía activa para esta disciplina
            const existingMembership = await prisma.membership.findFirst({
                where: {
                    userId: payment.userId,
                    disciplineId: payment.plan.disciplineId,
                    status: 'ACTIVE',
                    expirationDate: { gte: new Date() },
                },
            });

            await prisma.$transaction(async (tx) => {
                // Actualizar pago
                await tx.payment.update({
                    where: { id: paymentId },
                    data: {
                        status: 'APPROVED',
                        approvedBy: authUser.userId,
                        approvedAt: new Date(),
                        notes: notes || payment.notes,
                    },
                });

                if (existingMembership) {
                    // Extender membresía existente
                    await tx.membership.update({
                        where: { id: existingMembership.id },
                        data: {
                            expirationDate: addDays(existingMembership.expirationDate, payment.plan.durationDays),
                            remainingCredits: existingMembership.isUnlimited
                                ? 0
                                : existingMembership.remainingCredits + payment.plan.credits,
                        },
                    });
                } else {
                    // Crear nueva membresía
                    await tx.membership.create({
                        data: {
                            userId: payment.userId,
                            planId: payment.planId,
                            disciplineId: payment.plan.disciplineId,
                            totalCredits: payment.plan.credits,
                            remainingCredits: payment.plan.credits,
                            isUnlimited: payment.plan.isUnlimited,
                            startDate: membershipStartDate,
                            expirationDate,
                            status: 'ACTIVE',
                        },
                    });
                }
            });

            return NextResponse.json({
                message: `Pago aprobado. ${existingMembership ? 'Membresía extendida' : 'Membresía creada'} para ${payment.user.name}`,
            });
        } else if (action === 'reject') {
            await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'REJECTED',
                    rejectedAt: new Date(),
                    notes: notes || payment.notes,
                },
            });

            return NextResponse.json({
                message: 'Pago rechazado',
            });
        } else {
            return NextResponse.json(
                { message: 'Acción inválida. Use "approve" o "reject"' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Update payment error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// DELETE /api/payments/[id] - Eliminar un pago (solo pendientes)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = request.headers.get('authorization');
        const authUser = await authenticateRequest(authHeader, request);

        if (!authUser || authUser.rol !== 'ADMIN') {
            return NextResponse.json(
                { message: 'No autorizado' },
                { status: 403 }
            );
        }

        const { id } = await params;
        const paymentId = parseInt(id);

        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
        });

        if (!payment) {
            return NextResponse.json(
                { message: 'Pago no encontrado' },
                { status: 404 }
            );
        }

        if (payment.status !== 'PENDING') {
            return NextResponse.json(
                { message: 'Solo se pueden eliminar pagos pendientes' },
                { status: 400 }
            );
        }

        await prisma.payment.delete({
            where: { id: paymentId },
        });

        return NextResponse.json({
            message: 'Pago eliminado',
        });
    } catch (error) {
        console.error('Delete payment error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
